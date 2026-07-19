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
import Invitation from '../models/invitationModel.js';
import { pool } from '../config/db.js';
import { hashPassword, comparePassword, validatePasswordStrength } from '../utils/passwordUtils.js';
import { generateToken } from '../utils/jwtUtils.js';

/**
 * Sign up a brand-new company (Start Free button)
 * POST /api/auth/signup-company
 * 
 * This is the ONLY public registration endpoint.
 * Creates a new company + CEO account.
 * All other users must be invited.
 *
 * Body:
 * - companyName (required) - Company name
 * - fullName (required) - CEO's full name
 * - email (required) - CEO's email
 * - password (required) - CEO's password
 */
export const registerCompany = async (req, res) => {
  try {
    const { companyName, fullName, email, password } = req.body;

    // Validation
    if (!companyName || !fullName || !email || !password) {
      return res.status(400).json({
        error: 'Company name, full name, email, and password are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({ error: passwordValidation.message });
    }

    // Check if email already exists (globally, across all companies)
    const existingEmail = await User.findByEmail(email);
    if (existingEmail) {
      return res.status(409).json({ 
        error: 'This email is already registered. Please use a different email or login.' 
      });
    }

    // Hash password
    const password_hash = await hashPassword(password);

    // Create company (organization)
    const company = await Organization.create({ 
      name: companyName.trim()
    });

    // Generate username from email (before @)
    const username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');

    // Create CEO account
    const user = await User.create({
      username: `${username}_ceo`,
      email,
      password_hash,
      role: 'ceo',
      organization_id: company.id,
      employee_id: null,
      status: 'active',
      invited_by: null,
      invitation_accepted_at: new Date()
    });

    // Update company with CEO info
    const { pool } = await import('../config/db.js');
    await pool.execute(
      'UPDATE organizations SET created_by = ? WHERE id = ?', 
      [user.id, company.id]
    );

    // Generate JWT token
    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: 'Company created successfully! Welcome aboard.',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        fullName: fullName,
        organization_id: user.organization_id,
        companyName: company.name,
        status: 'active'
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
 * Invite a user to join the company
 * POST /api/auth/invite
 * 
 * Role-based invitation workflow:
 * - CEO can invite: HR
 * - HR can invite: Managers
 * - Managers can invite: Employees
 * 
 * Requires authentication
 * 
 * Body:
 * - email (required)
 * - role (required) - 'hr', 'manager', or 'employee'
 * - metadata (optional) - additional data like department_id
 */
export const inviteUser = async (req, res) => {
  try {
    const { email, role, metadata } = req.body;
    const inviter = req.user;

    // Validation
    if (!email || !role) {
      return res.status(400).json({
        error: 'Email and role are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate role
    const validRoles = ['hr', 'manager', 'employee'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        error: 'Invalid role. Must be hr, manager, or employee'
      });
    }

    // Role-based access control for invitations
    const invitationRules = {
      ceo: ['hr'],
      hr: ['manager'],
      manager: ['employee']
    };

    const allowedRoles = invitationRules[inviter.role] || [];

    if (!allowedRoles.includes(role)) {
      return res.status(403).json({
        error: `As a ${inviter.role}, you can only invite: ${allowedRoles.join(', ')}`
      });
    }

    // Check if user with this email already exists in this company
    const existingUser = await User.findByEmail(email);
    if (existingUser && existingUser.organization_id === inviter.organization_id) {
      return res.status(409).json({
        error: 'A user with this email already exists in your company'
      });
    }

    // Check if there's already a pending invitation
    const pendingInvitation = await Invitation.findPendingByEmail(email, inviter.organization_id);
    if (pendingInvitation) {
      return res.status(409).json({
        error: 'An invitation has already been sent to this email'
      });
    }

    // Create invitation
    const invitation = await Invitation.create({
      company_id: inviter.organization_id,
      email,
      role,
      invited_by: inviter.id,
      metadata
    });

    // TODO: Send invitation email (implement email service)
    // For now, return the invitation token in response

    res.status(201).json({
      success: true,
      message: 'Invitation sent successfully',
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        token: invitation.token,
        expires_at: invitation.expires_at,
        // In production, include invitation link instead of token
        invitationLink: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/accept-invitation/${invitation.token}`
      }
    });
  } catch (error) {
    console.error('Invite user error:', error);
    res.status(500).json({
      error: error.message || 'Error sending invitation'
    });
  }
};

/**
 * Verify invitation token
 * GET /api/auth/verify-invitation/:token
 * 
 * Public endpoint to check if invitation is valid
 */
export const verifyInvitation = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    const validation = await Invitation.validateToken(token);

    if (!validation.valid) {
      return res.status(400).json({
        valid: false,
        error: validation.message
      });
    }

    const invitation = validation.invitation;

    res.json({
      valid: true,
      invitation: {
        email: invitation.email,
        role: invitation.role,
        companyName: invitation.company_name,
        invitedBy: invitation.invited_by_name,
        expiresAt: invitation.expires_at
      }
    });
  } catch (error) {
    console.error('Verify invitation error:', error);
    res.status(500).json({
      error: error.message || 'Error verifying invitation'
    });
  }
};

/**
 * Accept invitation and complete registration
 * POST /api/auth/accept-invitation
 * 
 * Public endpoint - no authentication required
 * User sets their password and account is created
 * 
 * Body:
 * - token (required)
 * - fullName (required)
 * - password (required)
 */
export const acceptInvitation = async (req, res) => {
  try {
    const { token, fullName, password } = req.body;

    // Validation
    if (!token || !fullName || !password) {
      return res.status(400).json({
        error: 'Token, full name, and password are required'
      });
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({ error: passwordValidation.message });
    }

    // Validate invitation
    const validation = await Invitation.validateToken(token);

    if (!validation.valid) {
      return res.status(400).json({
        error: validation.message
      });
    }

    const invitation = validation.invitation;

    // Check if email is already registered
    const existingUser = await User.findByEmail(invitation.email);
    if (existingUser) {
      return res.status(409).json({
        error: 'This email is already registered'
      });
    }

    // Hash password
    const password_hash = await hashPassword(password);

    // Generate username from email
    const username = invitation.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    const rolePrefix = invitation.role.toLowerCase();

    // Create user account
    const user = await User.create({
      username: `${username}_${rolePrefix}`,
      email: invitation.email,
      password_hash,
      role: invitation.role,
      organization_id: invitation.company_id,
      employee_id: null,
      status: 'active',
      invited_by: invitation.invited_by,
      invitation_accepted_at: new Date()
    });

    // Mark invitation as accepted
    await Invitation.markAsAccepted(token);

    // Generate JWT token
    const authToken = generateToken(user);

    res.status(201).json({
      success: true,
      message: 'Account created successfully! Welcome aboard.',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        fullName: fullName,
        organization_id: user.organization_id,
        status: 'active'
      },
      token: authToken
    });
  } catch (error) {
    console.error('Accept invitation error:', error);
    res.status(500).json({
      error: error.message || 'Error accepting invitation'
    });
  }
};

/**
 * Get all invitations for the current user's company
 * GET /api/auth/invitations
 * 
 * Requires authentication (CEO, HR, or Manager)
 */
export const getInvitations = async (req, res) => {
  try {
    const { status, role } = req.query;
    const user = req.user;

    const filters = {};
    if (status) filters.status = status;
    if (role) filters.role = role;

    const invitations = await Invitation.findByCompany(user.organization_id, filters);

    res.json({
      success: true,
      invitations
    });
  } catch (error) {
    console.error('Get invitations error:', error);
    res.status(500).json({
      error: error.message || 'Error fetching invitations'
    });
  }
};

/**
 * Cancel an invitation
 * DELETE /api/auth/invitations/:id
 * 
 * Requires authentication
 */
export const cancelInvitation = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    // Get invitation to verify ownership
    const invitation = await Invitation.findById(id);

    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found' });
    }

    // Only the person who sent the invitation or CEO can cancel it
    if (invitation.invited_by !== user.id && user.role !== 'ceo') {
      return res.status(403).json({
        error: 'You can only cancel invitations you sent'
      });
    }

    // Verify same company
    if (invitation.company_id !== user.organization_id) {
      return res.status(403).json({
        error: 'Access denied'
      });
    }

    const cancelled = await Invitation.cancel(id);

    if (!cancelled) {
      return res.status(400).json({
        error: 'Invitation cannot be cancelled (already accepted or expired)'
      });
    }

    res.json({
      success: true,
      message: 'Invitation cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel invitation error:', error);
    res.status(500).json({
      error: error.message || 'Error cancelling invitation'
    });
  }
};

/**
 * Login user (single login for all roles)
 * POST /api/auth/login
 * 
 * Body:
 * - email (required)
 * - password (required)
 * - rememberMe (optional) - extends token expiration
 */
export const login = async (req, res) => {
  try {
    const { email, password, rememberMe = false } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required' 
      });
    }

    console.log('🔐 Login attempt:', { email, hasPassword: !!password });

    // Find user by email first, then fall back to username (some accounts,
    // like CEO/HR/Manager accounts created via Manage Users, are commonly
    // logged into by username)
    let user = await User.findByEmailWithPassword(email);
    if (!user) {
      user = await User.findByUsername(email);
    }
    
    if (!user) {
      console.log('❌ User not found:', email);
      // Record failed login attempt
      await User.recordLogin(null, req.ip, req.get('user-agent'), false);
      
      return res.status(401).json({ 
        error: 'Invalid email or password' 
      });
    }

    console.log('✅ User found:', { 
      id: user.id, 
      username: user.username, 
      role: user.role, 
      status: user.status,
      hasPasswordHash: !!user.password_hash,
      passwordHashLength: user.password_hash?.length,
      passwordHashPrefix: user.password_hash?.substring(0, 7)
    });

    // Check user status
    if (user.status === 'inactive') {
      console.log('❌ User inactive:', user.id);
      return res.status(403).json({ 
        error: 'Your account has been deactivated. Please contact your administrator.' 
      });
    }

    if (user.status === 'suspended') {
      console.log('❌ User suspended:', user.id);
      return res.status(403).json({ 
        error: 'Your account has been suspended. Please contact your administrator.' 
      });
    }

    if (user.status === 'pending') {
      console.log('❌ User pending:', user.id);
      return res.status(403).json({ 
        error: 'Your account is pending activation. Please check your invitation email.' 
      });
    }

    console.log('🔑 Comparing password...');
    // Verify password
    const isPasswordValid = await comparePassword(password, user.password_hash);
    console.log('Password comparison result:', isPasswordValid);
    
    if (!isPasswordValid) {
      console.log('❌ Invalid password for user:', user.id);
      // Record failed login attempt
      await User.recordLogin(user.id, req.ip, req.get('user-agent'), false);
      
      return res.status(401).json({ 
        error: 'Invalid email or password' 
      });
    }

    console.log('✅ Login successful for user:', user.id);

    // Update last login timestamp
    await User.updateLastLogin(user.id);

    // Record successful login
    await User.recordLogin(user.id, req.ip, req.get('user-agent'), true);

    // Get company info
    const company = await Organization.findById(user.organization_id);

    // Generate JWT token with extended expiration if rememberMe is true
    const tokenExpiration = rememberMe ? '30d' : '7d';
    const token = generateToken(user, tokenExpiration);

    // Role-based redirect paths
    const redirectPaths = {
      ceo: '/ceo/dashboard',
      hr: '/hr/dashboard',
      manager: '/manager/dashboard',
      employee: '/employee/dashboard',
      admin: '/ceo/dashboard' // Legacy admin redirects to CEO dashboard
    };

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        organization_id: user.organization_id,
        companyName: company ? company.name : null,
        employee_id: user.employee_id,
        status: user.status
      },
      token,
      redirectTo: redirectPaths[user.role] || '/dashboard'
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
 * Create user directly (CEO and HR only) - bypasses invitation flow
 * POST /api/auth/users
 * 
 * Modes:
 * 1. mode=existing: Link to existing employee (employee_id required)
 * 2. mode=new: Create new user and optionally new employee profile (if role needs profile)
 */
export const createUser = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { username, email, password, role, employee_id, mode = 'new' } = req.body;
    const creator = req.user;

    // Validation
    if (!username || !email || !password || !role) {
      return res.status(400).json({
        error: 'Username, email, password, and role are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate role
    const validRoles = ['employee', 'manager', 'hr'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        error: 'Invalid role. Must be employee, manager, or hr'
      });
    }

    // Only CEO can create HR, HR can create employee/manager
    if (creator.role !== 'ceo' && creator.role !== 'CEO') {
      if (role === 'hr') {
        return res.status(403).json({
          error: 'Only CEO can create HR accounts'
        });
      }
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({ error: passwordValidation.message });
    }

    // Check if username already exists (before transaction)
    const [usernameCheck] = await pool.execute(
      'SELECT id FROM users WHERE username = ? AND organization_id = ?',
      [username, creator.organization_id]
    );
    
    if (usernameCheck.length > 0) {
      return res.status(409).json({
        error: 'Username already exists in your organization'
      });
    }

    // Check if email already exists in users table (before transaction)
    const [emailCheck] = await pool.execute(
      'SELECT id FROM users WHERE email = ? AND organization_id = ?',
      [email, creator.organization_id]
    );
    
    if (emailCheck.length > 0) {
      return res.status(409).json({
        error: 'Email already exists in your organization'
      });
    }

    // Start transaction
    await connection.beginTransaction();

    let finalEmployeeId = null;

    // Roles that need employee profile
    const needsEmployeeProfile = ['employee', 'manager', 'admin'];

    if (mode === 'existing') {
      // Mode 1: Link to existing employee
      if (!employee_id) {
        await connection.rollback();
        return res.status(400).json({
          error: 'employee_id is required when mode is "existing"'
        });
      }

      // Verify employee exists and belongs to same organization
      const [empRows] = await connection.execute(
        'SELECT id, user_id FROM employees WHERE id = ? AND organization_id = ?',
        [parseInt(employee_id), creator.organization_id]
      );

      if (empRows.length === 0) {
        await connection.rollback();
        return res.status(404).json({
          error: 'Employee not found in your organization'
        });
      }

      if (empRows[0].user_id) {
        await connection.rollback();
        return res.status(409).json({
          error: 'This employee already has a user account linked'
        });
      }

      finalEmployeeId = parseInt(employee_id);

    } else if (mode === 'new' && needsEmployeeProfile.includes(role)) {
      // Mode 2: Create new employee profile
      
      // Check if an employee with this email already exists (without user account)
      const [existingEmpRows] = await connection.execute(
        'SELECT id, user_id FROM employees WHERE email = ? AND organization_id = ?',
        [email, creator.organization_id]
      );

      if (existingEmpRows.length > 0) {
        // Employee with this email exists
        if (existingEmpRows[0].user_id) {
          // Already linked to another user
          await connection.rollback();
          return res.status(409).json({
            error: 'An employee with this email already has a user account'
          });
        } else {
          // Employee exists but not linked - link it instead of creating new
          finalEmployeeId = existingEmpRows[0].id;
        }
      } else {
        // Create new employee profile
        const course = role === 'manager' ? 'Manager' : role === 'hr' ? 'HR' : 'Employee';
        const roll_no = `EMP-${Date.now().toString().slice(-6)}`;

        const [empResult] = await connection.execute(
          'INSERT INTO employees (organization_id, name, course, roll_no, email, status) VALUES (?, ?, ?, ?, ?, ?)',
          [creator.organization_id, username, course, roll_no, email, 'active']
        );

        finalEmployeeId = empResult.insertId;
      }
    }

    // Hash password
    const password_hash = await hashPassword(password);

    // Create user account WITHOUT employee_id first (will update after employee link)
    const [userResult] = await connection.execute(
      `INSERT INTO users 
      (username, email, password_hash, role, organization_id, employee_id, invited_by, invitation_accepted_at, status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [username, email, password_hash, role, creator.organization_id, null, creator.id, new Date(), 'active']
    );

    const userId = userResult.insertId;

    // Create bidirectional link between user and employee
    if (finalEmployeeId) {
      // Update employee.user_id
      const [updateEmpResult] = await connection.execute(
        'UPDATE employees SET user_id = ? WHERE id = ? AND organization_id = ?',
        [userId, finalEmployeeId, creator.organization_id]
      );

      // Verify the employee update succeeded
      if (updateEmpResult.affectedRows === 0) {
        throw new Error('Failed to link employee profile - employee not found');
      }

      // Update user.employee_id
      const [updateUserResult] = await connection.execute(
        'UPDATE users SET employee_id = ? WHERE id = ? AND organization_id = ?',
        [finalEmployeeId, userId, creator.organization_id]
      );

      // Verify the user update succeeded
      if (updateUserResult.affectedRows === 0) {
        throw new Error('Failed to link user profile - user not found');
      }

      console.log(`Successfully linked user ${userId} ↔ employee ${finalEmployeeId}`);
    }

    // Commit transaction
    await connection.commit();

    console.log('Transaction committed successfully');
    console.log(`Created user: id=${userId}, username=${username}, employee_id=${finalEmployeeId}`);

    // Verify the links were created correctly (post-commit verification)
    if (finalEmployeeId) {
      const [verifyEmp] = await pool.execute(
        'SELECT id, user_id FROM employees WHERE id = ? AND organization_id = ?',
        [finalEmployeeId, creator.organization_id]
      );
      
      const [verifyUser] = await pool.execute(
        'SELECT id, employee_id FROM users WHERE id = ? AND organization_id = ?',
        [userId, creator.organization_id]
      );

      console.log('Post-commit verification:');
      console.log(`Employee ${finalEmployeeId}: user_id=${verifyEmp[0]?.user_id}`);
      console.log(`User ${userId}: employee_id=${verifyUser[0]?.employee_id}`);

      // If links are not correct, log error but don't fail (already committed)
      if (!verifyEmp[0] || verifyEmp[0].user_id !== userId) {
        console.error('⚠️ WARNING: Employee link verification failed!');
      }
      if (!verifyUser[0] || verifyUser[0].employee_id !== finalEmployeeId) {
        console.error('⚠️ WARNING: User link verification failed!');
      }
    }

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        id: userId,
        username,
        email,
        role,
        organization_id: creator.organization_id,
        employee_id: finalEmployeeId,
        status: 'active'
      }
    });
  } catch (error) {
    // Rollback on any error
    await connection.rollback();
    console.error('Create user error:', error);
    res.status(500).json({
      error: error.message || 'Error creating user'
    });
  } finally {
    connection.release();
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

/**
 * Change password (authenticated user)
 * POST /api/auth/change-password
 * 
 * Requires authentication
 * 
 * Body:
 * - currentPassword (required)
 * - newPassword (required)
 */
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: 'Current password and new password are required'
      });
    }

    // Validate new password strength
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.valid) {
      return res.status(400).json({ error: passwordValidation.message });
    }

    // Get user with password
    const user = await User.findByIdWithPassword(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isPasswordValid = await comparePassword(currentPassword, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Current password is incorrect'
      });
    }

    // Check if new password is same as current
    const isSamePassword = await comparePassword(newPassword, user.password_hash);
    if (isSamePassword) {
      return res.status(400).json({
        error: 'New password must be different from current password'
      });
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update password
    await User.updatePassword(userId, newPasswordHash);

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      error: error.message || 'Error changing password'
    });
  }
};

/**
 * Request password reset
 * POST /api/auth/forgot-password
 * 
 * Public endpoint
 * 
 * Body:
 * - email (required)
 */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Validation
    if (!email) {
      return res.status(400).json({
        error: 'Email is required'
      });
    }

    // Find user by email
    const user = await User.findByEmail(email);

    // Always return success (don't reveal if email exists)
    if (!user) {
      return res.json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.'
      });
    }

    // Generate reset token
    const resetToken = await User.createPasswordResetToken(user.id);

    // TODO: Send reset email (implement email service)
    // For now, return the token in response (DEV ONLY)
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

    console.log('[DEV] Password reset link:', resetLink);

    res.json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.',
      // DEV ONLY - remove in production
      ...(process.env.NODE_ENV !== 'production' && {
        resetLink,
        resetToken
      })
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      error: error.message || 'Error processing password reset request'
    });
  }
};

/**
 * Reset password with token
 * POST /api/auth/reset-password
 * 
 * Public endpoint
 * 
 * Body:
 * - token (required)
 * - newPassword (required)
 */
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Validation
    if (!token || !newPassword) {
      return res.status(400).json({
        error: 'Token and new password are required'
      });
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.valid) {
      return res.status(400).json({ error: passwordValidation.message });
    }

    // Verify reset token
    const userId = await User.verifyPasswordResetToken(token);
    if (!userId) {
      return res.status(400).json({
        error: 'Invalid or expired reset token'
      });
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update password
    await User.updatePassword(userId, newPasswordHash);

    // Invalidate the reset token
    await User.invalidatePasswordResetToken(token);

    res.json({
      success: true,
      message: 'Password reset successfully. You can now login with your new password.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      error: error.message || 'Error resetting password'
    });
  }
};

/**
 * Get login history for current user
 * GET /api/auth/login-history
 * 
 * Requires authentication
 */
export const getLoginHistory = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const userId = req.user.id;

    const history = await User.getLoginHistory(userId, parseInt(limit));

    res.json({
      success: true,
      history
    });
  } catch (error) {
    console.error('Get login history error:', error);
    res.status(500).json({
      error: error.message || 'Error fetching login history'
    });
  }
};
