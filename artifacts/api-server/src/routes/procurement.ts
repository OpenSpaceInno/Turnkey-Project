import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import {
  db,
  vendorsTable,
  materialRequestsTable,
  rfqsTable,
  quotationsTable,
  purchaseOrdersTable,
  materialsTable,
  projectsTable,
  usersTable,
} from "@workspace/db";
import { numKeys } from "../lib/transforms";
import { getCurrentUser } from "../lib/session";
import { generateNumber } from "../lib/numbers";

const router: IRouter = Router();

const fVendor = (r: Record<string, unknown>) => numKeys(r, ["rating"]);
const fMatReq = (r: Record<string, unknown>) => numKeys(r, ["quantity"]);
const fQuote = (r: Record<string, unknown>) => numKeys(r, ["amount"]);
const fPo = (r: Record<string, unknown>) => numKeys(r, ["totalAmount"]);
const fMat = (r: Record<string, unknown>) =>
  numKeys(r, [
    "quantityOnHand",
    "quantityCommitted",
    "quantityConsumed",
    "minimumStock",
  ]);

// Vendors
router.get("/vendors", async (_req, res): Promise<void> => {
  const rows = await db.select().from(vendorsTable).orderBy(vendorsTable.name);
  res.json(rows.map(fVendor));
});

router.post("/vendors", async (req, res): Promise<void> => {
  const b = req.body ?? {};
  const [v] = await db
    .insert(vendorsTable)
    .values({
      name: b.name,
      contactPerson: b.contactPerson ?? null,
      email: b.email ?? null,
      phone: b.phone ?? null,
      address: b.address ?? null,
      category: b.category ?? null,
      rating: b.rating != null ? String(b.rating) : "0",
      status: b.status ?? "active",
    })
    .returning();
  res.status(201).json(fVendor(v!));
});

router.patch("/vendors/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  const b = req.body ?? {};
  const update: Record<string, unknown> = {};
  for (const k of [
    "name",
    "contactPerson",
    "email",
    "phone",
    "address",
    "category",
    "status",
  ]) {
    if (b[k] !== undefined) update[k] = b[k];
  }
  if (b.rating !== undefined) update.rating = String(b.rating);
  const [v] = await db
    .update(vendorsTable)
    .set(update)
    .where(eq(vendorsTable.id, id))
    .returning();
  if (!v) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(fVendor(v));
});

// Material Requests
router.get("/material-requests", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      m: materialRequestsTable,
      p: projectsTable.name,
      u: usersTable.name,
    })
    .from(materialRequestsTable)
    .leftJoin(projectsTable, eq(projectsTable.id, materialRequestsTable.projectId))
    .leftJoin(usersTable, eq(usersTable.id, materialRequestsTable.createdById))
    .orderBy(desc(materialRequestsTable.createdAt));
  res.json(
    rows.map((r) => ({ ...fMatReq(r.m), projectName: r.p, createdByName: r.u })),
  );
});

router.post("/material-requests", async (req, res): Promise<void> => {
  const b = req.body ?? {};
  const me = await getCurrentUser();
  const [m] = await db
    .insert(materialRequestsTable)
    .values({
      projectId: b.projectId,
      title: b.title,
      description: b.description ?? null,
      quantity: String(b.quantity),
      unit: b.unit,
      createdById: me.id,
    })
    .returning();
  res.status(201).json(fMatReq(m!));
});

router.patch("/material-requests/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  const update: Record<string, unknown> = {};
  if (req.body?.status !== undefined) update.status = req.body.status;
  const [m] = await db
    .update(materialRequestsTable)
    .set(update)
    .where(eq(materialRequestsTable.id, id))
    .returning();
  if (!m) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(fMatReq(m));
});

// RFQs
router.get("/rfqs", async (_req, res): Promise<void> => {
  const rows = await db
    .select({ r: rfqsTable, p: projectsTable.name })
    .from(rfqsTable)
    .leftJoin(projectsTable, eq(projectsTable.id, rfqsTable.projectId))
    .orderBy(desc(rfqsTable.createdAt));
  res.json(rows.map((r) => ({ ...r.r, projectName: r.p })));
});

router.post("/rfqs", async (req, res): Promise<void> => {
  const b = req.body ?? {};
  const me = await getCurrentUser();
  const [r] = await db
    .insert(rfqsTable)
    .values({
      projectId: b.projectId,
      materialRequestId: b.materialRequestId ?? null,
      title: b.title,
      description: b.description ?? null,
      createdById: me.id,
    })
    .returning();
  res.status(201).json(r);
});

router.get("/rfqs/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  const [r] = await db
    .select({ r: rfqsTable, p: projectsTable.name })
    .from(rfqsTable)
    .leftJoin(projectsTable, eq(projectsTable.id, rfqsTable.projectId))
    .where(eq(rfqsTable.id, id));
  if (!r) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const quotations = await db
    .select({ q: quotationsTable, vn: vendorsTable.name })
    .from(quotationsTable)
    .leftJoin(vendorsTable, eq(vendorsTable.id, quotationsTable.vendorId))
    .where(eq(quotationsTable.rfqId, id));
  res.json({
    ...r.r,
    projectName: r.p,
    quotations: quotations.map((q) => ({ ...fQuote(q.q), vendorName: q.vn })),
  });
});

router.patch("/rfqs/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  const b = req.body ?? {};
  const update: Record<string, unknown> = {};
  for (const k of ["status", "title", "description"]) {
    if (b[k] !== undefined) update[k] = b[k];
  }
  const [r] = await db
    .update(rfqsTable)
    .set(update)
    .where(eq(rfqsTable.id, id))
    .returning();
  if (!r) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(r);
});

router.post("/rfqs/:rfqId/quotations", async (req, res): Promise<void> => {
  const rfqId = parseInt(req.params.rfqId as string, 10);
  const b = req.body ?? {};
  const [q] = await db
    .insert(quotationsTable)
    .values({
      rfqId,
      vendorId: b.vendorId,
      amount: String(b.amount),
      deliveryDays: b.deliveryDays,
      notes: b.notes ?? null,
    })
    .returning();
  await db
    .update(rfqsTable)
    .set({ status: "quotes_received" })
    .where(eq(rfqsTable.id, rfqId));
  res.status(201).json(fQuote(q!));
});

router.post("/quotations/:id/select", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  const [q] = await db
    .select()
    .from(quotationsTable)
    .where(eq(quotationsTable.id, id));
  if (!q) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  await db
    .update(quotationsTable)
    .set({ isSelected: false })
    .where(eq(quotationsTable.rfqId, q.rfqId));
  const [updated] = await db
    .update(quotationsTable)
    .set({ isSelected: true })
    .where(eq(quotationsTable.id, id))
    .returning();
  await db
    .update(rfqsTable)
    .set({ status: "awarded" })
    .where(eq(rfqsTable.id, q.rfqId));
  res.json(fQuote(updated!));
});

// Purchase Orders
router.get("/purchase-orders", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      po: purchaseOrdersTable,
      p: projectsTable.name,
      vn: vendorsTable.name,
    })
    .from(purchaseOrdersTable)
    .leftJoin(projectsTable, eq(projectsTable.id, purchaseOrdersTable.projectId))
    .leftJoin(vendorsTable, eq(vendorsTable.id, purchaseOrdersTable.vendorId))
    .orderBy(desc(purchaseOrdersTable.createdAt));
  res.json(
    rows.map((r) => ({ ...fPo(r.po), projectName: r.p, vendorName: r.vn })),
  );
});

router.post("/purchase-orders", async (req, res): Promise<void> => {
  const b = req.body ?? {};
  const me = await getCurrentUser();
  const poNumber =
    b.poNumber || (await generateNumber("PO", purchaseOrdersTable));
  const [po] = await db
    .insert(purchaseOrdersTable)
    .values({
      projectId: b.projectId,
      vendorId: b.vendorId,
      poNumber,
      description: b.description ?? null,
      totalAmount: String(b.totalAmount),
      deliveryDate: b.deliveryDate ?? null,
      status: b.status ?? "draft",
      createdById: me.id,
    })
    .returning();
  res.status(201).json(fPo(po!));
});

router.patch("/purchase-orders/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  const b = req.body ?? {};
  const update: Record<string, unknown> = {};
  if (b.status !== undefined) update.status = b.status;
  if (b.inspectionStatus !== undefined)
    update.inspectionStatus = b.inspectionStatus;
  const [po] = await db
    .update(purchaseOrdersTable)
    .set(update)
    .where(eq(purchaseOrdersTable.id, id))
    .returning();
  if (!po) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(fPo(po));
});

// Materials
router.get("/materials", async (_req, res): Promise<void> => {
  const rows = await db
    .select({ m: materialsTable, p: projectsTable.name })
    .from(materialsTable)
    .leftJoin(projectsTable, eq(projectsTable.id, materialsTable.projectId))
    .orderBy(materialsTable.name);
  res.json(rows.map((r) => ({ ...fMat(r.m), projectName: r.p })));
});

router.post("/materials", async (req, res): Promise<void> => {
  const b = req.body ?? {};
  const [m] = await db
    .insert(materialsTable)
    .values({
      projectId: b.projectId ?? null,
      name: b.name,
      description: b.description ?? null,
      unit: b.unit,
      quantityOnHand: String(b.quantityOnHand ?? 0),
      quantityCommitted: String(b.quantityCommitted ?? 0),
      quantityConsumed: String(b.quantityConsumed ?? 0),
      minimumStock: String(b.minimumStock ?? 0),
    })
    .returning();
  res.status(201).json(fMat(m!));
});

router.patch("/materials/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  const b = req.body ?? {};
  const update: Record<string, unknown> = {};
  for (const k of ["projectId", "name", "description", "unit"]) {
    if (b[k] !== undefined) update[k] = b[k];
  }
  for (const k of [
    "quantityOnHand",
    "quantityCommitted",
    "quantityConsumed",
    "minimumStock",
  ]) {
    if (b[k] !== undefined) update[k] = String(b[k]);
  }
  const [m] = await db
    .update(materialsTable)
    .set(update)
    .where(eq(materialsTable.id, id))
    .returning();
  if (!m) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(fMat(m));
});

export default router;
