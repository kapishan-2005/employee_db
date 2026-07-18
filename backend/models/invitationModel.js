/**
 * Invitation Model
 * 
 * Handles invitation-based user creation workflow:
 * - CEO invites HR
 * - HR invites Managers
 * - Managers invite Employees
 * 
 * All invitations are secure, token-based, and have expiration times.
 */

import { pool } from '../config/db.js';
import crypto from 'crypto';

const Invitation = {
  /**
   * Generate a secure random token for invitation
   * @returns {string} Random token
   */
  generateToken: () => {
    return crypto.randomBytes(32).toString('hex');
  },

  /**
   * Create a new invitation
   * @param {Object} data - Invitation data
   * @returns {Promise<Object>} Created invitation
   */
  create: async ({ company_id, email, role, invited_by, metadata = null }) => {
    try {
      const token = Invitation.generateToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

      const [result] = await pool.execute(
        `INSERT INTO invitations 
        (company_id, email, role, token, invited_by, expires_at, metadata) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [company_id, email, role, token, invited_by, expiresAt, metadata ? JSON.stringify(metadata) : null]
      );

      return {
        id: result.insertId,
        company_id,
        email,
        role,
        token,
        invited_by,
        expires_at: expiresAt,
        status: 'pending',
        metadata,
      };
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('An invitation with this token already exists');
      }
      throw new Error(`Error creating invitation: ${error.message}`);
    }
  },

  /**
   * Find invitation by token
   * @param {string} token - Invitation token
   * @returns {Promise<Object|null>} Invitation object or null
   */
  findByToken: async (token) => {
    try {
      const [rows] = await pool.execute(
        `SELECT i.*, u.username as invited_by_name, u.role as invited_by_role,
         o.name as company_name
         FROM invitations i
         LEFT JOIN users u ON i.invited_by = u.id
         LEFT JOIN organizations o ON i.company_id = o.id
         WHERE i.token = ?`,
        [token]
      );

      if (rows[0] && rows[0].metadata) {
        try {
          rows[0].metadata = JSON.parse(rows[0].metadata);
        } catch (e) {
          rows[0].metadata = null;
        }
      }

      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error finding invitation: ${error.message}`);
    }
  },

  /**
   * Find invitation by ID
   * @param {number} id - Invitation ID
   * @returns {Promise<Object|null>} Invitation object or null
   */
  findById: async (id) => {
    try {
      const [rows] = await pool.execute(
        `SELECT * FROM invitations WHERE id = ?`,
        [id]
      );

      if (rows[0] && rows[0].metadata) {
        try {
          rows[0].metadata = JSON.parse(rows[0].metadata);
        } catch (e) {
          rows[0].metadata = null;
        }
      }

      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error finding invitation: ${error.message}`);
    }
  },

  /**
   * Find all invitations for a company
   * @param {number} company_id - Company ID
   * @param {Object} filters - Optional filters (status, role)
   * @returns {Promise<Array>} Array of invitations
   */
  findByCompany: async (company_id, filters = {}) => {
    try {
      let query = `
        SELECT i.*, u.username as invited_by_name, u.email as invited_by_email
        FROM invitations i
        LEFT JOIN users u ON i.invited_by = u.id
        WHERE i.company_id = ?
      `;
      const params = [company_id];

      if (filters.status) {
        query += ' AND i.status = ?';
        params.push(filters.status);
      }

      if (filters.role) {
        query += ' AND i.role = ?';
        params.push(filters.role);
      }

      query += ' ORDER BY i.created_at DESC';

      const [rows] = await pool.execute(query, params);

      // Parse metadata for each row
      rows.forEach(row => {
        if (row.metadata) {
          try {
            row.metadata = JSON.parse(row.metadata);
          } catch (e) {
            row.metadata = null;
          }
        }
      });

      return rows;
    } catch (error) {
      throw new Error(`Error finding invitations: ${error.message}`);
    }
  },

  /**
   * Find pending invitation by email and company
   * @param {string} email - Email address
   * @param {number} company_id - Company ID
   * @returns {Promise<Object|null>} Invitation object or null
   */
  findPendingByEmail: async (email, company_id) => {
    try {
      const [rows] = await pool.execute(
        `SELECT * FROM invitations 
         WHERE email = ? AND company_id = ? AND status = 'pending'
         ORDER BY created_at DESC LIMIT 1`,
        [email, company_id]
      );

      if (rows[0] && rows[0].metadata) {
        try {
          rows[0].metadata = JSON.parse(rows[0].metadata);
        } catch (e) {
          rows[0].metadata = null;
        }
      }

      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error finding pending invitation: ${error.message}`);
    }
  },

  /**
   * Check if invitation is valid (pending, not expired)
   * @param {string} token - Invitation token
   * @returns {Promise<Object>} Validation result
   */
  validateToken: async (token) => {
    try {
      const invitation = await Invitation.findByToken(token);

      if (!invitation) {
        return { valid: false, message: 'Invitation not found' };
      }

      if (invitation.status === 'accepted') {
        return { valid: false, message: 'Invitation already accepted' };
      }

      if (invitation.status === 'cancelled') {
        return { valid: false, message: 'Invitation has been cancelled' };
      }

      if (invitation.status === 'expired') {
        return { valid: false, message: 'Invitation has expired' };
      }

      const now = new Date();
      const expiresAt = new Date(invitation.expires_at);

      if (now > expiresAt) {
        // Mark as expired
        await pool.execute(
          'UPDATE invitations SET status = ? WHERE id = ?',
          ['expired', invitation.id]
        );
        return { valid: false, message: 'Invitation has expired' };
      }

      return { valid: true, invitation };
    } catch (error) {
      throw new Error(`Error validating invitation: ${error.message}`);
    }
  },

  /**
   * Mark invitation as accepted
   * @param {string} token - Invitation token
   * @returns {Promise<boolean>} Success status
   */
  markAsAccepted: async (token) => {
    try {
      const [result] = await pool.execute(
        'UPDATE invitations SET status = ?, accepted_at = CURRENT_TIMESTAMP WHERE token = ? AND status = ?',
        ['accepted', token, 'pending']
      );

      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error marking invitation as accepted: ${error.message}`);
    }
  },

  /**
   * Cancel an invitation
   * @param {number} id - Invitation ID
   * @returns {Promise<boolean>} Success status
   */
  cancel: async (id) => {
    try {
      const [result] = await pool.execute(
        'UPDATE invitations SET status = ? WHERE id = ? AND status = ?',
        ['cancelled', id, 'pending']
      );

      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error cancelling invitation: ${error.message}`);
    }
  },

  /**
   * Delete an invitation
   * @param {number} id - Invitation ID
   * @returns {Promise<boolean>} Success status
   */
  delete: async (id) => {
    try {
      const [result] = await pool.execute(
        'DELETE FROM invitations WHERE id = ?',
        [id]
      );

      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error deleting invitation: ${error.message}`);
    }
  },

  /**
   * Clean up expired invitations
   * @returns {Promise<number>} Number of cleaned invitations
   */
  cleanupExpired: async () => {
    try {
      const [result] = await pool.execute(
        `UPDATE invitations 
         SET status = 'expired' 
         WHERE status = 'pending' AND expires_at < NOW()`
      );

      return result.affectedRows;
    } catch (error) {
      throw new Error(`Error cleaning up expired invitations: ${error.message}`);
    }
  },

  /**
   * Get invitation statistics for a company
   * @param {number} company_id - Company ID
   * @returns {Promise<Object>} Statistics object
   */
  getStats: async (company_id) => {
    try {
      const [rows] = await pool.execute(
        `SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as accepted,
          SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END) as expired,
          SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled
         FROM invitations 
         WHERE company_id = ?`,
        [company_id]
      );

      return rows[0] || { total: 0, pending: 0, accepted: 0, expired: 0, cancelled: 0 };
    } catch (error) {
      throw new Error(`Error getting invitation stats: ${error.message}`);
    }
  },
};

export default Invitation;
