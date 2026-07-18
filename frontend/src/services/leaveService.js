/**
 * Leave Service
 * Handles leave application, history, and approve/reject workflows
 */

import { api } from './api';

export const leaveService = {
  apply: async ({ leave_type, start_date, end_date, reason }) => {
    return await api.post('/leave', { leave_type, start_date, end_date, reason });
  },

  myHistory: async () => {
    return await api.get('/leave/my-history');
  },

  list: async (status) => {
    const query = status ? `?status=${status}` : '';
    return await api.get(`/leave${query}`);
  },

  approve: async (id, review_notes) => {
    return await api.put(`/leave/${id}/approve`, { review_notes });
  },

  reject: async (id, review_notes) => {
    return await api.put(`/leave/${id}/reject`, { review_notes });
  },

  cancel: async (id) => {
    return await api.delete(`/leave/${id}`);
  },
};

export default leaveService;
