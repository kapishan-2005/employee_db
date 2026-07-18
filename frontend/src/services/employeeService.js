/**
 * Employee Service
 * 
 * Handles all employee-related API calls using the ACTUAL database schema:
 * - id, organization_id, user_id
 * - name, course, roll_no (required)
 * - email, phone, department_id, position, hire_date, salary
 * - status ('active', 'inactive', 'on_leave')
 * - address, profile_picture
 * - created_at, updated_at
 */

import { api, endpoints } from './api';

export const employeeService = {
  /**
   * Get all employees with pagination, search, and filters
   * Role-based filtering handled by backend:
   * - CEO/HR: All employees
   * - Manager: Department employees only
   * - Employee: Own profile only
   * 
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number (default: 1)
   * @param {number} params.limit - Items per page (default: 10)
   * @param {string} params.search - Search query
   * @param {string} params.status - Filter by status ('active', 'inactive', 'on_leave')
   * @param {number} params.department_id - Filter by department
   * @returns {Promise<Object>} { data: [...], pagination: {...} }
   */
  getEmployees: async (params = {}) => {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.search) queryParams.append('search', params.search);
    if (params.status) queryParams.append('status', params.status);
    if (params.department_id) queryParams.append('department_id', params.department_id);
    
    const queryString = queryParams.toString();
    const endpoint = queryString ? `${endpoints.employees.list}?${queryString}` : endpoints.employees.list;
    
    return await api.get(endpoint);
  },

  /**
   * Get single employee by ID
   * @param {number} id - Employee ID
   * @returns {Promise<Object>} Employee data
   */
  getEmployee: async (id) => {
    return await api.get(endpoints.employees.get(id));
  },

  /**
   * Create new employee
   * Required fields: name, course, roll_no
   * Optional fields: email, phone, department_id, position, hire_date, salary, status, address, profile_picture
   * 
   * @param {Object} data - Employee data
   * @returns {Promise<Object>} Created employee
   */
  createEmployee: async (data) => {
    return await api.post(endpoints.employees.create, data);
  },

  /**
   * Update employee (full update - all fields required)
   * @param {number} id - Employee ID
   * @param {Object} data - Updated employee data
   * @returns {Promise<Object>} Updated employee
   */
  updateEmployee: async (id, data) => {
    return await api.put(endpoints.employees.update(id), data);
  },

  /**
   * Partially update employee (only provided fields updated)
   * @param {number} id - Employee ID
   * @param {Object} data - Partial employee data
   * @returns {Promise<Object>} Updated employee
   */
  patchEmployee: async (id, data) => {
    return await api.patch(endpoints.employees.update(id), data);
  },

  /**
   * Delete employee
   * @param {number} id - Employee ID
   * @returns {Promise<Object>} Success message
   */
  deleteEmployee: async (id) => {
    return await api.delete(endpoints.employees.delete(id));
  },

  /**
   * Get employee summary statistics
   * @returns {Promise<Object>} Employee stats
   */
  getEmployeeStats: async () => {
    // This would need to be added to backend if needed
    // For now, calculate from list
    const response = await api.get(endpoints.employees.list);
    const employees = response.data || [];
    
    return {
      total: employees.length,
      active: employees.filter(e => e.status === 'active').length,
      inactive: employees.filter(e => e.status === 'inactive').length,
      onLeave: employees.filter(e => e.status === 'on_leave').length,
      departments: new Set(employees.filter(e => e.department_id).map(e => e.department_id)).size
    };
  }
};

export default employeeService;
