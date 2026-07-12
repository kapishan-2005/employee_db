import express from "express";
import * as controller from "../controllers/employeeController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";

const router = express.Router();

// GET routes - all authenticated users can view
router.get("/", authMiddleware, controller.getAllEmployees);
router.get("/:id", authMiddleware, controller.getEmployeeById);

// POST/PUT/PATCH routes - ceo, admin and manager only
router.post("/", authMiddleware, requireRole('ceo', 'admin', 'manager'), controller.createEmployee);
router.put("/:id", authMiddleware, requireRole('ceo', 'admin', 'manager'), controller.updateEmployee);
router.patch("/:id", authMiddleware, requireRole('ceo', 'admin', 'manager'), controller.patchEmployee);

// DELETE routes - ceo and admin only
router.delete("/:id", authMiddleware, requireRole('ceo', 'admin'), controller.deleteEmployee);

export default router;
