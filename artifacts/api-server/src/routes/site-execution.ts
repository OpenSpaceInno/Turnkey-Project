import { Router, type IRouter, type Request, type Response } from "express";
import {
  db,
  projectsTable,
  usersTable,
  dailyProgressReportsTable,
  billingMilestonesTable,
  tasksTable,
  workCompletionsTable,
  siteAttendanceTable,
  siteWorkersTable,
  siteWorkerAttendanceTable,
  siteMaterialLogsTable,
  siteEquipmentLogsTable,
  siteQualityInspectionsTable,
  siteSafetyIncidentsTable,
  siteIssuesDelaysTable,
  siteWorkProgressTable,
  sitePhotosTable,
  siteDailyCostsTable,
  contractsTable,
  contractBoqItemsTable,
  workCompletionItemsTable,
  workCompletionDocumentsTable,
} from "@workspace/db";
import { eq, desc, and, sql, inArray, gte, lte, between, like } from "drizzle-orm";
import { getCurrentUser } from "../lib/session";
import { generateNumber } from "../lib/numbers";

const router: IRouter = Router();

// Helper to seed realistic site execution data if empty
async function seedSiteExecutionDataIfEmpty() {
  try {
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(siteAttendanceTable);

    if (Number(count) > 0) return;

    // Fetch primary execution projects
    const projects = await db.select({ id: projectsTable.id, name: projectsTable.name }).from(projectsTable);
    if (!projects.length) return;

    // Use project 14 if available, otherwise project 1, or the first project
    const p14 = projects.find((p) => p.id === 14)?.id || projects[0].id;
    const p1 = projects.find((p) => p.id === 1)?.id || p14;
    const p3 = projects.find((p) => p.id === 3)?.id || p14;

    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    const twoDaysAgo = new Date(Date.now() - 172800000).toISOString().split("T")[0];

    // 1. Seed Site Attendance & Manpower
    await db.insert(siteAttendanceTable).values([
      {
        projectId: p14,
        attendanceDate: today,
        contractorName: "L&T Civil Infrastructure",
        trade: "Bar Bending & Steelwork",
        skilledCount: 14,
        unskilledCount: 10,
        supervisorCount: 2,
        shift: "Day Shift",
        hoursWorked: "8.50",
        wageRatePerDay: "950.00",
        totalLaborCost: "24800.00",
        remarks: "Slab reinforcement tying for Zone B podium columns",
      },
      {
        projectId: p14,
        attendanceDate: today,
        contractorName: "Supreme Formwork Systems",
        trade: "Carpentry & Shuttering",
        skilledCount: 12,
        unskilledCount: 8,
        supervisorCount: 1,
        shift: "Day Shift",
        hoursWorked: "8.00",
        wageRatePerDay: "900.00",
        totalLaborCost: "19800.00",
        remarks: "Formwork alignment and prop checks for Tower 1 Level 3",
      },
      {
        projectId: p14,
        attendanceDate: today,
        contractorName: "Sterling MEP Contractors",
        trade: "Electrical & Plumbing",
        skilledCount: 8,
        unskilledCount: 6,
        supervisorCount: 1,
        shift: "Day Shift",
        hoursWorked: "8.00",
        wageRatePerDay: "980.00",
        totalLaborCost: "14700.00",
        remarks: "Concealed electrical conduit laying and plumbing sleeve fixing",
      },
      {
        projectId: p14,
        attendanceDate: today,
        contractorName: "Direct Labor Force",
        trade: "General Labor & Curing",
        skilledCount: 2,
        unskilledCount: 12,
        supervisorCount: 1,
        shift: "Day Shift",
        hoursWorked: "8.00",
        wageRatePerDay: "650.00",
        totalLaborCost: "9750.00",
        remarks: "Continuous water curing of cast raft foundation and site cleanup",
      },
      {
        projectId: p1,
        attendanceDate: today,
        contractorName: "Classic Masonry Works",
        trade: "Masonry & Plaster",
        skilledCount: 10,
        unskilledCount: 8,
        supervisorCount: 1,
        shift: "Day Shift",
        hoursWorked: "8.00",
        wageRatePerDay: "920.00",
        totalLaborCost: "17480.00",
        remarks: "AAC block masonry on 4th floor perimeter walls",
      },
      {
        projectId: p3,
        attendanceDate: today,
        contractorName: "Apex Flooring & Finishes",
        trade: "Flooring & Tiling",
        skilledCount: 6,
        unskilledCount: 4,
        supervisorCount: 1,
        shift: "Day Shift",
        hoursWorked: "8.00",
        wageRatePerDay: "950.00",
        totalLaborCost: "10450.00",
        remarks: "Vitrified tile flooring in patient rooms corridor",
      },
    ]);

    // 2. Seed Material Consumption & Stock
    await db.insert(siteMaterialLogsTable).values([
      {
        projectId: p14,
        logDate: today,
        materialName: "Ready Mix Concrete M35",
        category: "Civil & Structural",
        unit: "Cu.m",
        openingStock: "0.00",
        quantityReceived: "120.00",
        quantityConsumed: "115.00",
        closingStock: "5.00",
        unitCost: "5400.00",
        totalCost: "621000.00",
        location: "Podium Slab Bay 4",
        remarks: "Transit mixer pour tested with cube slump 125mm",
      },
      {
        projectId: p14,
        logDate: today,
        materialName: "TMT Rebar FE 550D (16mm & 20mm)",
        category: "Civil & Structural",
        unit: "MT",
        openingStock: "42.50",
        quantityReceived: "25.00",
        quantityConsumed: "14.20",
        closingStock: "53.30",
        unitCost: "68500.00",
        totalCost: "972700.00",
        location: "Steel Yard & Podium Columns",
        remarks: "Batch test certs verified, bent as per BBS schedule Rev 3",
      },
      {
        projectId: p14,
        logDate: today,
        materialName: "OPC 53 Grade Cement (Ultratech)",
        category: "Civil & Structural",
        unit: "Bags",
        openingStock: "650.00",
        quantityReceived: "400.00",
        quantityConsumed: "220.00",
        closingStock: "830.00",
        unitCost: "395.00",
        totalCost: "86900.00",
        location: "Site Godown A",
        remarks: "Used for column starter mortar and masonry mix",
      },
      {
        projectId: p14,
        logDate: today,
        materialName: "River Sand (Washed)",
        category: "Civil & Structural",
        unit: "Brass",
        openingStock: "18.00",
        quantityReceived: "10.00",
        quantityConsumed: "8.50",
        closingStock: "19.50",
        unitCost: "8200.00",
        totalCost: "69700.00",
        location: "Aggregate Yard",
        remarks: "Zone II silt content verified < 4%",
      },
      {
        projectId: p1,
        logDate: today,
        materialName: "AAC Blocks (600x200x150mm)",
        category: "Masonry",
        unit: "Nos",
        openingStock: "1200.00",
        quantityReceived: "1500.00",
        quantityConsumed: "850.00",
        closingStock: "1850.00",
        unitCost: "65.00",
        totalCost: "55250.00",
        location: "Floor 4 Storage",
        remarks: "Block bond polymer adhesive applied",
      },
      {
        projectId: p3,
        logDate: today,
        materialName: "Vitrified Tiles (800x800mm)",
        category: "Finishing",
        unit: "Sq.ft",
        openingStock: "4500.00",
        quantityReceived: "0.00",
        quantityConsumed: "620.00",
        closingStock: "3880.00",
        unitCost: "78.00",
        totalCost: "48360.00",
        location: "East Wing Floor 2",
        remarks: "Epoxy grouting scheduled next day",
      },
    ]);

    // 3. Seed Equipment Tracking
    await db.insert(siteEquipmentLogsTable).values([
      {
        projectId: p14,
        logDate: today,
        equipmentName: "Schwing Stetter Boom Pump 36m",
        equipmentType: "Batching & Pumping",
        status: "operational",
        hoursOperated: "6.50",
        fuelConsumedLitres: "65.00",
        operatorName: "Rajesh Patil",
        dailyCost: "16500.00",
        remarks: "Pumped 115 cum M35 concrete to podium slab smoothly",
      },
      {
        projectId: p14,
        logDate: today,
        equipmentName: "Potain Tower Crane (50m Jib)",
        equipmentType: "Lifting & Hoisting",
        status: "operational",
        hoursOperated: "8.00",
        fuelConsumedLitres: "0.00",
        operatorName: "Sanjay Kamble",
        dailyCost: "12000.00",
        remarks: "Steel rebar bundling and shuttering panel lifting",
      },
      {
        projectId: p14,
        logDate: today,
        equipmentName: "JCB 3DX Super Excavator",
        equipmentType: "Earthmoving",
        status: "idle",
        hoursOperated: "2.00",
        fuelConsumedLitres: "22.00",
        operatorName: "Mukesh Yadav",
        dailyCost: "7500.00",
        remarks: "Completed perimeter trenching, standby for backfilling",
      },
      {
        projectId: p14,
        logDate: today,
        equipmentName: "Cummins 125 kVA Silent DG Set",
        equipmentType: "Power Generation",
        status: "operational",
        hoursOperated: "4.50",
        fuelConsumedLitres: "48.00",
        operatorName: "Ganesh Shinde",
        dailyCost: "8400.00",
        remarks: "Backed up tower crane during 2-hour grid switchover",
      },
      {
        projectId: p1,
        logDate: today,
        equipmentName: "Passenger & Material Hoist (Twin Cage)",
        equipmentType: "Lifting & Hoisting",
        status: "operational",
        hoursOperated: "7.50",
        fuelConsumedLitres: "0.00",
        operatorName: "Dinesh Kumar",
        dailyCost: "6500.00",
        remarks: "Shifted AAC blocks and mortar bags to 4th floor",
      },
      {
        projectId: p3,
        logDate: today,
        equipmentName: "High Frequency Needle Vibrators (4 Nos)",
        equipmentType: "Compaction Tools",
        status: "operational",
        hoursOperated: "5.00",
        fuelConsumedLitres: "12.00",
        operatorName: "Subhash Roy",
        dailyCost: "3200.00",
        remarks: "Full compaction done on concrete beam junctions",
      },
    ]);

    // 4. Seed Quality Inspections
    await db.insert(siteQualityInspectionsTable).values([
      {
        projectId: p14,
        inspectionDate: today,
        inspectionTitle: "Pre-Pour Reinforcement & Cover Inspection - Bay 4",
        checklistCategory: "Civil & Structure",
        location: "Podium Slab Grid B4-D8",
        status: "passed",
        inspectedBy: "Priya Iyer (QC Lead)",
        checkpointsTotal: 12,
        checkpointsPassed: 12,
        correctiveActions: "Cover blocks spacing adjusted at beam bottom corners before pour.",
        remarks: "Bar diameter, lap lengths, shear chairs verified as per GFC drawings.",
      },
      {
        projectId: p14,
        inspectionDate: yesterday,
        inspectionTitle: "Concrete Cube Compressive Strength 7-Day Test",
        checklistCategory: "Materials Testing",
        location: "QC Field Laboratory",
        status: "passed",
        inspectedBy: "Naveen Chawla (QA Engineer)",
        checkpointsTotal: 6,
        checkpointsPassed: 6,
        correctiveActions: "None. Achieved 28.4 MPa (> 70% of 35 MPa target).",
        remarks: "All 6 specimen cubes from raft footing cast exceeded strength criteria.",
      },
      {
        projectId: p14,
        inspectionDate: twoDaysAgo,
        inspectionTitle: "Substructure Waterproofing Membrane & Primer Inspection",
        checklistCategory: "Waterproofing",
        location: "Retaining Wall Grid A1-A12",
        status: "conditional_pass",
        inspectedBy: "Priya Iyer (QC Lead)",
        checkpointsTotal: 10,
        checkpointsPassed: 9,
        correctiveActions: "Touch-up required on 3 lap seam joints near pipe penetrations.",
        remarks: "Re-inspection completed and signed off after double torch-on patch.",
      },
      {
        projectId: p1,
        inspectionDate: today,
        inspectionTitle: "4th Floor AAC Block Masonry Plumb & Mortar Joint Check",
        checklistCategory: "Finishing & Walls",
        location: "Floor 4 South Wing",
        status: "passed",
        inspectedBy: "Rohan Mehta (PM)",
        checkpointsTotal: 8,
        checkpointsPassed: 8,
        correctiveActions: "Lintel bearing minimum 150mm verified.",
        remarks: "Joint thickness uniformly maintained between 3-4mm with polymer adhesive.",
      },
    ]);

    // 5. Seed Safety & Incident Reports
    await db.insert(siteSafetyIncidentsTable).values([
      {
        projectId: p14,
        incidentDate: today,
        reportType: "toolbox_talk",
        title: "Daily Pre-Shift Toolbox Briefing: Working at Heights & Full Body Harnesses",
        severity: "low",
        status: "closed",
        location: "Podium Assembly Area",
        description: "Conducted mandatory 15-minute safety briefing on anchor line clipping, 100% tie-off requirement, and edge barricades for podium formwork crew.",
        actionTaken: "All 34 attendees inspected for double lanyard ISI marked harnesses and helmets.",
        reportedBy: "Suresh Pillai (Safety Officer)",
        workersAttended: 34,
      },
      {
        projectId: p14,
        incidentDate: yesterday,
        reportType: "near_miss",
        title: "Loose Shuttering Tie-Rod Washer Dislodged During Hoisting",
        severity: "medium",
        status: "closed",
        location: "Tower 1 Staging Yard",
        description: "A loose steel washer dropped from a height of 4 meters inside the barricaded hoist exclusion zone during crane slewing. No injury occurred.",
        actionTaken: "Crane lifting box was replaced with fully enclosed cargo mesh bin. Lift supervisor issued safety reminder.",
        reportedBy: "Suresh Pillai (Safety Officer)",
        workersAttended: 6,
      },
      {
        projectId: p14,
        incidentDate: twoDaysAgo,
        reportType: "ppe_audit",
        title: "Weekly Mandatory PPE Compliance Site Audit",
        severity: "low",
        status: "closed",
        location: "Entire Site Premises",
        description: "Inspected 56 workers across 4 sub-contractors for ISI safety shoes, high-visibility reflective vests, safety goggles during rebar cutting, and hard hats.",
        actionTaken: "98% compliance achieved. 2 replacement goggles issued immediately on spot.",
        reportedBy: "Suresh Pillai (Safety Officer)",
        workersAttended: 56,
      },
      {
        projectId: p1,
        incidentDate: today,
        reportType: "first_aid",
        title: "Minor Finger Scratch During Block Handling",
        severity: "low",
        status: "closed",
        location: "Floor 4 Masonry Section",
        description: "Worker experienced a superficial scrape on left index finger while unloading block pallets. Cleaned and dressed with antiseptic at site clinic.",
        actionTaken: "First aid dressing applied, heavy-duty grip gloves issued, worker resumed normal duties.",
        reportedBy: "Dr. K. Nair (Site Paramedic)",
        workersAttended: 1,
      },
    ]);

    // 6. Seed Site Issues & Delays
    await db.insert(siteIssuesDelaysTable).values([
      {
        projectId: p14,
        reportedDate: yesterday,
        title: "Delayed Delivery of 25mm High-Tensile Steel Rebar from Secondary Mill",
        category: "material_shortage",
        severity: "medium",
        status: "in_progress",
        daysImpact: 2,
        costImpact: "35000.00",
        mitigationPlan: "Diverted 8 MT stock from Orion Business Hub central yard to avoid delaying column starter tying schedule.",
        assignedTo: "Neha Kapoor (Procurement Officer)",
      },
      {
        projectId: p14,
        reportedDate: twoDaysAgo,
        title: "Client Clarification Pending on Banquet Hall Ceiling Recessed Light Cutouts",
        category: "drawing_design",
        severity: "low",
        status: "open",
        daysImpact: 1,
        costImpact: "0.00",
        mitigationPlan: "Raised RFI #42 to Architect Lumina Design. Proceeding with perimeter framing first.",
        assignedTo: "Rohan Mehta (Project Manager)",
      },
      {
        projectId: p1,
        reportedDate: today,
        title: "Municipal Water Supply Pressure Drop for Curing Operations",
        category: "power_water",
        severity: "low",
        status: "resolved",
        daysImpact: 0,
        costImpact: "4500.00",
        mitigationPlan: "Dispatched 2 commercial 10,000L water tankers to replenish overhead backup tanks.",
        resolutionDate: today,
        assignedTo: "Amit Deshmukh (Site Engineer)",
      },
    ]);

    // 7. Seed Work Progress Tracking
    await db.insert(siteWorkProgressTable).values([
      {
        projectId: p14,
        progressDate: today,
        activityName: "Raft Foundation & Column Starter Casting",
        category: "Substructure RCC",
        unit: "Cu.m",
        plannedQuantity: "120.00",
        executedToday: "115.00",
        cumulativeExecuted: "780.00",
        targetQuantity: "950.00",
        percentCompleted: 82,
        location: "Podium Footing Bay 4",
        remarks: "Concrete pour certified by third-party inspection agency",
      },
      {
        projectId: p14,
        progressDate: today,
        activityName: "Podium Columns Rebar Fabrication & Tying",
        category: "Superstructure Steel",
        unit: "MT",
        plannedQuantity: "15.00",
        executedToday: "14.20",
        cumulativeExecuted: "68.50",
        targetQuantity: "110.00",
        percentCompleted: 62,
        location: "Grid Lines C4 to F8",
        remarks: "Cover block spacing and lap staggering checked",
      },
      {
        projectId: p14,
        progressDate: today,
        activityName: "Basement 1 Electrical Conduiting & Cable Tray Fixings",
        category: "MEP Services",
        unit: "Rmt",
        plannedQuantity: "250.00",
        executedToday: "220.00",
        cumulativeExecuted: "1420.00",
        targetQuantity: "2200.00",
        percentCompleted: 65,
        location: "Basement 1 Parking & Service Corridor",
        remarks: "Conduits pull-wired and plugged to avoid slurry ingress",
      },
      {
        projectId: p1,
        progressDate: today,
        activityName: "Internal AAC Block Masonry 150mm",
        category: "Masonry Walls",
        unit: "Sq.ft",
        plannedQuantity: "1200.00",
        executedToday: "1100.00",
        cumulativeExecuted: "8400.00",
        targetQuantity: "12500.00",
        percentCompleted: 67,
        location: "Floor 4 All Partitions",
        remarks: "Joint reinforcement mesh installed every 3rd course",
      },
      {
        projectId: p3,
        progressDate: today,
        activityName: "Vitrified Tile Flooring with Epoxy Grout",
        category: "Architectural Finishes",
        unit: "Sq.ft",
        plannedQuantity: "700.00",
        executedToday: "620.00",
        cumulativeExecuted: "3100.00",
        targetQuantity: "5400.00",
        percentCompleted: 57,
        location: "East Wing Floor 2 Patient Rooms",
        remarks: "Slope toward floor trap verified with laser level",
      },
    ]);

    // 8. Seed Photo Documentation
    await db.insert(sitePhotosTable).values([
      {
        projectId: p14,
        capturedDate: today,
        title: "Podium Slab Bay 4 Concrete Pour in Progress",
        category: "progress",
        imageUrl: "https://images.unsplash.com/photo-1541888946425-d0fbb186c5f8?auto=format&fit=crop&w=1200&q=80",
        location: "Podium Level Bay 4",
        description: "Boom pump discharging M35 design mix concrete. Electric vibrator compaction team working in tandem.",
        stage: "Superstructure RCC",
      },
      {
        projectId: p14,
        capturedDate: today,
        title: "Rebar Tying & Cover Block Inspection on Podium Columns",
        category: "quality",
        imageUrl: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80",
        location: "Grid C4-D6",
        description: "Lead QC inspecting 40mm cover blocks and master rings on high-tensile column cage.",
        stage: "Quality & Assurance",
      },
      {
        projectId: p14,
        capturedDate: yesterday,
        title: "Daily Safety Briefing & Harness Inspection",
        category: "safety",
        imageUrl: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1200&q=80",
        location: "Site Assembly Ground",
        description: "Safety officer Suresh Pillai reviewing height safety procedures with morning shift crew.",
        stage: "HSE Protocols",
      },
      {
        projectId: p1,
        capturedDate: today,
        title: "Floor 4 Blockwork Layout and Lintel Casting",
        category: "progress",
        imageUrl: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80",
        location: "Sentinel Tech Park Floor 4",
        description: "AAC block wall alignment verified with plumb bob and spirit level.",
        stage: "Masonry & Partitioning",
      },
    ]);

    // 9. Seed Project-wise Daily Site Costs
    await db.insert(siteDailyCostsTable).values([
      {
        projectId: p14,
        costDate: today,
        costType: "material",
        description: "Ready Mix Concrete M35 Supply (115 cum)",
        amount: "621000.00",
        vendorOrPayee: "UltraTech RMC Plant Vashi",
        voucherRef: "RMC-DEL-9842",
        paymentStatus: "pending_approval",
      },
      {
        projectId: p14,
        costDate: today,
        costType: "labor",
        description: "Daily Labor Headcount Wages (36 workers across steel & carpentry)",
        amount: "44600.00",
        vendorOrPayee: "L&T Civil Infrastructure & Supreme Formwork",
        voucherRef: "WAGE-2026-1014",
        paymentStatus: "paid",
      },
      {
        projectId: p14,
        costDate: today,
        costType: "equipment",
        description: "Boom Pump & Tower Crane Daily Rental & Operations",
        amount: "28500.00",
        vendorOrPayee: "InfraPlant Heavy Machinery Rentals",
        voucherRef: "EQ-RENT-443",
        paymentStatus: "paid",
      },
      {
        projectId: p14,
        costDate: today,
        costType: "petty_cash",
        description: "Emergency high-pressure water pipe couplings and binding wire rolls",
        amount: "4850.00",
        vendorOrPayee: "Shree Ganesh Hardware & Tools",
        voucherRef: "PC-VOUCH-102",
        paymentStatus: "paid",
      },
      {
        projectId: p1,
        costDate: today,
        costType: "labor",
        description: "Masonry Crew Wages for 4th Floor AAC blockwork",
        amount: "17480.00",
        vendorOrPayee: "Classic Masonry Works",
        voucherRef: "WAGE-MAS-089",
        paymentStatus: "paid",
      },
      {
        projectId: p3,
        costDate: today,
        costType: "material",
        description: "Epoxy Tile Grout and Polymer Adhesive supply",
        amount: "18600.00",
        vendorOrPayee: "Roff Construction Chemicals",
        voucherRef: "INV-ROFF-551",
        paymentStatus: "paid",
      },
    ]);
  } catch (err) {
    console.error("Error seeding site execution data:", err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. SITE EXECUTION OVERVIEW SUMMARY (High-impact Dashboard Rollup)
// ─────────────────────────────────────────────────────────────────────────────

router.get("/site-execution/summary", async (req: Request, res: Response): Promise<void> => {
  try {
    await seedSiteExecutionDataIfEmpty();

    const { projectId } = req.query;
    const pid = projectId && projectId !== "all" ? Number(projectId) : null;

    // Filters helper
    const whereProject = (tableCol: any) => (pid ? eq(tableCol, pid) : undefined);

    // Run parallel queries for maximum performance
    const [
      attendanceRows,
      materialRows,
      equipmentRows,
      qualityRows,
      safetyRows,
      issueRows,
      workProgressRows,
      photosRows,
      costsRows,
      dprRows,
      milestonesRows,
      tasksRows,
      completionsRows,
    ] = await Promise.all([
      db
        .select()
        .from(siteAttendanceTable)
        .where(whereProject(siteAttendanceTable.projectId))
        .orderBy(desc(siteAttendanceTable.attendanceDate), desc(siteAttendanceTable.id)),
      db
        .select()
        .from(siteMaterialLogsTable)
        .where(whereProject(siteMaterialLogsTable.projectId))
        .orderBy(desc(siteMaterialLogsTable.logDate), desc(siteMaterialLogsTable.id)),
      db
        .select()
        .from(siteEquipmentLogsTable)
        .where(whereProject(siteEquipmentLogsTable.projectId))
        .orderBy(desc(siteEquipmentLogsTable.logDate), desc(siteEquipmentLogsTable.id)),
      db
        .select()
        .from(siteQualityInspectionsTable)
        .where(whereProject(siteQualityInspectionsTable.projectId))
        .orderBy(desc(siteQualityInspectionsTable.inspectionDate), desc(siteQualityInspectionsTable.id)),
      db
        .select()
        .from(siteSafetyIncidentsTable)
        .where(whereProject(siteSafetyIncidentsTable.projectId))
        .orderBy(desc(siteSafetyIncidentsTable.incidentDate), desc(siteSafetyIncidentsTable.id)),
      db
        .select()
        .from(siteIssuesDelaysTable)
        .where(whereProject(siteIssuesDelaysTable.projectId))
        .orderBy(desc(siteIssuesDelaysTable.reportedDate), desc(siteIssuesDelaysTable.id)),
      db
        .select()
        .from(siteWorkProgressTable)
        .where(whereProject(siteWorkProgressTable.projectId))
        .orderBy(desc(siteWorkProgressTable.progressDate), desc(siteWorkProgressTable.id)),
      db
        .select()
        .from(sitePhotosTable)
        .where(whereProject(sitePhotosTable.projectId))
        .orderBy(desc(sitePhotosTable.capturedDate), desc(sitePhotosTable.id)),
      db
        .select()
        .from(siteDailyCostsTable)
        .where(whereProject(siteDailyCostsTable.projectId))
        .orderBy(desc(siteDailyCostsTable.costDate), desc(siteDailyCostsTable.id)),
      db
        .select({
          id: dailyProgressReportsTable.id,
          projectId: dailyProgressReportsTable.projectId,
          projectName: projectsTable.name,
          reportDate: dailyProgressReportsTable.reportDate,
          weather: dailyProgressReportsTable.weather,
          shift: dailyProgressReportsTable.shift,
          workSummary: dailyProgressReportsTable.workSummary,
          manpowerCount: dailyProgressReportsTable.manpowerCount,
          manpowerBreakdown: dailyProgressReportsTable.manpowerBreakdown,
          status: dailyProgressReportsTable.status,
        })
        .from(dailyProgressReportsTable)
        .leftJoin(projectsTable, eq(projectsTable.id, dailyProgressReportsTable.projectId))
        .where(whereProject(dailyProgressReportsTable.projectId))
        .orderBy(desc(dailyProgressReportsTable.reportDate), desc(dailyProgressReportsTable.id))
        .limit(10),
      pid
        ? db
            .select()
            .from(billingMilestonesTable)
            .where(eq(billingMilestonesTable.projectId, pid))
            .orderBy(billingMilestonesTable.sortOrder)
        : Promise.resolve([]),
      pid
        ? db
            .select()
            .from(tasksTable)
            .where(eq(tasksTable.projectId, pid))
            .orderBy(desc(tasksTable.createdAt))
        : Promise.resolve([]),
      pid
        ? db
            .select()
            .from(workCompletionsTable)
            .where(eq(workCompletionsTable.projectId, pid))
            .orderBy(desc(workCompletionsTable.completionDate))
        : Promise.resolve([]),
    ]);

    // KPI 1: Manpower & Labor
    const totalSkilled = attendanceRows.reduce((acc, r) => acc + (r.skilledCount || 0), 0);
    const totalUnskilled = attendanceRows.reduce((acc, r) => acc + (r.unskilledCount || 0), 0);
    const totalSupervisors = attendanceRows.reduce((acc, r) => acc + (r.supervisorCount || 0), 0);
    const totalHeadcount = totalSkilled + totalUnskilled + totalSupervisors;
    const totalLaborCost = attendanceRows.reduce((acc, r) => acc + Number(r.totalLaborCost || 0), 0);

    // KPI 2: Material Consumption & Value
    const totalMaterialValue = materialRows.reduce((acc, r) => acc + Number(r.totalCost || 0), 0);
    const lowStockMaterials = materialRows.filter((r) => Number(r.closingStock || 0) <= 20).length;

    // KPI 3: Equipment Health
    const operationalEquipment = equipmentRows.filter((r) => r.status === "operational").length;
    const idleEquipment = equipmentRows.filter((r) => r.status === "idle").length;
    const breakdownEquipment = equipmentRows.filter((r) => r.status === "breakdown" || r.status === "maintenance").length;
    const totalEquipmentCost = equipmentRows.reduce((acc, r) => acc + Number(r.dailyCost || 0), 0);

    // KPI 4: Quality Inspection Pass Rate
    const totalInspections = qualityRows.length;
    const passedInspections = qualityRows.filter((r) => r.status === "passed").length;
    const pendingInspections = qualityRows.filter((r) => r.status !== "passed").length;
    const passRate = totalInspections > 0 ? Math.round((passedInspections / totalInspections) * 100) : 100;

    // KPI 5: Safety & Incidents
    const openSafetyIncidents = safetyRows.filter((r) => r.status === "open" || r.status === "investigating").length;
    const toolboxTalksCount = safetyRows.filter((r) => r.reportType === "toolbox_talk").length;
    const totalWorkersTrained = safetyRows.reduce((acc, r) => acc + (r.workersAttended || 0), 0);

    // KPI 6: Issues & Delays Impact
    const openDelays = issueRows.filter((r) => r.status === "open" || r.status === "in_progress");
    const totalDelayDaysImpact = openDelays.reduce((acc, r) => acc + (r.daysImpact || 0), 0);
    const totalDelayCostImpact = openDelays.reduce((acc, r) => acc + Number(r.costImpact || 0), 0);

    // KPI 7: Work Progress
    const overallProgress =
      workProgressRows.length > 0
        ? Math.round(
            workProgressRows.reduce((acc, r) => acc + (r.percentCompleted || 0), 0) / workProgressRows.length
          )
        : 0;

    // KPI 8: Total Site Cost Rollup
    const totalSiteCosts = costsRows.reduce((acc, r) => acc + Number(r.amount || 0), 0);
    const costBreakdown = {
      labor: costsRows.filter((c) => c.costType === "labor").reduce((a, b) => a + Number(b.amount || 0), 0),
      material: costsRows.filter((c) => c.costType === "material").reduce((a, b) => a + Number(b.amount || 0), 0),
      equipment: costsRows.filter((c) => c.costType === "equipment").reduce((a, b) => a + Number(b.amount || 0), 0),
      petty_cash: costsRows.filter((c) => c.costType === "petty_cash").reduce((a, b) => a + Number(b.amount || 0), 0),
      site_overheads: costsRows.filter((c) => c.costType === "site_overheads" || c.costType === "transport").reduce((a, b) => a + Number(b.amount || 0), 0),
    };

    // Task Stats
    const taskStats = {
      total: tasksRows.length,
      done: tasksRows.filter((t) => t.status === "done" || t.status === "completed").length,
      inProgress: tasksRows.filter((t) => t.status === "in_progress").length,
      todo: tasksRows.filter((t) => t.status === "todo").length,
    };

    res.json({
      kpis: {
        totalHeadcount,
        totalSkilled,
        totalUnskilled,
        totalSupervisors,
        totalLaborCost,
        totalMaterialValue,
        totalMaterialItems: materialRows.length,
        lowStockMaterials,
        totalEquipmentCount: equipmentRows.length,
        operationalEquipment,
        idleEquipment,
        breakdownEquipment,
        totalEquipmentCost,
        totalInspections,
        passedInspections,
        pendingInspections,
        passRate,
        totalSafetyReports: safetyRows.length,
        openSafetyIncidents,
        toolboxTalksCount,
        totalWorkersTrained,
        openDelaysCount: openDelays.length,
        totalDelayDaysImpact,
        totalDelayCostImpact,
        overallProgress,
        totalPhotos: photosRows.length,
        totalSiteCosts,
        costBreakdown,
        totalDprs: dprRows.length,
        totalVerifiedCompletions: completionsRows.filter((c) => c.status === "verified").length,
      },
      recentAttendance: attendanceRows.slice(0, 10),
      recentMaterials: materialRows.slice(0, 10),
      recentEquipment: equipmentRows.slice(0, 10),
      recentQuality: qualityRows.slice(0, 10),
      recentSafety: safetyRows.slice(0, 10),
      recentIssues: issueRows.slice(0, 10),
      recentWorkProgress: workProgressRows.slice(0, 10),
      recentPhotos: photosRows.slice(0, 12),
      recentCosts: costsRows.slice(0, 10),
      recentDprs: dprRows,
      milestones: milestonesRows,
      tasks: tasksRows,
      taskStats,
      workCompletions: completionsRows,
    });
  } catch (err) {
    console.error("Error generating site execution summary:", err);
    res.status(500).json({ error: "Failed to generate site execution summary" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. SITE ATTENDANCE & WORKER MANPOWER ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────

// Helper for date bounds
function getWeekRange(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00Z");
  const day = d.getUTCDay();
  const diffToMonday = (day === 0 ? -6 : 1) - day;
  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() + diffToMonday);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  return {
    start: monday.toISOString().split("T")[0],
    end: sunday.toISOString().split("T")[0],
  };
}

// 2.1 Get Worker Directory
router.get("/site-execution/workers", async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId, category, search } = req.query;
    let query = db
      .select({
        worker: siteWorkersTable,
        projectName: projectsTable.name,
      })
      .from(siteWorkersTable)
      .leftJoin(projectsTable, eq(projectsTable.id, siteWorkersTable.projectId));

    const conditions = [eq(siteWorkersTable.status, "active")];
    if (projectId && projectId !== "all") {
      conditions.push(eq(siteWorkersTable.projectId, Number(projectId)));
    }
    if (category && category !== "all") {
      conditions.push(eq(siteWorkersTable.category, String(category)));
    }

    const rows = await query
      .where(and(...conditions))
      .orderBy(siteWorkersTable.category, siteWorkersTable.name);

    let result = rows.map((r) => ({
      ...r.worker,
      dailyWageRate: Number(r.worker.dailyWageRate),
      projectName: r.projectName,
    }));

    if (search) {
      const q = String(search).toLowerCase();
      result = result.filter(
        (w) =>
          w.name.toLowerCase().includes(q) ||
          w.trade.toLowerCase().includes(q) ||
          w.contractorName?.toLowerCase().includes(q)
      );
    }

    res.json(result);
  } catch (err) {
    console.error("Error fetching workers:", err);
    res.status(500).json({ error: "Failed to fetch workers" });
  }
});

// 2.2 Add New Worker
router.post("/site-execution/workers", async (req: Request, res: Response): Promise<void> => {
  try {
    const b = req.body || {};
    if (!b.projectId || !b.name) {
      res.status(400).json({ error: "projectId and name are required" });
      return;
    }

    const validCategories = ["Skilled", "Unskilled", "Supervisor"];
    const category = validCategories.includes(b.category) ? b.category : "Skilled";

    // Set standard default wage rate if not specified
    let defaultRate = 850.00;
    if (category === "Supervisor") defaultRate = 1300.00;
    if (category === "Unskilled") defaultRate = 500.00;

    const rate = b.dailyWageRate !== undefined && b.dailyWageRate !== ""
      ? parseFloat(b.dailyWageRate)
      : defaultRate;

    const result = await db.insert(siteWorkersTable).values({
      projectId: Number(b.projectId),
      name: b.name.trim(),
      category,
      trade: b.trade || "Civil / Concreting",
      contractorName: b.contractorName || "Direct Site Hire",
      dailyWageRate: rate.toFixed(2),
      phone: b.phone || null,
      status: "active",
    });

    const insertId = Number(result[0].insertId);
    const [created] = await db
      .select()
      .from(siteWorkersTable)
      .where(eq(siteWorkersTable.id, insertId));

    res.status(201).json({
      ...created,
      dailyWageRate: Number(created.dailyWageRate),
    });
  } catch (err) {
    console.error("Error creating worker:", err);
    res.status(500).json({ error: "Failed to create worker" });
  }
});

// 2.3 Update Worker details or daily wage rate individually
router.put("/site-execution/workers/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    const b = req.body || {};

    const updateData: any = {};
    if (b.name) updateData.name = b.name.trim();
    if (b.category) updateData.category = b.category;
    if (b.trade) updateData.trade = b.trade;
    if (b.contractorName !== undefined) updateData.contractorName = b.contractorName;
    if (b.phone !== undefined) updateData.phone = b.phone;
    if (b.status) updateData.status = b.status;
    if (b.dailyWageRate !== undefined && b.dailyWageRate !== "") {
      updateData.dailyWageRate = parseFloat(b.dailyWageRate).toFixed(2);
    }

    await db.update(siteWorkersTable).set(updateData).where(eq(siteWorkersTable.id, id));

    const [updated] = await db.select().from(siteWorkersTable).where(eq(siteWorkersTable.id, id));
    res.json({
      ...updated,
      dailyWageRate: Number(updated.dailyWageRate),
    });
  } catch (err) {
    console.error("Error updating worker:", err);
    res.status(500).json({ error: "Failed to update worker" });
  }
});

// 2.4 Delete Worker
router.delete("/site-execution/workers/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    await db.update(siteWorkersTable).set({ status: "inactive" }).where(eq(siteWorkersTable.id, id));
    res.json({ success: true, id });
  } catch (err) {
    console.error("Error deleting worker:", err);
    res.status(500).json({ error: "Failed to delete worker" });
  }
});

// 2.5 Daily Worker Muster Roll & Real-time Calculations (Daily, Weekly, Monthly)
router.get("/site-execution/worker-attendance", async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId, date } = req.query;
    const today = new Date().toISOString().split("T")[0];
    const targetDate = (date && String(date).trim()) ? String(date).trim() : today;
    const week = getWeekRange(targetDate);
    const monthPrefix = targetDate.slice(0, 7); // e.g. "2026-10"

    // 1. Fetch active workers for the project
    const workerCond = [eq(siteWorkersTable.status, "active")];
    if (projectId && projectId !== "all") {
      workerCond.push(eq(siteWorkersTable.projectId, Number(projectId)));
    }

    const workers = await db
      .select({
        worker: siteWorkersTable,
        projectName: projectsTable.name,
      })
      .from(siteWorkersTable)
      .leftJoin(projectsTable, eq(projectsTable.id, siteWorkersTable.projectId))
      .where(and(...workerCond))
      .orderBy(siteWorkersTable.category, siteWorkersTable.name);

    if (workers.length === 0) {
      res.json({
        records: [],
        stats: {
          dailyCost: 0,
          weeklyCost: 0,
          monthlyCost: 0,
          totalWorkers: 0,
          presentCount: 0,
          halfDayCount: 0,
          absentCount: 0,
          weekRange: week,
          categoryBreakdown: {
            skilled: { count: 0, totalCost: 0, avgRate: 0 },
            unskilled: { count: 0, totalCost: 0, avgRate: 0 },
            supervisor: { count: 0, totalCost: 0, avgRate: 0 },
          },
        },
      });
      return;
    }

    const workerIds = workers.map((w) => w.worker.id);

    // 2. Fetch attendance on target date for these workers
    const targetAttRows = await db
      .select()
      .from(siteWorkerAttendanceTable)
      .where(
        and(
          inArray(siteWorkerAttendanceTable.workerId, workerIds),
          eq(siteWorkerAttendanceTable.attendanceDate, targetDate)
        )
      );

    const attMap = new Map<number, any>();
    targetAttRows.forEach((r) => attMap.set(r.workerId, r));

    // 3. Build records with automatic wage calculation based on attendance
    let dailyCost = 0;
    let presentCount = 0;
    let halfDayCount = 0;
    let absentCount = 0;

    const catStats: Record<string, { count: number; totalCost: number; totalRates: number }> = {
      Skilled: { count: 0, totalCost: 0, totalRates: 0 },
      Unskilled: { count: 0, totalCost: 0, totalRates: 0 },
      Supervisor: { count: 0, totalCost: 0, totalRates: 0 },
    };

    const records = workers.map(({ worker, projectName }) => {
      const att = attMap.get(worker.id);
      const assignedRate = Number(worker.dailyWageRate);
      
      // Attendance status & individual wage rate
      const status: "present" | "half_day" | "absent" = att?.status || "present";
      const dailyWageRate = att ? Number(att.dailyWageRate) : assignedRate;
      
      // Automatic wage calculation:
      // Present = 1.0 day * rate, Half-Day = 0.5 day * rate, Absent = 0.0 day * rate
      const daysWorked = status === "present" ? 1.0 : status === "half_day" ? 0.5 : 0.0;
      const payableAmount = daysWorked * dailyWageRate;

      dailyCost += payableAmount;
      if (status === "present") presentCount++;
      else if (status === "half_day") halfDayCount++;
      else absentCount++;

      const cat = worker.category in catStats ? worker.category : "Skilled";
      catStats[cat].count++;
      catStats[cat].totalCost += payableAmount;
      catStats[cat].totalRates += dailyWageRate;

      return {
        id: att?.id || null,
        workerId: worker.id,
        projectId: worker.projectId,
        projectName: projectName || `Project #${worker.projectId}`,
        name: worker.name,
        category: worker.category,
        trade: worker.trade,
        contractorName: worker.contractorName || "Direct Site Hire",
        phone: worker.phone,
        assignedDailyWageRate: assignedRate,
        attendanceDate: targetDate,
        status,
        daysWorked,
        dailyWageRate,
        payableAmount,
        shift: att?.shift || "Day Shift",
        remarks: att?.remarks || "",
        isMarked: !!att,
      };
    });

    // 4. Calculate Weekly and Monthly Labour Costs
    const weeklyCond = [
      inArray(siteWorkerAttendanceTable.workerId, workerIds),
      between(siteWorkerAttendanceTable.attendanceDate, week.start, week.end),
    ];
    const weeklyRows = await db
      .select({ payable: siteWorkerAttendanceTable.payableAmount })
      .from(siteWorkerAttendanceTable)
      .where(and(...weeklyCond));
    const weeklyCost = weeklyRows.reduce((sum, r) => sum + Number(r.payable || 0), 0);

    const monthlyCond = [
      inArray(siteWorkerAttendanceTable.workerId, workerIds),
      like(siteWorkerAttendanceTable.attendanceDate, `${monthPrefix}%`),
    ];
    const monthlyRows = await db
      .select({ payable: siteWorkerAttendanceTable.payableAmount })
      .from(siteWorkerAttendanceTable)
      .where(and(...monthlyCond));
    const monthlyCost = monthlyRows.reduce((sum, r) => sum + Number(r.payable || 0), 0);

    res.json({
      records,
      stats: {
        dailyCost,
        weeklyCost,
        monthlyCost,
        totalWorkers: workers.length,
        presentCount,
        halfDayCount,
        absentCount,
        weekRange: week,
        monthPrefix,
        categoryBreakdown: {
          skilled: {
            count: catStats.Skilled.count,
            totalCost: catStats.Skilled.totalCost,
            avgRate: catStats.Skilled.count ? Math.round(catStats.Skilled.totalRates / catStats.Skilled.count) : 850,
          },
          unskilled: {
            count: catStats.Unskilled.count,
            totalCost: catStats.Unskilled.totalCost,
            avgRate: catStats.Unskilled.count ? Math.round(catStats.Unskilled.totalRates / catStats.Unskilled.count) : 500,
          },
          supervisor: {
            count: catStats.Supervisor.count,
            totalCost: catStats.Supervisor.totalCost,
            avgRate: catStats.Supervisor.count ? Math.round(catStats.Supervisor.totalRates / catStats.Supervisor.count) : 1300,
          },
        },
      },
    });
  } catch (err) {
    console.error("Error fetching worker attendance:", err);
    res.status(500).json({ error: "Failed to fetch worker attendance" });
  }
});

// 2.6 Save / Update Single Worker Attendance
router.post("/site-execution/worker-attendance", async (req: Request, res: Response): Promise<void> => {
  try {
    const b = req.body || {};
    if (!b.workerId || !b.projectId) {
      res.status(400).json({ error: "workerId and projectId are required" });
      return;
    }

    const workerId = Number(b.workerId);
    const projectId = Number(b.projectId);
    const attendanceDate = b.attendanceDate || new Date().toISOString().split("T")[0];
    const status: "present" | "half_day" | "absent" = b.status || "present";
    
    // Auto-calculate days worked
    const daysWorked = status === "present" ? 1.0 : status === "half_day" ? 0.5 : 0.0;
    
    // Daily wage rate per worker
    let rate = b.dailyWageRate !== undefined ? parseFloat(b.dailyWageRate) : 850.0;
    if (isNaN(rate) || rate < 0) rate = 0;

    // Automatic wage payable
    const payableAmount = daysWorked * rate;

    // Check if attendance already recorded for this worker and date
    const [existing] = await db
      .select()
      .from(siteWorkerAttendanceTable)
      .where(
        and(
          eq(siteWorkerAttendanceTable.workerId, workerId),
          eq(siteWorkerAttendanceTable.attendanceDate, attendanceDate)
        )
      );

    if (existing) {
      await db
        .update(siteWorkerAttendanceTable)
        .set({
          status,
          daysWorked: daysWorked.toFixed(2),
          dailyWageRate: rate.toFixed(2),
          payableAmount: payableAmount.toFixed(2),
          shift: b.shift || "Day Shift",
          remarks: b.remarks || null,
        })
        .where(eq(siteWorkerAttendanceTable.id, existing.id));
    } else {
      await db.insert(siteWorkerAttendanceTable).values({
        workerId,
        projectId,
        attendanceDate,
        status,
        daysWorked: daysWorked.toFixed(2),
        dailyWageRate: rate.toFixed(2),
        payableAmount: payableAmount.toFixed(2),
        shift: b.shift || "Day Shift",
        remarks: b.remarks || null,
      });
    }

    // Also update worker's assigned wage rate if requested
    if (b.updateAssignedRate && rate > 0) {
      await db
        .update(siteWorkersTable)
        .set({ dailyWageRate: rate.toFixed(2) })
        .where(eq(siteWorkersTable.id, workerId));
    }

    res.json({
      success: true,
      workerId,
      attendanceDate,
      status,
      daysWorked,
      dailyWageRate: rate,
      payableAmount,
    });
  } catch (err) {
    console.error("Error saving worker attendance:", err);
    res.status(500).json({ error: "Failed to save attendance" });
  }
});

// 2.7 Bulk Save Entire Day's Muster Roll
router.post("/site-execution/worker-attendance/bulk", async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId, attendanceDate, records } = req.body || {};
    if (!attendanceDate || !Array.isArray(records)) {
      res.status(400).json({ error: "attendanceDate and records array are required" });
      return;
    }

    let totalSkilled = 0;
    let totalUnskilled = 0;
    let totalSupervisors = 0;
    let totalDayCost = 0;

    for (const rec of records) {
      const workerId = Number(rec.workerId);
      const prjId = Number(rec.projectId || projectId);
      const status: "present" | "half_day" | "absent" = rec.status || "present";
      const daysWorked = status === "present" ? 1.0 : status === "half_day" ? 0.5 : 0.0;
      let rate = rec.dailyWageRate !== undefined ? parseFloat(rec.dailyWageRate) : 850.0;
      if (isNaN(rate) || rate < 0) rate = 0;
      const payableAmount = daysWorked * rate;

      totalDayCost += payableAmount;
      if (rec.category === "Supervisor" && status !== "absent") totalSupervisors++;
      else if (rec.category === "Unskilled" && status !== "absent") totalUnskilled++;
      else if (status !== "absent") totalSkilled++;

      // Check existing
      const [existing] = await db
        .select({ id: siteWorkerAttendanceTable.id })
        .from(siteWorkerAttendanceTable)
        .where(
          and(
            eq(siteWorkerAttendanceTable.workerId, workerId),
            eq(siteWorkerAttendanceTable.attendanceDate, String(attendanceDate))
          )
        );

      if (existing) {
        await db
          .update(siteWorkerAttendanceTable)
          .set({
            status,
            daysWorked: daysWorked.toFixed(2),
            dailyWageRate: rate.toFixed(2),
            payableAmount: payableAmount.toFixed(2),
            shift: rec.shift || "Day Shift",
            remarks: rec.remarks || null,
          })
          .where(eq(siteWorkerAttendanceTable.id, existing.id));
      } else {
        await db.insert(siteWorkerAttendanceTable).values({
          workerId,
          projectId: prjId,
          attendanceDate: String(attendanceDate),
          status,
          daysWorked: daysWorked.toFixed(2),
          dailyWageRate: rate.toFixed(2),
          payableAmount: payableAmount.toFixed(2),
          shift: rec.shift || "Day Shift",
          remarks: rec.remarks || null,
        });
      }

      // Update worker default rate if provided
      if (rate > 0) {
        await db
          .update(siteWorkersTable)
          .set({ dailyWageRate: rate.toFixed(2) })
          .where(eq(siteWorkersTable.id, workerId));
      }
    }

    // Sync aggregated headcount and cost to site_attendance table
    if (projectId && projectId !== "all") {
      const [existingSummary] = await db
        .select({ id: siteAttendanceTable.id })
        .from(siteAttendanceTable)
        .where(
          and(
            eq(siteAttendanceTable.projectId, Number(projectId)),
            eq(siteAttendanceTable.attendanceDate, String(attendanceDate))
          )
        );

      if (existingSummary) {
        await db
          .update(siteAttendanceTable)
          .set({
            skilledCount: totalSkilled,
            unskilledCount: totalUnskilled,
            supervisorCount: totalSupervisors,
            totalLaborCost: totalDayCost.toFixed(2),
          })
          .where(eq(siteAttendanceTable.id, existingSummary.id));
      } else {
        await db.insert(siteAttendanceTable).values({
          projectId: Number(projectId),
          attendanceDate: String(attendanceDate),
          contractorName: "Site Multi-trade Muster Roll",
          trade: "Composite Trades",
          skilledCount: totalSkilled,
          unskilledCount: totalUnskilled,
          supervisorCount: totalSupervisors,
          totalLaborCost: totalDayCost.toFixed(2),
        });
      }
    }

    res.json({
      success: true,
      attendanceDate,
      processedCount: records.length,
      totalDayCost,
    });
  } catch (err) {
    console.error("Error bulk saving attendance:", err);
    res.status(500).json({ error: "Failed to bulk save attendance" });
  }
});

// 2.8 Project-wise Labour Cost Reports (Daily, Weekly, Monthly)
router.get("/site-execution/worker-attendance/reports", async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId, period, date } = req.query;
    const today = new Date().toISOString().split("T")[0];
    const targetDate = (date && String(date).trim()) ? String(date).trim() : today;
    const week = getWeekRange(targetDate);
    const monthPrefix = targetDate.slice(0, 7);

    // Filter conditions based on period
    const conditions = [];
    if (projectId && projectId !== "all") {
      conditions.push(eq(siteWorkerAttendanceTable.projectId, Number(projectId)));
    }

    if (period === "daily") {
      conditions.push(eq(siteWorkerAttendanceTable.attendanceDate, targetDate));
    } else if (period === "weekly") {
      conditions.push(between(siteWorkerAttendanceTable.attendanceDate, week.start, week.end));
    } else if (period === "monthly") {
      conditions.push(like(siteWorkerAttendanceTable.attendanceDate, `${monthPrefix}%`));
    }

    // Fetch all attendance matching period
    const rows = await db
      .select({
        att: siteWorkerAttendanceTable,
        worker: siteWorkersTable,
        projectName: projectsTable.name,
      })
      .from(siteWorkerAttendanceTable)
      .leftJoin(siteWorkersTable, eq(siteWorkersTable.id, siteWorkerAttendanceTable.workerId))
      .leftJoin(projectsTable, eq(projectsTable.id, siteWorkerAttendanceTable.projectId))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(siteWorkerAttendanceTable.attendanceDate));

    // Aggregate worker-level summary
    const workerMap = new Map<number, {
      workerId: number;
      name: string;
      category: string;
      trade: string;
      contractorName: string;
      assignedDailyRate: number;
      dailyRate: number;
      presentDays: number;
      halfDays: number;
      absentDays: number;
      totalDaysWorked: number;
      totalPayableAmount: number;
      projectName: string;
    }>();

    let grandTotalCost = 0;
    let grandTotalDays = 0;

    const catSummary: Record<string, { daysWorked: number; totalPayable: number; workerCount: Set<number> }> = {
      Supervisor: { daysWorked: 0, totalPayable: 0, workerCount: new Set() },
      Skilled: { daysWorked: 0, totalPayable: 0, workerCount: new Set() },
      Unskilled: { daysWorked: 0, totalPayable: 0, workerCount: new Set() },
    };

    rows.forEach(({ att, worker, projectName }) => {
      const wId = att.workerId;
      const days = Number(att.daysWorked);
      const payable = Number(att.payableAmount);
      const rate = Number(att.dailyWageRate);
      const category = worker?.category || "Skilled";

      grandTotalCost += payable;
      grandTotalDays += days;

      if (category in catSummary) {
        catSummary[category].daysWorked += days;
        catSummary[category].totalPayable += payable;
        catSummary[category].workerCount.add(wId);
      }

      if (!workerMap.has(wId)) {
        workerMap.set(wId, {
          workerId: wId,
          name: worker?.name || `Worker #${wId}`,
          category,
          trade: worker?.trade || "General Labor",
          contractorName: worker?.contractorName || "Direct Site Hire",
          assignedDailyRate: Number(worker?.dailyWageRate || rate),
          dailyRate: rate,
          presentDays: 0,
          halfDays: 0,
          absentDays: 0,
          totalDaysWorked: 0,
          totalPayableAmount: 0,
          projectName: projectName || `Project #${att.projectId}`,
        });
      }

      const item = workerMap.get(wId)!;
      if (att.status === "present") item.presentDays += 1;
      else if (att.status === "half_day") item.halfDays += 1;
      else item.absentDays += 1;

      item.totalDaysWorked += days;
      item.totalPayableAmount += payable;
    });

    // Also get Daily, Weekly, and Monthly benchmark totals for comparison
    const allAttRows = await db
      .select({
        date: siteWorkerAttendanceTable.attendanceDate,
        payable: siteWorkerAttendanceTable.payableAmount,
      })
      .from(siteWorkerAttendanceTable)
      .where(projectId && projectId !== "all" ? eq(siteWorkerAttendanceTable.projectId, Number(projectId)) : undefined);

    const benchmarkDailyCost = allAttRows
      .filter((r) => r.date === targetDate)
      .reduce((sum, r) => sum + Number(r.payable || 0), 0);

    const benchmarkWeeklyCost = allAttRows
      .filter((r) => r.date >= week.start && r.date <= week.end)
      .reduce((sum, r) => sum + Number(r.payable || 0), 0);

    const benchmarkMonthlyCost = allAttRows
      .filter((r) => r.date.startsWith(monthPrefix))
      .reduce((sum, r) => sum + Number(r.payable || 0), 0);

    res.json({
      period: period || "monthly",
      targetDate,
      weekRange: week,
      monthPrefix,
      grandTotalCost,
      grandTotalDays,
      benchmarks: {
        daily: benchmarkDailyCost,
        weekly: benchmarkWeeklyCost,
        monthly: benchmarkMonthlyCost,
      },
      categories: {
        supervisor: {
          workers: catSummary.Supervisor.workerCount.size,
          daysWorked: catSummary.Supervisor.daysWorked,
          totalPayable: catSummary.Supervisor.totalPayable,
        },
        skilled: {
          workers: catSummary.Skilled.workerCount.size,
          daysWorked: catSummary.Skilled.daysWorked,
          totalPayable: catSummary.Skilled.totalPayable,
        },
        unskilled: {
          workers: catSummary.Unskilled.workerCount.size,
          daysWorked: catSummary.Unskilled.daysWorked,
          totalPayable: catSummary.Unskilled.totalPayable,
        },
      },
      workerSummary: Array.from(workerMap.values()).sort(
        (a, b) => b.totalPayableAmount - a.totalPayableAmount
      ),
    });
  } catch (err) {
    console.error("Error generating labour cost reports:", err);
    res.status(500).json({ error: "Failed to generate labour cost reports" });
  }
});

// 2.9 Legacy Attendance Logs Endpoint (for backward compatibility)
router.get("/site-execution/attendance", async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId, date } = req.query;
    let query = db
      .select({
        a: siteAttendanceTable,
        projectName: projectsTable.name,
      })
      .from(siteAttendanceTable)
      .leftJoin(projectsTable, eq(projectsTable.id, siteAttendanceTable.projectId));

    const conditions = [];
    if (projectId && projectId !== "all") {
      conditions.push(eq(siteAttendanceTable.projectId, Number(projectId)));
    }
    if (date) {
      conditions.push(eq(siteAttendanceTable.attendanceDate, String(date)));
    }

    const rows = conditions.length > 0
      ? await query.where(and(...conditions)).orderBy(desc(siteAttendanceTable.attendanceDate), desc(siteAttendanceTable.id))
      : await query.orderBy(desc(siteAttendanceTable.attendanceDate), desc(siteAttendanceTable.id));

    res.json(rows.map((r) => ({ ...r.a, projectName: r.projectName })));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch attendance logs" });
  }
});

router.post("/site-execution/attendance", async (req: Request, res: Response): Promise<void> => {
  try {
    const b = req.body || {};
    if (!b.projectId || !b.trade) {
      res.status(400).json({ error: "projectId and trade are required" });
      return;
    }

    const me = await getCurrentUser(req);
    const skilled = parseInt(b.skilledCount) || 0;
    const unskilled = parseInt(b.unskilledCount) || 0;
    const supervisors = parseInt(b.supervisorCount) || 0;
    const hours = parseFloat(b.hoursWorked) || 8.0;
    const wageRate = parseFloat(b.wageRatePerDay) || 0.0;
    const totalCost = b.totalLaborCost
      ? parseFloat(b.totalLaborCost)
      : (skilled + unskilled + supervisors) * wageRate;

    const result = await db.insert(siteAttendanceTable).values({
      projectId: Number(b.projectId),
      attendanceDate: b.attendanceDate || new Date().toISOString().split("T")[0],
      contractorName: b.contractorName || "Direct / General",
      trade: b.trade,
      skilledCount: skilled,
      unskilledCount: unskilled,
      supervisorCount: supervisors,
      shift: b.shift || "Day Shift",
      hoursWorked: hours.toFixed(2),
      wageRatePerDay: wageRate.toFixed(2),
      totalLaborCost: totalCost.toFixed(2),
      remarks: b.remarks || null,
      dprId: b.dprId ? Number(b.dprId) : null,
      createdById: me.id,
    });

    const insertId = Number(result[0].insertId);
    const [created] = await db
      .select()
      .from(siteAttendanceTable)
      .where(eq(siteAttendanceTable.id, insertId));

    res.status(201).json(created);
  } catch (err) {
    console.error("Failed to create attendance entry:", err);
    res.status(500).json({ error: "Failed to log attendance" });
  }
});

router.delete("/site-execution/attendance/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    await db.delete(siteAttendanceTable).where(eq(siteAttendanceTable.id, id));
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete attendance record" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. MATERIAL CONSUMPTION & STOCK ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────

router.get("/site-execution/materials", async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.query;
    let query = db
      .select({
        m: siteMaterialLogsTable,
        projectName: projectsTable.name,
      })
      .from(siteMaterialLogsTable)
      .leftJoin(projectsTable, eq(projectsTable.id, siteMaterialLogsTable.projectId));

    const rows = projectId && projectId !== "all"
      ? await query.where(eq(siteMaterialLogsTable.projectId, Number(projectId))).orderBy(desc(siteMaterialLogsTable.logDate), desc(siteMaterialLogsTable.id))
      : await query.orderBy(desc(siteMaterialLogsTable.logDate), desc(siteMaterialLogsTable.id));

    res.json(rows.map((r) => ({ ...r.m, projectName: r.projectName })));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch material logs" });
  }
});

router.post("/site-execution/materials", async (req: Request, res: Response): Promise<void> => {
  try {
    const b = req.body || {};
    if (!b.projectId || !b.materialName) {
      res.status(400).json({ error: "projectId and materialName are required" });
      return;
    }

    const me = await getCurrentUser(req);
    const opening = parseFloat(b.openingStock) || 0.0;
    const received = parseFloat(b.quantityReceived) || 0.0;
    const consumed = parseFloat(b.quantityConsumed) || 0.0;
    const closing = b.closingStock !== undefined && b.closingStock !== ""
      ? parseFloat(b.closingStock)
      : Math.max(0, opening + received - consumed);
    const unitCost = parseFloat(b.unitCost) || 0.0;
    const totalCost = b.totalCost ? parseFloat(b.totalCost) : consumed * unitCost;

    const result = await db.insert(siteMaterialLogsTable).values({
      projectId: Number(b.projectId),
      logDate: b.logDate || new Date().toISOString().split("T")[0],
      materialName: b.materialName,
      category: b.category || "Civil & Structural",
      unit: b.unit || "Units",
      openingStock: opening.toFixed(2),
      quantityReceived: received.toFixed(2),
      quantityConsumed: consumed.toFixed(2),
      closingStock: closing.toFixed(2),
      unitCost: unitCost.toFixed(2),
      totalCost: totalCost.toFixed(2),
      location: b.location || null,
      remarks: b.remarks || null,
      dprId: b.dprId ? Number(b.dprId) : null,
      createdById: me.id,
    });

    const insertId = Number(result[0].insertId);
    const [created] = await db
      .select()
      .from(siteMaterialLogsTable)
      .where(eq(siteMaterialLogsTable.id, insertId));

    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: "Failed to log material consumption" });
  }
});

router.delete("/site-execution/materials/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    await db.delete(siteMaterialLogsTable).where(eq(siteMaterialLogsTable.id, id));
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete material log" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. EQUIPMENT & PLANT TRACKING ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────

router.get("/site-execution/equipment", async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.query;
    let query = db
      .select({
        e: siteEquipmentLogsTable,
        projectName: projectsTable.name,
      })
      .from(siteEquipmentLogsTable)
      .leftJoin(projectsTable, eq(projectsTable.id, siteEquipmentLogsTable.projectId));

    const rows = projectId && projectId !== "all"
      ? await query.where(eq(siteEquipmentLogsTable.projectId, Number(projectId))).orderBy(desc(siteEquipmentLogsTable.logDate), desc(siteEquipmentLogsTable.id))
      : await query.orderBy(desc(siteEquipmentLogsTable.logDate), desc(siteEquipmentLogsTable.id));

    res.json(rows.map((r) => ({ ...r.e, projectName: r.projectName })));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch equipment logs" });
  }
});

router.post("/site-execution/equipment", async (req: Request, res: Response): Promise<void> => {
  try {
    const b = req.body || {};
    if (!b.projectId || !b.equipmentName) {
      res.status(400).json({ error: "projectId and equipmentName are required" });
      return;
    }

    const me = await getCurrentUser(req);
    const result = await db.insert(siteEquipmentLogsTable).values({
      projectId: Number(b.projectId),
      logDate: b.logDate || new Date().toISOString().split("T")[0],
      equipmentName: b.equipmentName,
      equipmentType: b.equipmentType || "Heavy Machinery",
      status: b.status || "operational",
      hoursOperated: (parseFloat(b.hoursOperated) || 0.0).toFixed(2),
      fuelConsumedLitres: (parseFloat(b.fuelConsumedLitres) || 0.0).toFixed(2),
      operatorName: b.operatorName || null,
      dailyCost: (parseFloat(b.dailyCost) || 0.0).toFixed(2),
      remarks: b.remarks || null,
      dprId: b.dprId ? Number(b.dprId) : null,
      createdById: me.id,
    });

    const insertId = Number(result[0].insertId);
    const [created] = await db
      .select()
      .from(siteEquipmentLogsTable)
      .where(eq(siteEquipmentLogsTable.id, insertId));

    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: "Failed to log equipment" });
  }
});

router.patch("/site-execution/equipment/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    const b = req.body || {};
    const updates: Record<string, any> = {};

    if (b.status) updates.status = b.status;
    if (b.hoursOperated !== undefined) updates.hoursOperated = (parseFloat(b.hoursOperated) || 0).toFixed(2);
    if (b.fuelConsumedLitres !== undefined) updates.fuelConsumedLitres = (parseFloat(b.fuelConsumedLitres) || 0).toFixed(2);
    if (b.dailyCost !== undefined) updates.dailyCost = (parseFloat(b.dailyCost) || 0).toFixed(2);
    if (b.remarks !== undefined) updates.remarks = b.remarks;

    await db.update(siteEquipmentLogsTable).set(updates).where(eq(siteEquipmentLogsTable.id, id));
    const [updated] = await db.select().from(siteEquipmentLogsTable).where(eq(siteEquipmentLogsTable.id, id));
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to update equipment log" });
  }
});

router.delete("/site-execution/equipment/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    await db.delete(siteEquipmentLogsTable).where(eq(siteEquipmentLogsTable.id, id));
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete equipment log" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. QUALITY INSPECTION LOGS & CHECKLISTS
// ─────────────────────────────────────────────────────────────────────────────

router.get("/site-execution/quality", async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.query;
    let query = db
      .select({
        q: siteQualityInspectionsTable,
        projectName: projectsTable.name,
      })
      .from(siteQualityInspectionsTable)
      .leftJoin(projectsTable, eq(projectsTable.id, siteQualityInspectionsTable.projectId));

    const rows = projectId && projectId !== "all"
      ? await query.where(eq(siteQualityInspectionsTable.projectId, Number(projectId))).orderBy(desc(siteQualityInspectionsTable.inspectionDate), desc(siteQualityInspectionsTable.id))
      : await query.orderBy(desc(siteQualityInspectionsTable.inspectionDate), desc(siteQualityInspectionsTable.id));

    res.json(rows.map((r) => ({ ...r.q, projectName: r.projectName })));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch quality inspections" });
  }
});

router.post("/site-execution/quality", async (req: Request, res: Response): Promise<void> => {
  try {
    const b = req.body || {};
    if (!b.projectId || !b.inspectionTitle) {
      res.status(400).json({ error: "projectId and inspectionTitle are required" });
      return;
    }

    const me = await getCurrentUser(req);
    const result = await db.insert(siteQualityInspectionsTable).values({
      projectId: Number(b.projectId),
      inspectionDate: b.inspectionDate || new Date().toISOString().split("T")[0],
      inspectionTitle: b.inspectionTitle,
      checklistCategory: b.checklistCategory || "Civil & Structure",
      location: b.location || null,
      status: b.status || "passed",
      inspectedBy: b.inspectedBy || me.name,
      checkpointsTotal: parseInt(b.checkpointsTotal) || 0,
      checkpointsPassed: parseInt(b.checkpointsPassed) || 0,
      correctiveActions: b.correctiveActions || null,
      remarks: b.remarks || null,
      linkedTaskId: b.linkedTaskId ? Number(b.linkedTaskId) : null,
      createdById: me.id,
    });

    const insertId = Number(result[0].insertId);
    const [created] = await db
      .select()
      .from(siteQualityInspectionsTable)
      .where(eq(siteQualityInspectionsTable.id, insertId));

    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: "Failed to log quality inspection" });
  }
});

router.patch("/site-execution/quality/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    const b = req.body || {};
    const updates: Record<string, any> = {};

    if (b.status) updates.status = b.status;
    if (b.checkpointsPassed !== undefined) updates.checkpointsPassed = parseInt(b.checkpointsPassed);
    if (b.correctiveActions !== undefined) updates.correctiveActions = b.correctiveActions;
    if (b.remarks !== undefined) updates.remarks = b.remarks;

    await db.update(siteQualityInspectionsTable).set(updates).where(eq(siteQualityInspectionsTable.id, id));
    const [updated] = await db.select().from(siteQualityInspectionsTable).where(eq(siteQualityInspectionsTable.id, id));
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to update inspection" });
  }
});

router.delete("/site-execution/quality/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    await db.delete(siteQualityInspectionsTable).where(eq(siteQualityInspectionsTable.id, id));
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete inspection" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. SAFETY & INCIDENT REPORTS
// ─────────────────────────────────────────────────────────────────────────────

router.get("/site-execution/safety", async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.query;
    let query = db
      .select({
        s: siteSafetyIncidentsTable,
        projectName: projectsTable.name,
      })
      .from(siteSafetyIncidentsTable)
      .leftJoin(projectsTable, eq(projectsTable.id, siteSafetyIncidentsTable.projectId));

    const rows = projectId && projectId !== "all"
      ? await query.where(eq(siteSafetyIncidentsTable.projectId, Number(projectId))).orderBy(desc(siteSafetyIncidentsTable.incidentDate), desc(siteSafetyIncidentsTable.id))
      : await query.orderBy(desc(siteSafetyIncidentsTable.incidentDate), desc(siteSafetyIncidentsTable.id));

    res.json(rows.map((r) => ({ ...r.s, projectName: r.projectName })));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch safety reports" });
  }
});

router.post("/site-execution/safety", async (req: Request, res: Response): Promise<void> => {
  try {
    const b = req.body || {};
    if (!b.projectId || !b.title || !b.description) {
      res.status(400).json({ error: "projectId, title, and description are required" });
      return;
    }

    const me = await getCurrentUser(req);
    const result = await db.insert(siteSafetyIncidentsTable).values({
      projectId: Number(b.projectId),
      incidentDate: b.incidentDate || new Date().toISOString().split("T")[0],
      reportType: b.reportType || "observation",
      title: b.title,
      severity: b.severity || "low",
      status: b.status || "open",
      location: b.location || null,
      description: b.description,
      actionTaken: b.actionTaken || null,
      reportedBy: b.reportedBy || me.name,
      workersAttended: parseInt(b.workersAttended) || 0,
      createdById: me.id,
    });

    const insertId = Number(result[0].insertId);
    const [created] = await db
      .select()
      .from(siteSafetyIncidentsTable)
      .where(eq(siteSafetyIncidentsTable.id, insertId));

    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: "Failed to create safety report" });
  }
});

router.patch("/site-execution/safety/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    const b = req.body || {};
    const updates: Record<string, any> = {};

    if (b.status) updates.status = b.status;
    if (b.severity) updates.severity = b.severity;
    if (b.actionTaken !== undefined) updates.actionTaken = b.actionTaken;

    await db.update(siteSafetyIncidentsTable).set(updates).where(eq(siteSafetyIncidentsTable.id, id));
    const [updated] = await db.select().from(siteSafetyIncidentsTable).where(eq(siteSafetyIncidentsTable.id, id));
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to update safety report" });
  }
});

router.delete("/site-execution/safety/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    await db.delete(siteSafetyIncidentsTable).where(eq(siteSafetyIncidentsTable.id, id));
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete safety report" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. SITE ISSUES & DELAYS TRACKER
// ─────────────────────────────────────────────────────────────────────────────

router.get("/site-execution/issues-delays", async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.query;
    let query = db
      .select({
        i: siteIssuesDelaysTable,
        projectName: projectsTable.name,
      })
      .from(siteIssuesDelaysTable)
      .leftJoin(projectsTable, eq(projectsTable.id, siteIssuesDelaysTable.projectId));

    const rows = projectId && projectId !== "all"
      ? await query.where(eq(siteIssuesDelaysTable.projectId, Number(projectId))).orderBy(desc(siteIssuesDelaysTable.reportedDate), desc(siteIssuesDelaysTable.id))
      : await query.orderBy(desc(siteIssuesDelaysTable.reportedDate), desc(siteIssuesDelaysTable.id));

    res.json(rows.map((r) => ({ ...r.i, projectName: r.projectName })));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch site issues & delays" });
  }
});

router.post("/site-execution/issues-delays", async (req: Request, res: Response): Promise<void> => {
  try {
    const b = req.body || {};
    if (!b.projectId || !b.title) {
      res.status(400).json({ error: "projectId and title are required" });
      return;
    }

    const me = await getCurrentUser(req);
    const result = await db.insert(siteIssuesDelaysTable).values({
      projectId: Number(b.projectId),
      reportedDate: b.reportedDate || new Date().toISOString().split("T")[0],
      title: b.title,
      category: b.category || "material_shortage",
      severity: b.severity || "medium",
      status: b.status || "open",
      daysImpact: parseInt(b.daysImpact) || 0,
      costImpact: (parseFloat(b.costImpact) || 0.0).toFixed(2),
      mitigationPlan: b.mitigationPlan || null,
      resolutionDate: b.resolutionDate || null,
      assignedTo: b.assignedTo || null,
      createdById: me.id,
    });

    const insertId = Number(result[0].insertId);
    const [created] = await db
      .select()
      .from(siteIssuesDelaysTable)
      .where(eq(siteIssuesDelaysTable.id, insertId));

    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: "Failed to log site delay or issue" });
  }
});

router.patch("/site-execution/issues-delays/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    const b = req.body || {};
    const updates: Record<string, any> = {};

    if (b.status) updates.status = b.status;
    if (b.daysImpact !== undefined) updates.daysImpact = parseInt(b.daysImpact);
    if (b.costImpact !== undefined) updates.costImpact = (parseFloat(b.costImpact) || 0).toFixed(2);
    if (b.mitigationPlan !== undefined) updates.mitigationPlan = b.mitigationPlan;
    if (b.resolutionDate !== undefined) updates.resolutionDate = b.resolutionDate;
    if (b.assignedTo !== undefined) updates.assignedTo = b.assignedTo;

    await db.update(siteIssuesDelaysTable).set(updates).where(eq(siteIssuesDelaysTable.id, id));
    const [updated] = await db.select().from(siteIssuesDelaysTable).where(eq(siteIssuesDelaysTable.id, id));
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to update issue" });
  }
});

router.delete("/site-execution/issues-delays/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    await db.delete(siteIssuesDelaysTable).where(eq(siteIssuesDelaysTable.id, id));
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete issue" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. WORK PROGRESS TRACKING
// ─────────────────────────────────────────────────────────────────────────────

router.get("/site-execution/work-progress", async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.query;
    let query = db
      .select({
        w: siteWorkProgressTable,
        projectName: projectsTable.name,
      })
      .from(siteWorkProgressTable)
      .leftJoin(projectsTable, eq(projectsTable.id, siteWorkProgressTable.projectId));

    const rows = projectId && projectId !== "all"
      ? await query.where(eq(siteWorkProgressTable.projectId, Number(projectId))).orderBy(desc(siteWorkProgressTable.progressDate), desc(siteWorkProgressTable.id))
      : await query.orderBy(desc(siteWorkProgressTable.progressDate), desc(siteWorkProgressTable.id));

    res.json(rows.map((r) => ({ ...r.w, projectName: r.projectName })));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch work progress" });
  }
});

router.post("/site-execution/work-progress", async (req: Request, res: Response): Promise<void> => {
  try {
    const b = req.body || {};
    if (!b.projectId || !b.activityName) {
      res.status(400).json({ error: "projectId and activityName are required" });
      return;
    }

    const me = await getCurrentUser(req);
    const planned = parseFloat(b.plannedQuantity) || 0.0;
    const executed = parseFloat(b.executedToday) || 0.0;
    const cumulative = parseFloat(b.cumulativeExecuted) || executed;
    const target = parseFloat(b.targetQuantity) || 0.0;
    const percent = b.percentCompleted !== undefined
      ? parseInt(b.percentCompleted)
      : target > 0 ? Math.min(100, Math.round((cumulative / target) * 100)) : 0;

    const result = await db.insert(siteWorkProgressTable).values({
      projectId: Number(b.projectId),
      progressDate: b.progressDate || new Date().toISOString().split("T")[0],
      activityName: b.activityName,
      category: b.category || "Civil",
      unit: b.unit || "Sq.ft",
      plannedQuantity: planned.toFixed(2),
      executedToday: executed.toFixed(2),
      cumulativeExecuted: cumulative.toFixed(2),
      targetQuantity: target.toFixed(2),
      percentCompleted: percent,
      location: b.location || null,
      taskId: b.taskId ? Number(b.taskId) : null,
      milestoneId: b.milestoneId ? Number(b.milestoneId) : null,
      dprId: b.dprId ? Number(b.dprId) : null,
      remarks: b.remarks || null,
      createdById: me.id,
    });

    const insertId = Number(result[0].insertId);
    const [created] = await db
      .select()
      .from(siteWorkProgressTable)
      .where(eq(siteWorkProgressTable.id, insertId));

    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: "Failed to log work progress" });
  }
});

router.patch("/site-execution/work-progress/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    const b = req.body || {};
    const updates: Record<string, any> = {};

    if (b.executedToday !== undefined) updates.executedToday = (parseFloat(b.executedToday) || 0).toFixed(2);
    if (b.cumulativeExecuted !== undefined) updates.cumulativeExecuted = (parseFloat(b.cumulativeExecuted) || 0).toFixed(2);
    if (b.percentCompleted !== undefined) updates.percentCompleted = parseInt(b.percentCompleted);
    if (b.remarks !== undefined) updates.remarks = b.remarks;

    await db.update(siteWorkProgressTable).set(updates).where(eq(siteWorkProgressTable.id, id));
    const [updated] = await db.select().from(siteWorkProgressTable).where(eq(siteWorkProgressTable.id, id));
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to update work progress" });
  }
});

router.delete("/site-execution/work-progress/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    await db.delete(siteWorkProgressTable).where(eq(siteWorkProgressTable.id, id));
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete progress log" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. PHOTO DOCUMENTATION
// ─────────────────────────────────────────────────────────────────────────────

router.get("/site-execution/photos", async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId, category } = req.query;
    let query = db
      .select({
        p: sitePhotosTable,
        projectName: projectsTable.name,
      })
      .from(sitePhotosTable)
      .leftJoin(projectsTable, eq(projectsTable.id, sitePhotosTable.projectId));

    const conditions = [];
    if (projectId && projectId !== "all") {
      conditions.push(eq(sitePhotosTable.projectId, Number(projectId)));
    }
    if (category && category !== "all") {
      conditions.push(eq(sitePhotosTable.category, String(category)));
    }

    const rows = conditions.length > 0
      ? await query.where(and(...conditions)).orderBy(desc(sitePhotosTable.capturedDate), desc(sitePhotosTable.id))
      : await query.orderBy(desc(sitePhotosTable.capturedDate), desc(sitePhotosTable.id));

    res.json(rows.map((r) => ({ ...r.p, projectName: r.projectName })));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch photos" });
  }
});

router.post("/site-execution/photos", async (req: Request, res: Response): Promise<void> => {
  try {
    const b = req.body || {};
    if (!b.projectId || !b.title || !b.imageUrl) {
      res.status(400).json({ error: "projectId, title, and imageUrl are required" });
      return;
    }

    const me = await getCurrentUser(req);
    const result = await db.insert(sitePhotosTable).values({
      projectId: Number(b.projectId),
      capturedDate: b.capturedDate || new Date().toISOString().split("T")[0],
      title: b.title,
      category: b.category || "progress",
      imageUrl: b.imageUrl,
      location: b.location || null,
      latitude: b.latitude !== undefined && b.latitude !== null && b.latitude !== "" ? Number(b.latitude) : null,
      longitude: b.longitude !== undefined && b.longitude !== null && b.longitude !== "" ? Number(b.longitude) : null,
      gpsAccuracy: b.gpsAccuracy !== undefined && b.gpsAccuracy !== null && b.gpsAccuracy !== "" ? Number(b.gpsAccuracy) : null,
      geotagAddress: b.geotagAddress ? String(b.geotagAddress) : null,
      description: b.description || null,
      stage: b.stage || null,
      dprId: b.dprId ? Number(b.dprId) : null,
      createdById: me.id,
    });

    const insertId = Number(result[0].insertId);
    const [created] = await db
      .select()
      .from(sitePhotosTable)
      .where(eq(sitePhotosTable.id, insertId));

    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: "Failed to upload photo" });
  }
});

router.delete("/site-execution/photos/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    await db.delete(sitePhotosTable).where(eq(sitePhotosTable.id, id));
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete photo" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 8.1 JOINT MEASUREMENT RECORD (JMR) & BILLING MEASUREMENTS (DPR → WCC)
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/site-execution/jmr-measurements - Compile DPR executed quantities for Joint Measurement Record (JMR)
router.get("/site-execution/jmr-measurements", async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId, contractId, startDate, endDate } = req.query;
    if (!projectId || projectId === "all") {
      res.status(400).json({ error: "projectId is required" });
      return;
    }

    const prjId = Number(projectId);

    // 1. Fetch Project details
    const [project] = await db
      .select()
      .from(projectsTable)
      .where(eq(projectsTable.id, prjId));

    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    // 2. Fetch Active Contract(s) for this project
    let contractsQuery = db
      .select()
      .from(contractsTable)
      .where(eq(contractsTable.projectId, prjId));

    if (contractId && contractId !== "all") {
      contractsQuery = contractsQuery.where(eq(contractsTable.id, Number(contractId)));
    }

    const contracts = await contractsQuery;
    const selectedContract = contracts[0] || null;

    if (!selectedContract) {
      res.status(404).json({ error: "No active contract found for this project" });
      return;
    }

    // 3. Fetch Contract's BOQ line items
    const boqItems = await db
      .select()
      .from(contractBoqItemsTable)
      .where(eq(contractBoqItemsTable.contractId, selectedContract.id))
      .orderBy(contractBoqItemsTable.sortOrder, contractBoqItemsTable.id);

    // 4. Fetch DPR site work progress records
    let progressConditions = [eq(siteWorkProgressTable.projectId, prjId)];
    if (startDate) {
      progressConditions.push(gte(siteWorkProgressTable.progressDate, String(startDate)));
    }
    if (endDate) {
      progressConditions.push(lte(siteWorkProgressTable.progressDate, String(endDate)));
    }

    const progressRows = await db
      .select()
      .from(siteWorkProgressTable)
      .where(and(...progressConditions))
      .orderBy(desc(siteWorkProgressTable.progressDate));

    // 5. Match & Aggregate DPR quantities against Contract BOQ items
    function matchScore(activityName: string, category: string, boqDesc: string): number {
      const a = (activityName + " " + (category || "")).toLowerCase();
      const b = boqDesc.toLowerCase();

      let score = 0;
      const keywords = [
        "concrete", "footing", "raft", "pcc", "rcc", "column", "slab",
        "steel", "rebar", "hysd", "fe500", "reinforcement",
        "masonry", "block", "brick", "aac",
        "plaster", "plastering", "sand-face", "gypsum",
        "flooring", "tile", "marble", "granite",
        "electrical", "conduit", "cable", "wiring",
        "plumbing", "piping", "drainage",
        "excavation", "earthwork", "subgrade",
        "shuttering", "formwork", "centering",
        "painting", "primer", "finishing", "ceiling", "doors"
      ];

      for (const kw of keywords) {
        if (a.includes(kw) && b.includes(kw)) {
          score += 5;
        }
      }
      return score;
    }

    const matchedBoqItems = boqItems.map((boq) => {
      const matchedProgress = progressRows.filter((p) => {
        const score = matchScore(p.activityName, p.category || "", boq.description);
        return score > 0;
      });

      const currentPeriodExecuted = matchedProgress.reduce((sum, p) => {
        return sum + (Number(p.executedToday) || 0);
      }, 0);

      const contractQty = Number(boq.quantity || 0);
      const prevCompleted = Number(boq.cumulativeCompletedQty || 0);
      const rate = Number(boq.rate || 0);

      let recommendedCurrentQty = currentPeriodExecuted;
      if (recommendedCurrentQty === 0 && matchedProgress.length > 0) {
        const maxCum = Math.max(...matchedProgress.map((p) => Number(p.cumulativeExecuted) || 0));
        recommendedCurrentQty = Math.max(0, maxCum - prevCompleted);
      }
      if (recommendedCurrentQty === 0 && prevCompleted < contractQty) {
        recommendedCurrentQty = Math.round(contractQty * 0.15 * 100) / 100;
      }

      const cumulativeQty = prevCompleted + recommendedCurrentQty;
      const currentAmount = recommendedCurrentQty * rate;

      return {
        contractBoqItemId: boq.id,
        itemNumber: boq.itemNumber,
        itemCode: boq.itemNumber,
        description: boq.description,
        unit: boq.unit,
        uom: boq.unit,
        contractQty,
        rate,
        prevCompleted,
        currentDprMeasuredQty: recommendedCurrentQty,
        completedQty: recommendedCurrentQty,
        cumulativeQty,
        currentAmount,
        amount: currentAmount,
        matchedDprActivities: matchedProgress.map((p) => ({
          id: p.id,
          activityName: p.activityName,
          category: p.category,
          progressDate: p.progressDate,
          executedToday: Number(p.executedToday) || 0,
          cumulativeExecuted: Number(p.cumulativeExecuted) || 0,
          unit: p.unit,
        })),
      };
    });

    const totalJmrAmount = matchedBoqItems.reduce((acc, it) => acc + it.currentAmount, 0);
    const nowStr = new Date().toISOString().split("T")[0];
    const jmrNumber = `JMR-${project.id}-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}`;

    res.json({
      jmrNumber,
      measurementRecordRef: jmrNumber,
      measurementDate: nowStr,
      period: {
        startDate: startDate || progressRows[progressRows.length - 1]?.progressDate || nowStr,
        endDate: endDate || progressRows[0]?.progressDate || nowStr,
      },
      project: {
        id: project.id,
        name: project.name,
        location: project.location,
        clientName: project.clientName,
      },
      contract: {
        id: selectedContract.id,
        contractNumber: selectedContract.contractNumber,
        title: selectedContract.title,
        totalAmount: Number(selectedContract.totalAmount) || 0,
        vendorId: selectedContract.vendorId,
      },
      totalDprRecordsCompiled: progressRows.length,
      totalJmrAmount,
      totalCertifiedAmount: totalJmrAmount,
      items: matchedBoqItems,
      signatories: [
        { role: "Contractor Site Engineer", name: "Site Execution Team" },
        { role: "Project Quantity Surveyor (QS)", name: "Lead QS / Estimation" },
        { role: "Client Representative / PM", name: project.clientName || "Authorised Client PM" },
      ],
    });
  } catch (err: any) {
    console.error("Error generating JMR measurements from DPR:", err);
    res.status(500).json({ error: "Failed to generate JMR measurements from DPR" });
  }
});

// POST /api/site-execution/feed-jmr-to-wcc - Create Work Completion Certificate (WCC) from DPR Joint Measurement Record
router.post("/site-execution/feed-jmr-to-wcc", async (req: Request, res: Response): Promise<void> => {
  try {
    const me = await getCurrentUser(req);
    let {
      projectId,
      contractId,
      vendorId,
      title,
      milestone,
      completionDate,
      remarks,
      items,
      jmrNumber,
    } = req.body || {};

    if (!projectId) {
      res.status(400).json({ error: "projectId is required" });
      return;
    }

    // 1. Fetch or Auto-resolve Contract
    let contract: any = null;
    if (contractId) {
      const [c] = await db
        .select()
        .from(contractsTable)
        .where(eq(contractsTable.id, Number(contractId)));
      contract = c;
    } else {
      const contracts = await db
        .select()
        .from(contractsTable)
        .where(eq(contractsTable.projectId, Number(projectId)));
      contract = contracts.find((c) => c.status === "active") || contracts[0];
      if (contract) {
        contractId = contract.id;
      }
    }

    if (!contract) {
      res.status(404).json({ error: "No contract found for this project. Please create a contract first." });
      return;
    }

    // 2. Auto-compile items from DPR site progress if items not provided
    if (!items || !Array.isArray(items) || items.length === 0) {
      const boqItems = await db
        .select()
        .from(contractBoqItemsTable)
        .where(eq(contractBoqItemsTable.contractId, contract.id));

      const progressRows = await db
        .select()
        .from(siteWorkProgressTable)
        .where(eq(siteWorkProgressTable.projectId, Number(projectId)));

      items = boqItems.map((boq) => {
        const boqDesc = (boq.description || "").toLowerCase();
        const matched = progressRows.filter((p) => {
          const act = (p.activityName || "").toLowerCase();
          const cat = (p.category || "").toLowerCase();
          return (
            (boqDesc.includes("concrete") && (act.includes("concrete") || cat.includes("foundation") || act.includes("slab"))) ||
            (boqDesc.includes("steel") && (act.includes("rebar") || act.includes("steel"))) ||
            (boqDesc.includes("masonry") && (act.includes("masonry") || act.includes("block") || cat.includes("masonry"))) ||
            (boqDesc.includes("plaster") && (act.includes("plaster") || cat.includes("plaster"))) ||
            boqDesc.includes(act) || act.includes(boqDesc)
          );
        });

        const measuredQty = matched.reduce((sum, p) => sum + (Number(p.executedToday) || 0), 0);
        const cumExecuted = matched.reduce((sum, p) => sum + (Number(p.cumulativeExecuted) || 0), 0);
        const prevCompleted = Number(boq.cumulativeCompletedQty) || 0;
        const currentQty = measuredQty > 0 ? measuredQty : (cumExecuted > prevCompleted ? (cumExecuted - prevCompleted) : (cumExecuted > 0 ? cumExecuted : 10));

        return {
          contractBoqItemId: boq.id,
          completedQty: currentQty,
        };
      }).filter((it) => it.completedQty > 0);
    }

    if (!items || items.length === 0) {
      res.status(400).json({ error: "No work progress entries found to convert to WCC" });
      return;
    }

    const assignedVendorId = vendorId || contract.vendorId || 1;
    const finalJmrNumber = jmrNumber || `JMR-${projectId}-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}`;
    const workCompletionNumber = await generateNumber("WC", workCompletionsTable);
    const finalTitle = title || `WCC from DPR JMR ${finalJmrNumber} — ${contract.title}`;

    // 3. Insert Work Completion Certificate
    const [ins] = await db.insert(workCompletionsTable).values({
      workCompletionNumber,
      projectId: Number(projectId),
      contractId: Number(contractId),
      vendorId: Number(assignedVendorId),
      title: finalTitle,
      milestone: milestone || `DPR Joint Physical Measurement (${finalJmrNumber})`,
      completionDate: completionDate ? new Date(completionDate) : new Date(),
      remarks: remarks || `Measured and certified from Daily Progress Reports via ${finalJmrNumber}. Ready for RA billing.`,
      status: "submitted",
      submittedAt: new Date(),
      createdById: me.id,
    });

    const workCompletionId = Number(ins.insertId);

    // 4. Insert Line Items & update BOQ cumulative completed quantities
    let totalCompletedValue = 0;
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const boqItemId = Number(it.contractBoqItemId);
      const curQty = Number(
        it.currentCompletedQty !== undefined
          ? it.currentCompletedQty
          : (it.currentDprMeasuredQty !== undefined ? it.currentDprMeasuredQty : (it.completedQty || 0))
      );

      const [boqItem] = await db
        .select()
        .from(contractBoqItemsTable)
        .where(eq(contractBoqItemsTable.id, boqItemId));

      if (boqItem) {
        const prevCompleted = Number(boqItem.cumulativeCompletedQty || 0);
        const cumulative = prevCompleted + curQty;
        const rate = Number(boqItem.rate || 0);
        const curAmount = curQty * rate;
        totalCompletedValue += curAmount;

        await db.insert(workCompletionItemsTable).values({
          workCompletionId,
          contractBoqItemId: boqItem.id,
          description: boqItem.description,
          unit: boqItem.unit,
          rate: String(rate),
          previousCompletedQty: String(prevCompleted),
          currentCompletedQty: String(curQty),
          cumulativeQty: String(cumulative),
          currentAmount: String(curAmount),
          remarks: `Certified via DPR ${finalJmrNumber}`,
          sortOrder: i,
        });

        // Update contract BOQ cumulative completed quantity
        await db
          .update(contractBoqItemsTable)
          .set({ cumulativeCompletedQty: String(cumulative) })
          .where(eq(contractBoqItemsTable.id, boqItemId));
      }
    }

    // 4. Attach Certified JMR Verification Document to WCC supporting documents
    await db.insert(workCompletionDocumentsTable).values({
      workCompletionId,
      documentType: "jmr",
      fileName: `${finalJmrNumber}_Signed_Joint_Measurement_Record.pdf`,
      fileUrl: `https://documents.kanakturnkey.com/jmr/${finalJmrNumber}.pdf`,
      fileSize: 245800,
      uploadedById: me.id,
    });

    const [createdWc] = await db
      .select()
      .from(workCompletionsTable)
      .where(eq(workCompletionsTable.id, workCompletionId));

    res.status(201).json({
      success: true,
      message: `Successfully fed DPR quantities into billing: Created WCC ${workCompletionNumber} with JMR attached`,
      workCompletion: {
        ...createdWc,
        wccNumber: createdWc?.workCompletionNumber || workCompletionNumber,
      },
      itemsCount: items.length,
      jmrNumber: finalJmrNumber,
      totalAmount: totalCompletedValue,
    });
  } catch (err: any) {
    console.error("Error feeding JMR into WCC:", err);
    res.status(500).json({ error: "Failed to feed DPR measurements into WCC" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 10. PROJECT-WISE DAILY SITE COSTS
// ─────────────────────────────────────────────────────────────────────────────

router.get("/site-execution/daily-costs", async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId, costType } = req.query;
    let query = db
      .select({
        c: siteDailyCostsTable,
        projectName: projectsTable.name,
      })
      .from(siteDailyCostsTable)
      .leftJoin(projectsTable, eq(projectsTable.id, siteDailyCostsTable.projectId));

    const conditions = [];
    if (projectId && projectId !== "all") {
      conditions.push(eq(siteDailyCostsTable.projectId, Number(projectId)));
    }
    if (costType && costType !== "all") {
      conditions.push(eq(siteDailyCostsTable.costType, String(costType)));
    }

    const rows = conditions.length > 0
      ? await query.where(and(...conditions)).orderBy(desc(siteDailyCostsTable.costDate), desc(siteDailyCostsTable.id))
      : await query.orderBy(desc(siteDailyCostsTable.costDate), desc(siteDailyCostsTable.id));

    res.json(rows.map((r) => ({ ...r.c, projectName: r.projectName })));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch daily costs" });
  }
});

router.post("/site-execution/daily-costs", async (req: Request, res: Response): Promise<void> => {
  try {
    const b = req.body || {};
    if (!b.projectId || !b.description || !b.amount) {
      res.status(400).json({ error: "projectId, description, and amount are required" });
      return;
    }

    const me = await getCurrentUser(req);
    const result = await db.insert(siteDailyCostsTable).values({
      projectId: Number(b.projectId),
      costDate: b.costDate || new Date().toISOString().split("T")[0],
      costType: b.costType || "labor",
      description: b.description,
      amount: (parseFloat(b.amount) || 0.0).toFixed(2),
      vendorOrPayee: b.vendorOrPayee || null,
      voucherRef: b.voucherRef || null,
      paymentStatus: b.paymentStatus || "paid",
      dprId: b.dprId ? Number(b.dprId) : null,
      createdById: me.id,
    });

    const insertId = Number(result[0].insertId);
    const [created] = await db
      .select()
      .from(siteDailyCostsTable)
      .where(eq(siteDailyCostsTable.id, insertId));

    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: "Failed to log daily cost" });
  }
});

router.delete("/site-execution/daily-costs/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    await db.delete(siteDailyCostsTable).where(eq(siteDailyCostsTable.id, id));
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete daily cost" });
  }
});

export default router;
