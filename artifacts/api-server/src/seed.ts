import {
  db,
  usersTable,
  leadsTable,
  leadActivitiesTable,
  siteVisitsTable,
  drawingsTable,
  boqsTable,
  boqItemsTable,
  negotiationsTable,
  projectsTable,
  tasksTable,
  budgetItemsTable,
  raBillsTable,
  expensesTable,
  invoicesTable,
  vendorInvoicesTable,
  financialInstrumentsTable,
  vendorsTable,
  materialRequestsTable,
  rfqsTable,
  quotationsTable,
  purchaseOrdersTable,
  materialsTable,
  stakeholdersTable,
  communicationsTable,
  meetingsTable,
  documentsTable,
  notificationsTable,
  auditLogsTable,
  // Procurement Module Tables
  procurementMaterialRequestsTable,
  procurementMaterialRequestItemsTable,
  procurementRfqsTable,
  procurementRfqItemsTable,
  procurementRfqVendorsTable,
  procurementVendorQuotesTable,
  procurementVendorQuoteItemsTable,
  procurementPurchaseOrdersTable,
  procurementPurchaseOrderItemsTable,
  procurementMaterialReceiptsTable,
  procurementMaterialReceiptItemsTable,
  procurementQualityInspectionsTable,
  procurementQualityInspectionItemsTable,
  procurementInventoryItemsTable,
  procurementInventoryTransactionsTable,
  procurementVendorFollowUpsTable,
  procurementNotificationsTable,
} from "@workspace/db";
import { eq as eqFilter } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { logger } from "./lib/logger";

export async function seedIfEmpty(): Promise<void> {
  const [existingUser] = await db.select().from(usersTable).limit(1);
  if (existingUser) {
    logger.info("Seed data already present, skipping");
    return;
  }
  logger.info("Seeding database");

  const defaultPasswordHash = await bcrypt.hash("password123", 10);

  await db
    .insert(usersTable)
    .values([
      {
        email: "ananya.rao@kanak.in",
        name: "Ananya Rao",
        passwordHash: defaultPasswordHash,
        avatarUrl: null,
        roles: [
          "admin",
          "project_manager",
          "engineer",
          "accountant",
          "procurement_officer",
          "viewer",
        ],
        activeRole: "admin",
      },
      {
        email: "rohan.mehta@kanak.in",
        name: "Rohan Mehta",
        passwordHash: defaultPasswordHash,
        avatarUrl: null,
        roles: ["project_manager", "viewer"],
        activeRole: "project_manager",
      },
      {
        email: "priya.iyer@kanak.in",
        name: "Priya Iyer",
        passwordHash: defaultPasswordHash,
        avatarUrl: null,
        roles: ["engineer", "viewer"],
        activeRole: "engineer",
      },
      {
        email: "vikram.shah@kanak.in",
        name: "Vikram Shah",
        passwordHash: defaultPasswordHash,
        avatarUrl: null,
        roles: ["accountant", "viewer"],
        activeRole: "accountant",
      },
      {
        email: "neha.kapoor@kanak.in",
        name: "Neha Kapoor",
        passwordHash: defaultPasswordHash,
        avatarUrl: null,
        roles: ["procurement_officer", "viewer"],
        activeRole: "procurement_officer",
      },
      {
        email: "arjun.singh@kanak.in",
        name: "Arjun Singh",
        passwordHash: defaultPasswordHash,
        avatarUrl: null,
        roles: ["viewer"],
        activeRole: "viewer",
      },
    ]);

  // Query the inserted users since MySQL doesn't support .returning()
  const users = await db.select().from(usersTable);
  const admin = users.find(u => u.email === "ananya.rao@kanak.in");
  const pm = users.find(u => u.email === "rohan.mehta@kanak.in");
  const eng = users.find(u => u.email === "priya.iyer@kanak.in");
  const acct = users.find(u => u.email === "vikram.shah@kanak.in");
  const proc = users.find(u => u.email === "neha.kapoor@kanak.in");
  const viewer = users.find(u => u.email === "arjun.singh@kanak.in");

  const today = new Date();
  const ymd = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;

  await db
    .insert(leadsTable)
    .values([
      {
        leadNumber: `LD-${ymd}-0001`,
        customerName: "Mahesh Bhatia",
        company: "Lumina Hospitality Group",
        contactEmail: "mahesh@luminahg.in",
        contactPhone: "+91 98765 43210",
        projectType: "Hotel Interior Fit-out",
        location: "Bandra West, Mumbai",
        budgetEstimate: "32500000",
        leadSource: "Referral",
        status: "qualified",
        stage: "boq",
        priority: "high",
        ownerId: pm!.id,
        expectedClosureDate: "2026-06-15",
        notes: "Boutique hotel renovation, 42 rooms.",
      },
      {
        leadNumber: `LD-${ymd}-0002`,
        customerName: "Sara D'Souza",
        company: "Verde Workspaces",
        contactEmail: "sara@verdews.com",
        contactPhone: "+91 99887 65432",
        projectType: "Office Build-out",
        location: "Whitefield, Bengaluru",
        budgetEstimate: "18000000",
        leadSource: "Inbound web",
        status: "contacted",
        stage: "site_visit",
        priority: "medium",
        ownerId: pm!.id,
        expectedClosureDate: "2026-07-30",
        notes: "Two-floor co-working buildout.",
      },
      {
        leadNumber: `LD-${ymd}-0003`,
        customerName: "Ritesh Khanna",
        company: "Northshore Residences",
        contactEmail: "ritesh@northshore.in",
        contactPhone: "+91 90000 11122",
        projectType: "Residential Tower MEP",
        location: "Powai, Mumbai",
        budgetEstimate: "84000000",
        leadSource: "Tender",
        status: "new",
        stage: "lead_creation",
        priority: "urgent",
        ownerId: admin!.id,
        expectedClosureDate: "2026-09-20",
        notes: "EMD already deposited.",
      },
      {
        leadNumber: `LD-${ymd}-0004`,
        customerName: "Kavita Menon",
        company: "Asha Healthcare",
        contactEmail: "kavita@ashahc.org",
        contactPhone: "+91 91234 55667",
        projectType: "Hospital Wing Expansion",
        location: "Koramangala, Bengaluru",
        budgetEstimate: "56000000",
        leadSource: "Referral",
        status: "qualified",
        stage: "negotiation",
        priority: "high",
        ownerId: pm!.id,
        expectedClosureDate: "2026-08-10",
        notes: "Two rounds of negotiation completed.",
      },
      {
        leadNumber: `LD-${ymd}-0005`,
        customerName: "Devansh Patel",
        company: "Patel Logistics",
        contactEmail: "devansh@patellog.in",
        contactPhone: "+91 93456 11223",
        projectType: "Warehouse Build",
        location: "Bhiwandi, Maharashtra",
        budgetEstimate: "22000000",
        leadSource: "Cold outreach",
        status: "lost",
        stage: "negotiation",
        priority: "low",
        ownerId: admin!.id,
        expectedClosureDate: "2026-04-01",
        notes: "Lost to local contractor on price.",
      },
    ]);

  // Query the inserted leads since MySQL doesn't support .returning()
  const leads = await db.select().from(leadsTable).orderBy(leadsTable.id);

  await db.insert(leadActivitiesTable).values([
    {
      leadId: leads[0]!.id,
      activityType: "call",
      title: "Discovery call with Mahesh",
      description:
        "Walked through scope, timeline, and budget expectations. Decision-maker is the GM.",
      createdById: pm!.id,
    },
    {
      leadId: leads[0]!.id,
      activityType: "email",
      title: "Sent capability deck",
      description: "Shared past hospitality projects portfolio.",
      createdById: pm!.id,
    },
    {
      leadId: leads[1]!.id,
      activityType: "meeting",
      title: "Walkthrough at Verde HQ",
      description: "Toured both floors, took preliminary measurements.",
      createdById: eng!.id,
    },
    {
      leadId: leads[3]!.id,
      activityType: "note",
      title: "Negotiation round 2 completed",
      description: "Counter-offer at 5.5% discount sent.",
      createdById: pm!.id,
    },
  ]);

  await db.insert(siteVisitsTable).values([
    {
      leadId: leads[0]!.id,
      visitDate: "2026-04-12",
      visitTime: "10:30",
      engineerId: eng!.id,
      siteAddress: "Pali Hill, Bandra West, Mumbai 400050",
      latitude: 19.0596,
      longitude: 72.8295,
      measurements: "Total carpet area 18,400 sqft across 42 rooms + lobby.",
      observations:
        "Existing electrical needs full rework. HVAC ducting can be retained.",
      status: "completed",
    },
    {
      leadId: leads[1]!.id,
      visitDate: "2026-04-25",
      visitTime: "14:00",
      engineerId: eng!.id,
      siteAddress: "ITPL Main Road, Whitefield, Bengaluru 560066",
      latitude: 12.9698,
      longitude: 77.7499,
      measurements: "11,200 sqft per floor, 22,400 sqft total.",
      observations: "Floor plates in shell condition, ready for fit-out.",
      status: "pending",
    },
  ]);

  await db.insert(drawingsTable).values([
    {
      leadId: leads[0]!.id,
      fileName: "Lumina_Lobby_Concept_v3.pdf",
      fileType: "application/pdf",
      fileSize: 2840000,
      version: 3,
      status: "approved",
      reviewerComments: "Approved by client for BOQ stage.",
      uploadedById: eng!.id,
      reviewedById: pm!.id,
    },
    {
      leadId: leads[0]!.id,
      fileName: "Lumina_Room_Type_A_Rev2.dwg",
      fileType: "application/dwg",
      fileSize: 1520000,
      version: 2,
      status: "submitted",
      uploadedById: eng!.id,
    },
    {
      leadId: leads[3]!.id,
      fileName: "Asha_Wing_HVAC_Plan_v1.pdf",
      fileType: "application/pdf",
      fileSize: 3210000,
      version: 1,
      status: "draft",
      uploadedById: eng!.id,
    },
  ]);

  await db
    .insert(boqsTable)
    .values({
      leadId: leads[0]!.id,
      version: 1,
      status: "submitted",
      createdById: pm!.id,
    });

  // Query the inserted BOQ since MySQL doesn't support .returning()
  const boqs = await db.select().from(boqsTable).where(eqFilter(boqsTable.leadId, leads[0]!.id));
  const boq1 = boqs[0];

  const items: Array<{
    qty: number;
    up: number;
    tax: number;
    margin: number;
    name: string;
    cat: string;
    unit: string;
  }> = [
    { qty: 42, up: 185000, tax: 18, margin: 12, name: "Guest room fit-out package", cat: "Interior", unit: "room" },
    { qty: 1, up: 2400000, tax: 18, margin: 15, name: "Lobby millwork & finishes", cat: "Interior", unit: "lot" },
    { qty: 18400, up: 65, tax: 18, margin: 10, name: "Vinyl flooring premium grade", cat: "Materials", unit: "sqft" },
    { qty: 1, up: 1850000, tax: 18, margin: 14, name: "MEP electrical rework", cat: "MEP", unit: "lot" },
  ];

  let sub = 0,
    taxT = 0,
    marT = 0;
  for (let i = 0; i < items.length; i++) {
    const it = items[i]!;
    const base = it.qty * it.up;
    const tax = (base * it.tax) / 100;
    const mar = (base * it.margin) / 100;
    const total = base + tax + mar;
    sub += base;
    taxT += tax;
    marT += mar;
    await db.insert(boqItemsTable).values({
      boqId: boq1!.id,
      itemName: it.name,
      category: it.cat,
      quantity: String(it.qty),
      unit: it.unit,
      unitPrice: String(it.up),
      taxPercent: String(it.tax),
      marginPercent: String(it.margin),
      totalPrice: total.toFixed(2),
      sortOrder: i,
    });
  }
  const { eq } = await import("drizzle-orm");
  await db
    .update(boqsTable)
    .set({
      subtotal: sub.toFixed(2),
      taxTotal: taxT.toFixed(2),
      marginTotal: marT.toFixed(2),
      grandTotal: (sub + taxT + marT).toFixed(2),
    })
    .where(eqFilter(boqsTable.id, boq1!.id));

  await db.insert(negotiationsTable).values([
    {
      leadId: leads[3]!.id,
      roundNumber: 1,
      revisedAmount: "53000000",
      discountPercent: "5.36",
      status: "approved",
      requiresApproval: false,
      notes: "First counter accepted.",
      createdById: pm!.id,
      approvedById: admin!.id,
    },
    {
      leadId: leads[3]!.id,
      roundNumber: 2,
      revisedAmount: "51500000",
      discountPercent: "8.04",
      status: "pending",
      requiresApproval: true,
      notes: "Awaiting admin approval — discount exceeds 5%.",
      createdById: pm!.id,
    },
  ]);

  await db
    .insert(projectsTable)
    .values([
      {
        name: "Sentinel Tech Park — Phase 2",
        type: "Commercial Build-out",
        location: "Hinjewadi, Pune",
        clientName: "Sentinel Realty",
        startDate: "2026-01-15",
        endDate: "2026-12-20",
        budget: "62000000",
        description:
          "180,000 sqft commercial build-out across two floor plates with shared amenities deck.",
        status: "in_progress",
        progress: 47,
        teamSize: 38,
        createdById: admin!.id,
      },
      {
        name: "Citygate Residences",
        type: "Residential MEP",
        location: "Andheri East, Mumbai",
        clientName: "Citygate Developers",
        startDate: "2025-09-01",
        endDate: "2026-08-30",
        budget: "94000000",
        description:
          "MEP install across 24-floor residential tower. 188 apartments.",
        status: "in_progress",
        progress: 72,
        teamSize: 52,
        createdById: admin!.id,
      },
      {
        name: "Asha Hospital East Wing",
        type: "Healthcare Fit-out",
        location: "Koramangala, Bengaluru",
        clientName: "Asha Healthcare",
        startDate: "2026-05-01",
        endDate: "2027-02-28",
        budget: "56000000",
        description: "ICU, OT, and patient ward fit-out for 4-floor wing.",
        status: "planning",
        progress: 8,
        teamSize: 12,
        createdById: pm!.id,
      },
      {
        name: "Northbrook Logistics Hub",
        type: "Industrial",
        location: "Bhiwandi, Maharashtra",
        clientName: "Northbrook Group",
        startDate: "2025-04-10",
        endDate: "2026-03-15",
        budget: "38000000",
        description: "180,000 sqft warehouse with cold storage.",
        status: "completed",
        progress: 100,
        teamSize: 22,
        createdById: admin!.id,
      },
      {
        name: "Maplewood Towers Lobby Refresh",
        type: "Interior",
        location: "Gurgaon, Haryana",
        clientName: "Maplewood Society",
        startDate: "2026-03-01",
        endDate: "2026-05-30",
        budget: "8500000",
        description: "Premium lobby refresh across two towers.",
        status: "on_hold",
        progress: 25,
        teamSize: 8,
        createdById: pm!.id,
      },
    ]);

  // Query the inserted projects since MySQL doesn't support .returning()
  const projects = await db.select().from(projectsTable).orderBy(projectsTable.id);

  await db.insert(tasksTable).values([
    {
      projectId: projects[0]!.id,
      title: "Floor 4 ceiling grid installation",
      description: "Install T-grid and integrate with HVAC diffusers.",
      assignedToId: eng!.id,
      startDate: "2026-04-15",
      endDate: "2026-04-28",
      priority: "high",
      status: "in_progress",
      progress: 60,
      createdById: pm!.id,
    },
    {
      projectId: projects[0]!.id,
      title: "Procure flooring materials for Floor 5",
      assignedToId: proc!.id,
      startDate: "2026-04-20",
      endDate: "2026-05-02",
      priority: "medium",
      status: "todo",
      progress: 0,
      createdById: pm!.id,
    },
    {
      projectId: projects[0]!.id,
      title: "Client snag review walkthrough",
      assignedToId: pm!.id,
      startDate: "2026-04-22",
      endDate: "2026-04-22",
      priority: "high",
      status: "in_review",
      progress: 80,
      createdById: pm!.id,
    },
    {
      projectId: projects[1]!.id,
      title: "Riser shaft electrical pull",
      assignedToId: eng!.id,
      startDate: "2026-04-10",
      endDate: "2026-05-10",
      priority: "high",
      status: "in_progress",
      progress: 55,
      createdById: pm!.id,
    },
    {
      projectId: projects[1]!.id,
      title: "Floors 18-20 plumbing test",
      assignedToId: eng!.id,
      startDate: "2026-04-18",
      endDate: "2026-04-24",
      priority: "medium",
      status: "completed",
      progress: 100,
      createdById: pm!.id,
    },
    {
      projectId: projects[2]!.id,
      title: "Site mobilization plan",
      assignedToId: pm!.id,
      startDate: "2026-04-25",
      endDate: "2026-05-05",
      priority: "high",
      status: "todo",
      progress: 10,
      createdById: pm!.id,
    },
  ]);

  await db.insert(budgetItemsTable).values([
    {
      projectId: projects[0]!.id,
      costCode: "MAT-100",
      description: "Materials — flooring & finishes",
      budgeted: "12500000",
      actual: "5800000",
      committed: "3200000",
    },
    {
      projectId: projects[0]!.id,
      costCode: "LAB-200",
      description: "Labor — civil & MEP",
      budgeted: "18000000",
      actual: "9400000",
      committed: "0",
    },
    {
      projectId: projects[0]!.id,
      costCode: "EQP-300",
      description: "Equipment rental",
      budgeted: "4200000",
      actual: "1850000",
      committed: "600000",
    },
    {
      projectId: projects[0]!.id,
      costCode: "SUB-400",
      description: "Subcontractor — HVAC",
      budgeted: "9800000",
      actual: "4200000",
      committed: "2100000",
    },
    {
      projectId: projects[1]!.id,
      costCode: "MAT-100",
      description: "Materials — MEP",
      budgeted: "28000000",
      actual: "21000000",
      committed: "3500000",
    },
    {
      projectId: projects[1]!.id,
      costCode: "LAB-200",
      description: "Labor — install",
      budgeted: "32000000",
      actual: "23000000",
      committed: "0",
    },
  ]);

  await db.insert(raBillsTable).values([
    {
      projectId: projects[0]!.id,
      billNumber: "RA-SEN-001",
      description: "Milestone 1: Civil & shell ready",
      amount: "12000000",
      milestone: "Civil shell completion",
      status: "approved",
      createdById: pm!.id,
    },
    {
      projectId: projects[0]!.id,
      billNumber: "RA-SEN-002",
      description: "Milestone 2: MEP rough-in",
      amount: "9500000",
      milestone: "MEP rough-in",
      status: "submitted",
      createdById: pm!.id,
    },
    {
      projectId: projects[1]!.id,
      billNumber: "RA-CTY-005",
      description: "Floors 1-12 MEP complete",
      amount: "18000000",
      milestone: "Lower 12 floors complete",
      status: "invoiced",
      createdById: pm!.id,
    },
  ]);

  await db.insert(expensesTable).values([
    {
      projectId: projects[0]!.id,
      description: "Site office cabin rental — April",
      amount: "85000",
      category: "equipment",
      expenseDate: "2026-04-01",
      status: "approved",
      submittedById: eng!.id,
      approvedById: pm!.id,
    },
    {
      projectId: projects[0]!.id,
      description: "Steel rebar advance",
      amount: "1240000",
      category: "materials",
      expenseDate: "2026-04-08",
      status: "approved",
      submittedById: proc!.id,
      approvedById: pm!.id,
    },
    {
      projectId: projects[1]!.id,
      description: "Crane operator — week 14",
      amount: "320000",
      category: "labor",
      expenseDate: "2026-04-12",
      status: "submitted",
      submittedById: eng!.id,
    },
    {
      projectId: projects[1]!.id,
      description: "HVAC subcontractor advance",
      amount: "2800000",
      category: "subcontractor",
      expenseDate: "2026-04-15",
      status: "draft",
      submittedById: proc!.id,
    },
  ]);

  await db.insert(invoicesTable).values([
    {
      projectId: projects[0]!.id,
      invoiceNumber: "INV-2026-0042",
      clientName: "Sentinel Realty",
      amount: "12000000",
      invoiceDate: "2026-03-15",
      dueDate: "2026-04-14",
      paymentDate: "2026-04-10",
      reconciled: true,
      status: "paid",
    },
    {
      projectId: projects[1]!.id,
      invoiceNumber: "INV-2026-0048",
      clientName: "Citygate Developers",
      amount: "18000000",
      invoiceDate: "2026-03-28",
      dueDate: "2026-04-27",
      reconciled: false,
      status: "sent",
    },
    {
      projectId: projects[1]!.id,
      invoiceNumber: "INV-2026-0031",
      clientName: "Citygate Developers",
      amount: "9400000",
      invoiceDate: "2026-02-10",
      dueDate: "2026-03-12",
      reconciled: false,
      status: "overdue",
    },
  ]);

  await db
    .insert(vendorsTable)
    .values([
      {
        name: "Aarav Steel & Cement",
        contactPerson: "Aarav Joshi",
        email: "aarav@aaravsc.in",
        phone: "+91 90909 12345",
        address: "MIDC Bhosari, Pune",
        category: "Materials",
        rating: "4.6",
        status: "active",
      },
      {
        name: "Polaris Electricals",
        contactPerson: "Sneha Pillai",
        email: "sneha@polariselec.in",
        phone: "+91 98989 22220",
        address: "Peenya, Bengaluru",
        category: "MEP",
        rating: "4.3",
        status: "active",
      },
      {
        name: "Helios HVAC Systems",
        contactPerson: "Karan Bedi",
        email: "karan@helioshvac.in",
        phone: "+91 91919 55444",
        address: "Andheri MIDC, Mumbai",
        category: "HVAC",
        rating: "4.8",
        status: "active",
      },
      {
        name: "Ridgeline Interiors",
        contactPerson: "Maya Nair",
        email: "maya@ridgeline.in",
        phone: "+91 93939 33330",
        address: "HSR Layout, Bengaluru",
        category: "Interior",
        rating: "4.1",
        status: "active",
      },
      {
        name: "Sahyadri Tools Rental",
        contactPerson: "Imran Sheikh",
        email: "imran@sahyadritools.in",
        phone: "+91 95959 77770",
        address: "Bhiwandi, Maharashtra",
        category: "Equipment",
        rating: "3.9",
        status: "inactive",
      },
    ]);

  // Query the inserted vendors since MySQL doesn't support .returning()
  const vendors = await db.select().from(vendorsTable).orderBy(vendorsTable.id);

  await db
    .insert(materialRequestsTable)
    .values([
      {
        projectId: projects[0]!.id,
        title: "Vinyl flooring — Floor 5",
        description: "Premium grade, 12,000 sqft.",
        quantity: "12000",
        unit: "sqft",
        status: "rfq_sent",
        createdById: eng!.id,
      },
      {
        projectId: projects[0]!.id,
        title: "Suspended ceiling tiles — Floors 4-6",
        quantity: "8500",
        unit: "sqft",
        status: "approved",
        createdById: eng!.id,
      },
      {
        projectId: projects[1]!.id,
        title: "Copper wiring 4mm — riser shaft",
        quantity: "4500",
        unit: "m",
        status: "pending",
        createdById: eng!.id,
      },
    ]);

  // Query the inserted material requests since MySQL doesn't support .returning()
  const matReqs = await db.select().from(materialRequestsTable).orderBy(materialRequestsTable.id);

  await db
    .insert(rfqsTable)
    .values({
      projectId: projects[0]!.id,
      materialRequestId: matReqs[0]!.id,
      title: "Vinyl flooring — Floor 5 (12,000 sqft premium)",
      description:
        "Need premium-grade vinyl flooring with 10-year warranty. Delivery to Hinjewadi site.",
      status: "quotes_received",
      createdById: proc!.id,
    });

  // Query the inserted RFQ since MySQL doesn't support .returning()
  const rfqs = await db.select().from(rfqsTable).orderBy(rfqsTable.id);
  const rfq1 = rfqs[0];

  await db.insert(quotationsTable).values([
    {
      rfqId: rfq1!.id,
      vendorId: vendors[0]!.id,
      amount: "780000",
      deliveryDays: 14,
      notes: "Includes installation labor.",
      isSelected: false,
    },
    {
      rfqId: rfq1!.id,
      vendorId: vendors[3]!.id,
      amount: "742000",
      deliveryDays: 18,
      notes: "Material only. 10-year warranty included.",
      isSelected: true,
    },
    {
      rfqId: rfq1!.id,
      vendorId: vendors[1]!.id,
      amount: "815000",
      deliveryDays: 10,
      notes: "Premium German brand, fastest delivery.",
      isSelected: false,
    },
  ]);

  await db.update(rfqsTable).set({ status: "awarded" }).where(eqFilter(rfqsTable.id, rfq1!.id));

  await db.insert(rfqsTable).values({
    projectId: projects[1]!.id,
    title: "Copper wiring 4mm — 4500m",
    description: "For riser shaft electrical pull.",
    status: "draft",
    createdById: proc!.id,
  });

  await db
    .insert(purchaseOrdersTable)
    .values([
      {
        projectId: projects[0]!.id,
        vendorId: vendors[3]!.id,
        poNumber: "PO-SEN-2026-014",
        description: "Vinyl flooring — Floor 5, 12000 sqft.",
        totalAmount: "742000",
        deliveryDate: "2026-05-10",
        status: "acknowledged",
        inspectionStatus: "pending",
        createdById: proc!.id,
      },
      {
        projectId: projects[0]!.id,
        vendorId: vendors[1]!.id,
        poNumber: "PO-SEN-2026-015",
        description: "MEP electrical rework materials.",
        totalAmount: "1820000",
        deliveryDate: "2026-04-30",
        status: "in_transit",
        inspectionStatus: "pending",
        createdById: proc!.id,
      },
      {
        projectId: projects[1]!.id,
        vendorId: vendors[2]!.id,
        poNumber: "PO-CTY-2026-009",
        description: "HVAC chillers — 4 units.",
        totalAmount: "4800000",
        deliveryDate: "2026-04-12",
        status: "delivered",
        inspectionStatus: "passed",
        createdById: proc!.id,
      },
    ]);

  // Query the inserted purchase orders since MySQL doesn't support .returning()
  const purchaseOrders = await db.select().from(purchaseOrdersTable).orderBy(purchaseOrdersTable.id);

  await db.insert(vendorInvoicesTable).values([
    {
      projectId: projects[1]!.id,
      vendorId: vendors[2]!.id,
      purchaseOrderId: purchaseOrders[2]!.id,
      invoiceNumber: "HVAC-2026-018",
      amount: "4800000",
      status: "matched",
    },
    {
      projectId: projects[0]!.id,
      vendorId: vendors[1]!.id,
      purchaseOrderId: purchaseOrders[1]!.id,
      invoiceNumber: "POL-INV-2026-204",
      amount: "1850000",
      discrepancyNotes: "Invoiced amount exceeds PO by INR 30,000.",
      status: "discrepancy",
    },
  ]);

  await db.insert(materialsTable).values([
    {
      projectId: projects[0]!.id,
      name: "Cement — OPC 53 grade",
      unit: "bag",
      quantityOnHand: "320",
      quantityCommitted: "180",
      quantityConsumed: "1240",
      minimumStock: "200",
    },
    {
      projectId: projects[0]!.id,
      name: "TMT steel bars 12mm",
      unit: "kg",
      quantityOnHand: "1850",
      quantityCommitted: "900",
      quantityConsumed: "8200",
      minimumStock: "2000",
    },
    {
      projectId: projects[1]!.id,
      name: "PVC conduit 25mm",
      unit: "m",
      quantityOnHand: "640",
      quantityCommitted: "0",
      quantityConsumed: "5400",
      minimumStock: "500",
    },
    {
      projectId: projects[1]!.id,
      name: "Copper wire 4mm",
      unit: "m",
      quantityOnHand: "120",
      quantityCommitted: "4500",
      quantityConsumed: "12800",
      minimumStock: "300",
    },
  ]);

  await db.insert(financialInstrumentsTable).values([
    {
      projectId: projects[1]!.id,
      instrumentType: "emd",
      amount: "940000",
      issueDate: "2025-08-15",
      expiryDate: "2026-05-15",
      bankName: "HDFC Bank",
      referenceNumber: "EMD-CTY-2025-009",
      status: "active",
      notes: "Auto-release on project closure.",
      createdById: acct!.id,
    },
    {
      projectId: projects[0]!.id,
      instrumentType: "bank_guarantee",
      bgSubType: "performance",
      amount: "3100000",
      issueDate: "2026-01-10",
      expiryDate: "2027-01-10",
      bankName: "ICICI Bank",
      referenceNumber: "BG-SEN-2026-PG-002",
      status: "active",
      notes: "5% performance BG, valid through DLP.",
      createdById: acct!.id,
    },
    {
      projectId: projects[0]!.id,
      instrumentType: "bank_guarantee",
      bgSubType: "advance_payment",
      amount: "6200000",
      issueDate: "2026-01-20",
      expiryDate: "2026-07-20",
      bankName: "ICICI Bank",
      referenceNumber: "BG-SEN-2026-AP-003",
      status: "active",
      notes: "Against 10% mobilization advance.",
      createdById: acct!.id,
    },
    {
      projectId: projects[3]!.id,
      instrumentType: "retention_dlp",
      amount: "1900000",
      issueDate: "2026-03-15",
      expiryDate: "2027-03-15",
      retentionPercent: "5.0",
      status: "active",
      notes: "Retention held for 12-month DLP.",
      createdById: acct!.id,
    },
    {
      projectId: projects[3]!.id,
      instrumentType: "bank_guarantee",
      bgSubType: "performance",
      amount: "1900000",
      issueDate: "2025-04-01",
      expiryDate: "2026-04-30",
      bankName: "Axis Bank",
      referenceNumber: "BG-NBK-2025-PG-001",
      status: "expired",
      notes: "Released after final acceptance.",
      createdById: acct!.id,
    },
  ]);

  await db.insert(stakeholdersTable).values([
    {
      projectId: projects[0]!.id,
      name: "Sentinel Realty — PMO",
      email: "pmo@sentinelrealty.in",
      organization: "Sentinel Realty",
      role: "Client PMO",
      accessLevel: "write",
    },
    {
      projectId: projects[0]!.id,
      name: "Studio Vellichor",
      email: "design@vellichor.in",
      organization: "Studio Vellichor",
      role: "Architect",
      accessLevel: "read",
    },
    {
      projectId: projects[1]!.id,
      name: "Citygate Site Engineer",
      email: "site@citygate.in",
      organization: "Citygate Developers",
      role: "Client representative",
      accessLevel: "write",
    },
  ]);

  await db.insert(communicationsTable).values([
    {
      projectId: projects[0]!.id,
      communicationType: "email",
      subject: "Re: Floor 5 finishes — sample approval",
      content: "Approved samples 2A and 4B. Please proceed with PO.",
      communicationDate: new Date("2026-04-18T10:30:00Z"),
      participants: "Mahesh, Rohan, Studio Vellichor",
      createdById: pm!.id,
    },
    {
      projectId: projects[1]!.id,
      communicationType: "phone",
      subject: "Crane availability discussion",
      content: "Confirmed crane available from April 22 for 10 days.",
      communicationDate: new Date("2026-04-19T14:00:00Z"),
      participants: "Rohan, Imran (Sahyadri)",
      createdById: pm!.id,
    },
  ]);

  await db.insert(meetingsTable).values([
    {
      projectId: projects[0]!.id,
      title: "Weekly site review — Sentinel",
      meetingDate: new Date("2026-04-26T05:00:00Z"),
      duration: 60,
      location: "Sentinel site office, Hinjewadi",
      agenda:
        "1. Floor 4 ceiling progress\n2. Floor 5 procurement status\n3. Snag review schedule",
      participants: "Rohan, Priya, Sentinel PMO",
      createdById: pm!.id,
    },
    {
      projectId: projects[1]!.id,
      title: "Citygate monthly steering",
      meetingDate: new Date("2026-04-30T11:30:00Z"),
      duration: 90,
      location: "Citygate corporate office",
      agenda: "Monthly progress, RA bill 6 approval, change orders.",
      participants: "Ananya, Rohan, Citygate leadership",
      createdById: admin!.id,
    },
  ]);

  await db.insert(documentsTable).values([
    {
      projectId: projects[0]!.id,
      fileName: "Sentinel_MSA_v3_signed.pdf",
      fileType: "application/pdf",
      fileSize: 2840000,
      category: "contract",
      version: 3,
      status: "active",
      uploadedById: admin!.id,
    },
    {
      projectId: projects[0]!.id,
      fileName: "Floor4_AsBuilt_Apr2026.dwg",
      fileType: "application/dwg",
      fileSize: 1520000,
      category: "drawing",
      version: 1,
      status: "active",
      uploadedById: eng!.id,
    },
    {
      projectId: projects[1]!.id,
      fileName: "Citygate_HSE_Audit_Mar2026.pdf",
      fileType: "application/pdf",
      fileSize: 3210000,
      category: "report",
      version: 1,
      status: "active",
      uploadedById: pm!.id,
    },
  ]);

  await db.insert(notificationsTable).values([
    {
      userId: admin!.id,
      notificationType: "approval_required",
      title: "Negotiation round 2 needs approval",
      message:
        "Asha Healthcare lead — discount of 8.04% exceeds 5% threshold.",
      isRead: false,
    },
    {
      userId: admin!.id,
      notificationType: "instrument_expiring",
      title: "EMD expiring in 22 days",
      message: "Citygate Residences EMD (HDFC) expires on 2026-05-15.",
      isRead: false,
    },
    {
      userId: admin!.id,
      notificationType: "low_stock",
      title: "Copper wire 4mm below minimum",
      message: "Citygate site shows 120m on hand vs 300m minimum.",
      isRead: false,
    },
    {
      userId: admin!.id,
      notificationType: "invoice_overdue",
      title: "Invoice INV-2026-0031 is overdue",
      message: "Citygate Developers, INR 94,00,000.",
      isRead: true,
    },
    {
      userId: admin!.id,
      notificationType: "vendor_invoice_discrepancy",
      title: "Vendor invoice discrepancy flagged",
      message: "Polaris Electricals invoice exceeds PO by INR 30,000.",
      isRead: false,
    },
  ]);

  await db.insert(auditLogsTable).values([
    {
      userId: admin!.id,
      activity: "User signed in",
      resourceType: "session",
      ipAddress: "10.20.4.18",
      status: "success",
    },
    {
      userId: pm!.id,
      activity: "Created lead LD-" + ymd + "-0001",
      resourceType: "lead",
      resourceId: leads[0]!.id,
      ipAddress: "10.20.4.42",
      status: "success",
    },
    {
      userId: pm!.id,
      activity: "Submitted BOQ v1 for Lumina Hospitality Group",
      resourceType: "boq",
      resourceId: boq1!.id,
      ipAddress: "10.20.4.42",
      status: "success",
    },
    {
      userId: proc!.id,
      activity: "Selected quotation from Ridgeline Interiors",
      resourceType: "quotation",
      ipAddress: "10.20.4.55",
      status: "success",
    },
    {
      userId: acct!.id,
      activity: "Recorded BG performance INR 31,00,000",
      resourceType: "financial_instrument",
      ipAddress: "10.20.4.71",
      status: "success",
    },
    {
      userId: viewer!.id,
      activity: "Attempted to delete project (denied)",
      resourceType: "project",
      resourceId: projects[0]!.id,
      ipAddress: "10.20.4.99",
      status: "denied",
    },
  ]);

  // ═══════════════════════════════════════════════════════════════════════════
  // PROCUREMENT MODULE SEED DATA
  // ═══════════════════════════════════════════════════════════════════════════

  logger.info("Seeding procurement module data...");

  // Material Requests with different statuses across workflow stages
  await db.insert(procurementMaterialRequestsTable).values([
    {
      requestNumber: "MR-2026-0001",
      projectId: projects[0]!.id,
      title: "Premium vinyl flooring for Floor 5",
      description: "High-grade vinyl flooring with 10-year warranty for executive floors",
      category: "Interior Materials",
      priority: "high",
      requiredDate: "2026-05-15",
      status: "approved",
      requestedById: eng!.id,
      approvedById: pm!.id,
      approvalDate: new Date("2026-04-10T09:00:00Z"),
      estimatedCost: "850000",
      notes: "Client prefers German brand if available",
    },
    {
      requestNumber: "MR-2026-0002",
      projectId: projects[0]!.id,
      title: "Suspended ceiling tiles for Floors 4-6",
      description: "Acoustic ceiling tiles with fire rating",
      category: "Civil Materials",
      priority: "medium",
      requiredDate: "2026-05-20",
      status: "pending_approval",
      requestedById: eng!.id,
      estimatedCost: "420000",
      notes: "Requires manager approval",
    },
    {
      requestNumber: "MR-2026-0003",
      projectId: projects[1]!.id,
      title: "Copper wiring 4mm for riser shaft",
      description: "High-conductivity copper wiring for electrical risers",
      category: "Electrical",
      priority: "urgent",
      requiredDate: "2026-04-28",
      status: "rejected",
      requestedById: eng!.id,
      rejectedById: pm!.id,
      rejectionDate: new Date("2026-04-18T14:30:00Z"),
      rejectionReason: "Budget constraints - Please revise specification to standard grade",
      estimatedCost: "680000",
    },
    {
      requestNumber: "MR-2026-0004",
      projectId: projects[1]!.id,
      title: "HVAC ducting materials",
      description: "Galvanized steel ducting for floors 15-18",
      category: "MEP",
      priority: "high",
      requiredDate: "2026-05-10",
      status: "rfq_generated",
      requestedById: eng!.id,
      approvedById: pm!.id,
      approvalDate: new Date("2026-04-15T11:00:00Z"),
      estimatedCost: "1250000",
    },
    {
      requestNumber: "MR-2026-0005",
      projectId: projects[0]!.id,
      title: "LED lighting fixtures - conference rooms",
      description: "Energy-efficient LED panels with smart controls",
      category: "Electrical",
      priority: "medium",
      requiredDate: "2026-05-25",
      status: "draft",
      requestedById: eng!.id,
      estimatedCost: "320000",
    },
  ]);

  const procMRs = await db.select().from(procurementMaterialRequestsTable).orderBy(procurementMaterialRequestsTable.id);

  // Material Request Items
  await db.insert(procurementMaterialRequestItemsTable).values([
    // MR-2026-0001 items (vinyl flooring)
    {
      materialRequestId: procMRs[0]!.id,
      itemName: "Premium vinyl flooring tiles",
      description: "German brand, 12mm thickness",
      specification: "Fire rating B1, wear layer 0.7mm, dimensions 600x600mm",
      quantity: "12000",
      unit: "sqft",
      estimatedUnitPrice: "68",
      estimatedTotal: "816000",
      sortOrder: 0,
    },
    {
      materialRequestId: procMRs[0]!.id,
      itemName: "Vinyl flooring adhesive",
      description: "Acrylic-based adhesive",
      specification: "Coverage 250 sqft/gallon",
      quantity: "50",
      unit: "gallon",
      estimatedUnitPrice: "680",
      estimatedTotal: "34000",
      sortOrder: 1,
    },
    // MR-2026-0002 items (ceiling tiles)
    {
      materialRequestId: procMRs[1]!.id,
      itemName: "Acoustic ceiling tiles 600x600",
      description: "Fire-rated mineral fiber tiles",
      specification: "NRC 0.70, CAC 35, fire rating A",
      quantity: "8500",
      unit: "sqft",
      estimatedUnitPrice: "45",
      estimatedTotal: "382500",
      sortOrder: 0,
    },
    {
      materialRequestId: procMRs[1]!.id,
      itemName: "T-grid suspension system",
      description: "Galvanized steel grid",
      specification: "24mm width, load capacity 3kg/sqft",
      quantity: "8500",
      unit: "sqft",
      estimatedUnitPrice: "22",
      estimatedTotal: "187000",
      sortOrder: 1,
    },
    // MR-2026-0003 items (copper wiring)
    {
      materialRequestId: procMRs[2]!.id,
      itemName: "Copper wiring 4mm single core",
      description: "High-conductivity copper",
      specification: "IS 694:2010, 99.9% pure copper, PVC insulated",
      quantity: "4500",
      unit: "m",
      estimatedUnitPrice: "148",
      estimatedTotal: "666000",
      sortOrder: 0,
    },
    // MR-2026-0004 items (HVAC ducting)
    {
      materialRequestId: procMRs[3]!.id,
      itemName: "Galvanized steel ducting 600x400mm",
      description: "Rectangular duct sections",
      specification: "24 gauge, GI coated, flanged connections",
      quantity: "250",
      unit: "m",
      estimatedUnitPrice: "2400",
      estimatedTotal: "600000",
      sortOrder: 0,
    },
    {
      materialRequestId: procMRs[3]!.id,
      itemName: "Flexible ducting insulation",
      description: "Fiberglass insulation wrap",
      specification: "50mm thickness, R-value 3.5",
      quantity: "280",
      unit: "m",
      estimatedUnitPrice: "420",
      estimatedTotal: "117600",
      sortOrder: 1,
    },
    {
      materialRequestId: procMRs[3]!.id,
      itemName: "Duct fittings and dampers",
      description: "Elbows, reducers, volume dampers",
      specification: "Complete fitting set for 250m run",
      quantity: "1",
      unit: "lot",
      estimatedUnitPrice: "185000",
      estimatedTotal: "185000",
      sortOrder: 2,
    },
  ]);

  // RFQs - Request for Quotations
  await db.insert(procurementRfqsTable).values([
    {
      rfqNumber: "RFQ-2026-0001",
      materialRequestId: procMRs[0]!.id,
      projectId: projects[0]!.id,
      title: "Premium vinyl flooring for Floor 5 - 12,000 sqft",
      description: "Seeking quotations for high-grade vinyl flooring with 10-year warranty. Delivery to Hinjewadi site.",
      status: "quotes_received",
      issueDate: "2026-04-11",
      dueDate: "2026-04-18",
      sentToVendorCount: 3,
      quotesReceivedCount: 3,
      createdById: proc!.id,
      notes: "Prefer German brands, must include installation",
    },
    {
      rfqNumber: "RFQ-2026-0002",
      materialRequestId: procMRs[3]!.id,
      projectId: projects[1]!.id,
      title: "HVAC ducting materials - 250m",
      description: "Galvanized steel ducting with insulation for floors 15-18",
      status: "receiving_quotes",
      issueDate: "2026-04-16",
      dueDate: "2026-04-23",
      sentToVendorCount: 4,
      quotesReceivedCount: 2,
      createdById: proc!.id,
      notes: "Material certification required",
    },
  ]);

  const procRFQs = await db.select().from(procurementRfqsTable).orderBy(procurementRfqsTable.id);

  // RFQ Items
  await db.insert(procurementRfqItemsTable).values([
    // RFQ-2026-0001 items
    {
      rfqId: procRFQs[0]!.id,
      itemName: "Premium vinyl flooring tiles",
      description: "German brand, 12mm thickness",
      specification: "Fire rating B1, wear layer 0.7mm, dimensions 600x600mm",
      quantity: "12000",
      unit: "sqft",
      sortOrder: 0,
    },
    {
      rfqId: procRFQs[0]!.id,
      itemName: "Vinyl flooring adhesive",
      description: "Acrylic-based adhesive",
      specification: "Coverage 250 sqft/gallon",
      quantity: "50",
      unit: "gallon",
      sortOrder: 1,
    },
    // RFQ-2026-0002 items
    {
      rfqId: procRFQs[1]!.id,
      itemName: "Galvanized steel ducting 600x400mm",
      description: "Rectangular duct sections",
      specification: "24 gauge, GI coated, flanged connections",
      quantity: "250",
      unit: "m",
      sortOrder: 0,
    },
    {
      rfqId: procRFQs[1]!.id,
      itemName: "Flexible ducting insulation",
      description: "Fiberglass insulation wrap",
      specification: "50mm thickness, R-value 3.5",
      quantity: "280",
      unit: "m",
      sortOrder: 1,
    },
    {
      rfqId: procRFQs[1]!.id,
      itemName: "Duct fittings and dampers",
      description: "Elbows, reducers, volume dampers",
      specification: "Complete fitting set for 250m run",
      quantity: "1",
      unit: "lot",
      sortOrder: 2,
    },
  ]);

  // RFQ Vendors - Track which vendors received RFQs
  await db.insert(procurementRfqVendorsTable).values([
    // RFQ-2026-0001 vendors
    {
      rfqId: procRFQs[0]!.id,
      vendorId: vendors[3]!.id, // Ridgeline Interiors
      sentDate: new Date("2026-04-11T10:00:00Z"),
      respondedDate: new Date("2026-04-15T14:30:00Z"),
      status: "responded",
    },
    {
      rfqId: procRFQs[0]!.id,
      vendorId: vendors[0]!.id, // Aarav Steel & Cement
      sentDate: new Date("2026-04-11T10:00:00Z"),
      respondedDate: new Date("2026-04-16T09:00:00Z"),
      status: "responded",
    },
    {
      rfqId: procRFQs[0]!.id,
      vendorId: vendors[1]!.id, // Polaris Electricals
      sentDate: new Date("2026-04-11T10:00:00Z"),
      respondedDate: new Date("2026-04-14T16:00:00Z"),
      status: "responded",
    },
    // RFQ-2026-0002 vendors
    {
      rfqId: procRFQs[1]!.id,
      vendorId: vendors[2]!.id, // Helios HVAC Systems
      sentDate: new Date("2026-04-16T11:00:00Z"),
      respondedDate: new Date("2026-04-19T10:00:00Z"),
      status: "responded",
    },
    {
      rfqId: procRFQs[1]!.id,
      vendorId: vendors[0]!.id, // Aarav Steel & Cement
      sentDate: new Date("2026-04-16T11:00:00Z"),
      respondedDate: new Date("2026-04-20T15:00:00Z"),
      status: "responded",
    },
    {
      rfqId: procRFQs[1]!.id,
      vendorId: vendors[1]!.id, // Polaris Electricals
      sentDate: new Date("2026-04-16T11:00:00Z"),
      status: "sent",
    },
    {
      rfqId: procRFQs[1]!.id,
      vendorId: vendors[3]!.id, // Ridgeline Interiors
      sentDate: new Date("2026-04-16T11:00:00Z"),
      status: "declined",
    },
  ]);

  // Get RFQ items for quote items
  const procRFQItems = await db.select().from(procurementRfqItemsTable).orderBy(procurementRfqItemsTable.id);

  // Vendor Quotes
  await db.insert(procurementVendorQuotesTable).values([
    // Quotes for RFQ-2026-0001 (vinyl flooring)
    {
      quoteNumber: "QT-RID-2026-0012",
      rfqId: procRFQs[0]!.id,
      vendorId: vendors[3]!.id, // Ridgeline Interiors
      quotedDate: "2026-04-15",
      validUntil: "2026-05-15",
      deliveryDays: 18,
      deliveryTerms: "FOB site, delivery included",
      paymentTerms: "30% advance, 70% on delivery",
      subtotal: "798000",
      taxPercent: "18",
      taxAmount: "143640",
      shippingCost: "0",
      totalAmount: "941640",
      isSelected: true,
      selectionReason: "Best overall value with warranty and delivery terms",
      selectedById: proc!.id,
      selectedDate: new Date("2026-04-18T10:00:00Z"),
      status: "selected",
      notes: "10-year warranty included, German brand Tarkett",
    },
    {
      quoteNumber: "QT-AAR-2026-0032",
      rfqId: procRFQs[0]!.id,
      vendorId: vendors[0]!.id, // Aarav Steel & Cement
      quotedDate: "2026-04-16",
      validUntil: "2026-05-10",
      deliveryDays: 14,
      deliveryTerms: "Ex-warehouse, transport extra",
      paymentTerms: "50% advance, 50% on delivery",
      subtotal: "842000",
      taxPercent: "18",
      taxAmount: "151560",
      shippingCost: "25000",
      totalAmount: "1018560",
      isSelected: false,
      status: "rejected",
      notes: "Higher price, no installation service",
    },
    {
      quoteNumber: "QT-POL-2026-0048",
      rfqId: procRFQs[0]!.id,
      vendorId: vendors[1]!.id, // Polaris Electricals
      quotedDate: "2026-04-14",
      validUntil: "2026-05-05",
      deliveryDays: 10,
      deliveryTerms: "Delivered to site",
      paymentTerms: "25% advance, balance on delivery",
      subtotal: "885000",
      taxPercent: "18",
      taxAmount: "159300",
      shippingCost: "0",
      totalAmount: "1044300",
      isSelected: false,
      status: "rejected",
      notes: "Fastest delivery but highest price, Chinese brand",
    },
    // Quotes for RFQ-2026-0002 (HVAC ducting)
    {
      quoteNumber: "QT-HEL-2026-0021",
      rfqId: procRFQs[1]!.id,
      vendorId: vendors[2]!.id, // Helios HVAC Systems
      quotedDate: "2026-04-19",
      validUntil: "2026-05-19",
      deliveryDays: 21,
      deliveryTerms: "Delivered and unloaded at site",
      paymentTerms: "20% advance, 80% within 30 days of delivery",
      subtotal: "1180000",
      taxPercent: "18",
      taxAmount: "212400",
      shippingCost: "0",
      totalAmount: "1392400",
      isSelected: false,
      status: "under_review",
      notes: "Premium quality, comprehensive certification",
    },
    {
      quoteNumber: "QT-AAR-2026-0033",
      rfqId: procRFQs[1]!.id,
      vendorId: vendors[0]!.id, // Aarav Steel & Cement
      quotedDate: "2026-04-20",
      validUntil: "2026-05-15",
      deliveryDays: 14,
      deliveryTerms: "Ex-warehouse Pune",
      paymentTerms: "40% advance, 60% on delivery",
      subtotal: "1085000",
      taxPercent: "18",
      taxAmount: "195300",
      shippingCost: "32000",
      totalAmount: "1312300",
      isSelected: false,
      status: "under_review",
      notes: "Lower price but need to arrange transport",
    },
  ]);

  const procQuotes = await db.select().from(procurementVendorQuotesTable).orderBy(procurementVendorQuotesTable.id);

  // Vendor Quote Items
  await db.insert(procurementVendorQuoteItemsTable).values([
    // Quote 1 items (Ridgeline - selected)
    {
      quoteId: procQuotes[0]!.id,
      rfqItemId: procRFQItems[0]!.id,
      itemName: "Premium vinyl flooring tiles - Tarkett German",
      quantity: "12000",
      unit: "sqft",
      unitPrice: "64",
      totalPrice: "768000",
      remarks: "10-year warranty, installation included",
      sortOrder: 0,
    },
    {
      quoteId: procQuotes[0]!.id,
      rfqItemId: procRFQItems[1]!.id,
      itemName: "Vinyl flooring adhesive - Bostik",
      quantity: "50",
      unit: "gallon",
      unitPrice: "600",
      totalPrice: "30000",
      remarks: "Compatible with Tarkett flooring",
      sortOrder: 1,
    },
    // Quote 2 items (Aarav)
    {
      quoteId: procQuotes[1]!.id,
      rfqItemId: procRFQItems[0]!.id,
      itemName: "Premium vinyl flooring tiles - Armstrong",
      quantity: "12000",
      unit: "sqft",
      unitPrice: "68",
      totalPrice: "816000",
      remarks: "Material only, installation extra",
      sortOrder: 0,
    },
    {
      quoteId: procQuotes[1]!.id,
      rfqItemId: procRFQItems[1]!.id,
      itemName: "Vinyl flooring adhesive",
      quantity: "50",
      unit: "gallon",
      unitPrice: "520",
      totalPrice: "26000",
      sortOrder: 1,
    },
    // Quote 3 items (Polaris)
    {
      quoteId: procQuotes[2]!.id,
      rfqItemId: procRFQItems[0]!.id,
      itemName: "Premium vinyl flooring tiles - Gerflor",
      quantity: "12000",
      unit: "sqft",
      unitPrice: "72",
      totalPrice: "864000",
      remarks: "Express delivery, installation included",
      sortOrder: 0,
    },
    {
      quoteId: procQuotes[2]!.id,
      rfqItemId: procRFQItems[1]!.id,
      itemName: "Vinyl adhesive premium grade",
      quantity: "50",
      unit: "gallon",
      unitPrice: "420",
      totalPrice: "21000",
      sortOrder: 1,
    },
  ]);

  // Update RFQ status and selected quote
  await db.update(procurementRfqsTable)
    .set({ status: "completed", selectedQuoteId: procQuotes[0]!.id, closedDate: "2026-04-18" })
    .where(eqFilter(procurementRfqsTable.id, procRFQs[0]!.id));

  // Purchase Orders
  await db.insert(procurementPurchaseOrdersTable).values([
    {
      poNumber: "PO-2026-0001",
      rfqId: procRFQs[0]!.id,
      quoteId: procQuotes[0]!.id,
      materialRequestId: procMRs[0]!.id,
      projectId: projects[0]!.id,
      vendorId: vendors[3]!.id, // Ridgeline Interiors
      poDate: "2026-04-19",
      expectedDeliveryDate: "2026-05-07",
      subtotal: "798000",
      taxAmount: "143640",
      shippingCost: "0",
      totalAmount: "941640",
      deliveryTerms: "FOB site, delivery included",
      paymentTerms: "30% advance, 70% on delivery",
      status: "delivered",
      isAcknowledged: true,
      acknowledgmentDate: new Date("2026-04-20T09:30:00Z"),
      acknowledgmentNotes: "PO received and accepted. Delivery confirmed for May 7.",
      deliveryStatus: "delivered",
      createdById: proc!.id,
      approvedById: pm!.id,
      notes: "High priority - Floor 5 project",
    },
  ]);

  const procPOs = await db.select().from(procurementPurchaseOrdersTable).orderBy(procurementPurchaseOrdersTable.id);

  // Purchase Order Items
  await db.insert(procurementPurchaseOrderItemsTable).values([
    {
      poId: procPOs[0]!.id,
      itemName: "Premium vinyl flooring tiles - Tarkett German",
      description: "German brand, 12mm thickness",
      specification: "Fire rating B1, wear layer 0.7mm, dimensions 600x600mm",
      quantity: "12000",
      unit: "sqft",
      unitPrice: "64",
      totalPrice: "768000",
      receivedQuantity: "12000",
      acceptedQuantity: "11850",
      rejectedQuantity: "150",
      sortOrder: 0,
    },
    {
      poId: procPOs[0]!.id,
      itemName: "Vinyl flooring adhesive - Bostik",
      description: "Acrylic-based adhesive",
      specification: "Coverage 250 sqft/gallon",
      quantity: "50",
      unit: "gallon",
      unitPrice: "600",
      totalPrice: "30000",
      receivedQuantity: "50",
      acceptedQuantity: "50",
      rejectedQuantity: "0",
      sortOrder: 1,
    },
  ]);

  const procPOItems = await db.select().from(procurementPurchaseOrderItemsTable).orderBy(procurementPurchaseOrderItemsTable.id);

  // Material Receipts
  await db.insert(procurementMaterialReceiptsTable).values([
    {
      receiptNumber: "GRN-2026-0001",
      poId: procPOs[0]!.id,
      projectId: projects[0]!.id,
      vendorId: vendors[3]!.id,
      receivedDate: new Date("2026-05-07T10:15:00Z"),
      receivedById: eng!.id,
      deliveryNoteNumber: "RID-DN-2026-0428",
      vehicleNumber: "MH-12-AB-1234",
      driverName: "Ramesh Kumar",
      driverContact: "+91 98765 12345",
      remarks: "Material delivered in good condition. Some cartons had minor damage.",
      attachmentUrls: ["uploads/grn-2026-0001-photo1.jpg", "uploads/grn-2026-0001-photo2.jpg"],
    },
  ]);

  const procReceipts = await db.select().from(procurementMaterialReceiptsTable).orderBy(procurementMaterialReceiptsTable.id);

  // Material Receipt Items
  await db.insert(procurementMaterialReceiptItemsTable).values([
    {
      receiptId: procReceipts[0]!.id,
      poItemId: procPOItems[0]!.id,
      receivedQuantity: "12000",
      remarks: "3 cartons with minor edge damage - sent for inspection",
    },
    {
      receiptId: procReceipts[0]!.id,
      poItemId: procPOItems[1]!.id,
      receivedQuantity: "50",
      remarks: "All gallons received in good condition",
    },
  ]);

  const procReceiptItems = await db.select().from(procurementMaterialReceiptItemsTable).orderBy(procurementMaterialReceiptItemsTable.id);

  // Quality Inspections
  await db.insert(procurementQualityInspectionsTable).values([
    {
      inspectionNumber: "QI-2026-0001",
      receiptId: procReceipts[0]!.id,
      poId: procPOs[0]!.id,
      projectId: projects[0]!.id,
      inspectionDate: new Date("2026-05-07T14:00:00Z"),
      inspectedById: eng!.id,
      inspectorName: "Priya Iyer",
      result: "partial_approved",
      findings: "Overall material quality meets specifications. Minor defects found in 150 sqft tiles from damaged cartons.",
      defectsFound: "Surface scratches and edge chipping on tiles from 3 damaged cartons. Approximately 150 sqft affected.",
      recommendations: "Accept 11,850 sqft. Reject 150 sqft. Request replacement from vendor.",
      photoUrls: ["uploads/qi-2026-0001-defect1.jpg", "uploads/qi-2026-0001-defect2.jpg"],
      approvedById: pm!.id,
      approvalDate: new Date("2026-05-07T16:00:00Z"),
    },
  ]);

  const procInspections = await db.select().from(procurementQualityInspectionsTable).orderBy(procurementQualityInspectionsTable.id);

  // Quality Inspection Items
  await db.insert(procurementQualityInspectionItemsTable).values([
    {
      inspectionId: procInspections[0]!.id,
      receiptItemId: procReceiptItems[0]!.id,
      poItemId: procPOItems[0]!.id,
      itemName: "Premium vinyl flooring tiles - Tarkett German",
      receivedQuantity: "12000",
      status: "partial_approved",
      acceptedQuantity: "11850",
      rejectedQuantity: "150",
      qualityGrade: "A",
      defectDescription: "Surface scratches and edge damage on 150 sqft from damaged cartons during transport",
      remarks: "Approved 98.75% of received quantity. Vendor notified for replacement of rejected quantity.",
      sortOrder: 0,
    },
    {
      inspectionId: procInspections[0]!.id,
      receiptItemId: procReceiptItems[1]!.id,
      poItemId: procPOItems[1]!.id,
      itemName: "Vinyl flooring adhesive - Bostik",
      receivedQuantity: "50",
      status: "approved",
      acceptedQuantity: "50",
      rejectedQuantity: "0",
      qualityGrade: "A",
      remarks: "All adhesive gallons passed inspection. Seals intact, no leakage.",
      sortOrder: 1,
    },
  ]);

  // Update PO status after inspection
  await db.update(procurementPurchaseOrdersTable)
    .set({ status: "inspected", actualDeliveryDate: "2026-05-07" })
    .where(eqFilter(procurementPurchaseOrdersTable.id, procPOs[0]!.id));

  // Inventory Items
  await db.insert(procurementInventoryItemsTable).values([
    {
      itemCode: "INV-VIN-001",
      projectId: projects[0]!.id,
      itemName: "Premium vinyl flooring tiles - Tarkett",
      description: "German brand, 12mm thickness, fire rated",
      category: "Interior Materials",
      unit: "sqft",
      totalQuantity: "11850",
      availableQuantity: "11850",
      allocatedQuantity: "0",
      consumedQuantity: "0",
      minimumStock: "1000",
      reorderLevel: "2000",
      averageCost: "64",
      lastPurchasePrice: "64",
      lastPurchaseDate: "2026-05-07",
      warehouseLocation: "Sentinel Site - Material Store A, Rack 12",
      status: "active",
    },
    {
      itemCode: "INV-ADH-001",
      projectId: projects[0]!.id,
      itemName: "Vinyl flooring adhesive - Bostik",
      description: "Acrylic-based adhesive for vinyl flooring",
      category: "Consumables",
      unit: "gallon",
      totalQuantity: "50",
      availableQuantity: "50",
      allocatedQuantity: "0",
      consumedQuantity: "0",
      minimumStock: "10",
      reorderLevel: "15",
      averageCost: "600",
      lastPurchasePrice: "600",
      lastPurchaseDate: "2026-05-07",
      warehouseLocation: "Sentinel Site - Material Store A, Shelf 5",
      status: "active",
    },
    {
      itemCode: "INV-CEM-001",
      projectId: projects[0]!.id,
      itemName: "Cement - OPC 53 grade",
      description: "Ordinary Portland Cement Grade 53",
      category: "Civil Materials",
      unit: "bag",
      totalQuantity: "320",
      availableQuantity: "140",
      allocatedQuantity: "0",
      consumedQuantity: "1240",
      minimumStock: "200",
      reorderLevel: "300",
      averageCost: "385",
      lastPurchasePrice: "390",
      lastPurchaseDate: "2026-04-05",
      warehouseLocation: "Sentinel Site - Open Storage Yard B",
      status: "low_stock",
    },
    {
      itemCode: "INV-STEEL-001",
      projectId: projects[0]!.id,
      itemName: "TMT steel bars 12mm",
      description: "Thermo-mechanically treated steel reinforcement bars",
      category: "Civil Materials",
      unit: "kg",
      totalQuantity: "1850",
      availableQuantity: "950",
      allocatedQuantity: "0",
      consumedQuantity: "8200",
      minimumStock: "2000",
      reorderLevel: "3000",
      averageCost: "62",
      lastPurchasePrice: "64",
      lastPurchaseDate: "2026-03-28",
      warehouseLocation: "Sentinel Site - Open Storage Yard A",
      status: "low_stock",
    },
    {
      itemCode: "INV-DUCT-001",
      projectId: projects[1]!.id,
      itemName: "PVC conduit 25mm",
      description: "PVC electrical conduit pipes",
      category: "Electrical",
      unit: "m",
      totalQuantity: "640",
      availableQuantity: "640",
      allocatedQuantity: "0",
      consumedQuantity: "5400",
      minimumStock: "500",
      reorderLevel: "800",
      averageCost: "42",
      lastPurchasePrice: "44",
      lastPurchaseDate: "2026-03-15",
      warehouseLocation: "Citygate Site - Store Room 2",
      status: "active",
    },
  ]);

  const procInventoryItems = await db.select().from(procurementInventoryItemsTable).orderBy(procurementInventoryItemsTable.id);

  // Inventory Transactions
  await db.insert(procurementInventoryTransactionsTable).values([
    {
      transactionNumber: "TXN-2026-0001",
      inventoryItemId: procInventoryItems[0]!.id,
      projectId: projects[0]!.id,
      transactionType: "goods_receipt",
      transactionDate: new Date("2026-05-07T16:30:00Z"),
      quantity: "11850",
      unitPrice: "64",
      totalValue: "758400",
      balanceQuantity: "11850",
      poId: procPOs[0]!.id,
      inspectionId: procInspections[0]!.id,
      remarks: "Goods received and quality inspected. 150 sqft rejected.",
      createdById: proc!.id,
    },
    {
      transactionNumber: "TXN-2026-0002",
      inventoryItemId: procInventoryItems[1]!.id,
      projectId: projects[0]!.id,
      transactionType: "goods_receipt",
      transactionDate: new Date("2026-05-07T16:30:00Z"),
      quantity: "50",
      unitPrice: "600",
      totalValue: "30000",
      balanceQuantity: "50",
      poId: procPOs[0]!.id,
      inspectionId: procInspections[0]!.id,
      remarks: "Goods received and quality approved",
      createdById: proc!.id,
    },
    {
      transactionNumber: "TXN-2026-0003",
      inventoryItemId: procInventoryItems[2]!.id,
      projectId: projects[0]!.id,
      transactionType: "issue_to_project",
      transactionDate: new Date("2026-04-15T08:00:00Z"),
      quantity: "180",
      unitPrice: "385",
      totalValue: "69300",
      balanceQuantity: "140",
      taskId: 1,
      remarks: "Issued to Floor 4 ceiling work",
      createdById: eng!.id,
    },
  ]);

  // Vendor Follow-ups
  await db.insert(procurementVendorFollowUpsTable).values([
    {
      poId: procPOs[0]!.id,
      vendorId: vendors[3]!.id,
      followUpDate: new Date("2026-04-25T10:00:00Z"),
      followUpType: "email",
      followUpReason: "delivery_confirmation",
      message: "Please confirm delivery schedule for PO-2026-0001. Expected date is May 7, 2026.",
      response: "Delivery confirmed for May 7, 2026 between 10 AM - 12 PM.",
      responseDate: new Date("2026-04-25T14:30:00Z"),
      followUpById: proc!.id,
      status: "responded",
    },
    {
      poId: procPOs[0]!.id,
      vendorId: vendors[3]!.id,
      followUpDate: new Date("2026-05-08T09:00:00Z"),
      followUpType: "phone",
      followUpReason: "quality_issue",
      message: "150 sqft tiles rejected due to transport damage. Requesting replacement as per warranty terms.",
      response: "Replacement approved. Will dispatch by May 15, 2026.",
      responseDate: new Date("2026-05-08T11:00:00Z"),
      followUpById: proc!.id,
      status: "responded",
    },
  ]);

  // Procurement Notifications
  await db.insert(procurementNotificationsTable).values([
    {
      userId: eng!.id,
      notificationType: "material_request_approved",
      title: "Material Request MR-2026-0001 Approved",
      message: "Your material request for premium vinyl flooring has been approved by the manager.",
      resourceType: "material_request",
      resourceId: procMRs[0]!.id,
      isRead: true,
      readAt: new Date("2026-04-10T10:00:00Z"),
      priority: "normal",
    },
    {
      userId: eng!.id,
      notificationType: "material_request_rejected",
      title: "Material Request MR-2026-0003 Rejected",
      message: "Your material request for copper wiring has been rejected. Reason: Budget constraints - Please revise specification to standard grade",
      resourceType: "material_request",
      resourceId: procMRs[2]!.id,
      isRead: true,
      readAt: new Date("2026-04-18T15:00:00Z"),
      priority: "high",
    },
    {
      userId: proc!.id,
      notificationType: "rfq_created",
      title: "New RFQ RFQ-2026-0001 Created",
      message: "RFQ for premium vinyl flooring created from approved material request MR-2026-0001",
      resourceType: "rfq",
      resourceId: procRFQs[0]!.id,
      isRead: true,
      readAt: new Date("2026-04-11T10:30:00Z"),
      priority: "normal",
    },
    {
      userId: proc!.id,
      notificationType: "quote_received",
      title: "Quote Received for RFQ-2026-0001",
      message: "Ridgeline Interiors has submitted a quote: ₹9,41,640",
      resourceType: "vendor_quote",
      resourceId: procQuotes[0]!.id,
      isRead: true,
      readAt: new Date("2026-04-15T15:00:00Z"),
      priority: "normal",
    },
    {
      userId: eng!.id,
      notificationType: "po_issued",
      title: "Purchase Order PO-2026-0001 Issued",
      message: "PO issued to Ridgeline Interiors for vinyl flooring. Expected delivery: May 7, 2026",
      resourceType: "purchase_order",
      resourceId: procPOs[0]!.id,
      isRead: true,
      readAt: new Date("2026-04-19T12:00:00Z"),
      priority: "normal",
    },
    {
      userId: eng!.id,
      notificationType: "material_delivered",
      title: "Material Delivered - PO-2026-0001",
      message: "Vinyl flooring materials have been delivered to Sentinel site. Please conduct quality inspection.",
      resourceType: "material_receipt",
      resourceId: procReceipts[0]!.id,
      isRead: true,
      readAt: new Date("2026-05-07T10:30:00Z"),
      priority: "high",
    },
    {
      userId: proc!.id,
      notificationType: "inspection_completed",
      title: "Quality Inspection Completed - QI-2026-0001",
      message: "Quality inspection completed for vinyl flooring. Result: Partial Approved (11,850 sqft accepted, 150 sqft rejected)",
      resourceType: "quality_inspection",
      resourceId: procInspections[0]!.id,
      isRead: true,
      readAt: new Date("2026-05-07T16:30:00Z"),
      priority: "normal",
    },
    {
      userId: proc!.id,
      notificationType: "quality_rejected",
      title: "Partial Rejection - PO-2026-0001",
      message: "150 sqft tiles rejected due to transport damage. Follow-up required with vendor for replacement.",
      resourceType: "quality_inspection",
      resourceId: procInspections[0]!.id,
      isRead: false,
      priority: "high",
    },
    {
      userId: pm!.id,
      notificationType: "material_request_pending",
      title: "Material Request Pending Approval",
      message: "Material request MR-2026-0002 for suspended ceiling tiles is awaiting your approval.",
      resourceType: "material_request",
      resourceId: procMRs[1]!.id,
      isRead: false,
      priority: "normal",
    },
    {
      userId: proc!.id,
      notificationType: "low_stock_alert",
      title: "Low Stock Alert - Cement OPC 53",
      message: "Cement stock is below minimum level. Current: 140 bags, Minimum: 200 bags. Please initiate procurement.",
      resourceType: "inventory_item",
      resourceId: procInventoryItems[2]!.id,
      isRead: false,
      priority: "urgent",
    },
    {
      userId: proc!.id,
      notificationType: "low_stock_alert",
      title: "Low Stock Alert - TMT Steel Bars 12mm",
      message: "TMT steel bars stock is below reorder level. Current: 950 kg, Reorder Level: 3000 kg.",
      resourceType: "inventory_item",
      resourceId: procInventoryItems[3]!.id,
      isRead: false,
      priority: "high",
    },
  ]);

  logger.info("Procurement module seed data complete");
  logger.info("Seed complete");
}



