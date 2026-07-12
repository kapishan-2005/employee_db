/**
 * AI Model
 *
 * DB access for ai_insights and ai_chat_history, plus the aggregate
 * workforce data queries used to build context for the AI service.
 */

import { pool } from '../config/db.js';

const AI = {
  // ---------------------------------------------------------------------
  // ai_insights
  // ---------------------------------------------------------------------

  saveInsight: async ({ user_id, role, insight_type, message, severity = 'info' }) => {
    try {
      const [result] = await pool.execute(
        `INSERT INTO ai_insights (user_id, role, insight_type, message, severity)
         VALUES (?, ?, ?, ?, ?)`,
        [user_id, role, insight_type, message, severity]
      );
      return { id: result.insertId, user_id, role, insight_type, message, severity };
    } catch (error) {
      throw new Error(`Error saving AI insight: ${error.message}`);
    }
  },

  getInsightsForUser: async (user_id, limit = 20) => {
    try {
      const [rows] = await pool.execute(
        `SELECT * FROM ai_insights WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`,
        [user_id, limit]
      );
      return rows;
    } catch (error) {
      throw new Error(`Error fetching AI insights: ${error.message}`);
    }
  },

  // ---------------------------------------------------------------------
  // ai_chat_history
  // ---------------------------------------------------------------------

  saveChat: async ({ user_id, question, answer }) => {
    try {
      const [result] = await pool.execute(
        `INSERT INTO ai_chat_history (user_id, question, answer) VALUES (?, ?, ?)`,
        [user_id, question, answer]
      );
      return { id: result.insertId, user_id, question, answer };
    } catch (error) {
      throw new Error(`Error saving AI chat: ${error.message}`);
    }
  },

  getChatHistory: async (user_id, limit = 20) => {
    try {
      const [rows] = await pool.execute(
        `SELECT * FROM ai_chat_history WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`,
        [user_id, limit]
      );
      return rows.reverse(); // oldest first for chat display
    } catch (error) {
      throw new Error(`Error fetching AI chat history: ${error.message}`);
    }
  },

  // ---------------------------------------------------------------------
  // Aggregate workforce context (used to feed the AI model)
  // ---------------------------------------------------------------------

  getCompanyContext: async () => {
    try {
      const [[employeeCount]] = await pool.execute(
        `SELECT COUNT(*) as total FROM employees`
      );
      const [[deptCount]] = await pool.execute(
        `SELECT COUNT(*) as total FROM departments WHERE is_active = 1`
      );
      const [attendanceByDept] = await pool.execute(
        `SELECT 
          d.name AS department,
          COUNT(a.id) AS totalRecords,
          SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) AS present,
          SUM(CASE WHEN a.status = 'late' THEN 1 ELSE 0 END) AS late,
          SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) AS absent
        FROM attendance a
        JOIN employees e ON a.employee_id = e.id
        JOIN departments d ON e.department_id = d.id
        WHERE a.date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        GROUP BY d.name`
      );
      const [[overallAttendance]] = await pool.execute(
        `SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present
        FROM attendance
        WHERE date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`
      );

      const attendancePct = overallAttendance.total
        ? Math.round((overallAttendance.present / overallAttendance.total) * 100)
        : 0;

      return {
        totalEmployees: employeeCount.total,
        totalDepartments: deptCount.total,
        attendancePercentage: attendancePct,
        attendanceByDepartment: attendanceByDept,
      };
    } catch (error) {
      throw new Error(`Error building company context: ${error.message}`);
    }
  },

  getEmployeePerformanceContext: async (employeeId) => {
    try {
      const [[employee]] = await pool.execute(
        `SELECT id, name, course, roll_no, department_id, position, status
         FROM employees WHERE id = ?`,
        [employeeId]
      );

      const [[attendance]] = await pool.execute(
        `SELECT 
          COUNT(*) as totalDays,
          SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as presentDays,
          SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as lateDays,
          SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absentDays
        FROM attendance
        WHERE employee_id = ? AND date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`,
        [employeeId]
      );

      const [[activity]] = await pool.execute(
        `SELECT COUNT(*) as actionCount
         FROM activity_logs
         WHERE entity_type = 'employee' AND entity_id = ?
         AND created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`,
        [employeeId]
      );

      return { employee, attendance, activity };
    } catch (error) {
      throw new Error(`Error building employee performance context: ${error.message}`);
    }
  },

  // ---------------------------------------------------------------------
  // Attendance Intelligence
  // ---------------------------------------------------------------------

  /**
   * Detect employees with frequent late arrivals or absences in the
   * last 30 days, plus per-department attendance problem rates.
   */
  getAttendancePatterns: async ({ lateThreshold = 3, absentThreshold = 3 } = {}) => {
    try {
      const [frequentLate] = await pool.execute(
        `SELECT 
          e.id AS employee_id, e.name, d.name AS department,
          COUNT(*) AS lateCount
        FROM attendance a
        JOIN employees e ON a.employee_id = e.id
        LEFT JOIN departments d ON e.department_id = d.id
        WHERE a.status = 'late' AND a.date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        GROUP BY e.id, e.name, d.name
        HAVING lateCount >= ?
        ORDER BY lateCount DESC`,
        [lateThreshold]
      );

      const [frequentAbsent] = await pool.execute(
        `SELECT 
          e.id AS employee_id, e.name, d.name AS department,
          COUNT(*) AS absentCount
        FROM attendance a
        JOIN employees e ON a.employee_id = e.id
        LEFT JOIN departments d ON e.department_id = d.id
        WHERE a.status = 'absent' AND a.date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        GROUP BY e.id, e.name, d.name
        HAVING absentCount >= ?
        ORDER BY absentCount DESC`,
        [absentThreshold]
      );

      const [departmentIssues] = await pool.execute(
        `SELECT 
          d.name AS department,
          COUNT(a.id) AS totalRecords,
          SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) AS present,
          SUM(CASE WHEN a.status = 'late' THEN 1 ELSE 0 END) AS late,
          SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) AS absent,
          ROUND(SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) / COUNT(a.id) * 100, 1) AS attendanceRate
        FROM attendance a
        JOIN employees e ON a.employee_id = e.id
        JOIN departments d ON e.department_id = d.id
        WHERE a.date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        GROUP BY d.name
        HAVING totalRecords > 0
        ORDER BY attendanceRate ASC`
      );

      return { frequentLate, frequentAbsent, departmentIssues };
    } catch (error) {
      throw new Error(`Error detecting attendance patterns: ${error.message}`);
    }
  },
};

export default AI;
