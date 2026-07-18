/**
 * User Model
 * 
 * Handles all database operations for users (authentication).
 * 
 * Phase 2: Full authentication implementation
 * - Password hashing (bcrypt)
 * - JWT token generation
 * - Login/logout functionality
 * - Role-based access control
 * 
 * Security:
 * - Passwords are hashed with bcrypt before storage
 * - Password hashes are never returned in queries (except for authentication)
 * - Duplicate username/email prevention
 * - Role-based access control support
 */

import { pool } from "../config/db.js";

const User = {
  /**
   * Get all users
   * @returns {Promise<Array>} Array of user objects (without password_hash)
   */
  find: async () => {
    try {
      const [rows] = await pool.execute(
        'SELECT id, username, email, role, organization_id, employee_id, is_active, last_login, created_at FROM users ORDER BY created_at DESC'
      );
      return rows;
    } catch (error) {
      throw new Error(`Error fetching users: ${error.message}`);
    }
  },

  /**
   * Get all users scoped to a single organization (multi-tenant safe)
   * @param {number} organizationId
   */
  findByOrganization: async (organizationId) => {
    try {
      const [rows] = await pool.execute(
        'SELECT id, username, email, role, organization_id, employee_id, is_active, last_login, created_at FROM users WHERE organization_id = ? ORDER BY created_at DESC',
        [organizationId]
      );
      return rows;
    } catch (error) {
      throw new Error(`Error fetching users: ${error.message}`);
    }
  },

  /**
   * Get user by ID
   * @param {number} id - User ID
   * @returns {Promise<Object|null>} User object (without password_hash) or null
   */
  findById: async (id) => {
    try {
      const [rows] = await pool.execute(
        'SELECT id, username, email, role, organization_id, employee_id, is_active, last_login, created_at FROM users WHERE id = ?',
        [id]
      );
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error fetching user by ID: ${error.message}`);
    }
  },

  /**
   * Get user by username (for authentication)
   * @param {string} username - Username
   * @returns {Promise<Object|null>} User object (with password_hash) or null
   */
  findByUsername: async (username) => {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM users WHERE username = ?',
        [username]
      );
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error fetching user by username: ${error.message}`);
    }
  },

  /**
   * Get user by email
   * @param {string} email - Email address
   * @returns {Promise<Object|null>} User object (without password_hash) or null
   */
  findByEmail: async (email) => {
    try {
      const [rows] = await pool.execute(
        'SELECT id, username, email, role, organization_id, employee_id, is_active, last_login, created_at FROM users WHERE email = ?',
        [email]
      );
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error fetching user by email: ${error.message}`);
    }
  },

  /**
   * Get user by email (for authentication — includes password_hash)
   * @param {string} email - Email address
   * @returns {Promise<Object|null>} User object (with password_hash) or null
   */
  findByEmailWithPassword: async (email) => {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM users WHERE LOWER(email) = LOWER(?)',
        [email]
      );
      
      if (rows[0]) {
        console.log('📧 User query result:', {
          id: rows[0].id,
          email: rows[0].email,
          role: rows[0].role,
          status: rows[0].status,
          is_active: rows[0].is_active,
          hasPasswordHash: !!rows[0].password_hash
        });
      }
      
      return rows[0] || null;
    } catch (error) {
      console.error('Error in findByEmailWithPassword:', error);
      throw new Error(`Error fetching user by email: ${error.message}`);
    }
  },

  /**
   * Count total users (used to detect first-run/bootstrap state)
   * @returns {Promise<number>}
   */
  count: async () => {
    try {
      const [[row]] = await pool.execute('SELECT COUNT(*) as total FROM users');
      return row.total;
    } catch (error) {
      throw new Error(`Error counting users: ${error.message}`);
    }
  },

  /**
   * Create new user
   * NOTE: Password will be hashed before calling this method
   * @param {Object} data - User data
   * @returns {Promise<Object>} Created user object (without password_hash)
   */
  create: async (data) => {
    try {
      const { 
        username, 
        email, 
        password_hash, 
        role = 'employee', 
        organization_id, 
        employee_id = null,
        invited_by = null,
        invitation_accepted_at = null,
        status = 'active'
      } = data;

      const [result] = await pool.execute(
        `INSERT INTO users 
        (username, email, password_hash, role, organization_id, employee_id, invited_by, invitation_accepted_at, status) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [username, email, password_hash, role, organization_id, employee_id, invited_by, invitation_accepted_at, status]
      );

      return {
        id: result.insertId,
        username,
        email,
        role,
        organization_id,
        employee_id,
        invited_by,
        invitation_accepted_at,
        status
      };
    } catch (error) {
      // Handle duplicate username/email
      if (error.code === 'ER_DUP_ENTRY') {
        if (error.message.includes('username')) {
          throw new Error('Username already exists');
        }
        if (error.message.includes('email')) {
          throw new Error('Email already exists');
        }
      }
      throw new Error(`Error creating user: ${error.message}`);
    }
  },

  /**
   * Update user by ID
   * @param {number} id - User ID
   * @param {Object} data - Updated user data
   * @param {Object} options - Options (e.g., { new: true })
   * @returns {Promise<Object|null>} Updated user object or null
   */
  findByIdAndUpdate: async (id, data, options = {}) => {
    try {
      const updates = [];
      const params = [];

      // Only update provided fields
      if (data.username !== undefined) {
        updates.push('username = ?');
        params.push(data.username);
      }
      if (data.email !== undefined) {
        updates.push('email = ?');
        params.push(data.email);
      }
      if (data.password_hash !== undefined) {
        updates.push('password_hash = ?');
        params.push(data.password_hash);
      }
      if (data.role !== undefined) {
        updates.push('role = ?');
        params.push(data.role);
      }
      if (data.employee_id !== undefined) {
        updates.push('employee_id = ?');
        params.push(data.employee_id);
      }
      if (data.is_active !== undefined) {
        updates.push('is_active = ?');
        params.push(data.is_active);
      }
      if (data.last_login !== undefined) {
        updates.push('last_login = ?');
        params.push(data.last_login);
      }

      if (updates.length === 0) {
        throw new Error('No fields to update');
      }

      params.push(id);

      const [result] = await pool.execute(
        `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
        params
      );

      if (result.affectedRows === 0) {
        return null;
      }

      if (options.new) {
        return await User.findById(id);
      }

      return { id: parseInt(id), ...data };
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        if (error.message.includes('username')) {
          throw new Error('Username already exists');
        }
        if (error.message.includes('email')) {
          throw new Error('Email already exists');
        }
      }
      throw new Error(`Error updating user: ${error.message}`);
    }
  },

  /**
   * Delete user by ID
   * @param {number} id - User ID
   * @returns {Promise<Object|null>} Deleted user info or null
   */
  findByIdAndDelete: async (id) => {
    try {
      const [result] = await pool.execute(
        'DELETE FROM users WHERE id = ?',
        [id]
      );

      return result.affectedRows > 0 ? { id: parseInt(id) } : null;
    } catch (error) {
      throw new Error(`Error deleting user: ${error.message}`);
    }
  },

  /**
   * Update last login timestamp
   * @param {number} id - User ID
   * @returns {Promise<void>}
   */
  updateLastLogin: async (id) => {
    try {
      await pool.execute(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
        [id]
      );
    } catch (error) {
      throw new Error(`Error updating last login: ${error.message}`);
    }
  },

  /**
   * Get user by ID with password hash (for password verification)
   * @param {number} id - User ID
   * @returns {Promise<Object|null>} User object with password_hash
   */
  findByIdWithPassword: async (id) => {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM users WHERE id = ?',
        [id]
      );
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error fetching user by ID: ${error.message}`);
    }
  },

  /**
   * Update user password
   * @param {number} userId - User ID
   * @param {string} passwordHash - New password hash
   * @returns {Promise<void>}
   */
  updatePassword: async (userId, passwordHash) => {
    try {
      const [result] = await pool.execute(
        'UPDATE users SET password_hash = ? WHERE id = ?',
        [passwordHash, userId]
      );

      if (result.affectedRows === 0) {
        throw new Error('User not found');
      }
    } catch (error) {
      throw new Error(`Error updating password: ${error.message}`);
    }
  },

  /**
   * Create password reset token
   * @param {number} userId - User ID
   * @returns {Promise<string>} Reset token
   */
  createPasswordResetToken: async (userId) => {
    try {
      // Generate random token
      const crypto = await import('crypto');
      const token = crypto.randomBytes(32).toString('hex');
      
      // Token expires in 1 hour
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      await pool.execute(
        'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
        [userId, token, expiresAt]
      );

      return token;
    } catch (error) {
      throw new Error(`Error creating reset token: ${error.message}`);
    }
  },

  /**
   * Verify password reset token
   * @param {string} token - Reset token
   * @returns {Promise<number|null>} User ID if valid, null if invalid/expired
   */
  verifyPasswordResetToken: async (token) => {
    try {
      const [rows] = await pool.execute(
        `SELECT user_id FROM password_reset_tokens 
         WHERE token = ? AND expires_at > NOW() AND used_at IS NULL`,
        [token]
      );

      return rows[0] ? rows[0].user_id : null;
    } catch (error) {
      throw new Error(`Error verifying reset token: ${error.message}`);
    }
  },

  /**
   * Invalidate password reset token
   * @param {string} token - Reset token
   * @returns {Promise<void>}
   */
  invalidatePasswordResetToken: async (token) => {
    try {
      await pool.execute(
        'UPDATE password_reset_tokens SET used_at = NOW() WHERE token = ?',
        [token]
      );
    } catch (error) {
      throw new Error(`Error invalidating reset token: ${error.message}`);
    }
  },

  /**
   * Record login attempt in history
   * @param {number} userId - User ID
   * @param {string} ipAddress - IP address
   * @param {string} userAgent - User agent string
   * @param {boolean} success - Whether login was successful
   * @returns {Promise<void>}
   */
  recordLogin: async (userId, ipAddress, userAgent, success = true) => {
    try {
      await pool.execute(
        'INSERT INTO login_history (user_id, ip_address, user_agent, success) VALUES (?, ?, ?, ?)',
        [userId, ipAddress, userAgent, success]
      );
    } catch (error) {
      // Don't throw error - login history is non-critical
      console.error('Error recording login history:', error);
    }
  },

  /**
   * Get login history for a user
   * @param {number} userId - User ID
   * @param {number} limit - Number of records to return
   * @returns {Promise<Array>} Array of login history records
   */
  getLoginHistory: async (userId, limit = 10) => {
    try {
      const safeLimit = Math.max(1, parseInt(limit) || 10);
      const [rows] = await pool.execute(
        `SELECT id, ip_address, user_agent, login_at, success 
         FROM login_history 
         WHERE user_id = ? 
         ORDER BY login_at DESC 
         LIMIT ${safeLimit}`,
        [userId]
      );
      return rows;
    } catch (error) {
      throw new Error(`Error fetching login history: ${error.message}`);
    }
  }
};

export default User;
