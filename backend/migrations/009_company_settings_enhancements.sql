-- ============================================================================
-- MIGRATION 009: Company Settings Enhancements
-- ============================================================================
-- Adds additional company settings fields:
-- - Break time fields (break_time_start, break_time_end)
-- - Lunch time fields (lunch_time_start, lunch_time_end)
-- ============================================================================

USE employee_db;

-- Add new time fields to organizations table
ALTER TABLE organizations 
  ADD COLUMN break_time_start TIME NULL COMMENT 'Morning break start time',
  ADD COLUMN break_time_end TIME NULL COMMENT 'Morning break end time',
  ADD COLUMN lunch_time_start TIME NULL COMMENT 'Lunch break start time',
  ADD COLUMN lunch_time_end TIME NULL COMMENT 'Lunch break end time';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
