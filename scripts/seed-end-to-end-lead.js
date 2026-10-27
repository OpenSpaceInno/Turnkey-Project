import mysql from '../lib/db/node_modules/mysql2/promise.js';

async function seedEndToEndLead() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  console.log("Connected to MySQL database...");

  try {
    const leadNumber = "LD-20260924-TUR01";

    // 1. Check if lead already exists, if so delete to re-seed cleanly
    const [existing] = await connection.execute("SELECT id FROM leads WHERE lead_number = ?", [leadNumber]);
    if (existing.length > 0) {
      const oldId = existing[0].id;
      console.log(`Cleaning up previous seed lead id ${oldId}...`);
      await connection.execute("DELETE FROM lead_activities WHERE lead_id = ?", [oldId]);
      await connection.execute("DELETE FROM site_visits WHERE lead_id = ?", [oldId]);
      await connection.execute("DELETE FROM drawings WHERE lead_id = ?", [oldId]);
      const [oldBoqs] = await connection.execute("SELECT id FROM boqs WHERE lead_id = ?", [oldId]);
      for (const b of oldBoqs) {
        await connection.execute("DELETE FROM boq_items WHERE boq_id = ?", [b.id]);
      }
      await connection.execute("DELETE FROM boqs WHERE lead_id = ?", [oldId]);
      await connection.execute("DELETE FROM negotiations WHERE lead_id = ?", [oldId]);
      await connection.execute("DELETE FROM leads WHERE id = ?", [oldId]);
    }

    // 2. Insert Lead with Complete Commercial Payment Terms Matrix
    const [leadRes] = await connection.execute(`
      INSERT INTO leads (
        lead_number,
        customer_name,
        company,
        contact_email,
        contact_phone,
        project_type,
        location,
        budget_estimate,
        lead_source,
        status,
        stage,
        priority,
        owner_id,
        expected_closure_date,
        advance_percent,
        retention_percent,
        abg_required,
        abg_percent,
        abg_amount,
        payment_terms_days,
        dlp_months,
        commercial_terms_notes,
        notes
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
    `, [
      leadNumber,
      "Dr. Vikramaditya Oberoi",
      "Apex Global Biotech & Healthcare Park",
      "v.oberoi@apexbiotech.com",
      "+91 98201 54321",
      "Commercial Cleanroom & MEP Turnkey",
      "Plot 14-B, Sector 62, Electronic City Phase 2, Bangalore",
      55000000.00,
      "Enterprise Referral",
      "negotiation",
      "negotiation",
      "urgent",
      18, // Rohan Mehta (Project Manager)
      "2026-10-15",
      10.00, // 10% Mobilization Advance
      5.00,  // 5% Retention held until DLP
      1,     // ABG Required
      10.00, // 10% ABG
      5500000.00, // ₹55 Lakh ABG value
      30,    // 30 days credit SLA
      12,    // 12 Months DLP
      "Client agreed on 10% Mobilization Advance against a 10% Advance Bank Guarantee (ABG) from a Scheduled Commercial Bank. 5% Retention withheld from monthly RA bills, payable 50% on Handover & As-Built acceptance, and 50% post 12-month DLP. Billing schedule tied to 6 turnkey milestone gates.",
      "High priority turnkey client. Fast-track 6-month completion timeline. Site is cleared and ready for possession."
    ]);

    const leadId = leadRes.insertId;
    console.log(`Created Lead ID: ${leadId} (${leadNumber})`);

    // 3. Insert Lead Activities
    await connection.execute(`
      INSERT INTO lead_activities (lead_id, activity_type, title, description, created_by_id)
      VALUES 
      (?, 'call', 'Initial Technical & Commercial Discovery Call', 'Detailed 60-minute briefing with Dr. Oberoi and Chief Infrastructure Officer. Covered cleanroom ISO Class 7 requirements, 120 TR HVAC plant, and 11kV substation specs.', 18),
      (?, 'meeting', 'Commercial Terms & Risk Alignment Meeting', 'Aligned on 10% Mobilization Advance, 10% ABG requirement, 5% Retention withheld till DLP, and 30-day payment SLA. Drafted commercial payment terms matrix.', 17),
      (?, 'note', 'Design Review & Preliminary Engineering Sign-off', 'Engineering team approved architectural cleanroom plan, single-line diagram for 11kV HT yard, and HVAC duct routing layout.', 19)
    `, [leadId, leadId, leadId]);
    console.log("Added 3 Lead Activities.");

    // 4. Insert Site Visit
    await connection.execute(`
      INSERT INTO site_visits (
        lead_id, visit_date, visit_time, engineer_id, site_address, latitude, longitude, measurements, observations, status
      ) VALUES (
        ?, '2026-09-18', '10:30 AM', 19,
        'Plot 14-B, Sector 62, Electronic City Phase 2, Bangalore',
        12.8452, 77.6602,
        'Gross Built-Up: 42,500 sq.ft | Clear Height: 4.85 m | Slab Live Load Capacity: 15.0 kN/sq.m | HT Substation Yard: 1,800 sq.ft | Dedicated Chiller Yard: 2,200 sq.ft',
        'Site is fully cordoned and leveled. Excellent arterial access for heavy concrete transit mixers and high-capacity mobile cranes. 3-phase temporary construction power feed available. Soil bearing capacity verified at 240 kN/sq.m. Client ready for immediate site possession.',
        'completed'
      )
    `, [leadId]);
    console.log("Added Completed Site Visit.");

    // 5. Insert Approved Drawings
    await connection.execute(`
      INSERT INTO drawings (
        lead_id, file_name, file_type, file_size, file_url, version, status, reviewer_comments, uploaded_by_id, reviewed_by_id
      ) VALUES 
      (?, 'ARCH-CLEANROOM-GA-001-REV-C.pdf', 'application/pdf', 14582900, '/drawings/arch-cleanroom-ga-001-rev-c.pdf', 3, 'approved', 'Architectural layout and ISO Class 7 cleanroom boundaries approved for construction.', 19, 18),
      (?, 'MEP-HVAC-ISO-PRESS-002.pdf', 'application/pdf', 9845200, '/drawings/mep-hvac-iso-press-002.pdf', 2, 'approved', 'HVAC airflow, differential pressure cascade, and HEPA filter ceiling grid approved.', 19, 18),
      (?, 'ELEC-11KV-SUBSTATION-SLD-003.pdf', 'application/pdf', 7621000, '/drawings/elec-11kv-substation-sld-003.pdf', 1, 'approved', '11kV HT Substation, 500kVA transformer, and DG sync panel single line diagram approved.', 19, 18)
    `, [leadId, leadId, leadId]);
    console.log("Added 3 Approved Drawings.");

    // 6. Insert Approved BOQ with Detailed Line Items
    const [boqRes] = await connection.execute(`
      INSERT INTO boqs (
        lead_id, version, status, subtotal, tax_total, margin_total, grand_total, created_by_id, approved_by_id
      ) VALUES (
        ?, 1, 'approved', 46610169.49, 8389830.51, 6500000.00, 55000000.00, 18, 17
      )
    `, [leadId]);
    const boqId = boqRes.insertId;

    await connection.execute(`
      INSERT INTO boq_items (
        boq_id, item_name, category, quantity, unit, unit_price, tax_percent, margin_percent, total_price, sort_order
      ) VALUES
      (?, 'Modular Cleanroom Wall Panels & Coving (ISO Class 7)', 'Civil & Finishes', 3200.00, 'sq.m', 3500.00, 18.00, 12.00, 11200000.00, 1),
      (?, 'Heavy-Duty Anti-Static Epoxy & Seamless Polyurethane Flooring', 'Civil & Finishes', 3800.00, 'sq.m', 1450.00, 18.00, 10.00, 5510000.00, 2),
      (?, '120 TR Modular Chilled Water Plant with Cleanroom AHUs & HEPA Filters', 'HVAC', 1.00, 'lot', 14500000.00, 18.00, 14.00, 14500000.00, 3),
      (?, '11kV/415V 500kVA Transformer, HT VCB, LT Distribution & Busducts', 'Electrical', 1.00, 'lot', 7500000.00, 18.00, 12.00, 7500000.00, 4),
      (?, 'Cleanroom Process Piping, Pre-Action Fire Sprinklers & High Purity Loop', 'Plumbing & Fire', 1.00, 'lot', 4500000.00, 18.00, 12.00, 4500000.00, 5),
      (?, 'Site Mobilization, Testing & Commissioning, Scaffolding & Compliance', 'Overheads', 1.00, 'lot', 3400169.49, 18.00, 8.00, 3400169.49, 6)
    `, [boqId, boqId, boqId, boqId, boqId, boqId]);
    console.log(`Added Approved BOQ ID: ${boqId} with 6 turnkey line items totalling ₹5,50,00,000.`);

    // 7. Insert Negotiation Rounds
    await connection.execute(`
      INSERT INTO negotiations (
        lead_id, round_number, revised_amount, discount_percent, status, requires_approval, notes, created_by_id, approved_by_id
      ) VALUES
      (?, 1, 58500000.00, 0.00, 'rejected', 0, 'Original quotation submitted based on detailed initial preliminary BOQ items.', 18, 17),
      (?, 2, 55000000.00, 5.98, 'approved', 0, 'Agreed final pricing at ₹5.50 Cr incorporating value engineering on cleanroom AHU air handling loops and stainless steel manifolds. Approved by MD & Client Board.', 18, 17)
    `, [leadId, leadId]);
    console.log("Added 2 Negotiation Rounds (Final Approved at ₹5.50 Cr).");

    console.log("\n=======================================================");
    console.log(`SUCCESS: End-to-End Sample Lead Created!`);
    console.log(`Lead ID: ${leadId}`);
    console.log(`Lead Number: ${leadNumber}`);
    console.log(`Client: Dr. Vikramaditya Oberoi (Apex Global Biotech & Healthcare Park)`);
    console.log(`Contract Budget: ₹5,50,00,000`);
    console.log(`Prerequisites: BOQ Approved (YES), Drawings Approved (YES) -> Ready for Handover!`);
    console.log(`Commercial Terms: 10% Advance (₹55L) | 10% ABG (₹55L) | 5% Retention (₹27.5L) | 12 Mo DLP`);
    console.log(`URL to test: http://localhost:5173/leads/${leadId}`);
    console.log("=======================================================\n");

  } catch (err) {
    console.error("Error seeding lead:", err);
  } finally {
    await connection.end();
  }
}

seedEndToEndLead();
