/**
 * Dashboard Model
 * 
 * Handles dashboard data aggregation and statistics
 */

import { pool } from '../config/db.js';

const Dashboard = {
  /**
   * Get overview statistics
   * @returns {Promise<Object>} Dashboard overview data
   */
  getOverview: async (organization_id) => {
    try {
      // Get total employees
      const [employeeCount] = await pool.execute(
        'SELECT COUNT(*) as total FROM employees WHERE organization_id = ?',
        [organization_id]
      );

      // Get total departments
      const [deptCount] = await pool.execute(
        'SELECT COUNT(*) as total FROM departments WHERE is_active = 1 AND organization_id = ?',
        [organization_id]
      );

      // Get today's attendance stats
      const today = new Date().toISOString().split('T')[0];
      const [attendanceStats] = await pool.execute(
        `SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present,
          SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent,
          SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late,
          SUM(CASE WHEN check_out IS NOT NULL THEN 1 ELSE 0 END) as checkedOut
        FROM attendance 
        WHERE date = ? AND organization_id = ?`,
        [today, organization_id]
      );

      return {
        totalEmployees: employeeCount[0].total,
        activeEmployees: employeeCount[0].total, // Can be enhanced with is_active field
        totalDepartments: deptCount[0].total,
        attendanceToday: attendanceStats[0].total || 0,
        presentToday: attendanceStats[0].present || 0,
        absentToday: attendanceStats[0].absent || 0,
        lateToday: attendanceStats[0].late || 0,
        checkedOutToday: attendanceStats[0].checkedOut || 0,
      };
    } catch (error) {
      throw new Error(`Error fetching dashboard overview: ${error.message}`);
    }
  },

  /**
   * Get employee-specific overview
   * @param {number} employeeId - Employee ID
   * @returns {Promise<Object>} Employee dashboard data
   */
  getEmployeeOverview: async (employeeId, organization_id) => {
    try {
      // Get employee info
      const [employee] = await pool.execute(
        'SELECT id, name, course, roll_no FROM employees WHERE id = ? AND organization_id = ?',
        [employeeId, organization_id]
      );

      if (employee.length === 0) {
        throw new Error('Employee not found');
      }

      // Get attendance stats for last 30 days
      const [attendanceStats] = await pool.execute(
        `SELECT 
          COUNT(*) as totalDays,
          SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as presentDays,
          SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as lateDays,
          SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absentDays
        FROM attendance 
        WHERE employee_id = ? AND organization_id = ?
        AND date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`,
        [employeeId, organization_id]
      );

      // Get today's attendance
      const today = new Date().toISOString().split('T')[0];
      const [todayAttendance] = await pool.execute(
        `SELECT check_in, check_out, status 
        FROM attendance 
        WHERE employee_id = ? AND date = ? AND organization_id = ?`,
        [employeeId, today, organization_id]
      );

      return {
        employee: employee[0],
        stats: {
          totalDays: attendanceStats[0].totalDays || 0,
          presentDays: attendanceStats[0].presentDays || 0,
          lateDays: attendanceStats[0].lateDays || 0,
          absentDays: attendanceStats[0].absentDays || 0,
        },
        today: todayAttendance[0] || null,
      };
    } catch (error) {
      throw new Error(`Error fetching employee overview: ${error.message}`);
    }
  },

  /**
   * Get recent activity
   * @param {number} limit - Number of records to fetch
   * @returns {Promise<Object>} Recent activity data
   */
  getRecentActivity: async (limit = 10, organization_id) => {
    try {
      const safeLimit = Math.max(1, parseInt(limit) || 10);

      // Recent employees
      const [recentEmployees] = await pool.execute(
        `SELECT id, name, course, roll_no, created_at 
        FROM employees 
        WHERE organization_id = ?
        ORDER BY created_at DESC 
        LIMIT ${safeLimit}`,
        [organization_id]
      );

      // Recent attendance (today)
      const today = new Date().toISOString().split('T')[0];
      const [recentAttendance] = await pool.execute(
        `SELECT 
          a.id,
          a.employee_id,
          e.name as employee_name,
          e.roll_no as employee_roll_no,
          a.check_in,
          a.check_out,
          a.status,
          a.date
        FROM attendance a
        JOIN employees e ON a.employee_id = e.id
        WHERE a.date = ? AND a.organization_id = ?
        ORDER BY a.check_in DESC
        LIMIT ${safeLimit}`,
        [today, organization_id]
      );

      // Recent departments
      const [recentDepartments] = await pool.execute(
        `SELECT id, name, description, is_active, created_at 
        FROM departments 
        WHERE organization_id = ?
        ORDER BY created_at DESC 
        LIMIT ${safeLimit}`,
        [organization_id]
      );

      return {
        recentEmployees,
        recentAttendance,
        recentDepartments,
      };
    } catch (error) {
      throw new Error(`Error fetching recent activity: ${error.message}`);
    }
  },

  /**
   * Get employee recent activity
   * @param {number} employeeId - Employee ID
   * @param {number} limit - Number of records to fetch
   * @returns {Promise<Object>} Employee recent activity
   */
  getEmployeeActivity: async (employeeId, limit = 10, organization_id) => {
    try {
      const safeLimit = Math.max(1, parseInt(limit) || 10);
      // Recent attendance for this employee
      const [recentAttendance] = await pool.execute(
        `SELECT 
          id,
          date,
          check_in,
          check_out,
          status,
          notes
        FROM attendance
        WHERE employee_id = ? AND organization_id = ?
        ORDER BY date DESC
        LIMIT ${safeLimit}`,
        [employeeId, organization_id]
      );

      return {
        recentAttendance,
      };
    } catch (error) {
      throw new Error(`Error fetching employee activity: ${error.message}`);
    }
  },
};

export default Dashboard;
