import mysql from "../node_modules/.pnpm/mysql2@3.23.2_@types+node@25.3.5/node_modules/mysql2/promise.js";

async function main() {
  const connectionUrl = process.env.DATABASE_URL || "mysql://root:Hari@1212@localhost:3306/turnkey_db";
  console.log("Connecting to MySQL for Phase 2 RBAC migration...");
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

  // 1. Create organizations table
  console.log("Ensuring organizations table exists...");
  await conn.query(`
    CREATE TABLE IF NOT EXISTS organizations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      code VARCHAR(64) NOT NULL UNIQUE,
      status VARCHAR(32) NOT NULL DEFAULT 'active',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 2. Insert default organization
  console.log("Seeding default organization...");
  await conn.query(`
    INSERT IGNORE INTO organizations (id, name, code, status) 
    VALUES (1, 'Kanak Turnkey Solutions', 'KANAK_MAIN', 'active');
  `);

  // 3. Add organization_id to users
  await addColumnIfNotExists("users", "organization_id", "INT NOT NULL DEFAULT 1");

  // 4. Update existing projects to organization_id = 1 if null
  console.log("Ensuring all projects are linked to organization 1...");
  await conn.query("UPDATE projects SET organization_id = 1 WHERE organization_id IS NULL");

  // 5. Create user_permission_overrides table
  console.log("Ensuring user_permission_overrides table exists...");
  await conn.query(`
    CREATE TABLE IF NOT EXISTS user_permission_overrides (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      permission VARCHAR(64) NOT NULL,
      granted TINYINT(1) NOT NULL DEFAULT 1,
      granted_by_id INT,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_user_perm (user_id, permission),
      INDEX idx_user_id (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  console.log("Phase 2 RBAC & Organization migration completed successfully!");
  await conn.end();
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
