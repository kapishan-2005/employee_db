/**
 * Leave Model
 *
 * Simple leave management: apply, approve/reject, history, view-all.
 * No leave-balance engine, no payroll integration (by design, per MVP scope).
 *
 * Role-based visibility is enforced by the controller (which decides what
 * filters to pass in), not by this model.
 */

import { pool } from '../config/db.js';

const Leave = {
  /**
   * Calculate inclusive day count between two dates (simple calendar days,
   * no weekend/holiday exclusion \u2014 intentionally simple for MVP).
   */
  calculateDays: (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffMs = end.getTime() - start.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
  },

  create: async ({ company_id, employee_id, leave_type, start_date, end_date, reason }) => {
    try {
      const total_days = Leave.calculateDays(start_date, end_date);
      if (total_days <= 0) {
        throw new Error('End date must be on or after start date');
      }

      const [result] = await pool.execute(
        `INSERT INTO leave_requests
          (company_id, employee_id, leave_type, start_date, end_date, total_days, reason, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
        [company_id, employee_id, leave_type, start_date, end_date, total_days, reason || null]
      );

      return await Leave.findById(result.insertId, company_id);
    } catch (error) {
      throw new Error(`Error creating leave request: ${error.message}`);
    }
  },

  findById: async (id, company_id) => {
    try {
      const [rows] = await pool.execute(
        `SELECT lr.*, u.username AS employee_name, u.email AS employee_email,
                r.username AS reviewed_by_name
         FROM leave_requests lr
         JOIN users u ON lr.employee_id = u.id
         LEFT JOIN users r ON lr.reviewed_by = r.id
         WHERE lr.id = ? AND lr.company_id = ?`,
        [id, company_id]
      );
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error fetching leave request: ${error.message}`);
    }
  },

  /**
   * Employee's own leave history
   */
  findByEmployee: async (employee_id, company_id) => {
    try {
      const [rows] = await pool.execute(
        `SELECT lr.*, r.username AS reviewed_by_name
         FROM leave_requests lr
         LEFT JOIN users r ON lr.reviewed_by = r.id
         WHERE lr.employee_id = ? AND lr.company_id = ?
         ORDER BY lr.created_at DESC`,
        [employee_id, company_id]
      );
      return rows;
    } catch (error) {
      throw new Error(`Error fetching employee leave history: ${error.message}`);
    }
  },

  /**
   * Company-wide leave requests (HR / CEO), optionally filtered by status
   */
  findAllInCompany: async (company_id, status = null) => {
    try {
      let query = `
        SELECT lr.*, u.username AS employee_name, u.email AS employee_email,
               r.username AS reviewed_by_name
        FROM leave_requests lr
        JOIN users u ON lr.employee_id = u.id
        LEFT JOIN users r ON lr.reviewed_by = r.id
        WHERE lr.company_id = ?
      `;
      const params = [company_id];

      if (status) {
        query += ' AND lr.status = ?';
        params.push(status);
      }

      query += ' ORDER BY lr.created_at DESC';

      const [rows] = await pool.execute(query, params);
      return rows;
    } catch (error) {
      throw new Error(`Error fetching company leave requests: ${error.message}`);
    }
  },

  /**
   * Leave requests for employees in departments managed by this manager
   * (manager identified via departments.manager_id)
   */
  findForManagerDepartments: async (managerUserId, company_id, status = null) => {
    try {
      let query = `
        SELECT lr.*, u.username AS employee_name, u.email AS employee_email,
               r.username AS reviewed_by_name, d.name AS department_name
        FROM leave_requests lr
        JOIN users u ON lr.employee_id = u.id
        LEFT JOIN users r ON lr.reviewed_by = r.id
        JOIN employees e ON e.user_id = u.id
        JOIN departments d ON e.department_id = d.id
        WHERE lr.company_id = ? AND d.manager_id = ?
      `;
      const params = [company_id, managerUserId];

      if (status) {
        query += ' AND lr.status = ?';
        params.push(status);
      }

      query += ' ORDER BY lr.created_at DESC';

      const [rows] = await pool.execute(query, params);
      return rows;
    } catch (error) {
      throw new Error(`Error fetching department leave requests: ${error.message}`);
    }
  },

  updateStatus: async (id, { status, reviewed_by, review_notes }, company_id) => {
    try {
      const [result] = await pool.execute(
        `UPDATE leave_requests
         SET status = ?, reviewed_by = ?, review_notes = ?, reviewed_at = NOW()
         WHERE id = ? AND company_id = ?`,
        [status, reviewed_by, review_notes || null, id, company_id]
      );

      if (result.affectedRows === 0) return null;
      return await Leave.findById(id, company_id);
    } catch (error) {
      throw new Error(`Error updating leave request: ${error.message}`);
    }
  },

  cancel: async (id, employee_id, company_id) => {
    try {
      const [result] = await pool.execute(
        `UPDATE leave_requests
         SET status = 'cancelled'
         WHERE id = ? AND employee_id = ? AND company_id = ? AND status = 'pending'`,
        [id, employee_id, company_id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error cancelling leave request: ${error.message}`);
    }
  },

  /**
   * Quick counts for dashboards (pending / employees currently on leave today)
   */
  getPendingCount: async (company_id) => {
    try {
      const [[row]] = await pool.execute(
        `SELECT COUNT(*) as count FROM leave_requests WHERE company_id = ? AND status = 'pending'`,
        [company_id]
      );
      return row.count;
    } catch (error) {
      throw new Error(`Error counting pending leave requests: ${error.message}`);
    }
  },

  getOnLeaveToday: async (company_id) => {
    try {
      const [rows] = await pool.execute(
        `SELECT lr.*, u.username AS employee_name
         FROM leave_requests lr
         JOIN users u ON lr.employee_id = u.id
         WHERE lr.company_id = ? AND lr.status = 'approved'
         AND CURDATE() BETWEEN lr.start_date AND lr.end_date`,
        [company_id]
      );
      return rows;
    } catch (error) {
      throw new Error(`Error fetching employees on leave today: ${error.message}`);
    }
  },
};

export default Leave;
