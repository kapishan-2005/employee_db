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
};

export default Organization;
