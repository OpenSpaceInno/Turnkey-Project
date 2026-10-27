-- Migration: Add Role Switch Request System
-- Date: 2026-08-25
-- Description: Create role_switch_requests table for managing user role change requests
--              Only Project Managers can approve/reject requests

-- Create role_switch_requests table
CREATE TABLE IF NOT EXISTS role_switch_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  current_role VARCHAR(50) NOT NULL,
  requested_role VARCHAR(50) NOT NULL,
  reason TEXT,
  status VARCHAR(32) NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_by_id INT,
  reviewed_at TIMESTAMP,
  review_comments TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_reviewed_by (reviewed_by_id),
  INDEX idx_requested_at (requested_at),
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add comment to table
ALTER TABLE role_switch_requests COMMENT = 'Role switch requests - Only Project Managers can approve/reject';
