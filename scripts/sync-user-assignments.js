import mysql from "../node_modules/.pnpm/mysql2@3.23.2_@types+node@25.3.5/node_modules/mysql2/promise.js";

async function main() {
  const conn = await mysql.createConnection("mysql://root:Hari@1212@localhost:3306/turnkey_db");
  await conn.query("UPDATE project_assignments SET user_id = 18 WHERE user_id = 1");
  await conn.query("UPDATE projects SET project_manager_id = 18 WHERE project_manager_id = 1 OR project_manager_id IS NULL");
  await conn.query("INSERT IGNORE INTO project_assignments (project_id, user_id, role, assigned_by_id) VALUES (1, 17, 'admin', 17), (1, 18, 'project_manager', 17), (1, 19, 'engineer', 18)");
  console.log("Updated assignments successfully!");
  await conn.end();
}

main().catch(console.error);
