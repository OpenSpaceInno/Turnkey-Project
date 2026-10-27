import { Router, type IRouter, type Request, type Response } from "express";
import { eq, desc, asc, and, or, sql, inArray } from "drizzle-orm";
import {
  db,
  contractsTable,
  contractBoqItemsTable,
  workCompletionsTable,
  workCompletionItemsTable,
  raBillsTable,
  raBillItemsTable,
  raBillDocumentsTable,
  raBillApprovalHistoryTable,
  invoicesTable,
  invoicePaymentsTable,
  paymentRemindersTable,
  projectsTable,
  usersTable,
  companySettingsTable,
  notificationsTable,
} from "@workspace/db";
import { getCurrentUser } from "../lib/session";
import { generateNumber } from "../lib/numbers";
import { logFinancialAudit } from "./financial-audit";

const router: IRouter = Router();

// Helper to notify PMs & Finance
async function notifyRole(roles: string[], title: string, message: string, link: string) {
  try {
    const users = await db.select({ id: usersTable.id, roles: usersTable.roles }).from(usersTable);
    for (const u of users) {
      let r: string[] = [];
      if (typeof u.roles === "string") {
        try { r = JSON.parse(u.roles); } catch { r = []; }
      } else if (Array.isArray(u.roles)) {
        r = u.roles;
      }
      if (roles.some((role) => r.includes(role))) {
        await db.insert(notificationsTable).values({
          userId: u.id,
          notificationType: "ar_workflow",
          title,
          message,
          link,
          isRead: false,
        });
      }
    }
  } catch (err) {
    console.error("Error creating AR notifications:", err);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. AR SUMMARY & ANALYTICS (Receivables Overview)
// ═══════════════════════════════════════════════════════════════════════════
router.get("/summary", async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.query;
    const pId = projectId ? Number(projectId) : undefined;

    // Filter condition for projects
    const pCond = pId ? eq(invoicesTable.projectId, pId) : undefined;
    const raCond = pId ? and(eq(raBillsTable.projectId, pId), eq(raBillsTable.billType, "client")) : eq(raBillsTable.billType, "client");

    // Client Invoices
    const invoices = pCond
      ? await db.select().from(invoicesTable).where(pCond)
      : await db.select().from(invoicesTable);

    // Client RA Bills
    const raBills = await db.select().from(raBillsTable).where(raCond);

    // Calculate metrics
    let totalBilled = 0;
    let totalCollected = 0;
    let totalOutstanding = 0;
    let totalOverdue = 0;
    const today = new Date();

    const invoiceStatusCounts: Record<string, number> = {
      generated: 0,
      sent: 0,
      payment_pending: 0,
      partially_paid: 0,
      paid: 0,
      reconciled: 0,
      closed: 0,
    };

    // Ageing buckets
    const ageing = {
      current: 0, // 0-30 days
      days31_60: 0,
      days61_90: 0,
      days90Plus: 0,
    };

    for (const inv of invoices) {
      const net = Number(inv.netAmount || inv.amount || 0);
      const paid = Number(inv.totalPaidAmount || 0);
      const outstanding = Math.max(0, net - paid);

      totalBilled += net;
      totalCollected += paid;
      totalOutstanding += outstanding;

      const st = (inv.status || "draft").toLowerCase();
      if (invoiceStatusCounts[st] !== undefined) {
        invoiceStatusCounts[st]++;
      } else {
        invoiceStatusCounts[st] = 1;
      }

      // Check overdue & ageing
      if (inv.dueDate && outstanding > 0) {
        const dueDate = new Date(inv.dueDate);
        const diffDays = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays > 0) {
          totalOverdue += outstanding;
          if (diffDays <= 30) ageing.current += outstanding;
          else if (diffDays <= 60) ageing.days31_60 += outstanding;
          else if (diffDays <= 90) ageing.days61_90 += outstanding;
          else ageing.days90Plus += outstanding;
        } else {
          ageing.current += outstanding;
        }
      }
    }

    const raBillStatusCounts: Record<string, number> = {
      draft: 0,
      submitted: 0,
      revision_requested: 0,
      pm_approved: 0,
      payment_certified: 0,
      invoice_generated: 0,
      closed: 0,
    };

    for (const b of raBills) {
      const st = (b.status || "draft").toLowerCase();
      if (raBillStatusCounts[st] !== undefined) {
        raBillStatusCounts[st]++;
      } else {
        raBillStatusCounts[st] = 1;
      }
    }

    const collectionEfficiency = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0;

    res.json({
      totalBilled,
      totalCollected,
      totalOutstanding,
      totalOverdue,
      collectionEfficiency,
      invoiceCount: invoices.length,
      raBillCount: raBills.length,
      invoiceStatusCounts,
      raBillStatusCounts,
      ageing,
    });
  } catch (error: any) {
    console.error("Error generating AR summary:", error);
    res.status(500).json({ error: "Failed to generate AR summary" });
  }
});

// GET /api/ar/aging-report - Complete AR Aging Report (0-30, 31-60, 61-90, 90+ days)
router.get("/aging-report", async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId, clientId, bucket, asOfDate } = req.query;
    const refDate = asOfDate ? new Date(String(asOfDate)) : new Date();

    let query = db
      .select({
        inv: invoicesTable,
        projectName: projectsTable.name,
        projectClientName: projectsTable.clientName,
      })
      .from(invoicesTable)
      .leftJoin(projectsTable, eq(projectsTable.id, invoicesTable.projectId));

    const conditions: any[] = [];
    if (projectId && projectId !== "all") {
      conditions.push(eq(invoicesTable.projectId, Number(projectId)));
    }

    const rows = conditions.length > 0
      ? await query.where(and(...conditions)).orderBy(desc(invoicesTable.invoiceDate))
      : await query.orderBy(desc(invoicesTable.invoiceDate));

    let totalBilled = 0;
    let totalCollected = 0;
    let totalOutstanding = 0;
    let totalOverdue = 0;

    const buckets = {
      "0-30": { key: "0-30", label: "0–30 Days (Current)", amount: 0, count: 0, percentage: 0, color: "emerald", range: "0 to 30 days" },
      "31-60": { key: "31-60", label: "31–60 Days", amount: 0, count: 0, percentage: 0, color: "amber", range: "31 to 60 days" },
      "61-90": { key: "61-90", label: "61–90 Days", amount: 0, count: 0, percentage: 0, color: "orange", range: "61 to 90 days" },
      "90+": { key: "90+", label: "90+ Days (Critical)", amount: 0, count: 0, percentage: 0, color: "red", range: "More than 90 days" },
    };

    const clientMap = new Map<string, any>();

    const processedInvoices = rows.map((r) => {
      const inv = r.inv;
      const gross = Number(inv.grossAmount || inv.amount || 0);
      const net = Number(inv.netAmount || 0) > 0 ? Number(inv.netAmount) : Number(inv.amount || 0);
      const paid = Number(inv.totalPaidAmount || 0);
      const outstanding = Math.max(0, net - paid);

      totalBilled += net;
      totalCollected += paid;
      totalOutstanding += outstanding;

      const dueDate = inv.dueDate ? new Date(inv.dueDate) : new Date(inv.invoiceDate);
      const diffDays = Math.floor((refDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      const ageDays = Math.max(0, Math.floor((refDate.getTime() - new Date(inv.invoiceDate).getTime()) / (1000 * 60 * 60 * 24)));

      let bucketKey: "0-30" | "31-60" | "61-90" | "90+" = "0-30";
      let riskLevel: "low" | "medium" | "high" | "critical" = "low";

      if (outstanding > 0) {
        if (diffDays > 90) {
          bucketKey = "90+";
          riskLevel = "critical";
          totalOverdue += outstanding;
        } else if (diffDays > 60) {
          bucketKey = "61-90";
          riskLevel = "high";
          totalOverdue += outstanding;
        } else if (diffDays > 30) {
          bucketKey = "31-60";
          riskLevel = "medium";
          totalOverdue += outstanding;
        } else {
          bucketKey = "0-30";
          riskLevel = "low";
          if (diffDays > 0) totalOverdue += outstanding;
        }

        buckets[bucketKey].amount += outstanding;
        buckets[bucketKey].count += 1;
      }

      const clientName = inv.clientName || r.projectClientName || "Direct Client";

      if (!clientMap.has(clientName)) {
        clientMap.set(clientName, {
          clientName,
          totalBilled: 0,
          totalPaid: 0,
          totalOutstanding: 0,
          current: 0,
          days31_60: 0,
          days61_90: 0,
          days90Plus: 0,
          invoicesCount: 0,
          oldestDueDate: inv.dueDate,
          riskLevel: "low",
        });
      }

      const cl = clientMap.get(clientName)!;
      cl.totalBilled += net;
      cl.totalPaid += paid;
      cl.totalOutstanding += outstanding;
      cl.invoicesCount += 1;

      if (outstanding > 0) {
        if (bucketKey === "0-30") cl.current += outstanding;
        else if (bucketKey === "31-60") cl.days31_60 += outstanding;
        else if (bucketKey === "61-90") cl.days61_90 += outstanding;
        else if (bucketKey === "90+") cl.days90Plus += outstanding;

        if (bucketKey === "90+") cl.riskLevel = "critical";
        else if (bucketKey === "61-90" && cl.riskLevel !== "critical") cl.riskLevel = "high";
        else if (bucketKey === "31-60" && cl.riskLevel === "low") cl.riskLevel = "medium";

        if (!cl.oldestDueDate || new Date(inv.dueDate) < new Date(cl.oldestDueDate)) {
          cl.oldestDueDate = inv.dueDate;
        }
      }

      return {
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        projectId: inv.projectId,
        projectName: r.projectName,
        projectCode: `PRJ-${inv.projectId}`,
        clientName,
        invoiceDate: inv.invoiceDate,
        dueDate: inv.dueDate,
        daysOverdue: Math.max(0, diffDays),
        ageDays,
        grossAmount: gross,
        amount: net,
        totalPaidAmount: paid,
        outstandingAmount: outstanding,
        status: inv.status,
        deliveryStatus: inv.deliveryStatus,
        bucket: bucketKey,
        riskLevel,
        isOverdue: diffDays > 0 && outstanding > 0,
      };
    });

    const outTotal = Math.max(1, totalOutstanding);
    buckets["0-30"].percentage = Math.round((buckets["0-30"].amount / outTotal) * 100);
    buckets["31-60"].percentage = Math.round((buckets["31-60"].amount / outTotal) * 100);
    buckets["61-90"].percentage = Math.round((buckets["61-90"].amount / outTotal) * 100);
    buckets["90+"].percentage = Math.round((buckets["90+"].amount / outTotal) * 100);

    const dsoDays = totalBilled > 0 ? Math.round((totalOutstanding / totalBilled) * 90) : 0;

    let filteredInvoices = processedInvoices;
    if (bucket && bucket !== "all") {
      filteredInvoices = filteredInvoices.filter((it) => it.bucket === bucket);
    }
    if (clientId && clientId !== "all") {
      filteredInvoices = filteredInvoices.filter((it) => it.clientName === clientId);
    }

    const clientSummary = Array.from(clientMap.values()).sort((a, b) => b.totalOutstanding - a.totalOutstanding);

    res.json({
      asOfDate: refDate.toISOString().split("T")[0],
      totalBilled,
      totalCollected,
      totalOutstanding,
      totalOverdue,
      collectionEfficiency: totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0,
      dsoDays,
      buckets,
      clientSummary,
      invoices: filteredInvoices,
    });
  } catch (error: any) {
    console.error("Error generating AR aging report:", error);
    res.status(500).json({ error: "Failed to generate AR aging report" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. CLIENT CONTRACTS (Common project data with client classification)
// ═══════════════════════════════════════════════════════════════════════════
router.get("/contracts", async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.query;
    let query = db
      .select({
        c: contractsTable,
        projectName: projectsTable.name,
        clientName: projectsTable.clientName,
      })
      .from(contractsTable)
      .leftJoin(projectsTable, eq(projectsTable.id, contractsTable.projectId));

    const conditions: any[] = [];
    if (projectId) {
      conditions.push(eq(contractsTable.projectId, Number(projectId)));
    }

    const rows = conditions.length > 0
      ? await query.where(and(...conditions)).orderBy(desc(contractsTable.createdAt))
      : await query.orderBy(desc(contractsTable.createdAt));

    res.json(
      rows.map((r) => ({
        ...r.c,
        projectName: r.projectName,
        clientName: r.c.clientName || r.clientName || "Client",
      }))
    );
  } catch (error: any) {
    console.error("Error listing client contracts:", error);
    res.status(500).json({ error: "Failed to fetch client contracts" });
  }
});

router.post("/contracts", async (req: Request, res: Response): Promise<void> => {
  try {
    const me = await getCurrentUser(req);
    const b = req.body ?? {};
    if (!b.projectId || !b.title) {
      res.status(400).json({ error: "projectId and title are required" });
      return;
    }

    const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, Number(b.projectId))).limit(1);
    const contractNumber = b.contractNumber || generateNumber("CNT-CLT-");

    const result = await db.insert(contractsTable).values({
      contractNumber,
      contractType: "client",
      projectId: Number(b.projectId),
      vendorId: null,
      clientName: b.clientName || project?.clientName || "Client",
      title: b.title,
      description: b.description || null,
      totalAmount: String(b.totalAmount || "0"),
      retentionPercent: String(b.retentionPercent ?? "5.00"),
      advancePercent: String(b.advancePercent ?? "0.00"),
      tdsPercent: String(b.tdsPercent ?? "2.00"),
      gstPercent: String(b.gstPercent ?? "18.00"),
      startDate: b.startDate ? new Date(b.startDate) : null,
      endDate: b.endDate ? new Date(b.endDate) : null,
      status: b.status || "active",
      createdById: me.id,
    });

    const insertId = Number(result[0].insertId);
    const [created] = await db.select().from(contractsTable).where(eq(contractsTable.id, insertId)).limit(1);

    await logFinancialAudit({
      workflowType: "AR",
      entityType: "client_contract",
      entityId: insertId,
      action: "CREATED",
      newStatus: created?.status || "active",
      userId: me.id,
      userName: me.name,
      comments: `Created Client Contract ${contractNumber}`,
    });

    res.status(201).json(created);
  } catch (error: any) {
    console.error("Error creating client contract:", error);
    res.status(500).json({ error: "Failed to create client contract" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. CLIENT RA BILLS (Accounts Receivable Running Account Bills)
// ═══════════════════════════════════════════════════════════════════════════
router.get("/ra-bills", async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId, contractId, status, search } = req.query;

    let query = db
      .select({
        b: raBillsTable,
        projectName: projectsTable.name,
        projectClient: projectsTable.clientName,
        contractTitle: contractsTable.title,
        contractNumber: contractsTable.contractNumber,
      })
      .from(raBillsTable)
      .leftJoin(projectsTable, eq(projectsTable.id, raBillsTable.projectId))
      .leftJoin(contractsTable, eq(contractsTable.id, raBillsTable.contractId));

    const conditions: any[] = [eq(raBillsTable.billType, "client")];

    if (projectId) conditions.push(eq(raBillsTable.projectId, Number(projectId)));
    if (contractId) conditions.push(eq(raBillsTable.contractId, Number(contractId)));
    if (status && typeof status === "string" && status !== "all") {
      conditions.push(eq(raBillsTable.status, status.toLowerCase()));
    }

    const rows = await query.where(and(...conditions)).orderBy(desc(raBillsTable.createdAt));

    res.json(
      rows.map((r) => ({
        ...r.b,
        projectName: r.projectName,
        clientName: r.b.clientName || r.projectClient || "Client",
        contractTitle: r.contractTitle,
        contractNumber: r.contractNumber,
      }))
    );
  } catch (error: any) {
    console.error("Error listing Client RA Bills:", error);
    res.status(500).json({ error: "Failed to fetch Client RA Bills" });
  }
});

router.get("/ra-bills/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const [bill] = await db
      .select({
        b: raBillsTable,
        projectName: projectsTable.name,
        projectClient: projectsTable.clientName,
        contractTitle: contractsTable.title,
        contractNumber: contractsTable.contractNumber,
      })
      .from(raBillsTable)
      .leftJoin(projectsTable, eq(projectsTable.id, raBillsTable.projectId))
      .leftJoin(contractsTable, eq(contractsTable.id, raBillsTable.contractId))
      .where(eq(raBillsTable.id, id))
      .limit(1);

    if (!bill) {
      res.status(404).json({ error: "Client RA Bill not found" });
      return;
    }

    const items = await db
      .select()
      .from(raBillItemsTable)
      .where(eq(raBillItemsTable.raBillId, id))
      .orderBy(asc(raBillItemsTable.sortOrder));

    const documents = await db
      .select()
      .from(raBillDocumentsTable)
      .where(eq(raBillDocumentsTable.raBillId, id));

    const history = await db
      .select()
      .from(raBillApprovalHistoryTable)
      .where(eq(raBillApprovalHistoryTable.raBillId, id))
      .orderBy(desc(raBillApprovalHistoryTable.actionDate));

    // Also look up any generated invoice for this RA Bill
    const [invoice] = await db
      .select()
      .from(invoicesTable)
      .where(eq(invoicesTable.raBillId, id))
      .limit(1);

    res.json({
      ...bill.b,
      projectName: bill.projectName,
      clientName: bill.b.clientName || bill.projectClient || "Client",
      contractTitle: bill.contractTitle,
      contractNumber: bill.contractNumber,
      items,
      documents,
      history,
      invoice,
    });
  } catch (error: any) {
    console.error("Error fetching Client RA Bill detail:", error);
    res.status(500).json({ error: "Failed to fetch Client RA Bill" });
  }
});

// POST /api/ar/ra-bills - Create a new Client RA Bill
router.post("/ra-bills", async (req: Request, res: Response): Promise<void> => {
  try {
    const me = await getCurrentUser(req);
    const b = req.body ?? {};

    if (!b.projectId) {
      res.status(400).json({ error: "projectId is required" });
      return;
    }

    const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, Number(b.projectId))).limit(1);
    const clientName = b.clientName || project?.clientName || "Client";
    const billNumber = b.billNumber || generateNumber("RA-CLT-");

    // Calculation values
    const grossAmount = Number(b.grossAmount || b.amount || 0);
    const cumulativeAmount = Number(b.cumulativeAmount || grossAmount);
    const retentionPercent = Number(b.retentionPercent ?? 5);
    const retentionAmount = Number(b.retentionAmount ?? (grossAmount * retentionPercent) / 100);
    const advanceRecovery = Number(b.advanceRecovery ?? 0);
    const tdsPercent = Number(b.tdsPercent ?? 2);
    const tdsAmount = Number(b.tdsAmount ?? (grossAmount * tdsPercent) / 100);
    const gstPercent = Number(b.gstPercent ?? 18);
    const gstAmount = Number(b.gstAmount ?? (grossAmount * gstPercent) / 100);
    const otherDeductions = Number(b.otherDeductions ?? 0);

    const netPayableAmount = Math.max(
      0,
      grossAmount + gstAmount - (retentionAmount + advanceRecovery + tdsAmount + otherDeductions)
    );

    const result = await db.insert(raBillsTable).values({
      projectId: Number(b.projectId),
      contractId: b.contractId ? Number(b.contractId) : null,
      vendorId: null, // Client bill has no vendor
      billType: "client",
      clientName,
      workCompletionId: b.workCompletionId ? Number(b.workCompletionId) : null,
      billNumber,
      description: b.description || `Client RA Bill for ${clientName}`,
      amount: String(grossAmount),
      milestone: b.milestone || "Progress Billing",
      billingPeriodStart: b.billingPeriodStart ? new Date(b.billingPeriodStart) : null,
      billingPeriodEnd: b.billingPeriodEnd ? new Date(b.billingPeriodEnd) : null,
      grossAmount: String(grossAmount),
      cumulativeAmount: String(cumulativeAmount),
      retentionPercent: String(retentionPercent),
      retentionAmount: String(retentionAmount),
      advanceRecovery: String(advanceRecovery),
      tdsPercent: String(tdsPercent),
      tdsAmount: String(tdsAmount),
      gstPercent: String(gstPercent),
      gstAmount: String(gstAmount),
      otherDeductions: String(otherDeductions),
      deductionRemarks: b.deductionRemarks || null,
      netPayableAmount: String(netPayableAmount),
      status: "draft",
      documentUrl: b.documentUrl || null,
      createdById: me.id,
    });

    const raBillId = Number(result[0].insertId);

    // Insert line items if provided
    if (Array.isArray(b.items) && b.items.length > 0) {
      for (let i = 0; i < b.items.length; i++) {
        const item = b.items[i];
        await db.insert(raBillItemsTable).values({
          raBillId,
          contractBoqItemId: Number(item.contractBoqItemId || 0),
          description: item.description || "Work Item",
          unit: item.unit || "nos",
          rate: String(item.rate || 0),
          contractQuantity: String(item.contractQuantity || 0),
          previousBilledQty: String(item.previousBilledQty || 0),
          currentBilledQty: String(item.currentBilledQty || 0),
          cumulativeBilledQty: String(item.cumulativeBilledQty || item.currentBilledQty || 0),
          previousAmount: String(item.previousAmount || 0),
          currentAmount: String(item.currentAmount || 0),
          cumulativeAmount: String(item.cumulativeAmount || item.currentAmount || 0),
          sortOrder: i,
        });
      }
    }

    // Log audit & history
    await db.insert(raBillApprovalHistoryTable).values({
      raBillId,
      action: "CREATED",
      userId: me.id,
      previousStatus: null,
      newStatus: "draft",
      comments: "Client RA Bill draft created",
    });

    await logFinancialAudit({
      workflowType: "AR",
      entityType: "client_ra_bill",
      entityId: raBillId,
      action: "CREATED",
      newStatus: "draft",
      userId: me.id,
      userName: me.name,
      comments: `Created Client RA Bill ${billNumber} for ₹${grossAmount.toLocaleString()}`,
    });

    const [created] = await db.select().from(raBillsTable).where(eq(raBillsTable.id, raBillId)).limit(1);
    res.status(201).json(created);
  } catch (error: any) {
    console.error("Error creating Client RA Bill:", error);
    res.status(500).json({ error: "Failed to create Client RA Bill" });
  }
});

// POST /api/ar/ra-bills/:id/submit - Submit for PM Approval
router.post("/ra-bills/:id/submit", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const me = await getCurrentUser(req);

    const [bill] = await db.select().from(raBillsTable).where(eq(raBillsTable.id, id)).limit(1);
    if (!bill) {
      res.status(404).json({ error: "Client RA Bill not found" });
      return;
    }

    const previousStatus = bill.status;
    await db
      .update(raBillsTable)
      .set({
        status: "submitted",
        submittedAt: new Date(),
        submittedById: me.id,
      })
      .where(eq(raBillsTable.id, id));

    await db.insert(raBillApprovalHistoryTable).values({
      raBillId: id,
      action: "SUBMITTED",
      userId: me.id,
      previousStatus,
      newStatus: "submitted",
      comments: req.body?.comments || "Submitted for Project Manager approval",
    });

    await logFinancialAudit({
      workflowType: "AR",
      entityType: "client_ra_bill",
      entityId: id,
      action: "SUBMITTED",
      previousStatus,
      newStatus: "submitted",
      userId: me.id,
      userName: me.name,
      comments: req.body?.comments || "Submitted for PM approval",
    });

    await notifyRole(
      ["project_manager", "admin"],
      "Client RA Bill Submitted",
      `Bill ${bill.billNumber} has been submitted for review and approval.`,
      `/finance`
    );

    const [updated] = await db.select().from(raBillsTable).where(eq(raBillsTable.id, id)).limit(1);
    res.json(updated);
  } catch (error: any) {
    console.error("Error submitting Client RA Bill:", error);
    res.status(500).json({ error: "Failed to submit Client RA Bill" });
  }
});

// POST /api/ar/ra-bills/:id/pm-approve - Project Manager Approval
router.post("/ra-bills/:id/pm-approve", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const me = await getCurrentUser(req);
    const { comments } = req.body ?? {};

    // Validate role: PM or Admin
    if (!me.roles.includes("project_manager") && !me.roles.includes("admin")) {
      res.status(403).json({ error: "Only Project Managers or Admins can approve Client RA Bills" });
      return;
    }

    const [bill] = await db.select().from(raBillsTable).where(eq(raBillsTable.id, id)).limit(1);
    if (!bill) {
      res.status(404).json({ error: "Client RA Bill not found" });
      return;
    }

    const previousStatus = bill.status;
    await db
      .update(raBillsTable)
      .set({
        status: "pm_approved",
        approvedById: me.id,
        approvedAt: new Date(),
        approvalComments: comments || "Approved by Project Manager",
      })
      .where(eq(raBillsTable.id, id));

    await db.insert(raBillApprovalHistoryTable).values({
      raBillId: id,
      action: "PM_APPROVED",
      userId: me.id,
      previousStatus,
      newStatus: "pm_approved",
      comments: comments || "Approved by Project Manager",
    });

    await logFinancialAudit({
      workflowType: "AR",
      entityType: "client_ra_bill",
      entityId: id,
      action: "PM_APPROVED",
      previousStatus,
      newStatus: "pm_approved",
      userId: me.id,
      userName: me.name,
      comments: comments || "Approved by Project Manager",
    });

    await notifyRole(
      ["accountant", "admin"],
      "Client RA Bill Approved by PM",
      `Bill ${bill.billNumber} has been approved and is ready for payment certification.`,
      `/finance`
    );

    const [updated] = await db.select().from(raBillsTable).where(eq(raBillsTable.id, id)).limit(1);
    res.json(updated);
  } catch (error: any) {
    console.error("Error approving Client RA Bill:", error);
    res.status(500).json({ error: "Failed to approve Client RA Bill" });
  }
});

// POST /api/ar/ra-bills/:id/request-revision - Revision Requested
router.post("/ra-bills/:id/request-revision", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const me = await getCurrentUser(req);
    const { revisionReason } = req.body ?? {};

    if (!revisionReason) {
      res.status(400).json({ error: "revisionReason is required" });
      return;
    }

    const [bill] = await db.select().from(raBillsTable).where(eq(raBillsTable.id, id)).limit(1);
    if (!bill) {
      res.status(404).json({ error: "Client RA Bill not found" });
      return;
    }

    const previousStatus = bill.status;
    await db
      .update(raBillsTable)
      .set({
        status: "revision_requested",
        revisionRequestedById: me.id,
        revisionRequestedAt: new Date(),
        revisionReason,
      })
      .where(eq(raBillsTable.id, id));

    await db.insert(raBillApprovalHistoryTable).values({
      raBillId: id,
      action: "REVISION_REQUESTED",
      userId: me.id,
      previousStatus,
      newStatus: "revision_requested",
      comments: revisionReason,
    });

    await logFinancialAudit({
      workflowType: "AR",
      entityType: "client_ra_bill",
      entityId: id,
      action: "REVISION_REQUESTED",
      previousStatus,
      newStatus: "revision_requested",
      userId: me.id,
      userName: me.name,
      comments: `Revision requested: ${revisionReason}`,
    });

    const [updated] = await db.select().from(raBillsTable).where(eq(raBillsTable.id, id)).limit(1);
    res.json(updated);
  } catch (error: any) {
    console.error("Error requesting revision:", error);
    res.status(500).json({ error: "Failed to request revision" });
  }
});

// POST /api/ar/ra-bills/:id/certify-payment - Payment Certification
router.post("/ra-bills/:id/certify-payment", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const me = await getCurrentUser(req);
    const { certificateNumber, notes } = req.body ?? {};

    const [bill] = await db.select().from(raBillsTable).where(eq(raBillsTable.id, id)).limit(1);
    if (!bill) {
      res.status(404).json({ error: "Client RA Bill not found" });
      return;
    }

    if (bill.status !== "pm_approved") {
      res.status(400).json({ error: "Client RA Bill must be PM_APPROVED before payment certification" });
      return;
    }

    const certNum = certificateNumber || generateNumber("IPC-");
    const previousStatus = bill.status;

    await db
      .update(raBillsTable)
      .set({
        status: "payment_certified",
        paymentCertifiedAt: new Date(),
        paymentCertifiedById: me.id,
        paymentCertificateNumber: certNum,
        paymentCertificateNotes: notes || "Payment certified by authorized certifying authority",
      })
      .where(eq(raBillsTable.id, id));

    await db.insert(raBillApprovalHistoryTable).values({
      raBillId: id,
      action: "PAYMENT_CERTIFIED",
      userId: me.id,
      previousStatus,
      newStatus: "payment_certified",
      comments: `Payment Certified under IPC #${certNum}`,
    });

    await logFinancialAudit({
      workflowType: "AR",
      entityType: "client_ra_bill",
      entityId: id,
      action: "PAYMENT_CERTIFIED",
      previousStatus,
      newStatus: "payment_certified",
      userId: me.id,
      userName: me.name,
      comments: `Payment certified under certificate ${certNum}`,
    });

    const [updated] = await db.select().from(raBillsTable).where(eq(raBillsTable.id, id)).limit(1);
    res.json(updated);
  } catch (error: any) {
    console.error("Error certifying payment:", error);
    res.status(500).json({ error: "Failed to certify payment" });
  }
});

// POST /api/ar/ra-bills/:id/generate-invoice - Generate Client Tax Invoice
router.post("/ra-bills/:id/generate-invoice", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const me = await getCurrentUser(req);

    const [bill] = await db.select().from(raBillsTable).where(eq(raBillsTable.id, id)).limit(1);
    if (!bill) {
      res.status(404).json({ error: "Client RA Bill not found" });
      return;
    }

    // Business rule: Cannot generate invoice before RA Bill approval / certification
    if (bill.status !== "payment_certified" && bill.status !== "pm_approved") {
      res.status(400).json({
        error: "Cannot generate invoice before RA Bill is approved or certified. Current status: " + bill.status,
      });
      return;
    }

    // Business rule: Cannot generate duplicate invoice for the same RA Bill
    const [existingInv] = await db.select().from(invoicesTable).where(eq(invoicesTable.raBillId, id)).limit(1);
    if (existingInv) {
      res.status(409).json({
        error: `An invoice (${existingInv.invoiceNumber}) has already been generated for this RA Bill.`,
        invoice: existingInv,
      });
      return;
    }

    const [settings] = await db.select().from(companySettingsTable).limit(1);
    const invoiceNumber = req.body?.invoiceNumber || generateNumber("INV-CLT-");

    const grossAmount = Number(bill.grossAmount || bill.amount || 0);
    const taxAmount = Number(bill.gstAmount || 0);
    const totalDeductions = Number(bill.retentionAmount || 0) + Number(bill.advanceRecovery || 0) + Number(bill.tdsAmount || 0) + Number(bill.otherDeductions || 0);
    const netAmount = Number(bill.netPayableAmount || grossAmount);

    const invoiceDate = req.body?.invoiceDate ? new Date(req.body.invoiceDate) : new Date();
    const dueDate = req.body?.dueDate ? new Date(req.body.dueDate) : new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);

    const billingPeriod = bill.billingPeriodStart && bill.billingPeriodEnd
      ? `${new Date(bill.billingPeriodStart).toLocaleDateString()} to ${new Date(bill.billingPeriodEnd).toLocaleDateString()}`
      : bill.milestone || "Progress Billing";

    const bankDetails = settings?.bankName
      ? `Bank: ${settings.bankName}, A/C: ${settings.accountNumber}, IFSC: ${settings.ifscCode}, Branch: ${settings.branchName}`
      : "HDFC Bank Ltd, A/C: 50200088921820, IFSC: HDFC0000060";

    const result = await db.insert(invoicesTable).values({
      projectId: bill.projectId,
      raBillId: bill.id,
      vendorId: null,
      contractId: bill.contractId,
      invoiceNumber,
      clientName: bill.clientName || "Client",
      amount: String(grossAmount),
      grossAmount: String(grossAmount),
      deductions: String(totalDeductions),
      taxAmount: String(taxAmount),
      netAmount: String(netAmount),
      invoiceDate,
      dueDate,
      paymentTerms: req.body?.paymentTerms || settings?.invoiceTerms || "Net 15 Days",
      billingPeriod,
      bankDetails,
      totalPaidAmount: "0.00",
      outstandingAmount: String(netAmount),
      reconciliationStatus: "pending",
      reconciled: false,
      status: "generated",
      deliveryStatus: "pending",
    });

    const invoiceId = Number(result[0].insertId);

    // Update RA Bill status to invoice_generated
    await db
      .update(raBillsTable)
      .set({ status: "invoice_generated" })
      .where(eq(raBillsTable.id, id));

    await db.insert(raBillApprovalHistoryTable).values({
      raBillId: id,
      action: "INVOICE_GENERATED",
      userId: me.id,
      previousStatus: bill.status,
      newStatus: "invoice_generated",
      comments: `Generated Client Invoice #${invoiceNumber}`,
    });

    await logFinancialAudit({
      workflowType: "AR",
      entityType: "client_invoice",
      entityId: invoiceId,
      action: "GENERATED",
      newStatus: "generated",
      userId: me.id,
      userName: me.name,
      comments: `Generated Client Invoice ${invoiceNumber} for ₹${netAmount.toLocaleString()}`,
    });

    const [createdInvoice] = await db.select().from(invoicesTable).where(eq(invoicesTable.id, invoiceId)).limit(1);
    res.status(201).json(createdInvoice);
  } catch (error: any) {
    console.error("Error generating invoice from Client RA Bill:", error);
    res.status(500).json({ error: "Failed to generate invoice" });
  }
});

// POST /api/ar/ra-bills/:id/documents - Add supporting documents
router.post("/ra-bills/:id/documents", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const me = await getCurrentUser(req);
    const { documentType, fileName, fileUrl, fileSize } = req.body ?? {};

    if (!fileName || !fileUrl) {
      res.status(400).json({ error: "fileName and fileUrl are required" });
      return;
    }

    const result = await db.insert(raBillDocumentsTable).values({
      raBillId: id,
      documentType: documentType || "other",
      fileName,
      fileUrl,
      fileSize: fileSize ? Number(fileSize) : null,
      uploadedById: me.id,
    });

    const docId = Number(result[0].insertId);
    const [doc] = await db.select().from(raBillDocumentsTable).where(eq(raBillDocumentsTable.id, docId)).limit(1);
    res.status(201).json(doc);
  } catch (error: any) {
    console.error("Error uploading RA bill document:", error);
    res.status(500).json({ error: "Failed to upload document" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. CLIENT INVOICES (Accounts Receivable Invoices)
// ═══════════════════════════════════════════════════════════════════════════
router.get("/invoices", async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId, status, clientName } = req.query;

    let query = db
      .select({
        inv: invoicesTable,
        projectName: projectsTable.name,
        raBillNumber: raBillsTable.billNumber,
      })
      .from(invoicesTable)
      .leftJoin(projectsTable, eq(projectsTable.id, invoicesTable.projectId))
      .leftJoin(raBillsTable, eq(raBillsTable.id, invoicesTable.raBillId));

    const conditions: any[] = [];
    if (projectId) conditions.push(eq(invoicesTable.projectId, Number(projectId)));
    if (status && typeof status === "string" && status !== "all") {
      conditions.push(eq(invoicesTable.status, status.toLowerCase()));
    }
    if (clientName && typeof clientName === "string") {
      conditions.push(sql`${invoicesTable.clientName} LIKE ${`%${clientName}%`}`);
    }

    const rows = conditions.length > 0
      ? await query.where(and(...conditions)).orderBy(desc(invoicesTable.createdAt))
      : await query.orderBy(desc(invoicesTable.createdAt));

    res.json(
      rows.map((r) => ({
        ...r.inv,
        projectName: r.projectName,
        raBillNumber: r.raBillNumber,
      }))
    );
  } catch (error: any) {
    console.error("Error listing Client Invoices:", error);
    res.status(500).json({ error: "Failed to fetch Client Invoices" });
  }
});

router.get("/invoices/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const [inv] = await db
      .select({
        inv: invoicesTable,
        projectName: projectsTable.name,
        raBillNumber: raBillsTable.billNumber,
      })
      .from(invoicesTable)
      .leftJoin(projectsTable, eq(projectsTable.id, invoicesTable.projectId))
      .leftJoin(raBillsTable, eq(raBillsTable.id, invoicesTable.raBillId))
      .where(eq(invoicesTable.id, id))
      .limit(1);

    if (!inv) {
      res.status(404).json({ error: "Client Invoice not found" });
      return;
    }

    const payments = await db
      .select()
      .from(invoicePaymentsTable)
      .where(eq(invoicePaymentsTable.invoiceId, id))
      .orderBy(desc(invoicePaymentsTable.paymentDate));

    const reminders = await db
      .select()
      .from(paymentRemindersTable)
      .where(eq(paymentRemindersTable.invoiceId, id))
      .orderBy(desc(paymentRemindersTable.reminderDate));

    const [settings] = await db.select().from(companySettingsTable).limit(1);

    res.json({
      ...inv.inv,
      projectName: inv.projectName,
      raBillNumber: inv.raBillNumber,
      payments,
      reminders,
      branding: settings || {},
    });
  } catch (error: any) {
    console.error("Error fetching Client Invoice detail:", error);
    res.status(500).json({ error: "Failed to fetch Client Invoice" });
  }
});

// POST /api/ar/invoices/:id/send - Send / Share Invoice with Client
router.post("/invoices/:id/send", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const me = await getCurrentUser(req);
    const { recipientEmail, recipientNotes } = req.body ?? {};

    const [inv] = await db.select().from(invoicesTable).where(eq(invoicesTable.id, id)).limit(1);
    if (!inv) {
      res.status(404).json({ error: "Client Invoice not found" });
      return;
    }

    const previousStatus = inv.status;
    const newStatus = "sent";

    await db
      .update(invoicesTable)
      .set({
        status: newStatus,
        sentAt: new Date(),
        sentById: me.id,
        recipientEmail: recipientEmail || inv.recipientEmail,
        recipientNotes: recipientNotes || inv.recipientNotes,
        deliveryStatus: "sent",
      })
      .where(eq(invoicesTable.id, id));

    await logFinancialAudit({
      workflowType: "AR",
      entityType: "client_invoice",
      entityId: id,
      action: "SENT",
      previousStatus,
      newStatus,
      userId: me.id,
      userName: me.name,
      comments: `Invoice dispatched to ${recipientEmail || "client contact"}`,
    });

    const [updated] = await db.select().from(invoicesTable).where(eq(invoicesTable.id, id)).limit(1);
    res.json(updated);
  } catch (error: any) {
    console.error("Error sending invoice:", error);
    res.status(500).json({ error: "Failed to send invoice" });
  }
});

// POST /api/ar/invoices/:id/payments - Record Client Payment (AR Payment Direction: Client -> Our Bank)
router.post("/invoices/:id/payments", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const me = await getCurrentUser(req);
    const b = req.body ?? {};

    const paymentAmount = Number(b.paymentAmount || 0);
    if (paymentAmount <= 0) {
      res.status(400).json({ error: "Payment amount must be greater than zero" });
      return;
    }

    // Business rule: Cannot record payment against non-existent invoice
    const [inv] = await db.select().from(invoicesTable).where(eq(invoicesTable.id, id)).limit(1);
    if (!inv) {
      res.status(404).json({ error: "Cannot record payment against non-existent invoice" });
      return;
    }

    const currentPaid = Number(inv.totalPaidAmount || 0);
    const netAmount = Number(inv.netAmount || inv.amount || 0);
    const currentOutstanding = Number(inv.outstandingAmount || Math.max(0, netAmount - currentPaid));

    // Business rule: Do not allow payment greater than outstanding amount (unless explicit tolerance)
    if (paymentAmount > currentOutstanding + 0.01) {
      res.status(400).json({
        error: `Payment amount (₹${paymentAmount}) cannot exceed outstanding amount (₹${currentOutstanding.toFixed(2)})`,
      });
      return;
    }

    const newPaid = currentPaid + paymentAmount;
    const newOutstanding = Math.max(0, netAmount - newPaid);
    const newStatus = newOutstanding <= 0.01 ? "paid" : "partially_paid";
    const paymentNumber = b.paymentNumber || generateNumber("PAY-AR-");

    // Insert AR Payment record
    const payResult = await db.insert(invoicePaymentsTable).values({
      invoiceId: id,
      raBillId: inv.raBillId,
      paymentNumber,
      paymentDate: b.paymentDate ? new Date(b.paymentDate) : new Date(),
      paymentAmount: String(paymentAmount),
      paymentMode: b.paymentMode || "bank_transfer",
      bankReference: b.bankReference || null,
      transactionId: b.transactionId || null,
      remarks: b.remarks || `Payment of ₹${paymentAmount} received from Client ${inv.clientName}`,
      documentUrl: b.documentUrl || null,
      recordedById: me.id,
    });

    const paymentId = Number(payResult[0].insertId);

    // Update Client Invoice AR records
    await db
      .update(invoicesTable)
      .set({
        totalPaidAmount: String(newPaid),
        outstandingAmount: String(newOutstanding),
        paymentDate: new Date(),
        status: newStatus,
      })
      .where(eq(invoicesTable.id, id));

    await logFinancialAudit({
      workflowType: "AR",
      entityType: "client_payment",
      entityId: paymentId,
      action: "PAYMENT_RECORDED",
      previousStatus: inv.status,
      newStatus,
      userId: me.id,
      userName: me.name,
      comments: `Recorded Client Payment of ₹${paymentAmount.toLocaleString()} via ${b.paymentMode || "bank_transfer"}. Outstanding: ₹${newOutstanding.toLocaleString()}`,
    });

    const [updatedInvoice] = await db.select().from(invoicesTable).where(eq(invoicesTable.id, id)).limit(1);
    const [recordedPayment] = await db.select().from(invoicePaymentsTable).where(eq(invoicePaymentsTable.id, paymentId)).limit(1);

    res.status(201).json({
      payment: recordedPayment,
      invoice: updatedInvoice,
    });
  } catch (error: any) {
    console.error("Error recording client payment:", error);
    res.status(500).json({ error: "Failed to record client payment" });
  }
});

// POST /api/ar/invoices/:id/reconcile - Bank Reconciliation
router.post("/invoices/:id/reconcile", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const me = await getCurrentUser(req);
    const { reconciliationRemarks } = req.body ?? {};

    const [inv] = await db.select().from(invoicesTable).where(eq(invoicesTable.id, id)).limit(1);
    if (!inv) {
      res.status(404).json({ error: "Client Invoice not found" });
      return;
    }

    const previousStatus = inv.status;
    const newStatus = "reconciled";

    await db
      .update(invoicesTable)
      .set({
        reconciled: true,
        reconciledById: me.id,
        reconciledAt: new Date(),
        reconciliationRemarks: reconciliationRemarks || "Verified and reconciled against company bank statement",
        reconciliationStatus: "completed",
        status: newStatus,
      })
      .where(eq(invoicesTable.id, id));

    await logFinancialAudit({
      workflowType: "AR",
      entityType: "reconciliation",
      entityId: id,
      action: "BANK_RECONCILED",
      previousStatus,
      newStatus,
      userId: me.id,
      userName: me.name,
      comments: reconciliationRemarks || "Invoice reconciled with bank account statement",
    });

    const [updated] = await db.select().from(invoicesTable).where(eq(invoicesTable.id, id)).limit(1);
    res.json(updated);
  } catch (error: any) {
    console.error("Error reconciling invoice:", error);
    res.status(500).json({ error: "Failed to reconcile invoice" });
  }
});

// POST /api/ar/invoices/:id/close - Close Invoice
router.post("/invoices/:id/close", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const me = await getCurrentUser(req);

    const [inv] = await db.select().from(invoicesTable).where(eq(invoicesTable.id, id)).limit(1);
    if (!inv) {
      res.status(404).json({ error: "Client Invoice not found" });
      return;
    }

    // Business rule: Invoice cannot be closed before full payment and reconciliation!
    const outstanding = Number(inv.outstandingAmount || 0);
    if (outstanding > 0.01) {
      res.status(400).json({
        error: `Cannot close invoice with outstanding balance of ₹${outstanding.toFixed(2)}. Full payment must be recorded first.`,
      });
      return;
    }

    if (!inv.reconciled) {
      res.status(400).json({
        error: "Cannot close invoice before bank reconciliation is completed.",
      });
      return;
    }

    const previousStatus = inv.status;
    await db
      .update(invoicesTable)
      .set({ status: "closed" })
      .where(eq(invoicesTable.id, id));

    // Also close the linked RA Bill
    if (inv.raBillId) {
      await db.update(raBillsTable).set({ status: "closed" }).where(eq(raBillsTable.id, inv.raBillId));
    }

    await logFinancialAudit({
      workflowType: "AR",
      entityType: "client_invoice",
      entityId: id,
      action: "CLOSED",
      previousStatus,
      newStatus: "closed",
      userId: me.id,
      userName: me.name,
      comments: "Client Invoice lifecycle completed, reconciled, and closed.",
    });

    const [updated] = await db.select().from(invoicesTable).where(eq(invoicesTable.id, id)).limit(1);
    res.json(updated);
  } catch (error: any) {
    console.error("Error closing invoice:", error);
    res.status(500).json({ error: "Failed to close invoice" });
  }
});

// POST /api/ar/invoices/:id/reminders - Send Payment Reminder
router.post("/invoices/:id/reminders", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const me = await getCurrentUser(req);
    const { reminderType, message, recipient } = req.body ?? {};

    const [inv] = await db.select().from(invoicesTable).where(eq(invoicesTable.id, id)).limit(1);
    if (!inv) {
      res.status(404).json({ error: "Client Invoice not found" });
      return;
    }

    const result = await db.insert(paymentRemindersTable).values({
      invoiceId: id,
      reminderType: reminderType || "email",
      subject: `Payment Reminder for Invoice #${inv.invoiceNumber}`,
      message: message || `Gentle reminder regarding pending payment of ₹${inv.outstandingAmount} for Invoice #${inv.invoiceNumber} due on ${inv.dueDate}`,
      recipient: recipient || inv.recipientEmail || inv.clientName,
      sentById: me.id,
    });

    const remId = Number(result[0].insertId);
    const [reminder] = await db.select().from(paymentRemindersTable).where(eq(paymentRemindersTable.id, remId)).limit(1);
    res.status(201).json(reminder);
  } catch (error: any) {
    console.error("Error sending payment reminder:", error);
    res.status(500).json({ error: "Failed to send payment reminder" });
  }
});

export default router;
