import express from "express";
import * as controller from "../controllers/departmentController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";

const router = express.Router();

// GET routes - all authenticated users can view
router.get("/", authMiddleware, controller.getAllDepartments);
router.get("/:id/employees", authMiddleware, controller.getDepartmentEmployees);
router.get("/:id/stats", authMiddleware, controller.getDepartmentStats);
router.get("/:id", authMiddleware, controller.getDepartmentById);

// POST/PUT routes - admin only
router.post("/", authMiddleware, requireRole('admin'), controller.createDepartment);
router.put("/:id", authMiddleware, requireRole('admin'), controller.updateDepartment);

// DELETE routes - admin only
router.delete("/:id", authMiddleware, requireRole('admin'), controller.deleteDepartment);

export default router;
