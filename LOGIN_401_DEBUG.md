# Login 401 Error - Debug and Fix

**Date**: January 2024  
**Status**: 🔍 **DEBUGGING ADDED**  
**Issue**: Manager user "Ronishan" returns 401 on login despite correct database state

---

## 🐛 Problem Description

**Observed**: Manager user "Ronishan" gets 401 Unauthorized error on login.

**Database Verification** (Confirmed Correct):
```sql
SELECT * FROM users WHERE username = 'Ronishan';

-- Results:
role = manager              ✅
status = active             ✅
is_active = 1               ✅
organization_id = 3         ✅
employee_id = 5             ✅
password_hash = $2b$10$...  ✅ (bcrypt format correct)
```

**Database is correct**, so the issue is in the login comparison logic.

---

## 🔍 Investigation Steps

### Step 1: Check Login Flow

The login process:
```
POST /api/auth/login
  ↓
authController.login()
  ↓
User.findByEmailWithPassword(email)
  ↓
comparePassword(password, user.password_hash)
  ↓
If match: Generate JWT token
If no match: Return 401
```

### Step 2: Added Debug Logging

To identify where the login fails, added comprehensive logging:

**1. Login Controller** (`authController.js`):
```javascript
console.log('🔐 Login attempt:', { email, hasPassword: !!password });
console.log('✅ User found:', { 
  id, username, role, status,
  hasPasswordHash: !!user.password_hash,
  passwordHashLength: user.password_hash?.length,
  passwordHashPrefix: user.password_hash?.substring(0, 7)
});
console.log('🔑 Comparing password...');
console.log('Password comparison result:', isPasswordValid);
```

**2. User Model** (`userModel.js`):
```javascript
console.log('📧 User query result:', {
  id, email, role, status, is_active,
  hasPasswordHash: !!rows[0].password_hash
});
```

**3. Password Utils** (`passwordUtils.js`):
```javascript
console.log('🔐 comparePassword called:', {
  passwordLength: password?.length,
  hashLength: hash?.length,
  hashPrefix: hash?.substring(0, 7)
});
console.log('🔑 bcrypt.compare result:', isMatch);
```

### Step 3: Fixed Case Sensitivity

Changed email lookup to be case-insensitive:

**BEFORE**:
```javascript
SELECT * FROM users WHERE email = ?
```

**AFTER**:
```javascript
SELECT * FROM users WHERE LOWER(email) = LOWER(?)
```

This ensures emails like "Test@Email.com" match "test@email.com".

---

## 🔧 Changes Made

### File 1: `backend/controllers/authController.js`

**Added**:
- Login attempt logging
- User found confirmation logging
- Password comparison logging
- Status check logging
- Success/failure logging

**Purpose**: Track exactly where login succeeds or fails.

### File 2: `backend/models/userModel.js`

**Changed**:
- Email query to use `LOWER(email) = LOWER(?)`
- Added user query result logging

**Purpose**: Ensure case-insensitive email lookup and verify user data.

### File 3: `backend/utils/passwordUtils.js`

**Added**:
- comparePassword parameter logging
- bcrypt.compare result logging
- Error logging

**Purpose**: Verify password and hash are passed correctly and see bcrypt result.

---

## 🧪 Testing Instructions

### Step 1: Restart Backend

```bash
cd backend
npm start
```

### Step 2: Attempt Login

```bash
# Try to login as Ronishan
# Watch backend console logs
```

### Step 3: Check Console Output

**If user not found**:
```
🔐 Login attempt: { email: '...', hasPassword: true }
❌ User not found: ...
```
→ **Issue**: Email doesn't match database (case sensitivity?)

**If user found but status issue**:
```
✅ User found: { id: X, username: 'Ronishan', role: 'manager', status: '...' }
❌ User inactive: X
```
→ **Issue**: User status is not 'active'

**If password comparison fails**:
```
✅ User found: { ... }
🔑 Comparing password...
🔐 comparePassword called: { passwordLength: 8, hashLength: 60, hashPrefix: '$2b$10$' }
🔑 bcrypt.compare result: false
❌ Invalid password for user: X
```
→ **Issue**: Password doesn't match hash (wrong password entered)

**If successful**:
```
✅ User found: { ... }
🔑 Comparing password...
🔐 comparePassword called: { ... }
🔑 bcrypt.compare result: true
✅ Login successful for user: X
```
→ **Success**: Login worked!

---

## 🎯 Expected Logs for Successful Login

```
🔐 Login attempt: { email: 'ronishan@test.com', hasPassword: true }

📧 User query result: {
  id: 10,
  email: 'ronishan@test.com',
  role: 'manager',
  status: 'active',
  is_active: 1,
  hasPasswordHash: true
}

✅ User found: {
  id: 10,
  username: 'Ronishan',
  role: 'manager',
  status: 'active',
  hasPasswordHash: true,
  passwordHashLength: 60,
  passwordHashPrefix: '$2b$10$'
}

🔑 Comparing password...

🔐 comparePassword called: {
  passwordLength: 8,
  hashLength: 60,
  hashPrefix: '$2b$10$'
}

🔑 bcrypt.compare result: true

✅ Login successful for user: 10
```

---

## 🐛 Common Issues & Solutions

### Issue 1: User Not Found

**Symptom**: `❌ User not found: email@test.com`

**Possible Causes**:
1. Email doesn't exist in database
2. Email has different capitalization
3. Extra spaces in email

**Solution**:
```sql
-- Check exact email in database
SELECT id, username, email FROM users WHERE username = 'Ronishan';

-- Check with case-insensitive match
SELECT id, username, email FROM users WHERE LOWER(email) = LOWER('ronishan@test.com');
```

### Issue 2: User Status Not Active

**Symptom**: `❌ User inactive: 10` or `❌ User pending: 10`

**Solution**:
```sql
-- Check and update user status
SELECT id, username, status, is_active FROM users WHERE username = 'Ronishan';

-- Fix if needed
UPDATE users SET status = 'active', is_active = 1 WHERE username = 'Ronishan';
```

### Issue 3: Password Comparison Fails

**Symptom**: `🔑 bcrypt.compare result: false`

**Possible Causes**:
1. Wrong password entered
2. Password hash corrupted
3. Password hash not in bcrypt format

**Solution**:
```javascript
// Test password hashing (in Node REPL or test file)
import bcrypt from 'bcrypt';

// Hash a new password
const newHash = await bcrypt.hash('TestPassword123', 10);
console.log('New hash:', newHash);

// Update user with new hash
UPDATE users 
SET password_hash = '<new_hash_here>' 
WHERE username = 'Ronishan';
```

### Issue 4: Password Hash Missing

**Symptom**: `hasPasswordHash: false` or `hashLength: undefined`

**Solution**:
```sql
-- Check if password_hash exists
SELECT 
  id, 
  username, 
  password_hash IS NULL as missing_password,
  LENGTH(password_hash) as hash_length
FROM users 
WHERE username = 'Ronishan';

-- If missing, user needs to set password
```

---

## 🔧 Manual Password Reset (If Needed)

If password comparison consistently fails, reset the password:

### Step 1: Generate New Hash

```javascript
// Run in Node.js REPL or create test file
const bcrypt = require('bcrypt');

(async () => {
  const password = 'NewPassword123';
  const hash = await bcrypt.hash(password, 10);
  console.log('Hash:', hash);
  console.log('SQL:', `UPDATE users SET password_hash = '${hash}' WHERE username = 'Ronishan';`);
})();
```

### Step 2: Update Database

```sql
UPDATE users 
SET password_hash = '<hash_from_step_1>' 
WHERE username = 'Ronishan';
```

### Step 3: Test Login

Try logging in with the new password.

---

## 📝 Debugging Checklist

When user gets 401 error:

- [ ] Check backend console logs
- [ ] Verify "🔐 Login attempt" log appears
- [ ] Verify "✅ User found" or "❌ User not found"
- [ ] Check user status (active/inactive/pending/suspended)
- [ ] Verify password hash exists and has correct length (60 chars)
- [ ] Verify password hash starts with "$2b$10$"
- [ ] Check "🔑 bcrypt.compare result" (true/false)
- [ ] If all pass but still fails, check JWT token generation
- [ ] Check if any middleware is blocking the request

---

## 🧹 Remove Debug Logs (Production)

After identifying and fixing the issue, remove or comment out debug logs:

**Option 1: Comment Out**
```javascript
// console.log('🔐 Login attempt:', ...);
```

**Option 2: Use Environment Variable**
```javascript
if (process.env.DEBUG_LOGIN === 'true') {
  console.log('🔐 Login attempt:', ...);
}
```

**Option 3: Use Debug Library**
```javascript
import debug from 'debug';
const log = debug('app:auth');
log('Login attempt:', ...);
```

---

## ✅ Resolution Steps

1. **Restart backend** with debug logging
2. **Attempt login** as Ronishan
3. **Check console logs** to see where it fails
4. **Apply fix** based on logs:
   - User not found → Fix email/case sensitivity
   - Status issue → Update user status
   - Password mismatch → Reset password
5. **Verify fix** by testing login again
6. **Remove debug logs** (or keep for future debugging)

---

## 📊 Files Modified

1. ✅ `backend/controllers/authController.js` - Added debug logging
2. ✅ `backend/models/userModel.js` - Case-insensitive email, added logging
3. ✅ `backend/utils/passwordUtils.js` - Added comparison logging

---

**Status**: 🔍 **DEBUGGING ENABLED**

**Next Step**: 
1. Restart backend
2. Try login as Ronishan
3. Check backend console for detailed logs
4. Identify exact failure point
5. Apply appropriate fix

**After Fix**:
- Test login works
- Remove debug logs
- Document the root cause

