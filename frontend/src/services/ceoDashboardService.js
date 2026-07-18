/**
 * CEO Dashboard Service
 * 
 * Handles all CEO dashboard-related API calls
 */

import { api } from './api';

const ceoDashboardService = {
  /**
   * Get complete CEO dashboard data
   * @returns {Promise<Object>} Complete CEO dashboard data
   */
  getCEODashboard: async () => {
    return await api.get('/ceo/dashboard');
  },

  /**
   * Get KPI statistics only
   * @returns {Promise<Object>} KPI statistics
   */
  getKPIs: async () => {
    return await api.get('/ceo/dashboard/kpis');
  },

  /**
   * Get workforce growth data
   * @returns {Promise<Object>} Workforce growth data
   */
  getWorkforceGrowth: async () => {
    return await api.get('/ceo/dashboard/workforce-growth');
  },

  /**
   * Get department distribution data
   * @returns {Promise<Object>} Department distribution data
   */
  getDepartmentDistribution: async () => {
    return await api.get('/ceo/dashboard/department-distribution');
  },
};

export default ceoDashboardService;
