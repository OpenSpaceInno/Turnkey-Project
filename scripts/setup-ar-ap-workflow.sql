-- Setup AR and AP Separated Workflows Schema

-- 1. Company Settings (Branding & Bank Details)
ALTER TABLE company_settings
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS pan_number VARCHAR(50),
  ADD COLUMN IF NOT EXISTS bank_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS account_number VARCHAR(100),
  ADD COLUMN IF NOT EXISTS ifsc_code VARCHAR(50),
  ADD COLUMN IF NOT EXISTS branch_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS authorized_signatory VARCHAR(255),
  ADD COLUMN IF NOT EXISTS signatory_title VARCHAR(100),
  ADD COLUMN IF NOT EXISTS invoice_terms TEXT,
  ADD COLUMN IF NOT EXISTS invoice_footer TEXT;

-- Update company branding with standard turnkey firm details if blank
UPDATE company_settings 
SET 
  company_name = IF(company_name IS NULL OR company_name = '', 'Kanak Turnkey Solutions Pvt. Ltd.', company_name),
  address = IF(address IS NULL, 'Tower 4, Level 8, Cyber City, BKC', address),
  city = IF(city IS NULL, 'Mumbai', city),
  state = IF(state IS NULL, 'Maharashtra', state),
  country = 'India',
  pincode = IF(pincode IS NULL, '400051', pincode),
  gst_number = IF(gst_number IS NULL, '27AABCK1234F1Z5', gst_number),
  pan_number = IF(pan_number IS NULL, 'AABCK1234F', pan_number),
  phone = IF(phone IS NULL, '+91 22 4590 1200', phone),
  email = IF(email IS NULL, 'finance@kanak.in', email),
  website = IF(website IS NULL, 'https://kanakturnkey.com', website),
  bank_name = IF(bank_name IS NULL, 'HDFC Bank Ltd', bank_name),
  account_number = IF(account_number IS NULL, '50200088921820', account_number),
  ifsc_code = IF(ifsc_code IS NULL, 'HDFC0000060', ifsc_code),
  branch_name = IF(branch_name IS NULL, 'BKC Main Branch, Mumbai', branch_name),
  authorized_signatory = IF(authorized_signatory IS NULL, 'Vikram Shah', authorized_signatory),
  signatory_title = IF(signatory_title IS NULL, 'Head of Finance & Accounts', signatory_title),
  invoice_terms = IF(invoice_terms IS NULL, '1. Payment due within 15 days of invoice date.\n2. Overdue payments subject to 1.5% interest per month.\n3. Please quote invoice number on all remittances.', invoice_terms),
  invoice_footer = IF(invoice_footer IS NULL, 'Thank you for partnering with Kanak Turnkey Solutions. Certified ISO 9001:2015 Turnkey Contractor.', invoice_footer)
WHERE id = 1;

-- 2. Contracts Table: Add contract_type ('client' or 'vendor') and client_name
ALTER TABLE contracts
  ADD COLUMN IF NOT EXISTS contract_type VARCHAR(32) NOT NULL DEFAULT 'vendor',
  ADD COLUMN IF NOT EXISTS client_name VARCHAR(255),
  MODIFY COLUMN vendor_id INT NULL;

-- 3. RA Bills Table: Add bill_type ('client' or 'vendor'), client_name, cumulative_amount, and payment certification
ALTER TABLE ra_bills
  ADD COLUMN IF NOT EXISTS bill_type VARCHAR(32) NOT NULL DEFAULT 'client',
  ADD COLUMN IF NOT EXISTS client_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS cumulative_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_certified_at TIMESTAMP NULL,
  ADD COLUMN IF NOT EXISTS payment_certified_by_id INT NULL,
  ADD COLUMN IF NOT EXISTS payment_certificate_number VARCHAR(64) NULL,
  ADD COLUMN IF NOT EXISTS payment_certificate_notes TEXT NULL;

-- Set bill_type based on vendor_id
UPDATE ra_bills SET bill_type = 'vendor' WHERE vendor_id IS NOT NULL;
UPDATE ra_bills SET bill_type = 'client' WHERE vendor_id IS NULL;

-- 4. Invoices Table (Client Invoices / AR)
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS billing_period VARCHAR(128),
  ADD COLUMN IF NOT EXISTS bank_details TEXT,
  ADD COLUMN IF NOT EXISTS delivery_status VARCHAR(32) NOT NULL DEFAULT 'pending';

-- 5. Vendor Invoices Table (Vendor Invoices / AP)
ALTER TABLE vendor_invoices
  ADD COLUMN IF NOT EXISTS contract_id INT NULL,
  ADD COLUMN IF NOT EXISTS vendor_ra_bill_id INT NULL,
  ADD COLUMN IF NOT EXISTS invoice_date DATE NULL,
  ADD COLUMN IF NOT EXISTS due_date DATE NULL,
  ADD COLUMN IF NOT EXISTS gross_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS retention_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS advance_recovery DECIMAL(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tds_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS other_deductions DECIMAL(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS net_payable_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS po_matched TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS measurement_matched TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS quantity_rate_validated TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discrepancy_flag TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS clarification_notes TEXT,
  ADD COLUMN IF NOT EXISTS pm_approved_by_id INT NULL,
  ADD COLUMN IF NOT EXISTS pm_approved_at TIMESTAMP NULL,
  ADD COLUMN IF NOT EXISTS pm_comments TEXT,
  ADD COLUMN IF NOT EXISTS finance_verified_by_id INT NULL,
  ADD COLUMN IF NOT EXISTS finance_verified_at TIMESTAMP NULL,
  ADD COLUMN IF NOT EXISTS finance_comments TEXT,
  ADD COLUMN IF NOT EXISTS payment_approved_by_id INT NULL,
  ADD COLUMN IF NOT EXISTS payment_approved_at TIMESTAMP NULL,
  ADD COLUMN IF NOT EXISTS payment_scheduled_date DATE NULL,
  ADD COLUMN IF NOT EXISTS scheduled_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_paid_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS outstanding_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reconciled TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reconciled_by_id INT NULL,
  ADD COLUMN IF NOT EXISTS reconciled_at TIMESTAMP NULL,
  ADD COLUMN IF NOT EXISTS reconciliation_remarks TEXT;

-- Update existing vendor_invoices gross/net amounts
UPDATE vendor_invoices 
SET 
  gross_amount = IF(gross_amount = 0, amount, gross_amount),
  net_payable_amount = IF(net_payable_amount = 0, amount, net_payable_amount),
  outstanding_amount = IF(outstanding_amount = 0 AND status != 'paid', amount, outstanding_amount),
  invoice_date = IF(invoice_date IS NULL, created_at, invoice_date),
  due_date = IF(due_date IS NULL, DATE_ADD(created_at, INTERVAL 30 DAY), due_date)
WHERE id > 0;

-- 6. Vendor Payments Table (Vendor / AP Payments)
CREATE TABLE IF NOT EXISTS vendor_payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vendor_invoice_id INT NOT NULL,
  vendor_id INT NOT NULL,
  project_id INT NOT NULL,
  vendor_ra_bill_id INT NULL,
  payment_number VARCHAR(64) NOT NULL,
  payment_date DATE NOT NULL,
  payment_amount DECIMAL(14,2) NOT NULL,
  payment_mode VARCHAR(32) NOT NULL DEFAULT 'neft_rtgs',
  bank_reference VARCHAR(128),
  transaction_id VARCHAR(128),
  from_bank_account VARCHAR(128),
  vendor_bank_details TEXT,
  remarks TEXT,
  document_url TEXT,
  recorded_by_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  INDEX idx_vendor_payments_inv (vendor_invoice_id),
  INDEX idx_vendor_payments_vendor (vendor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. AP Discrepancies Table
CREATE TABLE IF NOT EXISTS ap_discrepancies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vendor_invoice_id INT NOT NULL,
  vendor_id INT NOT NULL,
  discrepancy_type VARCHAR(64) NOT NULL,
  description TEXT NOT NULL,
  claimed_amount DECIMAL(14,2) NOT NULL,
  verified_amount DECIMAL(14,2) NOT NULL,
  difference_amount DECIMAL(14,2) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'open',
  resolution_notes TEXT,
  raised_by_id INT NOT NULL,
  resolved_by_id INT NULL,
  resolved_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  INDEX idx_ap_discrepancies_inv (vendor_invoice_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Financial Audit Logs (Unified audit tracking for AR and AP)
CREATE TABLE IF NOT EXISTS financial_audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  workflow_type VARCHAR(16) NOT NULL, -- 'AR' or 'AP'
  entity_type VARCHAR(64) NOT NULL, -- 'client_ra_bill', 'client_invoice', 'client_payment', 'vendor_ra_bill', 'vendor_invoice', 'vendor_payment', 'reconciliation'
  entity_id INT NOT NULL,
  action VARCHAR(64) NOT NULL,
  previous_status VARCHAR(64),
  new_status VARCHAR(64) NOT NULL,
  user_id INT NOT NULL,
  user_name VARCHAR(255),
  comments TEXT,
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  INDEX idx_fin_audit_workflow (workflow_type),
  INDEX idx_fin_audit_entity (entity_type, entity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
