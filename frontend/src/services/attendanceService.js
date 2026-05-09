/**
 * Attendance Service
 * 
 * Handles all attendance-related API calls
 */

import { api, endpoints } from './api';

export const attendanceService = {
  /**
   * Get attendance records with filters
   * @param {Object} filters - Filters (employee_id, start_date, end_date, date, status, department_id)
   * @returns {Promise<Object>} Attendance records
   */
  getAttendance: async (filters = {}) => {
    const params = new URLSearchParams();
    
    if (filters.employee_id) params.append('employee_id', filters.employee_id);
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    if (filters.date) params.append('date', filters.date);
    if (filters.status) params.append('status', filters.status);
    if (filters.department_id) params.append('department_id', filters.department_id);
    
    const queryString = params.toString();
    const endpoint = queryString ? `${endpoints.attendance.list}?${queryString}` : endpoints.attendance.list;
    
    return await api.get(endpoint);
  },

  /**
   * Check in employee
   * @param {Object} data - Check-in data (employee_id, notes)
   * @returns {Promise<Object>} Attendance record
   */
  checkIn: async (data) => {
    return await api.post(endpoints.attendance.checkIn, data);
  },

  /**
   * Check out employee
   * @param {Object} data - Check-out data (employee_id, notes)
   * @returns {Promise<Object>} Updated attendance record
   */
  checkOut: async (data) => {
    return await api.post(endpoints.attendance.checkOut, data);
  },

  /**
   * Get employee attendance history
   * @param {number} employeeId - Employee ID
   * @param {Object} filters - Optional filters (start_date, end_date, status, limit)
   * @returns {Promise<Object>} Employee attendance records
   */
  getEmployeeAttendance: async (employeeId, filters = {}) => {
    const params = new URLSearchParams();
    
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    if (filters.status) params.append('status', filters.status);
    if (filters.limit) params.append('limit', filters.limit);
    
    const queryString = params.toString();
    const endpoint = queryString 
      ? `${endpoints.attendance.employee(employeeId)}?${queryString}` 
      : endpoints.attendance.employee(employeeId);
    
    return await api.get(endpoint);
  },

  /**
   * Get attendance report
   * @param {Object} filters - Report filters (employee_id, start_date, end_date, status, department_id)
   * @returns {Promise<Object>} Attendance report with statistics
   */
  getAttendanceReport: async (filters = {}) => {
    const params = new URLSearchParams();
    
    if (filters.employee_id) params.append('employee_id', filters.employee_id);
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    if (filters.status) params.append('status', filters.status);
    if (filters.department_id) params.append('department_id', filters.department_id);
    
    const queryString = params.toString();
    const endpoint = queryString 
      ? `${endpoints.attendance.report}?${queryString}` 
      : endpoints.attendance.report;
    
    return await api.get(endpoint);
  },

  /**
   * Update attendance record
   * @param {number} id - Attendance record ID
   * @param {Object} data - Updated data (check_in, check_out, status, notes)
   * @returns {Promise<Object>} Updated attendance record
   */
  updateAttendance: async (id, data) => {
    return await api.put(endpoints.attendance.update(id), data);
  },
};

export default attendanceService;
