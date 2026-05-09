/**
 * Dashboard Service
 * 
 * Handles all dashboard-related API calls
 */

import { api, endpoints } from './api';

// Add dashboard endpoints
const dashboardEndpoints = {
  overview: '/dashboard/overview',
  recentActivity: '/dashboard/recent-activity',
};

export const dashboardService = {
  /**
   * Get dashboard overview
   * @returns {Promise<Object>} Dashboard overview data
   */
  getOverview: async () => {
    return await api.get(dashboardEndpoints.overview);
  },

  /**
   * Get recent activity
   * @param {number} limit - Number of records to fetch
   * @returns {Promise<Object>} Recent activity data
   */
  getRecentActivity: async (limit = 10) => {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit);
    
    const queryString = params.toString();
    const endpoint = queryString 
      ? `${dashboardEndpoints.recentActivity}?${queryString}` 
      : dashboardEndpoints.recentActivity;
    
    return await api.get(endpoint);
  },
};

export default dashboardService;
