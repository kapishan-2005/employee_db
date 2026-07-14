-- ============================================================================
-- MIGRATION 005: Multi-Tenant Organizations
-- ============================================================================
-- Introduces an `organizations` table (one per CEO/company) and attaches
-- `organization_id` to every data table so each company's data is fully
-- isolated from every other company's data.
-- ============================================================================

USE employee_db;

-- ----------------------------------------------------------------------------
-- 1. organizations table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS organizations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  created_by INT NULL COMMENT 'user id of the founding CEO',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 2. Backfill: create a default organization for any data that already
--    exists (from before multi-tenancy existed), so nothing becomes orphaned.
-- ----------------------------------------------------------------------------
INSERT INTO organizations (id, name) VALUES (1, 'Default Organization');

-- ----------------------------------------------------------------------------
-- 3. Add organization_id to every tenant-scoped table
-- ----------------------------------------------------------------------------
ALTER TABLE users ADD COLUMN organization_id INT NULL AFTER role;
ALTER TABLE employees ADD COLUMN organization_id INT NULL AFTER id;
ALTER TABLE departments ADD COLUMN organization_id INT NULL AFTER id;
ALTER TABLE attendance ADD COLUMN organization_id INT NULL AFTER id;
ALTER TABLE activity_logs ADD COLUMN organization_id INT NULL AFTER id;
ALTER TABLE ai_insights ADD COLUMN organization_id INT NULL AFTER id;
ALTER TABLE ai_chat_history ADD COLUMN organization_id INT NULL AFTER id;

-- Backfill all existing rows into the default organization
UPDATE users SET organization_id = 1 WHERE organization_id IS NULL;
UPDATE employees SET organization_id = 1 WHERE organization_id IS NULL;
UPDATE departments SET organization_id = 1 WHERE organization_id IS NULL;
UPDATE attendance SET organization_id = 1 WHERE organization_id IS NULL;
UPDATE activity_logs SET organization_id = 1 WHERE organization_id IS NULL;
UPDATE ai_insights SET organization_id = 1 WHERE organization_id IS NULL;
UPDATE ai_chat_history SET organization_id = 1 WHERE organization_id IS NULL;

-- Now enforce NOT NULL + foreign keys + indexes
ALTER TABLE users MODIFY COLUMN organization_id INT NOT NULL;
ALTER TABLE employees MODIFY COLUMN organization_id INT NOT NULL;
ALTER TABLE departments MODIFY COLUMN organization_id INT NOT NULL;
ALTER TABLE attendance MODIFY COLUMN organization_id INT NOT NULL;
ALTER TABLE activity_logs MODIFY COLUMN organization_id INT NOT NULL;
ALTER TABLE ai_insights MODIFY COLUMN organization_id INT NOT NULL;
ALTER TABLE ai_chat_history MODIFY COLUMN organization_id INT NOT NULL;

ALTER TABLE users ADD CONSTRAINT fk_users_org FOREIGN KEY (organization_id) REFERENCES organizations(id);
ALTER TABLE employees ADD CONSTRAINT fk_employees_org FOREIGN KEY (organization_id) REFERENCES organizations(id);
ALTER TABLE departments ADD CONSTRAINT fk_departments_org FOREIGN KEY (organization_id) REFERENCES organizations(id);
ALTER TABLE attendance ADD CONSTRAINT fk_attendance_org FOREIGN KEY (organization_id) REFERENCES organizations(id);
ALTER TABLE activity_logs ADD CONSTRAINT fk_activity_logs_org FOREIGN KEY (organization_id) REFERENCES organizations(id);
ALTER TABLE ai_insights ADD CONSTRAINT fk_ai_insights_org FOREIGN KEY (organization_id) REFERENCES organizations(id);
ALTER TABLE ai_chat_history ADD CONSTRAINT fk_ai_chat_org FOREIGN KEY (organization_id) REFERENCES organizations(id);

CREATE INDEX idx_users_org ON users(organization_id);
CREATE INDEX idx_employees_org ON employees(organization_id);
CREATE INDEX idx_departments_org ON departments(organization_id);
CREATE INDEX idx_attendance_org ON attendance(organization_id);
CREATE INDEX idx_activity_logs_org ON activity_logs(organization_id);
CREATE INDEX idx_ai_insights_org ON ai_insights(organization_id);
CREATE INDEX idx_ai_chat_org ON ai_chat_history(organization_id);

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
