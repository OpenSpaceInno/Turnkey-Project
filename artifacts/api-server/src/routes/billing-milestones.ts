import { Router, type IRouter } from "express";
import { eq, desc, asc, and, sql } from "drizzle-orm";
import {
  db,
  projectsTable,
  contractsTable,
  billingMilestonesTable,
  budgetItemsTable,
  raBillsTable,
  notificationsTable,
  financialAuditLogsTable,
  auditLogsTable,
} from "@workspace/db";
import { numKeys, num } from "../lib/transforms";
import { getCurrentUser } from "../lib/session";

const router: IRouter = Router();

const fMilestone = (m: Record<string, unknown>) =>
  numKeys(m, ["billingPercent", "expectedAmount", "billedAmount"]);

const fContract = (c: Record<string, unknown>) =>
  numKeys(c, [
    "totalAmount",
    "retentionPercent",
    "advancePercent",
    "abgPercent",
    "abgAmount",
    "tdsPercent",
    "gstPercent",
    "paymentTermsDays",
    "dlpMonths",
  ]);

// ── 1. GET /projects/:projectId/billing-milestones ─────────────────────────
router.get("/projects/:projectId/billing-milestones", async (req, res): Promise<void> => {
  const projectId = parseInt(req.params.projectId as string, 10);
  if (isNaN(projectId) || projectId <= 0) {
    res.status(400).json({ error: "Invalid project ID" });
    return;
  }

  // 1. Fetch project
  const [project] = await db
    .select()
    .from(projectsTable)
    .where(eq(projectsTable.id, projectId))
    .limit(1);

  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  // 2. Fetch client contract (if any)
  const clientContracts = await db
    .select()
    .from(contractsTable)
    .where(
      and(
        eq(contractsTable.projectId, projectId),
        eq(contractsTable.contractType, "client")
      )
    )
    .limit(1);
  const clientContract = clientContracts[0] || null;

  // 3. Fetch existing billing milestones
  let milestones = await db
    .select()
    .from(billingMilestonesTable)
    .where(eq(billingMilestonesTable.projectId, projectId))
    .orderBy(asc(billingMilestonesTable.sortOrder), asc(billingMilestonesTable.id));

  // If no milestones exist for this project, auto-seed standard 6-stage turnkey schedule!
  if (milestones.length === 0) {
    const projectBudget = num(project.budget) ?? 50000000;
    const contractId = clientContract?.id ?? null;
    const advancePct = clientContract ? num(clientContract.advancePercent) ?? 10 : 10;

    const defaultSchedule = [
      {
        num: "M1",
        title: "Mobilization Advance & Site Possession Handover",
        desc: "Contract execution, site possession, mobilization of site office, plant & machinery",
        stage: "mobilization",
        pct: advancePct > 0 ? advancePct : 10.00,
        days: 15,
        status: "ready_to_bill",
      },
      {
        num: "M2",
        title: "Plinth & Substructure Completion",
        desc: "Excavation, foundation footings, plinth beams, and anti-termite treatment",
        stage: "substructure",
        pct: 15.00,
        days: 60,
        status: "pending",
      },
      {
        num: "M3",
        title: "Superstructure & Core RCC Works",
        desc: "Casting of columns, floor slabs, structural staircase, and lift core",
        stage: "superstructure",
        pct: 25.00,
        days: 120,
        status: "pending",
      },
      {
        num: "M4",
        title: "MEP First-Fix & Internal Blockwork Partitions",
        desc: "Internal masonry, conduit rough-ins, plumbing concealed piping, and HVAC duct hanging",
        stage: "mep",
        pct: 20.00,
        days: 180,
        status: "pending",
      },
      {
        num: "M5",
        title: "Flooring, Wall Finishes, Joinery & Painting",
        desc: "Tiles/marble laying, false ceiling, internal doors, first coat paint, and sanitary fittings",
        stage: "finishes",
        pct: 20.00,
        days: 240,
        status: "pending",
      },
      {
        num: "M6",
        title: "Testing, Commissioning, Virtual Completion & Handover",
        desc: "Final MEP testing & commissioning, snag rectification, deep cleaning, and client sign-off",
        stage: "handover",
        pct: 10.00,
        days: 290,
        status: "pending",
      },
    ];

    const baseDate = project.startDate ? new Date(project.startDate) : new Date();

    for (let i = 0; i < defaultSchedule.length; i++) {
      const s = defaultSchedule[i];
      const targetDate = new Date(baseDate);
      targetDate.setDate(targetDate.getDate() + s.days);

      const expAmt = ((projectBudget * s.pct) / 100).toFixed(2);
      await db.insert(billingMilestonesTable).values({
        projectId: project.id,
        contractId: contractId,
        milestoneNumber: s.num,
        title: s.title,
        description: s.desc,
        stage: s.stage,
        billingPercent: s.pct.toFixed(2),
        expectedAmount: expAmt,
        targetDate: targetDate.toISOString().slice(0, 10),
        status: s.status,
        sortOrder: i + 1,
      });
    }

    milestones = await db
      .select()
      .from(billingMilestonesTable)
      .where(eq(billingMilestonesTable.projectId, projectId))
      .orderBy(asc(billingMilestonesTable.sortOrder), asc(billingMilestonesTable.id));
  }

  // 4. Enrich each milestone with linked RA Bill details if raised
  const enrichedMilestones = await Promise.all(
    milestones.map(async (m) => {
      let raBill = null;
      if (m.raBillId) {
        const [bill] = await db
          .select({
            id: raBillsTable.id,
            billNumber: raBillsTable.billNumber,
            billType: raBillsTable.billType,
            status: raBillsTable.status,
            amount: raBillsTable.amount,
            grossAmount: raBillsTable.grossAmount,
            netPayableAmount: raBillsTable.netPayableAmount,
            paymentCertificateNumber: raBillsTable.paymentCertificateNumber,
            submittedAt: raBillsTable.submittedAt,
            approvedAt: raBillsTable.approvedAt,
            paymentCertifiedAt: raBillsTable.paymentCertifiedAt,
          })
          .from(raBillsTable)
          .where(eq(raBillsTable.id, m.raBillId))
          .limit(1);
        raBill = bill ? numKeys(bill, ["amount", "grossAmount", "netPayableAmount"]) : null;
      }

      return {
        ...fMilestone(m),
        raBill,
      };
    })
  );

  // Summary statistics
  const totalContractValue = clientContract ? num(clientContract.totalAmount) : num(project.budget) ?? 0;
  const totalBilled = enrichedMilestones.reduce((acc, m) => acc + (m.status === "billed" || m.status === "paid" ? Number(m.expectedAmount || 0) : 0), 0);
  const totalPaid = enrichedMilestones.reduce((acc, m) => acc + (m.status === "paid" ? Number(m.expectedAmount || 0) : 0), 0);
  const totalPending = totalContractValue - totalBilled;

  res.json({
    contract: clientContract ? fContract(clientContract) : null,
    milestones: enrichedMilestones,
    summary: {
      totalContractValue,
      totalBilled,
      totalPaid,
      totalPending,
      billedPercentage: totalContractValue > 0 ? ((totalBilled / totalContractValue) * 100).toFixed(1) : "0",
      milestonesCount: enrichedMilestones.length,
      billedCount: enrichedMilestones.filter((m) => m.status === "billed" || m.status === "paid").length,
    },
  });
});

// ── 2. POST /projects/:projectId/billing-milestones ─────────────────────────
router.post("/projects/:projectId/billing-milestones", async (req, res): Promise<void> => {
  const projectId = parseInt(req.params.projectId as string, 10);
  const b = req.body ?? {};
  const me = await getCurrentUser();

  if (!b.title || !b.milestoneNumber) {
    res.status(400).json({ error: "title and milestoneNumber are required" });
    return;
  }

  const [project] = await db
    .select()
    .from(projectsTable)
    .where(eq(projectsTable.id, projectId))
    .limit(1);

  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  const billingPercent = Number(b.billingPercent || 0);
  const projectBudget = num(project.budget) ?? 0;
  const expectedAmount = b.expectedAmount != null ? String(b.expectedAmount) : ((projectBudget * billingPercent) / 100).toFixed(2);

  const result = await db.insert(billingMilestonesTable).values({
    projectId,
    contractId: b.contractId ? Number(b.contractId) : null,
    milestoneNumber: String(b.milestoneNumber),
    title: String(b.title),
    description: b.description ?? null,
    stage: b.stage ?? "general",
    billingPercent: billingPercent.toFixed(2),
    expectedAmount: expectedAmount,
    targetDate: b.targetDate ?? null,
    status: b.status ?? "pending",
    sortOrder: Number(b.sortOrder || 0),
  });

  const insertId = Number(result[0].insertId);
  const [created] = await db
    .select()
    .from(billingMilestonesTable)
    .where(eq(billingMilestonesTable.id, insertId))
    .limit(1);

  res.status(201).json(fMilestone(created!));
});

// ── 3. PATCH /billing-milestones/:id ───────────────────────────────────────
router.patch("/billing-milestones/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  const b = req.body ?? {};

  const update: Record<string, unknown> = {};
  for (const k of [
    "title",
    "description",
    "stage",
    "status",
    "targetDate",
    "completionDate",
    "sortOrder",
  ]) {
    if (b[k] !== undefined) update[k] = b[k];
  }

  if (b.billingPercent !== undefined) {
    update.billingPercent = Number(b.billingPercent).toFixed(2);
  }
  if (b.expectedAmount !== undefined) {
    update.expectedAmount = String(b.expectedAmount);
  }
  if (b.billedAmount !== undefined) {
    update.billedAmount = String(b.billedAmount);
  }

  await db
    .update(billingMilestonesTable)
    .set(update)
    .where(eq(billingMilestonesTable.id, id));

  const [updated] = await db
    .select()
    .from(billingMilestonesTable)
    .where(eq(billingMilestonesTable.id, id))
    .limit(1);

  if (!updated) {
    res.status(404).json({ error: "Milestone not found" });
    return;
  }

  res.json(fMilestone(updated));
});

// ── 4. POST /billing-milestones/:id/raise-ra-bill ───────────────────────────
// Seamless one-click RA Bill generator directly mapped to milestone billing %
router.post("/billing-milestones/:id/raise-ra-bill", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  const me = await getCurrentUser();

  const [milestone] = await db
    .select()
    .from(billingMilestonesTable)
    .where(eq(billingMilestonesTable.id, id))
    .limit(1);

  if (!milestone) {
    res.status(404).json({ error: "Milestone not found" });
    return;
  }

  if (milestone.raBillId) {
    res.status(409).json({
      error: "An RA Bill has already been generated for this milestone",
      raBillId: milestone.raBillId,
    });
    return;
  }

  // Fetch project & contract
  const [project] = await db
    .select()
    .from(projectsTable)
    .where(eq(projectsTable.id, milestone.projectId))
    .limit(1);

  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  const [contract] = await db
    .select()
    .from(contractsTable)
    .where(
      and(
        eq(contractsTable.projectId, project.id),
        eq(contractsTable.contractType, "client")
      )
    )
    .limit(1);

  const grossAmount = Number(milestone.expectedAmount || 0);
  const retentionPercent = contract ? Number(contract.retentionPercent || 5) : 5;
  const retentionAmount = Number(((grossAmount * retentionPercent) / 100).toFixed(2));
  const tdsPercent = 2.0;
  const tdsAmount = Number(((grossAmount * tdsPercent) / 100).toFixed(2));
  const gstPercent = 18.0;
  const gstAmount = Number(((grossAmount * gstPercent) / 100).toFixed(2));
  const netPayableAmount = Number((grossAmount + gstAmount - retentionAmount - tdsAmount).toFixed(2));

  // Count existing client RA bills for numbering
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(raBillsTable)
    .where(
      and(
        eq(raBillsTable.projectId, project.id),
        eq(raBillsTable.billType, "client")
      )
    );

  const billNumber = `RAB-CLI-${String(project.id).padStart(3, "0")}-${String((count ?? 0) + 1).padStart(2, "0")}`;

  // 1. Create the Client RA Bill
  const billResult = await db.insert(raBillsTable).values({
    projectId: project.id,
    contractId: contract?.id ?? milestone.contractId ?? null,
    vendorId: null,
    billType: "client",
    clientName: contract?.clientName || project.clientName || "Client",
    billNumber: billNumber,
    description: `RA Bill for ${milestone.milestoneNumber}: ${milestone.title} (${milestone.billingPercent}% of Contract)`,
    amount: String(grossAmount),
    grossAmount: String(grossAmount),
    cumulativeAmount: String(grossAmount),
    milestone: `${milestone.milestoneNumber}: ${milestone.title}`,
    billingPeriodStart: project.startDate ? new Date(project.startDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
    billingPeriodEnd: new Date().toISOString().slice(0, 10),
    retentionPercent: String(retentionPercent),
    retentionAmount: String(retentionAmount),
    tdsPercent: String(tdsPercent),
    tdsAmount: String(tdsAmount),
    gstPercent: String(gstPercent),
    gstAmount: String(gstAmount),
    netPayableAmount: String(netPayableAmount),
    status: "draft",
    createdById: me.id,
  });

  const raBillId = Number(billResult[0].insertId);

  // 2. Link RA Bill back to the milestone
  await db
    .update(billingMilestonesTable)
    .set({
      raBillId: raBillId,
      status: "billed",
      billedAmount: String(grossAmount),
      completionDate: new Date().toISOString().slice(0, 10),
    })
    .where(eq(billingMilestonesTable.id, milestone.id));

  // 3. Log Financial Audit Trail
  await db.insert(financialAuditLogsTable).values({
    workflowType: "AR",
    entityType: "client_ra_bill",
    entityId: raBillId,
    action: "RA_BILL_CREATED_FROM_MILESTONE",
    previousStatus: "milestone_ready",
    newStatus: "draft",
    userId: me.id,
    userName: me.name,
    comments: `Raised Client RA Bill ${billNumber} directly from Milestone ${milestone.milestoneNumber} (${milestone.title}) for ₹${grossAmount.toLocaleString("en-IN")}. Net Payable: ₹${netPayableAmount.toLocaleString("en-IN")}.`,
    metadata: {
      milestoneId: milestone.id,
      milestoneNumber: milestone.milestoneNumber,
      billingPercent: milestone.billingPercent,
      grossAmount,
      retentionAmount,
      tdsAmount,
      gstAmount,
      netPayableAmount,
    },
  });

  // 4. Send Notification
  await db.insert(notificationsTable).values({
    userId: me.id,
    notificationType: "client_ra_bill_created",
    title: `Client RA Bill ${billNumber} Raised`,
    message: `Milestone "${milestone.title}" has been billed. Draft RA Bill ${billNumber} generated for ₹${grossAmount.toLocaleString("en-IN")}.`,
  });

  const [createdBill] = await db
    .select()
    .from(raBillsTable)
    .where(eq(raBillsTable.id, raBillId))
    .limit(1);

  res.status(201).json({
    bill: numKeys(createdBill!, ["amount", "grossAmount", "netPayableAmount", "retentionAmount", "gstAmount", "tdsAmount"]),
    milestoneId: milestone.id,
    billNumber,
  });
});

// ── 5. GET /projects/:projectId/budget-variance-alerts ─────────────────────
// Real-time notifications and analysis when committed POs + Subcontracts + Expenses exceed package budget
router.get("/projects/:projectId/budget-variance-alerts", async (req, res): Promise<void> => {
  const projectId = parseInt(req.params.projectId as string, 10);
  if (isNaN(projectId) || projectId <= 0) {
    res.status(400).json({ error: "Invalid project ID" });
    return;
  }

  const [project] = await db
    .select()
    .from(projectsTable)
    .where(eq(projectsTable.id, projectId))
    .limit(1);

  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  const budgetItems = await db
    .select()
    .from(budgetItemsTable)
    .where(eq(budgetItemsTable.projectId, projectId));

  let totalBudget = 0;
  let totalCommitted = 0;
  let totalActual = 0;
  let totalConsumed = 0;

  const packageAnalyses = budgetItems.map((b) => {
    const budgeted = Number(b.budgeted || 0);
    const committed = Number(b.committed || 0);
    const actual = Number(b.actual || 0);
    const consumed = committed + actual;
    const variance = budgeted - consumed;
    const utilizationPercent = budgeted > 0 ? (consumed / budgeted) * 100 : 0;

    totalBudget += budgeted;
    totalCommitted += committed;
    totalActual += actual;
    totalConsumed += consumed;

    let severity: "normal" | "warning" | "critical" = "normal";
    let alertMessage = "";

    if (consumed > budgeted) {
      severity = "critical";
      const overrun = consumed - budgeted;
      alertMessage = `CRITICAL OVERRUN: Package "${b.description}" has exceeded its sanctioned budget by ₹${overrun.toLocaleString("en-IN")} (${utilizationPercent.toFixed(1)}% utilized).`;
    } else if (utilizationPercent >= 90) {
      severity = "warning";
      const headroom = budgeted - consumed;
      alertMessage = `BUDGET WARNING: Package "${b.description}" is near capacity at ${utilizationPercent.toFixed(1)}% (Committed + Actual). Only ₹${headroom.toLocaleString("en-IN")} headroom remaining.`;
    }

    return {
      id: b.id,
      costCode: b.costCode,
      description: b.description,
      category: b.category,
      budgeted,
      committed,
      actual,
      consumed,
      variance,
      utilizationPercent: Number(utilizationPercent.toFixed(1)),
      severity,
      alertMessage,
      isOverBudget: consumed > budgeted,
      isWarning: utilizationPercent >= 90 && consumed <= budgeted,
    };
  });

  const alerts = packageAnalyses.filter((p) => p.severity !== "normal");
  const overallVariance = totalBudget - totalConsumed;
  const overallUtilizationPercent = totalBudget > 0 ? (totalConsumed / totalBudget) * 100 : 0;
  const isOverallOverBudget = totalConsumed > totalBudget;
  const isOverallWarning = overallUtilizationPercent >= 90 && !isOverallOverBudget;

  // Auto-record notification if critical alerts exist and haven't been notified recently
  if (alerts.length > 0) {
    try {
      const me = await getCurrentUser();
      const criticalCount = alerts.filter((a) => a.severity === "critical").length;
      const warningCount = alerts.filter((a) => a.severity === "warning").length;

      // Check if we sent a budget variance alert in the last 2 hours to prevent spam
      const [recentNotification] = await db
        .select({ id: notificationsTable.id })
        .from(notificationsTable)
        .where(
          and(
            eq(notificationsTable.notificationType, "budget_variance_alert"),
            sql`created_at >= NOW() - INTERVAL 2 HOUR`
          )
        )
        .limit(1);

      if (!recentNotification) {
        await db.insert(notificationsTable).values({
          userId: project.createdById || me.id,
          notificationType: "budget_variance_alert",
          title: `Budget Variance Alert: ${project.name}`,
          message: `${criticalCount > 0 ? `🚨 ${criticalCount} package(s) OVER BUDGET.` : ""} ${warningCount > 0 ? `⚠️ ${warningCount} package(s) at ≥90% capacity.` : ""} Overall consumption: ${overallUtilizationPercent.toFixed(1)}%.`,
        });
      }
    } catch {
      // Non-fatal notification check
    }
  }

  res.json({
    projectId,
    projectName: project.name,
    overall: {
      totalBudget,
      totalCommitted,
      totalActual,
      totalConsumed,
      overallVariance,
      overallUtilizationPercent: Number(overallUtilizationPercent.toFixed(1)),
      isOverallOverBudget,
      isOverallWarning,
      healthStatus: isOverallOverBudget ? "breached" : isOverallWarning ? "warning" : "healthy",
    },
    packages: packageAnalyses,
    alerts,
    alertCount: alerts.length,
    criticalCount: alerts.filter((a) => a.severity === "critical").length,
    warningCount: alerts.filter((a) => a.severity === "warning").length,
  });
});

export default router;
