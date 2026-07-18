/**
 * CEO Dashboard Routes
 * 
 * Routes for CEO-specific dashboard endpoints
 */

import express from 'express';
import * as controller from '../controllers/ceoDashboardController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
// CEO role verification is handled in controllers

// GET complete CEO dashboard (consolidated endpoint)
router.get('/', authMiddleware, controller.getCEODashboard);

// GET individual sections (optional granular endpoints)
router.get('/kpis', authMiddleware, controller.getKPIs);
router.get('/workforce-growth', authMiddleware, controller.getWorkforceGrowth);
router.get('/department-distribution', authMiddleware, controller.getDepartmentDistribution);

export default router;
