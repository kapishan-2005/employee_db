-- ============================================================================
-- MIGRATION 006: Real Company Workflow
-- ============================================================================
-- Transforms the system to follow real company workflow:
-- - CEO creates company and invites HR
-- - HR invites Managers
-- - Managers invite Employees
-- - All invitations use secure tokens
-- ============================================================================

USE employee_db;

-- ============================================================================
-- 1. Update users table for invitation-based workflow
-- ============================================================================

-- Add invitation-related columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS invited_by INT NULL COMMENT 'User ID who sent the invitation',
ADD COLUMN IF NOT EXISTS invitation_accepted_at TIMESTAMP NULL COMMENT 'When user accepted invitation',
ADD COLUMN IF NOT EXISTS status ENUM('pending', 'active', 'inactive', 'suspended') DEFAULT 'active' COMMENT 'User account status';

-- Update existing role enum to include new roles
ALTER TABLE users 
MODIFY COLUMN role ENUM('ceo', 'hr', 'manager', 'employee', 'admin') DEFAULT 'employee';

-- Add foreign key for invited_by
ALTER TABLE users 
ADD CONSTRAINT fk_users_invited_by 
FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_users_invited_by ON users(invited_by);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- ============================================================================
-- 2. Create invitations table
-- ============================================================================

CREATE TABLE IF NOT EXISTS invitations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL COMMENT 'Company this invitation belongs to',
  email VARCHAR(255) NOT NULL,
  role ENUM('hr', 'manager', 'employee') NOT NULL COMMENT 'Role for the invited user',
  token VARCHAR(255) UNIQUE NOT NULL COMMENT 'Secure invitation token',
  invited_by INT NOT NULL COMMENT 'User who sent the invitation',
  expires_at TIMESTAMP NOT NULL COMMENT 'Invitation expiration time',
  accepted_at TIMESTAMP NULL COMMENT 'When invitation was accepted',
  status ENUM('pending', 'accepted', 'expired', 'cancelled') DEFAULT 'pending',
  metadata JSON NULL COMMENT 'Additional data (department_id, project_id, etc.)',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_invitations_company FOREIGN KEY (company_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT fk_invitations_invited_by FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_invitations_email ON invitations(email);
CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_company ON invitations(company_id);
CREATE INDEX idx_invitations_status ON invitations(status);
CREATE INDEX idx_invitations_expires ON invitations(expires_at);

-- ============================================================================
-- 3. Create projects table
-- ============================================================================

CREATE TABLE IF NOT EXISTS projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  department_id INT NULL,
  manager_id INT NULL COMMENT 'User ID of project manager',
  start_date DATE NULL,
  end_date DATE NULL,
  status ENUM('planning', 'active', 'on_hold', 'completed', 'cancelled') DEFAULT 'planning',
  priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
  budget DECIMAL(12,2) NULL,
  progress INT DEFAULT 0 COMMENT 'Progress percentage 0-100',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_projects_company FOREIGN KEY (company_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT fk_projects_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
  CONSTRAINT fk_projects_manager FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_projects_company ON projects(company_id);
CREATE INDEX idx_projects_department ON projects(department_id);
CREATE INDEX idx_projects_manager ON projects(manager_id);
CREATE INDEX idx_projects_status ON projects(status);

-- ============================================================================
-- 4. Create tasks table
-- ============================================================================

CREATE TABLE IF NOT EXISTS tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  project_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  assigned_to INT NULL COMMENT 'Employee user ID',
  assigned_by INT NULL COMMENT 'Manager user ID who assigned',
  status ENUM('todo', 'in_progress', 'review', 'completed', 'blocked') DEFAULT 'todo',
  priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
  due_date DATE NULL,
  estimated_hours DECIMAL(5,2) NULL,
  actual_hours DECIMAL(5,2) NULL,
  completed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_tasks_company FOREIGN KEY (company_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT fk_tasks_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  CONSTRAINT fk_tasks_assigned_to FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_tasks_assigned_by FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_tasks_company ON tasks(company_id);
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_assigned_by ON tasks(assigned_by);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);

-- ============================================================================
-- 5. Create leave_requests table
-- ============================================================================

CREATE TABLE IF NOT EXISTS leave_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  employee_id INT NOT NULL COMMENT 'User ID of employee',
  leave_type ENUM('sick', 'casual', 'vacation', 'unpaid', 'maternity', 'paternity', 'other') NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days INT NOT NULL,
  reason TEXT,
  status ENUM('pending', 'approved', 'rejected', 'cancelled') DEFAULT 'pending',
  reviewed_by INT NULL COMMENT 'HR user ID who reviewed',
  reviewed_at TIMESTAMP NULL,
  review_notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_leave_requests_company FOREIGN KEY (company_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT fk_leave_requests_employee FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_leave_requests_reviewed_by FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_leave_requests_company ON leave_requests(company_id);
CREATE INDEX idx_leave_requests_employee ON leave_requests(employee_id);
CREATE INDEX idx_leave_requests_status ON leave_requests(status);
CREATE INDEX idx_leave_requests_dates ON leave_requests(start_date, end_date);

-- ============================================================================
-- 6. Create announcements table
-- ============================================================================

CREATE TABLE IF NOT EXISTS announcements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  type ENUM('general', 'urgent', 'event', 'policy', 'holiday') DEFAULT 'general',
  priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
  published_by INT NOT NULL COMMENT 'HR/CEO user ID',
  target_audience ENUM('all', 'managers', 'employees', 'specific_department') DEFAULT 'all',
  department_id INT NULL COMMENT 'If target is specific_department',
  is_published BOOLEAN DEFAULT TRUE,
  published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NULL COMMENT 'Optional expiration date',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_announcements_company FOREIGN KEY (company_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT fk_announcements_published_by FOREIGN KEY (published_by) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_announcements_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_announcements_company ON announcements(company_id);
CREATE INDEX idx_announcements_published_by ON announcements(published_by);
CREATE INDEX idx_announcements_target ON announcements(target_audience);
CREATE INDEX idx_announcements_published_at ON announcements(published_at);

-- ============================================================================
-- 7. Create documents table
-- ============================================================================

CREATE TABLE IF NOT EXISTS documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_type VARCHAR(50),
  file_size BIGINT COMMENT 'File size in bytes',
  category ENUM('policy', 'handbook', 'form', 'contract', 'certificate', 'other') DEFAULT 'other',
  uploaded_by INT NOT NULL COMMENT 'HR/CEO user ID',
  is_public BOOLEAN DEFAULT FALSE COMMENT 'Visible to all employees',
  department_id INT NULL COMMENT 'Department-specific document',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_documents_company FOREIGN KEY (company_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT fk_documents_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_documents_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_documents_company ON documents(company_id);
CREATE INDEX idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX idx_documents_category ON documents(category);
CREATE INDEX idx_documents_department ON documents(department_id);

-- ============================================================================
-- 8. Update existing tables to align with new workflow
-- ============================================================================

-- Add manager_id to departments (manager who leads the department)
ALTER TABLE departments 
ADD COLUMN IF NOT EXISTS manager_id INT NULL COMMENT 'Manager user ID who leads this department' AFTER head_id,
ADD CONSTRAINT fk_departments_manager FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_departments_manager ON departments(manager_id);

-- Update employees table to link with user accounts properly
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS user_id INT NULL COMMENT 'Linked user account' AFTER id,
ADD CONSTRAINT fk_employees_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_employees_user ON employees(user_id);

-- ============================================================================
-- 9. Rename organization_id to company_id for clarity (Optional)
-- ============================================================================
-- Note: This is a major change. If you want to keep "organization_id", 
-- you can skip this section. Otherwise, this renames for clarity.

-- This would require updating all tables and code.
-- For now, we'll keep organization_id but treat it as company_id conceptually.
-- Future refactor can rename the column if needed.

-- ============================================================================
-- 10. Data cleanup and validation
-- ============================================================================

-- Update existing admin users to CEO role if they're the first user in their org
UPDATE users u
SET role = 'ceo'
WHERE role = 'admin' 
AND id = (
  SELECT MIN(id) 
  FROM (SELECT id, organization_id FROM users) AS u2 
  WHERE u2.organization_id = u.organization_id
);

-- Set status for all existing users to 'active'
UPDATE users SET status = 'active' WHERE status IS NULL;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Next steps:
-- 1. Update backend models for new tables
-- 2. Update controllers for invitation workflow
-- 3. Update frontend for new user flow
-- ============================================================================
