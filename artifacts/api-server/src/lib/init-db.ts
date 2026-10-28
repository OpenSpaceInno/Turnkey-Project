import fs from "fs";
import path from "path";
import { pool } from "@workspace/db";
import { logger } from "./logger";

export async function initDatabaseSchema(): Promise<void> {
  try {
    // Check if the primary users table exists
    const [rows]: any = await pool.query("SHOW TABLES LIKE 'users';");
    if (Array.isArray(rows) && rows.length > 0) {
      logger.info("Database tables already exist. Skipping schema initialization.");
      return;
    }

    logger.info("Fresh database detected. Initializing schema from deploy/schema.sql...");

    const candidatePaths = [
      path.resolve(process.cwd(), "deploy/schema.sql"),
      path.resolve(process.cwd(), "schema.sql"),
      path.resolve(process.cwd(), "../deploy/schema.sql"),
      path.resolve(process.cwd(), "../../deploy/schema.sql"),
    ];

    const schemaPath = candidatePaths.find((p) => fs.existsSync(p));

    if (!schemaPath) {
      logger.warn(
        { candidatePaths },
        "schema.sql not found in candidate paths. Skipping automatic table creation."
      );
      return;
    }

    logger.info({ schemaPath }, "Reading schema.sql file");
    const sqlContent = fs.readFileSync(schemaPath, "utf-8");

    // Execute multi-statement SQL
    await pool.query(sqlContent);
    logger.info("Successfully executed deploy/schema.sql. All database tables created!");
  } catch (err: any) {
    logger.error({ err: err.message }, "Error during schema initialization");
    // Allow continuing so seed or startup can log full details
  }
}
