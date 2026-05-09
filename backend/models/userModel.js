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
        'SELECT id, username, email, role, employee_id, is_active, last_login, created_at FROM users ORDER BY created_at DESC'
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
        'SELECT id, username, email, role, employee_id, is_active, last_login, created_at FROM users WHERE id = ?',
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
        'SELECT id, username, email, role, employee_id, is_active, last_login, created_at FROM users WHERE email = ?',
        [email]
      );
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error fetching user by email: ${error.message}`);
    }
  },

  /**
   * Create new user
   * NOTE: In Phase 2, password will be hashed before calling this method
   * @param {Object} data - User data
   * @returns {Promise<Object>} Created user object (without password_hash)
   */
  create: async (data) => {
    try {
      const { username, email, password_hash, role = 'employee', employee_id = null } = data;

      const [result] = await pool.execute(
        'INSERT INTO users (username, email, password_hash, role, employee_id) VALUES (?, ?, ?, ?, ?)',
        [username, email, password_hash, role, employee_id]
      );

      return {
        id: result.insertId,
        username,
        email,
        role,
        employee_id,
        is_active: true
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
  }
};

export default User;
