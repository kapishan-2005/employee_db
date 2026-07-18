/**
 * Migration: Company Settings
 * 
 * Adds company configuration fields:
 * - Logo
 * - Address
 * - Country
 * - Timezone
 * - Industry
 * - Company size
 * - Working days/hours
 * - Setup completion tracking
 */

-- ============================================================================
-- Company Settings Fields
-- ============================================================================

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS logo_url VARCHAR(500) NULL AFTER name,
ADD COLUMN IF NOT EXISTS address TEXT NULL,
ADD COLUMN IF NOT EXISTS city VARCHAR(100) NULL,
ADD COLUMN IF NOT EXISTS state VARCHAR(100) NULL,
ADD COLUMN IF NOT EXISTS country VARCHAR(100) NULL DEFAULT 'United States',
ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20) NULL,
ADD COLUMN IF NOT EXISTS timezone VARCHAR(100) NULL DEFAULT 'America/New_York',
ADD COLUMN IF NOT EXISTS industry VARCHAR(100) NULL,
ADD COLUMN IF NOT EXISTS company_size VARCHAR(50) NULL,
ADD COLUMN IF NOT EXISTS working_days JSON NULL DEFAULT '["Monday","Tuesday","Wednesday","Thursday","Friday"]',
ADD COLUMN IF NOT EXISTS office_hours_start TIME NULL DEFAULT '09:00:00',
ADD COLUMN IF NOT EXISTS office_hours_end TIME NULL DEFAULT '17:00:00',
ADD COLUMN IF NOT EXISTS description TEXT NULL,
ADD COLUMN IF NOT EXISTS setup_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS setup_completed_at DATETIME NULL;

-- Index for quick lookup of incomplete setups
CREATE INDEX IF NOT EXISTS idx_setup_completed ON organizations(setup_completed);
