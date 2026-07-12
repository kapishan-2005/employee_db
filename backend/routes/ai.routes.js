import express from 'express';
import * as controller from '../controllers/ai.controller.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { requireCEOAdminOrManager, requireCEOOrAdmin } from '../middleware/roleMiddleware.js';

const router = express.Router();

// All AI routes require authentication. The AI assistant is available to every
// role (chat persona changes based on req.user.role) — extra role gates are
// applied only to endpoints that touch company-wide / other-employee data.

// Chat with the role-based AI assistant
router.post('/chat', authMiddleware, controller.chat);
router.get('/chat/history', authMiddleware, controller.getChatHistory);

// Stored insights for the current user
router.get('/insights', authMiddleware, controller.getInsights);

// Generate fresh company-wide insights (CEO / Admin only)
router.post('/insights/generate', authMiddleware, requireCEOOrAdmin, controller.generateInsights);

// Employee performance analysis (CEO / Admin / Manager only)
router.post(
  '/performance/:employeeId',
  authMiddleware,
  requireCEOAdminOrManager,
  controller.analyzePerformance
);

// Attendance intelligence — pattern detection (CEO / Admin / Manager only)
router.get(
  '/attendance-intelligence',
  authMiddleware,
  requireCEOAdminOrManager,
  controller.attendanceIntelligence
);

// AI recruitment assistant (CEO / Admin only)
router.post('/recruitment', authMiddleware, requireCEOOrAdmin, controller.generateRecruitment);

export default router;
