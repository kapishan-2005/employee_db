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
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes (no authentication required)
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected routes (authentication required)
router.get('/me', authMiddleware, authController.getCurrentUser);
router.post('/logout', authMiddleware, authController.logout);

export default router;
