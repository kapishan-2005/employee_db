/**
 * Centralized API Service
 * 
 * Provides a unified interface for all API calls with:
 * - Automatic JWT token attachment
 * - Base URL configuration
 * - Error handling
 * - Reusable HTTP methods
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Get JWT token from localStorage
 */
const getToken = () => {
  return localStorage.getItem('token');
};

/**
 * Centralized fetch wrapper with automatic token attachment and retry logic
 */
const apiFetch = async (endpoint, options = {}, retries = 0) => {
  const token = getToken();
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, config);
    
    // Handle 401 Unauthorized - token expired or invalid
    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      throw new Error('Session expired. Please login again.');
    }

    // Parse response
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || data.message || `HTTP ${response.status}`);
    }

    return data;
  } catch (error) {
    // Retry on network errors (max 2 retries)
    if (error.message === 'Failed to fetch' && retries < 2) {
      await new Promise(resolve => setTimeout(resolve, 1000 * (retries + 1)));
      return apiFetch(endpoint, options, retries + 1);
    }
    
    // Network errors or other fetch failures
    if (error.message === 'Failed to fetch') {
      throw new Error('Network error. Please check your connection.');
    }
    throw error;
  }
};

/**
 * HTTP Methods
 */
export const api = {
  /**
   * GET request
   */
  get: async (endpoint) => {
    return apiFetch(endpoint, {
      method: 'GET',
    });
  },

  /**
   * POST request
   */
  post: async (endpoint, data) => {
    return apiFetch(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * PUT request
   */
  put: async (endpoint, data) => {
    return apiFetch(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * PATCH request
   */
  patch: async (endpoint, data) => {
    return apiFetch(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  /**
   * DELETE request
   */
  delete: async (endpoint) => {
    return apiFetch(endpoint, {
      method: 'DELETE',
    });
  },
};

/**
 * API Endpoints
 */
export const endpoints = {
  // Auth
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    me: '/auth/me',
  },
  
  // Employees
  employees: {
    list: '/employees',
    get: (id) => `/employees/${id}`,
    create: '/employees',
    update: (id) => `/employees/${id}`,
    delete: (id) => `/employees/${id}`,
  },
  
  // Departments
  departments: {
    list: '/departments',
    get: (id) => `/departments/${id}`,
    create: '/departments',
    update: (id) => `/departments/${id}`,
    delete: (id) => `/departments/${id}`,
    employees: (id) => `/departments/${id}/employees`,
    stats: (id) => `/departments/${id}/stats`,
  },
  
  // Attendance
  attendance: {
    list: '/attendance',
    get: (id) => `/attendance/${id}`,
    checkIn: '/attendance/check-in',
    checkOut: '/attendance/check-out',
    employee: (id) => `/attendance/employee/${id}`,
    report: '/attendance/report',
    update: (id) => `/attendance/${id}`,
  },
};

export default api;
