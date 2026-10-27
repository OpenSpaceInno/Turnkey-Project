import { Router, type IRouter } from "express";
import { eq, desc, asc, and, like } from "drizzle-orm";
import {
  db,
  expensesTable,
  invoicesTable,
  vendorInvoicesTable,
  financialInstrumentsTable,
  raBillsTable,
  projectsTable,
  vendorsTable,
  usersTable,
  notificationsTable,
} from "@workspace/db";
import { numKeys } from "../lib/transforms";
import { getCurrentUser } from "../lib/session";
import { generateNumber } from "../lib/numbers";
import { logFinancialAudit } from "./financial-audit";
import { sendWorkflowEmail } from "../lib/email-service";

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
  const result = await db
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
    });
  
  // MySQL returns insertId - use it to fetch the created record
  const insertId = Number(result[0].insertId);
  const [e] = await db
    .select()
    .from(expensesTable)
    .where(eq(expensesTable.id, insertId))
    .limit(1);

  if (e) {
    await logFinancialAudit({
      workflowType: "AP",
      entityType: "site_expense",
      entityId: e.id,
      action: "EXPENSE_CREATED",
      newStatus: e.status,
      userId: me.id,
      userName: me.name,
      comments: `Site direct expense logged: ${e.description}`,
      metadata: {
        projectId: e.projectId,
        amount: Number(e.amount),
        category: e.category,
        description: e.description,
        expenseDate: e.expenseDate,
      },
    });
  }
  
  res.status(201).json(fAmt(e!));
});

router.patch("/expenses/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  const me = await getCurrentUser();

  const [existing] = await db
    .select()
    .from(expensesTable)
    .where(eq(expensesTable.id, id))
    .limit(1);

  if (!existing) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const update: Record<string, unknown> = {};
  if (req.body?.status !== undefined) {
    update.status = req.body.status;
    if (req.body.status === "approved" && !existing.approvedById) {
      update.approvedById = me.id;
    }
  }
  if (req.body?.description !== undefined) update.description = req.body.description;
  if (req.body?.amount !== undefined) update.amount = String(req.body.amount);
  if (req.body?.category !== undefined) update.category = req.body.category;
  
  await db
    .update(expensesTable)
    .set(update)
    .where(eq(expensesTable.id, id));
  
  // MySQL doesn't support .returning() - query after update
  const [e] = await db
    .select()
    .from(expensesTable)
    .where(eq(expensesTable.id, id))
    .limit(1);
  
  if (!e) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  await logFinancialAudit({
    workflowType: "AP",
    entityType: "site_expense",
    entityId: e.id,
    action: `EXPENSE_${String(e.status).toUpperCase()}`,
    previousStatus: existing.status,
    newStatus: e.status,
    userId: me.id,
    userName: me.name,
    comments: req.body?.comments || `Site expense status updated from ${existing.status} to ${e.status}`,
    metadata: {
      projectId: e.projectId,
      amount: Number(e.amount),
      category: e.category,
      description: e.description,
      expenseDate: e.expenseDate,
    },
  });

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
  const invoiceNumber =
    b.invoiceNumber || (await generateNumber("INV", invoicesTable));
  const result = await db
    .insert(invoicesTable)
    .values({
      projectId: b.projectId,
      invoiceNumber,
      clientName: b.clientName,
      amount: String(b.amount),
      invoiceDate: b.invoiceDate,
      dueDate: b.dueDate,
      status: b.status ?? "draft",
      documentUrl: b.documentUrl ?? null,
    });
  
  // MySQL returns insertId - use it to fetch the created record
  const insertId = Number(result[0].insertId);
  const [i] = await db
    .select()
    .from(invoicesTable)
    .where(eq(invoicesTable.id, insertId))
    .limit(1);
  
  res.status(201).json(fAmt(i!));
});

router.patch("/invoices/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  const b = req.body ?? {};
  const update: Record<string, unknown> = {};
  if (b.status !== undefined) update.status = b.status;
  if (b.paymentDate !== undefined) update.paymentDate = b.paymentDate;
  if (b.reconciled !== undefined) update.reconciled = b.reconciled;
  if (b.documentUrl !== undefined) update.documentUrl = b.documentUrl;
  
  await db
    .update(invoicesTable)
    .set(update)
    .where(eq(invoicesTable.id, id));
  
  // MySQL doesn't support .returning() - query after update
  const [i] = await db
    .select()
    .from(invoicesTable)
    .where(eq(invoicesTable.id, id))
    .limit(1);
  
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
  const invoiceNumber =
    b.invoiceNumber || (await generateNumber("VINV", vendorInvoicesTable));
  const result = await db
    .insert(vendorInvoicesTable)
    .values({
      projectId: b.projectId,
      vendorId: b.vendorId,
      purchaseOrderId: b.purchaseOrderId ?? null,
      invoiceNumber,
      amount: String(b.amount),
      status: b.status ?? "received",
      documentUrl: b.documentUrl ?? null,
    });
  
  // MySQL returns insertId - use it to fetch the created record
  const insertId = Number(result[0].insertId);
  const [vi] = await db
    .select()
    .from(vendorInvoicesTable)
    .where(eq(vendorInvoicesTable.id, insertId))
    .limit(1);
  
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
  if (b.documentUrl !== undefined) update.documentUrl = b.documentUrl;
  
  await db
    .update(vendorInvoicesTable)
    .set(update)
    .where(eq(vendorInvoicesTable.id, id));
  
  // MySQL doesn't support .returning() - query after update
  const [vi] = await db
    .select()
    .from(vendorInvoicesTable)
    .where(eq(vendorInvoicesTable.id, id))
    .limit(1);
  
  if (!vi) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(fAmt(vi));
});

// Financial Instruments & 30-Day Expiry Alerts
router.get("/financial-instruments", async (_req, res): Promise<void> => {
  const rows = await db
    .select({ f: financialInstrumentsTable, p: projectsTable.name })
    .from(financialInstrumentsTable)
    .leftJoin(
      projectsTable,
      eq(projectsTable.id, financialInstrumentsTable.projectId),
    )
    .orderBy(desc(financialInstrumentsTable.createdAt));

  const today = new Date();
  res.json(
    rows.map((r) => {
      const expDate = r.f.expiryDate ? new Date(r.f.expiryDate) : null;
      let daysToExpiry: number | null = null;
      let isExpiringSoon = false;
      let isExpired = false;
      let alertLevel: "none" | "info" | "warning" | "critical" = "none";
      let alertMessage = "";

      if (r.f.status === "active" && expDate) {
        daysToExpiry = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (daysToExpiry < 0) {
          isExpired = true;
          alertLevel = "critical";
          alertMessage = `Expired ${Math.abs(daysToExpiry)} days ago`;
        } else if (daysToExpiry === 0) {
          isExpiringSoon = true;
          alertLevel = "critical";
          alertMessage = "Expires today";
        } else if (daysToExpiry <= 15) {
          isExpiringSoon = true;
          alertLevel = "critical";
          alertMessage = `Expires in ${daysToExpiry} days (Urgent action)`;
        } else if (daysToExpiry <= 30) {
          isExpiringSoon = true;
          alertLevel = "warning";
          alertMessage = `Expires in ${daysToExpiry} days`;
        } else if (daysToExpiry <= 60) {
          alertLevel = "info";
          alertMessage = `Expires in ${daysToExpiry} days`;
        }
      }

      return {
        ...fInst(r.f),
        projectName: r.p,
        instrumentNumber: r.f.referenceNumber,
        daysToExpiry,
        isExpiringSoon,
        isExpired,
        alertLevel,
        alertMessage,
      };
    }),
  );
});

// GET /api/financial-instruments/expiring-alerts - Summary of instruments expiring within 30 days
router.get("/financial-instruments/expiring-alerts", async (_req, res): Promise<void> => {
  try {
    const today = new Date();
    const rows = await db
      .select({ f: financialInstrumentsTable, p: projectsTable.name })
      .from(financialInstrumentsTable)
      .leftJoin(
        projectsTable,
        eq(projectsTable.id, financialInstrumentsTable.projectId),
      )
      .orderBy(asc(financialInstrumentsTable.expiryDate));

    let totalActiveCount = 0;
    let totalActiveAmount = 0;
    let expiring30DaysCount = 0;
    let expiring30DaysAmount = 0;
    let urgent15DaysCount = 0;
    let expiredCount = 0;
    let expiredAmount = 0;

    const enriched = rows.map((r) => {
      const expDate = r.f.expiryDate ? new Date(r.f.expiryDate) : null;
      let daysToExpiry: number | null = null;
      let isExpiringSoon = false;
      let isExpired = false;
      let alertLevel: "none" | "info" | "warning" | "critical" = "none";
      let alertMessage = "";

      const amt = Number(r.f.amount || 0);

      if (r.f.status === "active") {
        totalActiveCount++;
        totalActiveAmount += amt;

        if (expDate) {
          daysToExpiry = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          if (daysToExpiry < 0) {
            isExpired = true;
            alertLevel = "critical";
            alertMessage = `Expired ${Math.abs(daysToExpiry)} days ago`;
            expiredCount++;
            expiredAmount += amt;
          } else if (daysToExpiry <= 15) {
            isExpiringSoon = true;
            alertLevel = "critical";
            alertMessage = `Expires in ${daysToExpiry} days (Urgent Renewal/Claim)`;
            expiring30DaysCount++;
            urgent15DaysCount++;
            expiring30DaysAmount += amt;
          } else if (daysToExpiry <= 30) {
            isExpiringSoon = true;
            alertLevel = "warning";
            alertMessage = `Expires in ${daysToExpiry} days`;
            expiring30DaysCount++;
            expiring30DaysAmount += amt;
          } else if (daysToExpiry <= 60) {
            alertLevel = "info";
            alertMessage = `Expires in ${daysToExpiry} days`;
          }
        }
      }

      return {
        ...fInst(r.f),
        projectName: r.p,
        instrumentNumber: r.f.referenceNumber,
        daysToExpiry,
        isExpiringSoon,
        isExpired,
        alertLevel,
        alertMessage,
      };
    });

    const expiringList = enriched.filter((i) => i.isExpiringSoon || i.isExpired);

    // Auto-create in-app notification alerts for instruments expiring within 30 days
    for (const expInst of expiringList) {
      if (expInst.daysToExpiry !== null && expInst.daysToExpiry >= 0 && expInst.daysToExpiry <= 30) {
        const identifier = expInst.instrumentNumber || String(expInst.id);
        const existing = await db
          .select()
          .from(notificationsTable)
          .where(
            and(
              eq(notificationsTable.notificationType, "instrument_expiry_alert"),
              like(notificationsTable.title, `%${identifier}%`)
            )
          )
          .limit(1);

        if (existing.length === 0) {
          const alertTitle = `Financial Instrument Expiring in ${expInst.daysToExpiry} Days: ${identifier}`;
          const alertMessage = `${(expInst.instrumentType || "").toUpperCase()} for ${expInst.projectName || "Site"} (₹${Number(expInst.amount).toLocaleString("en-IN")}) expires on ${expInst.expiryDate}. Please take renewal, claim, or release action.`;
          
          await db.insert(notificationsTable).values({
            notificationType: "instrument_expiring",
            title: alertTitle,
            message: alertMessage,
            isRead: false,
          });

          // Also dispatch email notification to current finance user / admin
          if (me.email) {
            sendWorkflowEmail({
              to: me.email,
              recipientName: me.name,
              userId: me.id,
              eventType: "instrument_expiring",
              subject: `[Critical Alert] ${alertTitle}`,
              title: alertTitle,
              message: alertMessage,
              actionUrl: "/finance",
              actionLabel: "Manage Financial Instruments",
              metadata: {
                instrumentType: expInst.instrumentType,
                instrumentNumber: identifier,
                bankName: expInst.bankName || "Bank",
                amount: `₹ ${Number(expInst.amount).toLocaleString("en-IN")}`,
                expiryDate: expInst.expiryDate,
                daysRemaining: `${expInst.daysToExpiry} Days`,
              },
            }).catch((err) => console.warn("Failed to dispatch instrument expiry email:", err));
          }
        }
      }
    }

    res.json({
      asOfDate: today.toISOString().split("T")[0],
      totalInstruments: rows.length,
      totalActiveCount,
      totalActiveAmount,
      expiring30DaysCount,
      expiring30DaysAmount,
      urgent15DaysCount,
      expiredCount,
      expiredAmount,
      expiringInstruments: expiringList,
    });
  } catch (err: any) {
    console.error("Error fetching financial instrument alerts:", err);
    res.status(500).json({ error: "Failed to generate instrument expiry alerts" });
  }
});

router.post("/financial-instruments", async (req, res): Promise<void> => {
  const b = req.body ?? {};
  const me = await getCurrentUser();
  await db
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
      referenceNumber:
        b.referenceNumber ||
        b.instrumentNumber ||
        (await generateNumber("FI", financialInstrumentsTable)),
      retentionPercent:
        b.retentionPercent != null ? String(b.retentionPercent) : null,
      status: b.status ?? "active",
      notes: b.notes ?? null,
      createdById: me.id,
    });
  
  // MySQL doesn't support .returning() - query after insert
  const [f] = await db
    .select()
    .from(financialInstrumentsTable)
    .orderBy(desc(financialInstrumentsTable.id))
    .limit(1);
  
  res.status(201).json(fInst(f!));
});

router.post("/financial-instruments/:id/renew", async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const { newExpiryDate, renewalReference, notes } = req.body || {};
    if (!newExpiryDate) {
      res.status(400).json({ error: "newExpiryDate is required" });
      return;
    }
    const [inst] = await db
      .select()
      .from(financialInstrumentsTable)
      .where(eq(financialInstrumentsTable.id, id));
    if (!inst) {
      res.status(404).json({ error: "Financial instrument not found" });
      return;
    }
    const todayStr = new Date().toISOString().split("T")[0];
    const updatedNotes = `${inst.notes || ""}\n[Renewal ${todayStr}]: Extended to ${newExpiryDate}. Endorsement Ref: ${renewalReference || "Bank Confirmation"}. ${notes || ""}`.trim();
    
    await db
      .update(financialInstrumentsTable)
      .set({
        expiryDate: newExpiryDate,
        notes: updatedNotes,
        status: "active",
      })
      .where(eq(financialInstrumentsTable.id, id));

    const [updated] = await db
      .select({ f: financialInstrumentsTable, p: projectsTable.name })
      .from(financialInstrumentsTable)
      .leftJoin(projectsTable, eq(projectsTable.id, financialInstrumentsTable.projectId))
      .where(eq(financialInstrumentsTable.id, id));

    res.json({
      success: true,
      message: `Successfully extended validity of ${updated.f.referenceNumber} to ${newExpiryDate}`,
      instrument: { ...fInst(updated.f), projectName: updated.p },
    });
  } catch (err: any) {
    console.error("Error renewing financial instrument:", err);
    res.status(500).json({ error: "Failed to renew financial instrument" });
  }
});

router.post("/financial-instruments/:id/release", async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const { releaseDate, notes } = req.body || {};
    const relDate = releaseDate || new Date().toISOString().split("T")[0];
    
    const [inst] = await db
      .select()
      .from(financialInstrumentsTable)
      .where(eq(financialInstrumentsTable.id, id));
    if (!inst) {
      res.status(404).json({ error: "Financial instrument not found" });
      return;
    }
    
    const updatedNotes = `${inst.notes || ""}\n[Released ${relDate}]: ${notes || "Discharge certificate received."}`.trim();
    await db
      .update(financialInstrumentsTable)
      .set({
        status: "released",
        releaseDate: relDate,
        notes: updatedNotes,
      })
      .where(eq(financialInstrumentsTable.id, id));

    res.json({ success: true, message: `Financial instrument ${inst.referenceNumber} successfully marked as released` });
  } catch (err: any) {
    console.error("Error releasing financial instrument:", err);
    res.status(500).json({ error: "Failed to release financial instrument" });
  }
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
  
  await db
    .update(financialInstrumentsTable)
    .set(update)
    .where(eq(financialInstrumentsTable.id, id));
  
  // MySQL doesn't support .returning() - query after update
  const [updated] = await db
    .select()
    .from(financialInstrumentsTable)
    .where(eq(financialInstrumentsTable.id, id))
    .limit(1);
  
  if (!updated) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(fInst(updated));
});

// RA Bills (Running Account Bills)
const fRa = (r: Record<string, unknown>) => numKeys(r, ["amount"]);

router.get("/ra-bills", async (req, res): Promise<void> => {
  const projectId = req.query.projectId
    ? parseInt(req.query.projectId as string, 10)
    : null;
  const baseQuery = db
    .select({ r: raBillsTable, p: projectsTable.name })
    .from(raBillsTable)
    .leftJoin(projectsTable, eq(projectsTable.id, raBillsTable.projectId));
  const rows = projectId
    ? await baseQuery.where(eq(raBillsTable.projectId, projectId)).orderBy(desc(raBillsTable.createdAt))
    : await baseQuery.orderBy(desc(raBillsTable.createdAt));
  res.json(rows.map((r) => ({ ...fRa(r.r), projectName: r.p })));
});

router.post("/ra-bills", async (req, res): Promise<void> => {
  const b = req.body ?? {};
  const me = await getCurrentUser();
  const billNumber = b.billNumber || (await generateNumber("RA", raBillsTable, "billNumber"));
  const result = await db
    .insert(raBillsTable)
    .values({
      projectId: b.projectId,
      billNumber,
      description: b.description ?? null,
      amount: String(b.amount),
      milestone: b.milestone ?? null,
      status: b.status ?? "draft",
      documentUrl: b.documentUrl ?? null,
      createdById: me.id,
    });
  
  const insertId = Number(result[0].insertId);
  const [bill] = await db
    .select({ r: raBillsTable, p: projectsTable.name })
    .from(raBillsTable)
    .leftJoin(projectsTable, eq(projectsTable.id, raBillsTable.projectId))
    .where(eq(raBillsTable.id, insertId))
    .limit(1);
  
  res.status(201).json({ ...fRa(bill!.r), projectName: bill!.p });
});

router.patch("/ra-bills/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  const b = req.body ?? {};
  const update: Record<string, unknown> = {};
  if (b.status !== undefined) update.status = b.status;
  if (b.description !== undefined) update.description = b.description;
  if (b.amount !== undefined) update.amount = String(b.amount);
  if (b.documentUrl !== undefined) update.documentUrl = b.documentUrl;
  
  await db
    .update(raBillsTable)
    .set(update)
    .where(eq(raBillsTable.id, id));
  
  const [bill] = await db
    .select({ r: raBillsTable, p: projectsTable.name })
    .from(raBillsTable)
    .leftJoin(projectsTable, eq(projectsTable.id, raBillsTable.projectId))
    .where(eq(raBillsTable.id, id))
    .limit(1);
  
  if (!bill) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({ ...fRa(bill.r), projectName: bill.p });
});

export default router;
