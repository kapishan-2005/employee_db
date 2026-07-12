import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import employeeRoutes from "./routes/employeeRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import departmentRoutes from "./routes/departmentRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import aiRoutes from "./routes/ai.routes.js";
import { pool } from "./config/db.js";
import errorHandler from "./middleware/errorHandler.js";
import requestLogger from "./middleware/requestLogger.js";
import sanitizeInput from "./middleware/sanitizer.js";

// Configure dotenv silently
dotenv.config({ override: false });

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Allow inline scripts for development
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
app.use(cors({ 
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging (only in development)
if (process.env.NODE_ENV !== 'production') {
  app.use(requestLogger);
}

// Input sanitization
app.use(sanitizeInput);

// Existing employee routes (unchanged)
app.use("/api/employees", employeeRoutes);

// Authentication routes (Phase 2)
app.use("/api/auth", authRoutes);

// Department routes (Phase 4)
app.use("/api/departments", departmentRoutes);

// Attendance routes (Phase 5)
app.use("/api/attendance", attendanceRoutes);

// Dashboard routes
app.use("/api/dashboard", dashboardRoutes);

// AI Workforce Intelligence routes
app.use("/api/ai", aiRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    error: `Route ${req.method} ${req.path} not found` 
  });
});

// Centralized error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Test database connection on startup
pool.execute('SELECT 1')
  .then(() => {
    console.log('✓ MySQL database connected successfully');
  })
  .catch((err) => {
    console.error('✗ MySQL connection failed:', err.message);
    console.error('  Please check your database credentials in .env file');
  });

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
