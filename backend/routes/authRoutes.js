/**
 * Authentication Routes
 * 
 * Handles user authentication endpoints:
 * - POST /api/auth/register - Register new user
 * - POST /api/auth/login - Login user
 * - GET /api/auth/me - Get current user info (requires auth)
 * - POST /api/auth/logout - Logout user (requires auth)
 */

import express from 'express';
import * as authController from '../controllers/authController.js';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/authMiddleware.js';
import { requireCEOOrAdmin } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Registration: open only for the very first (CEO) account.
// After that, authController.register requires req.user to be ceo/admin.
router.post('/register', optionalAuthMiddleware, authController.register);
router.post('/login', authController.login);

// Protected routes (authentication required)
router.get('/me', authMiddleware, authController.getCurrentUser);
router.get('/users', authMiddleware, requireCEOOrAdmin, authController.getAllUsers);
router.post('/logout', authMiddleware, authController.logout);

export default router;
