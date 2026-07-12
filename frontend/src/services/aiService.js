/**
 * AI Service
 *
 * Handles all AI-assistant related API calls (chat, insights, performance,
 * recruitment).
 */

import { api, endpoints } from './api';

export const aiService = {
  /**
   * Ask the role-based AI assistant a question
   * @param {string} question
   * @returns {Promise<Object>} { answer }
   */
  chat: async (question) => {
    return await api.post(endpoints.ai.chat, { question });
  },

  /**
   * Get this user's chat history
   */
  getChatHistory: async () => {
    return await api.get(endpoints.ai.chatHistory);
  },

  /**
   * Get stored insights for the current user
   */
  getInsights: async () => {
    return await api.get(endpoints.ai.insights);
  },

  /**
   * Generate fresh company-wide insights (CEO / Admin only)
   */
  generateInsights: async () => {
    return await api.post(endpoints.ai.generateInsights, {});
  },

  /**
   * Analyze a specific employee's performance (CEO / Admin / Manager only)
   * @param {number} employeeId
   */
  analyzePerformance: async (employeeId) => {
    return await api.post(endpoints.ai.performance(employeeId), {});
  },

  /**
   * Detect attendance patterns — frequent late/absent employees + department
   * issues (CEO / Admin / Manager only)
   */
  getAttendanceIntelligence: async () => {
    return await api.get(endpoints.ai.attendanceIntelligence);
  },

  /**
   * Generate a job description + interview questions (CEO / Admin only)
   * @param {{ jobRole: string, experience?: string, requiredSkills?: string }} params
   */
  generateRecruitment: async ({ jobRole, experience, requiredSkills }) => {
    return await api.post(endpoints.ai.recruitment, {
      jobRole,
      experience,
      requiredSkills,
    });
  },
};

export default aiService;
