/**
 * CEO Dashboard Controller
 * 
 * Handles CEO dashboard data requests with comprehensive metrics
 */

import CEODashboard from '../models/ceoDashboardModel.js';

/**
 * Get complete CEO dashboard data
 * GET /api/ceo/dashboard
 * 
 * Access: CEO only
 * Returns: Consolidated dashboard data including KPIs, charts, activities, etc.
 */
export const getCEODashboard = async (req, res) => {
  try {
    const { role, organization_id } = req.user;

    // Verify CEO role
    if (role !== 'ceo') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. CEO role required.',
      });
    }

    if (!organization_id) {
      return res.status(400).json({
        success: false,
        error: 'Organization ID not found',
      });
    }

    // Get consolidated dashboard data
    const data = await CEODashboard.getConsolidatedData(organization_id);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('CEO Dashboard error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch CEO dashboard data',
    });
  }
};

/**
 * Get KPI statistics only
 * GET /api/ceo/dashboard/kpis
 */
export const getKPIs = async (req, res) => {
  try {
    const { role, organization_id } = req.user;

    if (role !== 'ceo') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. CEO role required.',
      });
    }

    const stats = await CEODashboard.getKPIStats(organization_id);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get workforce growth data
 * GET /api/ceo/dashboard/workforce-growth
 */
export const getWorkforceGrowth = async (req, res) => {
  try {
    const { role, organization_id } = req.user;

    if (role !== 'ceo') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. CEO role required.',
      });
    }

    const data = await CEODashboard.getWorkforceGrowth(organization_id);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get department distribution
 * GET /api/ceo/dashboard/department-distribution
 */
export const getDepartmentDistribution = async (req, res) => {
  try {
    const { role, organization_id } = req.user;

    if (role !== 'ceo') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. CEO role required.',
      });
    }

    const data = await CEODashboard.getDepartmentDistribution(organization_id);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
