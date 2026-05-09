import dotenv from 'dotenv';

dotenv.config();

// Server Configuration
export const PORT = process.env.PORT || 5000;

// Database Configuration
export const DB_HOST = process.env.DB_HOST || 'localhost';
export const DB_USER = process.env.DB_USER || 'root';
export const DB_PASSWORD = process.env.DB_PASSWORD || '';
export const DB_NAME = process.env.DB_NAME || 'employee_db';

// JWT Configuration (Phase 2)
export const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_this_in_production';
export const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';