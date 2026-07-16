/**
 * Attendance Model
 * 
 * Handles all database operations for employee attendance tracking.
 * 
 * Phase 1: Basic structure only (table created in migration)
 * Phase 5: Will implement full attendance functionality with:
 * - Check-in/check-out operations
 * - Attendance status tracking (present, absent, late, half_day, leave)
 * - Date range queries
 * - Attendance reports
 * - Late arrival detection
 * 
 * IMPORTANT: This model is a placeholder for Phase 5.
 * Do not use these methods yet - they will be fully implemented in Phase 5.
 */

import { pool } from "../config/db.js";

const Attendance = {
  /**
   * Get all attendance records
   * @param {Object} filters - Query filters (employee_id, start_date, end_date, status)
   * @returns {Promise<Array>} Array of attendance records
   */
  findAll: async (filters = {}) => {
    try {
      let query = `
        SELECT 
          a.*,
          e.name as employee_name,
          e.roll_no as employee_roll_no,
          e.department_id,
          d.name as department_name
        FROM attendance a
        LEFT JOIN employees e ON a.employee_id = e.id
        LEFT JOIN departments d ON e.department_id = d.id
      `;
      const params = [];
      const conditions = ['a.organization_id = ?'];
      params.push(filters.organization_id);

      // Filter by employee_id
      if (filters.employee_id) {
        conditions.push('a.employee_id = ?');
        params.push(filters.employee_id);
      }

      // Filter by date range
      if (filters.start_date) {
        conditions.push('a.date >= ?');
        params.push(filters.start_date);
      }
      if (filters.end_date) {
        conditions.push('a.date <= ?');
        params.push(filters.end_date);
      }

      // Filter by specific date
      if (filters.date) {
        conditions.push('a.date = ?');
        params.push(filters.date);
      }

      // Filter by status
      if (filters.status) {
        conditions.push('a.status = ?');
        params.push(filters.status);
      }

      // Filter by department
      if (filters.department_id) {
        conditions.push('e.department_id = ?');
        params.push(filters.department_id);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ' ORDER BY a.date DESC, e.name ASC';

      const [rows] = await pool.execute(query, params);
      return rows;
    } catch (error) {
      throw new Error(`Error fetching attendance records: ${error.message}`);
    }
  },

  // Alias for backward compatibility
  find: async (options = {}) => {
    return Attendance.findAll(options);
  },

  /**
   * Get attendance record by ID
   * @param {number} id - Attendance record ID
   * @returns {Promise<Object|null>} Attendance record or null
   */
  findById: async (id, organization_id) => {
    try {
      const [rows] = await pool.execute(
        `SELECT 
          a.*,
          e.name as employee_name,
          e.roll_no as employee_roll_no
        FROM attendance a
        LEFT JOIN employees e ON a.employee_id = e.id
        WHERE a.id = ? AND a.organization_id = ?`,
        [id, organization_id]
      );
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error fetching attendance by ID: ${error.message}`);
    }
  },

  /**
   * Get attendance record for specific employee and date
   * @param {number} employeeId - Employee ID
   * @param {string} date - Date (YYYY-MM-DD)
   * @returns {Promise<Object|null>} Attendance record or null
   */
  findByEmployeeAndDate: async (employeeId, date, organization_id) => {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM attendance WHERE employee_id = ? AND date = ? AND organization_id = ?',
        [employeeId, date, organization_id]
      );
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error fetching attendance by employee and date: ${error.message}`);
    }
  },

  /**
   * Check in employee for today
   * @param {number} employeeId - Employee ID
   * @param {string} notes - Optional notes
   * @returns {Promise<Object>} Created/updated attendance record
   */
  checkIn: async (employeeId, notes = null, organization_id) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const currentTime = new Date().toTimeString().split(' ')[0]; // HH:MM:SS

      // Check if attendance record already exists for today
      const existing = await Attendance.findByEmployeeAndDate(employeeId, today, organization_id);

      if (existing) {
        // If already checked in, return error
        if (existing.check_in) {
          throw new Error('Employee has already checked in today');
        }
        // Update existing record with check-in time
        return await Attendance.findByIdAndUpdate(
          existing.id,
          { check_in: currentTime, notes },
          { new: true },
          organization_id
        );
      }

      // Create new attendance record
      const record = await Attendance.create({
        employee_id: employeeId,
        date: today,
        check_in: currentTime,
        status: 'present',
        notes,
        organization_id
      });

      return await Attendance.findById(record.id, organization_id);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Check out employee for today
   * @param {number} employeeId - Employee ID
   * @param {string} notes - Optional notes
   * @returns {Promise<Object>} Updated attendance record
   */
  checkOut: async (employeeId, notes = null, organization_id) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const currentTime = new Date().toTimeString().split(' ')[0]; // HH:MM:SS

      // Check if attendance record exists for today
      const existing = await Attendance.findByEmployeeAndDate(employeeId, today, organization_id);

      if (!existing) {
        throw new Error('No check-in record found for today. Please check in first.');
      }

      if (!existing.check_in) {
        throw new Error('Cannot check out without checking in first');
      }

      if (existing.check_out) {
        throw new Error('Employee has already checked out today');
      }

      // Update with check-out time
      const updateData = { check_out: currentTime };
      if (notes) {
        updateData.notes = existing.notes ? `${existing.notes}; ${notes}` : notes;
      }

      return await Attendance.findByIdAndUpdate(
        existing.id,
        updateData,
        { new: true },
        organization_id
      );
    } catch (error) {
      throw error;
    }
  },

  /**
   * Create attendance record (manual entry)
   * @param {Object} data - Attendance data
   * @returns {Promise<Object>} Created attendance record
   */
  create: async (data) => {
    try {
      const { employee_id, date, check_in, status = 'present', notes, organization_id } = data;

      const [result] = await pool.execute(
        'INSERT INTO attendance (employee_id, date, check_in, status, notes, organization_id) VALUES (?, ?, ?, ?, ?, ?)',
        [employee_id, date, check_in || null, status, notes || null, organization_id]
      );

      return {
        id: result.insertId,
        employee_id,
        date,
        check_in: check_in || null,
        status,
        notes: notes || null,
        organization_id
      };
    } catch (error) {
      // Handle duplicate entry (employee already has attendance for this date)
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('Attendance record already exists for this employee and date');
      }
      throw new Error(`Error creating attendance record: ${error.message}`);
    }
  },

  /**
   * Update attendance record
   * @param {number} id - Attendance record ID
   * @param {Object} data - Updated attendance data
   * @param {Object} options - Options (e.g., { new: true })
   * @returns {Promise<Object|null>} Updated attendance record or null
   */
  update: async (id, data, options = {}, organization_id) => {
    try {
      const updates = [];
      const params = [];

      // Only update provided fields
      if (data.check_in !== undefined) {
        updates.push('check_in = ?');
        params.push(data.check_in);
      }
      if (data.check_out !== undefined) {
        updates.push('check_out = ?');
        params.push(data.check_out);
      }
      if (data.status !== undefined) {
        updates.push('status = ?');
        params.push(data.status);
      }
      if (data.notes !== undefined) {
        updates.push('notes = ?');
        params.push(data.notes);
      }

      if (updates.length === 0) {
        throw new Error('No fields to update');
      }

      params.push(id, organization_id);

      const [result] = await pool.execute(
        `UPDATE attendance SET ${updates.join(', ')} WHERE id = ? AND organization_id = ?`,
        params
      );

      if (result.affectedRows === 0) {
        return null;
      }

      if (options.new) {
        return await Attendance.findById(id, organization_id);
      }

      return { id: parseInt(id), ...data };
    } catch (error) {
      throw new Error(`Error updating attendance record: ${error.message}`);
    }
  },

  // Alias for backward compatibility
  findByIdAndUpdate: async (id, data, options = {}, organization_id) => {
    return Attendance.update(id, data, options, organization_id);
  },

  /**
   * Delete attendance record
   * @param {number} id - Attendance record ID
   * @returns {Promise<Object|null>} Deleted record info or null
   */
  findByIdAndDelete: async (id, organization_id) => {
    try {
      const [result] = await pool.execute(
        'DELETE FROM attendance WHERE id = ? AND organization_id = ?',
        [id, organization_id]
      );

      return result.affectedRows > 0 ? { id: parseInt(id) } : null;
    } catch (error) {
      throw new Error(`Error deleting attendance record: ${error.message}`);
    }
  },

  /**
   * Get attendance records for an employee with filters
   * @param {number} employeeId - Employee ID
   * @param {Object} filters - Query filters (start_date, end_date, status, limit)
   * @returns {Promise<Array>} Array of attendance records
   */
  getEmployeeAttendance: async (employeeId, filters = {}) => {
    try {
      let query = `
        SELECT 
          a.*,
          e.name as employee_name,
          e.roll_no as employee_roll_no
        FROM attendance a
        LEFT JOIN employees e ON a.employee_id = e.id
        WHERE a.employee_id = ? AND a.organization_id = ?
      `;
      const params = [employeeId, filters.organization_id];

      // Add date range filters if provided
      if (filters.start_date) {
        query += ' AND a.date >= ?';
        params.push(filters.start_date);
      }
      if (filters.end_date) {
        query += ' AND a.date <= ?';
        params.push(filters.end_date);
      }

      // Add status filter if provided
      if (filters.status) {
        query += ' AND a.status = ?';
        params.push(filters.status);
      }

      query += ' ORDER BY a.date DESC';

      // Add limit if provided
      if (filters.limit) {
        const safeLimit = Math.max(1, parseInt(filters.limit) || 10);
        query += ` LIMIT ${safeLimit}`;
      }

      const [rows] = await pool.execute(query, params);
      return rows;
    } catch (error) {
      throw new Error(`Error fetching employee attendance: ${error.message}`);
    }
  },

  // Alias for backward compatibility
  findByEmployee: async (employeeId, options = {}) => {
    return Attendance.getEmployeeAttendance(employeeId, options);
  },

  /**
   * Get attendance report with statistics
   * @param {Object} filters - Query filters (start_date, end_date, employee_id, department_id, status)
   * @returns {Promise<Object>} Attendance report with statistics
   */
  getReport: async (filters = {}) => {
    try {
      // Get all attendance records with filters
      const records = await Attendance.findAll(filters);

      // Calculate statistics
      const stats = {
        total_records: records.length,
        present: records.filter(r => r.status === 'present').length,
        absent: records.filter(r => r.status === 'absent').length,
        late: records.filter(r => r.status === 'late').length,
        half_day: records.filter(r => r.status === 'half_day').length,
        leave: records.filter(r => r.status === 'leave').length,
        checked_in: records.filter(r => r.check_in !== null).length,
        checked_out: records.filter(r => r.check_out !== null).length,
        pending_checkout: records.filter(r => r.check_in !== null && r.check_out === null).length
      };

      // Get unique employees count
      const uniqueEmployees = [...new Set(records.map(r => r.employee_id))];
      stats.unique_employees = uniqueEmployees.length;

      // Group by date for daily summary
      const dailySummary = {};
      records.forEach(record => {
        if (!dailySummary[record.date]) {
          dailySummary[record.date] = {
            date: record.date,
            total: 0,
            present: 0,
            absent: 0,
            late: 0,
            half_day: 0,
            leave: 0
          };
        }
        dailySummary[record.date].total++;
        dailySummary[record.date][record.status]++;
      });

      return {
        filters: {
          start_date: filters.start_date || null,
          end_date: filters.end_date || null,
          employee_id: filters.employee_id || null,
          department_id: filters.department_id || null,
          status: filters.status || null
        },
        statistics: stats,
        daily_summary: Object.values(dailySummary).sort((a, b) => b.date.localeCompare(a.date)),
        records: records
      };
    } catch (error) {
      throw new Error(`Error generating attendance report: ${error.message}`);
    }
  },
};

export default Attendance;
