import mysql from "mysql2/promise";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

async function seed() {
  const pool = mysql.createPool(process.env.DATABASE_URL);

  // Check if site_workers is empty
  const [rows] = await pool.query("SELECT COUNT(*) as cnt FROM site_workers");
  if (rows[0].cnt > 0) {
    console.log("site_workers already has data, skipping.");
    await pool.end();
    return;
  }

  // Get project ids
  const [projects] = await pool.query("SELECT id FROM projects LIMIT 5");
  const p14 = projects.find(p => p.id === 14)?.id || projects[0]?.id || 14;
  const p1 = projects.find(p => p.id === 1)?.id || p14;
  const p3 = projects.find(p => p.id === 3)?.id || p14;

  const sampleWorkers = [
    // Project 14 Workers
    { projectId: p14, name: "Rajesh Sharma", category: "Supervisor", trade: "Site Supervision & QA", contractor: "Direct Site Hire", rate: 1350.00, phone: "+91 98765 43210" },
    { projectId: p14, name: "Vikramaditya Rao", category: "Supervisor", trade: "Substructure RCC", contractor: "L&T Civil Infrastructure", rate: 1400.00, phone: "+91 98765 43211" },
    { projectId: p14, name: "Amitabh Sen", category: "Supervisor", trade: "MEP Services", contractor: "Sterling MEP Contractors", rate: 1250.00, phone: "+91 98765 43212" },
    { projectId: p14, name: "Manoj Kumar", category: "Skilled", trade: "Bar Bending & Steelwork", contractor: "L&T Civil Infrastructure", rate: 950.00, phone: "+91 98765 43213" },
    { projectId: p14, name: "Deepak Verma", category: "Skilled", trade: "Carpentry & Shuttering", contractor: "Supreme Formwork Systems", rate: 900.00, phone: "+91 98765 43214" },
    { projectId: p14, name: "Sunil Chauhan", category: "Skilled", trade: "Masonry & AAC Blockwork", contractor: "Classic Masonry Works", rate: 850.00, phone: "+91 98765 43215" },
    { projectId: p14, name: "Arun Prasad", category: "Skilled", trade: "Electrical & Wiring", contractor: "Sterling MEP Contractors", rate: 920.00, phone: "+91 98765 43216" },
    { projectId: p14, name: "Girish Nayak", category: "Skilled", trade: "Plumbing & Sanitation", contractor: "Sterling MEP Contractors", rate: 880.00, phone: "+91 98765 43217" },
    { projectId: p14, name: "Farhan Akhtar", category: "Skilled", trade: "Flooring & Tiling", contractor: "Apex Flooring & Finishes", rate: 950.00, phone: "+91 98765 43218" },
    { projectId: p14, name: "Suresh Yadav", category: "Unskilled", trade: "General Labor & Curing", contractor: "Direct Labor Force", rate: 550.00, phone: "+91 98765 43219" },
    { projectId: p14, name: "Bablu Soren", category: "Unskilled", trade: "Concreting Helper", contractor: "L&T Civil Infrastructure", rate: 500.00, phone: "+91 98765 43220" },
    { projectId: p14, name: "Raju Mahato", category: "Unskilled", trade: "Material Shifting & Cleanup", contractor: "Supreme Formwork Systems", rate: 480.00, phone: "+91 98765 43221" },
    { projectId: p14, name: "Chandan Murmu", category: "Unskilled", trade: "Scaffold Assembly Helper", contractor: "Direct Labor Force", rate: 520.00, phone: "+91 98765 43222" },
    { projectId: p14, name: "Rameshwar Tudu", category: "Unskilled", trade: "Site Cleanup & Housekeeping", contractor: "Direct Labor Force", rate: 450.00, phone: "+91 98765 43223" },
    
    // Project 1 Workers
    { projectId: p1, name: "Kailash Chand", category: "Supervisor", trade: "Site Supervision", contractor: "Direct Site Hire", rate: 1300.00, phone: "+91 98765 43230" },
    { projectId: p1, name: "Imran Sheikh", category: "Skilled", trade: "Masonry & Plaster", contractor: "Classic Masonry Works", rate: 920.00, phone: "+91 98765 43231" },
    { projectId: p1, name: "Dilip Paswan", category: "Unskilled", trade: "General Labor", contractor: "Direct Labor Force", rate: 500.00, phone: "+91 98765 43232" },

    // Project 3 Workers
    { projectId: p3, name: "Mahesh Joshi", category: "Supervisor", trade: "Finishing Supervisor", contractor: "Apex Flooring & Finishes", rate: 1250.00, phone: "+91 98765 43240" },
    { projectId: p3, name: "Pankaj Sharma", category: "Skilled", trade: "Flooring & Tiling", contractor: "Apex Flooring & Finishes", rate: 950.00, phone: "+91 98765 43241" },
    { projectId: p3, name: "Santosh Roy", category: "Unskilled", trade: "Grouting & Cleanup", contractor: "Apex Flooring & Finishes", rate: 480.00, phone: "+91 98765 43242" },
  ];

  for (const w of sampleWorkers) {
    const [res] = await pool.query(
      `INSERT INTO site_workers (project_id, name, category, trade, contractor_name, daily_wage_rate, phone, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'active')`,
      [w.projectId, w.name, w.category, w.trade, w.contractor, w.rate, w.phone]
    );
    w.id = res.insertId;
  }

  console.log(`Inserted ${sampleWorkers.length} site workers.`);

  // Generate attendance for today and past 14 days
  const today = new Date();
  const dates = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split("T")[0]);
  }

  let totalAtt = 0;
  for (const dateStr of dates) {
    for (const w of sampleWorkers) {
      // Random attendance distribution: 80% Present, 12% Half-Day, 8% Absent
      const rand = (w.id * 17 + dates.indexOf(dateStr) * 31) % 100;
      let status = "present";
      let daysWorked = 1.00;
      if (rand >= 90) {
        status = "absent";
        daysWorked = 0.00;
      } else if (rand >= 78) {
        status = "half_day";
        daysWorked = 0.50;
      }

      const payable = (daysWorked * w.rate);

      await pool.query(
        `INSERT IGNORE INTO site_worker_attendance
         (worker_id, project_id, attendance_date, status, days_worked, daily_wage_rate, payable_amount, shift, remarks, created_by_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'Day Shift', ?, 1)`,
        [w.id, w.projectId, dateStr, status, daysWorked, w.rate, payable, status === "half_day" ? "Half day afternoon" : null]
      );
      totalAtt++;
    }
  }

  console.log(`Seeded ${totalAtt} worker attendance records across ${dates.length} days!`);
  await pool.end();
}

seed().catch(err => {
  console.error("Seed error:", err);
  process.exit(1);
});
