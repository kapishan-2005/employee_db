import express from 'express';
import * as controller from '../controllers/ai.controller.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';

const router = express.Router();

// All AI routes require authentication. The AI assistant is available to every
// role (chat persona changes based on req.user.role) — extra role gates are
// applied only to endpoints that touch company-wide / other-employee data.

// Chat with the role-based AI assistant
router.post('/chat', authMiddleware, controller.chat);
router.get('/chat/history', authMiddleware, controller.getChatHistory);

// Stored insights for the current user
router.get('/insights', authMiddleware, controller.getInsights);

// Generate fresh company-wide insights (CEO / HR only)
router.post('/insights/generate', authMiddleware, requireRole('ceo', 'hr'), controller.generateInsights);

// Employee performance analysis (CEO / HR / Manager only)
router.post(
  '/performance/:employeeId',
  authMiddleware,
  requireRole('ceo', 'hr', 'manager'),
  controller.analyzePerformance
);

// Attendance intelligence — pattern detection (CEO / HR / Manager only)
router.get(
  '/attendance-intelligence',
  authMiddleware,
  requireRole('ceo', 'hr', 'manager'),
  controller.attendanceIntelligence
);

// AI recruitment assistant (CEO / HR only)
router.post('/recruitment', authMiddleware, requireRole('ceo', 'hr'), controller.generateRecruitment);

export default router;
