-- ============================================================================
-- DATABASE INDEXES - EMPLOYEE MANAGEMENT SYSTEM
-- ============================================================================
-- Version: 1.0
-- Description: Performance optimization indexes for all tables
-- ============================================================================

USE employee_db;

-- ============================================================================
-- EMPLOYEES TABLE INDEXES
-- ============================================================================
CREATE INDEX idx_employees_name ON employees(name);
CREATE INDEX idx_employees_course ON employees(course);
CREATE INDEX idx_employees_roll_no ON employees(roll_no);
CREATE INDEX idx_employees_email ON employees(email);
CREATE INDEX idx_employees_department ON employees(department_id);
CREATE INDEX idx_employees_status ON employees(status);
CREATE INDEX idx_employees_created_at ON employees(created_at);

-- ============================================================================
-- DEPARTMENTS TABLE INDEXES
-- ============================================================================
CREATE INDEX idx_departments_name ON departments(name);
CREATE INDEX idx_departments_is_active ON departments(is_active);

-- ============================================================================
-- USERS TABLE INDEXES
-- ============================================================================
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_employee_id ON users(employee_id);

-- ============================================================================
-- ATTENDANCE TABLE INDEXES
-- ============================================================================
CREATE INDEX idx_attendance_employee ON attendance(employee_id);
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_attendance_status ON attendance(status);
CREATE INDEX idx_attendance_employee_date ON attendance(employee_id, date);
CREATE INDEX idx_attendance_date_status ON attendance(date, status);

-- ============================================================================
-- NOTIFICATIONS TABLE INDEXES
-- ============================================================================
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- ============================================================================
-- ACTIVITY_LOGS TABLE INDEXES
-- ============================================================================
CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created ON activity_logs(created_at);
CREATE INDEX idx_activity_logs_entity ON activity_logs(entity_type, entity_id);

-- ============================================================================
-- INDEXES COMPLETE
-- ============================================================================
