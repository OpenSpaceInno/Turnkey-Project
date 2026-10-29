import fs from "fs";
import path from "path";
import { pool } from "@workspace/db";
import { logger } from "./logger";

export async function initDatabaseSchema(): Promise<void> {
  try {
    // 1. Check if the primary users table exists
    const [rows]: any = await pool.query("SHOW TABLES LIKE 'users';");
    const usersExist = Array.isArray(rows) && rows.length > 0;

    if (!usersExist) {
      logger.info("Fresh database detected. Initializing schema from deploy/schema.sql...");

      const candidatePaths = [
        path.resolve(process.cwd(), "deploy/schema.sql"),
        path.resolve(process.cwd(), "schema.sql"),
        path.resolve(process.cwd(), "../deploy/schema.sql"),
        path.resolve(process.cwd(), "../../deploy/schema.sql"),
        path.resolve(__dirname, "../../deploy/schema.sql"),
        path.resolve(__dirname, "../../../deploy/schema.sql"),
      ];

      const schemaPath = candidatePaths.find((p) => {
        try {
          return fs.existsSync(p);
        } catch {
          return false;
        }
      });

      if (!schemaPath) {
        logger.warn(
          { candidatePaths },
          "schema.sql not found in candidate paths. Skipping automatic table creation."
        );
      } else {
        logger.info({ schemaPath }, "Reading schema.sql file");
        const sqlContent = fs.readFileSync(schemaPath, "utf-8");
        await pool.query(sqlContent);
        logger.info("Successfully executed deploy/schema.sql. All database tables created!");
      }
    } else {
      logger.info("Database tables already exist. Running schema integrity checks...");
    }

    // 2. Schema Integrity: Ensure critical tables exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`organizations\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`name\` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
        \`code\` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL UNIQUE,
        \`status\` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
        \`created_at\` timestamp NOT NULL DEFAULT (now()),
        \`updated_at\` timestamp NOT NULL DEFAULT (now()),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await pool.query(`
      INSERT IGNORE INTO \`organizations\` (\`id\`, \`name\`, \`code\`, \`status\`)
      VALUES (1, 'Kanak TurnKey', 'KANAK-HQ', 'active');
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`audit_logs\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`user_id\` int DEFAULT NULL,
        \`activity\` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
        \`resource_type\` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
        \`resource_id\` int DEFAULT NULL,
        \`ip_address\` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
        \`status\` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'success',
        \`metadata\` text COLLATE utf8mb4_unicode_ci,
        \`created_at\` timestamp NOT NULL DEFAULT (now()),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 3. Schema Integrity: Ensure all required columns exist on 'users'
    const [cols]: any = await pool.query(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users';"
    );
    const existingCols = new Set(
      Array.isArray(cols) ? cols.map((c: any) => c.COLUMN_NAME.toLowerCase()) : []
    );

    const requiredColumns: { name: string; sql: string }[] = [
      { name: "organization_id", sql: "ADD COLUMN `organization_id` int NOT NULL DEFAULT 1" },
      { name: "phone", sql: "ADD COLUMN `phone` varchar(32) NULL UNIQUE" },
      { name: "active_role", sql: "ADD COLUMN `active_role` varchar(50) NOT NULL DEFAULT 'admin'" },
      { name: "reset_token", sql: "ADD COLUMN `reset_token` varchar(255) NULL" },
      { name: "reset_token_expires_at", sql: "ADD COLUMN `reset_token_expires_at` timestamp NULL" },
      { name: "two_factor_enabled", sql: "ADD COLUMN `two_factor_enabled` tinyint(1) NOT NULL DEFAULT 0" },
      { name: "two_factor_secret", sql: "ADD COLUMN `two_factor_secret` text NULL" },
      { name: "two_factor_backup_codes", sql: "ADD COLUMN `two_factor_backup_codes` json NULL" },
    ];

    for (const col of requiredColumns) {
      if (!existingCols.has(col.name.toLowerCase())) {
        try {
          await pool.query(`ALTER TABLE \`users\` ${col.sql};`);
          logger.info({ column: col.name }, "Added missing column to 'users' table");
        } catch (alterErr: any) {
          logger.warn({ err: alterErr.message, column: col.name }, "Could not add column to 'users'");
        }
      }
    }

    logger.info("Database schema and integrity checks completed successfully.");
  } catch (err: any) {
    logger.error({ err: err.message }, "Error during schema initialization / integrity check");
  }
}
