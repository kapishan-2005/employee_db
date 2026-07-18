/**
 * Password Utilities
 * 
 * Handles password hashing and comparison using bcrypt.
 * 
 * Security:
 * - Uses bcrypt with salt rounds of 10 (industry standard)
 * - Passwords are never stored in plain text
 * - Hashing is one-way (cannot be reversed)
 * - Comparison is done securely using bcrypt.compare()
 */

import bcrypt from 'bcrypt';

// Salt rounds for bcrypt (10 is a good balance between security and performance)
const SALT_ROUNDS = 10;

/**
 * Hash a plain text password
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 * @throws {Error} If password is empty or hashing fails
 */
export const hashPassword = async (password) => {
  try {
    if (!password || password.trim() === '') {
      throw new Error('Password cannot be empty');
    }

    // Generate salt and hash password
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    return hash;
  } catch (error) {
    throw new Error(`Error hashing password: ${error.message}`);
  }
};

/**
 * Compare a plain text password with a hashed password
 * @param {string} password - Plain text password to check
 * @param {string} hash - Hashed password from database
 * @returns {Promise<boolean>} True if passwords match, false otherwise
 * @throws {Error} If comparison fails
 */
export const comparePassword = async (password, hash) => {
  try {
    console.log('🔐 comparePassword called:', {
      passwordLength: password?.length,
      hashLength: hash?.length,
      hashPrefix: hash?.substring(0, 7)
    });
    
    if (!password || !hash) {
      console.log('❌ Missing password or hash');
      return false;
    }

    // Compare password with hash
    const isMatch = await bcrypt.compare(password, hash);
    console.log('🔑 bcrypt.compare result:', isMatch);
    return isMatch;
  } catch (error) {
    console.error('❌ Error in comparePassword:', error);
    throw new Error(`Error comparing password: ${error.message}`);
  }
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} { valid: boolean, message: string }
 */
export const validatePasswordStrength = (password) => {
  if (!password) {
    return { valid: false, message: 'Password is required' };
  }

  if (password.length < 6) {
    return { valid: false, message: 'Password must be at least 6 characters long' };
  }

  // Optional: Add more strength requirements
  // - At least one uppercase letter
  // - At least one lowercase letter
  // - At least one number
  // - At least one special character

  return { valid: true, message: 'Password is valid' };
};
