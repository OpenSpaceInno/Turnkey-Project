import { Router, type IRouter } from "express";
import { eq, sql, asc, desc } from "drizzle-orm";
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
} from "@workspace/db";
import { numKeys, num } from "../lib/transforms";
import { getCurrentUser } from "../lib/session";

const router: IRouter = Router();

const NUMERIC_LEAD = ["budgetEstimate"] as const;
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
    .select({ c: sql<number>`count(*)::int` })
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

router.get("/leads", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      l: leadsTable,
      ownerName: usersTable.name,
    })
    .from(leadsTable)
    .leftJoin(usersTable, eq(usersTable.id, leadsTable.ownerId))
    .orderBy(desc(leadsTable.createdAt));
  res.json(rows.map((r) => ({ ...formatLead(r.l), ownerName: r.ownerName })));
});

router.get("/leads/summary", async (_req, res): Promise<void> => {
  const [totals] = await db
    .select({
      total: sql<number>`count(*)::int`,
      qualified: sql<number>`count(*) filter (where status = 'qualified')::int`,
      won: sql<number>`count(*) filter (where status = 'won')::int`,
      pipeline: sql<string>`coalesce(sum(budget_estimate) filter (where status not in ('lost','won')),0)::text`,
    })
    .from(leadsTable);
  const byStage = await db
    .select({
      stage: leadsTable.stage,
      count: sql<number>`count(*)::int`,
      value: sql<string>`coalesce(sum(budget_estimate),0)::text`,
    })
    .from(leadsTable)
    .groupBy(leadsTable.stage);
  const byStatus = await db
    .select({
      status: leadsTable.status,
      count: sql<number>`count(*)::int`,
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
  const body = req.body ?? {};
  if (!body.customerName) {
    res.status(400).json({ error: "customerName required" });
    return;
  }
  const me = await getCurrentUser();
  const leadNumber = await genLeadNumber();
  const [lead] = await db
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
    })
    .returning();
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
  ]) {
    if (body[k] !== undefined) update[k] = body[k];
  }
  if (body.budgetEstimate !== undefined) {
    update.budgetEstimate =
      body.budgetEstimate == null ? null : String(body.budgetEstimate);
  }
  const [lead] = await db
    .update(leadsTable)
    .set(update)
    .where(eq(leadsTable.id, id))
    .returning();
  if (!lead) {
    res.status(404).json({ error: "Lead not found" });
    return;
  }
  res.json(formatLead(lead));
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
  const [act] = await db
    .insert(leadActivitiesTable)
    .values({
      leadId,
      activityType: req.body?.activityType ?? "note",
      title: req.body?.title ?? "",
      description: req.body?.description ?? null,
      createdById: me.id,
    })
    .returning();
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
  const [v] = await db
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
    })
    .returning();
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
  const [v] = await db
    .update(siteVisitsTable)
    .set(update)
    .where(eq(siteVisitsTable.id, id))
    .returning();
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
  const [d] = await db
    .insert(drawingsTable)
    .values({
      leadId,
      fileName: b.fileName,
      fileType: b.fileType ?? null,
      fileSize: b.fileSize ?? null,
      fileUrl: b.fileUrl ?? null,
      version: b.version ?? 1,
      uploadedById: me.id,
    })
    .returning();
  res.status(201).json({ ...d, uploadedByName: me.name });
});

router.patch("/drawings/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  const b = req.body ?? {};
  const update: Record<string, unknown> = {};
  if (b.status !== undefined) update.status = b.status;
  if (b.reviewerComments !== undefined)
    update.reviewerComments = b.reviewerComments;
  const [d] = await db
    .update(drawingsTable)
    .set(update)
    .where(eq(drawingsTable.id, id))
    .returning();
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
  const [boq] = await db
    .insert(boqsTable)
    .values({ leadId, version: nextV, createdById: me.id })
    .returning();
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

router.patch("/boqs/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  const update: Record<string, unknown> = {};
  if (req.body?.status !== undefined) update.status = req.body.status;
  const [boq] = await db
    .update(boqsTable)
    .set(update)
    .where(eq(boqsTable.id, id))
    .returning();
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
  const [item] = await db
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
    })
    .returning();
  await recomputeBoq(boqId);
  res.status(201).json(formatBoqItem(item!));
});

router.delete("/boq-items/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  const [item] = await db
    .delete(boqItemsTable)
    .where(eq(boqItemsTable.id, id))
    .returning();
  if (item) await recomputeBoq(item.boqId);
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
  const [neg] = await db
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
    })
    .returning();
  res.status(201).json(formatNeg(neg!));
});

router.patch("/negotiations/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  const update: Record<string, unknown> = {};
  if (req.body?.status !== undefined) update.status = req.body.status;
  if (req.body?.notes !== undefined) update.notes = req.body.notes;
  const [neg] = await db
    .update(negotiationsTable)
    .set(update)
    .where(eq(negotiationsTable.id, id))
    .returning();
  if (!neg) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(formatNeg(neg));
});

export default router;
