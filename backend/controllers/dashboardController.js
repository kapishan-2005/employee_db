/**
 * Dashboard Controller
 * 
 * Handles dashboard data requests
 */

import Dashboard from '../models/dashboardModel.js';

/**
 * Get dashboard overview
 * GET /api/dashboard/overview
 * 
 * Admin/Manager: Full overview
 * Employee: Personal overview
 */
export const getOverview = async (req, res) => {
  try {
    const { role, employee_id, organization_id } = req.user;

    // Employee role: return personal overview
    if (role === 'employee') {
      if (!employee_id) {
        return res.status(400).json({
          success: false,
          error: 'Employee ID not found for user',
        });
      }

      const data = await Dashboard.getEmployeeOverview(employee_id, organization_id);
      return res.json({
        success: true,
        data,
        role: 'employee',
      });
    }

    // Admin/Manager/CEO: return full overview
    const data = await Dashboard.getOverview(organization_id);
    res.json({
      success: true,
      data,
      role,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get recent activity
 * GET /api/dashboard/recent-activity
 * 
 * Admin/Manager: All recent activity
 * Employee: Personal recent activity
 */
export const getRecentActivity = async (req, res) => {
  try {
    const { role, employee_id, organization_id } = req.user;
    const limit = parseInt(req.query.limit) || 10;

    // Employee role: return personal activity
    if (role === 'employee') {
      if (!employee_id) {
        return res.status(400).json({
          success: false,
          error: 'Employee ID not found for user',
        });
      }

      const data = await Dashboard.getEmployeeActivity(employee_id, limit, organization_id);
      return res.json({
        success: true,
        data,
        role: 'employee',
      });
    }

    // Admin/Manager/CEO: return all recent activity
    const data = await Dashboard.getRecentActivity(limit, organization_id);
    res.json({
      success: true,
      data,
      role,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
