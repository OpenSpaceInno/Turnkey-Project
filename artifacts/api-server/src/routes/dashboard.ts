import { Router, type IRouter } from "express";
import { sql, eq, and, desc, asc, or } from "drizzle-orm";
import {
  db,
  projectsTable,
  projectAssignmentsTable,
  leadsTable,
  tasksTable,
  vendorsTable,
  budgetItemsTable,
  expensesTable,
  invoicesTable,
  purchaseOrdersTable,
  materialRequestsTable,
  procurementMaterialRequestsTable,
  materialsTable,
  leadActivitiesTable,
  notificationsTable,
  punchListItemsTable,
} from "@workspace/db";
import { num } from "../lib/transforms";
import { getCurrentUser } from "../lib/session";
import { canViewFinancials, canViewCommercial, PERMISSIONS } from "../lib/permissions";

const router: IRouter = Router();

const STAGES = [
  "lead_creation",
  "site_visit",
  "drawings",
  "boq",
  "negotiation",
  "finalization",
];

function computeDateRange(range: string = "all", customStart?: string, customEnd?: string) {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();

  const formatDate = (date: Date) => {
    const yr = date.getFullYear();
    const mo = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${yr}-${mo}-${day}`;
  };

  if (range === "this_month") {
    const start = new Date(y, m, 1);
    const end = new Date(y, m + 1, 0);
    return {
      range,
      startDate: formatDate(start),
      endDate: formatDate(end),
      label: `This Month (${start.toLocaleString("default", { month: "short" })} ${y})`,
    };
  }

  if (range === "last_30_days") {
    const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return {
      range,
      startDate: formatDate(start),
      endDate: formatDate(now),
      label: "Last 30 Days",
    };
  }

  if (range === "this_quarter") {
    const q = Math.floor(m / 3);
    const start = new Date(y, q * 3, 1);
    const end = new Date(y, (q + 1) * 3, 0);
    return {
      range,
      startDate: formatDate(start),
      endDate: formatDate(end),
      label: `Q${q + 1} ${y}`,
    };
  }

  if (range === "this_fy") {
    // Indian Financial Year: April 1 to March 31
    const fyStartYear = m >= 3 ? y : y - 1;
    const start = new Date(fyStartYear, 3, 1);
    const end = new Date(fyStartYear + 1, 2, 31);
    return {
      range,
      startDate: formatDate(start),
      endDate: formatDate(end),
      label: `FY ${fyStartYear}-${String(fyStartYear + 1).slice(2)}`,
    };
  }

  if (range === "this_year") {
    const start = new Date(y, 0, 1);
    const end = new Date(y, 11, 31);
    return {
      range,
      startDate: formatDate(start),
      endDate: formatDate(end),
      label: `Calendar Year ${y}`,
    };
  }

  if (range === "custom" && customStart && customEnd) {
    return {
      range: "custom",
      startDate: customStart,
      endDate: customEnd,
      label: `${customStart} to ${customEnd}`,
    };
  }

  return {
    range: "all",
    startDate: null,
    endDate: null,
    label: "All Time",
  };
}

async function getFinancialKPIs(dateRangeParam: string = "all", customStart?: string, customEnd?: string) {
  const computedRange = computeDateRange(dateRangeParam, customStart, customEnd);
  const { startDate, endDate } = computedRange;

  let expenseCondition = sql`1=1`;
  let invoiceCondition = sql`1=1`;
  let paidCondition = sql`1=1`;
  let overdueCondition = sql`status = 'overdue'`;

  if (startDate && endDate) {
    expenseCondition = sql`expense_date >= ${startDate} and expense_date <= ${endDate}`;
    invoiceCondition = sql`invoice_date >= ${startDate} and invoice_date <= ${endDate}`;
    paidCondition = sql`(
      (payment_date is not null and payment_date >= ${startDate} and payment_date <= ${endDate})
      or (payment_date is null and status in ('paid', 'closed', 'reconciled') and invoice_date >= ${startDate} and invoice_date <= ${endDate})
    )`;
    overdueCondition = sql`status = 'overdue' and due_date >= ${startDate} and due_date <= ${endDate}`;
  }

  const [budget] = await db
    .select({ total: sql<string>`coalesce(sum(budget),0)` })
    .from(projectsTable);

  const [periodBudget] = startDate && endDate
    ? await db
        .select({ total: sql<string>`coalesce(sum(budget),0)` })
        .from(projectsTable)
        .where(sql`(start_date is not null and start_date >= ${startDate} and start_date <= ${endDate}) or (start_date is null and created_at >= ${startDate} and created_at <= concat(${endDate}, ' 23:59:59'))`)
    : [budget];

  const [expense] = await db
    .select({ total: sql<string>`coalesce(sum(amount),0)` })
    .from(expensesTable)
    .where(expenseCondition);

  const [invoiced] = await db
    .select({ total: sql<string>`coalesce(sum(amount),0)` })
    .from(invoicesTable)
    .where(invoiceCondition);

  const [paid] = await db
    .select({
      total: sql<string>`coalesce(sum(case when total_paid_amount > 0 then total_paid_amount when status in ('paid', 'closed', 'reconciled') then amount else 0 end),0)`,
    })
    .from(invoicesTable)
    .where(paidCondition);

  const [overdue] = await db
    .select({
      c: sql<number>`count(*)`,
      total: sql<string>`coalesce(sum(amount), 0)`,
    })
    .from(invoicesTable)
    .where(overdueCondition);

  const totalInvoiced = num(invoiced?.total) ?? 0;
  const totalPaid = num(paid?.total) ?? 0;
  const totalExpenses = num(expense?.total) ?? 0;
  const totalBudget = num(budget?.total) ?? 0;
  const totalPeriodBudget = num(periodBudget?.total) ?? totalBudget;
  const overdueCount = overdue?.c ?? 0;
  const overdueAmount = num(overdue?.total) ?? 0;
  const netCashFlow = totalPaid - totalExpenses;
  const collectionRate = totalInvoiced > 0 ? Math.round((totalPaid / totalInvoiced) * 100) : 0;

  return {
    totalBudget,
    periodBudget: totalPeriodBudget,
    totalExpenses,
    totalInvoiced,
    totalPaid,
    overdueInvoices: overdueCount,
    overdueAmount,
    netCashFlow,
    collectionRate,
    appliedDateRange: computedRange,
  };
}

router.get("/dashboard/financials", async (req, res): Promise<void> => {
  try {
    const me = await getCurrentUser(req);
    const canSeeFinance = canViewFinancials(me);

    if (!canSeeFinance) {
      res.status(403).json({ error: "Access denied to financial metrics" });
      return;
    }

    const dateRangeParam = (req.query.dateRange as string) || "all";
    const customStart = req.query.startDate as string | undefined;
    const customEnd = req.query.endDate as string | undefined;

    const financials = await getFinancialKPIs(dateRangeParam, customStart, customEnd);
    res.json(financials);
  } catch (error: any) {
    console.error("Error fetching financial KPIs:", error);
    res.status(500).json({ error: "Failed to fetch financial metrics" });
  }
});

router.get("/dashboard/summary", async (req, res): Promise<void> => {
  const me = await getCurrentUser(req);
  const isAdmin = me.roles.includes("admin") || me.activeRole === "admin";
  const canSeeFinance = canViewFinancials(me);

  const dateRangeParam = (req.query.dateRange as string) || "all";
  const customStart = req.query.startDate as string | undefined;
  const customEnd = req.query.endDate as string | undefined;

  const [projectsCount] = await db
    .select({ c: sql<number>`count(*)` })
    .from(projectsTable);
  const [leadsCount] = await db
    .select({ c: sql<number>`count(*)` })
    .from(leadsTable);
  const [tasksCount] = await db
    .select({ c: sql<number>`count(*)` })
    .from(tasksTable);
  const [vendorsCount] = await db
    .select({ c: sql<number>`count(*)` })
    .from(vendorsTable);

  const projectsByStatus = await db
    .select({
      status: projectsTable.status,
      count: sql<number>`count(*)`,
    })
    .from(projectsTable)
    .groupBy(projectsTable.status);

  const tasksByStatus = await db
    .select({
      status: tasksTable.status,
      count: sql<number>`count(*)`,
    })
    .from(tasksTable)
    .groupBy(tasksTable.status);

  const financials = canSeeFinance
    ? await getFinancialKPIs(dateRangeParam, customStart, customEnd)
    : null;

  const [activePos] = await db
    .select({
      c: sql<number>`count(case when status in ('issued','acknowledged','in_transit') then 1 end)`,
    })
    .from(purchaseOrdersTable);
  const [pendingReqs] = await db
    .select({
      c: sql<number>`count(case when status = 'pending' then 1 end)`,
    })
    .from(materialRequestsTable);
  const [lowStock] = await db
    .select({
      c: sql<number>`count(case when quantity_on_hand < minimum_stock then 1 end)`,
    })
    .from(materialsTable);

  const leadFunnelRaw = await db
    .select({
      stage: leadsTable.stage,
      count: sql<number>`count(*)`,
      value: sql<string>`coalesce(sum(budget_estimate),0)`,
    })
    .from(leadsTable)
    .groupBy(leadsTable.stage);
  const stageMap = new Map(
    leadFunnelRaw.map((r) => [
      r.stage,
      { count: r.count, value: num(r.value) ?? 0 },
    ]),
  );
  const leadFunnel = STAGES.map((s) => ({
    stage: s,
    count: stageMap.get(s)?.count ?? 0,
    value: stageMap.get(s)?.value ?? 0,
  }));

  // ─────────────────────────────────────────────────────────────────────────
  // USER-CENTRIC "MY PROJECTS" & NEXT ACTIONS ENGINE
  // ─────────────────────────────────────────────────────────────────────────

  let myProjectsRaw;
  if (isAdmin) {
    myProjectsRaw = await db
      .select()
      .from(projectsTable)
      .orderBy(desc(projectsTable.updatedAt))
      .limit(8);
  } else {
    const assigned = await db
      .select({ projectId: projectAssignmentsTable.projectId })
      .from(projectAssignmentsTable)
      .where(eq(projectAssignmentsTable.userId, me.id));

    const assignedIds = new Set(assigned.map((a) => a.projectId));

    const all = await db
      .select()
      .from(projectsTable)
      .orderBy(desc(projectsTable.updatedAt));

    myProjectsRaw = all
      .filter(
        (p) =>
          assignedIds.has(p.id) ||
          p.createdById === me.id ||
          p.projectManagerId === me.id
      )
      .slice(0, 8);
  }

  // Derive quick next action for each project
  const myProjects = myProjectsRaw.map((p) => {
    let nextActionTitle = "Review Site Progress";
    let nextActionUrl = `/projects/${p.id}?tab=execution`;
    let nextActionPriority: "high" | "medium" | "normal" = "normal";

    if (!p.setupComplete) {
      nextActionTitle = "Complete Project Setup";
      nextActionUrl = `/projects/${p.id}?tab=overview`;
      nextActionPriority = "high";
    } else if (p.lifecycleStage === "procurement") {
      nextActionTitle = "Approve Material Requests";
      nextActionUrl = `/projects/${p.id}?tab=procurement`;
      nextActionPriority = "medium";
    } else if (p.lifecycleStage === "execution") {
      nextActionTitle = "Verify Site Work Measurements";
      nextActionUrl = `/projects/${p.id}?tab=execution`;
      nextActionPriority = "high";
    } else if (p.lifecycleStage === "billing") {
      nextActionTitle = "Process RA Bills";
      nextActionUrl = `/projects/${p.id}?tab=commercial`;
      nextActionPriority = "high";
    } else if (p.lifecycleStage === "quality") {
      nextActionTitle = "Inspect Punch List Snags";
      nextActionUrl = `/projects/${p.id}?tab=punchlist`;
      nextActionPriority = "medium";
    } else if (p.lifecycleStage === "handover") {
      nextActionTitle = "Final Handover & Signoff";
      nextActionUrl = `/projects/${p.id}?tab=overview`;
      nextActionPriority = "high";
    }

    const canSeeFinance = canViewFinancials(me);

    return {
      id: p.id,
      name: p.name,
      clientName: p.clientName,
      location: p.location,
      budget: canSeeFinance ? num(p.budget) : null,
      progress: p.progress,
      status: p.status,
      lifecycleStage: p.lifecycleStage || "setup",
      setupComplete: Boolean(p.setupComplete),
      nextAction: {
        title: nextActionTitle,
        actionUrl: nextActionUrl,
        priority: nextActionPriority,
      },
    };
  });


  // Global Next Actions for Current User (Strictly Role & Permission Driven)
  const nextActions = [];

  // Check 1: Incomplete setups (Only for PMs and Admins)
  if (isAdmin || me.activeRole === "project_manager") {
    const incompleteProjects = myProjects.filter((p) => !p.setupComplete);
    if (incompleteProjects.length > 0) {
      nextActions.push({
        id: "incomplete-setup",
        priority: "high",
        category: "Setup",
        title: `${incompleteProjects.length} Project(s) Pending Commercial Setup`,
        description: "Upload contracts, baseline budgets, or define milestones to begin site mobilization.",
        actionText: "Setup Project",
        actionUrl: `/projects/${incompleteProjects[0].id}?tab=overview`,
        projectName: incompleteProjects[0].name,
      });
    }
  }

  // Check 2: Pending material requests
  const pendingMRCount = await db
    .select({ c: sql<number>`count(*)` })
    .from(procurementMaterialRequestsTable)
    .where(
      or(
        eq(procurementMaterialRequestsTable.status, "draft"),
        eq(procurementMaterialRequestsTable.status, "pending_manager_approval")
      )
    );

  if (Number(pendingMRCount[0]?.c) > 0) {
    if (isAdmin || me.activeRole === "project_manager") {
      nextActions.push({
        id: "pending-mr-approval",
        priority: "high",
        category: "Procurement",
        title: `${pendingMRCount[0].c} Material Request(s) Awaiting PM Approval`,
        description: "Review site quantities and authorize requisitions for procurement sourcing.",
        actionText: "Review Approvals",
        actionUrl: "/procurement/manager-approvals",
      });
    } else if (me.activeRole === "procurement_officer") {
      nextActions.push({
        id: "pending-mr-sourcing",
        priority: "high",
        category: "Procurement",
        title: `${pendingMRCount[0].c} Material Requisitions in Sourcing Queue`,
        description: "Publish RFQs to trade vendors, compare quotations, and generate Purchase Orders.",
        actionText: "Process Sourcing",
        actionUrl: "/procurement/rfqs",
      });
    }
  }

  // Check 3: Overdue invoices (Strictly for Financial Roles)
  if (canSeeFinance && (financials?.overdueInvoices ?? 0) > 0) {
    nextActions.push({
      id: "overdue-invoices",
      priority: "medium",
      category: "Billing",
      title: `${financials?.overdueInvoices} Overdue Invoices Requiring Follow-up`,
      description: "Client payments are overdue past the contractual credit terms.",
      actionText: "View Finance",
      actionUrl: "/finance",
    });
  }

  // Project Health overview (Budget health hidden for non-financial roles)
  const punchListCounts = await db
    .select({
      projectId: punchListItemsTable.projectId,
      openCount: sql<number>`count(*)`,
    })
    .from(punchListItemsTable)
    .where(eq(punchListItemsTable.status, "open"))
    .groupBy(punchListItemsTable.projectId);

  const punchMap = new Map(punchListCounts.map((r) => [r.projectId, Number(r.openCount)]));

  // Check 4: Site Execution & Measurements (For Site Engineers)
  if (me.activeRole === "engineer" || me.activeRole === "site_engineer") {
    nextActions.push({
      id: "site-execution-log",
      priority: "high",
      category: "Site Execution",
      title: "Log Daily Site Progress (DPR)",
      description: "Submit today's labor, equipment usage, and physical work completed on site.",
      actionText: "Log DPR",
      actionUrl: "/site-execution?tab=daily-reports",
    });
    nextActions.push({
      id: "site-measurements-jmr",
      priority: "medium",
      category: "Measurements",
      title: "Record Joint Measurements (JMR)",
      description: "Record verified field measurements for contractor bills and milestones.",
      actionText: "Record JMR",
      actionUrl: "/ra-bills?tab=work-completions",
    });

    const totalOpenSnags = Array.from(punchMap.values()).reduce((a, b) => a + b, 0);
    if (totalOpenSnags > 0) {
      nextActions.push({
        id: "site-snags-clearance",
        priority: "high",
        category: "Quality & Safety",
        title: `${totalOpenSnags} Open Snag(s) Pending Resolution`,
        description: "Inspect reported defects and de-snag items on site with photographic proof.",
        actionText: "Inspect Snags",
        actionUrl: "/quality-safety?tab=snag-list",
      });
    }
  }

  const projectHealth = myProjectsRaw.slice(0, 5).map((p) => {
    const openSnags = punchMap.get(p.id) || 0;
    const isDelayed = p.endDate ? new Date(p.endDate) < new Date() && p.progress < 100 : false;

    return {
      projectId: p.id,
      projectName: p.name,
      lifecycleStage: p.lifecycleStage || "setup",
      progress: p.progress,
      scheduleStatus: isDelayed ? "delayed" : "on_track",
      budgetStatus: canSeeFinance ? "healthy" : undefined,
      qualityStatus: openSnags > 0 ? "attention_needed" : "clear",
      openSnagsCount: openSnags,
    };
  });

  res.json({
    user: {
      id: me.id,
      name: me.name,
      activeRole: me.activeRole,
      organizationId: me.organizationId,
      permissions: me.permissions,
    },
    totals: {
      projects: projectsCount?.c ?? 0,
      leads: (isAdmin || me.activeRole === "project_manager") ? (leadsCount?.c ?? 0) : undefined,
      tasks: tasksCount?.c ?? 0,
      vendors: (isAdmin || me.activeRole === "procurement_officer" || canSeeFinance) ? (vendorsCount?.c ?? 0) : undefined,
    },
    projectsByStatus,
    tasksByStatus,
    // Sensitive Financial Metrics: completely omitted / null if user lacks financial permission
    financials,
    procurement: (isAdmin || me.activeRole === "procurement_officer" || me.activeRole === "project_manager")
      ? {
          activePos: activePos?.c ?? 0,
          pendingRequests: pendingReqs?.c ?? 0,
          lowStockMaterials: lowStock?.c ?? 0,
        }
      : null,
    leadFunnel: (isAdmin || me.activeRole === "project_manager") ? leadFunnel : [],
    myProjects,
    nextActions,
    projectHealth,
  });
});

router.get("/dashboard/activity", async (_req, res): Promise<void> => {
  const acts = await db
    .select()
    .from(leadActivitiesTable)
    .orderBy(sql`created_at desc`)
    .limit(10);
  const notifs = await db
    .select()
    .from(notificationsTable)
    .orderBy(sql`created_at desc`)
    .limit(10);
  const items = [
    ...acts.map((a) => ({
      id: a.id,
      type: `lead_${a.activityType}`,
      title: a.title,
      description: a.description ?? "",
      createdAt: a.createdAt.toISOString(),
    })),
    ...notifs.map((n) => ({
      id: n.id + 100000,
      type: n.notificationType,
      title: n.title,
      description: n.message ?? "",
      createdAt: n.createdAt.toISOString(),
    })),
  ]
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, 15);
  res.json(items);
});

export default router;
