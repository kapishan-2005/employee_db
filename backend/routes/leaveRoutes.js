import express from 'express';
import * as leaveController from '../controllers/leaveController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { requireManagementRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Everyone can apply for leave and see their own history
router.post('/', authMiddleware, leaveController.applyLeave);
router.get('/my-history', authMiddleware, leaveController.getMyLeaveHistory);
router.delete('/:id', authMiddleware, leaveController.cancelLeave);

// Role-aware list: CEO/HR see company-wide, Manager sees their departments,
// Employee falls back to their own requests (handled in controller)
router.get('/', authMiddleware, leaveController.getLeaveRequests);

// Approve / reject \u2014 CEO, HR, or Manager only
router.put('/:id/approve', authMiddleware, requireManagementRoles, leaveController.approveLeave);
router.put('/:id/reject', authMiddleware, requireManagementRoles, leaveController.rejectLeave);

export default router;
