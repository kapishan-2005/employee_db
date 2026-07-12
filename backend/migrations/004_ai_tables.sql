-- ============================================================================
-- MIGRATION 004: AI Tables
-- ============================================================================
-- Adds tables to support the AI Workforce Intelligence features:
--   - ai_insights: stored AI-generated insights per role/user
--   - ai_chat_history: stored AI assistant conversations
-- ============================================================================

USE employee_db;

-- ============================================================================
-- TABLE: ai_insights
-- ============================================================================
CREATE TABLE IF NOT EXISTS ai_insights (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  role ENUM('ceo', 'admin', 'manager', 'employee') NOT NULL,
  insight_type VARCHAR(100) NOT NULL COMMENT 'e.g. attendance_warning, performance_summary',
  message TEXT NOT NULL,
  severity ENUM('info', 'warning', 'critical') DEFAULT 'info',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ai_insights_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_ai_insights_user ON ai_insights(user_id);
CREATE INDEX idx_ai_insights_role ON ai_insights(role);

-- ============================================================================
-- TABLE: ai_chat_history
-- ============================================================================
CREATE TABLE IF NOT EXISTS ai_chat_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ai_chat_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_ai_chat_user ON ai_chat_history(user_id);

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
