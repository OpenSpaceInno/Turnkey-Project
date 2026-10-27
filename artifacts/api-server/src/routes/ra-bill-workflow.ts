import { Router, type IRouter, type Request, type Response } from "express";
import { eq, desc, asc, and, or, sql, inArray } from "drizzle-orm";
import {
  db,
  contractsTable,
  contractBoqItemsTable,
  workCompletionsTable,
  workCompletionItemsTable,
  workCompletionDocumentsTable,
  raBillsTable,
  raBillItemsTable,
  raBillDocumentsTable,
  raBillApprovalHistoryTable,
  invoicesTable,
  invoicePaymentsTable,
  paymentRemindersTable,
  projectsTable,
  vendorsTable,
  usersTable,
  notificationsTable,
  auditLogsTable,
  budgetItemsTable,
  tasksTable,
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
  vendorInvoicesTable,
  vendorPaymentsTable,
  expensesTable,
  punchListItemsTable,
  financialAuditLogsTable,
} from "@workspace/db";
import { num, numReq, numKeys } from "../lib/transforms";
import { getCurrentUser } from "../lib/session";
import { generateNumber } from "../lib/numbers";
import { sendWorkflowEmail } from "../lib/email-service";

const router: IRouter = Router();

// Helper to log audit activity
async function logAudit(
  userId: number | null,
  activity: string,
  resourceType: string,
  resourceId: number,
  metadata?: Record<string, unknown>
) {
  try {
    await db.insert(auditLogsTable).values({
      userId,
      activity,
      resourceType,
      resourceId,
      status: "success",
      metadata: metadata ? JSON.stringify(metadata) : null,
    });
  } catch (err) {
    console.error("Failed to write audit log:", err);
  }
}

// Helper to send notification
async function createNotification(
  userId: number,
  title: string,
  message: string,
  type: string,
  link?: string
) {
  try {
    await db.insert(notificationsTable).values({
      userId,
      title,
      message,
      notificationType: type,
      isRead: false,
    });

    // Also dispatch email notification based on user preferences
    const [u] = await db
      .select({ email: usersTable.email, name: usersTable.name })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    if (u?.email) {
      sendWorkflowEmail({
        to: u.email,
        recipientName: u.name,
        userId,
        eventType: type,
        subject: title,
        title,
        message,
        actionUrl: link || "/ra-bills",
        actionLabel: "View in Kanak Turnkey",
      }).catch((e) => console.warn("Email workflow notification error:", e));
    }
  } catch (err) {
    console.error("Failed to create notification:", err);
  }
}

// Helper to notify all Project Managers and Admins
async function notifyManagers(title: string, message: string, type: string, link?: string) {
  try {
    const managers = await db.select({ id: usersTable.id, roles: usersTable.roles }).from(usersTable);
    for (const m of managers) {
      let r: string[] = [];
      if (typeof m.roles === "string") {
        try { r = JSON.parse(m.roles); } catch { r = []; }
      } else if (Array.isArray(m.roles)) {
        r = m.roles;
      }
      if (r.includes("admin") || r.includes("project_manager")) {
        await createNotification(m.id, title, message, type, link);
      }
    }
  } catch (err) {
    console.error("Failed to notify managers:", err);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// STATS / SUMMARY
// ═══════════════════════════════════════════════════════════════════════════

router.get("/stats/summary", async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.query;
    const pId = projectId ? Number(projectId) : undefined;

    // Contracts stats
    let contractsQuery = db.select({
      total: sql<number>`count(*)`,
      totalValue: sql<string>`coalesce(sum(${contractsTable.totalAmount}), 0)`,
    }).from(contractsTable).$dynamic();
    if (pId) contractsQuery = contractsQuery.where(eq(contractsTable.projectId, pId));
    const [cStats] = await contractsQuery;

    // Work Completions stats
    let wcQuery = db.select({
      total: sql<number>`count(*)`,
      pending: sql<number>`sum(case when ${workCompletionsTable.status} = 'submitted' then 1 else 0 end)`,
      verified: sql<number>`sum(case when ${workCompletionsTable.status} = 'verified' then 1 else 0 end)`,
    }).from(workCompletionsTable).$dynamic();
    if (pId) wcQuery = wcQuery.where(eq(workCompletionsTable.projectId, pId));
    const [wcStats] = await wcQuery;

    // RA Bills stats
    let raQuery = db.select({
      total: sql<number>`count(*)`,
      draft: sql<number>`sum(case when ${raBillsTable.status} = 'draft' then 1 else 0 end)`,
      submitted: sql<number>`sum(case when ${raBillsTable.status} = 'submitted' then 1 else 0 end)`,
      approved: sql<number>`sum(case when ${raBillsTable.status} = 'approved' then 1 else 0 end)`,
      revisionRequested: sql<number>`sum(case when ${raBillsTable.status} = 'revision_requested' then 1 else 0 end)`,
      totalGross: sql<string>`coalesce(sum(${raBillsTable.grossAmount}), 0)`,
      totalNet: sql<string>`coalesce(sum(${raBillsTable.netPayableAmount}), 0)`,
      totalRetention: sql<string>`coalesce(sum(${raBillsTable.retentionAmount}), 0)`,
    }).from(raBillsTable).$dynamic();
    if (pId) raQuery = raQuery.where(eq(raBillsTable.projectId, pId));
    const [raStats] = await raQuery;

    // Invoices stats
    let invQuery = db.select({
      total: sql<number>`count(*)`,
      paid: sql<number>`sum(case when ${invoicesTable.status} = 'paid' then 1 else 0 end)`,
      unpaid: sql<number>`sum(case when ${invoicesTable.status} in ('draft', 'sent') then 1 else 0 end)`,
      partiallyPaid: sql<number>`sum(case when ${invoicesTable.status} = 'partially_paid' then 1 else 0 end)`,
      reconciled: sql<number>`sum(case when ${invoicesTable.reconciliationStatus} = 'reconciled' then 1 else 0 end)`,
      totalPaid: sql<string>`coalesce(sum(${invoicesTable.totalPaidAmount}), 0)`,
      totalOutstanding: sql<string>`coalesce(sum(${invoicesTable.outstandingAmount}), 0)`,
    }).from(invoicesTable).$dynamic();
    if (pId) invQuery = invQuery.where(eq(invoicesTable.projectId, pId));
    const [invStats] = await invQuery;

    res.json({
      contracts: {
        total: Number(cStats?.total || 0),
        totalValue: Number(cStats?.totalValue || 0),
      },
      workCompletions: {
        total: Number(wcStats?.total || 0),
        pendingVerification: Number(wcStats?.pending || 0),
        verified: Number(wcStats?.verified || 0),
      },
      raBills: {
        total: Number(raStats?.total || 0),
        draft: Number(raStats?.draft || 0),
        pendingApproval: Number(raStats?.submitted || 0),
        approved: Number(raStats?.approved || 0),
        revisionRequested: Number(raStats?.revisionRequested || 0),
        totalGrossAmount: Number(raStats?.totalGross || 0),
        totalNetPayableAmount: Number(raStats?.totalNet || 0),
        totalRetentionAmount: Number(raStats?.totalRetention || 0),
      },
      invoices: {
        total: Number(invStats?.total || 0),
        paidCount: Number(invStats?.paid || 0),
        unpaidCount: Number(invStats?.unpaid || 0),
        partiallyPaidCount: Number(invStats?.partiallyPaid || 0),
        reconciledCount: Number(invStats?.reconciled || 0),
        totalPaidAmount: Number(invStats?.totalPaid || 0),
        totalOutstandingAmount: Number(invStats?.totalOutstanding || 0),
      },
    });
  } catch (error) {
    console.error("Error fetching stats summary:", error);
    res.status(500).json({ error: "Failed to fetch stats summary" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// CONTRACTS & BOQ ITEMS
// ═══════════════════════════════════════════════════════════════════════════

// GET /contracts - List all contracts
router.get("/contracts", async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId, vendorId, status, search } = req.query;

    let query = db
      .select({
        contract: contractsTable,
        projectName: projectsTable.name,
        vendorName: vendorsTable.name,
        creatorName: usersTable.name,
      })
      .from(contractsTable)
      .leftJoin(projectsTable, eq(projectsTable.id, contractsTable.projectId))
      .leftJoin(vendorsTable, eq(vendorsTable.id, contractsTable.vendorId))
      .leftJoin(usersTable, eq(usersTable.id, contractsTable.createdById))
      .$dynamic();

    const conditions = [];
    if (projectId) conditions.push(eq(contractsTable.projectId, Number(projectId)));
    if (vendorId) conditions.push(eq(contractsTable.vendorId, Number(vendorId)));
    if (status) conditions.push(eq(contractsTable.status, String(status)));
    if (search) {
      conditions.push(
        or(
          like(contractsTable.contractNumber, `%${search}%`),
          like(contractsTable.title, `%${search}%`)
        )!
      );
    }

    if (conditions.length > 0) query = query.where(and(...conditions));
    const rows = await query.orderBy(desc(contractsTable.createdAt));

    res.json(
      rows.map((r) => ({
        ...r.contract,
        totalAmount: Number(r.contract.totalAmount || 0),
        retentionPercent: Number(r.contract.retentionPercent || 5),
        advancePercent: Number(r.contract.advancePercent || 0),
        tdsPercent: Number(r.contract.tdsPercent || 2),
        gstPercent: Number(r.contract.gstPercent || 18),
        projectName: r.projectName,
        vendorName: r.vendorName,
        creatorName: r.creatorName,
      }))
    );
  } catch (error) {
    console.error("Error fetching contracts:", error);
    res.status(500).json({ error: "Failed to fetch contracts" });
  }
});

// POST /contracts - Create contract with initial BOQ items
router.post("/contracts", async (req: Request, res: Response): Promise<void> => {
  try {
    const me = await getCurrentUser(req);
    const {
      projectId,
      vendorId,
      title,
      description,
      totalAmount,
      retentionPercent,
      advancePercent,
      tdsPercent,
      gstPercent,
      startDate,
      endDate,
      status,
      boqItems,
    } = req.body;

    if (!projectId || !vendorId || !title) {
      res.status(400).json({ error: "projectId, vendorId, and title are required" });
      return;
    }

    const contractNumber = await generateNumber("CNT", contractsTable);

    // Calculate total amount from boq items if provided
    let calcTotal = totalAmount ? Number(totalAmount) : 0;
    if (Array.isArray(boqItems) && boqItems.length > 0) {
      calcTotal = boqItems.reduce((acc: number, item: any) => {
        const qty = Number(item.quantity || 0);
        const rate = Number(item.rate || 0);
        return acc + qty * rate;
      }, 0);
    }

    const [insertResult] = await db.insert(contractsTable).values({
      contractNumber,
      projectId: Number(projectId),
      vendorId: Number(vendorId),
      title: String(title),
      description: description ? String(description) : null,
      totalAmount: String(calcTotal),
      retentionPercent: String(retentionPercent ?? "5.00"),
      advancePercent: String(advancePercent ?? "0.00"),
      tdsPercent: String(tdsPercent ?? "2.00"),
      gstPercent: String(gstPercent ?? "18.00"),
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      status: status || "active",
      createdById: me.id,
    });

    const contractId = insertResult.insertId;

    // Insert BOQ items
    if (Array.isArray(boqItems) && boqItems.length > 0) {
      for (let i = 0; i < boqItems.length; i++) {
        const item = boqItems[i];
        const qty = Number(item.quantity || 0);
        const rate = Number(item.rate || 0);
        await db.insert(contractBoqItemsTable).values({
          contractId,
          itemNumber: item.itemNumber || `${i + 1}`,
          description: String(item.description),
          unit: item.unit || "nos",
          quantity: String(qty),
          rate: String(rate),
          totalAmount: String(qty * rate),
          cumulativeCompletedQty: "0",
          cumulativeBilledQty: "0",
          sortOrder: i,
        });
      }
    }

    await logAudit(me.id, "Created Contract", "contract", contractId, {
      contractNumber,
      title,
      totalAmount: calcTotal,
    });

    const [created] = await db.select().from(contractsTable).where(eq(contractsTable.id, contractId));
    res.status(201).json(created);
  } catch (error) {
    console.error("Error creating contract:", error);
    res.status(500).json({ error: "Failed to create contract" });
  }
});

// GET /contracts/:id - Get contract with BOQ items
router.get("/contracts/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const [contractRow] = await db
      .select({
        contract: contractsTable,
        projectName: projectsTable.name,
        vendorName: vendorsTable.name,
        vendorEmail: vendorsTable.email,
        vendorPhone: vendorsTable.phone,
        creatorName: usersTable.name,
      })
      .from(contractsTable)
      .leftJoin(projectsTable, eq(projectsTable.id, contractsTable.projectId))
      .leftJoin(vendorsTable, eq(vendorsTable.id, contractsTable.vendorId))
      .leftJoin(usersTable, eq(usersTable.id, contractsTable.createdById))
      .where(eq(contractsTable.id, id));

    if (!contractRow) {
      res.status(404).json({ error: "Contract not found" });
      return;
    }

    const boqItems = await db
      .select()
      .from(contractBoqItemsTable)
      .where(eq(contractBoqItemsTable.contractId, id))
      .orderBy(asc(contractBoqItemsTable.sortOrder), asc(contractBoqItemsTable.id));

    res.json({
      ...contractRow.contract,
      totalAmount: Number(contractRow.contract.totalAmount || 0),
      retentionPercent: Number(contractRow.contract.retentionPercent || 5),
      advancePercent: Number(contractRow.contract.advancePercent || 0),
      tdsPercent: Number(contractRow.contract.tdsPercent || 2),
      gstPercent: Number(contractRow.contract.gstPercent || 18),
      projectName: contractRow.projectName,
      vendorName: contractRow.vendorName,
      vendorEmail: contractRow.vendorEmail,
      vendorPhone: contractRow.vendorPhone,
      creatorName: contractRow.creatorName,
      boqItems: boqItems.map((b) => ({
        ...b,
        quantity: Number(b.quantity || 0),
        rate: Number(b.rate || 0),
        totalAmount: Number(b.totalAmount || 0),
        cumulativeCompletedQty: Number(b.cumulativeCompletedQty || 0),
        cumulativeBilledQty: Number(b.cumulativeBilledQty || 0),
        remainingCompletedQty: Math.max(0, Number(b.quantity || 0) - Number(b.cumulativeCompletedQty || 0)),
        remainingBilledQty: Math.max(0, Number(b.quantity || 0) - Number(b.cumulativeBilledQty || 0)),
      })),
    });
  } catch (error) {
    console.error("Error fetching contract:", error);
    res.status(500).json({ error: "Failed to fetch contract" });
  }
});

// PATCH /contracts/:id - Update contract
router.patch("/contracts/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const me = await getCurrentUser(req);
    const updates: Record<string, unknown> = {};

    const fields = [
      "title", "description", "retentionPercent", "advancePercent",
      "tdsPercent", "gstPercent", "status", "startDate", "endDate"
    ];
    for (const f of fields) {
      if (req.body[f] !== undefined) {
        if (f.endsWith("Date") && req.body[f]) {
          updates[f] = new Date(req.body[f]);
        } else {
          updates[f] = req.body[f];
        }
      }
    }

    await db.update(contractsTable).set(updates).where(eq(contractsTable.id, id));
    await logAudit(me.id, "Updated Contract", "contract", id, updates);

    const [updated] = await db.select().from(contractsTable).where(eq(contractsTable.id, id));
    res.json(updated);
  } catch (error) {
    console.error("Error updating contract:", error);
    res.status(500).json({ error: "Failed to update contract" });
  }
});

// POST /contracts/:id/boq-items - Add BOQ item to contract
router.post("/contracts/:id/boq-items", async (req: Request, res: Response): Promise<void> => {
  try {
    const contractId = Number(req.params.id);
    const { itemNumber, description, unit, quantity, rate } = req.body;

    if (!description || quantity === undefined || rate === undefined) {
      res.status(400).json({ error: "description, quantity, and rate are required" });
      return;
    }

    const qty = Number(quantity);
    const rt = Number(rate);
    const totalAmount = qty * rt;

    const [countRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(contractBoqItemsTable)
      .where(eq(contractBoqItemsTable.contractId, contractId));

    const [ins] = await db.insert(contractBoqItemsTable).values({
      contractId,
      itemNumber: itemNumber || `${(countRow?.count || 0) + 1}`,
      description: String(description),
      unit: unit || "nos",
      quantity: String(qty),
      rate: String(rt),
      totalAmount: String(totalAmount),
      cumulativeCompletedQty: "0",
      cumulativeBilledQty: "0",
      sortOrder: countRow?.count || 0,
    });

    // Update contract totalAmount
    const [sumRow] = await db
      .select({ sum: sql<string>`coalesce(sum(${contractBoqItemsTable.totalAmount}), 0)` })
      .from(contractBoqItemsTable)
      .where(eq(contractBoqItemsTable.contractId, contractId));

    await db
      .update(contractsTable)
      .set({ totalAmount: sumRow.sum })
      .where(eq(contractsTable.id, contractId));

    const [item] = await db
      .select()
      .from(contractBoqItemsTable)
      .where(eq(contractBoqItemsTable.id, ins.insertId));

    res.status(201).json(item);
  } catch (error) {
    console.error("Error adding BOQ item:", error);
    res.status(500).json({ error: "Failed to add BOQ item" });
  }
});

// PUT /contracts/:id/boq-items/:itemId - Update BOQ item
router.put("/contracts/:id/boq-items/:itemId", async (req: Request, res: Response): Promise<void> => {
  try {
    const contractId = Number(req.params.id);
    const itemId = Number(req.params.itemId);
    const { itemNumber, description, unit, quantity, rate } = req.body;

    const qty = Number(quantity);
    const rt = Number(rate);
    const totalAmount = qty * rt;

    await db
      .update(contractBoqItemsTable)
      .set({
        itemNumber,
        description,
        unit,
        quantity: String(qty),
        rate: String(rt),
        totalAmount: String(totalAmount),
      })
      .where(
        and(
          eq(contractBoqItemsTable.id, itemId),
          eq(contractBoqItemsTable.contractId, contractId)
        )
      );

    // Recalculate contract total
    const [sumRow] = await db
      .select({ sum: sql<string>`coalesce(sum(${contractBoqItemsTable.totalAmount}), 0)` })
      .from(contractBoqItemsTable)
      .where(eq(contractBoqItemsTable.contractId, contractId));

    await db
      .update(contractsTable)
      .set({ totalAmount: sumRow.sum })
      .where(eq(contractsTable.id, contractId));

    const [updated] = await db
      .select()
      .from(contractBoqItemsTable)
      .where(eq(contractBoqItemsTable.id, itemId));

    res.json(updated);
  } catch (error) {
    console.error("Error updating BOQ item:", error);
    res.status(500).json({ error: "Failed to update BOQ item" });
  }
});

// DELETE /contracts/:id/boq-items/:itemId - Delete BOQ item
router.delete("/contracts/:id/boq-items/:itemId", async (req: Request, res: Response): Promise<void> => {
  try {
    const contractId = Number(req.params.id);
    const itemId = Number(req.params.itemId);

    await db
      .delete(contractBoqItemsTable)
      .where(
        and(
          eq(contractBoqItemsTable.id, itemId),
          eq(contractBoqItemsTable.contractId, contractId)
        )
      );

    // Recalculate contract total
    const [sumRow] = await db
      .select({ sum: sql<string>`coalesce(sum(${contractBoqItemsTable.totalAmount}), 0)` })
      .from(contractBoqItemsTable)
      .where(eq(contractBoqItemsTable.contractId, contractId));

    await db
      .update(contractsTable)
      .set({ totalAmount: sumRow?.sum || "0" })
      .where(eq(contractsTable.id, contractId));

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting BOQ item:", error);
    res.status(500).json({ error: "Failed to delete BOQ item" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// WORK COMPLETIONS
// ═══════════════════════════════════════════════════════════════════════════

// GET /work-completions - List all work completions
router.get("/work-completions", async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId, contractId, vendorId, status } = req.query;

    let query = db
      .select({
        wc: workCompletionsTable,
        projectName: projectsTable.name,
        contractTitle: contractsTable.title,
        contractNumber: contractsTable.contractNumber,
        vendorName: vendorsTable.name,
        creatorName: usersTable.name,
      })
      .from(workCompletionsTable)
      .leftJoin(projectsTable, eq(projectsTable.id, workCompletionsTable.projectId))
      .leftJoin(contractsTable, eq(contractsTable.id, workCompletionsTable.contractId))
      .leftJoin(vendorsTable, eq(vendorsTable.id, workCompletionsTable.vendorId))
      .leftJoin(usersTable, eq(usersTable.id, workCompletionsTable.createdById))
      .$dynamic();

    const conditions = [];
    if (projectId) conditions.push(eq(workCompletionsTable.projectId, Number(projectId)));
    if (contractId) conditions.push(eq(workCompletionsTable.contractId, Number(contractId)));
    if (vendorId) conditions.push(eq(workCompletionsTable.vendorId, Number(vendorId)));
    if (status) conditions.push(eq(workCompletionsTable.status, String(status)));

    if (conditions.length > 0) query = query.where(and(...conditions));
    const rows = await query.orderBy(desc(workCompletionsTable.createdAt));

    res.json(
      rows.map((r) => ({
        ...r.wc,
        projectName: r.projectName,
        contractTitle: r.contractTitle,
        contractNumber: r.contractNumber,
        vendorName: r.vendorName,
        creatorName: r.creatorName,
      }))
    );
  } catch (error) {
    console.error("Error fetching work completions:", error);
    res.status(500).json({ error: "Failed to fetch work completions" });
  }
});

// POST /work-completions - Create work completion (DRAFT)
router.post("/work-completions", async (req: Request, res: Response): Promise<void> => {
  try {
    const me = await getCurrentUser(req);
    const {
      projectId,
      contractId,
      vendorId,
      title,
      milestone,
      completionDate,
      remarks,
      items,
      documents,
    } = req.body;

    if (!projectId || !contractId || !vendorId || !title || !completionDate) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const workCompletionNumber = await generateNumber("WC", workCompletionsTable);

    const [ins] = await db.insert(workCompletionsTable).values({
      workCompletionNumber,
      projectId: Number(projectId),
      contractId: Number(contractId),
      vendorId: Number(vendorId),
      title: String(title),
      milestone: milestone ? String(milestone) : null,
      completionDate: new Date(completionDate),
      remarks: remarks ? String(remarks) : null,
      status: "draft",
      createdById: me.id,
    });

    const workCompletionId = ins.insertId;

    // Line items
    if (Array.isArray(items) && items.length > 0) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        // Fetch BOQ item to get baseline
        const [boqItem] = await db
          .select()
          .from(contractBoqItemsTable)
          .where(eq(contractBoqItemsTable.id, Number(item.contractBoqItemId)));

        if (boqItem) {
          const prevCompleted = Number(boqItem.cumulativeCompletedQty || 0);
          const curCompleted = Number(item.currentCompletedQty || 0);
          const cumulative = prevCompleted + curCompleted;
          const rate = Number(boqItem.rate || 0);
          const curAmount = curCompleted * rate;

          await db.insert(workCompletionItemsTable).values({
            workCompletionId,
            contractBoqItemId: boqItem.id,
            description: boqItem.description,
            unit: boqItem.unit,
            rate: String(rate),
            previousCompletedQty: String(prevCompleted),
            currentCompletedQty: String(curCompleted),
            cumulativeQty: String(cumulative),
            currentAmount: String(curAmount),
            remarks: item.remarks ? String(item.remarks) : null,
            sortOrder: i,
          });
        }
      }
    }

    // Documents
    if (Array.isArray(documents) && documents.length > 0) {
      for (const doc of documents) {
        if (doc.fileName && doc.fileUrl) {
          await db.insert(workCompletionDocumentsTable).values({
            workCompletionId,
            documentType: doc.documentType || "other",
            fileName: String(doc.fileName),
            fileUrl: String(doc.fileUrl),
            fileSize: doc.fileSize ? Number(doc.fileSize) : null,
            uploadedById: me.id,
          });
        }
      }
    }

    await logAudit(me.id, "Created Work Completion", "work_completion", workCompletionId, {
      workCompletionNumber,
      title,
    });

    const [created] = await db
      .select()
      .from(workCompletionsTable)
      .where(eq(workCompletionsTable.id, workCompletionId));

    res.status(201).json(created);
  } catch (error) {
    console.error("Error creating work completion:", error);
    res.status(500).json({ error: "Failed to create work completion" });
  }
});

// GET /work-completions/:id - Get work completion details
router.get("/work-completions/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const [row] = await db
      .select({
        wc: workCompletionsTable,
        projectName: projectsTable.name,
        contractTitle: contractsTable.title,
        contractNumber: contractsTable.contractNumber,
        vendorName: vendorsTable.name,
        creatorName: usersTable.name,
      })
      .from(workCompletionsTable)
      .leftJoin(projectsTable, eq(projectsTable.id, workCompletionsTable.projectId))
      .leftJoin(contractsTable, eq(contractsTable.id, workCompletionsTable.contractId))
      .leftJoin(vendorsTable, eq(vendorsTable.id, workCompletionsTable.vendorId))
      .leftJoin(usersTable, eq(usersTable.id, workCompletionsTable.createdById))
      .where(eq(workCompletionsTable.id, id));

    if (!row) {
      res.status(404).json({ error: "Work completion not found" });
      return;
    }

    // Get verifier name if verified
    let verifierName: string | null = null;
    if (row.wc.verifiedById) {
      const [verifier] = await db
        .select({ name: usersTable.name })
        .from(usersTable)
        .where(eq(usersTable.id, row.wc.verifiedById));
      verifierName = verifier?.name || null;
    }

    const items = await db
      .select({
        item: workCompletionItemsTable,
        itemNumber: contractBoqItemsTable.itemNumber,
        contractQty: contractBoqItemsTable.quantity,
      })
      .from(workCompletionItemsTable)
      .leftJoin(contractBoqItemsTable, eq(contractBoqItemsTable.id, workCompletionItemsTable.contractBoqItemId))
      .where(eq(workCompletionItemsTable.workCompletionId, id))
      .orderBy(asc(workCompletionItemsTable.sortOrder), asc(workCompletionItemsTable.id));

    const documents = await db
      .select({
        doc: workCompletionDocumentsTable,
        uploaderName: usersTable.name,
      })
      .from(workCompletionDocumentsTable)
      .leftJoin(usersTable, eq(usersTable.id, workCompletionDocumentsTable.uploadedById))
      .where(eq(workCompletionDocumentsTable.workCompletionId, id))
      .orderBy(desc(workCompletionDocumentsTable.uploadedAt));

    res.json({
      ...row.wc,
      projectName: row.projectName,
      contractTitle: row.contractTitle,
      contractNumber: row.contractNumber,
      vendorName: row.vendorName,
      creatorName: row.creatorName,
      verifierName,
      items: items.map((i) => ({
        ...i.item,
        itemNumber: i.itemNumber,
        contractQty: Number(i.contractQty || 0),
        rate: Number(i.item.rate || 0),
        previousCompletedQty: Number(i.item.previousCompletedQty || 0),
        currentCompletedQty: Number(i.item.currentCompletedQty || 0),
        cumulativeQty: Number(i.item.cumulativeQty || 0),
        currentAmount: Number(i.item.currentAmount || 0),
      })),
      documents: documents.map((d) => ({
        ...d.doc,
        uploaderName: d.uploaderName,
      })),
    });
  } catch (error) {
    console.error("Error fetching work completion details:", error);
    res.status(500).json({ error: "Failed to fetch work completion details" });
  }
});

// POST /work-completions/:id/submit - Submit for verification
router.post("/work-completions/:id/submit", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const me = await getCurrentUser(req);

    const [wc] = await db.select().from(workCompletionsTable).where(eq(workCompletionsTable.id, id));
    if (!wc) {
      res.status(404).json({ error: "Work completion not found" });
      return;
    }

    if (wc.status !== "draft" && wc.status !== "correction_required") {
      res.status(400).json({ error: `Cannot submit work completion in '${wc.status}' status` });
      return;
    }

    await db
      .update(workCompletionsTable)
      .set({
        status: "submitted",
        submittedAt: new Date(),
      })
      .where(eq(workCompletionsTable.id, id));

    await logAudit(me.id, "Submitted Work Completion for Verification", "work_completion", id);
    await notifyManagers(
      "Work Completion Submitted for Verification",
      `Work Completion ${wc.workCompletionNumber} (${wc.title}) has been submitted for verification.`,
      "work_completion",
      `/ra-bills/work-completions/${id}`
    );

    const [updated] = await db.select().from(workCompletionsTable).where(eq(workCompletionsTable.id, id));
    res.json(updated);
  } catch (error) {
    console.error("Error submitting work completion:", error);
    res.status(500).json({ error: "Failed to submit work completion" });
  }
});

// POST /work-completions/:id/verify - PM/Engineer verifies work completion
router.post("/work-completions/:id/verify", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const me = await getCurrentUser(req);

    const [wc] = await db.select().from(workCompletionsTable).where(eq(workCompletionsTable.id, id));
    if (!wc) {
      res.status(404).json({ error: "Work completion not found" });
      return;
    }

    if (wc.status !== "submitted") {
      res.status(400).json({ error: `Cannot verify work completion in '${wc.status}' status` });
      return;
    }

    // Update work completion status
    await db
      .update(workCompletionsTable)
      .set({
        status: "verified",
        verifiedById: me.id,
        verifiedAt: new Date(),
        correctionReason: null,
      })
      .where(eq(workCompletionsTable.id, id));

    // Update cumulative completed quantities on contract BOQ items
    const items = await db
      .select()
      .from(workCompletionItemsTable)
      .where(eq(workCompletionItemsTable.workCompletionId, id));

    for (const item of items) {
      const curQty = Number(item.currentCompletedQty || 0);
      if (curQty > 0) {
        await db
          .update(contractBoqItemsTable)
          .set({
            cumulativeCompletedQty: sql`${contractBoqItemsTable.cumulativeCompletedQty} + ${curQty}`,
          })
          .where(eq(contractBoqItemsTable.id, item.contractBoqItemId));
      }
    }

    await logAudit(me.id, "Verified Work Completion", "work_completion", id);

    if (wc.createdById) {
      await createNotification(
        wc.createdById,
        "Work Completion Verified",
        `Your work completion ${wc.workCompletionNumber} has been verified by ${me.name}. Ready for RA Bill preparation.`,
        "work_completion",
        `/ra-bills/work-completions/${id}`
      );
    }

    const [updated] = await db.select().from(workCompletionsTable).where(eq(workCompletionsTable.id, id));
    res.json(updated);
  } catch (error) {
    console.error("Error verifying work completion:", error);
    res.status(500).json({ error: "Failed to verify work completion" });
  }
});

// POST /work-completions/:id/request-correction - PM requests correction
router.post("/work-completions/:id/request-correction", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const me = await getCurrentUser(req);
    const { reason } = req.body;

    if (!reason) {
      res.status(400).json({ error: "Correction reason is required" });
      return;
    }

    const [wc] = await db.select().from(workCompletionsTable).where(eq(workCompletionsTable.id, id));
    if (!wc) {
      res.status(404).json({ error: "Work completion not found" });
      return;
    }

    await db
      .update(workCompletionsTable)
      .set({
        status: "correction_required",
        correctionReason: String(reason),
      })
      .where(eq(workCompletionsTable.id, id));

    await logAudit(me.id, "Requested Correction for Work Completion", "work_completion", id, { reason });

    if (wc.createdById) {
      await createNotification(
        wc.createdById,
        "Work Completion Revision Requested",
        `Changes requested for ${wc.workCompletionNumber}: "${reason}"`,
        "work_completion",
        `/ra-bills/work-completions/${id}`
      );
    }

    const [updated] = await db.select().from(workCompletionsTable).where(eq(workCompletionsTable.id, id));
    res.json(updated);
  } catch (error) {
    console.error("Error requesting correction:", error);
    res.status(500).json({ error: "Failed to request correction" });
  }
});

// POST /work-completions/:id/documents - Attach supporting document
router.post("/work-completions/:id/documents", async (req: Request, res: Response): Promise<void> => {
  try {
    const workCompletionId = Number(req.params.id);
    const me = await getCurrentUser(req);
    const { documentType, fileName, fileUrl, fileSize } = req.body;

    if (!fileName || !fileUrl) {
      res.status(400).json({ error: "fileName and fileUrl are required" });
      return;
    }

    const [ins] = await db.insert(workCompletionDocumentsTable).values({
      workCompletionId,
      documentType: documentType || "other",
      fileName: String(fileName),
      fileUrl: String(fileUrl),
      fileSize: fileSize ? Number(fileSize) : null,
      uploadedById: me.id,
    });

    const [doc] = await db
      .select()
      .from(workCompletionDocumentsTable)
      .where(eq(workCompletionDocumentsTable.id, ins.insertId));

    res.status(201).json(doc);
  } catch (error) {
    console.error("Error uploading work completion document:", error);
    res.status(500).json({ error: "Failed to upload document" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// RA BILLS
// ═══════════════════════════════════════════════════════════════════════════

// GET /ra-bills - List RA Bills with full financial details
router.get("/ra-bills", async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId, contractId, vendorId, status } = req.query;

    let query = db
      .select({
        bill: raBillsTable,
        projectName: projectsTable.name,
        contractTitle: contractsTable.title,
        contractNumber: contractsTable.contractNumber,
        vendorName: vendorsTable.name,
        creatorName: usersTable.name,
      })
      .from(raBillsTable)
      .leftJoin(projectsTable, eq(projectsTable.id, raBillsTable.projectId))
      .leftJoin(contractsTable, eq(contractsTable.id, raBillsTable.contractId))
      .leftJoin(vendorsTable, eq(vendorsTable.id, raBillsTable.vendorId))
      .leftJoin(usersTable, eq(usersTable.id, raBillsTable.createdById))
      .$dynamic();

    const conditions = [];
    if (projectId) conditions.push(eq(raBillsTable.projectId, Number(projectId)));
    if (contractId) conditions.push(eq(raBillsTable.contractId, Number(contractId)));
    if (vendorId) conditions.push(eq(raBillsTable.vendorId, Number(vendorId)));
    if (status) conditions.push(eq(raBillsTable.status, String(status)));

    if (conditions.length > 0) query = query.where(and(...conditions));
    const rows = await query.orderBy(desc(raBillsTable.createdAt));

    res.json(
      rows.map((r) => ({
        ...r.bill,
        grossAmount: Number(r.bill.grossAmount || 0),
        amount: Number(r.bill.amount || 0),
        retentionPercent: Number(r.bill.retentionPercent || 5),
        retentionAmount: Number(r.bill.retentionAmount || 0),
        advanceRecovery: Number(r.bill.advanceRecovery || 0),
        tdsPercent: Number(r.bill.tdsPercent || 2),
        tdsAmount: Number(r.bill.tdsAmount || 0),
        gstPercent: Number(r.bill.gstPercent || 18),
        gstAmount: Number(r.bill.gstAmount || 0),
        otherDeductions: Number(r.bill.otherDeductions || 0),
        netPayableAmount: Number(r.bill.netPayableAmount || 0),
        projectName: r.projectName,
        contractTitle: r.contractTitle,
        contractNumber: r.contractNumber,
        vendorName: r.vendorName,
        creatorName: r.creatorName,
      }))
    );
  } catch (error) {
    console.error("Error fetching RA Bills:", error);
    res.status(500).json({ error: "Failed to fetch RA Bills" });
  }
});

// POST /ra-bills - Prepare RA Bill (from verified work completion or contract)
router.post("/ra-bills", async (req: Request, res: Response): Promise<void> => {
  try {
    const me = await getCurrentUser(req);
    const {
      projectId,
      contractId,
      vendorId,
      workCompletionId,
      description,
      milestone,
      billingPeriodStart,
      billingPeriodEnd,
      retentionPercent,
      advanceRecovery,
      tdsPercent,
      gstPercent,
      otherDeductions,
      deductionRemarks,
      items,
      documents,
    } = req.body;

    if (!projectId || !contractId || !vendorId) {
      res.status(400).json({ error: "projectId, contractId, and vendorId are required" });
      return;
    }

    // Get contract defaults if not provided
    const [contract] = await db.select().from(contractsTable).where(eq(contractsTable.id, Number(contractId)));
    const retPct = retentionPercent !== undefined ? Number(retentionPercent) : Number(contract?.retentionPercent || 5);
    const advRec = advanceRecovery !== undefined ? Number(advanceRecovery) : 0;
    const tdsPct = tdsPercent !== undefined ? Number(tdsPercent) : Number(contract?.tdsPercent || 2);
    const gstPct = gstPercent !== undefined ? Number(gstPercent) : Number(contract?.gstPercent || 18);
    const othDed = otherDeductions !== undefined ? Number(otherDeductions) : 0;

    const billNumber = await generateNumber("RA", raBillsTable);

    // Calculate line items first
    let grossAmount = 0;
    const computedItems: Array<{
      contractBoqItemId: number;
      description: string;
      unit: string;
      rate: number;
      contractQuantity: number;
      previousBilledQty: number;
      currentBilledQty: number;
      cumulativeBilledQty: number;
      previousAmount: number;
      currentAmount: number;
      cumulativeAmount: number;
      sortOrder: number;
    }> = [];

    if (Array.isArray(items) && items.length > 0) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const [boqItem] = await db
          .select()
          .from(contractBoqItemsTable)
          .where(eq(contractBoqItemsTable.id, Number(item.contractBoqItemId)));

        if (boqItem) {
          const rate = Number(boqItem.rate || 0);
          const contractQty = Number(boqItem.quantity || 0);
          const prevBilled = Number(boqItem.cumulativeBilledQty || 0);
          const curBilled = Number(item.currentBilledQty || 0);
          const cumBilled = prevBilled + curBilled;
          const curAmt = curBilled * rate;
          const prevAmt = prevBilled * rate;
          const cumAmt = cumBilled * rate;

          grossAmount += curAmt;

          computedItems.push({
            contractBoqItemId: boqItem.id,
            description: boqItem.description,
            unit: boqItem.unit,
            rate,
            contractQuantity: contractQty,
            previousBilledQty: prevBilled,
            currentBilledQty: curBilled,
            cumulativeBilledQty: cumBilled,
            previousAmount: prevAmt,
            currentAmount: curAmt,
            cumulativeAmount: cumAmt,
            sortOrder: i,
          });
        }
      }
    }

    // Calculate deductions
    const retentionAmount = (grossAmount * retPct) / 100;
    const tdsAmount = (grossAmount * tdsPct) / 100;
    const gstAmount = (grossAmount * gstPct) / 100;
    const netPayableAmount = Math.max(
      0,
      grossAmount + gstAmount - retentionAmount - advRec - tdsAmount - othDed
    );

    const [ins] = await db.insert(raBillsTable).values({
      billNumber,
      projectId: Number(projectId),
      contractId: Number(contractId),
      vendorId: Number(vendorId),
      workCompletionId: workCompletionId ? Number(workCompletionId) : null,
      description: description ? String(description) : null,
      milestone: milestone ? String(milestone) : null,
      billingPeriodStart: billingPeriodStart ? new Date(billingPeriodStart) : null,
      billingPeriodEnd: billingPeriodEnd ? new Date(billingPeriodEnd) : null,
      grossAmount: String(grossAmount),
      amount: String(netPayableAmount), // match net payable for consistency
      retentionPercent: String(retPct),
      retentionAmount: String(retentionAmount),
      advanceRecovery: String(advRec),
      tdsPercent: String(tdsPct),
      tdsAmount: String(tdsAmount),
      gstPercent: String(gstPct),
      gstAmount: String(gstAmount),
      otherDeductions: String(othDed),
      deductionRemarks: deductionRemarks ? String(deductionRemarks) : null,
      netPayableAmount: String(netPayableAmount),
      status: "draft",
      createdById: me.id,
    });

    const raBillId = ins.insertId;

    // Insert line items
    for (const cItem of computedItems) {
      await db.insert(raBillItemsTable).values({
        raBillId,
        contractBoqItemId: cItem.contractBoqItemId,
        description: cItem.description,
        unit: cItem.unit,
        rate: String(cItem.rate),
        contractQuantity: String(cItem.contractQuantity),
        previousBilledQty: String(cItem.previousBilledQty),
        currentBilledQty: String(cItem.currentBilledQty),
        cumulativeBilledQty: String(cItem.cumulativeBilledQty),
        previousAmount: String(cItem.previousAmount),
        currentAmount: String(cItem.currentAmount),
        cumulativeAmount: String(cItem.cumulativeAmount),
        sortOrder: cItem.sortOrder,
      });
    }

    // Insert documents
    if (Array.isArray(documents) && documents.length > 0) {
      for (const doc of documents) {
        if (doc.fileName && doc.fileUrl) {
          await db.insert(raBillDocumentsTable).values({
            raBillId,
            documentType: doc.documentType || "other",
            fileName: String(doc.fileName),
            fileUrl: String(doc.fileUrl),
            fileSize: doc.fileSize ? Number(doc.fileSize) : null,
            uploadedById: me.id,
          });
        }
      }
    }

    // Record creation in approval history
    await db.insert(raBillApprovalHistoryTable).values({
      raBillId,
      action: "created",
      userId: me.id,
      previousStatus: null,
      newStatus: "draft",
      comments: "RA Bill drafted",
    });

    await logAudit(me.id, "Created RA Bill", "ra_bill", raBillId, {
      billNumber,
      grossAmount,
      netPayableAmount,
    });

    const [created] = await db.select().from(raBillsTable).where(eq(raBillsTable.id, raBillId));
    res.status(201).json(created);
  } catch (error) {
    console.error("Error creating RA Bill:", error);
    res.status(500).json({ error: "Failed to create RA Bill" });
  }
});

// GET /ra-bills/:id - Get RA Bill details with items, documents, history
router.get("/ra-bills/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const [row] = await db
      .select({
        bill: raBillsTable,
        projectName: projectsTable.name,
        contractTitle: contractsTable.title,
        contractNumber: contractsTable.contractNumber,
        contractTotal: contractsTable.totalAmount,
        vendorName: vendorsTable.name,
        vendorEmail: vendorsTable.email,
        vendorPhone: vendorsTable.phone,
        vendorGst: sql<string | null>`NULL`,
        creatorName: usersTable.name,
      })
      .from(raBillsTable)
      .leftJoin(projectsTable, eq(projectsTable.id, raBillsTable.projectId))
      .leftJoin(contractsTable, eq(contractsTable.id, raBillsTable.contractId))
      .leftJoin(vendorsTable, eq(vendorsTable.id, raBillsTable.vendorId))
      .leftJoin(usersTable, eq(usersTable.id, raBillsTable.createdById))
      .where(eq(raBillsTable.id, id));

    if (!row) {
      res.status(404).json({ error: "RA Bill not found" });
      return;
    }

    // Get submitter & approver names
    let submitterName: string | null = null;
    if (row.bill.submittedById) {
      const [u] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, row.bill.submittedById));
      submitterName = u?.name || null;
    }
    let approverName: string | null = null;
    if (row.bill.approvedById) {
      const [u] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, row.bill.approvedById));
      approverName = u?.name || null;
    }

    // Items
    const items = await db
      .select({
        item: raBillItemsTable,
        itemNumber: contractBoqItemsTable.itemNumber,
      })
      .from(raBillItemsTable)
      .leftJoin(contractBoqItemsTable, eq(contractBoqItemsTable.id, raBillItemsTable.contractBoqItemId))
      .where(eq(raBillItemsTable.raBillId, id))
      .orderBy(asc(raBillItemsTable.sortOrder), asc(raBillItemsTable.id));

    // Documents
    const documents = await db
      .select({
        doc: raBillDocumentsTable,
        uploaderName: usersTable.name,
      })
      .from(raBillDocumentsTable)
      .leftJoin(usersTable, eq(usersTable.id, raBillDocumentsTable.uploadedById))
      .where(eq(raBillDocumentsTable.raBillId, id))
      .orderBy(desc(raBillDocumentsTable.uploadedAt));

    // History
    const history = await db
      .select({
        hist: raBillApprovalHistoryTable,
        userName: usersTable.name,
        userRole: usersTable.activeRole,
      })
      .from(raBillApprovalHistoryTable)
      .leftJoin(usersTable, eq(usersTable.id, raBillApprovalHistoryTable.userId))
      .where(eq(raBillApprovalHistoryTable.raBillId, id))
      .orderBy(desc(raBillApprovalHistoryTable.actionDate));

    // Check if an invoice has already been generated
    const [invoice] = await db
      .select()
      .from(invoicesTable)
      .where(eq(invoicesTable.raBillId, id));

    res.json({
      ...row.bill,
      grossAmount: Number(row.bill.grossAmount || 0),
      amount: Number(row.bill.amount || 0),
      retentionPercent: Number(row.bill.retentionPercent || 5),
      retentionAmount: Number(row.bill.retentionAmount || 0),
      advanceRecovery: Number(row.bill.advanceRecovery || 0),
      tdsPercent: Number(row.bill.tdsPercent || 2),
      tdsAmount: Number(row.bill.tdsAmount || 0),
      gstPercent: Number(row.bill.gstPercent || 18),
      gstAmount: Number(row.bill.gstAmount || 0),
      otherDeductions: Number(row.bill.otherDeductions || 0),
      netPayableAmount: Number(row.bill.netPayableAmount || 0),
      projectName: row.projectName,
      contractTitle: row.contractTitle,
      contractNumber: row.contractNumber,
      contractTotal: Number(row.contractTotal || 0),
      vendorName: row.vendorName,
      vendorEmail: row.vendorEmail,
      vendorPhone: row.vendorPhone,
      vendorGst: row.vendorGst,
      creatorName: row.creatorName,
      submitterName,
      approverName,
      invoice: invoice
        ? {
            ...invoice,
            amount: Number(invoice.amount || 0),
            totalPaidAmount: Number(invoice.totalPaidAmount || 0),
            outstandingAmount: Number(invoice.outstandingAmount || 0),
          }
        : null,
      items: items.map((i) => ({
        ...i.item,
        itemNumber: i.itemNumber,
        rate: Number(i.item.rate || 0),
        contractQuantity: Number(i.item.contractQuantity || 0),
        previousBilledQty: Number(i.item.previousBilledQty || 0),
        currentBilledQty: Number(i.item.currentBilledQty || 0),
        cumulativeBilledQty: Number(i.item.cumulativeBilledQty || 0),
        previousAmount: Number(i.item.previousAmount || 0),
        currentAmount: Number(i.item.currentAmount || 0),
        cumulativeAmount: Number(i.item.cumulativeAmount || 0),
      })),
      documents: documents.map((d) => ({
        ...d.doc,
        uploaderName: d.uploaderName,
      })),
      history: history.map((h) => ({
        ...h.hist,
        userName: h.userName,
        userRole: h.userRole,
      })),
    });
  } catch (error) {
    console.error("Error fetching RA Bill details:", error);
    res.status(500).json({ error: "Failed to fetch RA Bill details" });
  }
});

// POST /ra-bills/:id/submit - Submit RA Bill for PM Approval
router.post("/ra-bills/:id/submit", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const me = await getCurrentUser(req);

    const [bill] = await db.select().from(raBillsTable).where(eq(raBillsTable.id, id));
    if (!bill) {
      res.status(404).json({ error: "RA Bill not found" });
      return;
    }

    if (bill.status !== "draft" && bill.status !== "revision_requested") {
      res.status(400).json({ error: `Cannot submit RA Bill in '${bill.status}' status` });
      return;
    }

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
      action: "submitted",
      userId: me.id,
      previousStatus: bill.status,
      newStatus: "submitted",
      comments: "Submitted for PM Approval",
    });

    await logAudit(me.id, "Submitted RA Bill", "ra_bill", id);
    await notifyManagers(
      "RA Bill Pending Approval",
      `RA Bill ${bill.billNumber} for ₹${Number(bill.netPayableAmount || 0).toLocaleString()} requires your approval.`,
      "ra_bill",
      `/ra-bills/detail/${id}`
    );

    const [updated] = await db.select().from(raBillsTable).where(eq(raBillsTable.id, id));
    res.json(updated);
  } catch (error) {
    console.error("Error submitting RA Bill:", error);
    res.status(500).json({ error: "Failed to submit RA Bill" });
  }
});

// POST /ra-bills/:id/approve - PM Approves RA Bill
router.post("/ra-bills/:id/approve", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const me = await getCurrentUser(req);
    const { comments } = req.body;

    const [bill] = await db.select().from(raBillsTable).where(eq(raBillsTable.id, id));
    if (!bill) {
      res.status(404).json({ error: "RA Bill not found" });
      return;
    }

    if (bill.status !== "submitted") {
      res.status(400).json({ error: `Cannot approve RA Bill in '${bill.status}' status` });
      return;
    }

    // Update bill
    await db
      .update(raBillsTable)
      .set({
        status: "approved",
        approvedById: me.id,
        approvedAt: new Date(),
        approvalComments: comments ? String(comments) : null,
      })
      .where(eq(raBillsTable.id, id));

    // Update cumulative billed quantity on BOQ items
    const items = await db
      .select()
      .from(raBillItemsTable)
      .where(eq(raBillItemsTable.raBillId, id));

    for (const item of items) {
      const curBilled = Number(item.currentBilledQty || 0);
      if (curBilled > 0) {
        await db
          .update(contractBoqItemsTable)
          .set({
            cumulativeBilledQty: sql`${contractBoqItemsTable.cumulativeBilledQty} + ${curBilled}`,
          })
          .where(eq(contractBoqItemsTable.id, item.contractBoqItemId));
      }
    }

    // History
    await db.insert(raBillApprovalHistoryTable).values({
      raBillId: id,
      action: "approved",
      userId: me.id,
      previousStatus: "submitted",
      newStatus: "approved",
      comments: comments ? String(comments) : "Approved by Project Manager",
    });

    await logAudit(me.id, "Approved RA Bill", "ra_bill", id, { comments });

    if (bill.createdById) {
      await createNotification(
        bill.createdById,
        "RA Bill Approved",
        `RA Bill ${bill.billNumber} has been approved by ${me.name}. Ready for invoice generation.`,
        "ra_bill",
        `/ra-bills/detail/${id}`
      );
    }

    const [updated] = await db.select().from(raBillsTable).where(eq(raBillsTable.id, id));
    res.json(updated);
  } catch (error) {
    console.error("Error approving RA Bill:", error);
    res.status(500).json({ error: "Failed to approve RA Bill" });
  }
});

// POST /ra-bills/:id/request-revision - PM Requests Revision
router.post("/ra-bills/:id/request-revision", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const me = await getCurrentUser(req);
    const { reason } = req.body;

    if (!reason) {
      res.status(400).json({ error: "Revision reason is required" });
      return;
    }

    const [bill] = await db.select().from(raBillsTable).where(eq(raBillsTable.id, id));
    if (!bill) {
      res.status(404).json({ error: "RA Bill not found" });
      return;
    }

    if (bill.status !== "submitted") {
      res.status(400).json({ error: `Cannot request revision for RA Bill in '${bill.status}' status` });
      return;
    }

    await db
      .update(raBillsTable)
      .set({
        status: "revision_requested",
        revisionRequestedById: me.id,
        revisionRequestedAt: new Date(),
        revisionReason: String(reason),
      })
      .where(eq(raBillsTable.id, id));

    await db.insert(raBillApprovalHistoryTable).values({
      raBillId: id,
      action: "revision_requested",
      userId: me.id,
      previousStatus: "submitted",
      newStatus: "revision_requested",
      comments: String(reason),
    });

    await logAudit(me.id, "Requested RA Bill Revision", "ra_bill", id, { reason });

    if (bill.createdById) {
      await createNotification(
        bill.createdById,
        "RA Bill Revision Requested",
        `Revision requested for RA Bill ${bill.billNumber}: "${reason}"`,
        "ra_bill",
        `/ra-bills/detail/${id}`
      );
    }

    const [updated] = await db.select().from(raBillsTable).where(eq(raBillsTable.id, id));
    res.json(updated);
  } catch (error) {
    console.error("Error requesting revision:", error);
    res.status(500).json({ error: "Failed to request revision" });
  }
});

// POST /ra-bills/:id/documents - Attach document
router.post("/ra-bills/:id/documents", async (req: Request, res: Response): Promise<void> => {
  try {
    const raBillId = Number(req.params.id);
    const me = await getCurrentUser(req);
    const { documentType, fileName, fileUrl, fileSize } = req.body;

    if (!fileName || !fileUrl) {
      res.status(400).json({ error: "fileName and fileUrl are required" });
      return;
    }

    const [ins] = await db.insert(raBillDocumentsTable).values({
      raBillId,
      documentType: documentType || "other",
      fileName: String(fileName),
      fileUrl: String(fileUrl),
      fileSize: fileSize ? Number(fileSize) : null,
      uploadedById: me.id,
    });

    const [doc] = await db
      .select()
      .from(raBillDocumentsTable)
      .where(eq(raBillDocumentsTable.id, ins.insertId));

    res.status(201).json(doc);
  } catch (error) {
    console.error("Error uploading RA Bill document:", error);
    res.status(500).json({ error: "Failed to upload document" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// INVOICES & PAYMENT WORKFLOW
// ═══════════════════════════════════════════════════════════════════════════

// POST /ra-bills/:id/generate-invoice - Generate invoice from approved RA Bill
router.post("/ra-bills/:id/generate-invoice", async (req: Request, res: Response): Promise<void> => {
  try {
    const raBillId = Number(req.params.id);
    const me = await getCurrentUser(req);
    const { paymentTerms, dueDate } = req.body;

    const [bill] = await db.select().from(raBillsTable).where(eq(raBillsTable.id, raBillId));
    if (!bill) {
      res.status(404).json({ error: "RA Bill not found" });
      return;
    }

    if (bill.status !== "approved") {
      res.status(400).json({ error: "Cannot generate invoice: RA Bill is not in 'approved' status" });
      return;
    }

    // Check if invoice already exists
    const [existing] = await db.select().from(invoicesTable).where(eq(invoicesTable.raBillId, raBillId));
    if (existing) {
      res.status(400).json({ error: "An invoice has already been generated for this RA Bill", invoice: existing });
      return;
    }

    // Fetch vendor and project details
    const [vendor] = await db.select().from(vendorsTable).where(eq(vendorsTable.id, bill.vendorId!));
    const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, bill.projectId));

    const invoiceNumber = await generateNumber("INV", invoicesTable);
    const gross = Number(bill.grossAmount || 0);
    const tax = Number(bill.gstAmount || 0);
    const deductions = Number(bill.retentionAmount || 0) + Number(bill.advanceRecovery || 0) + Number(bill.tdsAmount || 0) + Number(bill.otherDeductions || 0);
    const net = Number(bill.netPayableAmount || 0);

    const invDate = new Date();
    const calculatedDueDate = dueDate ? new Date(dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const [ins] = await db.insert(invoicesTable).values({
      projectId: bill.projectId,
      raBillId,
      vendorId: bill.vendorId,
      contractId: bill.contractId,
      invoiceNumber,
      clientName: vendor?.name || project?.name || "Client",
      amount: String(net),
      grossAmount: String(gross),
      deductions: String(deductions),
      taxAmount: String(tax),
      netAmount: String(net),
      invoiceDate: invDate,
      dueDate: calculatedDueDate,
      paymentTerms: paymentTerms || "Net 30 Days",
      totalPaidAmount: "0",
      outstandingAmount: String(net),
      reconciliationStatus: "pending",
      reconciled: false,
      status: "draft",
    });

    const invoiceId = ins.insertId;

    // Update RA Bill status
    await db
      .update(raBillsTable)
      .set({ status: "invoice_generated" })
      .where(eq(raBillsTable.id, raBillId));

    await db.insert(raBillApprovalHistoryTable).values({
      raBillId,
      action: "invoice_generated",
      userId: me.id,
      previousStatus: "approved",
      newStatus: "invoice_generated",
      comments: `Invoice ${invoiceNumber} generated`,
    });

    await logAudit(me.id, "Generated Invoice from RA Bill", "invoice", invoiceId, {
      invoiceNumber,
      raBillId,
      netAmount: net,
    });

    const [created] = await db.select().from(invoicesTable).where(eq(invoicesTable.id, invoiceId));
    res.status(201).json(created);
  } catch (error) {
    console.error("Error generating invoice:", error);
    res.status(500).json({ error: "Failed to generate invoice" });
  }
});

// GET /invoices - List workflow invoices
router.get("/invoices", async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId, vendorId, status } = req.query;

    let query = db
      .select({
        inv: invoicesTable,
        projectName: projectsTable.name,
        vendorName: vendorsTable.name,
        billNumber: raBillsTable.billNumber,
      })
      .from(invoicesTable)
      .leftJoin(projectsTable, eq(projectsTable.id, invoicesTable.projectId))
      .leftJoin(vendorsTable, eq(vendorsTable.id, invoicesTable.vendorId))
      .leftJoin(raBillsTable, eq(raBillsTable.id, invoicesTable.raBillId))
      .$dynamic();

    const conditions = [];
    if (projectId) conditions.push(eq(invoicesTable.projectId, Number(projectId)));
    if (vendorId) conditions.push(eq(invoicesTable.vendorId, Number(vendorId)));
    if (status) conditions.push(eq(invoicesTable.status, String(status)));

    if (conditions.length > 0) query = query.where(and(...conditions));
    const rows = await query.orderBy(desc(invoicesTable.invoiceDate));

    res.json(
      rows.map((r) => ({
        ...r.inv,
        amount: Number(r.inv.amount || 0),
        grossAmount: Number(r.inv.grossAmount || 0),
        deductions: Number(r.inv.deductions || 0),
        taxAmount: Number(r.inv.taxAmount || 0),
        netAmount: Number(r.inv.netAmount || 0),
        totalPaidAmount: Number(r.inv.totalPaidAmount || 0),
        outstandingAmount: Number(r.inv.outstandingAmount || 0),
        projectName: r.projectName,
        vendorName: r.vendorName,
        billNumber: r.billNumber,
      }))
    );
  } catch (error) {
    console.error("Error fetching invoices:", error);
    res.status(500).json({ error: "Failed to fetch invoices" });
  }
});

// GET /invoices/:id - Get invoice detail with payments & reminders
router.get("/invoices/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const [row] = await db
      .select({
        inv: invoicesTable,
        projectName: projectsTable.name,
        vendorName: vendorsTable.name,
        vendorEmail: vendorsTable.email,
        vendorPhone: vendorsTable.phone,
        vendorGst: sql<string | null>`NULL`,
        billNumber: raBillsTable.billNumber,
        contractTitle: contractsTable.title,
      })
      .from(invoicesTable)
      .leftJoin(projectsTable, eq(projectsTable.id, invoicesTable.projectId))
      .leftJoin(vendorsTable, eq(vendorsTable.id, invoicesTable.vendorId))
      .leftJoin(raBillsTable, eq(raBillsTable.id, invoicesTable.raBillId))
      .leftJoin(contractsTable, eq(contractsTable.id, invoicesTable.contractId))
      .where(eq(invoicesTable.id, id));

    if (!row) {
      res.status(404).json({ error: "Invoice not found" });
      return;
    }

    const payments = await db
      .select({
        payment: invoicePaymentsTable,
        recorderName: usersTable.name,
      })
      .from(invoicePaymentsTable)
      .leftJoin(usersTable, eq(usersTable.id, invoicePaymentsTable.recordedById))
      .where(eq(invoicePaymentsTable.invoiceId, id))
      .orderBy(desc(invoicePaymentsTable.paymentDate));

    const reminders = await db
      .select({
        rem: paymentRemindersTable,
        senderName: usersTable.name,
      })
      .from(paymentRemindersTable)
      .leftJoin(usersTable, eq(usersTable.id, paymentRemindersTable.sentById))
      .where(eq(paymentRemindersTable.invoiceId, id))
      .orderBy(desc(paymentRemindersTable.reminderDate));

    res.json({
      ...row.inv,
      amount: Number(row.inv.amount || 0),
      grossAmount: Number(row.inv.grossAmount || 0),
      deductions: Number(row.inv.deductions || 0),
      taxAmount: Number(row.inv.taxAmount || 0),
      netAmount: Number(row.inv.netAmount || 0),
      totalPaidAmount: Number(row.inv.totalPaidAmount || 0),
      outstandingAmount: Number(row.inv.outstandingAmount || 0),
      projectName: row.projectName,
      vendorName: row.vendorName,
      vendorEmail: row.vendorEmail,
      vendorPhone: row.vendorPhone,
      vendorGst: row.vendorGst,
      billNumber: row.billNumber,
      contractTitle: row.contractTitle,
      payments: payments.map((p) => ({
        ...p.payment,
        paymentAmount: Number(p.payment.paymentAmount || 0),
        recorderName: p.recorderName,
      })),
      reminders: reminders.map((r) => ({
        ...r.rem,
        senderName: r.senderName,
      })),
    });
  } catch (error) {
    console.error("Error fetching invoice details:", error);
    res.status(500).json({ error: "Failed to fetch invoice details" });
  }
});

// POST /invoices/:id/send - "Send to Client / Vendor"
router.post("/invoices/:id/send", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const me = await getCurrentUser(req);
    const { recipientEmail, recipientNotes, paymentTerms } = req.body;

    const [inv] = await db.select().from(invoicesTable).where(eq(invoicesTable.id, id));
    if (!inv) {
      res.status(404).json({ error: "Invoice not found" });
      return;
    }

    await db
      .update(invoicesTable)
      .set({
        status: inv.status === "draft" ? "sent" : inv.status,
        sentAt: new Date(),
        sentById: me.id,
        recipientEmail: recipientEmail ? String(recipientEmail) : inv.recipientEmail,
        recipientNotes: recipientNotes ? String(recipientNotes) : inv.recipientNotes,
        paymentTerms: paymentTerms ? String(paymentTerms) : inv.paymentTerms,
      })
      .where(eq(invoicesTable.id, id));

    await logAudit(me.id, "Sent Invoice to Client/Vendor", "invoice", id, {
      recipientEmail,
      invoiceNumber: inv.invoiceNumber,
    });

    const [updated] = await db.select().from(invoicesTable).where(eq(invoicesTable.id, id));
    res.json(updated);
  } catch (error) {
    console.error("Error sending invoice:", error);
    res.status(500).json({ error: "Failed to send invoice" });
  }
});

// POST /invoices/:id/record-payment - "Record Payment"
router.post("/invoices/:id/record-payment", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const me = await getCurrentUser(req);
    const {
      paymentAmount,
      paymentDate,
      paymentMode,
      bankReference,
      transactionId,
      remarks,
      documentUrl,
    } = req.body;

    if (!paymentAmount || Number(paymentAmount) <= 0 || !paymentDate || !paymentMode) {
      res.status(400).json({ error: "paymentAmount (> 0), paymentDate, and paymentMode are required" });
      return;
    }

    const [inv] = await db.select().from(invoicesTable).where(eq(invoicesTable.id, id));
    if (!inv) {
      res.status(404).json({ error: "Invoice not found" });
      return;
    }

    const payAmt = Number(paymentAmount);
    const currentPaid = Number(inv.totalPaidAmount || 0);
    const totalAmount = Number(inv.netAmount || inv.amount || 0);
    const newPaid = currentPaid + payAmt;
    const newOutstanding = Math.max(0, totalAmount - newPaid);
    const newStatus = newOutstanding <= 0 ? "paid" : "partially_paid";

    const paymentNumber = await generateNumber("PAY", invoicePaymentsTable);

    const [ins] = await db.insert(invoicePaymentsTable).values({
      invoiceId: id,
      raBillId: inv.raBillId,
      paymentNumber,
      paymentDate: new Date(paymentDate),
      paymentAmount: String(payAmt),
      paymentMode: String(paymentMode),
      bankReference: bankReference ? String(bankReference) : null,
      transactionId: transactionId ? String(transactionId) : null,
      remarks: remarks ? String(remarks) : null,
      documentUrl: documentUrl ? String(documentUrl) : null,
      recordedById: me.id,
    });

    // Update invoice
    await db
      .update(invoicesTable)
      .set({
        totalPaidAmount: String(newPaid),
        outstandingAmount: String(newOutstanding),
        status: newStatus,
        paymentDate: new Date(paymentDate),
      })
      .where(eq(invoicesTable.id, id));

    await logAudit(me.id, "Recorded Payment against Invoice", "invoice_payment", ins.insertId, {
      invoiceId: id,
      paymentNumber,
      amount: payAmt,
      newOutstanding,
    });

    const [updatedInv] = await db.select().from(invoicesTable).where(eq(invoicesTable.id, id));
    res.status(201).json({
      invoice: updatedInv,
      paymentId: ins.insertId,
      paymentNumber,
    });
  } catch (error) {
    console.error("Error recording payment:", error);
    res.status(500).json({ error: "Failed to record payment" });
  }
});

// POST /invoices/:id/send-reminder - "Payment Reminder"
router.post("/invoices/:id/send-reminder", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const me = await getCurrentUser(req);
    const { reminderType, subject, message, recipient, followUpRemarks } = req.body;

    if (!message) {
      res.status(400).json({ error: "Message is required" });
      return;
    }

    const [inv] = await db.select().from(invoicesTable).where(eq(invoicesTable.id, id));
    if (!inv) {
      res.status(404).json({ error: "Invoice not found" });
      return;
    }

    const [ins] = await db.insert(paymentRemindersTable).values({
      invoiceId: id,
      reminderType: reminderType || "email",
      subject: subject ? String(subject) : `Payment Reminder: Invoice ${inv.invoiceNumber}`,
      message: String(message),
      recipient: recipient ? String(recipient) : inv.recipientEmail,
      followUpRemarks: followUpRemarks ? String(followUpRemarks) : null,
      sentById: me.id,
    });

    await logAudit(me.id, "Sent Payment Reminder", "payment_reminder", ins.insertId, {
      invoiceId: id,
      invoiceNumber: inv.invoiceNumber,
      reminderType,
    });

    const [reminder] = await db.select().from(paymentRemindersTable).where(eq(paymentRemindersTable.id, ins.insertId));
    res.status(201).json(reminder);
  } catch (error) {
    console.error("Error sending payment reminder:", error);
    res.status(500).json({ error: "Failed to send payment reminder" });
  }
});

// POST /invoices/:id/reconcile - "Reconcile with Accounting"
router.post("/invoices/:id/reconcile", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const me = await getCurrentUser(req);
    const { reconciliationRemarks } = req.body;

    const [inv] = await db.select().from(invoicesTable).where(eq(invoicesTable.id, id));
    if (!inv) {
      res.status(404).json({ error: "Invoice not found" });
      return;
    }

    await db
      .update(invoicesTable)
      .set({
        reconciliationStatus: "reconciled",
        reconciled: true,
        reconciledById: me.id,
        reconciledAt: new Date(),
        reconciliationRemarks: reconciliationRemarks ? String(reconciliationRemarks) : null,
      })
      .where(eq(invoicesTable.id, id));

    await logAudit(me.id, "Reconciled Invoice with Accounting", "invoice", id, {
      reconciliationRemarks,
    });

    const [updated] = await db.select().from(invoicesTable).where(eq(invoicesTable.id, id));
    res.json(updated);
  } catch (error) {
    console.error("Error reconciling invoice:", error);
    res.status(500).json({ error: "Failed to reconcile invoice" });
  }
});

// POST /invoices/:id/close - "Close Invoice"
router.post("/invoices/:id/close", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const me = await getCurrentUser(req);

    const [inv] = await db.select().from(invoicesTable).where(eq(invoicesTable.id, id));
    if (!inv) {
      res.status(404).json({ error: "Invoice not found" });
      return;
    }

    await db
      .update(invoicesTable)
      .set({
        status: "closed",
      })
      .where(eq(invoicesTable.id, id));

    await logAudit(me.id, "Closed Invoice", "invoice", id);

    const [updated] = await db.select().from(invoicesTable).where(eq(invoicesTable.id, id));
    res.json(updated);
  } catch (error) {
    console.error("Error closing invoice:", error);
    res.status(500).json({ error: "Failed to close invoice" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// END-TO-END PROJECT JOURNEY WORKFLOW
// ═══════════════════════════════════════════════════════════════════════════

// GET /api/ra-bill-workflow/journey/:projectId - Get complete end-to-end lifecycle data
router.get("/journey/:projectId", async (req: Request, res: Response): Promise<void> => {
  try {
    const projectId = Number(req.params.projectId);
    if (!projectId || isNaN(projectId)) {
      res.status(400).json({ error: "Invalid project ID" });
      return;
    }

    const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, projectId));
    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    // 1. Tasks & Budget
    const tasks = await db.select().from(tasksTable).where(eq(tasksTable.projectId, projectId)).orderBy(asc(tasksTable.id));
    const budgetItems = await db.select().from(budgetItemsTable).where(eq(budgetItemsTable.projectId, projectId));

    // 2. Procurement Chain
    const mrs = await db.select().from(procurementMaterialRequestsTable).where(eq(procurementMaterialRequestsTable.projectId, projectId)).orderBy(desc(procurementMaterialRequestsTable.id));
    const mr = mrs[0] || null;
    let mrItems: any[] = [];
    if (mr) {
      mrItems = await db.select().from(procurementMaterialRequestItemsTable).where(eq(procurementMaterialRequestItemsTable.materialRequestId, mr.id));
    }

    const rfqs = await db.select().from(procurementRfqsTable).where(eq(procurementRfqsTable.projectId, projectId)).orderBy(desc(procurementRfqsTable.id));
    const rfq = rfqs[0] || null;
    let rfqItems: any[] = [];
    let rfqVendors: any[] = [];
    let quotes: any[] = [];
    if (rfq) {
      rfqItems = await db.select().from(procurementRfqItemsTable).where(eq(procurementRfqItemsTable.rfqId, rfq.id));
      rfqVendors = await db
        .select({ rv: procurementRfqVendorsTable, vName: vendorsTable.name })
        .from(procurementRfqVendorsTable)
        .leftJoin(vendorsTable, eq(vendorsTable.id, procurementRfqVendorsTable.vendorId))
        .where(eq(procurementRfqVendorsTable.rfqId, rfq.id));
      quotes = await db
        .select({ q: procurementVendorQuotesTable, vName: vendorsTable.name })
        .from(procurementVendorQuotesTable)
        .leftJoin(vendorsTable, eq(vendorsTable.id, procurementVendorQuotesTable.vendorId))
        .where(eq(procurementVendorQuotesTable.rfqId, rfq.id));
    }

    const pos = await db.select().from(procurementPurchaseOrdersTable).where(eq(procurementPurchaseOrdersTable.projectId, projectId)).orderBy(desc(procurementPurchaseOrdersTable.id));
    const po = pos[0] || null;
    let poItems: any[] = [];
    let receipt: any = null;
    let receiptItems: any[] = [];
    let inspection: any = null;
    let inspectionItems: any[] = [];

    if (po) {
      poItems = await db.select().from(procurementPurchaseOrderItemsTable).where(eq(procurementPurchaseOrderItemsTable.poId, po.id));
    }
    const receipts = await db.select().from(procurementMaterialReceiptsTable).where(eq(procurementMaterialReceiptsTable.projectId, projectId)).orderBy(desc(procurementMaterialReceiptsTable.id));
    receipt = receipts[0] || null;
    if (receipt) {
      receiptItems = await db.select().from(procurementMaterialReceiptItemsTable).where(eq(procurementMaterialReceiptItemsTable.receiptId, receipt.id));
    }
    const inspections = await db.select().from(procurementQualityInspectionsTable).where(eq(procurementQualityInspectionsTable.projectId, projectId)).orderBy(desc(procurementQualityInspectionsTable.id));
    inspection = inspections[0] || null;
    if (inspection) {
      inspectionItems = await db.select().from(procurementQualityInspectionItemsTable).where(eq(procurementQualityInspectionItemsTable.inspectionId, inspection.id));
    }

    const inventory = await db.select().from(procurementInventoryItemsTable).where(eq(procurementInventoryItemsTable.projectId, projectId));

    // 3. Contracts & Subcontract BOQ
    const contracts = await db
      .select({ c: contractsTable, vName: vendorsTable.name })
      .from(contractsTable)
      .leftJoin(vendorsTable, eq(vendorsTable.id, contractsTable.vendorId))
      .where(eq(contractsTable.projectId, projectId))
      .orderBy(desc(contractsTable.id));
    const contract = contracts[0]?.c || null;
    const vendorName = contracts[0]?.vName || "BuildPro Infrastructure Ltd.";
    let contractBoqItems: any[] = [];
    if (contract) {
      contractBoqItems = await db.select().from(contractBoqItemsTable).where(eq(contractBoqItemsTable.contractId, contract.id));
    }

    // 4. Work Completions & Measurements (JMR)
    const workCompletions = await db.select().from(workCompletionsTable).where(eq(workCompletionsTable.projectId, projectId)).orderBy(desc(workCompletionsTable.id));
    const wc = workCompletions[0] || null;
    let wcItems: any[] = [];
    let wcDocuments: any[] = [];
    if (wc) {
      wcItems = await db.select().from(workCompletionItemsTable).where(eq(workCompletionItemsTable.workCompletionId, wc.id));
      wcDocuments = await db.select().from(workCompletionDocumentsTable).where(eq(workCompletionDocumentsTable.workCompletionId, wc.id));
    }

    // 5. RA Bills & Abstract Deductions
    const raBills = await db.select().from(raBillsTable).where(eq(raBillsTable.projectId, projectId)).orderBy(desc(raBillsTable.id));
    const raBill = raBills[0] || null;
    let raBillItems: any[] = [];
    let raBillDocuments: any[] = [];
    let raBillHistory: any[] = [];
    if (raBill) {
      raBillItems = await db.select().from(raBillItemsTable).where(eq(raBillItemsTable.raBillId, raBill.id));
      raBillDocuments = await db.select().from(raBillDocumentsTable).where(eq(raBillDocumentsTable.raBillId, raBill.id));
      raBillHistory = await db
        .select({ h: raBillApprovalHistoryTable, uName: usersTable.name })
        .from(raBillApprovalHistoryTable)
        .leftJoin(usersTable, eq(usersTable.id, raBillApprovalHistoryTable.userId))
        .where(eq(raBillApprovalHistoryTable.raBillId, raBill.id))
        .orderBy(asc(raBillApprovalHistoryTable.actionDate));
    }

    // 6. Invoices, Payments & Reconciliation
    const invoices = await db.select().from(invoicesTable).where(eq(invoicesTable.projectId, projectId)).orderBy(desc(invoicesTable.id));
    const invoice = invoices[0] || null;
    let payments: any[] = [];
    let reminders: any[] = [];
    if (invoice) {
      payments = await db.select().from(invoicePaymentsTable).where(eq(invoicePaymentsTable.invoiceId, invoice.id));
      reminders = await db.select().from(paymentRemindersTable).where(eq(paymentRemindersTable.invoiceId, invoice.id));
    }

    // 7. Vendor AP (Vendor Invoices, 3-Way Match & Payments)
    const vendorInvoices = await db.select().from(vendorInvoicesTable).where(eq(vendorInvoicesTable.projectId, projectId)).orderBy(desc(vendorInvoicesTable.id));
    const vendorInvoice = vendorInvoices[0] || null;
    const vendorPayments = await db.select().from(vendorPaymentsTable).where(eq(vendorPaymentsTable.projectId, projectId)).orderBy(desc(vendorPaymentsTable.id));
    const vendorPayment = vendorPayments[0] || null;

    // 8. Site Direct Expenses
    const projectExpenses = await db.select().from(expensesTable).where(eq(expensesTable.projectId, projectId)).orderBy(desc(expensesTable.expenseDate));

    // 9. Snagging & Handover
    const snagItems = await db.select().from(punchListItemsTable).where(eq(punchListItemsTable.projectId, projectId)).orderBy(desc(punchListItemsTable.id));

    res.json({
      project: {
        ...project,
        budget: Number(project.budget) || 0,
      },
      tasks,
      budgetItems: budgetItems.map(b => ({
        ...b,
        budgeted: Number(b.budgeted) || 0,
        actual: Number(b.actual) || 0,
        committed: Number(b.committed) || 0,
      })),
      procurement: {
        materialRequest: mr ? { ...mr, items: mrItems } : null,
        rfq: rfq ? { ...rfq, items: rfqItems, vendors: rfqVendors.map(v => ({ ...v.rv, vendorName: v.vName })) } : null,
        quotes: quotes.map(q => ({ ...q.q, vendorName: q.vName, totalAmount: Number(q.q.totalAmount) || 0 })),
        purchaseOrder: po ? { ...po, totalAmount: Number(po.totalAmount) || 0, items: poItems } : null,
        receipt: receipt ? { ...receipt, items: receiptItems } : null,
        inspection: inspection ? { ...inspection, items: inspectionItems } : null,
        inventory: inventory.map(i => ({
          ...i,
          currentStock: Number(i.availableQuantity ?? i.totalQuantity ?? 0),
          unitPrice: Number(i.lastPurchasePrice ?? i.averageCost ?? 0),
        })),
      },
      contract: contract ? {
        ...contract,
        vendorName,
        totalAmount: Number(contract.totalAmount) || 0,
        retentionPercent: Number(contract.retentionPercent) || 5,
        advancePercent: Number(contract.advancePercent) || 0,
        tdsPercent: Number(contract.tdsPercent) || 2,
        gstPercent: Number(contract.gstPercent) || 18,
        boqItems: contractBoqItems.map(b => ({
          ...b,
          quantity: Number(b.quantity) || 0,
          rate: Number(b.rate) || 0,
          totalAmount: Number(b.totalAmount) || 0,
          previousQuantity: Number(b.previousQuantity) || 0,
          currentQuantity: Number(b.currentQuantity) || 0,
          cumulativeQuantity: Number(b.cumulativeQuantity) || 0,
        })),
      } : null,
      workCompletion: wc ? {
        ...wc,
        items: wcItems.map(i => ({
          ...i,
          completedQuantity: Number(i.completedQuantity) || 0,
          rate: Number(i.rate) || 0,
          totalAmount: Number(i.totalAmount) || 0,
        })),
        documents: wcDocuments,
      } : null,
      raBill: raBill ? {
        ...raBill,
        amount: Number(raBill.amount) || 0,
        grossAmount: Number(raBill.grossAmount) || 0,
        retentionAmount: Number(raBill.retentionAmount) || 0,
        retentionPercent: Number(raBill.retentionPercent) || 5,
        advanceRecovery: Number(raBill.advanceRecovery) || 0,
        tdsAmount: Number(raBill.tdsAmount) || 0,
        tdsPercent: Number(raBill.tdsPercent) || 2,
        gstAmount: Number(raBill.gstAmount) || 0,
        gstPercent: Number(raBill.gstPercent) || 18,
        otherDeductions: Number(raBill.otherDeductions) || 0,
        netPayableAmount: Number(raBill.netPayableAmount) || 0,
        items: raBillItems.map(i => ({
          ...i,
          totalBoqQuantity: Number(i.totalBoqQuantity) || 0,
          previousQuantity: Number(i.previousQuantity) || 0,
          currentQuantity: Number(i.currentQuantity) || 0,
          cumulativeQuantity: Number(i.cumulativeQuantity) || 0,
          rate: Number(i.rate) || 0,
          amount: Number(i.amount) || 0,
        })),
        documents: raBillDocuments,
        approvalHistory: raBillHistory.map(h => ({ ...h.h, actionByName: h.uName })),
      } : null,
      invoice: invoice ? {
        ...invoice,
        amount: Number(invoice.amount) || 0,
        grossAmount: Number(invoice.grossAmount) || 0,
        deductions: Number(invoice.deductions) || 0,
        taxAmount: Number(invoice.taxAmount) || 0,
        netAmount: Number(invoice.netAmount) || 0,
        totalPaidAmount: Number(invoice.totalPaidAmount) || 0,
        outstandingAmount: Number(invoice.outstandingAmount) || 0,
        payments: payments.map(p => ({ ...p, amount: Number(p.amount) || 0 })),
        reminders,
      } : null,
      vendorAP: vendorInvoice ? {
        invoice: {
          ...vendorInvoice,
          amount: Number(vendorInvoice.amount) || 0,
          grossAmount: Number(vendorInvoice.grossAmount) || 0,
          netPayableAmount: Number(vendorInvoice.netPayableAmount) || 0,
          totalPaidAmount: Number(vendorInvoice.totalPaidAmount) || 0,
          outstandingAmount: Number(vendorInvoice.outstandingAmount) || 0,
        },
        payment: vendorPayment ? {
          ...vendorPayment,
          amount: Number(vendorPayment.paymentAmount || 0),
          referenceNumber: vendorPayment.transactionId || vendorPayment.bankReference || "",
        } : null,
        matching: {
          poMatched: Boolean(vendorInvoice.poMatched),
          measurementMatched: Boolean(vendorInvoice.measurementMatched),
          quantityRateValidated: Boolean(vendorInvoice.quantityRateValidated),
          status: vendorInvoice.status,
        },
      } : null,
      expenses: projectExpenses.map(e => ({
        ...e,
        amount: Number(e.amount) || 0,
      })),
      handover: {
        snagItems: snagItems.map(s => ({ ...s })),
        vccNumber: `VCC-20260924-${String(projectId).padStart(4, "0")}`,
        vccDate: "2026-09-24",
        dlpPeriodMonths: 12,
        dlpExpiryDate: "2027-09-24",
        retentionHeld: Number(raBill?.retentionAmount || 54500),
        retentionReleaseStage1: Math.round(Number(raBill?.retentionAmount || 54500) * 0.5),
        retentionReleaseStage2: Math.round(Number(raBill?.retentionAmount || 54500) * 0.5),
        status: "provisional_handover",
      },
    });
  } catch (error) {
    console.error("Error fetching project journey:", error);
    res.status(500).json({ error: "Failed to fetch project journey data" });
  }
});

// POST /api/ra-bill-workflow/journey/:projectId/seed - Seed / Ensure complete end-to-end scenario
router.post("/journey/:projectId/seed", async (req: Request, res: Response): Promise<void> => {
  try {
    const projectId = Number(req.params.projectId);
    if (!projectId || isNaN(projectId)) {
      res.status(400).json({ error: "Invalid project ID" });
      return;
    }

    const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, projectId));
    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    const me = await getCurrentUser(req);
    const userId = me.id || 17;
    const padPrj = String(projectId).padStart(4, "0");

    // 1. Ensure Project metadata (budget, status, progress) while preserving existing name/client if present
    await db.update(projectsTable).set({
      clientName: project.clientName || "BlueWave Hospitality Pvt. Ltd",
      type: project.type || "Hospitality & Commercial Turnkey",
      location: project.location || "Plot 42, Aerocity Boulevard, Mumbai",
      budget: project.budget && Number(project.budget) > 0 ? project.budget : "85000000",
      status: project.status === "planning" ? "execution" : (project.status || "execution"),
      progress: project.progress && project.progress > 0 ? project.progress : 35,
      description: project.description || "Turnkey Commercial Project with integrated procurement, execution, quality certification, and RA billing workflows.",
      startDate: project.startDate || "2026-09-01",
      endDate: project.endDate || "2027-08-31",
    }).where(eq(projectsTable.id, projectId));

    // 2. Project Tasks
    const existingTasks = await db.select().from(tasksTable).where(eq(tasksTable.projectId, projectId));
    if (existingTasks.length === 0) {
      await db.insert(tasksTable).values([
        {
          projectId,
          title: "Phase 1: Substructure Excavation & PCC Bedding",
          description: "Mass excavation and 100mm PCC plain cement concrete pour for raft foundation.",
          priority: "high",
          status: "completed",
          progress: 100,
          startDate: "2026-09-01",
          endDate: "2026-09-12",
          createdById: userId,
        },
        {
          projectId,
          title: "Phase 1: Footing Rebar Fabrication & Raft Casting",
          description: "TMT Fe500 reinforcement placement and M25 ready-mix concrete pouring for footings.",
          priority: "high",
          status: "completed",
          progress: 100,
          startDate: "2026-09-13",
          endDate: "2026-09-22",
          createdById: userId,
        },
        {
          projectId,
          title: "Phase 2: Plinth Beam & Solid Block Masonry",
          description: "Plinth beam casting, damp-proof course, and 200mm solid block masonry walls.",
          priority: "medium",
          status: "in_progress",
          progress: 35,
          startDate: "2026-09-23",
          endDate: "2026-10-15",
          createdById: userId,
        },
        {
          projectId,
          title: "Phase 3: Superstructure RCC Columns & Slab",
          description: "First floor shuttering, reinforcement tying, and electrical conduit laying.",
          priority: "medium",
          status: "todo",
          progress: 0,
          startDate: "2026-10-16",
          endDate: "2026-11-30",
          createdById: userId,
        },
      ]);
    }

    // 3. Budget Items
    const budgetList = [
      { costCode: "CIVIL-002", description: "Substructure & RCC Civil Works", budgeted: "35000000", committed: "4009320", actual: "1209900" },
      { costCode: "ELEC-01", description: "Electrical HT/LT Substation & Cabling", budgeted: "15000000", committed: "0", actual: "0" },
      { costCode: "MAT-01", description: "Flooring, Italian Marble & Wall Cladding", budgeted: "12000000", committed: "0", actual: "0" },
      { costCode: "HVAC-01", description: "Central VRV/HVAC Air Conditioning Plant", budgeted: "13000000", committed: "0", actual: "0" },
      { costCode: "PLUMB-01", description: "Plumbing, Firefighting & Water Treatment", budgeted: "10000000", committed: "0", actual: "0" },
    ];
    for (const b of budgetList) {
      const [existing] = await db.select().from(budgetItemsTable).where(and(eq(budgetItemsTable.projectId, projectId), eq(budgetItemsTable.costCode, b.costCode)));
      if (existing) {
        await db.update(budgetItemsTable).set(b).where(eq(budgetItemsTable.id, existing.id));
      } else {
        await db.insert(budgetItemsTable).values({ projectId, ...b });
      }
    }

    // Resolve vendors
    const vendors = await db.select().from(vendorsTable).limit(2);
    const primaryVendorId = vendors[0]?.id || 1;
    const secondaryVendorId = vendors[1]?.id || vendors[0]?.id || 1;

    // 4. Material Request
    let [mr] = await db.select().from(procurementMaterialRequestsTable).where(eq(procurementMaterialRequestsTable.projectId, projectId)).limit(1);
    if (!mr) {
      let mrNumber = `MR-20260923-${padPrj}`;
      const [dup] = await db.select().from(procurementMaterialRequestsTable).where(eq(procurementMaterialRequestsTable.requestNumber, mrNumber)).limit(1);
      if (dup) mrNumber = `MR-20260923-${padPrj}-${Math.floor(1000 + Math.random() * 9000)}`;

      await db.insert(procurementMaterialRequestsTable).values({
        requestNumber: mrNumber,
        projectId,
        title: "Structural Grade Cement (OPC 53) & TMT Steel Fe500",
        description: "Immediate procurement for Foundation & Footings Phase 1 concrete casting.",
        category: "civil",
        priority: "high",
        requiredDate: "2026-09-25",
        status: "approved",
        requestedById: userId,
        approvedById: userId,
        approvalDate: new Date(),
        approvalComments: "Approved for footing concrete casting schedule.",
        estimatedCost: "984000",
      });
      [mr] = await db.select().from(procurementMaterialRequestsTable).where(eq(procurementMaterialRequestsTable.projectId, projectId)).limit(1);
    } else {
      await db.update(procurementMaterialRequestsTable).set({
        status: "approved",
        title: "Structural Grade Cement (OPC 53) & TMT Steel Fe500",
      }).where(eq(procurementMaterialRequestsTable.id, mr.id));
    }

    // MR items
    await db.delete(procurementMaterialRequestItemsTable).where(eq(procurementMaterialRequestItemsTable.materialRequestId, mr.id));
    await db.insert(procurementMaterialRequestItemsTable).values([
      {
        materialRequestId: mr.id,
        itemName: "OPC 53 Grade Ultratech Cement",
        description: "50kg HDPE bags, fresh batch compliant with IS 12269",
        specification: "IS 12269 certified, 28-day strength >= 53 MPa",
        quantity: "400",
        unit: "bags",
        estimatedUnitPrice: "420",
        estimatedTotal: "168000",
        sortOrder: 0,
      },
      {
        materialRequestId: mr.id,
        itemName: "TMT Fe500D Reinforcement Steel 16mm",
        description: "High yield strength corrosion resistant thermo-mechanically treated rebar",
        specification: "IS 1786 certified, Fe500D ductile grade",
        quantity: "12",
        unit: "MT",
        estimatedUnitPrice: "68000",
        estimatedTotal: "816000",
        sortOrder: 1,
      }
    ]);

    // 5. RFQ & Vendors
    let [rfq] = await db.select().from(procurementRfqsTable).where(eq(procurementRfqsTable.projectId, projectId)).limit(1);
    if (!rfq) {
      let rfqNumber = `RFQ-20260923-${padPrj}`;
      const [dup] = await db.select().from(procurementRfqsTable).where(eq(procurementRfqsTable.rfqNumber, rfqNumber)).limit(1);
      if (dup) rfqNumber = `RFQ-20260923-${padPrj}-${Math.floor(1000 + Math.random() * 9000)}`;

      await db.insert(procurementRfqsTable).values({
        rfqNumber,
        materialRequestId: mr.id,
        projectId,
        title: "RFQ - Structural Concrete & Rebar Package",
        description: "Competitive tender for cement & rebar foundation supply.",
        status: "evaluated",
        dueDate: "2026-09-24",
        createdById: userId,
        sentToVendorCount: 2,
        quotesReceivedCount: 2,
      });
      [rfq] = await db.select().from(procurementRfqsTable).where(eq(procurementRfqsTable.projectId, projectId)).limit(1);
    } else {
      await db.update(procurementRfqsTable).set({
        materialRequestId: mr.id,
        status: "evaluated",
        title: "RFQ - Structural Concrete & Rebar Package",
      }).where(eq(procurementRfqsTable.id, rfq.id));
    }

    await db.delete(procurementRfqItemsTable).where(eq(procurementRfqItemsTable.rfqId, rfq.id));
    await db.insert(procurementRfqItemsTable).values([
      { rfqId: rfq.id, itemName: "OPC 53 Grade Ultratech Cement", quantity: "400", unit: "bags", sortOrder: 0 },
      { rfqId: rfq.id, itemName: "TMT Fe500D Reinforcement Steel 16mm", quantity: "12", unit: "MT", sortOrder: 1 }
    ]);

    await db.delete(procurementRfqVendorsTable).where(eq(procurementRfqVendorsTable.rfqId, rfq.id));
    await db.insert(procurementRfqVendorsTable).values([
      { rfqId: rfq.id, vendorId: primaryVendorId, status: "responded", sentDate: new Date(), respondedDate: new Date() },
      { rfqId: rfq.id, vendorId: secondaryVendorId, status: "responded", sentDate: new Date(), respondedDate: new Date() }
    ]);

    // 6. Vendor Quote (Winner)
    let [q1] = await db.select().from(procurementVendorQuotesTable).where(eq(procurementVendorQuotesTable.rfqId, rfq.id)).limit(1);
    if (!q1) {
      let quoteNumber = `QTE-20260923-${padPrj}`;
      const [dup] = await db.select().from(procurementVendorQuotesTable).where(eq(procurementVendorQuotesTable.quoteNumber, quoteNumber)).limit(1);
      if (dup) quoteNumber = `QTE-20260923-${padPrj}-${Math.floor(1000 + Math.random() * 9000)}`;

      await db.insert(procurementVendorQuotesTable).values({
        quoteNumber,
        rfqId: rfq.id,
        vendorId: primaryVendorId,
        quotedDate: "2026-09-21",
        deliveryDays: 3,
        deliveryTerms: "FOR Site Delivery (Freight Paid)",
        paymentTerms: "Net 30 Days after certified delivery",
        subtotal: "974000",
        taxPercent: "18",
        taxAmount: "175320",
        totalAmount: "1149320",
        isSelected: true,
        selectionReason: "L1 lowest qualified commercial bidder with fastest 3-day lead time.",
        selectedById: userId,
        selectedDate: new Date(),
        status: "selected",
      });
      [q1] = await db.select().from(procurementVendorQuotesTable).where(eq(procurementVendorQuotesTable.rfqId, rfq.id)).limit(1);
    } else {
      await db.update(procurementVendorQuotesTable).set({
        isSelected: true,
        status: "selected",
        subtotal: "974000",
        taxAmount: "175320",
        totalAmount: "1149320",
        selectionReason: "L1 lowest qualified commercial bidder with fastest 3-day lead time.",
      }).where(eq(procurementVendorQuotesTable.id, q1.id));
    }
    await db.update(procurementRfqsTable).set({ selectedQuoteId: q1.id }).where(eq(procurementRfqsTable.id, rfq.id));

    // 7. Purchase Order
    let [po] = await db.select().from(procurementPurchaseOrdersTable).where(eq(procurementPurchaseOrdersTable.projectId, projectId)).limit(1);
    if (!po) {
      let poNumber = `PO-20260923-${padPrj}`;
      const [dup] = await db.select().from(procurementPurchaseOrdersTable).where(eq(procurementPurchaseOrdersTable.poNumber, poNumber)).limit(1);
      if (dup) poNumber = `PO-20260923-${padPrj}-${Math.floor(1000 + Math.random() * 9000)}`;

      await db.insert(procurementPurchaseOrdersTable).values({
        poNumber,
        rfqId: rfq.id,
        quoteId: q1.id,
        materialRequestId: mr.id,
        projectId,
        vendorId: primaryVendorId,
        poDate: "2026-09-21",
        expectedDeliveryDate: "2026-09-24",
        subtotal: "974000",
        taxAmount: "175320",
        shippingCost: "0",
        totalAmount: "1149320",
        deliveryTerms: `Immediate delivery to ${project.name || "Project Site"} Central Godown.`,
        paymentTerms: "Net 30 Days",
        status: "issued",
        deliveryStatus: "delivered",
        createdById: userId,
        notes: "PO for Phase 1 Foundation Cement & Reinforcement Steel",
      });
      [po] = await db.select().from(procurementPurchaseOrdersTable).where(eq(procurementPurchaseOrdersTable.projectId, projectId)).limit(1);
    } else {
      await db.update(procurementPurchaseOrdersTable).set({
        rfqId: rfq.id,
        quoteId: q1.id,
        materialRequestId: mr.id,
        vendorId: primaryVendorId,
        subtotal: "974000",
        taxAmount: "175320",
        totalAmount: "1149320",
        status: "issued",
        deliveryStatus: "delivered",
      }).where(eq(procurementPurchaseOrdersTable.id, po.id));
    }

    await db.delete(procurementPurchaseOrderItemsTable).where(eq(procurementPurchaseOrderItemsTable.poId, po.id));
    await db.insert(procurementPurchaseOrderItemsTable).values([
      {
        poId: po.id,
        itemName: "OPC 53 Grade Ultratech Cement",
        description: "50kg HDPE bags",
        quantity: "400",
        unit: "bags",
        unitPrice: "410",
        totalPrice: "164000",
        receivedQuantity: "400",
        acceptedQuantity: "400",
        rejectedQuantity: "0",
        sortOrder: 0,
      },
      {
        poId: po.id,
        itemName: "TMT Fe500D Reinforcement Steel 16mm",
        description: "16mm Rebar IS 1786",
        quantity: "12",
        unit: "MT",
        unitPrice: "67500",
        totalPrice: "810000",
        receivedQuantity: "12",
        acceptedQuantity: "12",
        rejectedQuantity: "0",
        sortOrder: 1,
      }
    ]);
    const poItems = await db.select().from(procurementPurchaseOrderItemsTable).where(eq(procurementPurchaseOrderItemsTable.poId, po.id));

    // 8. GRN
    let [grn] = await db.select().from(procurementMaterialReceiptsTable).where(or(eq(procurementMaterialReceiptsTable.projectId, projectId), eq(procurementMaterialReceiptsTable.poId, po.id))).limit(1);
    if (!grn) {
      let receiptNumber = `GRN-20260923-${padPrj}`;
      const [dup] = await db.select().from(procurementMaterialReceiptsTable).where(eq(procurementMaterialReceiptsTable.receiptNumber, receiptNumber)).limit(1);
      if (dup) receiptNumber = `GRN-20260923-${padPrj}-${Math.floor(1000 + Math.random() * 9000)}`;

      await db.insert(procurementMaterialReceiptsTable).values({
        receiptNumber,
        poId: po.id,
        projectId,
        vendorId: primaryVendorId,
        deliveryNoteNumber: `DC-${padPrj}-9921`,
        vehicleNumber: "MH-12-QE-4481",
        driverName: "Ramesh Pawar",
        driverContact: "+91 98231 44521",
        receivedDate: new Date("2026-09-22T09:00:00Z"),
        receivedById: userId,
        remarks: `Full consignment arrived intact at Project ${projectId} site gate.`,
      });
      [grn] = await db.select().from(procurementMaterialReceiptsTable).where(or(eq(procurementMaterialReceiptsTable.projectId, projectId), eq(procurementMaterialReceiptsTable.poId, po.id))).limit(1);
    }

    await db.delete(procurementMaterialReceiptItemsTable).where(eq(procurementMaterialReceiptItemsTable.receiptId, grn.id));
    await db.insert(procurementMaterialReceiptItemsTable).values([
      { receiptId: grn.id, poItemId: poItems[0].id, receivedQuantity: "400", remarks: "Checked bag seals intact" },
      { receiptId: grn.id, poItemId: poItems[1].id, receivedQuantity: "12", remarks: "Weighbridge certified" }
    ]);
    const receiptItems = await db.select().from(procurementMaterialReceiptItemsTable).where(eq(procurementMaterialReceiptItemsTable.receiptId, grn.id));

    // 9. QC
    let [qc] = await db.select().from(procurementQualityInspectionsTable).where(or(eq(procurementQualityInspectionsTable.projectId, projectId), eq(procurementQualityInspectionsTable.poId, po.id))).limit(1);
    if (!qc) {
      let inspectionNumber = `QC-20260923-${padPrj}`;
      const [dup] = await db.select().from(procurementQualityInspectionsTable).where(eq(procurementQualityInspectionsTable.inspectionNumber, inspectionNumber)).limit(1);
      if (dup) inspectionNumber = `QC-20260923-${padPrj}-${Math.floor(1000 + Math.random() * 9000)}`;

      await db.insert(procurementQualityInspectionsTable).values({
        inspectionNumber,
        poId: po.id,
        receiptId: grn.id,
        projectId,
        inspectionDate: new Date("2026-09-22T14:00:00Z"),
        inspectedById: userId,
        inspectorName: "Vikram Malhotra (Quality Lead)",
        result: "approved",
        notes: "Slump test 120mm compliant with IS 456; rebar bend and yield tensile test compliant with IS 1786. Approved for footing casting.",
        approvedById: userId,
        approvalDate: new Date("2026-09-22T16:00:00Z"),
      });
      [qc] = await db.select().from(procurementQualityInspectionsTable).where(or(eq(procurementQualityInspectionsTable.projectId, projectId), eq(procurementQualityInspectionsTable.poId, po.id))).limit(1);
    }

    await db.delete(procurementQualityInspectionItemsTable).where(eq(procurementQualityInspectionItemsTable.inspectionId, qc.id));
    await db.insert(procurementQualityInspectionItemsTable).values([
      {
        inspectionId: qc.id,
        receiptItemId: receiptItems[0].id,
        poItemId: poItems[0].id,
        itemName: "OPC 53 Grade Ultratech Cement",
        receivedQuantity: "400",
        acceptedQuantity: "400",
        rejectedQuantity: "0",
        status: "approved",
        notes: "Batch cert verified, 28-day target strength >= 53 MPa confirmed",
      },
      {
        inspectionId: qc.id,
        receiptItemId: receiptItems[1].id,
        poItemId: poItems[1].id,
        itemName: "TMT Fe500D Reinforcement Steel 16mm",
        receivedQuantity: "12",
        acceptedQuantity: "12",
        rejectedQuantity: "0",
        status: "approved",
        notes: "Zero micro-cracks on 180° mandrel bend test, elongation 16.5%",
      }
    ]);

    // 10. Site Inventory
    const invItems = [
      {
        itemCode: `INV-CEM-${padPrj}-01`,
        itemName: "OPC 53 Grade Ultratech Cement",
        category: "civil",
        unit: "bags",
        totalQuantity: "400",
        availableQuantity: "400",
        allocatedQuantity: "0",
        consumedQuantity: "0",
        minimumStock: "50",
        reorderLevel: "100",
        averageCost: "410",
        lastPurchasePrice: "410",
        warehouseLocation: "Central Cement Godown A-1",
        status: "active",
      },
      {
        itemCode: `INV-STL-${padPrj}-01`,
        itemName: "TMT Fe500D Reinforcement Steel 16mm",
        category: "steel",
        unit: "MT",
        totalQuantity: "12",
        availableQuantity: "12",
        allocatedQuantity: "0",
        consumedQuantity: "0",
        minimumStock: "2",
        reorderLevel: "5",
        averageCost: "67500",
        lastPurchasePrice: "67500",
        warehouseLocation: "Yard Rebar Fabrication Bay",
        status: "active",
      }
    ];
    for (const inv of invItems) {
      const [existing] = await db.select().from(procurementInventoryItemsTable).where(and(eq(procurementInventoryItemsTable.projectId, projectId), eq(procurementInventoryItemsTable.itemName, inv.itemName)));
      if (!existing) {
        let code = inv.itemCode;
        const [dupCode] = await db.select().from(procurementInventoryItemsTable).where(eq(procurementInventoryItemsTable.itemCode, code));
        if (dupCode) code = `${inv.itemCode}-${Math.floor(1000 + Math.random() * 9000)}`;

        await db.insert(procurementInventoryItemsTable).values({
          projectId,
          itemCode: code,
          itemName: inv.itemName,
          category: inv.category,
          unit: inv.unit,
          totalQuantity: inv.totalQuantity,
          availableQuantity: inv.availableQuantity,
          allocatedQuantity: inv.allocatedQuantity,
          consumedQuantity: inv.consumedQuantity,
          minimumStock: inv.minimumStock,
          reorderLevel: inv.reorderLevel,
          averageCost: inv.averageCost,
          lastPurchasePrice: inv.lastPurchasePrice,
          warehouseLocation: inv.warehouseLocation,
          status: inv.status,
        });
      } else {
        await db.update(procurementInventoryItemsTable).set({
          totalQuantity: inv.totalQuantity,
          availableQuantity: inv.availableQuantity,
          minimumStock: inv.minimumStock,
          reorderLevel: inv.reorderLevel,
          averageCost: inv.averageCost,
          lastPurchasePrice: inv.lastPurchasePrice,
          warehouseLocation: inv.warehouseLocation,
          status: inv.status,
        }).where(eq(procurementInventoryItemsTable.id, existing.id));
      }
    }

    // 11. Contract & BOQ
    let [contract] = await db.select().from(contractsTable).where(eq(contractsTable.projectId, projectId)).limit(1);
    if (!contract) {
      let contractNumber = `CNT-20260923-${padPrj}`;
      const [dup] = await db.select().from(contractsTable).where(eq(contractsTable.contractNumber, contractNumber)).limit(1);
      if (dup) contractNumber = `CNT-20260923-${padPrj}-${Math.floor(1000 + Math.random() * 9000)}`;

      await db.insert(contractsTable).values({
        contractNumber,
        projectId,
        vendorId: primaryVendorId,
        title: "RCC Structural & Masonry Contract",
        description: "Complete concrete and brickwork scope for Phase 1 Foundation & Podium.",
        totalAmount: "2860000",
        retentionPercent: "5",
        advancePercent: "0",
        tdsPercent: "2",
        gstPercent: "18",
        startDate: "2026-09-01",
        endDate: "2026-12-31",
        status: "active",
        createdById: userId,
      });
      [contract] = await db.select().from(contractsTable).where(eq(contractsTable.projectId, projectId)).limit(1);
    }

    const boqList = [
      { itemNumber: "1.1", description: "M25 Grade Ready Mix Concrete in Footings & Raft", unit: "cum", quantity: "200", rate: "5500", totalAmount: "1100000", previousQuantity: "0", currentQuantity: "100", cumulativeQuantity: "100" },
      { itemNumber: "1.2", description: "High Yield Strength Deformed (HYSD) Steel Reinforcement Fe500", unit: "kg", quantity: "15000", rate: "72", totalAmount: "1080000", previousQuantity: "0", currentQuantity: "7500", cumulativeQuantity: "7500" },
      { itemNumber: "1.3", description: "200mm Solid Concrete Block Masonry in Substructure Walls", unit: "sqm", quantity: "800", rate: "850", totalAmount: "680000", previousQuantity: "0", currentQuantity: "0", cumulativeQuantity: "0" },
    ];
    await db.delete(contractBoqItemsTable).where(eq(contractBoqItemsTable.contractId, contract.id));
    for (const b of boqList) {
      await db.insert(contractBoqItemsTable).values({ contractId: contract.id, ...b });
    }
    const contractBoqs = await db.select().from(contractBoqItemsTable).where(eq(contractBoqItemsTable.contractId, contract.id));

    // 12. Work Completion & Documents
    let [wc] = await db.select().from(workCompletionsTable).where(or(eq(workCompletionsTable.projectId, projectId), eq(workCompletionsTable.contractId, contract.id))).limit(1);
    if (!wc) {
      let workCompletionNumber = `WC-20260923-${padPrj}`;
      const [dup] = await db.select().from(workCompletionsTable).where(eq(workCompletionsTable.workCompletionNumber, workCompletionNumber)).limit(1);
      if (dup) workCompletionNumber = `WC-20260923-${padPrj}-${Math.floor(1000 + Math.random() * 9000)}`;

      await db.insert(workCompletionsTable).values({
        workCompletionNumber,
        projectId,
        contractId: contract.id,
        vendorId: primaryVendorId,
        title: "Footings & Foundation Work Completion",
        milestone: "Milestone 1 - Foundation & Raft",
        completionDate: "2026-09-20",
        remarks: "100 cum M25 concrete poured and 7.5 MT rebar tied. Cube strength test passed with 28.4 MPa.",
        status: "verified",
        submittedAt: new Date("2026-09-20T10:00:00Z"),
        verifiedById: userId,
        verifiedAt: new Date("2026-09-21T14:30:00Z"),
        createdById: userId,
      });
      [wc] = await db.select().from(workCompletionsTable).where(or(eq(workCompletionsTable.projectId, projectId), eq(workCompletionsTable.contractId, contract.id))).limit(1);
    } else {
      await db.update(workCompletionsTable).set({
        projectId,
        contractId: contract.id,
        status: "verified",
        milestone: "Milestone 1 - Foundation & Raft",
        verifiedById: userId,
        verifiedAt: new Date("2026-09-21T14:30:00Z"),
      }).where(eq(workCompletionsTable.id, wc.id));
    }

    await db.delete(workCompletionItemsTable).where(eq(workCompletionItemsTable.workCompletionId, wc.id));
    await db.insert(workCompletionItemsTable).values([
      {
        workCompletionId: wc.id,
        contractBoqItemId: contractBoqs[0].id,
        description: "M25 Grade Ready Mix Concrete in Footings & Raft",
        unit: "cum",
        rate: "5500",
        previousCompletedQty: "0",
        currentCompletedQty: "100",
        cumulativeQty: "100",
        currentAmount: "550000",
        remarks: "Poured using boom pump with 100% vibrator compaction",
        sortOrder: 0,
      },
      {
        workCompletionId: wc.id,
        contractBoqItemId: contractBoqs[1].id,
        description: "High Yield Strength Deformed (HYSD) Steel Reinforcement Fe500",
        unit: "kg",
        rate: "72",
        previousCompletedQty: "0",
        currentCompletedQty: "7500",
        cumulativeQty: "7500",
        currentAmount: "540000",
        remarks: "Checked bar spacing 150mm c/c with cover blocks certified",
        sortOrder: 1,
      }
    ]);

    await db.delete(workCompletionDocumentsTable).where(eq(workCompletionDocumentsTable.workCompletionId, wc.id));
    await db.insert(workCompletionDocumentsTable).values([
      {
        workCompletionId: wc.id,
        documentType: "jmr",
        fileName: `JMR-20260920-Footing-${padPrj}.pdf`,
        fileUrl: `https://documents.kanakturnkey.com/jmr/JMR-20260920-Footing-${padPrj}.pdf`,
        fileSize: 2450000,
        uploadedById: userId,
      },
      {
        workCompletionId: wc.id,
        documentType: "test_report",
        fileName: `CubeTest-IS456-Batch44-${padPrj}.pdf`,
        fileUrl: `https://documents.kanakturnkey.com/reports/CubeTest-IS456-Batch44-${padPrj}.pdf`,
        fileSize: 1120000,
        uploadedById: userId,
      },
      {
        workCompletionId: wc.id,
        documentType: "site_photo",
        fileName: `Site-Footing-Pour-Geo-${padPrj}.jpg`,
        fileUrl: `https://documents.kanakturnkey.com/photos/Site-Footing-Pour-Geo-${padPrj}.jpg`,
        fileSize: 3840000,
        uploadedById: userId,
      }
    ]);

    // 13. RA Bill
    let [raBill] = await db.select().from(raBillsTable).where(eq(raBillsTable.projectId, projectId)).limit(1);
    let billNumber = `RA-20260923-${padPrj}`;
    if (!raBill) {
      const [dup] = await db.select().from(raBillsTable).where(eq(raBillsTable.billNumber, billNumber)).limit(1);
      if (dup) billNumber = `RA-20260923-${padPrj}-${Math.floor(1000 + Math.random() * 9000)}`;
    } else {
      billNumber = raBill.billNumber;
    }

    const raBillData = {
      projectId,
      contractId: contract.id,
      vendorId: primaryVendorId,
      workCompletionId: wc.id,
      billNumber,
      description: "1st Running Account Bill - Foundations & Plinth Pouring (Milestone 1)",
      milestone: "1st RA Bill - Foundation",
      billingPeriodStart: "2026-09-01",
      billingPeriodEnd: "2026-09-20",
      grossAmount: "1090000",
      retentionPercent: "5.00",
      retentionAmount: "54500",
      advanceRecovery: "0",
      tdsPercent: "2.00",
      tdsAmount: "21800",
      gstPercent: "18.00",
      gstAmount: "196200",
      otherDeductions: "0",
      netPayableAmount: "1209900",
      amount: "1209900",
      status: "invoice_generated",
      submittedAt: new Date("2026-09-21T16:00:00Z"),
      submittedById: userId,
      approvedById: userId,
      approvedAt: new Date("2026-09-22T11:00:00Z"),
      approvalComments: "Certified for payment. Quality and cube strength verified against IS 456.",
    };

    if (!raBill) {
      await db.insert(raBillsTable).values(raBillData);
      [raBill] = await db.select().from(raBillsTable).where(eq(raBillsTable.projectId, projectId)).limit(1);
    } else {
      await db.update(raBillsTable).set(raBillData).where(eq(raBillsTable.id, raBill.id));
    }

    await db.delete(raBillItemsTable).where(eq(raBillItemsTable.raBillId, raBill.id));
    await db.insert(raBillItemsTable).values([
      {
        raBillId: raBill.id,
        contractBoqItemId: contractBoqs[0].id,
        description: "M25 Grade Ready Mix Concrete in Footings & Raft",
        unit: "cum",
        rate: "5500",
        contractQuantity: "200",
        previousBilledQty: "0",
        currentBilledQty: "100",
        cumulativeBilledQty: "100",
        previousAmount: "0",
        currentAmount: "550000",
        cumulativeAmount: "550000",
        sortOrder: 0,
      },
      {
        raBillId: raBill.id,
        contractBoqItemId: contractBoqs[1].id,
        description: "High Yield Strength Deformed (HYSD) Steel Reinforcement Fe500",
        unit: "kg",
        rate: "72",
        contractQuantity: "15000",
        previousBilledQty: "0",
        currentBilledQty: "7500",
        cumulativeBilledQty: "7500",
        previousAmount: "0",
        currentAmount: "540000",
        cumulativeAmount: "540000",
        sortOrder: 1,
      }
    ]);

    await db.delete(raBillApprovalHistoryTable).where(eq(raBillApprovalHistoryTable.raBillId, raBill.id));
    await db.insert(raBillApprovalHistoryTable).values([
      {
        raBillId: raBill.id,
        action: "submitted",
        userId,
        previousStatus: "draft",
        newStatus: "submitted",
        comments: "Prepared by QS and submitted for PM review along with JMR sheet.",
        actionDate: new Date("2026-09-21T16:00:00Z"),
      },
      {
        raBillId: raBill.id,
        action: "approved",
        userId,
        previousStatus: "submitted",
        newStatus: "approved",
        comments: "Certified for payment. Quality and cube strength verified against IS 456.",
        actionDate: new Date("2026-09-22T11:00:00Z"),
      }
    ]);

    // 14. Invoice & Payments
    let [invoice] = await db.select().from(invoicesTable).where(and(eq(invoicesTable.projectId, projectId), eq(invoicesTable.raBillId, raBill.id))).limit(1);
    if (!invoice) {
      [invoice] = await db.select().from(invoicesTable).where(eq(invoicesTable.projectId, projectId)).limit(1);
    }
    let invoiceNumber = `INV-20260923-${padPrj}`;
    if (!invoice) {
      const [dup] = await db.select().from(invoicesTable).where(eq(invoicesTable.invoiceNumber, invoiceNumber)).limit(1);
      if (dup) invoiceNumber = `INV-20260923-${padPrj}-${Math.floor(1000 + Math.random() * 9000)}`;
    } else {
      invoiceNumber = invoice.invoiceNumber;
    }

    const invoiceData = {
      projectId,
      raBillId: raBill.id,
      vendorId: primaryVendorId,
      contractId: contract.id,
      invoiceNumber,
      clientName: project.clientName || "BlueWave Hospitality Pvt. Ltd",
      amount: "1209900",
      grossAmount: "1090000",
      deductions: "76300",
      taxAmount: "196200",
      netAmount: "1209900",
      invoiceDate: "2026-09-22",
      dueDate: "2026-10-22",
      paymentDate: "2026-09-23",
      paymentTerms: "Net 30 Days",
      sentAt: new Date("2026-09-22T14:00:00Z"),
      sentById: userId,
      recipientEmail: "accounts@bluewavehospitality.com",
      recipientNotes: "Please release payment against 1st certified RA bill for Foundation milestone.",
      totalPaidAmount: "1209900",
      outstandingAmount: "0",
      reconciliationStatus: "reconciled",
      reconciled: true,
      reconciledById: userId,
      reconciledAt: new Date("2026-09-23T11:30:00Z"),
      reconciliationRemarks: "Bank statement verified. Matched with HDFC Current Account #... in Tally ERP.",
      status: "closed",
    };

    if (!invoice) {
      await db.insert(invoicesTable).values(invoiceData);
      [invoice] = await db.select().from(invoicesTable).where(eq(invoicesTable.projectId, projectId)).limit(1);
    } else {
      await db.update(invoicesTable).set(invoiceData).where(eq(invoicesTable.id, invoice.id));
    }

    await db.delete(invoicePaymentsTable).where(eq(invoicePaymentsTable.invoiceId, invoice.id));
    let paymentNumber = `PAY-20260923-${padPrj}`;
    const [dupPay] = await db.select().from(invoicePaymentsTable).where(eq(invoicePaymentsTable.paymentNumber, paymentNumber)).limit(1);
    if (dupPay) paymentNumber = `PAY-20260923-${padPrj}-${Math.floor(1000 + Math.random() * 9000)}`;

    await db.insert(invoicePaymentsTable).values({
      invoiceId: invoice.id,
      raBillId: raBill.id,
      paymentNumber,
      paymentDate: "2026-09-23",
      paymentAmount: "1209900",
      paymentMode: "neft_rtgs",
      bankReference: "HDFC Bank Current A/c #928374",
      transactionId: `UTR-HDFC-20260923-${padPrj}`,
      remarks: "Full settlement received against Milestone 1 RA Bill.",
      recordedById: userId,
    });

    await db.delete(paymentRemindersTable).where(eq(paymentRemindersTable.invoiceId, invoice.id));
    await db.insert(paymentRemindersTable).values({
      invoiceId: invoice.id,
      reminderType: "email",
      subject: `Payment Reminder: Milestone 1 RA Bill Invoice ${invoice.invoiceNumber}`,
      message: `Dear Client, Please note Invoice ${invoice.invoiceNumber} for ₹12,09,900 is due. Attached is the certified RA bill abstract.`,
      recipient: "accounts@bluewavehospitality.com",
      followUpRemarks: "Client confirmed NEFT processing scheduled for same day.",
      sentById: userId,
    });

    // 15. Seed Vendor Tax Invoice (AP) & 3-Way Match
    let [vInv] = await db.select().from(vendorInvoicesTable).where(and(eq(vendorInvoicesTable.projectId, projectId), eq(vendorInvoicesTable.purchaseOrderId, po.id))).limit(1);
    if (!vInv) {
      [vInv] = await db.select().from(vendorInvoicesTable).where(eq(vendorInvoicesTable.projectId, projectId)).limit(1);
    }
    let vInvNumber = `VINV-20260923-${padPrj}`;
    if (!vInv) {
      const [dupVInv] = await db.select().from(vendorInvoicesTable).where(eq(vendorInvoicesTable.invoiceNumber, vInvNumber)).limit(1);
      if (dupVInv) vInvNumber = `VINV-20260923-${padPrj}-${Math.floor(1000 + Math.random() * 9000)}`;
    } else {
      vInvNumber = vInv.invoiceNumber;
    }

    const vInvData = {
      projectId,
      vendorId: primaryVendorId,
      purchaseOrderId: po.id,
      invoiceNumber: vInvNumber,
      invoiceDate: "2026-09-22",
      dueDate: "2026-10-22",
      amount: "1149320",
      grossAmount: "974000",
      taxAmount: "175320",
      retentionAmount: "0",
      advanceRecovery: "0",
      tdsAmount: "22986",
      otherDeductions: "0",
      netPayableAmount: "1149320",
      poMatched: true,
      measurementMatched: true,
      quantityRateValidated: true,
      discrepancyFlag: false,
      status: "paid",
      pmApprovedById: userId,
      pmApprovedAt: new Date("2026-09-22T15:00:00Z"),
      pmComments: "PO rates and site GRN quantities verified. Approved.",
      financeVerifiedById: userId,
      financeVerifiedAt: new Date("2026-09-22T17:00:00Z"),
      financeComments: "TDS u/s 194C deducted and GSTIN verified on portal.",
      paymentApprovedById: userId,
      paymentApprovedAt: new Date("2026-09-23T10:00:00Z"),
      totalPaidAmount: "1149320",
      outstandingAmount: "0",
    };
    if (!vInv) {
      await db.insert(vendorInvoicesTable).values(vInvData);
      [vInv] = await db.select().from(vendorInvoicesTable).where(eq(vendorInvoicesTable.projectId, projectId)).limit(1);
    } else {
      await db.update(vendorInvoicesTable).set(vInvData).where(eq(vendorInvoicesTable.id, vInv.id));
    }

    // 16. Seed Vendor Payment Voucher (AP)
    let [vPay] = await db.select().from(vendorPaymentsTable).where(eq(vendorPaymentsTable.vendorInvoiceId, vInv.id)).limit(1);
    let vPayNumber = `VPAY-20260923-${padPrj}`;
    if (!vPay) {
      const [dupVPay] = await db.select().from(vendorPaymentsTable).where(eq(vendorPaymentsTable.paymentNumber, vPayNumber)).limit(1);
      if (dupVPay) vPayNumber = `VPAY-20260923-${padPrj}-${Math.floor(1000 + Math.random() * 9000)}`;
    } else {
      vPayNumber = vPay.paymentNumber;
    }

    const vPayData = {
      projectId,
      vendorInvoiceId: vInv.id,
      vendorId: primaryVendorId,
      paymentNumber: vPayNumber,
      paymentDate: "2026-09-23",
      paymentAmount: "1149320",
      paymentMode: "neft_rtgs",
      transactionId: `UTR-SBI-20260923-${padPrj}`,
      remarks: `RTGS disbursement released against PO-${padPrj} foundation materials.`,
      recordedById: userId,
    };
    if (!vPay) {
      await db.insert(vendorPaymentsTable).values(vPayData);
      [vPay] = await db.select().from(vendorPaymentsTable).where(eq(vendorPaymentsTable.vendorInvoiceId, vInv.id)).limit(1);
    } else {
      await db.update(vendorPaymentsTable).set(vPayData).where(eq(vendorPaymentsTable.id, vPay.id));
    }

    // 17. Seed Direct Site Expenses
    const siteExpenses = [
      {
        projectId,
        description: "DG Generator & Boom Pump Diesel for 18-hr Continuous Foundation Pour",
        amount: "45000",
        category: "fuel",
        expenseDate: "2026-09-20",
        status: "approved",
        receiptUrl: `https://documents.kanakturnkey.com/receipts/Diesel-Batch44-${padPrj}.pdf`,
        submittedById: userId,
        approvedById: userId,
      },
      {
        projectId,
        description: "NABL Third-Party Lab Testing: Concrete Cube Compression (28-day) & Rebar Ductility Test",
        amount: "18500",
        category: "equipment",
        expenseDate: "2026-09-21",
        status: "approved",
        receiptUrl: `https://documents.kanakturnkey.com/reports/CubeTest-IS456-Batch44-${padPrj}.pdf`,
        submittedById: userId,
        approvedById: userId,
      }
    ];
    for (const exp of siteExpenses) {
      const [existing] = await db.select().from(expensesTable).where(and(eq(expensesTable.projectId, projectId), eq(expensesTable.description, exp.description)));
      if (!existing) {
        await db.insert(expensesTable).values(exp);
      } else {
        await db.update(expensesTable).set(exp).where(eq(expensesTable.id, existing.id));
      }
    }
    const currentExpenses = await db.select().from(expensesTable).where(eq(expensesTable.projectId, projectId));
    const exp1Id = currentExpenses[0]?.id || 1;
    const exp2Id = currentExpenses[1]?.id || currentExpenses[0]?.id || 2;

    // 18. Seed Snagging Items (Punch List)
    const snags = [
      {
        projectId,
        title: "Surface touch-up of minor honeycombing at column C-4 footing",
        description: "Non-shrink grout application on column C-4 kicker junction.",
        category: "civil",
        priority: "medium",
        status: "resolved",
        createdById: userId,
      },
      {
        projectId,
        title: "Perimeter barricading and excavation pit de-watering clearance",
        description: "Verify safety barriers and clear mud accumulation after rain.",
        category: "safety",
        priority: "high",
        status: "resolved",
        createdById: userId,
      }
    ];
    for (const s of snags) {
      const [existing] = await db.select().from(punchListItemsTable).where(and(eq(punchListItemsTable.projectId, projectId), eq(punchListItemsTable.title, s.title)));
      if (!existing) {
        await db.insert(punchListItemsTable).values(s);
      }
    }

    // 19. Seed Comprehensive Financial Audit Trail
    const auditLogsToSeed = [
      {
        workflowType: "AR",
        entityType: "client_ra_bill",
        entityId: raBill.id,
        action: "PM_APPROVED",
        previousStatus: "submitted",
        newStatus: "pm_approved",
        userId,
        userName: me.name || "Ananya Rao",
        comments: "Site measurements and NABL cube test strengths verified against IS 456.",
        metadata: JSON.stringify({ projectId, billNumber: raBill.billNumber, grossAmount: 1090000, netAmount: 1209900 }),
        createdAt: new Date("2026-09-22T10:00:00Z"),
      },
      {
        workflowType: "AR",
        entityType: "client_ra_bill",
        entityId: raBill.id,
        action: "PAYMENT_CERTIFIED",
        previousStatus: "pm_approved",
        newStatus: "payment_certified",
        userId,
        userName: "Rajesh Sharma (Client Architect)",
        comments: `Payment Certificate #PC-20260923-${padPrj} issued. Certified for 100% footing completion.`,
        metadata: JSON.stringify({ projectId, certificateNumber: `PC-20260923-${padPrj}`, certifiedAmount: 1209900 }),
        createdAt: new Date("2026-09-22T14:30:00Z"),
      },
      {
        workflowType: "AR",
        entityType: "client_invoice",
        entityId: invoice.id,
        action: "INVOICE_GENERATED",
        previousStatus: null,
        newStatus: "sent",
        userId,
        userName: me.name || "Ananya Rao",
        comments: `Tax Invoice #${invoice.invoiceNumber} dispatched with statutory GST & TDS notes.`,
        metadata: JSON.stringify({ projectId, invoiceNumber: invoice.invoiceNumber, netAmount: 1209900, gstAmount: 196200 }),
        createdAt: new Date("2026-09-23T09:00:00Z"),
      },
      {
        workflowType: "AR",
        entityType: "client_payment",
        entityId: invoice.id,
        action: "PAYMENT_RECORDED",
        previousStatus: "payment_pending",
        newStatus: "paid",
        userId,
        userName: me.name || "Ananya Rao",
        comments: `Client RTGS remittance credited via HDFC Bank. UTR: RTGS-HDFC-20260924-${padPrj}.`,
        metadata: JSON.stringify({ projectId, invoiceNumber: invoice.invoiceNumber, amount: 1209900, utr: `RTGS-HDFC-20260924-${padPrj}` }),
        createdAt: new Date("2026-09-24T11:00:00Z"),
      },
      {
        workflowType: "AP",
        entityType: "vendor_invoice",
        entityId: vInv.id,
        action: "THREE_WAY_MATCH",
        previousStatus: "received",
        newStatus: "invoice_matched",
        userId,
        userName: me.name || "Ananya Rao",
        comments: `3-Way Match Passed: ${po.poNumber} + Site ${grn.receiptNumber} + Vendor Bill ${vInv.invoiceNumber}.`,
        metadata: JSON.stringify({ projectId, poMatched: true, measurementMatched: true, quantityRateValid: true, discrepancyCount: 0 }),
        createdAt: new Date("2026-09-22T14:00:00Z"),
      },
      {
        workflowType: "AP",
        entityType: "vendor_invoice",
        entityId: vInv.id,
        action: "PM_APPROVED",
        previousStatus: "invoice_matched",
        newStatus: "pm_approved",
        userId,
        userName: me.name || "Ananya Rao",
        comments: "Field verification complete. Structural steel and cement accepted without damage.",
        metadata: JSON.stringify({ projectId, invoiceNumber: vInv.invoiceNumber }),
        createdAt: new Date("2026-09-22T15:00:00Z"),
      },
      {
        workflowType: "AP",
        entityType: "vendor_invoice",
        entityId: vInv.id,
        action: "FINANCE_VERIFIED",
        previousStatus: "pm_approved",
        newStatus: "finance_verified",
        userId,
        userName: me.name || "Ananya Rao",
        comments: "Tax audit complete: 18% GST verified on portal, 2% TDS u/s 194C deducted.",
        metadata: JSON.stringify({ projectId, invoiceNumber: vInv.invoiceNumber, tdsAmount: 19480 }),
        createdAt: new Date("2026-09-22T17:00:00Z"),
      },
      {
        workflowType: "AP",
        entityType: "vendor_payment",
        entityId: vPay.id,
        action: "PAYMENT_RELEASED",
        previousStatus: "scheduled",
        newStatus: "paid",
        userId,
        userName: me.name || "Ananya Rao",
        comments: `NEFT/RTGS batch disbursement released. UTR: UTR-SBI-20260923-${padPrj}.`,
        metadata: JSON.stringify({ projectId, paymentNumber: vPay.paymentNumber, paymentAmount: 1149320, utr: `UTR-SBI-20260923-${padPrj}` }),
        createdAt: new Date("2026-09-23T10:00:00Z"),
      },
      {
        workflowType: "AP",
        entityType: "site_expense",
        entityId: exp1Id,
        action: "EXPENSE_APPROVED",
        previousStatus: "submitted",
        newStatus: "approved",
        userId,
        userName: me.name || "Ananya Rao",
        comments: "Boom pump diesel logs cross-verified against pour cubic meter records.",
        metadata: JSON.stringify({ projectId, amount: 45000, category: "fuel" }),
        createdAt: new Date("2026-09-20T18:00:00Z"),
      },
      {
        workflowType: "AP",
        entityType: "site_expense",
        entityId: exp2Id,
        action: "EXPENSE_APPROVED",
        previousStatus: "submitted",
        newStatus: "approved",
        userId,
        userName: me.name || "Ananya Rao",
        comments: "NABL 28-day cube compression strength report passed (M35 achieved). Testing fee approved.",
        metadata: JSON.stringify({ projectId, amount: 18500, category: "equipment" }),
        createdAt: new Date("2026-09-21T16:00:00Z"),
      },
    ];

    for (const log of auditLogsToSeed) {
      const [existing] = await db.select().from(financialAuditLogsTable).where(
        and(
          eq(financialAuditLogsTable.entityType, log.entityType),
          eq(financialAuditLogsTable.entityId, log.entityId),
          eq(financialAuditLogsTable.action, log.action),
          eq(financialAuditLogsTable.newStatus, log.newStatus)
        )
      );
      if (!existing) {
        await db.insert(financialAuditLogsTable).values(log);
      }
    }

    res.json({
      success: true,
      message: `End-to-end scenario data for Project ${projectId} seeded and synchronized successfully!`,
      projectId,
    });
  } catch (error) {
    console.error("Error seeding project journey:", error);
    res.status(500).json({ error: "Failed to seed project journey data" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// SPRINT S1-E: EXPORT RA BILL TO PDF / PRINT-READY DOCUMENT
// ═══════════════════════════════════════════════════════════════════════════════
router.get("/ra-bills/:id/export-pdf", async (req, res): Promise<void> => {
  try {
    const rawId = req.params.id as string;
    const id = parseInt(rawId, 10);
    const autoPrint = req.query.autoPrint === "true";

    const [bill] = await db
      .select({
        bill: raBillsTable,
        projectName: projectsTable.name,
        projectLocation: projectsTable.location,
        clientName: projectsTable.clientName,
      })
      .from(raBillsTable)
      .leftJoin(projectsTable, eq(projectsTable.id, raBillsTable.projectId))
      .where(eq(raBillsTable.id, id));

    if (!bill) {
      res.status(404).send("RA Bill not found");
      return;
    }

    const items = await db
      .select()
      .from(raBillItemsTable)
      .where(eq(raBillItemsTable.raBillId, id));

    const gross = Number(bill.bill.grossAmount || 0);
    const retention = Number(bill.bill.retentionAmount || 0);
    const advance = Number(bill.bill.advanceRecovery || 0);
    const tds = Number(bill.bill.tdsAmount || 0);
    const gst = Number(bill.bill.gstAmount || 0);
    const other = Number(bill.bill.otherDeductions || 0);
    const net = Number(bill.bill.netPayableAmount || bill.bill.amount || 0);

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>RA Bill ${bill.bill.billNumber}</title>
  <style>
    @page { size: A4 portrait; margin: 12mm; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; font-size: 11pt; color: #1e293b; margin: 0; padding: 12px; }
    .header { border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-start; }
    .company h1 { margin: 0; font-size: 18pt; color: #0f172a; font-weight: 800; letter-spacing: -0.5px; }
    .company h1 span { color: #2563eb; font-weight: 400; }
    .company p { margin: 2px 0; font-size: 8.5pt; color: #64748b; }
    .bill-meta { text-align: right; }
    .bill-meta h2 { margin: 0; font-size: 14pt; color: #0f172a; }
    .bill-meta p { margin: 2px 0; font-size: 9pt; color: #475569; }
    .details-box { display: flex; gap: 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 14px; margin-bottom: 16px; }
    .details-box div { flex: 1; }
    .details-box h3 { margin: 0 0 6px 0; font-size: 9pt; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; }
    .details-box p { margin: 2px 0; font-size: 9.5pt; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 9pt; }
    th { background: #0f172a; color: #ffffff; text-align: left; padding: 8px 10px; font-weight: 600; }
    td { padding: 7px 10px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
    tr:nth-child(even) td { background: #f8fafc; }
    .text-right { text-align: right; }
    .calc-grid { display: flex; justify-content: flex-end; margin-bottom: 24px; }
    .calc-table { width: 340px; border-collapse: collapse; font-size: 9.5pt; }
    .calc-table td { padding: 4px 8px; border-bottom: 1px solid #e2e8f0; }
    .calc-table .total-row td { font-weight: 700; font-size: 11pt; border-top: 2px solid #0f172a; border-bottom: 2px solid #0f172a; background: #eff6ff; color: #1e3a8a; }
    .signatures { display: flex; justify-content: space-between; margin-top: 40px; padding-top: 20px; page-break-inside: avoid; }
    .sig-block { width: 180px; text-align: center; border-top: 1px solid #94a3b8; padding-top: 6px; font-size: 8.5pt; color: #475569; }
    .status-badge { display: inline-block; padding: 3px 8px; border-radius: 9999px; font-size: 8pt; font-weight: 600; text-transform: uppercase; background: #dbeafe; color: #1e40af; }
    @media print { .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="no-print" style="background: #2563eb; color: #fff; padding: 8px 16px; margin: -12px -12px 16px -12px; display: flex; justify-content: space-between; align-items: center;">
    <span>Official Running Account Bill (RA Bill) — Print / PDF Preview</span>
    <button onclick="window.print()" style="background: #fff; color: #2563eb; border: none; padding: 6px 14px; font-weight: 600; border-radius: 4px; cursor: pointer;">Print / Save as PDF</button>
  </div>

  <div class="header">
    <div class="company">
      <h1>KANAK <span>TURNKEY</span></h1>
      <p>Kanak Turnkey Solutions Pvt. Ltd.</p>
      <p>GSTIN: 27AABCK9928P1Z8 | PAN: AABCK9928P</p>
      <p>Plot 42, Technopark Industrial Zone, Andheri East, Mumbai 400093</p>
    </div>
    <div class="bill-meta">
      <h2>RUNNING ACCOUNT BILL</h2>
      <p><strong>Bill No:</strong> ${bill.bill.billNumber}</p>
      <p><strong>Date:</strong> ${bill.bill.billingPeriodEnd || new Date().toISOString().split("T")[0]}</p>
      <p><strong>Status:</strong> <span class="status-badge">${bill.bill.status}</span></p>
    </div>
  </div>

  <div class="details-box">
    <div>
      <h3>Client Details</h3>
      <p><strong>${bill.clientName || "Client"}</strong></p>
      <p>Project Site: ${bill.projectName || "Contract Site"}</p>
      <p>Location: ${bill.projectLocation || "On-site"}</p>
    </div>
    <div>
      <h3>Billing Period</h3>
      <p>Period: ${bill.bill.billingPeriodStart || "N/A"} to ${bill.bill.billingPeriodEnd || "N/A"}</p>
      <p>Milestone: ${bill.bill.milestone || "Interim Progress"}</p>
      <p>Description: ${bill.bill.description || "Certified Construction Works"}</p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 5%;">#</th>
        <th style="width: 45%;">Item Description / Work Head</th>
        <th style="width: 12%;" class="text-right">Qty</th>
        <th style="width: 10%;">Unit</th>
        <th style="width: 13%;" class="text-right">Rate (₹)</th>
        <th style="width: 15%;" class="text-right">Amount (₹)</th>
      </tr>
    </thead>
    <tbody>
      ${
        items.length > 0
          ? items
              .map(
                (item, idx) => `
        <tr>
          <td>${idx + 1}</td>
          <td><strong>${item.description || item.itemName || "Item"}</strong></td>
          <td class="text-right">${Number(item.certifiedQuantity || item.currentQuantity || item.quantity || 1).toLocaleString("en-IN")}</td>
          <td>${item.unit || "NOS"}</td>
          <td class="text-right">${Number(item.rate || item.unitPrice || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
          <td class="text-right">${Number(item.currentAmount || item.totalPrice || item.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
        </tr>`
              )
              .join("")
          : `
        <tr>
          <td>1</td>
          <td><strong>${bill.bill.description || "Civil, Structural & MEP Certified Quantities"}</strong></td>
          <td class="text-right">1</td>
          <td>LS</td>
          <td class="text-right">${gross.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
          <td class="text-right">${gross.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
        </tr>`
      }
    </tbody>
  </table>

  <div class="calc-grid">
    <table class="calc-table">
      <tr>
        <td>Gross Certified Value:</td>
        <td class="text-right">₹ ${gross.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
      </tr>
      <tr>
        <td>Less: Retention (${bill.bill.retentionPercent || 5}%):</td>
        <td class="text-right" style="color: #dc2626;">- ₹ ${retention.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
      </tr>
      ${
        advance > 0
          ? `
      <tr>
        <td>Less: Mobilization Advance Recovery:</td>
        <td class="text-right" style="color: #dc2626;">- ₹ ${advance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
      </tr>`
          : ""
      }
      ${
        tds > 0
          ? `
      <tr>
        <td>Less: TDS (${bill.bill.tdsPercent || 2}%):</td>
        <td class="text-right" style="color: #dc2626;">- ₹ ${tds.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
      </tr>`
          : ""
      }
      ${
        gst > 0
          ? `
      <tr>
        <td>Add: GST (${bill.bill.gstPercent || 18}%):</td>
        <td class="text-right" style="color: #16a34a;">+ ₹ ${gst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
      </tr>`
          : ""
      }
      <tr class="total-row">
        <td>NET CERTIFIED PAYABLE:</td>
        <td class="text-right">₹ ${net.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
      </tr>
    </table>
  </div>

  <div class="signatures">
    <div class="sig-block">Prepared By<br><strong>Site Billing Engineer</strong></div>
    <div class="sig-block">Verified By<br><strong>Project Manager</strong></div>
    <div class="sig-block">Certified By<br><strong>Client / PMC Consultant</strong></div>
  </div>

  ${autoPrint ? "<script>window.onload = function() { window.print(); };</script>" : ""}
</body>
</html>`;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  } catch (error) {
    console.error("Error generating RA Bill PDF:", error);
    res.status(500).send("Failed to generate RA Bill PDF");
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// SPRINT S1-E: EXPORT TAX INVOICE TO PDF / PRINT-READY DOCUMENT
// ═══════════════════════════════════════════════════════════════════════════════
router.get("/invoices/:id/export-pdf", async (req, res): Promise<void> => {
  try {
    const rawId = req.params.id as string;
    const id = parseInt(rawId, 10);
    const autoPrint = req.query.autoPrint === "true";

    const [inv] = await db
      .select({
        inv: invoicesTable,
        projectName: projectsTable.name,
        projectLocation: projectsTable.location,
        clientName: projectsTable.clientName,
      })
      .from(invoicesTable)
      .leftJoin(projectsTable, eq(projectsTable.id, invoicesTable.projectId))
      .where(eq(invoicesTable.id, id));

    if (!inv) {
      res.status(404).send("Invoice not found");
      return;
    }

    const amount = Number(inv.inv.amount || 0);
    const gross = Number(inv.inv.grossAmount || amount);
    const tax = Number(inv.inv.taxAmount || Math.round(gross * 0.18));
    const net = Number(inv.inv.netAmount || gross + tax);

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Tax Invoice ${inv.inv.invoiceNumber}</title>
  <style>
    @page { size: A4 portrait; margin: 12mm; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; font-size: 11pt; color: #1e293b; margin: 0; padding: 12px; }
    .header { border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-start; }
    .company h1 { margin: 0; font-size: 18pt; color: #0f172a; font-weight: 800; letter-spacing: -0.5px; }
    .company h1 span { color: #2563eb; font-weight: 400; }
    .company p { margin: 2px 0; font-size: 8.5pt; color: #64748b; }
    .inv-meta { text-align: right; }
    .inv-meta h2 { margin: 0; font-size: 15pt; color: #0f172a; letter-spacing: 0.5px; }
    .inv-meta p { margin: 2px 0; font-size: 9pt; color: #475569; }
    .details-box { display: flex; gap: 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px 14px; margin-bottom: 16px; }
    .details-box div { flex: 1; }
    .details-box h3 { margin: 0 0 6px 0; font-size: 9pt; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; }
    .details-box p { margin: 2px 0; font-size: 9.5pt; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 9.5pt; }
    th { background: #0f172a; color: #ffffff; text-align: left; padding: 8px 10px; font-weight: 600; }
    td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
    tr:nth-child(even) td { background: #f8fafc; }
    .text-right { text-align: right; }
    .calc-grid { display: flex; justify-content: space-between; margin-bottom: 24px; align-items: flex-start; }
    .bank-box { width: 50%; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 14px; font-size: 8.5pt; color: #475569; }
    .bank-box h4 { margin: 0 0 6px 0; font-size: 9pt; color: #0f172a; }
    .calc-table { width: 340px; border-collapse: collapse; font-size: 9.5pt; }
    .calc-table td { padding: 4px 8px; border-bottom: 1px solid #e2e8f0; }
    .calc-table .total-row td { font-weight: 700; font-size: 11pt; border-top: 2px solid #0f172a; border-bottom: 2px solid #0f172a; background: #eff6ff; color: #1e3a8a; }
    .signatures { display: flex; justify-content: space-between; margin-top: 40px; padding-top: 20px; page-break-inside: avoid; }
    .sig-block { width: 220px; text-align: center; border-top: 1px solid #94a3b8; padding-top: 6px; font-size: 8.5pt; color: #475569; }
    @media print { .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="no-print" style="background: #2563eb; color: #fff; padding: 8px 16px; margin: -12px -12px 16px -12px; display: flex; justify-content: space-between; align-items: center;">
    <span>Official Tax Invoice — Print / PDF Preview</span>
    <button onclick="window.print()" style="background: #fff; color: #2563eb; border: none; padding: 6px 14px; font-weight: 600; border-radius: 4px; cursor: pointer;">Print / Save as PDF</button>
  </div>

  <div class="header">
    <div class="company">
      <h1>KANAK <span>TURNKEY</span></h1>
      <p>Kanak Turnkey Solutions Pvt. Ltd.</p>
      <p>GSTIN: 27AABCK9928P1Z8 | PAN: AABCK9928P | CIN: U45200MH2020PTC339182</p>
      <p>Plot 42, Technopark Industrial Zone, Andheri East, Mumbai 400093</p>
    </div>
    <div class="inv-meta">
      <h2>TAX INVOICE</h2>
      <p><strong>Invoice No:</strong> ${inv.inv.invoiceNumber}</p>
      <p><strong>Date:</strong> ${inv.inv.invoiceDate}</p>
      <p><strong>Due Date:</strong> ${inv.inv.dueDate}</p>
      <p><strong>Status:</strong> ${inv.inv.status?.toUpperCase()}</p>
    </div>
  </div>

  <div class="details-box">
    <div>
      <h3>Bill To (Client)</h3>
      <p><strong>${inv.inv.clientName || inv.clientName || "Client"}</strong></p>
      <p>Project: ${inv.projectName || "Contract Site"}</p>
      <p>Site Location: ${inv.projectLocation || "On-site"}</p>
      <p>Place of Supply: Maharashtra (27)</p>
    </div>
    <div>
      <h3>Billing & Terms</h3>
      <p>Billing Period: ${inv.inv.billingPeriod || "Monthly Progress"}</p>
      <p>Payment Terms: ${inv.inv.paymentTerms || "Net 30 Days"}</p>
      <p>Delivery Status: Delivered & Certified</p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 5%;">#</th>
        <th style="width: 45%;">Description of Service / Works Contract</th>
        <th style="width: 15%;">SAC / HSN</th>
        <th style="width: 15%;" class="text-right">Gross Taxable (₹)</th>
        <th style="width: 20%;" class="text-right">Total Amount (₹)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>1</td>
        <td>
          <strong>Construction & EPC Turnkey Contract Works</strong><br>
          <span style="font-size: 8.5pt; color: #64748b;">Certified Works for ${inv.projectName || "Contract"} per RA Bill specification</span>
        </td>
        <td>995411</td>
        <td class="text-right">${gross.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
        <td class="text-right">${gross.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
      </tr>
    </tbody>
  </table>

  <div class="calc-grid">
    <div class="bank-box">
      <h4>Electronic Remittance Details</h4>
      <p>Bank: HDFC Bank Ltd | A/C No: 50200088912344</p>
      <p>IFSC: HDFC0000128 | Branch: Andheri East, Mumbai</p>
      <p>UPI ID: kanakturnkey@hdfcbank</p>
    </div>
    <table class="calc-table">
      <tr>
        <td>Taxable Gross Value:</td>
        <td class="text-right">₹ ${gross.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
      </tr>
      <tr>
        <td>CGST (9.0%):</td>
        <td class="text-right">₹ ${(tax / 2).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
      </tr>
      <tr>
        <td>SGST (9.0%):</td>
        <td class="text-right">₹ ${(tax / 2).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
      </tr>
      <tr class="total-row">
        <td>TOTAL INVOICE VALUE:</td>
        <td class="text-right">₹ ${net.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
      </tr>
    </table>
  </div>

  <div class="signatures">
    <div class="sig-block">Customer Acceptance / Seal</div>
    <div class="sig-block">For Kanak Turnkey Solutions Pvt. Ltd.<br><br><strong>Authorized Signatory</strong></div>
  </div>

  ${autoPrint ? "<script>window.onload = function() { window.print(); };</script>" : ""}
</body>
</html>`;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  } catch (error) {
    console.error("Error generating Invoice PDF:", error);
    res.status(500).send("Failed to generate Invoice PDF");
  }
});

export default router;
