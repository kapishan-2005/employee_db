import express from "express";
import * as controller from "../controllers/departmentController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";

const router = express.Router();

/**
 * Department Management Routes
 * 
 * Role-based access control:
 * - CEO: Full access (view, create, edit, activate/deactivate, assign managers, delete)
 * - HR: View, create, edit, view details (cannot delete)
 * - Manager: View their assigned department and employees only
 * - Employee: View their own department information only
 */

// GET routes
// CEO, HR, Manager can view all departments
// Employee access filtered in controller
router.get("/", authMiddleware, controller.getAllDepartments);

// CEO, HR, Manager can view department employees
// Employee access filtered in controller
router.get("/:id/employees", authMiddleware, controller.getDepartmentEmployees);

// CEO, HR can view department stats
router.get("/:id/stats", authMiddleware, requireRole('ceo', 'hr'), controller.getDepartmentStats);

// All authenticated users can view specific department
// Access filtered in controller based on role
router.get("/:id", authMiddleware, controller.getDepartmentById);

// POST routes - CEO and HR can create departments
router.post("/", authMiddleware, requireRole('ceo', 'hr'), controller.createDepartment);

// PUT routes - CEO and HR can update departments
router.put("/:id", authMiddleware, requireRole('ceo', 'hr'), controller.updateDepartment);

// PATCH routes - CEO can assign/change manager, activate/deactivate
router.patch("/:id/manager", authMiddleware, requireRole('ceo'), controller.assignManager);
router.patch("/:id/status", authMiddleware, requireRole('ceo'), controller.toggleStatus);

// DELETE routes - CEO only (soft delete by deactivating is preferred)
router.delete("/:id", authMiddleware, requireRole('ceo'), controller.deleteDepartment);

export default router;
