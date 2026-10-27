import { Router, type IRouter } from "express";
import { eq, sql, asc, desc, and } from "drizzle-orm";
import {
  db,
  leadsTable,
  leadActivitiesTable,
  siteVisitsTable,
  drawingsTable,
  boqsTable,
  boqItemsTable,
  negotiationsTable,
  usersTable,
  projectsTable,
  tasksTable,
  stakeholdersTable,
  budgetItemsTable,
  notificationsTable,
  auditLogsTable,
  contractsTable,
  billingMilestonesTable,
  financialAuditLogsTable,
  projectAssignmentsTable,
  contractBoqItemsTable,
} from "@workspace/db";
import { numKeys, num } from "../lib/transforms";
import { getCurrentUser } from "../lib/session";

const router: IRouter = Router();

const NUMERIC_LEAD = [
  "budgetEstimate",
  "advancePercent",
  "retentionPercent",
  "abgPercent",
  "abgAmount",
  "paymentTermsDays",
  "dlpMonths",
] as const;
const NUMERIC_BOQ = ["subtotal", "taxTotal", "marginTotal", "grandTotal"] as const;
const NUMERIC_BOQ_ITEM = [
  "quantity",
  "unitPrice",
  "taxPercent",
  "marginPercent",
  "totalPrice",
] as const;
const NUMERIC_NEG = ["revisedAmount", "discountPercent"] as const;

const formatLead = (l: Record<string, unknown>) => numKeys(l, [...NUMERIC_LEAD]);
const formatBoq = (b: Record<string, unknown>) => numKeys(b, [...NUMERIC_BOQ]);
const formatBoqItem = (i: Record<string, unknown>) =>
  numKeys(i, [...NUMERIC_BOQ_ITEM]);
const formatNeg = (n: Record<string, unknown>) => numKeys(n, [...NUMERIC_NEG]);

const genLeadNumber = async (): Promise<string> => {
  const today = new Date();
  const ymd = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;
  const [{ c }] = await db
    .select({ c: sql<number>`count(*)` })
    .from(leadsTable);
  const seq = String((c ?? 0) + 1).padStart(4, "0");
  return `LD-${ymd}-${seq}`;
};

const recomputeBoq = async (boqId: number) => {
  const items = await db
    .select()
    .from(boqItemsTable)
    .where(eq(boqItemsTable.boqId, boqId));
  let subtotal = 0;
  let taxTotal = 0;
  let marginTotal = 0;
  for (const i of items) {
    const q = num(i.quantity) ?? 0;
    const up = num(i.unitPrice) ?? 0;
    const tax = num(i.taxPercent) ?? 0;
    const margin = num(i.marginPercent) ?? 0;
    const base = q * up;
    const taxAmt = (base * tax) / 100;
    const marginAmt = (base * margin) / 100;
    subtotal += base;
    taxTotal += taxAmt;
    marginTotal += marginAmt;
  }
  const grandTotal = subtotal + taxTotal + marginTotal;
  await db
    .update(boqsTable)
    .set({
      subtotal: subtotal.toFixed(2),
      taxTotal: taxTotal.toFixed(2),
      marginTotal: marginTotal.toFixed(2),
      grandTotal: grandTotal.toFixed(2),
    })
    .where(eq(boqsTable.id, boqId));
};

router.get("/leads", async (req, res): Promise<void> => {
  const { status, stage, ownerId, search, startDate, endDate } = req.query as Record<string, string | undefined>;
  const conditions: any[] = [];

  if (status && status !== "all") {
    conditions.push(eq(leadsTable.status, status));
  }
  if (stage && stage !== "all") {
    if (stage === "finalization") {
      conditions.push(sql`(${leadsTable.stage} IN ('finalization', 'won') OR ${leadsTable.status} = 'won')`);
    } else {
      conditions.push(eq(leadsTable.stage, stage));
    }
  }
  if (ownerId && ownerId !== "all") {
    const parsedOwnerId = parseInt(ownerId, 10);
    if (!isNaN(parsedOwnerId)) {
      conditions.push(eq(leadsTable.ownerId, parsedOwnerId));
    }
  }
  if (search && search.trim()) {
    const s = `%${search.trim().toLowerCase()}%`;
    conditions.push(
      sql`(lower(${leadsTable.customerName}) LIKE ${s} OR lower(${leadsTable.leadNumber}) LIKE ${s} OR lower(coalesce(${leadsTable.company}, '')) LIKE ${s})`
    );
  }
  if (startDate) {
    conditions.push(sql`date(${leadsTable.createdAt}) >= ${startDate}`);
  }
  if (endDate) {
    conditions.push(sql`date(${leadsTable.createdAt}) <= ${endDate}`);
  }

  const query = db
    .select({
      l: leadsTable,
      ownerName: usersTable.name,
    })
    .from(leadsTable)
    .leftJoin(usersTable, eq(usersTable.id, leadsTable.ownerId));

  const rows = conditions.length > 0
    ? await query.where(and(...conditions)).orderBy(desc(leadsTable.createdAt))
    : await query.orderBy(desc(leadsTable.createdAt));

  res.json(rows.map((r) => ({ ...formatLead(r.l), ownerName: r.ownerName })));
});

router.get("/leads/export", async (req, res): Promise<void> => {
  const { format: exportFormat = "excel" } = req.query as Record<string, string | undefined>;
  const rows = await db
    .select({
      l: leadsTable,
      ownerName: usersTable.name,
    })
    .from(leadsTable)
    .leftJoin(usersTable, eq(usersTable.id, leadsTable.ownerId))
    .orderBy(desc(leadsTable.createdAt));

  const leads = rows.map((r) => ({ ...formatLead(r.l), ownerName: r.ownerName }));

  if (exportFormat === "csv") {
    const headers = [
      "Lead Number",
      "Customer Name",
      "Company",
      "Phone",
      "Email",
      "Project Type",
      "Location",
      "Budget Estimate",
      "Stage",
      "Status",
      "Priority",
      "Owner",
      "Expected Closure Date",
      "Created Date",
    ];
    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const csvRows = [
      headers.join(","),
      ...leads.map((l) =>
        [
          escapeCsv(l.leadNumber),
          escapeCsv(l.customerName),
          escapeCsv(l.company),
          escapeCsv(l.contactPhone),
          escapeCsv(l.contactEmail),
          escapeCsv(l.projectType),
          escapeCsv(l.location),
          escapeCsv(l.budgetEstimate ?? 0),
          escapeCsv(l.stage),
          escapeCsv(l.status),
          escapeCsv(l.priority),
          escapeCsv(l.ownerName),
          escapeCsv(l.expectedClosureDate),
          escapeCsv(l.createdAt),
        ].join(",")
      ),
    ];

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="leads_export_${new Date().toISOString().slice(0, 10)}.csv"`
    );
    res.send("\uFEFF" + csvRows.join("\r\n"));
    return;
  }

  // XML Spreadsheet 2003 for native Excel (.xls)
  const escapeXml = (unsafe: any) => {
    if (unsafe === null || unsafe === undefined) return "";
    return String(unsafe)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  };

  const xmlRows = leads
    .map(
      (l) => `   <Row>
    <Cell ss:StyleID="Text"><Data ss:Type="String">${escapeXml(l.leadNumber)}</Data></Cell>
    <Cell ss:StyleID="Text"><Data ss:Type="String">${escapeXml(l.customerName)}</Data></Cell>
    <Cell ss:StyleID="Text"><Data ss:Type="String">${escapeXml(l.company || "-")}</Data></Cell>
    <Cell ss:StyleID="Text"><Data ss:Type="String">${escapeXml(l.contactPhone || "-")}</Data></Cell>
    <Cell ss:StyleID="Text"><Data ss:Type="String">${escapeXml(l.contactEmail || "-")}</Data></Cell>
    <Cell ss:StyleID="Text"><Data ss:Type="String">${escapeXml(l.projectType || "-")}</Data></Cell>
    <Cell ss:StyleID="Text"><Data ss:Type="String">${escapeXml(l.location || "-")}</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${l.budgetEstimate ?? 0}</Data></Cell>
    <Cell ss:StyleID="Center"><Data ss:Type="String">${escapeXml(l.stage)}</Data></Cell>
    <Cell ss:StyleID="Center"><Data ss:Type="String">${escapeXml(l.status)}</Data></Cell>
    <Cell ss:StyleID="Center"><Data ss:Type="String">${escapeXml(l.priority)}</Data></Cell>
    <Cell ss:StyleID="Text"><Data ss:Type="String">${escapeXml(l.ownerName || "-")}</Data></Cell>
    <Cell ss:StyleID="Center"><Data ss:Type="String">${escapeXml(l.expectedClosureDate || "-")}</Data></Cell>
    <Cell ss:StyleID="Center"><Data ss:Type="String">${escapeXml(new Date(l.createdAt).toLocaleDateString())}</Data></Cell>
   </Row>`
    )
    .join("\n");

  const xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Author>Kanak Turnkey</Author>
  <Created>${new Date().toISOString()}</Created>
 </DocumentProperties>
 <Styles>
  <Style ss:ID="Header">
   <Font ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#0F172A" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="Text">
   <Alignment ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="Center">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="Currency">
   <NumberFormat ss:Format="₹#,##0"/>
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Leads Pipeline">
  <Table>
   <Column ss:Width="120"/>
   <Column ss:Width="160"/>
   <Column ss:Width="160"/>
   <Column ss:Width="120"/>
   <Column ss:Width="160"/>
   <Column ss:Width="140"/>
   <Column ss:Width="130"/>
   <Column ss:Width="120"/>
   <Column ss:Width="110"/>
   <Column ss:Width="100"/>
   <Column ss:Width="90"/>
   <Column ss:Width="130"/>
   <Column ss:Width="110"/>
   <Column ss:Width="100"/>
   <Row ss:StyleID="Header">
    <Cell><Data ss:Type="String">Lead Number</Data></Cell>
    <Cell><Data ss:Type="String">Customer Name</Data></Cell>
    <Cell><Data ss:Type="String">Company</Data></Cell>
    <Cell><Data ss:Type="String">Phone</Data></Cell>
    <Cell><Data ss:Type="String">Email</Data></Cell>
    <Cell><Data ss:Type="String">Project Type</Data></Cell>
    <Cell><Data ss:Type="String">Location</Data></Cell>
    <Cell><Data ss:Type="String">Budget Estimate (INR)</Data></Cell>
    <Cell><Data ss:Type="String">Stage</Data></Cell>
    <Cell><Data ss:Type="String">Status</Data></Cell>
    <Cell><Data ss:Type="String">Priority</Data></Cell>
    <Cell><Data ss:Type="String">Owner</Data></Cell>
    <Cell><Data ss:Type="String">Expected Closure</Data></Cell>
    <Cell><Data ss:Type="String">Created Date</Data></Cell>
   </Row>
${xmlRows}
  </Table>
 </Worksheet>
</Workbook>`;

  res.setHeader(
    "Content-Type",
    "application/vnd.ms-excel; charset=utf-8"
  );
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="leads_export_${new Date().toISOString().slice(0, 10)}.xls"`
  );
  res.send(xml);
});

router.get("/leads/summary", async (_req, res): Promise<void> => {
  const [totals] = await db
    .select({
      total: sql<number>`count(*)`,
      qualified: sql<number>`sum(case when status = 'qualified' then 1 else 0 end)`,
      won: sql<number>`sum(case when status = 'won' then 1 else 0 end)`,
      pipeline: sql<string>`coalesce(sum(case when status not in ('lost','won') then budget_estimate else 0 end), 0)`,
    })
    .from(leadsTable);
  const byStage = await db
    .select({
      stage: leadsTable.stage,
      count: sql<number>`count(*)`,
      value: sql<string>`coalesce(sum(budget_estimate), 0)`,
    })
    .from(leadsTable)
    .groupBy(leadsTable.stage);
  const byStatus = await db
    .select({
      status: leadsTable.status,
      count: sql<number>`count(*)`,
    })
    .from(leadsTable)
    .groupBy(leadsTable.status);
  res.json({
    totalLeads: totals?.total ?? 0,
    pipelineValue: num(totals?.pipeline) ?? 0,
    conversionRate:
      totals && totals.total > 0 ? (totals.won / totals.total) * 100 : 0,
    qualifiedLeads: totals?.qualified ?? 0,
    byStage: byStage.map((s) => ({
      stage: s.stage,
      count: s.count,
      value: num(s.value) ?? 0,
    })),
    byStatus,
  });
});

router.get("/leads/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  const [row] = await db
    .select({ l: leadsTable, ownerName: usersTable.name })
    .from(leadsTable)
    .leftJoin(usersTable, eq(usersTable.id, leadsTable.ownerId))
    .where(eq(leadsTable.id, id));
  if (!row) {
    res.status(404).json({ error: "Lead not found" });
    return;
  }
  const activities = await db
    .select({ a: leadActivitiesTable, u: usersTable.name })
    .from(leadActivitiesTable)
    .leftJoin(usersTable, eq(usersTable.id, leadActivitiesTable.createdById))
    .where(eq(leadActivitiesTable.leadId, id))
    .orderBy(desc(leadActivitiesTable.createdAt));
  const siteVisits = await db
    .select({ s: siteVisitsTable, e: usersTable.name })
    .from(siteVisitsTable)
    .leftJoin(usersTable, eq(usersTable.id, siteVisitsTable.engineerId))
    .where(eq(siteVisitsTable.leadId, id))
    .orderBy(desc(siteVisitsTable.visitDate));
  const drawings = await db
    .select({ d: drawingsTable, u: usersTable.name })
    .from(drawingsTable)
    .leftJoin(usersTable, eq(usersTable.id, drawingsTable.uploadedById))
    .where(eq(drawingsTable.leadId, id))
    .orderBy(desc(drawingsTable.uploadedAt));
  const boqs = await db
    .select()
    .from(boqsTable)
    .where(eq(boqsTable.leadId, id))
    .orderBy(desc(boqsTable.version));
  const negotiations = await db
    .select()
    .from(negotiationsTable)
    .where(eq(negotiationsTable.leadId, id))
    .orderBy(asc(negotiationsTable.roundNumber));
  res.json({
    ...formatLead(row.l),
    ownerName: row.ownerName,
    activities: activities.map((a) => ({ ...a.a, createdByName: a.u })),
    siteVisits: siteVisits.map((s) => ({ ...s.s, engineerName: s.e })),
    drawings: drawings.map((d) => ({ ...d.d, uploadedByName: d.u })),
    boqs: boqs.map(formatBoq),
    negotiations: negotiations.map(formatNeg),
  });
});

router.post("/leads", async (req, res): Promise<void> => {
  const rawBody = req.body ?? {};
  const body = rawBody.data && typeof rawBody.data === "object" ? rawBody.data : rawBody;
  if (!body.customerName) {
    res.status(400).json({ error: "customerName required" });
    return;
  }
  const me = await getCurrentUser();
  const leadNumber = await genLeadNumber();
  await db
    .insert(leadsTable)
    .values({
      leadNumber,
      customerName: body.customerName,
      company: body.company ?? null,
      contactEmail: body.contactEmail ?? null,
      contactPhone: body.contactPhone ?? null,
      projectType: body.projectType ?? null,
      location: body.location ?? null,
      budgetEstimate:
        body.budgetEstimate != null ? String(body.budgetEstimate) : null,
      leadSource: body.leadSource ?? null,
      status: body.status ?? "new",
      stage: body.stage ?? "lead_creation",
      priority: body.priority ?? "medium",
      ownerId: body.ownerId ?? me.id,
      expectedClosureDate: body.expectedClosureDate ?? null,
      notes: body.notes ?? null,
      advancePercent: body.advancePercent != null ? String(body.advancePercent) : "10.00",
      retentionPercent: body.retentionPercent != null ? String(body.retentionPercent) : "5.00",
      abgRequired: Boolean(body.abgRequired),
      abgPercent: body.abgPercent != null ? String(body.abgPercent) : "0.00",
      abgAmount: body.abgAmount != null ? String(body.abgAmount) : "0.00",
      paymentTermsDays: body.paymentTermsDays != null ? Number(body.paymentTermsDays) : 30,
      dlpMonths: body.dlpMonths != null ? Number(body.dlpMonths) : 12,
      commercialTermsNotes: body.commercialTermsNotes ?? null,
    });
  
  // MySQL doesn't support .returning() - query by unique leadNumber
  const [lead] = await db
    .select()
    .from(leadsTable)
    .where(eq(leadsTable.leadNumber, leadNumber))
    .limit(1);
  
  res.status(201).json(formatLead(lead!));
});

router.patch("/leads/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  const body = req.body ?? {};
  const update: Record<string, unknown> = {};
  for (const k of [
    "customerName",
    "company",
    "contactEmail",
    "contactPhone",
    "projectType",
    "location",
    "leadSource",
    "status",
    "stage",
    "priority",
    "ownerId",
    "expectedClosureDate",
    "wonProjectId",
    "notes",
    "commercialTermsNotes",
  ]) {
    if (body[k] !== undefined) update[k] = body[k];
  }
  if (body.advancePercent !== undefined) {
    update.advancePercent = body.advancePercent == null ? "10.00" : String(body.advancePercent);
  }
  if (body.retentionPercent !== undefined) {
    update.retentionPercent = body.retentionPercent == null ? "5.00" : String(body.retentionPercent);
  }
  if (body.abgRequired !== undefined) {
    update.abgRequired = Boolean(body.abgRequired);
  }
  if (body.abgPercent !== undefined) {
    update.abgPercent = body.abgPercent == null ? "0.00" : String(body.abgPercent);
  }
  if (body.abgAmount !== undefined) {
    update.abgAmount = body.abgAmount == null ? "0.00" : String(body.abgAmount);
  }
  if (body.paymentTermsDays !== undefined) {
    update.paymentTermsDays = body.paymentTermsDays == null ? 30 : Number(body.paymentTermsDays);
  }
  if (body.dlpMonths !== undefined) {
    update.dlpMonths = body.dlpMonths == null ? 12 : Number(body.dlpMonths);
  }
  if (body.budgetEstimate !== undefined) {
    update.budgetEstimate =
      body.budgetEstimate == null ? null : String(body.budgetEstimate);
  }
  await db
    .update(leadsTable)
    .set(update)
    .where(eq(leadsTable.id, id));
  
  // MySQL doesn't support .returning() - query after update
  const [updated] = await db
    .select()
    .from(leadsTable)
    .where(eq(leadsTable.id, id))
    .limit(1);
  
  if (!updated) {
    res.status(404).json({ error: "Lead not found" });
    return;
  }
  res.json(formatLead(updated));
});

router.delete("/leads/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  await db.delete(leadsTable).where(eq(leadsTable.id, id));
  res.sendStatus(204);
});

router.get("/leads/:leadId/activities", async (req, res): Promise<void> => {
  const leadId = parseInt(req.params.leadId as string, 10);
  const rows = await db
    .select({ a: leadActivitiesTable, u: usersTable.name })
    .from(leadActivitiesTable)
    .leftJoin(usersTable, eq(usersTable.id, leadActivitiesTable.createdById))
    .where(eq(leadActivitiesTable.leadId, leadId))
    .orderBy(desc(leadActivitiesTable.createdAt));
  res.json(rows.map((r) => ({ ...r.a, createdByName: r.u })));
});

router.post("/leads/:leadId/activities", async (req, res): Promise<void> => {
  const leadId = parseInt(req.params.leadId as string, 10);
  const me = await getCurrentUser();
  const result = await db
    .insert(leadActivitiesTable)
    .values({
      leadId,
      activityType: req.body?.activityType ?? "note",
      title: req.body?.title ?? "",
      description: req.body?.description ?? null,
      createdById: me.id,
    });
  
  // MySQL returns insertId - use it to fetch the created record
  const insertId = Number(result[0].insertId);
  const [act] = await db
    .select()
    .from(leadActivitiesTable)
    .where(eq(leadActivitiesTable.id, insertId))
    .limit(1);
  
  res.status(201).json({ ...act, createdByName: me.name });
});

router.get("/leads/:leadId/site-visits", async (req, res): Promise<void> => {
  const leadId = parseInt(req.params.leadId as string, 10);
  const rows = await db
    .select({ s: siteVisitsTable, e: usersTable.name })
    .from(siteVisitsTable)
    .leftJoin(usersTable, eq(usersTable.id, siteVisitsTable.engineerId))
    .where(eq(siteVisitsTable.leadId, leadId))
    .orderBy(desc(siteVisitsTable.visitDate));
  res.json(rows.map((r) => ({ ...r.s, engineerName: r.e })));
});

router.post("/leads/:leadId/site-visits", async (req, res): Promise<void> => {
  const leadId = parseInt(req.params.leadId as string, 10);
  const b = req.body ?? {};
  const result = await db
    .insert(siteVisitsTable)
    .values({
      leadId,
      visitDate: b.visitDate,
      visitTime: b.visitTime ?? null,
      engineerId: b.engineerId ?? null,
      siteAddress: b.siteAddress ?? null,
      latitude: b.latitude ?? null,
      longitude: b.longitude ?? null,
      measurements: b.measurements ?? null,
      observations: b.observations ?? null,
      status: b.status ?? "pending",
    });
  
  // MySQL returns insertId - use it to fetch the created record
  const insertId = Number(result[0].insertId);
  const [v] = await db
    .select()
    .from(siteVisitsTable)
    .where(eq(siteVisitsTable.id, insertId))
    .limit(1);
  
  res.status(201).json(v);
});

router.patch("/site-visits/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  const b = req.body ?? {};
  const update: Record<string, unknown> = {};
  for (const k of [
    "visitDate",
    "visitTime",
    "engineerId",
    "siteAddress",
    "latitude",
    "longitude",
    "measurements",
    "observations",
    "status",
  ]) {
    if (b[k] !== undefined) update[k] = b[k];
  }
  await db
    .update(siteVisitsTable)
    .set(update)
    .where(eq(siteVisitsTable.id, id));
  
  // MySQL doesn't support .returning() - query after update
  const [v] = await db
    .select()
    .from(siteVisitsTable)
    .where(eq(siteVisitsTable.id, id))
    .limit(1);
  
  if (!v) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(v);
});

router.get("/leads/:leadId/drawings", async (req, res): Promise<void> => {
  const leadId = parseInt(req.params.leadId as string, 10);
  const rows = await db
    .select({ d: drawingsTable, u: usersTable.name })
    .from(drawingsTable)
    .leftJoin(usersTable, eq(usersTable.id, drawingsTable.uploadedById))
    .where(eq(drawingsTable.leadId, leadId))
    .orderBy(desc(drawingsTable.uploadedAt));
  res.json(rows.map((r) => ({ ...r.d, uploadedByName: r.u })));
});

router.post("/leads/:leadId/drawings", async (req, res): Promise<void> => {
  const leadId = parseInt(req.params.leadId as string, 10);
  const me = await getCurrentUser();
  const b = req.body ?? {};
  const result = await db
    .insert(drawingsTable)
    .values({
      leadId,
      fileName: b.fileName,
      fileType: b.fileType ?? null,
      fileSize: b.fileSize ?? null,
      fileUrl: b.fileUrl ?? null,
      version: b.version ?? 1,
      uploadedById: me.id,
    });
  
  // MySQL returns insertId - use it to fetch the created record
  const insertId = Number(result[0].insertId);
  const [d] = await db
    .select()
    .from(drawingsTable)
    .where(eq(drawingsTable.id, insertId))
    .limit(1);
  
  res.status(201).json({ ...d, uploadedByName: me.name });
});

router.patch("/drawings/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  const b = req.body ?? {};
  const update: Record<string, unknown> = {};
  if (b.status !== undefined) update.status = b.status;
  if (b.reviewerComments !== undefined)
    update.reviewerComments = b.reviewerComments;
  await db
    .update(drawingsTable)
    .set(update)
    .where(eq(drawingsTable.id, id));
  
  // MySQL doesn't support .returning() - query after update
  const [d] = await db
    .select()
    .from(drawingsTable)
    .where(eq(drawingsTable.id, id))
    .limit(1);
  
  if (!d) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(d);
});

router.get("/leads/:leadId/boqs", async (req, res): Promise<void> => {
  const leadId = parseInt(req.params.leadId as string, 10);
  const boqs = await db
    .select()
    .from(boqsTable)
    .where(eq(boqsTable.leadId, leadId))
    .orderBy(desc(boqsTable.version));
  res.json(boqs.map(formatBoq));
});

router.post("/leads/:leadId/boqs", async (req, res): Promise<void> => {
  const leadId = parseInt(req.params.leadId as string, 10);
  const me = await getCurrentUser();
  const b = req.body ?? {};
  const existing = await db
    .select({ v: boqsTable.version })
    .from(boqsTable)
    .where(eq(boqsTable.leadId, leadId));
  const nextV = b.version ?? (existing.reduce((a, x) => Math.max(a, x.v), 0) + 1);
  const result = await db
    .insert(boqsTable)
    .values({ leadId, version: nextV, createdById: me.id });
  
  // MySQL returns insertId - use it to fetch the created record
  const insertId = Number(result[0].insertId);
  const [boq] = await db
    .select()
    .from(boqsTable)
    .where(eq(boqsTable.id, insertId))
    .limit(1);
  
  res.status(201).json(formatBoq(boq!));
});

router.get("/boqs/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  const [boq] = await db.select().from(boqsTable).where(eq(boqsTable.id, id));
  if (!boq) {
    res.status(404).json({ error: "BOQ not found" });
    return;
  }
  const items = await db
    .select()
    .from(boqItemsTable)
    .where(eq(boqItemsTable.boqId, id))
    .orderBy(asc(boqItemsTable.sortOrder), asc(boqItemsTable.id));
  res.json({ ...formatBoq(boq), items: items.map(formatBoqItem) });
});

router.get("/boqs/:id/export", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  const { format: exportFormat = "excel" } = req.query as Record<string, string | undefined>;

  const [boq] = await db.select().from(boqsTable).where(eq(boqsTable.id, id));
  if (!boq) {
    res.status(404).json({ error: "BOQ not found" });
    return;
  }
  const [lead] = await db.select().from(leadsTable).where(eq(leadsTable.id, boq.leadId));
  const items = await db
    .select()
    .from(boqItemsTable)
    .where(eq(boqItemsTable.boqId, id))
    .orderBy(asc(boqItemsTable.sortOrder), asc(boqItemsTable.id));

  const safeLeadNumber = lead?.leadNumber || `LEAD-${boq.leadId}`;
  const filenameBase = `BOQ_v${boq.version}_${safeLeadNumber}`;

  if (exportFormat === "csv") {
    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const csvRows = [
      `"BOQ Version ${boq.version} - ${lead?.customerName || ""}"`,
      `"Lead Number:",${escapeCsv(lead?.leadNumber)}`,
      `"Company:",${escapeCsv(lead?.company)}`,
      `"Project Type:",${escapeCsv(lead?.projectType)}`,
      `"Location:",${escapeCsv(lead?.location)}`,
      `"Status:",${escapeCsv(boq.status)}`,
      `"Date:",${escapeCsv(new Date().toLocaleDateString())}`,
      "",
      [
        "Item No",
        "Item Name",
        "Category",
        "Quantity",
        "Unit",
        "Unit Price (INR)",
        "Tax (%)",
        "Margin (%)",
        "Total Price (INR)",
      ].join(","),
      ...items.map((item, index) =>
        [
          index + 1,
          escapeCsv(item.itemName),
          escapeCsv(item.category),
          escapeCsv(item.quantity),
          escapeCsv(item.unit),
          escapeCsv(item.unitPrice),
          escapeCsv(item.taxPercent),
          escapeCsv(item.marginPercent),
          escapeCsv(item.totalPrice),
        ].join(",")
      ),
      "",
      `"","","","","","","Subtotal (Base):",,${boq.subtotal ?? 0}`,
      `"","","","","","","Tax Total:",,${boq.taxTotal ?? 0}`,
      `"","","","","","","Margin Total:",,${boq.marginTotal ?? 0}`,
      `"","","","","","","Grand Total (INR):",,${boq.grandTotal ?? 0}`,
    ];

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filenameBase}.csv"`
    );
    res.send("\uFEFF" + csvRows.join("\r\n"));
    return;
  }

  if (exportFormat === "pdf" || exportFormat === "print") {
    const escHtml = (unsafe: any) => {
      if (unsafe === null || unsafe === undefined) return "";
      return String(unsafe)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    };

    const inrFmt = (v: any) =>
      Number(v || 0).toLocaleString("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      });

    const itemRowsHtml = items
      .map(
        (i, idx) => `<tr>
          <td style="text-align:center">${idx + 1}</td>
          <td><strong>${escHtml(i.itemName)}</strong></td>
          <td>${escHtml(i.category || "—")}</td>
          <td style="text-align:right">${escHtml(i.quantity)}</td>
          <td style="text-align:center">${escHtml(i.unit || "—")}</td>
          <td style="text-align:right">${inrFmt(i.unitPrice)}</td>
          <td style="text-align:right">${escHtml(i.taxPercent)}%</td>
          <td style="text-align:right">${escHtml(i.marginPercent)}%</td>
          <td style="text-align:right;font-weight:600">${inrFmt(i.totalPrice)}</td>
        </tr>`
      )
      .join("\n");

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>BOQ v${boq.version} - ${escHtml(lead?.customerName || "Lead")}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1e293b; margin: 0; padding: 24px; font-size: 13px; line-height: 1.5; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 24px; }
    .logo { font-size: 22px; font-weight: 900; letter-spacing: -0.5px; color: #0f172a; }
    .logo span { color: #f97316; }
    .title { font-size: 18px; font-weight: 800; text-transform: uppercase; color: #0f172a; margin-top: 4px; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
    .meta-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; }
    .meta-box h4 { margin: 0 0 8px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; }
    .meta-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
    .meta-label { color: #64748b; }
    .meta-val { font-weight: 600; color: #0f172a; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 12px; }
    th { background: #0f172a; color: #ffffff; text-align: left; padding: 8px 10px; font-size: 11px; text-transform: uppercase; font-weight: 600; letter-spacing: 0.05em; }
    td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; }
    tr:nth-child(even) td { background: #f8fafc; }
    .totals-area { display: flex; justify-content: flex-end; margin-bottom: 30px; }
    .totals-box { width: 320px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 14px 18px; }
    .total-line { display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; }
    .total-grand { border-top: 2px solid #0f172a; margin-top: 6px; padding-top: 8px; font-size: 16px; font-weight: 800; color: #0f172a; }
    .signatures { display: flex; justify-content: space-between; margin-top: 60px; padding-top: 20px; }
    .sig-block { width: 220px; border-top: 1px solid #94a3b8; text-align: center; font-size: 11px; color: #64748b; padding-top: 6px; }
    .no-print { display: flex; gap: 10px; margin-bottom: 20px; }
    .btn { padding: 8px 16px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; text-decoration: none; border: none; }
    .btn-primary { background: #0f172a; color: #fff; }
    .btn-secondary { background: #e2e8f0; color: #1e293b; }
    @media print {
      body { padding: 0; }
      .no-print { display: none !important; }
      @page { margin: 1.5cm; }
    }
  </style>
</head>
<body>
  <div class="no-print">
    <button onclick="window.print()" class="btn btn-primary">&#128424; Print / Save as PDF</button>
    <button onclick="window.close()" class="btn btn-secondary">Close Window</button>
  </div>

  <div class="header">
    <div>
      <div class="logo">KANAK <span>TURNKEY</span></div>
      <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Comprehensive Turnkey Contracting & Commercial Management</div>
    </div>
    <div style="text-align: right;">
      <div class="title">Bill of Quantities</div>
      <div style="font-weight: 700; color: #f97316; font-size: 14px;">Version ${boq.version} &bull; ${escHtml(boq.status?.toUpperCase() || "DRAFT")}</div>
      <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Generated: ${new Date().toLocaleDateString("en-IN")}</div>
    </div>
  </div>

  <div class="meta-grid">
    <div class="meta-box">
      <h4>Client & Project Details</h4>
      <div class="meta-row"><span class="meta-label">Customer Name:</span><span class="meta-val">${escHtml(lead?.customerName || "—")}</span></div>
      <div class="meta-row"><span class="meta-label">Company:</span><span class="meta-val">${escHtml(lead?.company || "—")}</span></div>
      <div class="meta-row"><span class="meta-label">Project Type:</span><span class="meta-val">${escHtml(lead?.projectType || "—")}</span></div>
      <div class="meta-row"><span class="meta-label">Site Location:</span><span class="meta-val">${escHtml(lead?.location || "—")}</span></div>
    </div>
    <div class="meta-box">
      <h4>Lead & Document Reference</h4>
      <div class="meta-row"><span class="meta-label">Lead Number:</span><span class="meta-val">${escHtml(lead?.leadNumber || "—")}</span></div>
      <div class="meta-row"><span class="meta-label">Contact Phone:</span><span class="meta-val">${escHtml(lead?.contactPhone || "—")}</span></div>
      <div class="meta-row"><span class="meta-label">Contact Email:</span><span class="meta-val">${escHtml(lead?.contactEmail || "—")}</span></div>
      <div class="meta-row"><span class="meta-label">BOQ Status:</span><span class="meta-val">${escHtml(boq.status || "draft")}</span></div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 35px; text-align: center">#</th>
        <th>Item Description</th>
        <th>Category</th>
        <th style="width: 50px; text-align: right">Qty</th>
        <th style="width: 45px; text-align: center">Unit</th>
        <th style="width: 90px; text-align: right">Unit Price</th>
        <th style="width: 55px; text-align: right">Tax</th>
        <th style="width: 60px; text-align: right">Margin</th>
        <th style="width: 105px; text-align: right">Total (INR)</th>
      </tr>
    </thead>
    <tbody>
      ${itemRowsHtml || '<tr><td colspan="9" style="text-align:center;padding:20px;color:#64748b">No line items in this BOQ version.</td></tr>'}
    </tbody>
  </table>

  <div class="totals-area">
    <div class="totals-box">
      <div class="total-line"><span class="meta-label">Subtotal (Base Cost):</span><span class="meta-val">${inrFmt(boq.subtotal)}</span></div>
      <div class="total-line"><span class="meta-label">Applicable Tax:</span><span class="meta-val">${inrFmt(boq.taxTotal)}</span></div>
      <div class="total-line"><span class="meta-label">Operating Margin:</span><span class="meta-val">${inrFmt(boq.marginTotal)}</span></div>
      <div class="total-line total-grand"><span>Grand Total:</span><span>${inrFmt(boq.grandTotal)}</span></div>
    </div>
  </div>

  <div class="signatures">
    <div class="sig-block">Prepared By: Estimator / PM</div>
    <div class="sig-block">Reviewed By: Commercial Head</div>
    <div class="sig-block">Client Acceptance & Seal</div>
  </div>

  <div style="margin-top: 40px; font-size: 10px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 10px;">
    Kanak Turnkey Enterprise ERP &bull; Official BOQ Commercial Document &bull; Generated digitally on ${new Date().toLocaleString("en-IN")}
  </div>
</body>
</html>`;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
    return;
  }

  // Default: XML Spreadsheet 2003 (.xls) for Microsoft Excel
  const escapeXml = (unsafe: any) => {
    if (unsafe === null || unsafe === undefined) return "";
    return String(unsafe)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  };

  const xmlItemRows = items
    .map(
      (item, idx) => `   <Row>
    <Cell ss:StyleID="Center"><Data ss:Type="Number">${idx + 1}</Data></Cell>
    <Cell ss:StyleID="Text"><Data ss:Type="String">${escapeXml(item.itemName)}</Data></Cell>
    <Cell ss:StyleID="Center"><Data ss:Type="String">${escapeXml(item.category || "-")}</Data></Cell>
    <Cell ss:StyleID="Number"><Data ss:Type="Number">${item.quantity ?? 0}</Data></Cell>
    <Cell ss:StyleID="Center"><Data ss:Type="String">${escapeXml(item.unit || "-")}</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${item.unitPrice ?? 0}</Data></Cell>
    <Cell ss:StyleID="Percent"><Data ss:Type="Number">${Number(item.taxPercent || 0) / 100}</Data></Cell>
    <Cell ss:StyleID="Percent"><Data ss:Type="Number">${Number(item.marginPercent || 0) / 100}</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${item.totalPrice ?? 0}</Data></Cell>
   </Row>`
    )
    .join("\n");

  const xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Author>Kanak Turnkey</Author>
  <Created>${new Date().toISOString()}</Created>
 </DocumentProperties>
 <Styles>
  <Style ss:ID="Header">
   <Font ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#0F172A" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="Title">
   <Font ss:Bold="1" ss:Size="14" ss:Color="#0F172A"/>
   <Alignment ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="MetaLabel">
   <Font ss:Bold="1" ss:Color="#64748B"/>
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="MetaVal">
   <Font ss:Bold="1" ss:Color="#0F172A"/>
   <Alignment ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="Text">
   <Alignment ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="Center">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="Number">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="Currency">
   <NumberFormat ss:Format="₹#,##0"/>
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="Percent">
   <NumberFormat ss:Format="0.0%"/>
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="TotalLabel">
   <Font ss:Bold="1" ss:Color="#0F172A"/>
   <Interior ss:Color="#F1F5F9" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="TotalVal">
   <Font ss:Bold="1" ss:Color="#0F172A"/>
   <Interior ss:Color="#F1F5F9" ss:Pattern="Solid"/>
   <NumberFormat ss:Format="₹#,##0"/>
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="GrandTotal">
   <Font ss:Bold="1" ss:Size="11" ss:Color="#0F172A"/>
   <Interior ss:Color="#E2E8F0" ss:Pattern="Solid"/>
   <NumberFormat ss:Format="₹#,##0"/>
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="BOQ v${boq.version}">
  <Table>
   <Column ss:Width="40"/>
   <Column ss:Width="220"/>
   <Column ss:Width="120"/>
   <Column ss:Width="70"/>
   <Column ss:Width="60"/>
   <Column ss:Width="110"/>
   <Column ss:Width="70"/>
   <Column ss:Width="70"/>
   <Column ss:Width="130"/>
   <Row>
    <Cell ss:MergeAcross="8" ss:StyleID="Title"><Data ss:Type="String">KANAK TURNKEY - BILL OF QUANTITIES (BOQ)</Data></Cell>
   </Row>
   <Row>
    <Cell ss:StyleID="MetaLabel"><Data ss:Type="String">Customer:</Data></Cell>
    <Cell ss:StyleID="MetaVal"><Data ss:Type="String">${escapeXml(lead?.customerName || "-")}</Data></Cell>
    <Cell ss:StyleID="MetaLabel"><Data ss:Type="String">Lead No:</Data></Cell>
    <Cell ss:StyleID="MetaVal"><Data ss:Type="String">${escapeXml(lead?.leadNumber || "-")}</Data></Cell>
    <Cell ss:StyleID="MetaLabel"><Data ss:Type="String">BOQ Version:</Data></Cell>
    <Cell ss:StyleID="MetaVal"><Data ss:Type="String">Version ${boq.version}</Data></Cell>
    <Cell ss:StyleID="MetaLabel"><Data ss:Type="String">Status:</Data></Cell>
    <Cell ss:MergeAcross="1" ss:StyleID="MetaVal"><Data ss:Type="String">${escapeXml(boq.status || "draft")}</Data></Cell>
   </Row>
   <Row>
    <Cell ss:StyleID="MetaLabel"><Data ss:Type="String">Company:</Data></Cell>
    <Cell ss:StyleID="MetaVal"><Data ss:Type="String">${escapeXml(lead?.company || "-")}</Data></Cell>
    <Cell ss:StyleID="MetaLabel"><Data ss:Type="String">Location:</Data></Cell>
    <Cell ss:StyleID="MetaVal"><Data ss:Type="String">${escapeXml(lead?.location || "-")}</Data></Cell>
    <Cell ss:StyleID="MetaLabel"><Data ss:Type="String">Project Type:</Data></Cell>
    <Cell ss:StyleID="MetaVal"><Data ss:Type="String">${escapeXml(lead?.projectType || "-")}</Data></Cell>
    <Cell ss:StyleID="MetaLabel"><Data ss:Type="String">Date:</Data></Cell>
    <Cell ss:MergeAcross="1" ss:StyleID="MetaVal"><Data ss:Type="String">${escapeXml(new Date().toLocaleDateString())}</Data></Cell>
   </Row>
   <Row></Row>
   <Row ss:StyleID="Header">
    <Cell><Data ss:Type="String">#</Data></Cell>
    <Cell><Data ss:Type="String">Item Description</Data></Cell>
    <Cell><Data ss:Type="String">Category</Data></Cell>
    <Cell><Data ss:Type="String">Quantity</Data></Cell>
    <Cell><Data ss:Type="String">Unit</Data></Cell>
    <Cell><Data ss:Type="String">Unit Price (INR)</Data></Cell>
    <Cell><Data ss:Type="String">Tax %</Data></Cell>
    <Cell><Data ss:Type="String">Margin %</Data></Cell>
    <Cell><Data ss:Type="String">Total Price (INR)</Data></Cell>
   </Row>
${xmlItemRows}
   <Row></Row>
   <Row>
    <Cell ss:MergeAcross="7" ss:StyleID="TotalLabel"><Data ss:Type="String">Subtotal (Base Cost):</Data></Cell>
    <Cell ss:StyleID="TotalVal"><Data ss:Type="Number">${boq.subtotal ?? 0}</Data></Cell>
   </Row>
   <Row>
    <Cell ss:MergeAcross="7" ss:StyleID="TotalLabel"><Data ss:Type="String">Applicable Tax Total:</Data></Cell>
    <Cell ss:StyleID="TotalVal"><Data ss:Type="Number">${boq.taxTotal ?? 0}</Data></Cell>
   </Row>
   <Row>
    <Cell ss:MergeAcross="7" ss:StyleID="TotalLabel"><Data ss:Type="String">Operating Margin Total:</Data></Cell>
    <Cell ss:StyleID="TotalVal"><Data ss:Type="Number">${boq.marginTotal ?? 0}</Data></Cell>
   </Row>
   <Row>
    <Cell ss:MergeAcross="7" ss:StyleID="GrandTotal"><Data ss:Type="String">GRAND TOTAL (INR):</Data></Cell>
    <Cell ss:StyleID="GrandTotal"><Data ss:Type="Number">${boq.grandTotal ?? 0}</Data></Cell>
   </Row>
  </Table>
 </Worksheet>
</Workbook>`;

  res.setHeader("Content-Type", "application/vnd.ms-excel; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${filenameBase}.xls"`
  );
  res.send(xml);
});

router.patch("/boqs/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  const update: Record<string, unknown> = {};
  if (req.body?.status !== undefined) update.status = req.body.status;
  await db
    .update(boqsTable)
    .set(update)
    .where(eq(boqsTable.id, id));
  
  // MySQL doesn't support .returning() - query after update
  const [boq] = await db
    .select()
    .from(boqsTable)
    .where(eq(boqsTable.id, id))
    .limit(1);
  
  if (!boq) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(formatBoq(boq));
});

router.post("/boqs/:boqId/items", async (req, res): Promise<void> => {
  const boqId = parseInt(req.params.boqId as string, 10);
  const b = req.body ?? {};
  const q = Number(b.quantity ?? 0);
  const up = Number(b.unitPrice ?? 0);
  const tax = Number(b.taxPercent ?? 0);
  const margin = Number(b.marginPercent ?? 0);
  const base = q * up;
  const total = base + (base * tax) / 100 + (base * margin) / 100;
  const result = await db
    .insert(boqItemsTable)
    .values({
      boqId,
      itemName: b.itemName,
      category: b.category ?? null,
      quantity: String(q),
      unit: b.unit ?? null,
      unitPrice: String(up),
      taxPercent: String(tax),
      marginPercent: String(margin),
      totalPrice: total.toFixed(2),
      sortOrder: b.sortOrder ?? 0,
    });
  
  // MySQL returns insertId - use it to fetch the created record
  const insertId = Number(result[0].insertId);
  const [item] = await db
    .select()
    .from(boqItemsTable)
    .where(eq(boqItemsTable.id, insertId))
    .limit(1);
  
  await recomputeBoq(boqId);
  res.status(201).json(formatBoqItem(item!));
});

router.delete("/boq-items/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  
  // MySQL doesn't support .returning() - query before delete
  const [item] = await db
    .select()
    .from(boqItemsTable)
    .where(eq(boqItemsTable.id, id))
    .limit(1);
  
  if (item) {
    await db.delete(boqItemsTable).where(eq(boqItemsTable.id, id));
    await recomputeBoq(item.boqId);
  }
  
  res.sendStatus(204);
});

router.get("/leads/:leadId/negotiations", async (req, res): Promise<void> => {
  const leadId = parseInt(req.params.leadId as string, 10);
  const rows = await db
    .select()
    .from(negotiationsTable)
    .where(eq(negotiationsTable.leadId, leadId))
    .orderBy(asc(negotiationsTable.roundNumber));
  res.json(rows.map(formatNeg));
});

router.post("/leads/:leadId/negotiations", async (req, res): Promise<void> => {
  const leadId = parseInt(req.params.leadId as string, 10);
  const me = await getCurrentUser();
  const b = req.body ?? {};
  const existing = await db
    .select({ r: negotiationsTable.roundNumber })
    .from(negotiationsTable)
    .where(eq(negotiationsTable.leadId, leadId));
  const nextR = existing.reduce((a, x) => Math.max(a, x.r), 0) + 1;
  const requiresApproval = b.requiresApproval ?? Number(b.discountPercent ?? 0) > 10;
  const result = await db
    .insert(negotiationsTable)
    .values({
      leadId,
      roundNumber: nextR,
      revisedAmount:
        b.revisedAmount != null ? String(b.revisedAmount) : null,
      discountPercent:
        b.discountPercent != null ? String(b.discountPercent) : null,
      requiresApproval,
      notes: b.notes ?? null,
      createdById: me.id,
    });
  
  // MySQL returns insertId - use it to fetch the created record
  const insertId = Number(result[0].insertId);
  const [neg] = await db
    .select()
    .from(negotiationsTable)
    .where(eq(negotiationsTable.id, insertId))
    .limit(1);
  
  res.status(201).json(formatNeg(neg!));
});

router.patch("/negotiations/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  const update: Record<string, unknown> = {};
  if (req.body?.status !== undefined) update.status = req.body.status;
  if (req.body?.notes !== undefined) update.notes = req.body.notes;
  await db
    .update(negotiationsTable)
    .set(update)
    .where(eq(negotiationsTable.id, id));
  
  // MySQL doesn't support .returning() - query after update
  const [updated] = await db
    .select()
    .from(negotiationsTable)
    .where(eq(negotiationsTable.id, id))
    .limit(1);
  
  if (!updated) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(formatNeg(updated));
});

// Default lifecycle of tasks seeded when a lead is converted to a project.
// Each task is offset (in days) from the project start. Phase=parent grouper.
const PROJECT_LIFECYCLE: Array<{
  title: string;
  description: string;
  startOffset: number;
  durationDays: number;
  phase: string;
}> = [
  {
    title: "Project kickoff & contract sign-off",
    description: "Confirm scope, sign contract, mobilize core team.",
    startOffset: 0,
    durationDays: 7,
    phase: "Initiation",
  },
  {
    title: "Site mobilization & survey",
    description: "Set up site office, fencing, utilities; topographic survey.",
    startOffset: 5,
    durationDays: 14,
    phase: "Initiation",
  },
  {
    title: "Statutory approvals & permits",
    description: "Building permit, environmental clearance, labour licence.",
    startOffset: 7,
    durationDays: 30,
    phase: "Planning",
  },
  {
    title: "Detailed design & engineering",
    description: "GFC drawings, MEP coordination, structural analysis.",
    startOffset: 14,
    durationDays: 45,
    phase: "Planning",
  },
  {
    title: "Procurement of long-lead materials",
    description: "Issue PO for steel, lifts, DG sets, HVAC equipment.",
    startOffset: 30,
    durationDays: 60,
    phase: "Procurement",
  },
  {
    title: "Foundation & substructure",
    description: "Excavation, raft/PCC, columns up to plinth.",
    startOffset: 45,
    durationDays: 60,
    phase: "Execution",
  },
  {
    title: "Superstructure works",
    description: "Slabs, columns, beams, masonry up to terrace.",
    startOffset: 90,
    durationDays: 120,
    phase: "Execution",
  },
  {
    title: "MEP rough-in",
    description: "Conduiting, plumbing risers, HVAC ducting.",
    startOffset: 150,
    durationDays: 60,
    phase: "Execution",
  },
  {
    title: "Finishes & interiors",
    description: "Plaster, paint, flooring, false ceiling, joinery.",
    startOffset: 210,
    durationDays: 60,
    phase: "Execution",
  },
  {
    title: "Testing, commissioning & snagging",
    description: "Run all systems, snag list resolution, statutory NOCs.",
    startOffset: 270,
    durationDays: 21,
    phase: "Closeout",
  },
  {
    title: "Client handover & DLP start",
    description:
      "Final walkthrough, key handover, O&M manuals, defect liability period begins.",
    startOffset: 290,
    durationDays: 7,
    phase: "Closeout",
  },
];

const addDays = (base: Date, days: number): string => {
  const d = new Date(base);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

router.post("/leads/:id/convert", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  const body = req.body ?? {};
  const me = await getCurrentUser();

  const [lead] = await db
    .select()
    .from(leadsTable)
    .where(eq(leadsTable.id, id));
  if (!lead) {
    res.status(404).json({ error: "Lead not found" });
    return;
  }
  if (lead.wonProjectId) {
    res.status(409).json({
      error: "Lead already converted",
      projectId: lead.wonProjectId,
    });
    return;
  }

  // ── Prerequisite check ──────────────────────────────────────────────────
  // Both an approved BOQ and an approved Drawing must exist before a lead
  // can be converted to a project, unless skipPrerequisites / force / fastTrack is requested.
  const [approvedBoq] = await db
    .select({ id: boqsTable.id })
    .from(boqsTable)
    .where(and(eq(boqsTable.leadId, id), eq(boqsTable.status, "approved")))
    .limit(1);

  const [approvedDrawing] = await db
    .select({ id: drawingsTable.id })
    .from(drawingsTable)
    .where(
      and(eq(drawingsTable.leadId, id), eq(drawingsTable.status, "approved")),
    )
    .limit(1);

  const allowBypass = Boolean(body.force || body.skipPrerequisites || body.fastTrack);

  if (!approvedBoq || !approvedDrawing) {
    if (!allowBypass) {
      const missing: string[] = [];
      if (!approvedBoq) missing.push("BOQ");
      if (!approvedDrawing) missing.push("Drawings");
      res.status(422).json({
        error: `Cannot convert lead: the following must be approved first: ${missing.join(", ")}. Enable Fast-Track to convert immediately.`,
        missing,
      });
      return;
    }
  }
  // ────────────────────────────────────────────────────────────────────────

  // ── Commercial Payment Terms Matrix extraction ─────────────────────────
  const advancePercent = body.advancePercent != null ? Number(body.advancePercent) : num(lead.advancePercent) ?? 10;
  const retentionPercent = body.retentionPercent != null ? Number(body.retentionPercent) : num(lead.retentionPercent) ?? 5;
  const abgRequired = body.abgRequired !== undefined ? Boolean(body.abgRequired) : Boolean(lead.abgRequired);
  const abgPercent = body.abgPercent != null ? Number(body.abgPercent) : num(lead.abgPercent) ?? (abgRequired ? advancePercent : 0);
  const paymentTermsDays = body.paymentTermsDays != null ? Number(body.paymentTermsDays) : Number(lead.paymentTermsDays ?? 30);
  const dlpMonths = body.dlpMonths != null ? Number(body.dlpMonths) : Number(lead.dlpMonths ?? 12);
  const commercialTermsNotes = body.commercialTermsNotes ?? lead.commercialTermsNotes ?? null;

  // Pick a sensible project name & start date.
  const projectName: string =
    (typeof body.projectName === "string" && body.projectName.trim()) ||
    `${lead.customerName}${
      lead.projectType ? ` — ${lead.projectType}` : ""
    }`;
  const startDateStr: string =
    (typeof body.startDate === "string" && body.startDate) ||
    new Date().toISOString().slice(0, 10);
  const startBase = new Date(`${startDateStr}T00:00:00.000Z`);
  const fallbackEnd = addDays(startBase, 300);
  const endDateStr: string =
    (typeof body.endDate === "string" && body.endDate) || fallbackEnd;

  // Try to source the budget from the latest BOQ (sum of grandTotal).
  const leadBoqs = await db
    .select()
    .from(boqsTable)
    .where(eq(boqsTable.leadId, lead.id))
    .orderBy(desc(boqsTable.version));
  const latestBoq = leadBoqs[0];
  const budgetFromBoq = latestBoq ? num(latestBoq.grandTotal) : null;
  const projectBudget =
    budgetFromBoq ?? num(lead.budgetEstimate as unknown) ?? 10000000;
  
  const abgAmount = body.abgAmount != null 
    ? Number(body.abgAmount) 
    : abgRequired 
      ? Number(((projectBudget * abgPercent) / 100).toFixed(2)) 
      : (num(lead.abgAmount) ?? 0);

  // 1. Create the project.
  const result = await db
    .insert(projectsTable)
    .values({
      name: projectName,
      type: lead.projectType ?? null,
      location: lead.location ?? null,
      clientName: (lead.company as string | null) ?? lead.customerName,
      startDate: startDateStr,
      endDate: endDateStr,
      budget: projectBudget != null ? String(projectBudget) : null,
      description: `Converted from lead ${lead.leadNumber}. Client EPC Turnkey project.`,
      status: "planning",
      lifecycleStage: "setup",
      projectManagerId: me.id,
      setupComplete: false,
      progress: 0,
      teamSize: null,
      createdById: me.id,
    });
  
  // MySQL returns insertId - use it to fetch the created record
  const insertId = Number(result[0].insertId);
  const [project] = await db
    .select()
    .from(projectsTable)
    .where(eq(projectsTable.id, insertId))
    .limit(1);
  
  if (!project) {
    res.status(500).json({ error: "Failed to create project" });
    return;
  }

  // Auto-assign converting user as project_manager in project_assignments
  await db.insert(projectAssignmentsTable).values({
    projectId: project.id,
    userId: me.id,
    role: "project_manager",
    assignedById: me.id,
  });

  // 2. Add the lead's customer as the primary client stakeholder.
  await db.insert(stakeholdersTable).values({
    projectId: project.id,
    name: lead.customerName,
    email: (lead.contactEmail as string | null) ?? null,
    phone: (lead.contactPhone as string | null) ?? null,
    organization: (lead.company as string | null) ?? null,
    role: "Client",
    accessLevel: "read",
  });

  // 3. AUTO-GENERATE OFFICIAL CLIENT CONTRACT
  const contractNumber = `CNT-CLI-${new Date().getFullYear()}-${String(project.id).padStart(4, "0")}`;
  const contractResult = await db.insert(contractsTable).values({
    contractNumber,
    contractType: "client",
    projectId: project.id,
    vendorId: null,
    clientName: (lead.company as string | null) ?? lead.customerName,
    title: `EPC Turnkey Construction Contract — ${lead.customerName}`,
    description: `Formal Client Agreement for Turnkey Project "${project.name}". Mobilization Advance: ${advancePercent}%, Retention: ${retentionPercent}%, DLP: ${dlpMonths} Months, Credit Period: ${paymentTermsDays} Days.${abgRequired ? ` Advance Bank Guarantee (ABG) required for ${abgPercent}% (₹${abgAmount.toLocaleString("en-IN")}).` : ""}`,
    totalAmount: String(projectBudget),
    advancePercent: String(advancePercent),
    retentionPercent: String(retentionPercent),
    abgRequired: abgRequired,
    abgPercent: String(abgPercent),
    abgAmount: String(abgAmount),
    paymentTermsDays: paymentTermsDays,
    dlpMonths: dlpMonths,
    commercialTermsNotes: commercialTermsNotes,
    tdsPercent: "2.00",
    gstPercent: "18.00",
    startDate: startDateStr,
    endDate: endDateStr,
    status: "active",
    createdById: me.id,
  });
  const clientContractId = Number(contractResult[0].insertId);

  // 3b. AUTO-GENERATE CONTRACT BOQ ITEMS FROM LEAD BOQ OR STANDARD PACKAGES
  const [leadBoq] = await db
    .select()
    .from(boqsTable)
    .where(eq(boqsTable.leadId, lead.id))
    .orderBy(desc(boqsTable.id))
    .limit(1);

  let boqItemsCount = 0;
  if (leadBoq) {
    const existingLeadBoqItems = await db
      .select()
      .from(boqItemsTable)
      .where(eq(boqItemsTable.boqId, leadBoq.id))
      .orderBy(asc(boqItemsTable.sortOrder), asc(boqItemsTable.id));

    if (existingLeadBoqItems.length > 0) {
      for (let i = 0; i < existingLeadBoqItems.length; i++) {
        const item = existingLeadBoqItems[i];
        await db.insert(contractBoqItemsTable).values({
          contractId: clientContractId,
          itemNumber: `${i + 1}`,
          description: item.itemName,
          unit: item.unit || "nos",
          quantity: item.quantity,
          rate: item.unitPrice,
          totalAmount: item.totalPrice,
          cumulativeCompletedQty: "0",
          cumulativeBilledQty: "0",
          sortOrder: i + 1,
        });
      }
      boqItemsCount = existingLeadBoqItems.length;
    }
  }

  if (boqItemsCount === 0) {
    const fallbackBoq = [
      { num: "1.1", desc: "Substructure Civil & Concrete Foundation Works", unit: "cum", qty: "150", rate: "5800", total: "870000" },
      { num: "1.2", desc: "Superstructure Reinforced Cement Concrete & Formwork", unit: "cum", qty: "220", rate: "6200", total: "1364000" },
      { num: "1.3", desc: "Masonry, Internal Plastering & Waterproofing System", unit: "sqm", qty: "850", rate: "850", total: "722500" },
      { num: "1.4", desc: "Flooring, Wall Cladding & Architectural Finishes", unit: "sqm", qty: "650", rate: "1450", total: "942500" },
      { num: "1.5", desc: "Electrical, HVAC & Low Voltage Rough-in Conduiting", unit: "lot", qty: "1", rate: "1250000", total: "1250000" },
    ];
    for (let idx = 0; idx < fallbackBoq.length; idx++) {
      const fb = fallbackBoq[idx];
      await db.insert(contractBoqItemsTable).values({
        contractId: clientContractId,
        itemNumber: fb.num,
        description: fb.desc,
        unit: fb.unit,
        quantity: fb.qty,
        rate: fb.rate,
        totalAmount: fb.total,
        cumulativeCompletedQty: "0",
        cumulativeBilledQty: "0",
        sortOrder: idx + 1,
      });
    }
  }

  // 4. AUTO-GENERATE BASELINE BUDGET COST CODE PACKAGES
  // Standard turnkey packages with industry-standard allocation percentages
  const standardPackages = [
    { code: "CIVIL-001", name: "Substructure & RCC Superstructure Works", cat: "Civil", pct: 0.35 },
    { code: "FINISH-001", name: "Architectural Finishes, Flooring & Joinery", cat: "Finishes", pct: 0.25 },
    { code: "MEP-001", name: "Electrical Distribution, HT/LT & Low Voltage", cat: "MEP", pct: 0.18 },
    { code: "HVAC-001", name: "Central HVAC, Ventilation & Ducting", cat: "HVAC", pct: 0.10 },
    { code: "PLUMB-001", name: "Plumbing, Sanitary & Firefighting Network", cat: "Plumbing", pct: 0.07 },
    { code: "OVHD-001", name: "Site Preliminaries, Project Management & Overheads", cat: "Overheads", pct: 0.05 },
  ];

  for (const pkg of standardPackages) {
    const pkgBudget = (projectBudget * pkg.pct).toFixed(2);
    await db.insert(budgetItemsTable).values({
      projectId: project.id,
      costCode: pkg.code,
      description: pkg.name,
      category: pkg.cat,
      budgeted: pkgBudget,
      actual: "0.00",
      committed: "0.00",
    });
  }

  // 5. AUTO-GENERATE MILESTONE TEMPLATE & MILESTONE-TO-BILLING SCHEDULE
  // Directly maps milestones to client contract billing percentages (Total = 100%)
  const milestoneTemplates = [
    {
      num: "M1",
      title: "Mobilization Advance & Site Possession Handover",
      desc: "Contract signing, site possession, mobilization of site office, plant & machinery",
      stage: "mobilization",
      pct: advancePercent > 0 ? advancePercent : 10.00,
      daysOffset: 15,
      status: "ready_to_bill", // Advance milestone is ready to bill immediately
    },
    {
      num: "M2",
      title: "Plinth & Substructure Completion",
      desc: "Excavation, foundation footings, plinth beams, and anti-termite treatment",
      stage: "substructure",
      pct: 15.00,
      daysOffset: 60,
      status: "pending",
    },
    {
      num: "M3",
      title: "Superstructure & Core RCC Works",
      desc: "Casting of columns, floor slabs, beams, and structural staircase core",
      stage: "superstructure",
      pct: 25.00,
      daysOffset: 120,
      status: "pending",
    },
    {
      num: "M4",
      title: "MEP Rough-ins & Internal Blockwork Partitions",
      desc: "Internal masonry, conduit rough-ins, plumbing concealed piping, and HVAC duct hanging",
      stage: "mep",
      pct: 20.00,
      daysOffset: 180,
      status: "pending",
    },
    {
      num: "M5",
      title: "Flooring, Wall Finishes, Joinery & Painting",
      desc: "Tiles/marble laying, false ceiling, internal doors, first coat paint, and sanitary fittings",
      stage: "finishes",
      pct: 20.00,
      daysOffset: 240,
      status: "pending",
    },
    {
      num: "M6",
      title: "Testing, Commissioning, Virtual Completion & Handover",
      desc: "Final MEP testing & commissioning, snag rectification, deep cleaning, and client sign-off",
      stage: "handover",
      pct: 10.00,
      daysOffset: 290,
      status: "pending",
    },
  ];

  // Adjust percentages so total is exactly 100%
  const totalAllocatedPct = milestoneTemplates.reduce((sum, m) => sum + m.pct, 0);
  if (totalAllocatedPct !== 100) {
    const diff = 100 - totalAllocatedPct;
    milestoneTemplates[milestoneTemplates.length - 1].pct += diff;
  }

  for (let idx = 0; idx < milestoneTemplates.length; idx++) {
    const m = milestoneTemplates[idx];
    const expectedAmount = ((projectBudget * m.pct) / 100).toFixed(2);
    const targetDate = addDays(startBase, m.daysOffset);
    await db.insert(billingMilestonesTable).values({
      projectId: project.id,
      contractId: clientContractId,
      milestoneNumber: m.num,
      title: m.title,
      description: m.desc,
      stage: m.stage,
      billingPercent: m.pct.toFixed(2),
      expectedAmount: expectedAmount,
      targetDate: targetDate,
      completionDate: null,
      status: m.status,
      raBillId: null,
      billedAmount: "0.00",
      sortOrder: idx + 1,
    });
  }

  // 6. Seed the lifecycle of tasks.
  for (const tpl of PROJECT_LIFECYCLE) {
    const taskStart = addDays(startBase, tpl.startOffset);
    const taskEnd = addDays(startBase, tpl.startOffset + tpl.durationDays);
    await db.insert(tasksTable).values({
      projectId: project.id,
      title: tpl.title,
      description: `[${tpl.phase}] ${tpl.description}`,
      assignedToId: null,
      startDate: taskStart,
      endDate: taskEnd,
      priority: "medium",
      status: "todo",
      progress: 0,
      parentTaskId: null,
      createdById: me.id,
    });
  }

  // 7. Mark the lead as won and link to the new project.
  await db
    .update(leadsTable)
    .set({
      status: "won",
      stage: "won",
      wonProjectId: project.id,
    })
    .where(eq(leadsTable.id, lead.id));

  // 8. Audit log + financial audit log.
  await db.insert(auditLogsTable).values({
    userId: me.id,
    activity: `Converted lead ${lead.leadNumber} → project ${project.name} with auto-generated Client Contract ${contractNumber}`,
    resourceType: "project",
    resourceId: project.id,
    status: "success",
    metadata: JSON.stringify({
      leadId: lead.id,
      leadNumber: lead.leadNumber,
      projectId: project.id,
      contractId: clientContractId,
      contractNumber,
    }),
  });

  await db.insert(financialAuditLogsTable).values({
    workflowType: "AR",
    entityType: "client_contract",
    entityId: clientContractId,
    action: "LEAD_CONVERTED_HANDOVER",
    previousStatus: "lead_won",
    newStatus: "contract_active",
    userId: me.id,
    userName: me.name,
    comments: `Handover automation completed. Auto-generated Client Contract ${contractNumber} (₹${projectBudget.toLocaleString("en-IN")}), 6 baseline budget packages, and 6-stage milestone billing schedule.`,
    metadata: {
      projectId: project.id,
      contractId: clientContractId,
      contractNumber,
      advancePercent,
      retentionPercent,
      abgRequired,
      abgAmount,
      dlpMonths,
      paymentTermsDays,
      budget: projectBudget,
    },
  });

  // 9. Real-time Notification
  await db.insert(notificationsTable).values({
    userId: lead.ownerId ?? me.id,
    notificationType: "project_created",
    title: "Project Handover & Contract Generated",
    message: `${lead.customerName} (${lead.leadNumber}) successfully converted to project "${project.name}". Auto-generated Client Contract ${contractNumber}, baseline budget, and 6 milestone billing schedules.`,
  });

  res.status(201).json({
    ...numKeys(project, ["budget"]),
    contractId: clientContractId,
    contractNumber,
    milestonesCount: milestoneTemplates.length,
    budgetPackagesCount: standardPackages.length,
  });
});

export default router;
