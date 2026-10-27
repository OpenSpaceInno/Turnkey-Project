import mysql from "../node_modules/.pnpm/mysql2@3.23.2_@types+node@25.3.5/node_modules/mysql2/promise.js";

async function main() {
  const connectionUrl = process.env.DATABASE_URL || "mysql://root:Hari@1212@localhost:3306/turnkey_db";
  const conn = await mysql.createConnection(connectionUrl);

  const [existing] = await conn.query('SELECT id FROM contracts WHERE project_id = 12 AND contract_type = "client"');
  let contractId;
  if (existing.length === 0) {
    const [res] = await conn.query(`
      INSERT INTO contracts (
        contract_number, contract_type, project_id, client_name, title, description,
        total_amount, advance_percent, retention_percent, abg_required, abg_percent, abg_amount,
        payment_terms_days, dlp_months, commercial_terms_notes, tds_percent, gst_percent,
        start_date, end_date, status, created_by_id
      ) VALUES (
        'CNT-CLI-2026-0012', 'client', 12, 'BlueWave Hospitality Pvt. Ltd',
        'Turnkey EPC Construction Contract — Sapphire Grand Hotel',
        'Formal EPC Client Turnkey Agreement. 10% Mobilization Advance backed by ABG, 5% Retention held until DLP.',
        85000000.00, 10.00, 5.00, 1, 10.00, 8500000.00,
        30, 12, '10% Mobilization advance released against submission of unconditional Advance Bank Guarantee (ABG). 5% Retention deducted from each RA bill and released post DLP (12 months).',
        2.00, 18.00, '2026-09-01', '2027-06-30', 'active', 1
      )
    `);
    contractId = res.insertId;
    console.log("Created Client Contract #", contractId);
  } else {
    contractId = existing[0].id;
    console.log("Client Contract already exists #", contractId);
  }

  // Update billing milestones to link to contract
  await conn.query("UPDATE billing_milestones SET contract_id = ? WHERE project_id = 12", [contractId]);
  console.log("Updated billing milestones with contractId", contractId);

  // Also check if any package in budget_items can showcase budget variance (one with > 90% or > 100%)
  // For demo & verification, let's make sure we have realistic data to test the budget variance alert:
  // Let's check budget items for project 12:
  const [bItems] = await conn.query("SELECT id, cost_code, description, budgeted, committed, actual FROM budget_items WHERE project_id = 12");
  console.log("Project 12 Budget items:", bItems);

  await conn.end();
}
main();
