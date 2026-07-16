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
import { requireCEOOrAdmin } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Sign up a brand-new company — always public, always creates a CEO + org
router.post('/signup-company', authController.registerCompany);

// Register a sub-account inside an existing company — always requires an
// authenticated CEO/Admin token (enforced inside the controller).
router.post('/register', authMiddleware, authController.register);
router.post('/login', authController.login);

// Protected routes (authentication required)
router.get('/me', authMiddleware, authController.getCurrentUser);
router.get('/users', authMiddleware, requireCEOOrAdmin, authController.getAllUsers);
router.post('/logout', authMiddleware, authController.logout);

export default router;
