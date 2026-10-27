import mysql from "mysql2/promise";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function main() {
  const pool = mysql.createPool(process.env.DATABASE_URL);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS site_workers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      project_id INT NOT NULL,
      name VARCHAR(255) NOT NULL,
      category VARCHAR(64) NOT NULL DEFAULT 'Skilled',
      trade VARCHAR(128) NOT NULL DEFAULT 'Civil / Concreting',
      contractor_name VARCHAR(255) DEFAULT 'Direct Site Hire',
      daily_wage_rate DECIMAL(12, 2) NOT NULL DEFAULT 800.00,
      phone VARCHAR(32),
      status VARCHAR(32) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_project_id (project_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS site_worker_attendance (
      id INT AUTO_INCREMENT PRIMARY KEY,
      worker_id INT NOT NULL,
      project_id INT NOT NULL,
      attendance_date VARCHAR(32) NOT NULL,
      status VARCHAR(32) NOT NULL DEFAULT 'present',
      days_worked DECIMAL(4, 2) NOT NULL DEFAULT 1.00,
      daily_wage_rate DECIMAL(12, 2) NOT NULL,
      payable_amount DECIMAL(12, 2) NOT NULL,
      shift VARCHAR(64) DEFAULT 'Day Shift',
      remarks TEXT,
      created_by_id INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_worker_date (worker_id, attendance_date),
      INDEX idx_project_date (project_id, attendance_date),
      INDEX idx_attendance_date (attendance_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  console.log("Successfully created site_workers and site_worker_attendance tables!");
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
