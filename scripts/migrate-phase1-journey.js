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

  // 1. Projects Table columns
  await addColumnIfNotExists("projects", "lifecycle_stage", "VARCHAR(32) NOT NULL DEFAULT 'setup'");
  await addColumnIfNotExists("projects", "project_manager_id", "INT NULL");
  await addColumnIfNotExists("projects", "setup_complete", "TINYINT(1) NOT NULL DEFAULT 0");
  await addColumnIfNotExists("projects", "organization_id", "INT NULL");

  // 2. Project Assignments Table
  console.log("Ensuring project_assignments table exists...");
  await conn.query(`
    CREATE TABLE IF NOT EXISTS project_assignments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      project_id INT NOT NULL,
      user_id INT NOT NULL,
      role VARCHAR(64) NOT NULL DEFAULT 'team_member',
      assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      assigned_by_id INT,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_project_user (project_id, user_id),
      INDEX idx_project_id (project_id),
      INDEX idx_user_id (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 3. Sync existing projects: update lifecycle_stage based on status if still 'setup'
  console.log("Syncing existing project lifecycle stages and assignments...");
  const [projects] = await conn.query("SELECT id, status, created_by_id, project_manager_id, lifecycle_stage FROM projects");
  
  for (const p of projects) {
    let pmId = p.project_manager_id || p.created_by_id || 1;
    let lStage = p.lifecycle_stage;
    
    // Map existing status to lifecycle_stage if default 'setup'
    if (lStage === 'setup' || !lStage) {
      if (p.status === 'planning') lStage = 'planning';
      else if (p.status === 'procurement') lStage = 'procurement';
      else if (p.status === 'execution') lStage = 'execution';
      else if (p.status === 'qc') lStage = 'quality';
      else if (p.status === 'handover') lStage = 'handover';
      else if (p.status === 'archived' || p.status === 'completed') lStage = 'closed';
      else lStage = 'setup';
    }

    await conn.query(
      "UPDATE projects SET project_manager_id = ?, lifecycle_stage = ? WHERE id = ?",
      [pmId, lStage, p.id]
    );

    // Ensure PM is assigned to project in project_assignments
    await conn.query(
      `INSERT IGNORE INTO project_assignments (project_id, user_id, role, assigned_by_id)
       VALUES (?, ?, 'project_manager', ?)`,
      [p.id, pmId, pmId]
    );
  }

  console.log(`Synced ${projects.length} existing projects.`);
  console.log("Phase 1 Migration completed successfully!");
  await conn.end();
}

main().catch((err) => {
  console.error("Phase 1 Migration failed:", err);
  process.exit(1);
});
