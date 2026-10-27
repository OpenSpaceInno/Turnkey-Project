import mysql from "../node_modules/.pnpm/mysql2@3.23.2_@types+node@25.3.5/node_modules/mysql2/promise.js";

async function main() {
  const connectionUrl = process.env.DATABASE_URL || "mysql://root:Hari@1212@localhost:3306/turnkey_db";
  console.log("Connecting to MySQL...");
  const conn = await mysql.createConnection(connectionUrl);

  async function addColumnIfNotExists(table, column, definition) {
    try {
      const [rows] = await conn.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
        [table, column]
      );
      if (rows.length === 0) {
        console.log(`Adding column ${column} to table ${table}...`);
        await conn.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
      } else {
        console.log(`Column ${column} already exists in table ${table}.`);
      }
    } catch (err) {
      console.error(`Error adding column ${column} to ${table}:`, err.message);
    }
  }

  // 1. company_settings
  await addColumnIfNotExists("company_settings", "logo_url", "TEXT");
  await addColumnIfNotExists("company_settings", "pan_number", "VARCHAR(50)");
  await addColumnIfNotExists("company_settings", "bank_name", "VARCHAR(255)");
  await addColumnIfNotExists("company_settings", "account_number", "VARCHAR(100)");
  await addColumnIfNotExists("company_settings", "ifsc_code", "VARCHAR(50)");
  await addColumnIfNotExists("company_settings", "branch_name", "VARCHAR(255)");
  await addColumnIfNotExists("company_settings", "authorized_signatory", "VARCHAR(255)");
  await addColumnIfNotExists("company_settings", "signatory_title", "VARCHAR(100)");
  await addColumnIfNotExists("company_settings", "invoice_terms", "TEXT");
  await addColumnIfNotExists("company_settings", "invoice_footer", "TEXT");

  await conn.query(`
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
      invoice_terms = IF(invoice_terms IS NULL, '1. Payment due within 15 days of invoice date.\\n2. Overdue payments subject to 1.5% interest per month.\\n3. Please quote invoice number on all remittances.', invoice_terms),
      invoice_footer = IF(invoice_footer IS NULL, 'Thank you for partnering with Kanak Turnkey Solutions. Certified ISO 9001:2015 Turnkey Contractor.', invoice_footer)
    WHERE id = 1
  `);

  // 2. contracts
  await addColumnIfNotExists("contracts", "contract_type", "VARCHAR(32) NOT NULL DEFAULT 'vendor'");
  await addColumnIfNotExists("contracts", "client_name", "VARCHAR(255)");
  try {
    await conn.query("ALTER TABLE `contracts` MODIFY COLUMN `vendor_id` INT NULL");
  } catch (e) {
    console.error("Modify vendor_id in contracts error:", e.message);
  }

  // 3. ra_bills
  await addColumnIfNotExists("ra_bills", "bill_type", "VARCHAR(32) NOT NULL DEFAULT 'client'");
  await addColumnIfNotExists("ra_bills", "client_name", "VARCHAR(255)");
  await addColumnIfNotExists("ra_bills", "cumulative_amount", "DECIMAL(14,2) NOT NULL DEFAULT 0");
  await addColumnIfNotExists("ra_bills", "payment_certified_at", "TIMESTAMP NULL");
  await addColumnIfNotExists("ra_bills", "payment_certified_by_id", "INT NULL");
  await addColumnIfNotExists("ra_bills", "payment_certificate_number", "VARCHAR(64) NULL");
  await addColumnIfNotExists("ra_bills", "payment_certificate_notes", "TEXT NULL");

  await conn.query("UPDATE ra_bills SET bill_type = 'vendor' WHERE vendor_id IS NOT NULL");
  await conn.query("UPDATE ra_bills SET bill_type = 'client' WHERE vendor_id IS NULL");

  // 4. invoices (Client Invoices / AR)
  await addColumnIfNotExists("invoices", "billing_period", "VARCHAR(128)");
  await addColumnIfNotExists("invoices", "bank_details", "TEXT");
  await addColumnIfNotExists("invoices", "delivery_status", "VARCHAR(32) NOT NULL DEFAULT 'pending'");

  // 5. vendor_invoices (Vendor Invoices / AP)
  await addColumnIfNotExists("vendor_invoices", "contract_id", "INT NULL");
  await addColumnIfNotExists("vendor_invoices", "vendor_ra_bill_id", "INT NULL");
  await addColumnIfNotExists("vendor_invoices", "invoice_date", "DATE NULL");
  await addColumnIfNotExists("vendor_invoices", "due_date", "DATE NULL");
  await addColumnIfNotExists("vendor_invoices", "gross_amount", "DECIMAL(14,2) NOT NULL DEFAULT 0");
  await addColumnIfNotExists("vendor_invoices", "tax_amount", "DECIMAL(14,2) NOT NULL DEFAULT 0");
  await addColumnIfNotExists("vendor_invoices", "retention_amount", "DECIMAL(14,2) NOT NULL DEFAULT 0");
  await addColumnIfNotExists("vendor_invoices", "advance_recovery", "DECIMAL(14,2) NOT NULL DEFAULT 0");
  await addColumnIfNotExists("vendor_invoices", "tds_amount", "DECIMAL(14,2) NOT NULL DEFAULT 0");
  await addColumnIfNotExists("vendor_invoices", "other_deductions", "DECIMAL(14,2) NOT NULL DEFAULT 0");
  await addColumnIfNotExists("vendor_invoices", "net_payable_amount", "DECIMAL(14,2) NOT NULL DEFAULT 0");
  await addColumnIfNotExists("vendor_invoices", "po_matched", "TINYINT(1) NOT NULL DEFAULT 0");
  await addColumnIfNotExists("vendor_invoices", "measurement_matched", "TINYINT(1) NOT NULL DEFAULT 0");
  await addColumnIfNotExists("vendor_invoices", "quantity_rate_validated", "TINYINT(1) NOT NULL DEFAULT 0");
  await addColumnIfNotExists("vendor_invoices", "discrepancy_flag", "TINYINT(1) NOT NULL DEFAULT 0");
  await addColumnIfNotExists("vendor_invoices", "clarification_notes", "TEXT");
  await addColumnIfNotExists("vendor_invoices", "pm_approved_by_id", "INT NULL");
  await addColumnIfNotExists("vendor_invoices", "pm_approved_at", "TIMESTAMP NULL");
  await addColumnIfNotExists("vendor_invoices", "pm_comments", "TEXT");
  await addColumnIfNotExists("vendor_invoices", "finance_verified_by_id", "INT NULL");
  await addColumnIfNotExists("vendor_invoices", "finance_verified_at", "TIMESTAMP NULL");
  await addColumnIfNotExists("vendor_invoices", "finance_comments", "TEXT");
  await addColumnIfNotExists("vendor_invoices", "payment_approved_by_id", "INT NULL");
  await addColumnIfNotExists("vendor_invoices", "payment_approved_at", "TIMESTAMP NULL");
  await addColumnIfNotExists("vendor_invoices", "payment_scheduled_date", "DATE NULL");
  await addColumnIfNotExists("vendor_invoices", "scheduled_amount", "DECIMAL(14,2) NOT NULL DEFAULT 0");
  await addColumnIfNotExists("vendor_invoices", "total_paid_amount", "DECIMAL(14,2) NOT NULL DEFAULT 0");
  await addColumnIfNotExists("vendor_invoices", "outstanding_amount", "DECIMAL(14,2) NOT NULL DEFAULT 0");
  await addColumnIfNotExists("vendor_invoices", "reconciled", "TINYINT(1) NOT NULL DEFAULT 0");
  await addColumnIfNotExists("vendor_invoices", "reconciled_by_id", "INT NULL");
  await addColumnIfNotExists("vendor_invoices", "reconciled_at", "TIMESTAMP NULL");
  await addColumnIfNotExists("vendor_invoices", "reconciliation_remarks", "TEXT");

  await conn.query(`
    UPDATE vendor_invoices 
    SET 
      gross_amount = IF(gross_amount = 0, amount, gross_amount),
      net_payable_amount = IF(net_payable_amount = 0, amount, net_payable_amount),
      outstanding_amount = IF(outstanding_amount = 0 AND status != 'paid', amount, outstanding_amount),
      invoice_date = IF(invoice_date IS NULL, created_at, invoice_date),
      due_date = IF(due_date IS NULL, DATE_ADD(created_at, INTERVAL 30 DAY), due_date)
    WHERE id > 0
  `);

  // 6. vendor_payments
  await conn.query(`
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log("vendor_payments table verified.");

  // 7. ap_discrepancies
  await conn.query(`
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log("ap_discrepancies table verified.");

  // 8. financial_audit_logs
  await conn.query(`
    CREATE TABLE IF NOT EXISTS financial_audit_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      workflow_type VARCHAR(16) NOT NULL,
      entity_type VARCHAR(64) NOT NULL,
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log("financial_audit_logs table verified.");

  console.log("Migration completed successfully!");
  await conn.end();
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
