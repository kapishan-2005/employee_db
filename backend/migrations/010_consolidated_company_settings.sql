-- ============================================================================
-- MIGRATION 010: Consolidated Company Settings (Safe Upgrade)
-- ============================================================================
-- This migration safely adds all company settings columns to the organizations
-- table. It consolidates migrations 008 and 009 that were not yet applied.
--
-- Safe features:
-- - Uses IF NOT EXISTS to avoid errors if columns already exist
-- - Preserves all existing data
-- - Adds columns one at a time for compatibility
-- - Includes comments for documentation
-- ============================================================================

-- Select the database
USE employee_db;

-- ============================================================================
-- PART 1: Basic Company Information Fields
-- ============================================================================

-- Logo URL
ALTER TABLE organizations 
  ADD COLUMN IF NOT EXISTS logo_url VARCHAR(500) NULL 
  COMMENT 'Company logo URL (base64 or cloud storage URL)';

-- Physical Address Fields
ALTER TABLE organizations 
  ADD COLUMN IF NOT EXISTS address TEXT NULL 
  COMMENT 'Street address';

ALTER TABLE organizations 
  ADD COLUMN IF NOT EXISTS city VARCHAR(100) NULL 
  COMMENT 'City';

ALTER TABLE organizations 
  ADD COLUMN IF NOT EXISTS state VARCHAR(100) NULL 
  COMMENT 'State/Province/Region';

ALTER TABLE organizations 
  ADD COLUMN IF NOT EXISTS country VARCHAR(100) NULL DEFAULT 'United States' 
  COMMENT 'Country';

ALTER TABLE organizations 
  ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20) NULL 
  COMMENT 'Postal/ZIP code';

-- Timezone
ALTER TABLE organizations 
  ADD COLUMN IF NOT EXISTS timezone VARCHAR(100) NULL DEFAULT 'America/New_York' 
  COMMENT 'IANA timezone identifier';

-- ============================================================================
-- PART 2: Company Profile Fields
-- ============================================================================

-- Industry
ALTER TABLE organizations 
  ADD COLUMN IF NOT EXISTS industry VARCHAR(100) NULL 
  COMMENT 'Industry/sector';

-- Company Size
ALTER TABLE organizations 
  ADD COLUMN IF NOT EXISTS company_size VARCHAR(50) NULL 
  COMMENT 'Company size range (e.g., 1-10, 11-50)';

-- Description
ALTER TABLE organizations 
  ADD COLUMN IF NOT EXISTS description TEXT NULL 
  COMMENT 'Company description';

-- ============================================================================
-- PART 3: Working Schedule Fields
-- ============================================================================

-- Working Days (JSON array)
ALTER TABLE organizations 
  ADD COLUMN IF NOT EXISTS working_days JSON NULL 
  DEFAULT (JSON_ARRAY('Monday','Tuesday','Wednesday','Thursday','Friday'))
  COMMENT 'Working days as JSON array';

-- Office Hours
ALTER TABLE organizations 
  ADD COLUMN IF NOT EXISTS office_hours_start TIME NULL DEFAULT '09:00:00' 
  COMMENT 'Office start time';

ALTER TABLE organizations 
  ADD COLUMN IF NOT EXISTS office_hours_end TIME NULL DEFAULT '17:00:00' 
  COMMENT 'Office end time';

-- Break Times (Optional)
ALTER TABLE organizations 
  ADD COLUMN IF NOT EXISTS break_time_start TIME NULL 
  COMMENT 'Morning break start time (optional)';

ALTER TABLE organizations 
  ADD COLUMN IF NOT EXISTS break_time_end TIME NULL 
  COMMENT 'Morning break end time (optional)';

-- Lunch Times (Optional)
ALTER TABLE organizations 
  ADD COLUMN IF NOT EXISTS lunch_time_start TIME NULL 
  COMMENT 'Lunch break start time (optional)';

ALTER TABLE organizations 
  ADD COLUMN IF NOT EXISTS lunch_time_end TIME NULL 
  COMMENT 'Lunch break end time (optional)';

-- ============================================================================
-- PART 4: Setup Completion Tracking
-- ============================================================================

-- Setup Completed Flag
ALTER TABLE organizations 
  ADD COLUMN IF NOT EXISTS setup_completed BOOLEAN DEFAULT FALSE 
  COMMENT 'Whether initial setup wizard was completed';

-- Setup Completed Timestamp
ALTER TABLE organizations 
  ADD COLUMN IF NOT EXISTS setup_completed_at DATETIME NULL 
  COMMENT 'When setup was completed';

-- ============================================================================
-- PART 5: Indexes for Performance
-- ============================================================================

-- Index for quick lookup of incomplete setups (used by CEO dashboard routing)
-- Note: IF NOT EXISTS is not supported for indexes in all MySQL versions
-- We'll create this conditionally

-- Check if index exists, if not create it
SET @index_exists = (
  SELECT COUNT(*)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
  AND table_name = 'organizations'
  AND index_name = 'idx_setup_completed'
);

SET @sql = IF(
  @index_exists = 0,
  'CREATE INDEX idx_setup_completed ON organizations(setup_completed)',
  'SELECT "Index idx_setup_completed already exists" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================================================
-- MIGRATION VERIFICATION
-- ============================================================================
-- After running this migration, verify with:
-- DESCRIBE organizations;
--
-- Expected columns should include:
-- - id, name, created_by, created_at (original)
-- - logo_url, address, city, state, country, postal_code, timezone
-- - industry, company_size, description
-- - working_days, office_hours_start, office_hours_end
-- - break_time_start, break_time_end, lunch_time_start, lunch_time_end
-- - setup_completed, setup_completed_at
-- ============================================================================

-- Success message
SELECT 'Migration 010: Consolidated Company Settings - COMPLETED' AS status;

