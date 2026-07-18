/**
 * CEO Dashboard Model
 * 
 * Handles CEO-specific dashboard data aggregation with comprehensive metrics
 */

import { pool } from '../config/db.js';

const CEODashboard = {
  /**
   * Get consolidated KPI statistics for CEO
   * @param {number} organization_id - Organization ID
   * @returns {Promise<Object>} KPI statistics
   */
  getKPIStats: async (organization_id) => {
    try {
      // Total Employees
      const [employeeCount] = await pool.execute(
        'SELECT COUNT(*) as total FROM employees WHERE organization_id = ?',
        [organization_id]
      );

      // Total Departments
      const [deptCount] = await pool.execute(
        'SELECT COUNT(*) as total FROM departments WHERE is_active = 1 AND organization_id = ?',
        [organization_id]
      );

      // Active Projects
      const [projectCount] = await pool.execute(
        'SELECT COUNT(*) as total FROM projects WHERE company_id = ? AND status = "active"',
        [organization_id]
      );

      // Pending Invitations
      const [invitationCount] = await pool.execute(
        'SELECT COUNT(*) as total FROM invitations WHERE status = "pending" AND company_id = ?',
        [organization_id]
      );

      // Employees on Leave (today)
      const today = new Date().toISOString().split('T')[0];
      const [leaveCount] = await pool.execute(
        `SELECT COUNT(*) as total FROM leave_requests 
         WHERE status = "approved" 
         AND start_date <= ? 
         AND end_date >= ? 
         AND company_id = ?`,
        [today, today, organization_id]
      );

      // Attendance Today
      const [attendanceStats] = await pool.execute(
        `SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present,
          SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent,
          SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late
        FROM attendance 
        WHERE date = ? AND organization_id = ?`,
        [today, organization_id]
      );

      const attendanceToday = attendanceStats[0].total || 0;
      const presentToday = attendanceStats[0].present || 0;
      const attendancePct = attendanceToday > 0 
        ? Math.round((presentToday / attendanceToday) * 100) 
        : 0;

      return {
        totalEmployees: employeeCount[0].total || 0,
        totalDepartments: deptCount[0].total || 0,
        activeProjects: projectCount[0].total || 0,
        pendingInvitations: invitationCount[0].total || 0,
        employeesOnLeave: leaveCount[0].total || 0,
        attendanceToday: attendancePct,
        attendanceDetails: {
          total: attendanceToday,
          present: presentToday,
          absent: attendanceStats[0].absent || 0,
          late: attendanceStats[0].late || 0,
        },
      };
    } catch (error) {
      throw new Error(`Error fetching KPI stats: ${error.message}`);
    }
  },

  /**
   * Get workforce growth data for last 6 months
   * @param {number} organization_id - Organization ID
   * @returns {Promise<Array>} Workforce growth data
   */
  getWorkforceGrowth: async (organization_id) => {
    try {
      const [rows] = await pool.execute(
        `SELECT 
          DATE_FORMAT(created_at, '%Y-%m') as month,
          DATE_FORMAT(created_at, '%b %Y') as label,
          COUNT(*) as count
        FROM employees
        WHERE organization_id = ?
        AND created_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
        GROUP BY DATE_FORMAT(created_at, '%Y-%m')
        ORDER BY month ASC`,
        [organization_id]
      );

      // Fill in missing months with 0 count
      const result = [];
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const month = date.toISOString().substring(0, 7);
        const label = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        
        const found = rows.find(r => r.month === month);
        result.push({
          month,
          label,
          count: found ? found.count : 0,
        });
      }

      return result;
    } catch (error) {
      throw new Error(`Error fetching workforce growth: ${error.message}`);
    }
  },

  /**
   * Get department distribution (employees per department)
   * @param {number} organization_id - Organization ID
   * @returns {Promise<Array>} Department distribution data
   */
  getDepartmentDistribution: async (organization_id) => {
    try {
      const [rows] = await pool.execute(
        `SELECT 
          d.name,
          d.id,
          COUNT(e.id) as employeeCount
        FROM departments d
        LEFT JOIN employees e ON d.id = e.department_id AND e.organization_id = ?
        WHERE d.organization_id = ? AND d.is_active = 1
        GROUP BY d.id, d.name
        ORDER BY employeeCount DESC`,
        [organization_id, organization_id]
      );

      return rows.map(row => ({
        departmentId: row.id,
        departmentName: row.name,
        employeeCount: row.employeeCount || 0,
      }));
    } catch (error) {
      throw new Error(`Error fetching department distribution: ${error.message}`);
    }
  },

  /**
   * Get recent company activities
   * @param {number} organization_id - Organization ID
   * @param {number} limit - Number of records to fetch
   * @returns {Promise<Array>} Recent activities
   */
  getRecentActivities: async (organization_id, limit = 10) => {
    try {
      const safeLimit = Math.max(1, parseInt(limit) || 10);
      
      const [rows] = await pool.execute(
        `SELECT 
          al.id,
          al.action,
          al.entity_type,
          al.entity_id,
          al.details,
          al.created_at,
          u.email as user_email,
          u.role as user_role
        FROM activity_logs al
        LEFT JOIN users u ON al.user_id = u.id
        WHERE al.organization_id = ?
        ORDER BY al.created_at DESC
        LIMIT ${safeLimit}`,
        [organization_id]
      );

      return rows.map(row => ({
        id: row.id,
        action: row.action,
        entityType: row.entity_type,
        entityId: row.entity_id,
        details: row.details,
        userEmail: row.user_email,
        userRole: row.user_role,
        createdAt: row.created_at,
      }));
    } catch (error) {
      throw new Error(`Error fetching recent activities: ${error.message}`);
    }
  },

  /**
   * Get pending invitations
   * @param {number} organization_id - Organization ID
   * @param {number} limit - Number of records to fetch
   * @returns {Promise<Array>} Pending invitations
   */
  getPendingInvitations: async (organization_id, limit = 10) => {
    try {
      const safeLimit = Math.max(1, parseInt(limit) || 10);
      
      const [rows] = await pool.execute(
        `SELECT 
          i.id,
          i.email,
          i.role,
          i.expires_at,
          i.status,
          i.created_at,
          u.email as invited_by_email,
          u.role as invited_by_role
        FROM invitations i
        LEFT JOIN users u ON i.invited_by = u.id
        WHERE i.company_id = ? AND i.status = 'pending'
        ORDER BY i.created_at DESC
        LIMIT ${safeLimit}`,
        [organization_id]
      );

      return rows.map(row => ({
        id: row.id,
        email: row.email,
        role: row.role,
        expiresAt: row.expires_at,
        status: row.status,
        invitedBy: row.invited_by_email,
        invitedByRole: row.invited_by_role,
        createdAt: row.created_at,
      }));
    } catch (error) {
      throw new Error(`Error fetching pending invitations: ${error.message}`);
    }
  },

  /**
   * Get AI executive insights
   * @param {number} organization_id - Organization ID
   * @param {number} limit - Number of records to fetch
   * @returns {Promise<Array>} AI insights
   */
  getAIInsights: async (organization_id, limit = 5) => {
    try {
      const safeLimit = Math.max(1, parseInt(limit) || 5);
      
      const [rows] = await pool.execute(
        `SELECT 
          id,
          insight_type,
          severity,
          message,
          created_at
        FROM ai_insights
        WHERE organization_id = ?
        ORDER BY created_at DESC
        LIMIT ${safeLimit}`,
        [organization_id]
      );

      return rows.map(row => ({
        id: row.id,
        insightType: row.insight_type,
        severity: row.severity,
        message: row.message,
        createdAt: row.created_at,
      }));
    } catch (error) {
      throw new Error(`Error fetching AI insights: ${error.message}`);
    }
  },

  /**
   * Get all CEO dashboard data in one consolidated call
   * @param {number} organization_id - Organization ID
   * @returns {Promise<Object>} Complete dashboard data
   */
  getConsolidatedData: async (organization_id) => {
    try {
      const [
        stats,
        workforceGrowth,
        departmentDistribution,
        recentActivities,
        pendingInvitations,
        aiInsights,
      ] = await Promise.all([
        CEODashboard.getKPIStats(organization_id),
        CEODashboard.getWorkforceGrowth(organization_id),
        CEODashboard.getDepartmentDistribution(organization_id),
        CEODashboard.getRecentActivities(organization_id, 10),
        CEODashboard.getPendingInvitations(organization_id, 10),
        CEODashboard.getAIInsights(organization_id, 5),
      ]);

      return {
        stats,
        workforceGrowth,
        departmentDistribution,
        recentActivities,
        pendingInvitations,
        aiInsights,
      };
    } catch (error) {
      throw new Error(`Error fetching consolidated dashboard data: ${error.message}`);
    }
  },
};

export default CEODashboard;
