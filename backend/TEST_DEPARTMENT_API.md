# Department API Testing Guide

## Setup

1. Start the backend server:
```bash
cd backend
npm start
```

2. Get JWT tokens for different user roles:
   - CEO token
   - HR token  
   - Manager token
   - Employee token

## Test Cases

### 1. CEO Tests

#### List all departments
```bash
curl -X GET http://localhost:5000/api/departments \
  -H "Authorization: Bearer <CEO_TOKEN>"
```

#### Create a department (without manager)
```bash
curl -X POST http://localhost:5000/api/departments \
  -H "Authorization: Bearer <CEO_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Engineering",
    "description": "Software development and technology team",
    "is_active": true
  }'
```

#### Create a department (with manager)
```bash
curl -X POST http://localhost:5000/api/departments \
  -H "Authorization: Bearer <CEO_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Human Resources",
    "description": "HR team",
    "manager_id": 5,
    "is_active": true
  }'
```

#### Get department by ID
```bash
curl -X GET http://localhost:5000/api/departments/1 \
  -H "Authorization: Bearer <CEO_TOKEN>"
```

#### Update department
```bash
curl -X PUT http://localhost:5000/api/departments/1 \
  -H "Authorization: Bearer <CEO_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Engineering & Technology",
    "description": "Updated description"
  }'
```

#### Assign manager to department
```bash
curl -X PATCH http://localhost:5000/api/departments/1/manager \
  -H "Authorization: Bearer <CEO_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "manager_id": 7
  }'
```

#### Remove manager from department
```bash
curl -X PATCH http://localhost:5000/api/departments/1/manager \
  -H "Authorization: Bearer <CEO_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "manager_id": null
  }'
```

#### Deactivate department
```bash
curl -X PATCH http://localhost:5000/api/departments/1/status \
  -H "Authorization: Bearer <CEO_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "is_active": false
  }'
```

#### Activate department
```bash
curl -X PATCH http://localhost:5000/api/departments/1/status \
  -H "Authorization: Bearer <CEO_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "is_active": true
  }'
```

#### Get department employees
```bash
curl -X GET http://localhost:5000/api/departments/1/employees \
  -H "Authorization: Bearer <CEO_TOKEN>"
```

#### Get department statistics
```bash
curl -X GET http://localhost:5000/api/departments/1/stats \
  -H "Authorization: Bearer <CEO_TOKEN>"
```

#### Delete department (empty)
```bash
curl -X DELETE http://localhost:5000/api/departments/1 \
  -H "Authorization: Bearer <CEO_TOKEN>"
```

#### Delete department (with employees - should fail)
```bash
curl -X DELETE http://localhost:5000/api/departments/2 \
  -H "Authorization: Bearer <CEO_TOKEN>"
```

Expected response:
```json
{
  "success": false,
  "error": "Cannot delete department with 5 assigned employee(s). Please reassign employees first.",
  "employee_count": 5
}
```

---

### 2. HR Tests

#### List all departments
```bash
curl -X GET http://localhost:5000/api/departments \
  -H "Authorization: Bearer <HR_TOKEN>"
```

#### Create a department
```bash
curl -X POST http://localhost:5000/api/departments \
  -H "Authorization: Bearer <HR_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Marketing",
    "description": "Marketing and communications team"
  }'
```

#### Update department
```bash
curl -X PUT http://localhost:5000/api/departments/3 \
  -H "Authorization: Bearer <HR_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Updated by HR"
  }'
```

#### View department statistics
```bash
curl -X GET http://localhost:5000/api/departments/3/stats \
  -H "Authorization: Bearer <HR_TOKEN>"
```

#### Attempt to assign manager (should fail - 403)
```bash
curl -X PATCH http://localhost:5000/api/departments/3/manager \
  -H "Authorization: Bearer <HR_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "manager_id": 7
  }'
```

Expected response:
```json
{
  "error": "Access denied. Required role: ceo"
}
```

#### Attempt to toggle status (should fail - 403)
```bash
curl -X PATCH http://localhost:5000/api/departments/3/status \
  -H "Authorization: Bearer <HR_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "is_active": false
  }'
```

#### Attempt to delete (should fail - 403)
```bash
curl -X DELETE http://localhost:5000/api/departments/3 \
  -H "Authorization: Bearer <HR_TOKEN>"
```

---

### 3. Manager Tests

#### List departments (should only see assigned department)
```bash
curl -X GET http://localhost:5000/api/departments \
  -H "Authorization: Bearer <MANAGER_TOKEN>"
```

Expected: Only departments where manager_id matches the manager's user ID

#### View their assigned department
```bash
curl -X GET http://localhost:5000/api/departments/2 \
  -H "Authorization: Bearer <MANAGER_TOKEN>"
```

#### View employees in their department
```bash
curl -X GET http://localhost:5000/api/departments/2/employees \
  -H "Authorization: Bearer <MANAGER_TOKEN>"
```

#### Attempt to view other department (should fail - 403)
```bash
curl -X GET http://localhost:5000/api/departments/1 \
  -H "Authorization: Bearer <MANAGER_TOKEN>"
```

Expected response:
```json
{
  "success": false,
  "error": "Access denied. You can only view your assigned department."
}
```

#### Attempt to create department (should fail - 403)
```bash
curl -X POST http://localhost:5000/api/departments \
  -H "Authorization: Bearer <MANAGER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Department"
  }'
```

#### Attempt to update department (should fail - 403)
```bash
curl -X PUT http://localhost:5000/api/departments/2 \
  -H "Authorization: Bearer <MANAGER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Trying to update"
  }'
```

---

### 4. Employee Tests

#### List departments (should only see own department)
```bash
curl -X GET http://localhost:5000/api/departments \
  -H "Authorization: Bearer <EMPLOYEE_TOKEN>"
```

Expected: Only the department the employee belongs to

#### View own department
```bash
curl -X GET http://localhost:5000/api/departments/2 \
  -H "Authorization: Bearer <EMPLOYEE_TOKEN>"
```

#### View employees in own department
```bash
curl -X GET http://localhost:5000/api/departments/2/employees \
  -H "Authorization: Bearer <EMPLOYEE_TOKEN>"
```

#### Attempt to view other department (should fail - 403)
```bash
curl -X GET http://localhost:5000/api/departments/1 \
  -H "Authorization: Bearer <EMPLOYEE_TOKEN>"
```

#### Attempt to create department (should fail - 403)
```bash
curl -X POST http://localhost:5000/api/departments \
  -H "Authorization: Bearer <EMPLOYEE_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Department"
  }'
```

---

### 5. Validation Tests

#### Create department without name (should fail - 400)
```bash
curl -X POST http://localhost:5000/api/departments \
  -H "Authorization: Bearer <CEO_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "No name provided"
  }'
```

Expected response:
```json
{
  "success": false,
  "error": "Department name is required"
}
```

#### Create department with duplicate name (should fail - 409)
```bash
curl -X POST http://localhost:5000/api/departments \
  -H "Authorization: Bearer <CEO_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Engineering"
  }'
```

Expected response:
```json
{
  "success": false,
  "error": "Department with this name already exists"
}
```

#### Assign non-manager as department manager (should fail - 400)
```bash
curl -X PATCH http://localhost:5000/api/departments/1/manager \
  -H "Authorization: Bearer <CEO_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "manager_id": 10
  }'
```

Expected response (if user 10 has 'employee' role):
```json
{
  "success": false,
  "error": "User must have 'manager' role to be assigned as department manager"
}
```

#### Assign manager from different organization (should fail - 400)
```bash
curl -X PATCH http://localhost:5000/api/departments/1/manager \
  -H "Authorization: Bearer <CEO_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "manager_id": 99
  }'
```

Expected response:
```json
{
  "success": false,
  "error": "Manager must belong to the same organization"
}
```

---

### 6. Multi-Tenancy Tests

#### User from Org A tries to access department from Org B
1. Login as CEO from Organization A
2. Try to access department from Organization B:

```bash
curl -X GET http://localhost:5000/api/departments/99 \
  -H "Authorization: Bearer <ORG_A_CEO_TOKEN>"
```

Expected response:
```json
{
  "success": false,
  "error": "Department not found"
}
```

#### Filter tests
```bash
# Get only active departments
curl -X GET "http://localhost:5000/api/departments?is_active=true" \
  -H "Authorization: Bearer <CEO_TOKEN>"

# Get only inactive departments
curl -X GET "http://localhost:5000/api/departments?is_active=false" \
  -H "Authorization: Bearer <CEO_TOKEN>"
```

---

## Expected Status Codes Summary

| Scenario | Status Code | Response |
|----------|-------------|----------|
| Success (GET) | 200 | JSON with data |
| Success (POST) | 201 | JSON with created data |
| Success (PUT/PATCH/DELETE) | 200 | JSON with message |
| Missing required field | 400 | Error message |
| Invalid input format | 400 | Error message |
| Duplicate name | 409 | Error message |
| No auth token | 401 | Error message |
| Invalid/expired token | 401 | Error message |
| Insufficient permissions | 403 | Error message |
| Resource not found | 404 | Error message |
| Server error | 500 | Error message |

---

## Postman Collection

You can import this collection into Postman for easier testing:

1. Create a new collection called "Department Management"
2. Set up environment variables:
   - `BASE_URL`: http://localhost:5000
   - `CEO_TOKEN`: <your_ceo_jwt_token>
   - `HR_TOKEN`: <your_hr_jwt_token>
   - `MANAGER_TOKEN`: <your_manager_jwt_token>
   - `EMPLOYEE_TOKEN`: <your_employee_jwt_token>
3. Use `{{BASE_URL}}` and `{{CEO_TOKEN}}` in requests
4. Add all the above test cases as separate requests

---

## Automated Testing Script

Create a test script to run all tests:

```javascript
// test-departments.js
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
const CEO_TOKEN = 'your_ceo_token_here';
const HR_TOKEN = 'your_hr_token_here';

async function testDepartments() {
  console.log('🧪 Testing Department API...\n');

  // Test 1: CEO lists departments
  console.log('Test 1: CEO lists all departments');
  try {
    const res = await axios.get(`${BASE_URL}/departments`, {
      headers: { Authorization: `Bearer ${CEO_TOKEN}` }
    });
    console.log('✅ PASS:', res.data);
  } catch (err) {
    console.log('❌ FAIL:', err.response?.data || err.message);
  }

  // Test 2: CEO creates department
  console.log('\nTest 2: CEO creates department');
  try {
    const res = await axios.post(`${BASE_URL}/departments`, {
      name: 'Test Department',
      description: 'Test description'
    }, {
      headers: { Authorization: `Bearer ${CEO_TOKEN}` }
    });
    console.log('✅ PASS:', res.data);
  } catch (err) {
    console.log('❌ FAIL:', err.response?.data || err.message);
  }

  // Add more tests...
}

testDepartments();
```

---

## Notes

- Replace `<CEO_TOKEN>`, `<HR_TOKEN>`, etc. with actual JWT tokens
- Ensure backend server is running on port 5000 (or update BASE_URL)
- Some tests require existing data (departments, employees, managers)
- Create test data before running tests if needed
