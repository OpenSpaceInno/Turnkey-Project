import mysql from "../node_modules/.pnpm/mysql2@3.23.2_@types+node@25.3.5/node_modules/mysql2/promise.js";

async function main() {
  const connectionUrl = process.env.DATABASE_URL || "mysql://root:Hari@1212@localhost:3306/turnkey_db";
  const conn = await mysql.createConnection(connectionUrl);

  const [projects] = await conn.query("SELECT id, name, budget, client_name FROM projects");
  console.log("PROJECTS:", projects);

  const [contracts] = await conn.query("SELECT id, contract_number, contract_type, project_id, title, total_amount FROM contracts");
  console.log("CONTRACTS:", contracts);

  const [leads] = await conn.query("SELECT id, lead_number, customer_name, status, stage, won_project_id FROM leads");
  console.log("ALL LEADS:", leads);

  const [boqs] = await conn.query("SELECT id, lead_id, version, status, grand_total FROM boqs");
  console.log("ALL BOQS:", boqs);

  const [drawings] = await conn.query("SELECT id, lead_id, file_name, status FROM drawings");
  console.log("ALL DRAWINGS:", drawings);

  await conn.end();
}
main();
