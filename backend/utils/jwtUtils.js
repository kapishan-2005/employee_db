/**
 * JWT Utilities
 * 
 * Handles JSON Web Token generation and verification.
 * 
 * Security:
 * - Tokens are signed with a secret key
 * - Tokens have expiration time (7 days default)
 * - Tokens contain minimal user info (id, username, role)
 * - Sensitive data (password) is never included in tokens
 */

import jwt from 'jsonwebtoken';

// Get JWT secret from environment variables
// In production, this should be a strong, random secret
const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_this_in_production';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d'; // 7 days default

/**
 * Generate a JWT token for a user
 * @param {Object} user - User object
 * @param {number} user.id - User ID
 * @param {string} user.username - Username
 * @param {string} user.role - User role (admin, manager, employee)
 * @returns {string} JWT token
 * @throws {Error} If token generation fails
 */
export const generateToken = (user) => {
  try {
    if (!user || !user.id) {
      throw new Error('User object with id is required');
    }

    // Create token payload (do NOT include sensitive data like password)
    const payload = {
      id: user.id,
      username: user.username,
      role: user.role || 'employee',
      email: user.email
    };

    // Sign and return token
    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRE
    });

    return token;
  } catch (error) {
    throw new Error(`Error generating token: ${error.message}`);
  }
};

/**
 * Verify a JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
export const verifyToken = (token) => {
  try {
    if (!token) {
      throw new Error('Token is required');
    }

    // Verify and decode token
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    // Handle specific JWT errors
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token has expired');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    }
    throw new Error(`Error verifying token: ${error.message}`);
  }
};

/**
 * Decode a JWT token without verifying (useful for debugging)
 * WARNING: Do not use for authentication - use verifyToken instead
 * @param {string} token - JWT token to decode
 * @returns {Object|null} Decoded token payload or null if invalid
 */
export const decodeToken = (token) => {
  try {
    if (!token) {
      return null;
    }
    return jwt.decode(token);
  } catch (error) {
    return null;
  }
};

/**
 * Extract token from Authorization header
 * @param {string} authHeader - Authorization header value
 * @returns {string|null} Token or null if not found
 */
export const extractTokenFromHeader = (authHeader) => {
  if (!authHeader) {
    return null;
  }

  // Expected format: "Bearer <token>"
  const parts = authHeader.split(' ');
  
  if (parts.length === 2 && parts[0] === 'Bearer') {
    return parts[1];
  }

  return null;
};
