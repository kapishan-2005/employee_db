/**
 * Organization Routes
 * 
 * Handles company/organization settings
 * - GET /api/organization/settings - Get organization settings (CEO/HR)
 * - PUT /api/organization/settings - Update organization settings (CEO only)
 * - POST /api/organization/complete-setup - Complete initial setup wizard (CEO only)
 * - GET /api/organization/setup-status - Check if setup is completed
 */

import express from 'express';
import * as controller from '../controllers/organizationController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Get organization settings (CEO/HR can view)
router.get('/settings', requireRole('ceo', 'hr'), controller.getSettings);

// Update organization settings (CEO only)
router.put('/settings', requireRole('ceo'), controller.updateSettings);

// Complete initial setup wizard (CEO only)
router.post('/complete-setup', requireRole('ceo'), controller.completeSetup);

// Check setup status (all authenticated users)
router.get('/setup-status', controller.getSetupStatus);

export default router;
