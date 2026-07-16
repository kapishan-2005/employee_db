/**
 * Authentication Controller
 * 
 * Handles user authentication operations:
 * - User registration
 * - User login
 * - Get current user info
 * 
 * Security:
 * - Passwords are hashed before storage
 * - JWT tokens are generated on successful login
 * - Tokens contain minimal user info (no sensitive data)
 */

import User from '../models/userModel.js';
import Organization from '../models/organizationModel.js';
import { hashPassword, comparePassword, validatePasswordStrength } from '../utils/passwordUtils.js';
import { generateToken } from '../utils/jwtUtils.js';

/**
 * Sign up a brand-new company (always allowed, no auth required)
 * POST /api/auth/signup-company
 *
 * Unlike /register (which only lets an existing CEO/Admin create sub-accounts
 * inside their own company), this endpoint always creates a fresh
 * organization + a CEO account for it. Any number of independent companies
 * can be created this way — each is fully isolated from every other.
 *
 * Body:
 * - username (required)
 * - email (required)
 * - password (required)
 */
export const registerCompany = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        error: 'Username, email, and password are required'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({ error: passwordValidation.message });
    }

    const existingUsername = await User.findByUsername(username);
    if (existingUsername) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    const existingEmail = await User.findByEmail(email);
    if (existingEmail) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    const password_hash = await hashPassword(password);

    // Create a brand-new, isolated organization for this CEO
    const org = await Organization.create({ name: `${username}'s Company` });

    const user = await User.create({
      username,
      email,
      password_hash,
      role: 'ceo',
      organization_id: org.id,
      employee_id: null
    });

    const { pool } = await import('../config/db.js');
    await pool.execute('UPDATE organizations SET created_by = ? WHERE id = ?', [user.id, org.id]);

    const token = generateToken(user);

    res.status(201).json({
      message: 'Company and CEO account created successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        organization_id: user.organization_id,
        employee_id: user.employee_id
      },
      token
    });
  } catch (error) {
    console.error('Register company error:', error);
    res.status(500).json({
      error: error.message || 'Error creating company account'
    });
  }
};

/**
 * Register a new sub-account (HR/Admin, Manager, or Employee) inside the
 * caller's existing company.
 * POST /api/auth/register
 *
 * Security model: always requires a valid CEO or Admin JWT token. CEOs can
 * create any role (including another CEO); Admins cannot create a CEO.
 * To create a brand-new company, use POST /api/auth/signup-company instead.
 *
 * Body:
 * - username (required)
 * - email (required)
 * - password (required)
 * - role (optional, default: 'employee')
 * - employee_id (optional)
 */
export const register = async (req, res) => {
  try {
    const { username, email, password, role, employee_id } = req.body;

    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({ 
        error: 'Username, email, and password are required' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: 'Invalid email format' 
      });
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({ 
        error: passwordValidation.message 
      });
    }

    // Validate role if provided
    const validRoles = ['ceo', 'admin', 'manager', 'employee'];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({ 
        error: 'Invalid role. Must be ceo, admin, manager, or employee' 
      });
    }

    // ---- Access control: always requires an authenticated CEO/Admin ----
    const creator = req.user;

    if (!creator || (creator.role !== 'ceo' && creator.role !== 'admin')) {
      return res.status(403).json({
        error: 'Only a CEO or Admin can create new accounts. Please sign in first.',
      });
    }

    const finalRole = role || 'employee';

    // Admins cannot mint another CEO account
    if (finalRole === 'ceo' && creator.role !== 'ceo') {
      return res.status(403).json({
        error: 'Only a CEO can create another CEO account',
      });
    }

    // Every sub-account belongs to the creator's organization — this is what
    // keeps each company's data isolated.
    const organization_id = creator.organization_id;

    // Check if username already exists
    const existingUsername = await User.findByUsername(username);
    if (existingUsername) {
      return res.status(409).json({ 
        error: 'Username already exists' 
      });
    }

    // Check if email already exists
    const existingEmail = await User.findByEmail(email);
    if (existingEmail) {
      return res.status(409).json({ 
        error: 'Email already exists' 
      });
    }

    // Hash password
    const password_hash = await hashPassword(password);

    const user = await User.create({
      username,
      email,
      password_hash,
      role: finalRole,
      organization_id,
      employee_id: employee_id || null
    });

    // Generate JWT token (unused by the caller, but returned for consistency)
    const token = generateToken(user);

    // Return user info (without password) and token
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        organization_id: user.organization_id,
        employee_id: user.employee_id
      },
      token
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ 
      error: error.message || 'Error registering user' 
    });
  }
};

/**
 * Login user
 * POST /api/auth/login
 * 
 * Body:
 * - username (required)
 * - password (required)
 */
export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate required fields
    if (!username || !password) {
      return res.status(400).json({ 
        error: 'Username and password are required' 
      });
    }

    // Find user by username OR email (accepts either for convenience)
    let user = await User.findByUsername(username);
    if (!user) {
      user = await User.findByEmailWithPassword(username);
    }
    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid username or password' 
      });
    }

    // Check if user is active
    if (!user.is_active) {
      return res.status(403).json({ 
        error: 'Account is inactive. Please contact administrator.' 
      });
    }

    // Compare password with hash
    const isPasswordValid = await comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        error: 'Invalid username or password' 
      });
    }

    // Update last login timestamp
    await User.updateLastLogin(user.id);

    // Generate JWT token
    const token = generateToken(user);

    // Return user info (without password) and token
    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        organization_id: user.organization_id,
        employee_id: user.employee_id,
        is_active: user.is_active
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: error.message || 'Error logging in' 
    });
  }
};

/**
 * Get all users (CEO / Admin only)
 * GET /api/auth/users
 */
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.findByOrganization(req.user.organization_id);
    res.json({ users });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ 
      error: error.message || 'Error fetching users' 
    });
  }
};

/**
 * Get current user info
 * GET /api/auth/me
 * 
 * Requires authentication (JWT token in Authorization header)
 * User info is attached to req.user by authMiddleware
 */
export const getCurrentUser = async (req, res) => {
  try {
    // req.user is set by authMiddleware
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Not authenticated' 
      });
    }

    // Get full user info from database
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found' 
      });
    }

    // Return user info (without password)
    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        organization_id: user.organization_id,
        employee_id: user.employee_id,
        is_active: user.is_active,
        last_login: user.last_login,
        created_at: user.created_at
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ 
      error: error.message || 'Error fetching user info' 
    });
  }
};

/**
 * Logout user
 * POST /api/auth/logout
 * 
 * Note: With JWT, logout is typically handled client-side by removing the token.
 * This endpoint is provided for consistency and can be extended for token blacklisting.
 */
export const logout = async (req, res) => {
  try {
    // With JWT, logout is handled client-side by removing the token
    // In a more advanced implementation, you could:
    // - Add token to a blacklist (requires Redis or similar)
    // - Track active sessions in database
    // - Implement refresh tokens
    
    res.json({
      message: 'Logout successful. Please remove the token from client storage.'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      error: error.message || 'Error logging out' 
    });
  }
};
