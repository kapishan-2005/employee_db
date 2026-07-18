/**
 * Department Service
 * 
 * Handles all department-related API calls
 */

import { api, endpoints } from './api';

export const departmentService = {
  /**
   * Get all departments
   * @param {Object} filters - Optional filters (is_active)
   * @returns {Promise<Object>} Response with departments array
   */
  getDepartments: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.is_active !== undefined) {
      params.append('is_active', filters.is_active);
    }
    
    const queryString = params.toString();
    const endpoint = queryString ? `${endpoints.departments.list}?${queryString}` : endpoints.departments.list;
    
    return await api.get(endpoint);
  },

  /**
   * Get single department by ID
   * @param {number} id - Department ID
   * @returns {Promise<Object>} Department data
   */
  getDepartment: async (id) => {
    return await api.get(endpoints.departments.get(id));
  },

  /**
   * Create new department
   * @param {Object} data - Department data (name, description, is_active, manager_id)
   * @returns {Promise<Object>} Created department
   */
  createDepartment: async (data) => {
    return await api.post(endpoints.departments.create, data);
  },

  /**
   * Update department
   * @param {number} id - Department ID
   * @param {Object} data - Updated department data
   * @returns {Promise<Object>} Updated department
   */
  updateDepartment: async (id, data) => {
    return await api.put(endpoints.departments.update(id), data);
  },

  /**
   * Assign or remove manager from department
   * @param {number} id - Department ID
   * @param {number|null} managerId - Manager user ID (null to remove)
   * @returns {Promise<Object>} Updated department
   */
  assignManager: async (id, managerId) => {
    return await api.patch(endpoints.departments.assignManager(id), { manager_id: managerId });
  },

  /**
   * Toggle department active status
   * @param {number} id - Department ID
   * @param {boolean} isActive - Active status
   * @returns {Promise<Object>} Updated department
   */
  toggleStatus: async (id, isActive) => {
    return await api.patch(endpoints.departments.toggleStatus(id), { is_active: isActive });
  },

  /**
   * Delete department
   * @param {number} id - Department ID
   * @returns {Promise<Object>} Success message
   */
  deleteDepartment: async (id) => {
    return await api.delete(endpoints.departments.delete(id));
  },

  /**
   * Get employees in a department
   * @param {number} id - Department ID
   * @returns {Promise<Object>} Department employees
   */
  getDepartmentEmployees: async (id) => {
    return await api.get(endpoints.departments.employees(id));
  },

  /**
   * Get department statistics
   * @param {number} id - Department ID
   * @returns {Promise<Object>} Department statistics
   */
  getDepartmentStats: async (id) => {
    return await api.get(endpoints.departments.stats(id));
  },
};

export default departmentService;
