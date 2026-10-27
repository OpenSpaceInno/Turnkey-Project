import mysql from "mysql2/promise";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

async function seed() {
  const pool = mysql.createPool(process.env.DATABASE_URL);

  const projectsToSeed = [19, 14];

  for (const prjId of projectsToSeed) {
    const [existing] = await pool.query("SELECT COUNT(*) as cnt FROM site_workers WHERE project_id = ?", [prjId]);
    if (existing[0].cnt > 0) {
      console.log(`Project ${prjId} already has ${existing[0].cnt} workers.`);
      continue;
    }

    const workers = [
      // Supervisors
      { name: "Rameshwar Sen", category: "Supervisor", trade: "Site Supervision & QA", contractor: "Direct Site Hire", rate: 1400.00, phone: "+91 98111 22331" },
      { name: "Anand Verma", category: "Supervisor", trade: "RCC & Structural", contractor: "L&T Civil Infrastructure", rate: 1350.00, phone: "+91 98111 22332" },
      { name: "Dinesh Patil", category: "Supervisor", trade: "MEP & Electrical", contractor: "Sterling MEP Contractors", rate: 1250.00, phone: "+91 98111 22333" },

      // Skilled Workers (different rates per worker!)
      { name: "Manoj Kumar", category: "Skilled", trade: "Bar Bending & Steelwork", contractor: "L&T Civil Infrastructure", rate: 950.00, phone: "+91 98111 22334" },
      { name: "Deepak Chauhan", category: "Skilled", trade: "Carpentry & Shuttering", contractor: "Supreme Formwork Systems", rate: 920.00, phone: "+91 98111 22335" },
      { name: "Sunil Sharma", category: "Skilled", trade: "Masonry & AAC Blockwork", contractor: "Classic Masonry Works", rate: 880.00, phone: "+91 98111 22336" },
      { name: "Arun Prasad", category: "Skilled", trade: "Electrical & Wiring", contractor: "Sterling MEP Contractors", rate: 940.00, phone: "+91 98111 22337" },
      { name: "Girish Nayak", category: "Skilled", trade: "Plumbing & Sanitation", contractor: "Sterling MEP Contractors", rate: 890.00, phone: "+91 98111 22338" },
      { name: "Farhan Akhtar", category: "Skilled", trade: "Flooring & Tiling", contractor: "Apex Flooring & Finishes", rate: 960.00, phone: "+91 98111 22339" },
      { name: "Pradeep Joshi", category: "Skilled", trade: "Painting & Finishing", contractor: "Apex Flooring & Finishes", rate: 850.00, phone: "+91 98111 22340" },
      { name: "Santosh Mhatre", category: "Skilled", trade: "HVAC & Firefighting", contractor: "Sterling MEP Contractors", rate: 980.00, phone: "+91 98111 22341" },

      // Unskilled Workers (different rates per worker!)
      { name: "Suresh Yadav", category: "Unskilled", trade: "General Labor & Curing", contractor: "Direct Labor Force", rate: 550.00, phone: "+91 98111 22342" },
      { name: "Bablu Soren", category: "Unskilled", trade: "Concreting Helper", contractor: "L&T Civil Infrastructure", rate: 520.00, phone: "+91 98111 22343" },
      { name: "Raju Mahato", category: "Unskilled", trade: "Material Shifting & Cleanup", contractor: "Supreme Formwork Systems", rate: 480.00, phone: "+91 98111 22344" },
      { name: "Chandan Murmu", category: "Unskilled", trade: "Scaffold Assembly Helper", contractor: "Direct Labor Force", rate: 530.00, phone: "+91 98111 22345" },
      { name: "Rameshwar Tudu", category: "Unskilled", trade: "Site Cleanup & Housekeeping", contractor: "Direct Labor Force", rate: 460.00, phone: "+91 98111 22346" },
      { name: "Govind Das", category: "Unskilled", trade: "Earthwork Helper", contractor: "Direct Labor Force", rate: 490.00, phone: "+91 98111 22347" },
    ];

    const insertedWorkers = [];
    for (const w of workers) {
      const [res] = await pool.query(
        `INSERT INTO site_workers (project_id, name, category, trade, contractor_name, daily_wage_rate, phone, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'active')`,
        [prjId, w.name, w.category, w.trade, w.contractor, w.rate, w.phone]
      );
      insertedWorkers.push({ ...w, id: res.insertId });
    }

    console.log(`Inserted ${insertedWorkers.length} workers for Project ${prjId}`);

    // Generate attendance for today and past 14 days
    const today = new Date();
    const dates = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split("T")[0]);
    }

    let attCount = 0;
    for (const dateStr of dates) {
      for (const w of insertedWorkers) {
        const hash = (w.id * 19 + dates.indexOf(dateStr) * 23) % 100;
        let status = "present";
        let daysWorked = 1.00;
        if (hash >= 90) {
          status = "absent";
          daysWorked = 0.00;
        } else if (hash >= 78) {
          status = "half_day";
          daysWorked = 0.50;
        }

        const payable = daysWorked * w.rate;
        await pool.query(
          `INSERT IGNORE INTO site_worker_attendance
           (worker_id, project_id, attendance_date, status, days_worked, daily_wage_rate, payable_amount, shift, remarks, created_by_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'Day Shift', ?, 1)`,
          [w.id, prjId, dateStr, status, daysWorked, w.rate, payable, status === "half_day" ? "Half-day 1st half" : null]
        );
        attCount++;
      }
    }
    console.log(`Created ${attCount} attendance records for Project ${prjId}`);
  }

  await pool.end();
}

seed().catch(err => {
  console.error("Seed error:", err);
  process.exit(1);
});
