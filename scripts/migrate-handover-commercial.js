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

  // 1. Leads Table columns
  await addColumnIfNotExists("leads", "advance_percent", "DECIMAL(5,2) DEFAULT '10.00'");
  await addColumnIfNotExists("leads", "retention_percent", "DECIMAL(5,2) DEFAULT '5.00'");
  await addColumnIfNotExists("leads", "abg_required", "TINYINT(1) DEFAULT 0");
  await addColumnIfNotExists("leads", "abg_percent", "DECIMAL(5,2) DEFAULT '0.00'");
  await addColumnIfNotExists("leads", "abg_amount", "DECIMAL(14,2) DEFAULT '0.00'");
  await addColumnIfNotExists("leads", "payment_terms_days", "INT DEFAULT 30");
  await addColumnIfNotExists("leads", "dlp_months", "INT DEFAULT 12");
  await addColumnIfNotExists("leads", "commercial_terms_notes", "TEXT");

  // 2. Contracts Table columns
  await addColumnIfNotExists("contracts", "abg_required", "TINYINT(1) DEFAULT 0");
  await addColumnIfNotExists("contracts", "abg_percent", "DECIMAL(5,2) DEFAULT '0.00'");
  await addColumnIfNotExists("contracts", "abg_amount", "DECIMAL(14,2) DEFAULT '0.00'");
  await addColumnIfNotExists("contracts", "payment_terms_days", "INT DEFAULT 30");
  await addColumnIfNotExists("contracts", "dlp_months", "INT DEFAULT 12");
  await addColumnIfNotExists("contracts", "commercial_terms_notes", "TEXT");

  // 3. Budget Items Table columns
  await addColumnIfNotExists("budget_items", "category", "VARCHAR(128)");

  // 4. Billing Milestones Table
  console.log("Ensuring billing_milestones table exists...");
  await conn.query(`
    CREATE TABLE IF NOT EXISTS billing_milestones (
      id INT AUTO_INCREMENT PRIMARY KEY,
      project_id INT NOT NULL,
      contract_id INT,
      milestone_number VARCHAR(64) NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      stage VARCHAR(64) NOT NULL DEFAULT 'general',
      billing_percent DECIMAL(5,2) NOT NULL DEFAULT '0.00',
      expected_amount DECIMAL(14,2) NOT NULL DEFAULT '0.00',
      target_date DATE,
      completion_date DATE,
      status VARCHAR(32) NOT NULL DEFAULT 'pending',
      ra_bill_id INT,
      billed_amount DECIMAL(14,2) NOT NULL DEFAULT '0.00',
      sort_order INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_project_id (project_id),
      INDEX idx_contract_id (contract_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  console.log("Migration completed successfully!");
  await conn.end();
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
