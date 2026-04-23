import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import {
  db,
  expensesTable,
  invoicesTable,
  vendorInvoicesTable,
  financialInstrumentsTable,
  projectsTable,
  vendorsTable,
  usersTable,
} from "@workspace/db";
import { numKeys } from "../lib/transforms";
import { getCurrentUser } from "../lib/session";

const router: IRouter = Router();

const fAmt = (r: Record<string, unknown>) => numKeys(r, ["amount"]);
const fInst = (r: Record<string, unknown>) =>
  numKeys(r, ["amount", "retentionPercent"]);

// Expenses
router.get("/expenses", async (req, res): Promise<void> => {
  const projectId = req.query.projectId
    ? parseInt(req.query.projectId as string, 10)
    : null;
  const baseQuery = db
    .select({
      e: expensesTable,
      p: projectsTable.name,
      u: usersTable.name,
    })
    .from(expensesTable)
    .leftJoin(projectsTable, eq(projectsTable.id, expensesTable.projectId))
    .leftJoin(usersTable, eq(usersTable.id, expensesTable.submittedById));
  const rows = projectId
    ? await baseQuery.where(eq(expensesTable.projectId, projectId)).orderBy(desc(expensesTable.expenseDate))
    : await baseQuery.orderBy(desc(expensesTable.expenseDate));
  res.json(
    rows.map((r) => ({
      ...fAmt(r.e),
      projectName: r.p,
      submittedByName: r.u,
    })),
  );
});

router.post("/expenses", async (req, res): Promise<void> => {
  const b = req.body ?? {};
  const me = await getCurrentUser();
  const [e] = await db
    .insert(expensesTable)
    .values({
      projectId: b.projectId,
      description: b.description,
      amount: String(b.amount),
      category: b.category,
      expenseDate: b.expenseDate,
      receiptUrl: b.receiptUrl ?? null,
      status: b.status ?? "draft",
      submittedById: me.id,
    })
    .returning();
  res.status(201).json(fAmt(e!));
});

router.patch("/expenses/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  const update: Record<string, unknown> = {};
  if (req.body?.status !== undefined) update.status = req.body.status;
  const [e] = await db
    .update(expensesTable)
    .set(update)
    .where(eq(expensesTable.id, id))
    .returning();
  if (!e) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(fAmt(e));
});

// Invoices
router.get("/invoices", async (req, res): Promise<void> => {
  const projectId = req.query.projectId
    ? parseInt(req.query.projectId as string, 10)
    : null;
  const baseQuery = db
    .select({ i: invoicesTable, p: projectsTable.name })
    .from(invoicesTable)
    .leftJoin(projectsTable, eq(projectsTable.id, invoicesTable.projectId));
  const rows = projectId
    ? await baseQuery.where(eq(invoicesTable.projectId, projectId)).orderBy(desc(invoicesTable.invoiceDate))
    : await baseQuery.orderBy(desc(invoicesTable.invoiceDate));
  res.json(rows.map((r) => ({ ...fAmt(r.i), projectName: r.p })));
});

router.post("/invoices", async (req, res): Promise<void> => {
  const b = req.body ?? {};
  const [i] = await db
    .insert(invoicesTable)
    .values({
      projectId: b.projectId,
      invoiceNumber: b.invoiceNumber,
      clientName: b.clientName,
      amount: String(b.amount),
      invoiceDate: b.invoiceDate,
      dueDate: b.dueDate,
    })
    .returning();
  res.status(201).json(fAmt(i!));
});

router.patch("/invoices/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  const b = req.body ?? {};
  const update: Record<string, unknown> = {};
  if (b.status !== undefined) update.status = b.status;
  if (b.paymentDate !== undefined) update.paymentDate = b.paymentDate;
  if (b.reconciled !== undefined) update.reconciled = b.reconciled;
  const [i] = await db
    .update(invoicesTable)
    .set(update)
    .where(eq(invoicesTable.id, id))
    .returning();
  if (!i) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(fAmt(i));
});

// Vendor Invoices
router.get("/vendor-invoices", async (req, res): Promise<void> => {
  const projectId = req.query.projectId
    ? parseInt(req.query.projectId as string, 10)
    : null;
  const baseQuery = db
    .select({
      v: vendorInvoicesTable,
      p: projectsTable.name,
      vn: vendorsTable.name,
    })
    .from(vendorInvoicesTable)
    .leftJoin(projectsTable, eq(projectsTable.id, vendorInvoicesTable.projectId))
    .leftJoin(vendorsTable, eq(vendorsTable.id, vendorInvoicesTable.vendorId));
  const rows = projectId
    ? await baseQuery.where(eq(vendorInvoicesTable.projectId, projectId)).orderBy(desc(vendorInvoicesTable.createdAt))
    : await baseQuery.orderBy(desc(vendorInvoicesTable.createdAt));
  res.json(
    rows.map((r) => ({
      ...fAmt(r.v),
      projectName: r.p,
      vendorName: r.vn,
    })),
  );
});

router.post("/vendor-invoices", async (req, res): Promise<void> => {
  const b = req.body ?? {};
  const [vi] = await db
    .insert(vendorInvoicesTable)
    .values({
      projectId: b.projectId,
      vendorId: b.vendorId,
      purchaseOrderId: b.purchaseOrderId ?? null,
      invoiceNumber: b.invoiceNumber,
      amount: String(b.amount),
    })
    .returning();
  res.status(201).json(fAmt(vi!));
});

router.patch("/vendor-invoices/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  const b = req.body ?? {};
  const update: Record<string, unknown> = {};
  if (b.status !== undefined) update.status = b.status;
  if (b.discrepancyNotes !== undefined)
    update.discrepancyNotes = b.discrepancyNotes;
  if (b.paymentDate !== undefined) update.paymentDate = b.paymentDate;
  const [vi] = await db
    .update(vendorInvoicesTable)
    .set(update)
    .where(eq(vendorInvoicesTable.id, id))
    .returning();
  if (!vi) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(fAmt(vi));
});

// Financial Instruments
router.get("/financial-instruments", async (_req, res): Promise<void> => {
  const rows = await db
    .select({ f: financialInstrumentsTable, p: projectsTable.name })
    .from(financialInstrumentsTable)
    .leftJoin(
      projectsTable,
      eq(projectsTable.id, financialInstrumentsTable.projectId),
    )
    .orderBy(desc(financialInstrumentsTable.createdAt));
  res.json(rows.map((r) => ({ ...fInst(r.f), projectName: r.p })));
});

router.post("/financial-instruments", async (req, res): Promise<void> => {
  const b = req.body ?? {};
  const me = await getCurrentUser();
  const [f] = await db
    .insert(financialInstrumentsTable)
    .values({
      projectId: b.projectId ?? null,
      instrumentType: b.instrumentType,
      bgSubType: b.bgSubType ?? null,
      amount: String(b.amount),
      issueDate: b.issueDate ?? null,
      expiryDate: b.expiryDate ?? null,
      releaseDate: b.releaseDate ?? null,
      bankName: b.bankName ?? null,
      referenceNumber: b.referenceNumber ?? null,
      retentionPercent:
        b.retentionPercent != null ? String(b.retentionPercent) : null,
      status: b.status ?? "active",
      notes: b.notes ?? null,
      createdById: me.id,
    })
    .returning();
  res.status(201).json(fInst(f!));
});

router.patch("/financial-instruments/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  const b = req.body ?? {};
  const update: Record<string, unknown> = {};
  for (const k of [
    "instrumentType",
    "bgSubType",
    "issueDate",
    "expiryDate",
    "releaseDate",
    "bankName",
    "referenceNumber",
    "status",
    "notes",
    "projectId",
  ]) {
    if (b[k] !== undefined) update[k] = b[k];
  }
  if (b.amount !== undefined) update.amount = String(b.amount);
  if (b.retentionPercent !== undefined)
    update.retentionPercent =
      b.retentionPercent == null ? null : String(b.retentionPercent);
  const [f] = await db
    .update(financialInstrumentsTable)
    .set(update)
    .where(eq(financialInstrumentsTable.id, id))
    .returning();
  if (!f) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(fInst(f));
});

export default router;
