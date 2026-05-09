import express from 'express';
import * as controller from '../controllers/dashboardController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// All dashboard routes require authentication
// Role-based filtering is handled in the controller

// GET dashboard overview
router.get('/overview', authMiddleware, controller.getOverview);

// GET recent activity
router.get('/recent-activity', authMiddleware, controller.getRecentActivity);

export default router;
