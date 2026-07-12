import dotenv from 'dotenv';

dotenv.config({ override: false });

// Server Configuration
export const PORT = process.env.PORT || 5000;

// Database Configuration
export const DB_HOST = process.env.DB_HOST;
export const DB_USER = process.env.DB_USER;
export const DB_PASSWORD = process.env.DB_PASSWORD;
export const DB_NAME = process.env.DB_NAME;

// JWT Configuration (Phase 2)
export const JWT_SECRET = process.env.JWT_SECRET;
export const JWT_EXPIRE = process.env.JWT_EXPIRE;

// Google Gemini AI Configuration
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
export const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';