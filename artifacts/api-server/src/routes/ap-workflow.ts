import { Router, type IRouter, type Request, type Response } from "express";
import { eq, desc, and, sql } from "drizzle-orm";
import {
  db,
  contractsTable,
  contractBoqItemsTable,
  raBillsTable,
  raBillItemsTable,
  vendorInvoicesTable,
  vendorPaymentsTable,
  apDiscrepanciesTable,
  projectsTable,
  vendorsTable,
  usersTable,
  notificationsTable,
  workCompletionsTable,
  workCompletionItemsTable,
} from "@workspace/db";
import { getCurrentUser } from "../lib/session";
import { generateNumber } from "../lib/numbers";
import { logFinancialAudit } from "./financial-audit";

const router: IRouter = Router();

// Helper: Notify users with specific roles
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
          notificationType: "ap_workflow",
          title,
          message,
          link,
          isRead: false,
        });
      }
    }
  } catch (err) {
    console.error("Error creating AP notifications:", err);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. AP SUMMARY & ANALYTICS (Payables Overview)
// ═══════════════════════════════════════════════════════════════════════════
router.get("/summary", async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.query;
    const pId = projectId ? Number(projectId) : undefined;

    const cond = pId ? eq(vendorInvoicesTable.projectId, pId) : undefined;
    const invoices = cond
      ? await db.select().from(vendorInvoicesTable).where(cond)
      : await db.select().from(vendorInvoicesTable);

    // Vendor RA Bills (billType = vendor)
    const raCond = pId
      ? and(eq(raBillsTable.projectId, pId), eq(raBillsTable.billType, "vendor"))
      : eq(raBillsTable.billType, "vendor");
    const raBills = await db.select().from(raBillsTable).where(raCond);

    let totalPayable = 0;
    let totalPaid = 0;
    let totalOutstanding = 0;
    let totalOverdue = 0;
    let pendingApprovals = 0;
    let scheduledPayments = 0;
    let activeDiscrepancies = 0;
    const today = new Date();

    const statusCounts: Record<string, number> = {};
    const ageing = { current: 0, days31_60: 0, days61_90: 0, days90Plus: 0 };

    for (const inv of invoices) {
      const net = Number(inv.netPayableAmount || inv.amount || 0);
      const paid = Number(inv.totalPaidAmount || 0);
      const outstanding = Number(inv.outstandingAmount || 0);
      totalPayable += net;
      totalPaid += paid;
      totalOutstanding += outstanding;

      statusCounts[inv.status] = (statusCounts[inv.status] || 0) + 1;

      if (inv.discrepancyFlag) activeDiscrepancies++;
      if (["pm_approved", "finance_verified", "payment_approved"].includes(inv.status)) pendingApprovals++;
      if (inv.status === "payment_scheduled") scheduledPayments++;

      // Ageing
      if (inv.dueDate && outstanding > 0) {
        const due = new Date(inv.dueDate);
        const diffDays = Math.floor((today.getTime() - due.getTime()) / (86400000));
        if (diffDays > 90) { ageing.days90Plus += outstanding; totalOverdue += outstanding; }
        else if (diffDays > 60) { ageing.days61_90 += outstanding; totalOverdue += outstanding; }
        else if (diffDays > 30) { ageing.days31_60 += outstanding; totalOverdue += outstanding; }
        else if (diffDays > 0) { ageing.current += outstanding; totalOverdue += outstanding; }
        else { ageing.current += outstanding; }
      }
    }

    res.json({
      totalPayable,
      totalPaid,
      totalOutstanding,
      totalOverdue,
      pendingApprovals,
      scheduledPayments,
      activeDiscrepancies,
      vendorInvoiceCount: invoices.length,
      vendorRaBillCount: raBills.length,
      statusCounts,
      ageing,
    });
  } catch (error: any) {
    console.error("Error fetching AP summary:", error);
    res.status(500).json({ error: "Failed to fetch AP summary" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. VENDOR RA BILLS (billType = 'vendor')
// ═══════════════════════════════════════════════════════════════════════════
router.get("/ra-bills", async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId, status } = req.query;
    let conditions: any[] = [eq(raBillsTable.billType, "vendor")];
    if (projectId) conditions.push(eq(raBillsTable.projectId, Number(projectId)));
    if (status && typeof status === "string") conditions.push(eq(raBillsTable.status, status));

    const bills = await db
      .select({
        raBill: raBillsTable,
        projectName: projectsTable.name,
        vendorName: vendorsTable.name,
        contractTitle: contractsTable.title,
      })
      .from(raBillsTable)
      .leftJoin(projectsTable, eq(raBillsTable.projectId, projectsTable.id))
      .leftJoin(vendorsTable, eq(raBillsTable.vendorId, vendorsTable.id))
      .leftJoin(contractsTable, eq(raBillsTable.contractId, contractsTable.id))
      .where(and(...conditions))
      .orderBy(desc(raBillsTable.createdAt));

    res.json(bills.map(b => ({
      ...b.raBill,
      projectName: b.projectName,
      vendorName: b.vendorName,
      contractTitle: b.contractTitle,
    })));
  } catch (error: any) {
    console.error("Error fetching vendor RA bills:", error);
    res.status(500).json({ error: "Failed to fetch vendor RA bills" });
  }
});

router.post("/ra-bills", async (req: Request, res: Response): Promise<void> => {
  try {
    const me = await getCurrentUser(req);
    const b = req.body;

    // Validate: cumulative billed qty must not exceed contract qty (without change order)
    if (b.items && Array.isArray(b.items) && b.contractId) {
      const boqItems = await db.select().from(contractBoqItemsTable)
        .where(eq(contractBoqItemsTable.contractId, Number(b.contractId)));
      const boqMap = new Map(boqItems.map(i => [i.id, i]));

      for (const item of b.items) {
        const boq = boqMap.get(item.contractBoqItemId);
        if (boq) {
          const maxQty = Number(boq.quantity);
          const cumBilled = Number(boq.cumulativeBilledQty || 0) + Number(item.currentBilledQty || 0);
          if (cumBilled > maxQty * 1.001) { // Allow tiny floating tolerance
            res.status(400).json({
              error: `Quantity validation failed for BOQ item "${boq.description}": cumulative billed qty (${cumBilled}) exceeds contract qty (${maxQty}). Change order required.`,
            });
            return;
          }
        }
      }
    }

    const billNumber = await generateNumber("VRB");
    const [result] = await db.insert(raBillsTable).values({
      projectId: Number(b.projectId),
      contractId: b.contractId ? Number(b.contractId) : null,
      vendorId: b.vendorId ? Number(b.vendorId) : null,
      billType: "vendor",
      workCompletionId: b.workCompletionId ? Number(b.workCompletionId) : null,
      billNumber,
      description: b.description || null,
      amount: String(b.amount || 0),
      milestone: b.milestone || null,
      billingPeriodStart: b.billingPeriodStart || null,
      billingPeriodEnd: b.billingPeriodEnd || null,
      grossAmount: String(b.grossAmount || b.amount || 0),
      cumulativeAmount: String(b.cumulativeAmount || 0),
      retentionPercent: String(b.retentionPercent || 5),
      retentionAmount: String(b.retentionAmount || 0),
      advanceRecovery: String(b.advanceRecovery || 0),
      tdsPercent: String(b.tdsPercent || 2),
      tdsAmount: String(b.tdsAmount || 0),
      gstPercent: String(b.gstPercent || 18),
      gstAmount: String(b.gstAmount || 0),
      otherDeductions: String(b.otherDeductions || 0),
      deductionRemarks: b.deductionRemarks || null,
      netPayableAmount: String(b.netPayableAmount || 0),
      status: "submitted",
      submittedAt: new Date(),
      submittedById: me.id,
      createdById: me.id,
    });

    const billId = result.insertId;

    // Insert line items
    if (b.items && Array.isArray(b.items)) {
      for (const item of b.items) {
        await db.insert(raBillItemsTable).values({
          raBillId: billId,
          contractBoqItemId: Number(item.contractBoqItemId),
          description: item.description,
          unit: item.unit,
          rate: String(item.rate),
          contractQuantity: String(item.contractQuantity || 0),
          previousBilledQty: String(item.previousBilledQty || 0),
          currentBilledQty: String(item.currentBilledQty || 0),
          cumulativeBilledQty: String(item.cumulativeBilledQty || 0),
          previousAmount: String(item.previousAmount || 0),
          currentAmount: String(item.currentAmount || 0),
          cumulativeAmount: String(item.cumulativeAmount || 0),
          sortOrder: item.sortOrder || 0,
        });
      }
    }

    await logFinancialAudit({
      workflowType: "AP",
      entityType: "vendor_ra_bill",
      entityId: billId,
      action: "vendor_ra_bill_received",
      newStatus: "submitted",
      userId: me.id,
      comments: `Vendor RA Bill ${billNumber} received`,
    });

    notifyRole(["admin", "project_manager"], "Vendor RA Bill Received",
      `Vendor RA Bill ${billNumber} has been submitted for verification.`, `/finance/ap`);

    const [created] = await db.select().from(raBillsTable).where(eq(raBillsTable.id, billId));
    res.status(201).json(created);
  } catch (error: any) {
    console.error("Error creating vendor RA bill:", error);
    res.status(500).json({ error: "Failed to create vendor RA bill" });
  }
});

router.get("/ra-bills/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const [bill] = await db.select().from(raBillsTable).where(eq(raBillsTable.id, id));
    if (!bill) { res.status(404).json({ error: "Vendor RA Bill not found" }); return; }

    const items = await db.select().from(raBillItemsTable).where(eq(raBillItemsTable.raBillId, id));

    // Fetch related names
    let projectName = "", vendorName = "", contractTitle = "";
    if (bill.projectId) {
      const [p] = await db.select({ name: projectsTable.name }).from(projectsTable).where(eq(projectsTable.id, bill.projectId));
      if (p) projectName = p.name;
    }
    if (bill.vendorId) {
      const [v] = await db.select({ name: vendorsTable.name }).from(vendorsTable).where(eq(vendorsTable.id, bill.vendorId));
      if (v) vendorName = v.name;
    }
    if (bill.contractId) {
      const [c] = await db.select({ title: contractsTable.title }).from(contractsTable).where(eq(contractsTable.id, bill.contractId));
      if (c) contractTitle = c.title;
    }

    res.json({ ...bill, items, projectName, vendorName, contractTitle });
  } catch (error: any) {
    console.error("Error fetching vendor RA bill:", error);
    res.status(500).json({ error: "Failed to fetch vendor RA bill" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. VENDOR INVOICES — Full AP lifecycle endpoints
// ═══════════════════════════════════════════════════════════════════════════
router.get("/invoices", async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId, status, vendorId } = req.query;
    let conditions: any[] = [];
    if (projectId) conditions.push(eq(vendorInvoicesTable.projectId, Number(projectId)));
    if (status && typeof status === "string") conditions.push(eq(vendorInvoicesTable.status, status));
    if (vendorId) conditions.push(eq(vendorInvoicesTable.vendorId, Number(vendorId)));

    const invoices = await db
      .select({
        invoice: vendorInvoicesTable,
        projectName: projectsTable.name,
        vendorName: vendorsTable.name,
      })
      .from(vendorInvoicesTable)
      .leftJoin(projectsTable, eq(vendorInvoicesTable.projectId, projectsTable.id))
      .leftJoin(vendorsTable, eq(vendorInvoicesTable.vendorId, vendorsTable.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(vendorInvoicesTable.createdAt));

    res.json(invoices.map(i => ({
      ...i.invoice,
      projectName: i.projectName,
      vendorName: i.vendorName,
    })));
  } catch (error: any) {
    console.error("Error fetching vendor invoices:", error);
    res.status(500).json({ error: "Failed to fetch vendor invoices" });
  }
});

router.get("/invoices/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const [inv] = await db.select().from(vendorInvoicesTable).where(eq(vendorInvoicesTable.id, id));
    if (!inv) { res.status(404).json({ error: "Vendor invoice not found" }); return; }

    let projectName = "", vendorName = "", contractTitle = "";
    if (inv.projectId) {
      const [p] = await db.select({ name: projectsTable.name }).from(projectsTable).where(eq(projectsTable.id, inv.projectId));
      if (p) projectName = p.name;
    }
    if (inv.vendorId) {
      const [v] = await db.select({ name: vendorsTable.name }).from(vendorsTable).where(eq(vendorsTable.id, inv.vendorId));
      if (v) vendorName = v.name;
    }
    if (inv.contractId) {
      const [c] = await db.select({ title: contractsTable.title }).from(contractsTable).where(eq(contractsTable.id, inv.contractId));
      if (c) contractTitle = c.title;
    }

    // Get payments
    const payments = await db.select().from(vendorPaymentsTable)
      .where(eq(vendorPaymentsTable.vendorInvoiceId, id))
      .orderBy(desc(vendorPaymentsTable.createdAt));

    // Get discrepancies
    const discrepancies = await db.select().from(apDiscrepanciesTable)
      .where(eq(apDiscrepanciesTable.vendorInvoiceId, id))
      .orderBy(desc(apDiscrepanciesTable.createdAt));

    res.json({ ...inv, projectName, vendorName, contractTitle, payments, discrepancies });
  } catch (error: any) {
    console.error("Error fetching vendor invoice:", error);
    res.status(500).json({ error: "Failed to fetch vendor invoice" });
  }
});

router.post("/invoices", async (req: Request, res: Response): Promise<void> => {
  try {
    const me = await getCurrentUser(req);
    const b = req.body;

    const invoiceNumber = b.invoiceNumber || await generateNumber("VINV");
    const grossAmount = Number(b.grossAmount || b.amount || 0);
    const taxAmount = Number(b.taxAmount || 0);
    const retentionAmount = Number(b.retentionAmount || 0);
    const advanceRecovery = Number(b.advanceRecovery || 0);
    const tdsAmount = Number(b.tdsAmount || 0);
    const otherDeductions = Number(b.otherDeductions || 0);
    const netPayable = grossAmount + taxAmount - retentionAmount - advanceRecovery - tdsAmount - otherDeductions;

    const [result] = await db.insert(vendorInvoicesTable).values({
      projectId: Number(b.projectId),
      vendorId: Number(b.vendorId),
      contractId: b.contractId ? Number(b.contractId) : null,
      purchaseOrderId: b.purchaseOrderId ? Number(b.purchaseOrderId) : null,
      vendorRaBillId: b.vendorRaBillId ? Number(b.vendorRaBillId) : null,
      invoiceNumber,
      invoiceDate: b.invoiceDate || new Date().toISOString().split("T")[0],
      dueDate: b.dueDate || null,
      amount: String(b.amount || grossAmount),
      grossAmount: String(grossAmount),
      taxAmount: String(taxAmount),
      retentionAmount: String(retentionAmount),
      advanceRecovery: String(advanceRecovery),
      tdsAmount: String(tdsAmount),
      otherDeductions: String(otherDeductions),
      netPayableAmount: String(netPayable),
      outstandingAmount: String(netPayable),
      status: "received",
      documentUrl: b.documentUrl || null,
    });

    const invoiceId = result.insertId;

    await logFinancialAudit({
      workflowType: "AP",
      entityType: "vendor_invoice",
      entityId: invoiceId,
      action: "invoice_received",
      newStatus: "received",
      userId: me.id,
      comments: `Vendor invoice ${invoiceNumber} uploaded/received`,
    });

    notifyRole(["admin", "project_manager", "accountant"],
      "Vendor Invoice Received",
      `Vendor Invoice ${invoiceNumber} received — pending verification and matching.`,
      `/finance/ap`);

    const [created] = await db.select().from(vendorInvoicesTable).where(eq(vendorInvoicesTable.id, invoiceId));
    res.status(201).json(created);
  } catch (error: any) {
    console.error("Error creating vendor invoice:", error);
    res.status(500).json({ error: "Failed to create vendor invoice" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. THREE-WAY MATCH (PO/Contract + Verified Measurement/RA Bill + Invoice)
// ═══════════════════════════════════════════════════════════════════════════
router.post("/invoices/:id/match", async (req: Request, res: Response): Promise<void> => {
  try {
    const me = await getCurrentUser(req);
    const id = Number(req.params.id);
    const [inv] = await db.select().from(vendorInvoicesTable).where(eq(vendorInvoicesTable.id, id));
    if (!inv) { res.status(404).json({ error: "Vendor invoice not found" }); return; }

    let poMatch = false;
    let measurementMatch = false;
    let quantityRateValid = false;
    let hasDiscrepancy = false;
    const discrepancies: { type: string; description: string; claimed: number; verified: number }[] = [];

    // 1. PO / Contract match
    if (inv.contractId) {
      const [contract] = await db.select().from(contractsTable).where(eq(contractsTable.id, inv.contractId));
      if (contract) {
        poMatch = true;
        // Check total amounts match (within 5% tolerance for deductions)
        const contractTotal = Number(contract.totalAmount || 0);
        const invoiceGross = Number(inv.grossAmount || inv.amount || 0);
        if (invoiceGross > contractTotal * 1.05) {
          hasDiscrepancy = true;
          discrepancies.push({
            type: "rate_mismatch",
            description: `Invoice gross (₹${invoiceGross.toLocaleString()}) exceeds contract total (₹${contractTotal.toLocaleString()})`,
            claimed: invoiceGross,
            verified: contractTotal,
          });
        }
      }
    } else if (inv.purchaseOrderId) {
      poMatch = true; // PO exists
    }

    // 2. Measurement/RA Bill verification
    if (inv.vendorRaBillId) {
      const [raBill] = await db.select().from(raBillsTable).where(eq(raBillsTable.id, inv.vendorRaBillId));
      if (raBill && (raBill.status === "approved" || raBill.status === "submitted")) {
        measurementMatch = true;
        // Validate amounts
        const raBillNet = Number(raBill.netPayableAmount || raBill.amount || 0);
        const invoiceNet = Number(inv.netPayableAmount || inv.amount || 0);
        if (Math.abs(invoiceNet - raBillNet) > raBillNet * 0.02) {
          hasDiscrepancy = true;
          discrepancies.push({
            type: "quantity_mismatch",
            description: `Invoice net payable (₹${invoiceNet.toLocaleString()}) does not match RA Bill verified amount (₹${raBillNet.toLocaleString()})`,
            claimed: invoiceNet,
            verified: raBillNet,
          });
        }
      }
    }

    // 3. Quantity & rate validation
    if (poMatch && measurementMatch && !hasDiscrepancy) {
      quantityRateValid = true;
    }

    const prevStatus = inv.status;
    const newStatus = hasDiscrepancy ? "discrepancy" : "invoice_matched";

    await db.update(vendorInvoicesTable).set({
      poMatched: poMatch,
      measurementMatched: measurementMatch,
      quantityRateValidated: quantityRateValid,
      discrepancyFlag: hasDiscrepancy,
      status: newStatus,
    }).where(eq(vendorInvoicesTable.id, id));

    // Create discrepancy records
    if (hasDiscrepancy) {
      for (const d of discrepancies) {
        await db.insert(apDiscrepanciesTable).values({
          vendorInvoiceId: id,
          vendorId: inv.vendorId,
          discrepancyType: d.type,
          description: d.description,
          claimedAmount: String(d.claimed),
          verifiedAmount: String(d.verified),
          differenceAmount: String(Math.abs(d.claimed - d.verified)),
          status: "open",
          raisedById: me.id,
        });
      }
    }

    await logFinancialAudit({
      workflowType: "AP",
      entityType: "vendor_invoice",
      entityId: id,
      action: "three_way_match",
      previousStatus: prevStatus,
      newStatus,
      userId: me.id,
      comments: hasDiscrepancy
        ? `3-way match failed: ${discrepancies.length} discrepancies found`
        : "3-way match passed — PO, Measurement, and Invoice verified",
      metadata: { poMatch, measurementMatch, quantityRateValid, discrepancyCount: discrepancies.length },
    });

    res.json({ poMatch, measurementMatch, quantityRateValid, hasDiscrepancy, discrepancies, newStatus });
  } catch (error: any) {
    console.error("Error performing 3-way match:", error);
    res.status(500).json({ error: "Failed to perform 3-way match" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. DISCREPANCY MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════
router.get("/discrepancies", async (req: Request, res: Response): Promise<void> => {
  try {
    const { vendorInvoiceId, status } = req.query;
    let conditions: any[] = [];
    if (vendorInvoiceId) conditions.push(eq(apDiscrepanciesTable.vendorInvoiceId, Number(vendorInvoiceId)));
    if (status && typeof status === "string") conditions.push(eq(apDiscrepanciesTable.status, status));

    const rows = await db.select().from(apDiscrepanciesTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(apDiscrepanciesTable.createdAt));

    res.json(rows);
  } catch (error: any) {
    console.error("Error fetching discrepancies:", error);
    res.status(500).json({ error: "Failed to fetch discrepancies" });
  }
});

router.post("/invoices/:id/discrepancies", async (req: Request, res: Response): Promise<void> => {
  try {
    const me = await getCurrentUser(req);
    const invoiceId = Number(req.params.id);
    const b = req.body;

    const [inv] = await db.select().from(vendorInvoicesTable).where(eq(vendorInvoicesTable.id, invoiceId));
    if (!inv) { res.status(404).json({ error: "Vendor invoice not found" }); return; }

    await db.insert(apDiscrepanciesTable).values({
      vendorInvoiceId: invoiceId,
      vendorId: inv.vendorId,
      discrepancyType: b.discrepancyType || "other",
      description: b.description,
      claimedAmount: String(b.claimedAmount || 0),
      verifiedAmount: String(b.verifiedAmount || 0),
      differenceAmount: String(Math.abs(Number(b.claimedAmount || 0) - Number(b.verifiedAmount || 0))),
      status: "open",
      raisedById: me.id,
    });

    await db.update(vendorInvoicesTable).set({
      discrepancyFlag: true,
      status: "discrepancy",
    }).where(eq(vendorInvoicesTable.id, invoiceId));

    await logFinancialAudit({
      workflowType: "AP",
      entityType: "vendor_invoice",
      entityId: invoiceId,
      action: "discrepancy_raised",
      previousStatus: inv.status,
      newStatus: "discrepancy",
      userId: me.id,
      comments: `Discrepancy raised: ${b.description}`,
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error("Error raising discrepancy:", error);
    res.status(500).json({ error: "Failed to raise discrepancy" });
  }
});

router.post("/discrepancies/:id/resolve", async (req: Request, res: Response): Promise<void> => {
  try {
    const me = await getCurrentUser(req);
    const discId = Number(req.params.id);
    const { resolutionNotes } = req.body;

    const [disc] = await db.select().from(apDiscrepanciesTable).where(eq(apDiscrepanciesTable.id, discId));
    if (!disc) { res.status(404).json({ error: "Discrepancy not found" }); return; }

    await db.update(apDiscrepanciesTable).set({
      status: "resolved",
      resolutionNotes: resolutionNotes || null,
      resolvedById: me.id,
      resolvedAt: new Date(),
    }).where(eq(apDiscrepanciesTable.id, discId));

    // Check if all discrepancies for this invoice are resolved
    const remaining = await db.select().from(apDiscrepanciesTable)
      .where(and(
        eq(apDiscrepanciesTable.vendorInvoiceId, disc.vendorInvoiceId),
        eq(apDiscrepanciesTable.status, "open"),
      ));

    if (remaining.length === 0) {
      await db.update(vendorInvoicesTable).set({
        discrepancyFlag: false,
        status: "invoice_matched",
      }).where(eq(vendorInvoicesTable.id, disc.vendorInvoiceId));
    }

    await logFinancialAudit({
      workflowType: "AP",
      entityType: "vendor_invoice",
      entityId: disc.vendorInvoiceId,
      action: "discrepancy_resolved",
      previousStatus: "discrepancy",
      newStatus: remaining.length === 0 ? "invoice_matched" : "discrepancy",
      userId: me.id,
      comments: resolutionNotes || "Discrepancy resolved",
    });

    res.json({ success: true, allResolved: remaining.length === 0 });
  } catch (error: any) {
    console.error("Error resolving discrepancy:", error);
    res.status(500).json({ error: "Failed to resolve discrepancy" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// 6. VENDOR CLARIFICATION
// ═══════════════════════════════════════════════════════════════════════════
router.post("/invoices/:id/clarify", async (req: Request, res: Response): Promise<void> => {
  try {
    const me = await getCurrentUser(req);
    const id = Number(req.params.id);
    const { notes } = req.body;

    const [inv] = await db.select().from(vendorInvoicesTable).where(eq(vendorInvoicesTable.id, id));
    if (!inv) { res.status(404).json({ error: "Vendor invoice not found" }); return; }

    const prevStatus = inv.status;
    await db.update(vendorInvoicesTable).set({
      status: "vendor_clarification",
      clarificationNotes: notes || null,
    }).where(eq(vendorInvoicesTable.id, id));

    await logFinancialAudit({
      workflowType: "AP",
      entityType: "vendor_invoice",
      entityId: id,
      action: "clarification_requested",
      previousStatus: prevStatus,
      newStatus: "vendor_clarification",
      userId: me.id,
      comments: notes || "Clarification requested from vendor",
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error("Error requesting clarification:", error);
    res.status(500).json({ error: "Failed to request clarification" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// 7. APPROVAL CHAIN: PM → Finance → Payment
// ═══════════════════════════════════════════════════════════════════════════
router.post("/invoices/:id/pm-approve", async (req: Request, res: Response): Promise<void> => {
  try {
    const me = await getCurrentUser(req);
    const id = Number(req.params.id);
    const { comments } = req.body;

    const [inv] = await db.select().from(vendorInvoicesTable).where(eq(vendorInvoicesTable.id, id));
    if (!inv) { res.status(404).json({ error: "Vendor invoice not found" }); return; }

    const prevStatus = inv.status;
    await db.update(vendorInvoicesTable).set({
      status: "pm_approved",
      pmApprovedById: me.id,
      pmApprovedAt: new Date(),
      pmComments: comments || null,
    }).where(eq(vendorInvoicesTable.id, id));

    await logFinancialAudit({
      workflowType: "AP",
      entityType: "vendor_invoice",
      entityId: id,
      action: "pm_approved",
      previousStatus: prevStatus,
      newStatus: "pm_approved",
      userId: me.id,
      comments: comments || "PM approved vendor invoice",
    });

    notifyRole(["admin", "accountant"], "Vendor Invoice PM Approved",
      `Invoice ${inv.invoiceNumber} approved by PM — pending finance verification.`, `/finance/ap`);

    res.json({ success: true });
  } catch (error: any) {
    console.error("Error PM approving:", error);
    res.status(500).json({ error: "Failed to PM approve invoice" });
  }
});

router.post("/invoices/:id/finance-verify", async (req: Request, res: Response): Promise<void> => {
  try {
    const me = await getCurrentUser(req);
    const id = Number(req.params.id);
    const { comments } = req.body;

    const [inv] = await db.select().from(vendorInvoicesTable).where(eq(vendorInvoicesTable.id, id));
    if (!inv) { res.status(404).json({ error: "Vendor invoice not found" }); return; }

    const prevStatus = inv.status;
    await db.update(vendorInvoicesTable).set({
      status: "finance_verified",
      financeVerifiedById: me.id,
      financeVerifiedAt: new Date(),
      financeComments: comments || null,
    }).where(eq(vendorInvoicesTable.id, id));

    await logFinancialAudit({
      workflowType: "AP",
      entityType: "vendor_invoice",
      entityId: id,
      action: "finance_verified",
      previousStatus: prevStatus,
      newStatus: "finance_verified",
      userId: me.id,
      comments: comments || "Finance verified vendor invoice",
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error("Error finance verifying:", error);
    res.status(500).json({ error: "Failed to finance verify invoice" });
  }
});

router.post("/invoices/:id/approve-payment", async (req: Request, res: Response): Promise<void> => {
  try {
    const me = await getCurrentUser(req);
    const id = Number(req.params.id);

    const [inv] = await db.select().from(vendorInvoicesTable).where(eq(vendorInvoicesTable.id, id));
    if (!inv) { res.status(404).json({ error: "Vendor invoice not found" }); return; }

    const prevStatus = inv.status;
    await db.update(vendorInvoicesTable).set({
      status: "payment_approved",
      paymentApprovedById: me.id,
      paymentApprovedAt: new Date(),
    }).where(eq(vendorInvoicesTable.id, id));

    await logFinancialAudit({
      workflowType: "AP",
      entityType: "vendor_invoice",
      entityId: id,
      action: "payment_approved",
      previousStatus: prevStatus,
      newStatus: "payment_approved",
      userId: me.id,
      comments: "Payment approved for vendor invoice",
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error("Error approving payment:", error);
    res.status(500).json({ error: "Failed to approve payment" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// 8. PAYMENT SCHEDULING
// ═══════════════════════════════════════════════════════════════════════════
router.post("/invoices/:id/schedule", async (req: Request, res: Response): Promise<void> => {
  try {
    const me = await getCurrentUser(req);
    const id = Number(req.params.id);
    const { scheduledDate, scheduledAmount } = req.body;

    const [inv] = await db.select().from(vendorInvoicesTable).where(eq(vendorInvoicesTable.id, id));
    if (!inv) { res.status(404).json({ error: "Vendor invoice not found" }); return; }

    const prevStatus = inv.status;
    await db.update(vendorInvoicesTable).set({
      status: "payment_scheduled",
      paymentScheduledDate: scheduledDate || null,
      scheduledAmount: String(scheduledAmount || inv.netPayableAmount || inv.amount || 0),
    }).where(eq(vendorInvoicesTable.id, id));

    await logFinancialAudit({
      workflowType: "AP",
      entityType: "vendor_invoice",
      entityId: id,
      action: "payment_scheduled",
      previousStatus: prevStatus,
      newStatus: "payment_scheduled",
      userId: me.id,
      comments: `Payment scheduled for ${scheduledDate}, amount: ₹${scheduledAmount || inv.netPayableAmount}`,
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error("Error scheduling payment:", error);
    res.status(500).json({ error: "Failed to schedule payment" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// 9. VENDOR PAYMENT (Our Bank → Vendor)
// ═══════════════════════════════════════════════════════════════════════════
router.post("/invoices/:id/pay", async (req: Request, res: Response): Promise<void> => {
  try {
    const me = await getCurrentUser(req);
    const id = Number(req.params.id);
    const b = req.body;

    const [inv] = await db.select().from(vendorInvoicesTable).where(eq(vendorInvoicesTable.id, id));
    if (!inv) { res.status(404).json({ error: "Vendor invoice not found" }); return; }

    const paymentAmount = Number(b.paymentAmount || 0);
    if (paymentAmount <= 0) {
      res.status(400).json({ error: "Payment amount must be greater than zero" });
      return;
    }

    const paymentNumber = await generateNumber("VPAY");

    await db.insert(vendorPaymentsTable).values({
      vendorInvoiceId: id,
      vendorId: inv.vendorId,
      projectId: inv.projectId,
      vendorRaBillId: inv.vendorRaBillId || null,
      paymentNumber,
      paymentDate: b.paymentDate || new Date().toISOString().split("T")[0],
      paymentAmount: String(paymentAmount),
      paymentMode: b.paymentMode || "neft_rtgs",
      bankReference: b.bankReference || null,
      transactionId: b.transactionId || null,
      fromBankAccount: b.fromBankAccount || null,
      vendorBankDetails: b.vendorBankDetails || null,
      remarks: b.remarks || null,
      documentUrl: b.documentUrl || null,
      recordedById: me.id,
    });

    const newPaid = Number(inv.totalPaidAmount || 0) + paymentAmount;
    const netPayable = Number(inv.netPayableAmount || inv.amount || 0);
    const newOutstanding = Math.max(0, netPayable - newPaid);
    const newStatus = newOutstanding <= 0.01 ? "paid" : inv.status;

    await db.update(vendorInvoicesTable).set({
      totalPaidAmount: String(newPaid),
      outstandingAmount: String(newOutstanding),
      paymentDate: b.paymentDate || new Date().toISOString().split("T")[0],
      status: newStatus,
    }).where(eq(vendorInvoicesTable.id, id));

    await logFinancialAudit({
      workflowType: "AP",
      entityType: "vendor_payment",
      entityId: id,
      action: "payment_recorded",
      previousStatus: inv.status,
      newStatus,
      userId: me.id,
      comments: `Payment ${paymentNumber} of ₹${paymentAmount.toLocaleString()} recorded via ${b.paymentMode || "neft_rtgs"}`,
      metadata: { paymentNumber, paymentAmount, totalPaid: newPaid, outstanding: newOutstanding },
    });

    res.json({ success: true, paymentNumber, totalPaid: newPaid, outstanding: newOutstanding, status: newStatus });
  } catch (error: any) {
    console.error("Error recording vendor payment:", error);
    res.status(500).json({ error: "Failed to record vendor payment" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// 10. VENDOR PAYMENTS LIST
// ═══════════════════════════════════════════════════════════════════════════
router.get("/payments", async (req: Request, res: Response): Promise<void> => {
  try {
    const { vendorInvoiceId, vendorId, projectId } = req.query;
    let conditions: any[] = [];
    if (vendorInvoiceId) conditions.push(eq(vendorPaymentsTable.vendorInvoiceId, Number(vendorInvoiceId)));
    if (vendorId) conditions.push(eq(vendorPaymentsTable.vendorId, Number(vendorId)));
    if (projectId) conditions.push(eq(vendorPaymentsTable.projectId, Number(projectId)));

    const payments = await db
      .select({
        payment: vendorPaymentsTable,
        vendorName: vendorsTable.name,
        projectName: projectsTable.name,
      })
      .from(vendorPaymentsTable)
      .leftJoin(vendorsTable, eq(vendorPaymentsTable.vendorId, vendorsTable.id))
      .leftJoin(projectsTable, eq(vendorPaymentsTable.projectId, projectsTable.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(vendorPaymentsTable.createdAt));

    res.json(payments.map(p => ({
      ...p.payment,
      vendorName: p.vendorName,
      projectName: p.projectName,
    })));
  } catch (error: any) {
    console.error("Error fetching vendor payments:", error);
    res.status(500).json({ error: "Failed to fetch vendor payments" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// 11. AP RECONCILIATION
// ═══════════════════════════════════════════════════════════════════════════
router.post("/invoices/:id/reconcile", async (req: Request, res: Response): Promise<void> => {
  try {
    const me = await getCurrentUser(req);
    const id = Number(req.params.id);
    const { remarks } = req.body;

    const [inv] = await db.select().from(vendorInvoicesTable).where(eq(vendorInvoicesTable.id, id));
    if (!inv) { res.status(404).json({ error: "Vendor invoice not found" }); return; }

    const prevStatus = inv.status;
    await db.update(vendorInvoicesTable).set({
      status: "reconciled",
      reconciled: true,
      reconciledById: me.id,
      reconciledAt: new Date(),
      reconciliationRemarks: remarks || null,
    }).where(eq(vendorInvoicesTable.id, id));

    await logFinancialAudit({
      workflowType: "AP",
      entityType: "vendor_invoice",
      entityId: id,
      action: "reconciled",
      previousStatus: prevStatus,
      newStatus: "reconciled",
      userId: me.id,
      comments: remarks || "AP reconciliation completed",
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error("Error reconciling AP invoice:", error);
    res.status(500).json({ error: "Failed to reconcile" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// 12. CLOSE PAYABLE
// ═══════════════════════════════════════════════════════════════════════════
router.post("/invoices/:id/close", async (req: Request, res: Response): Promise<void> => {
  try {
    const me = await getCurrentUser(req);
    const id = Number(req.params.id);

    const [inv] = await db.select().from(vendorInvoicesTable).where(eq(vendorInvoicesTable.id, id));
    if (!inv) { res.status(404).json({ error: "Vendor invoice not found" }); return; }

    const prevStatus = inv.status;
    await db.update(vendorInvoicesTable).set({ status: "closed" }).where(eq(vendorInvoicesTable.id, id));

    await logFinancialAudit({
      workflowType: "AP",
      entityType: "vendor_invoice",
      entityId: id,
      action: "closed",
      previousStatus: prevStatus,
      newStatus: "closed",
      userId: me.id,
      comments: "AP invoice closed",
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error("Error closing AP invoice:", error);
    res.status(500).json({ error: "Failed to close AP invoice" });
  }
});

export default router;
