-- ============================================================================
-- MIGRATION 003: Add CEO Role
-- ============================================================================
-- Adds 'ceo' to the users.role ENUM, sitting above admin/manager/employee
-- in the access hierarchy. Existing rows are untouched.
-- ============================================================================

USE employee_db;

ALTER TABLE users
  MODIFY COLUMN role ENUM('ceo', 'admin', 'manager', 'employee') DEFAULT 'employee';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
