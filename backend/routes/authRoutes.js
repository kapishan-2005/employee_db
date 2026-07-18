/**
 * Authentication Routes
 * 
 * Real company workflow authentication:
 * - POST /api/auth/signup-company - Start Free (CEO creates company)
 * - POST /api/auth/login - Single login for all roles
 * - POST /api/auth/invite - Invite users (role-based)
 * - GET /api/auth/verify-invitation/:token - Verify invitation
 * - POST /api/auth/accept-invitation - Accept invitation & create account
 * - GET /api/auth/invitations - Get all invitations
 * - DELETE /api/auth/invitations/:id - Cancel invitation
 * - GET /api/auth/me - Get current user info
 * - POST /api/auth/logout - Logout
 */

import express from 'express';
import * as authController from '../controllers/authController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';

const router = express.Router();

// ============================================================================
// PUBLIC ROUTES (No authentication required)
// ============================================================================

// Company Registration (Start Free) - Creates CEO + Company
router.post('/signup-company', authController.registerCompany);

// Login (Single login for all roles)
router.post('/login', authController.login);

// Verify invitation token
router.get('/verify-invitation/:token', authController.verifyInvitation);

// Accept invitation and create account
router.post('/accept-invitation', authController.acceptInvitation);

// ============================================================================
// PROTECTED ROUTES (Authentication required)
// ============================================================================

// Get current user info
router.get('/me', authMiddleware, authController.getCurrentUser);

// Logout
router.post('/logout', authMiddleware, authController.logout);

// Invite user (role-based: CEO invites HR, HR invites Manager, Manager invites Employee)
router.post('/invite', authMiddleware, authController.inviteUser);

// Get all invitations for company (CEO, HR, Manager can view)
router.get('/invitations', 
  authMiddleware, 
  requireRole('ceo', 'hr', 'manager'), 
  authController.getInvitations
);

// Cancel invitation
router.delete('/invitations/:id', 
  authMiddleware, 
  requireRole('ceo', 'hr', 'manager'), 
  authController.cancelInvitation
);

// Get all users (CEO and HR only)
router.get('/users', authMiddleware, requireRole('ceo', 'hr'), authController.getAllUsers);

// Create user directly (CEO and HR only) - bypasses invitation flow
router.post('/users', authMiddleware, requireRole('ceo', 'hr'), authController.createUser);

// ============================================================================
// PASSWORD MANAGEMENT
// ============================================================================

// Change password (authenticated users)
router.post('/change-password', authMiddleware, authController.changePassword);

// Forgot password (public)
router.post('/forgot-password', authController.forgotPassword);

// Reset password with token (public)
router.post('/reset-password', authController.resetPassword);

// Get login history (authenticated users)
router.get('/login-history', authMiddleware, authController.getLoginHistory);

export default router;
