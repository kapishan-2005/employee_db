-- ============================================================================
-- DATABASE SCHEMA - EMPLOYEE MANAGEMENT SYSTEM
-- ============================================================================
-- Version: 1.0
-- Description: Complete database schema for employee management system
-- ============================================================================

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS employee_db;
USE employee_db;

-- ============================================================================
-- TABLE: employees
-- ============================================================================
CREATE TABLE IF NOT EXISTS employees (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  course VARCHAR(255) NOT NULL,
  roll_no VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(255) NULL UNIQUE,
  phone VARCHAR(20) NULL,
  department_id INT NULL,
  position VARCHAR(100) NULL,
  hire_date DATE NULL,
  salary DECIMAL(10,2) NULL,
  status ENUM('active', 'inactive', 'on_leave') DEFAULT 'active',
  address TEXT NULL,
  profile_picture VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE: departments
-- ============================================================================
CREATE TABLE IF NOT EXISTS departments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  head_id INT NULL COMMENT 'Foreign key to employees.id (department head)',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE: users
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'manager', 'employee') DEFAULT 'employee',
  employee_id INT NULL COMMENT 'Links to employees.id if user is an employee',
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE: attendance
-- ============================================================================
CREATE TABLE IF NOT EXISTS attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  date DATE NOT NULL,
  check_in TIME NULL,
  check_out TIME NULL,
  status ENUM('present', 'absent', 'late', 'half_day', 'leave') DEFAULT 'present',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_employee_date (employee_id, date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE: notifications
-- ============================================================================
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('info', 'success', 'warning', 'error') DEFAULT 'info',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE: activity_logs
-- ============================================================================
CREATE TABLE IF NOT EXISTS activity_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NULL COMMENT 'e.g., employee, department, attendance',
  entity_id INT NULL COMMENT 'ID of the affected entity',
  details TEXT NULL COMMENT 'JSON or text description of the action',
  ip_address VARCHAR(45) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- FOREIGN KEY CONSTRAINTS
-- ============================================================================

-- Check and add foreign key for employees.department_id
SET @fk_exists = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
  WHERE CONSTRAINT_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'employees' 
    AND CONSTRAINT_NAME = 'fk_employees_department'
);

SET @sql = IF(@fk_exists = 0,
  'ALTER TABLE employees ADD CONSTRAINT fk_employees_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL',
  'SELECT "Foreign key fk_employees_department already exists" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add foreign key for users.employee_id
SET @fk_exists = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
  WHERE CONSTRAINT_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'users' 
    AND CONSTRAINT_NAME = 'fk_users_employee'
);

SET @sql = IF(@fk_exists = 0,
  'ALTER TABLE users ADD CONSTRAINT fk_users_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL',
  'SELECT "Foreign key fk_users_employee already exists" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add foreign key for attendance.employee_id
SET @fk_exists = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
  WHERE CONSTRAINT_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'attendance' 
    AND CONSTRAINT_NAME = 'fk_attendance_employee'
);

SET @sql = IF(@fk_exists = 0,
  'ALTER TABLE attendance ADD CONSTRAINT fk_attendance_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE',
  'SELECT "Foreign key fk_attendance_employee already exists" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add foreign key for notifications.user_id
SET @fk_exists = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
  WHERE CONSTRAINT_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'notifications' 
    AND CONSTRAINT_NAME = 'fk_notifications_user'
);

SET @sql = IF(@fk_exists = 0,
  'ALTER TABLE notifications ADD CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE',
  'SELECT "Foreign key fk_notifications_user already exists" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add foreign key for activity_logs.user_id
SET @fk_exists = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
  WHERE CONSTRAINT_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'activity_logs' 
    AND CONSTRAINT_NAME = 'fk_activity_logs_user'
);

SET @sql = IF(@fk_exists = 0,
  'ALTER TABLE activity_logs ADD CONSTRAINT fk_activity_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL',
  'SELECT "Foreign key fk_activity_logs_user already exists" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================================================
-- SCHEMA COMPLETE
-- ============================================================================
