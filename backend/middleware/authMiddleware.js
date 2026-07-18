/**
 * Authentication Middleware
 * 
 * Verifies JWT tokens and attaches user info to request object.
 * 
 * Usage:
 * - Add to routes that require authentication
 * - User info will be available in req.user
 * 
 * Example:
 * router.get('/protected', authMiddleware, (req, res) => {
 *   console.log(req.user); // { id, username, role, email }
 * });
 */

import { verifyToken, extractTokenFromHeader } from '../utils/jwtUtils.js';

/**
 * Verify JWT token and attach user to request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const authMiddleware = async (req, res, next) => {
  try {
    // Get Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ 
        error: 'No authorization token provided' 
      });
    }

    // Extract token from "Bearer <token>" format
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return res.status(401).json({ 
        error: 'Invalid authorization header format. Use: Bearer <token>' 
      });
    }

    // Verify token
    const decoded = verifyToken(token);

    // Attach user info to request object
    req.user = {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role,
      email: decoded.email,
      organization_id: decoded.organization_id,
      employee_id: decoded.employee_id
    };

    // Continue to next middleware/route handler
    next();
  } catch (error) {
    // Handle token verification errors
    if (error.message.includes('expired')) {
      return res.status(401).json({ 
        error: 'Token has expired. Please login again.' 
      });
    }
    
    if (error.message.includes('invalid')) {
      return res.status(401).json({ 
        error: 'Invalid token. Please login again.' 
      });
    }

    return res.status(401).json({ 
      error: error.message || 'Authentication failed' 
    });
  }
};

/**
 * Optional authentication middleware
 * Attaches user if token is valid, but doesn't fail if token is missing
 * Useful for routes that work differently for authenticated vs non-authenticated users
 */
export const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      // No token provided, continue without user
      req.user = null;
      return next();
    }

    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      req.user = null;
      return next();
    }

    // Try to verify token
    const decoded = verifyToken(token);
    req.user = {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role,
      email: decoded.email,
      organization_id: decoded.organization_id,
      employee_id: decoded.employee_id
    };

    next();
  } catch (error) {
    // Token is invalid, but we don't fail - just continue without user
    req.user = null;
    next();
  }
};

export default authMiddleware;
