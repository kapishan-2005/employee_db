/**
 * Centralized API Service
 * 
 * Provides a unified interface for all API calls with:
 * - Automatic JWT token attachment
 * - Base URL configuration
 * - Error handling
 * - Reusable HTTP methods
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Get JWT token from localStorage
 */
const getToken = () => {
  return localStorage.getItem('token');
};

/**
 * Create axios instance with default config
 */
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor - attach JWT token
 */
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor - handle 401 and errors
 */
axiosInstance.interceptors.response.use(
  (response) => {
    // Return data directly for successful responses
    return response.data;
  },
  async (error) => {
    // Handle 401 Unauthorized - token expired or invalid
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      return Promise.reject(new Error('Session expired. Please login again.'));
    }

    // Handle network errors with retry logic
    if (!error.response && error.config && !error.config.__retryCount) {
      error.config.__retryCount = 0;
    }

    if (!error.response && error.config && error.config.__retryCount < 2) {
      error.config.__retryCount += 1;
      const delay = 1000 * error.config.__retryCount;
      await new Promise(resolve => setTimeout(resolve, delay));
      return axiosInstance(error.config);
    }

    // Network errors
    if (!error.response) {
      return Promise.reject(new Error('Network error. Please check your connection.'));
    }

    // API errors
    const message = error.response?.data?.error || 
                   error.response?.data?.message || 
                   `HTTP ${error.response?.status}`;
    return Promise.reject(new Error(message));
  }
);

/**
 * HTTP Methods
 */
export const api = {
  /**
   * GET request
   */
  get: async (endpoint) => {
    return axiosInstance.get(endpoint);
  },

  /**
   * POST request
   */
  post: async (endpoint, data) => {
    return axiosInstance.post(endpoint, data);
  },

  /**
   * PUT request
   */
  put: async (endpoint, data) => {
    return axiosInstance.put(endpoint, data);
  },

  /**
   * PATCH request
   */
  patch: async (endpoint, data) => {
    return axiosInstance.patch(endpoint, data);
  },

  /**
   * DELETE request
   */
  delete: async (endpoint) => {
    return axiosInstance.delete(endpoint);
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
