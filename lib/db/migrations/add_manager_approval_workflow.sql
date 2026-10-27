-- Migration: Add Manager Approval Workflow Fields
-- Date: 2026-08-24
-- Description: Add manager assignment and approval tracking to material requests

-- Add new columns to procurement_material_requests
ALTER TABLE procurement_material_requests
ADD COLUMN submitted_at TIMESTAMP NULL AFTER required_date,
ADD COLUMN assigned_manager_id INT NULL AFTER requested_by_id,
ADD COLUMN approval_comments TEXT NULL AFTER approval_date;

-- Create material_request_approval_history table
CREATE TABLE IF NOT EXISTS material_request_approval_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  material_request_id INT NOT NULL,
  manager_id INT NOT NULL,
  action VARCHAR(32) NOT NULL COMMENT 'APPROVED or REJECTED',
  comments TEXT,
  action_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (material_request_id) REFERENCES procurement_material_requests(id) ON DELETE CASCADE,
  FOREIGN KEY (manager_id) REFERENCES users(id),
  
  INDEX idx_material_request (material_request_id),
  INDEX idx_manager (manager_id),
  INDEX idx_action (action)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Update existing status values if needed (optional - only if you want to migrate existing data)
-- UPDATE procurement_material_requests 
-- SET status = 'pending_manager_approval' 
-- WHERE status = 'pending_approval';
