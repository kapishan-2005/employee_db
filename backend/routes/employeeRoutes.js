import express from "express";
import * as controller from "../controllers/employeeController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";

const router = express.Router();

/**
 * Employee Management Routes
 * 
 * Role-based access control:
 * - CEO: Full access (view all, create, edit, delete)
 * - HR: Full employee management (view all, create, edit, activate/deactivate)
 * - Manager: View employees in their department only, cannot create/edit/delete
 * - Employee: View own profile only, cannot create/edit/delete
 */

// GET routes - all authenticated users (filtered by role in controller)
router.get("/", authMiddleware, controller.getAllEmployees);
router.get("/:id", authMiddleware, controller.getEmployeeById);

// POST routes - CEO and HR can create employees
router.post("/", authMiddleware, requireRole('ceo', 'hr'), controller.createEmployee);

// PUT/PATCH routes - CEO and HR can update employees
router.put("/:id", authMiddleware, requireRole('ceo', 'hr'), controller.updateEmployee);
router.patch("/:id", authMiddleware, requireRole('ceo', 'hr'), controller.patchEmployee);

// DELETE routes - CEO only
router.delete("/:id", authMiddleware, requireRole('ceo'), controller.deleteEmployee);

export default router;
