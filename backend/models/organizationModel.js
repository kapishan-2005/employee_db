/**
 * Organization Model
 * Handles the `organizations` table (one per CEO/company — the multi-tenant
 * boundary that keeps every company's data isolated).
 */

import { pool } from '../config/db.js';

const Organization = {
  create: async ({ name, created_by = null }) => {
    try {
      const [result] = await pool.execute(
        'INSERT INTO organizations (name, created_by) VALUES (?, ?)',
        [name, created_by]
      );
      return { id: result.insertId, name, created_by };
    } catch (error) {
      throw new Error(`Error creating organization: ${error.message}`);
    }
  },

  findById: async (id) => {
    try {
      const [rows] = await pool.execute('SELECT * FROM organizations WHERE id = ?', [id]);
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error fetching organization: ${error.message}`);
    }
  },

  /**
   * Update organization settings
   * @param {number} id - Organization ID
   * @param {Object} data - Settings data
   * @returns {Promise<Object>} Updated organization
   */
  updateSettings: async (id, data) => {
    try {
      const updates = [];
      const params = [];

      // Normalize optional time fields (convert empty strings to null)
      const normalizeTime = (value) => {
        if (value === '' || value === null || value === undefined) {
          return null;
        }
        return value;
      };

      // Build dynamic update query based on provided fields
      const allowedFields = [
        'name', 'logo_url', 'address', 'city', 'state', 'country',
        'postal_code', 'timezone', 'industry', 'company_size',
        'working_days', 'office_hours_start', 'office_hours_end',
        'break_time_start', 'break_time_end',
        'lunch_time_start', 'lunch_time_end',
        'description'
      ];

      allowedFields.forEach(field => {
        if (data[field] !== undefined) {
          updates.push(`${field} = ?`);
          
          // Convert working_days array to JSON string if needed
          if (field === 'working_days' && Array.isArray(data[field])) {
            params.push(JSON.stringify(data[field]));
          }
          // Normalize time fields (convert empty strings to null)
          else if (field.includes('time') || field.includes('hours')) {
            params.push(normalizeTime(data[field]));
          }
          else {
            params.push(data[field]);
          }
        }
      });

      if (updates.length === 0) {
        throw new Error('No fields to update');
      }

      params.push(id);

      await pool.execute(
        `UPDATE organizations SET ${updates.join(', ')} WHERE id = ?`,
        params
      );

      return await Organization.findById(id);
    } catch (error) {
      throw new Error(`Error updating organization settings: ${error.message}`);
    }
  },

  /**
   * Mark setup as completed
   * @param {number} id - Organization ID
   * @returns {Promise<void>}
   */
  markSetupComplete: async (id) => {
    try {
      await pool.execute(
        'UPDATE organizations SET setup_completed = TRUE, setup_completed_at = NOW() WHERE id = ?',
        [id]
      );
    } catch (error) {
      throw new Error(`Error marking setup complete: ${error.message}`);
    }
  },

  /**
   * Check if organization setup is completed
   * @param {number} id - Organization ID
   * @returns {Promise<boolean>}
   */
  isSetupComplete: async (id) => {
    try {
      const [rows] = await pool.execute(
        'SELECT setup_completed FROM organizations WHERE id = ?',
        [id]
      );
      return rows[0] ? Boolean(rows[0].setup_completed) : false;
    } catch (error) {
      throw new Error(`Error checking setup status: ${error.message}`);
    }
  },
};

export default Organization;
