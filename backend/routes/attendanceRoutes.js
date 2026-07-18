import express from "express";
import * as controller from "../controllers/attendanceController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";

const router = express.Router();

// GET attendance report - ceo, hr and manager only
router.get("/report", authMiddleware, requireRole('ceo', 'hr', 'manager'), controller.getAttendanceReport);

// POST check-in/check-out - all authenticated users
router.post("/check-in", authMiddleware, controller.checkIn);
router.post("/check-out", authMiddleware, controller.checkOut);

// GET employee attendance - all authenticated users (controller will filter by role)
router.get("/employee/:employeeId", authMiddleware, controller.getEmployeeAttendance);

// GET all attendance records - all authenticated users (controller will filter by role)
router.get("/", authMiddleware, controller.getAllAttendance);

// GET attendance by ID - all authenticated users
router.get("/:id", authMiddleware, controller.getAttendanceById);

// PUT update attendance - ceo, hr and manager only
router.put("/:id", authMiddleware, requireRole('ceo', 'hr', 'manager'), controller.updateAttendance);

export default router;
