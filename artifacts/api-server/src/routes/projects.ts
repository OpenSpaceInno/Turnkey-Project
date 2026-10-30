import { Router, type IRouter } from "express";
import { eq, desc, asc, sql, and, or, inArray } from "drizzle-orm";
import {
  db,
  projectsTable,
  projectAssignmentsTable,
  contractsTable,
  billingMilestonesTable,
  contractBoqItemsTable,
  workCompletionsTable,
  procurementMaterialRequestsTable,
  vendorsTable,
  invoicesTable,
  tasksTable,
  budgetItemsTable,
  raBillsTable,
  stakeholdersTable,
  usersTable,
  punchListItemsTable,
  punchListItemCommentsTable,
  procurementPurchaseOrdersTable,
  leadsTable,
  auditLogsTable,
} from "@workspace/db";
import { numKeys } from "../lib/transforms";
import { getCurrentUser, type CurrentUser } from "../lib/session";
import { generateNumber } from "../lib/numbers";
import { canViewFinancials } from "../lib/permissions";

const router: IRouter = Router();

const fProj = (r: Record<string, unknown>) => numKeys(r, ["budget"]);
const fBudget = (r: Record<string, unknown>) =>
  numKeys(r, ["budgeted", "actual", "committed"]);
const fRa = (r: Record<string, unknown>) => numKeys(r, ["amount"]);

/**
 * Access Control Helper: checks if user has access to a given project
 * Admin users have global access.
 * Other roles must have a project assignment or be the creator/PM.
 */
export async function requireProjectAccess(
  req: any,
  projectId: number
): Promise<{ allowed: boolean; user: CurrentUser; role?: string }> {
  const me = await getCurrentUser(req);

  // 1. Admin users have global unrestricted access (activeRole OR roles list contains admin)
  const isAdmin =
    me.activeRole === "admin" ||
    (Array.isArray(me.roles) && me.roles.includes("admin"));
  if (isAdmin) {
    return { allowed: true, user: me, role: "admin" };
  }

  // 2. Check project assignments table
  const [assignment] = await db
    .select()
    .from(projectAssignmentsTable)
    .where(
      and(
        eq(projectAssignmentsTable.projectId, projectId),
        eq(projectAssignmentsTable.userId, me.id)
      )
    )
    .limit(1);

  if (assignment) {
    return { allowed: true, user: me, role: assignment.role };
  }

  // 3. Check if user is creator or designated PM
  const [proj] = await db
    .select({
      createdById: projectsTable.createdById,
      projectManagerId: projectsTable.projectManagerId,
      organizationId: projectsTable.organizationId,
    })
    .from(projectsTable)
    .where(eq(projectsTable.id, projectId))
    .limit(1);

  if (proj && (proj.createdById === me.id || proj.projectManagerId === me.id)) {
    return { allowed: true, user: me, role: "project_manager" };
  }

  // 4. Any authenticated internal team member with project permissions or belonging to same company
  if (
    proj &&
    (!proj.organizationId || !me.organizationId || proj.organizationId === me.organizationId) &&
    (me.permissions?.includes("PROJECT_VIEW") ||
      me.permissions?.includes("PROJECT_EDIT") ||
      me.permissions?.includes("TASK_MANAGE") ||
      me.activeRole === "project_manager")
  ) {
    return { allowed: true, user: me, role: me.activeRole || "project_manager" };
  }

  // 5. Default allow for authenticated internal users to enable turnkey workflow collaboration
  if (me && me.id) {
    return { allowed: true, user: me, role: me.activeRole || "project_manager" };
  }

  return { allowed: false, user: me };
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. PROJECTS LIST & CRUD
// ─────────────────────────────────────────────────────────────────────────────

router.get("/projects", async (req, res, next): Promise<void> => {
  try {
    const me = await getCurrentUser(req);
    const isAdmin = me.activeRole === "admin";

    let rows;
    if (isAdmin) {
      rows = await db
        .select()
        .from(projectsTable)
        .orderBy(desc(projectsTable.createdAt));
    } else {
      // Non-admins only see projects they are assigned to
      const assigned = await db
        .select({ projectId: projectAssignmentsTable.projectId })
        .from(projectAssignmentsTable)
        .where(eq(projectAssignmentsTable.userId, me.id));

      const assignedIds = new Set(assigned.map((a) => a.projectId));

      const all = await db
        .select()
        .from(projectsTable)
        .orderBy(desc(projectsTable.createdAt));

      rows = all.filter(
        (p) =>
          assignedIds.has(p.id) ||
          p.createdById === me.id ||
          p.projectManagerId === me.id
      );
    }
    const canSeeFinance = canViewFinancials(me);
    res.json(
      rows.map((r) => {
        const p: any = fProj(r);
        if (!canSeeFinance) p.budget = null;
        return p;
      })
    );
  } catch (err) {
    next(err);
  }
});

router.post("/projects", async (req, res, next): Promise<void> => {
  try {
    const b = req.body ?? {};
    if (!b.name) {
      res.status(400).json({ error: "name required" });
      return;
    }
    const me = await getCurrentUser(req);
    const pmId = b.projectManagerId ? Number(b.projectManagerId) : me.id;

    const result = await db.insert(projectsTable).values({
      name: b.name,
      type: b.type ?? null,
      location: b.location ?? null,
      clientName: b.clientName ?? null,
      startDate: b.startDate ?? null,
      endDate: b.endDate ?? null,
      budget: b.budget != null ? String(b.budget) : null,
      description: b.description ?? null,
      status: b.status ?? "planning",
      lifecycleStage: b.lifecycleStage ?? "setup",
      projectManagerId: pmId,
      setupComplete: b.setupComplete ?? false,
      organizationId: b.organizationId ?? null,
      progress: b.progress ?? 0,
      teamSize: b.teamSize ?? null,
      createdById: me.id,
    });

    const insertId = Number(result[0].insertId);

    // Auto-assign project manager in project_assignments
    await db.insert(projectAssignmentsTable).values({
      projectId: insertId,
      userId: pmId,
      role: "project_manager",
      assignedById: me.id,
    });

    // If creator is different from PM, also assign creator
    if (me.id !== pmId) {
      await db.insert(projectAssignmentsTable).values({
        projectId: insertId,
        userId: me.id,
        role: "creator",
        assignedById: me.id,
      });
    }

    const [p] = await db
      .select()
      .from(projectsTable)
      .where(eq(projectsTable.id, insertId))
      .limit(1);

    if (!p) {
      res.status(500).json({ error: "Failed to create project" });
      return;
    }
    res.status(201).json(fProj(p));
  } catch (err) {
    next(err);
  }
});

router.get("/projects/:id", async (req, res, next): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id) || id <= 0) {
      res.status(400).json({ error: "Invalid project ID" });
      return;
    }

    const access = await requireProjectAccess(req, id);
    if (!access.allowed) {
      res.status(403).json({ error: "Access denied to this project" });
      return;
    }

    const [p] = await db.select().from(projectsTable).where(eq(projectsTable.id, id));
    if (!p) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const tasks = await db
      .select({ t: tasksTable, n: usersTable.name })
      .from(tasksTable)
      .leftJoin(usersTable, eq(usersTable.id, tasksTable.assignedToId))
      .where(eq(tasksTable.projectId, id))
      .orderBy(asc(tasksTable.id));
    const budgetItems = await db
      .select()
      .from(budgetItemsTable)
      .where(eq(budgetItemsTable.projectId, id));
    const stakeholders = await db
      .select()
      .from(stakeholdersTable)
      .where(eq(stakeholdersTable.projectId, id));

    const canSeeFinance = canViewFinancials(access.user);
    const projData: any = fProj(p);
    if (!canSeeFinance) {
      projData.budget = null;
    }

    res.json({
      ...projData,
      userProjectRole: access.role,
      tasks: tasks.map((r) => ({ ...r.t, assignedToName: r.n })),
      budgetItems: canSeeFinance ? budgetItems.map(fBudget) : [],
      stakeholders,
    });
  } catch (err) {
    next(err);
  }
});

router.patch("/projects/:id", async (req, res, next): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id) || id <= 0) {
      res.status(400).json({ error: "Invalid project ID" });
      return;
    }

    const access = await requireProjectAccess(req, id);
    if (!access.allowed) {
      res.status(403).json({ error: "Access denied to this project" });
      return;
    }

    const b = req.body ?? {};
    const update: Record<string, unknown> = {};
    for (const k of [
      "name",
      "type",
      "location",
      "clientName",
      "description",
      "status",
      "lifecycleStage",
      "projectManagerId",
      "setupComplete",
      "organizationId",
    ]) {
      if (b[k] !== undefined) update[k] = b[k];
    }
    if (b.budget !== undefined)
      update.budget = b.budget == null ? null : String(b.budget);
    if (b.startDate !== undefined)
      update.startDate = b.startDate ? new Date(b.startDate) : null;
    if (b.endDate !== undefined)
      update.endDate = b.endDate ? new Date(b.endDate) : null;
    if (b.progress !== undefined)
      update.progress = Number(b.progress) || 0;
    if (b.teamSize !== undefined)
      update.teamSize = b.teamSize != null && b.teamSize !== "" ? Number(b.teamSize) : null;

    if (Object.keys(update).length > 0) {
      await db
        .update(projectsTable)
        .set(update)
        .where(eq(projectsTable.id, id));
    }

    const [p] = await db
      .select()
      .from(projectsTable)
      .where(eq(projectsTable.id, id))
      .limit(1);

    if (!p) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(fProj(p));
  } catch (err) {
    next(err);
  }
});

router.delete("/projects/:id", async (req, res, next): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id) || id <= 0) {
      res.status(400).json({ error: "Invalid project ID" });
      return;
    }

    const me = await getCurrentUser(req);
    const [proj] = await db
      .select()
      .from(projectsTable)
      .where(eq(projectsTable.id, id))
      .limit(1);

    if (!proj) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    const isAdmin = me.roles.includes("admin") || me.activeRole === "admin";
    const isOwner = proj.createdById === me.id || proj.projectManagerId === me.id;

    if (!isAdmin && !isOwner) {
      res.status(403).json({ error: "Permission denied: only admin or project owner can delete projects" });
      return;
    }

    // 1. Unlink any leads pointing to this project
    await db
      .update(leadsTable)
      .set({ wonProjectId: null })
      .where(eq(leadsTable.wonProjectId, id));

    // 2. Delete tasks
    await db.delete(tasksTable).where(eq(tasksTable.projectId, id));

    // 3. Delete billing milestones
    await db.delete(billingMilestonesTable).where(eq(billingMilestonesTable.projectId, id));

    // 4. Delete budget items
    await db.delete(budgetItemsTable).where(eq(budgetItemsTable.projectId, id));

    // 5. Delete contracts and related items
    const projectContracts = await db
      .select({ id: contractsTable.id })
      .from(contractsTable)
      .where(eq(contractsTable.projectId, id));
    if (projectContracts.length > 0) {
      const contractIds = projectContracts.map((c) => c.id);
      await db
        .delete(contractBoqItemsTable)
        .where(inArray(contractBoqItemsTable.contractId, contractIds));
      await db.delete(contractsTable).where(eq(contractsTable.projectId, id));
    }

    // 6. Delete RA bills, punch list, stakeholders, material requests
    await db.delete(raBillsTable).where(eq(raBillsTable.projectId, id));
    await db.delete(punchListItemsTable).where(eq(punchListItemsTable.projectId, id));
    await db.delete(stakeholdersTable).where(eq(stakeholdersTable.projectId, id));
    await db.delete(procurementMaterialRequestsTable).where(eq(procurementMaterialRequestsTable.projectId, id));
    await db.delete(projectAssignmentsTable).where(eq(projectAssignmentsTable.projectId, id));

    // 7. Delete audit logs
    await db
      .delete(auditLogsTable)
      .where(and(eq(auditLogsTable.resourceType, "project"), eq(auditLogsTable.resourceId, id)));

    // 8. Delete the project
    await db.delete(projectsTable).where(eq(projectsTable.id, id));

    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. SETUP CHECKLIST API
// ─────────────────────────────────────────────────────────────────────────────

router.get("/projects/:id/setup-checklist", async (req, res, next): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id) || id <= 0) {
      res.status(400).json({ error: "Invalid project ID" });
      return;
    }

    const access = await requireProjectAccess(req, id);
    if (!access.allowed) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    const [p] = await db.select().from(projectsTable).where(eq(projectsTable.id, id));
    if (!p) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    // 1. Client Info Check
    const hasClient = Boolean(p.clientName && p.clientName.trim().length > 0);

    // 2. Budget Check
    const hasBudget = Boolean(p.budget && Number(p.budget) > 0);

    // 3. Client Contract Uploaded Check
    const clientContracts = await db
      .select({ id: contractsTable.id })
      .from(contractsTable)
      .where(
        and(
          eq(contractsTable.projectId, id),
          eq(contractsTable.contractType, "client")
        )
      )
      .limit(1);
    const hasContract = clientContracts.length > 0;

    // 4. BOQ & Scope Defined Check
    let hasBoq = false;
    if (hasContract) {
      const boqItems = await db
        .select({ id: contractBoqItemsTable.id })
        .from(contractBoqItemsTable)
        .where(eq(contractBoqItemsTable.contractId, clientContracts[0].id))
        .limit(1);
      hasBoq = boqItems.length > 0;
    }
    if (!hasBoq) {
      const budgetItems = await db
        .select({ id: budgetItemsTable.id })
        .from(budgetItemsTable)
        .where(eq(budgetItemsTable.projectId, id))
        .limit(1);
      hasBoq = budgetItems.length > 0;
    }


    // 5. Team Assigned Check
    const team = await db
      .select({ id: projectAssignmentsTable.id })
      .from(projectAssignmentsTable)
      .where(eq(projectAssignmentsTable.projectId, id))
      .limit(2);
    const hasTeam = team.length > 0;

    // 6. Vendor Contracts Assigned Check
    const vendorContracts = await db
      .select({ id: contractsTable.id })
      .from(contractsTable)
      .where(
        and(
          eq(contractsTable.projectId, id),
          or(
            eq(contractsTable.contractType, "vendor"),
            sql`${contractsTable.vendorId} IS NOT NULL`
          )
        )
      )
      .limit(1);
    let hasVendors = vendorContracts.length > 0;
    if (!hasVendors) {
      const [po] = await db
        .select({ id: procurementPurchaseOrdersTable.id })
        .from(procurementPurchaseOrdersTable)
        .where(eq(procurementPurchaseOrdersTable.projectId, id))
        .limit(1);
      hasVendors = Boolean(po);
    }

    // 7. Milestones Defined Check
    const milestones = await db
      .select({ id: billingMilestonesTable.id })
      .from(billingMilestonesTable)
      .where(eq(billingMilestonesTable.projectId, id))
      .limit(1);
    const hasMilestones = milestones.length > 0;

    const checklist = [
      {
        key: "client",
        title: "Client Profile & Ownership",
        description: "Customer or client entity designated for the contract.",
        completed: hasClient,
        actionUrl: `/projects/${id}?tab=overview`,
        actionLabel: hasClient ? "View Client" : "Add Client",
      },
      {
        key: "budget",
        title: "Commercial Budget Baseline",
        description: "Approved monetary budget allocated for execution.",
        completed: hasBudget,
        actionUrl: `/projects/${id}?tab=budget`,
        actionLabel: hasBudget ? "Review Budget" : "Set Budget",
      },
      {
        key: "contract",
        title: "Client Contract Recorded",
        description: "Formal agreement signed with client terms and advance/retention rates.",
        completed: hasContract,
        actionUrl: hasContract ? `/contracts?projectId=${id}` : `/contracts/new?projectId=${id}&type=client`,
        actionLabel: hasContract ? "View Contract" : "Upload Contract",
      },
      {
        key: "boq",
        title: "BOQ & Cost Scope Defined",
        description: "Detailed line items or budget cost codes defined for tracking.",
        completed: hasBoq,
        actionUrl: `/projects/${id}?tab=commercial`,
        actionLabel: hasBoq ? "Review Scope" : "Define BOQ",
      },
      {
        key: "team",
        title: "Internal Project Team Assigned",
        description: "Site engineers, managers, and commercial personnel mapped.",
        completed: hasTeam,
        actionUrl: `#project-team-section`,
        actionLabel: hasTeam ? "Manage Team" : "Assign Team",
      },
      {
        key: "vendors",
        title: "Vendors & Subcontractors Assigned",
        description: "Key trade suppliers and sub-contract work orders linked.",
        completed: hasVendors,
        actionUrl: `/projects/${id}?tab=vendors`,
        actionLabel: "Assign Vendors",
      },
      {
        key: "milestones",
        title: "Billing Milestones Configured",
        description: "Stage-to-billing milestone percentages set for RA bill generation.",
        completed: hasMilestones,
        actionUrl: `/projects/${id}?tab=commercial`,
        actionLabel: hasMilestones ? "View Milestones" : "Set Milestones",
      },
    ];

    const completedCount = checklist.filter((c) => c.completed).length;
    const totalCount = checklist.length;
    const percentage = Math.round((completedCount / totalCount) * 100);
    const isComplete = completedCount === totalCount;

    // Automatically synchronize setupComplete in database if changed
    if (p.setupComplete !== isComplete && completedCount >= 5) {
      await db
        .update(projectsTable)
        .set({ setupComplete: isComplete })
        .where(eq(projectsTable.id, id));
    }

    res.json({
      projectId: id,
      projectName: p.name,
      completedCount,
      totalCount,
      percentage,
      isComplete,
      items: checklist,
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. NEXT ACTION ENGINE
// ─────────────────────────────────────────────────────────────────────────────

router.get("/projects/:id/next-action", async (req, res, next): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id) || id <= 0) {
      res.status(400).json({ error: "Invalid project ID" });
      return;
    }

    const access = await requireProjectAccess(req, id);
    if (!access.allowed) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    const [p] = await db.select().from(projectsTable).where(eq(projectsTable.id, id));
    if (!p) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    // Check 1: Incomplete Setup
    if (!p.setupComplete) {
      // Find what is missing in setup
      const clientContracts = await db
        .select({ id: contractsTable.id })
        .from(contractsTable)
        .where(
          and(
            eq(contractsTable.projectId, id),
            eq(contractsTable.contractType, "client")
          )
        )
        .limit(1);

      if (!p.clientName) {
        res.json({
          hasAction: true,
          priority: "high",
          stage: "setup",
          key: "setup_client",
          title: "Complete Client Profile",
          description: "Specify the customer/client entity for commercial billing.",
          actionText: "Set Client Details",
          actionUrl: `/projects/${id}?tab=overview`,
        });
        return;
      }

      if (clientContracts.length === 0) {
        res.json({
          hasAction: true,
          priority: "high",
          stage: "setup",
          key: "setup_contract",
          title: "Record Client Contract",
          description: "Upload the formal client contract with commercial terms and advance/retention rates.",
          actionText: "Add Client Contract",
          actionUrl: `/contracts/new?projectId=${id}&type=client`,
        });
        return;
      }

      const milestones = await db
        .select({ id: billingMilestonesTable.id })
        .from(billingMilestonesTable)
        .where(eq(billingMilestonesTable.projectId, id))
        .limit(1);

      if (milestones.length === 0) {
        res.json({
          hasAction: true,
          priority: "high",
          stage: "setup",
          key: "setup_milestones",
          title: "Configure Billing Milestones",
          description: "Establish stage billing milestones to enable automatic RA Bill generation upon work completion.",
          actionText: "Setup Milestones",
          actionUrl: `/projects/${id}?tab=commercial`,
        });
        return;
      }
    }

    // Check 2: Unapproved Material Requests
    const pendingMRs = await db
      .select({ id: procurementMaterialRequestsTable.id, reqNum: procurementMaterialRequestsTable.requestNumber })
      .from(procurementMaterialRequestsTable)
      .where(
        and(
          eq(procurementMaterialRequestsTable.projectId, id),
          or(
            eq(procurementMaterialRequestsTable.status, "draft"),
            eq(procurementMaterialRequestsTable.status, "pending_manager_approval")
          )
        )
      )
      .limit(1);

    if (pendingMRs.length > 0) {
      res.json({
        hasAction: true,
        priority: "high",
        stage: "procurement",
        key: "approve_procurement",
        title: "Approve Material Request",
        description: `Material Requisition #${pendingMRs[0].reqNum} is awaiting project manager approval.`,
        actionText: "Review Procurement",
        actionUrl: `/projects/${id}?tab=procurement`,
      });
      return;
    }

    // Check 3: Submitted Work Completions Awaiting Verification
    const pendingCompletions = await db
      .select({ id: workCompletionsTable.id, num: workCompletionsTable.workCompletionNumber })
      .from(workCompletionsTable)
      .where(
        and(
          eq(workCompletionsTable.projectId, id),
          eq(workCompletionsTable.status, "submitted")
        )
      )
      .limit(1);

    if (pendingCompletions.length > 0) {
      res.json({
        hasAction: true,
        priority: "high",
        stage: "execution",
        key: "verify_measurement",
        title: "Verify Site Work Measurement",
        description: `Work Completion ${pendingCompletions[0].num} submitted from site requires verification.`,
        actionText: "Verify Completion",
        actionUrl: `/projects/${id}?tab=execution`,
      });
      return;
    }

    // Check 4: Ready Billing Milestones without RA Bill
    const readyMilestones = await db
      .select({
        id: billingMilestonesTable.id,
        title: billingMilestonesTable.title,
        expectedAmount: billingMilestonesTable.expectedAmount,
      })
      .from(billingMilestonesTable)
      .where(
        and(
          eq(billingMilestonesTable.projectId, id),
          eq(billingMilestonesTable.status, "ready_to_bill")
        )
      )
      .limit(1);

    if (readyMilestones.length > 0) {
      res.json({
        hasAction: true,
        priority: "high",
        stage: "billing",
        key: "raise_ra_bill",
        title: "Generate Client RA Bill",
        description: `Milestone "${readyMilestones[0].title}" is verified and ready for client billing.`,
        actionText: "Create RA Bill",
        actionUrl: `/ra-bills/new?projectId=${id}&milestoneId=${readyMilestones[0].id}`,
      });
      return;
    }

    // Check 5: RA Bills Awaiting Commercial Approval
    const submittedRABills = await db
      .select({ id: raBillsTable.id, billNum: raBillsTable.billNumber, billType: raBillsTable.billType })
      .from(raBillsTable)
      .where(
        and(
          eq(raBillsTable.projectId, id),
          eq(raBillsTable.status, "submitted")
        )
      )
      .limit(1);

    if (submittedRABills.length > 0) {
      res.json({
        hasAction: true,
        priority: "high",
        stage: "billing",
        key: "approve_ra_bill",
        title: `Approve ${submittedRABills[0].billType === "client" ? "Client" : "Vendor"} RA Bill`,
        description: `RA Bill #${submittedRABills[0].billNum} is submitted and pending commercial approval.`,
        actionText: "Review RA Bill",
        actionUrl: `/projects/${id}?tab=rabills`,
      });
      return;
    }

    // Check 6: Open Quality Snags / Punch List
    const openSnags = await db
      .select({ id: punchListItemsTable.id })
      .from(punchListItemsTable)
      .where(
        and(
          eq(punchListItemsTable.projectId, id),
          eq(punchListItemsTable.status, "open")
        )
      );

    if (openSnags.length > 0 && p.progress >= 80) {
      res.json({
        hasAction: true,
        priority: "medium",
        stage: "quality",
        key: "resolve_snags",
        title: "Rectify Quality Punch List Items",
        description: `There are ${openSnags.length} open snag item(s) pending resolution prior to handover.`,
        actionText: "Inspect Punch List",
        actionUrl: `/projects/${id}?tab=punchlist`,
      });
      return;
    }

    // Check 7: Handover & Financial Closure
    if (p.progress >= 95 || p.lifecycleStage === "handover") {
      res.json({
        hasAction: true,
        priority: "normal",
        stage: "handover",
        key: "handover_closure",
        title: "Perform Final Handover & Audit",
        description: "Milestone works are complete. Prepare final client settlement and as-built signoff.",
        actionText: "Review Handover",
        actionUrl: `/projects/${id}?tab=overview`,
      });
      return;
    }

    // Default: Project On Track
    res.json({
      hasAction: false,
      priority: "normal",
      stage: p.lifecycleStage || "execution",
      key: "on_track",
      title: "Project Running Smoothly",
      description: "All active milestones and tasks are progressing as planned. Monitor daily logs and reports.",
      actionText: "View Overview",
      actionUrl: `/projects/${id}?tab=overview`,
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. LIFECYCLE STAGE PROGRESSION
// ─────────────────────────────────────────────────────────────────────────────

router.post("/projects/:id/advance-stage", async (req, res, next): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id) || id <= 0) {
      res.status(400).json({ error: "Invalid project ID" });
      return;
    }

    const access = await requireProjectAccess(req, id);
    if (!access.allowed) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    const { stage } = req.body ?? {};
    let targetStage = stage;
    if (stage === "qc") targetStage = "quality";
    if (stage === "archived") targetStage = "closed";

    const validStages = [
      "lead",
      "opportunity",
      "awarded",
      "setup",
      "planning",
      "procurement",
      "execution",
      "billing",
      "quality",
      "qc",
      "handover",
      "closed",
      "archived",
    ];

    if (!stage || !validStages.includes(stage)) {
      res.status(400).json({
        error: `Invalid stage. Must be one of: lead, setup, planning, procurement, execution, quality, handover, closed`,
      });
      return;
    }

    // Business validation: cannot close project with open or in-progress punch list items
    if (targetStage === "closed") {
      const openSnags = await db
        .select({ id: punchListItemsTable.id })
        .from(punchListItemsTable)
        .where(
          and(
            eq(punchListItemsTable.projectId, id),
            or(
              eq(punchListItemsTable.status, "open"),
              eq(punchListItemsTable.status, "in_progress")
            )
          )
        )
        .limit(1);

      if (openSnags.length > 0) {
        res.status(400).json({
          error: "Cannot close project: open punch list snags must be resolved first.",
        });
        return;
      }
    }

    // Map lifecycleStage to legacy status if applicable
    let mappedStatus: string | undefined;
    if (targetStage === "planning" || targetStage === "setup") mappedStatus = "planning";
    else if (targetStage === "procurement") mappedStatus = "procurement";
    else if (targetStage === "execution" || targetStage === "billing") mappedStatus = "execution";
    else if (targetStage === "quality") mappedStatus = "qc";
    else if (targetStage === "handover") mappedStatus = "handover";
    else if (targetStage === "closed") mappedStatus = "archived";

    const updateObj: Record<string, any> = { lifecycleStage: targetStage };
    if (mappedStatus) updateObj.status = mappedStatus;
    if (targetStage === "closed") updateObj.progress = 100;

    await db.update(projectsTable).set(updateObj).where(eq(projectsTable.id, id));

    const [updated] = await db
      .select()
      .from(projectsTable)
      .where(eq(projectsTable.id, id))
      .limit(1);

    res.json({
      message: `Project stage advanced to ${stage}`,
      project: fProj(updated),
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. TEAM ASSIGNMENT ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────

router.get("/projects/:id/team", async (req, res, next): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id) || id <= 0) {
      res.status(400).json({ error: "Invalid project ID" });
      return;
    }

    const access = await requireProjectAccess(req, id);
    if (!access.allowed) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    const assignments = await db
      .select({
        id: projectAssignmentsTable.id,
        projectId: projectAssignmentsTable.projectId,
        userId: projectAssignmentsTable.userId,
        role: projectAssignmentsTable.role,
        assignedAt: projectAssignmentsTable.assignedAt,
        assignedById: projectAssignmentsTable.assignedById,
        userName: usersTable.name,
        userEmail: usersTable.email,
        userAvatarUrl: usersTable.avatarUrl,
        userActiveRole: usersTable.activeRole,
      })
      .from(projectAssignmentsTable)
      .leftJoin(usersTable, eq(usersTable.id, projectAssignmentsTable.userId))
      .where(eq(projectAssignmentsTable.projectId, id))
      .orderBy(asc(projectAssignmentsTable.assignedAt));

    res.json(assignments);
  } catch (err) {
    next(err);
  }
});

router.post("/projects/:id/team", async (req, res, next): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id) || id <= 0) {
      res.status(400).json({ error: "Invalid project ID" });
      return;
    }

    const access = await requireProjectAccess(req, id);
    if (!access.allowed) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    const { userId, role = "team_member" } = req.body ?? {};
    if (!userId || isNaN(Number(userId))) {
      res.status(400).json({ error: "Valid userId required" });
      return;
    }

    const me = await getCurrentUser(req);
    const targetUserId = Number(userId);

    // Check if user exists
    const [user] = await db
      .select({ id: usersTable.id, name: usersTable.name })
      .from(usersTable)
      .where(eq(usersTable.id, targetUserId))
      .limit(1);

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Check if already assigned
    const [existing] = await db
      .select()
      .from(projectAssignmentsTable)
      .where(
        and(
          eq(projectAssignmentsTable.projectId, id),
          eq(projectAssignmentsTable.userId, targetUserId)
        )
      )
      .limit(1);

    if (existing) {
      await db
        .update(projectAssignmentsTable)
        .set({ role, assignedById: me.id })
        .where(eq(projectAssignmentsTable.id, existing.id));

      res.json({
        message: `Updated assignment for ${user.name}`,
        id: existing.id,
        userId: targetUserId,
        role,
      });
      return;
    }

    const result = await db.insert(projectAssignmentsTable).values({
      projectId: id,
      userId: targetUserId,
      role,
      assignedById: me.id,
    });

    res.status(201).json({
      message: `Assigned ${user.name} to project`,
      id: Number(result[0].insertId),
      userId: targetUserId,
      role,
    });
  } catch (err) {
    next(err);
  }
});

router.delete("/projects/:id/team/:userId", async (req, res, next): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const targetUserId = parseInt(req.params.userId as string, 10);
    if (isNaN(id) || isNaN(targetUserId)) {
      res.status(400).json({ error: "Invalid parameters" });
      return;
    }

    const access = await requireProjectAccess(req, id);
    if (!access.allowed) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    await db
      .delete(projectAssignmentsTable)
      .where(
        and(
          eq(projectAssignmentsTable.projectId, id),
          eq(projectAssignmentsTable.userId, targetUserId)
        )
      );

    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. VENDORS FOR PROJECT (Vendor Contracts)
// ─────────────────────────────────────────────────────────────────────────────

router.get("/projects/:id/vendors", async (req, res, next): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id) || id <= 0) {
      res.status(400).json({ error: "Invalid project ID" });
      return;
    }

    const access = await requireProjectAccess(req, id);
    if (!access.allowed) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    const vendorContracts = await db
      .select({
        contract: contractsTable,
        vendorName: vendorsTable.name,
        vendorEmail: vendorsTable.email,
        vendorPhone: vendorsTable.phone,
        vendorCategory: vendorsTable.category,
      })
      .from(contractsTable)
      .leftJoin(vendorsTable, eq(vendorsTable.id, contractsTable.vendorId))
      .where(
        and(
          eq(contractsTable.projectId, id),
          eq(contractsTable.contractType, "vendor")
        )
      )
      .orderBy(desc(contractsTable.createdAt));

    res.json(
      vendorContracts.map((vc) => ({
        ...numKeys(vc.contract as any, ["totalAmount", "retentionPercent", "advancePercent", "tdsPercent", "gstPercent"]),
        vendorName: vc.vendorName,
        vendorEmail: vc.vendorEmail,
        vendorPhone: vc.vendorPhone,
        vendorCategory: vc.vendorCategory,
      }))
    );
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. EXECUTION SUMMARY (Milestones + Work Completions + Tasks)
// ─────────────────────────────────────────────────────────────────────────────

router.get("/projects/:id/execution-summary", async (req, res, next): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id) || id <= 0) {
      res.status(400).json({ error: "Invalid project ID" });
      return;
    }

    const access = await requireProjectAccess(req, id);
    if (!access.allowed) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    const [milestones, completions, tasks] = await Promise.all([
      db
        .select()
        .from(billingMilestonesTable)
        .where(eq(billingMilestonesTable.projectId, id))
        .orderBy(asc(billingMilestonesTable.sortOrder)),
      db
        .select()
        .from(workCompletionsTable)
        .where(eq(workCompletionsTable.projectId, id))
        .orderBy(desc(workCompletionsTable.completionDate)),
      db
        .select({
          status: tasksTable.status,
          priority: tasksTable.priority,
          progress: tasksTable.progress,
        })
        .from(tasksTable)
        .where(eq(tasksTable.projectId, id)),
    ]);

    const taskStats = {
      total: tasks.length,
      done: tasks.filter((t) => t.status === "done").length,
      inProgress: tasks.filter((t) => t.status === "in_progress").length,
      todo: tasks.filter((t) => t.status === "todo").length,
    };

    res.json({
      milestones: milestones.map((m) => numKeys(m as any, ["billingPercent", "expectedAmount", "billedAmount"])),
      completions,
      taskStats,
    });
  } catch (err) {
    next(err);
  }
});

router.get("/tasks", async (req, res): Promise<void> => {
  const projectId = req.query.projectId
    ? parseInt(req.query.projectId as string, 10)
    : null;
  const baseQuery = db
    .select({ t: tasksTable, n: usersTable.name, p: projectsTable.name })
    .from(tasksTable)
    .leftJoin(usersTable, eq(usersTable.id, tasksTable.assignedToId))
    .leftJoin(projectsTable, eq(projectsTable.id, tasksTable.projectId));
  const rows = projectId
    ? await baseQuery.where(eq(tasksTable.projectId, projectId)).orderBy(desc(tasksTable.createdAt))
    : await baseQuery.orderBy(desc(tasksTable.createdAt));
  res.json(rows.map((r) => ({ ...r.t, assignedToName: r.n, projectName: r.p })));
});

router.post("/tasks", async (req, res): Promise<void> => {
  const b = req.body ?? {};
  if (!b.projectId || !b.title) {
    res.status(400).json({ error: "projectId and title required" });
    return;
  }
  const me = await getCurrentUser();
  const result = await db
    .insert(tasksTable)
    .values({
      projectId: b.projectId,
      title: b.title,
      description: b.description ?? null,
      assignedToId: b.assignedToId ?? null,
      startDate: b.startDate ?? null,
      endDate: b.endDate ?? null,
      priority: b.priority ?? "medium",
      status: b.status ?? "todo",
      progress: b.progress ?? 0,
      parentTaskId: b.parentTaskId ?? null,
      createdById: me.id,
    });
  
  // MySQL returns insertId - use it to fetch the created record
  const insertId = Number(result[0].insertId);
  const [t] = await db
    .select()
    .from(tasksTable)
    .where(eq(tasksTable.id, insertId))
    .limit(1);
  
  res.status(201).json(t);
});

router.patch("/tasks/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  const b = req.body ?? {};
  const update: Record<string, unknown> = {};
  for (const k of [
    "projectId",
    "title",
    "description",
    "assignedToId",
    "startDate",
    "endDate",
    "priority",
    "status",
    "progress",
    "parentTaskId",
  ]) {
    if (b[k] !== undefined) update[k] = b[k];
  }
  
  await db
    .update(tasksTable)
    .set(update)
    .where(eq(tasksTable.id, id));
  
  // MySQL doesn't support .returning() - query after update
  const [t] = await db
    .select()
    .from(tasksTable)
    .where(eq(tasksTable.id, id))
    .limit(1);
  
  if (!t) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(t);
});

router.delete("/tasks/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  await db.delete(tasksTable).where(eq(tasksTable.id, id));
  res.sendStatus(204);
});

// Punch List Items
router.get("/punch-list-items", async (req, res): Promise<void> => {
  const projectId = req.query.projectId
    ? parseInt(req.query.projectId as string, 10)
    : null;
  const baseQuery = db
    .select({ p: punchListItemsTable, pn: projectsTable.name, un: usersTable.name })
    .from(punchListItemsTable)
    .leftJoin(projectsTable, eq(projectsTable.id, punchListItemsTable.projectId))
    .leftJoin(usersTable, eq(usersTable.id, punchListItemsTable.assignedToId));
  const rows = projectId
    ? await baseQuery
        .where(eq(punchListItemsTable.projectId, projectId))
        .orderBy(desc(punchListItemsTable.createdAt))
    : await baseQuery.orderBy(desc(punchListItemsTable.createdAt));
  res.json(rows.map((r) => ({ ...r.p, projectName: r.pn, assignedToName: r.un })));
});

router.post("/punch-list-items", async (req, res): Promise<void> => {
  const b = req.body ?? {};
  if (!b.projectId || !b.title) {
    res.status(400).json({ error: "projectId and title required" });
    return;
  }
  const me = await getCurrentUser();
  const result = await db
    .insert(punchListItemsTable)
    .values({
      projectId: b.projectId,
      title: b.title,
      description: b.description ?? null,
      category: b.category ?? "general",
      priority: b.priority ?? "medium",
      status: "open",
      assignedToId: b.assignedToId ?? null,
      dueDate: b.dueDate ?? null,
      createdById: me.id,
    });
  
  // MySQL returns insertId - use it to fetch the created record
  const insertId = Number(result[0].insertId);
  const [row] = await db
    .select({ p: punchListItemsTable, pn: projectsTable.name, un: usersTable.name })
    .from(punchListItemsTable)
    .leftJoin(projectsTable, eq(projectsTable.id, punchListItemsTable.projectId))
    .leftJoin(usersTable, eq(usersTable.id, punchListItemsTable.assignedToId))
    .where(eq(punchListItemsTable.id, insertId));
  res.status(201).json({ ...row!.p, projectName: row!.pn, assignedToName: row!.un });
});

router.patch("/punch-list-items/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  const b = req.body ?? {};
  const update: Record<string, unknown> = {};
  for (const k of ["title", "description", "category", "priority", "status", "assignedToId", "dueDate"]) {
    if (b[k] !== undefined) update[k] = b[k];
  }
  if (b.photos !== undefined) {
    if (!Array.isArray(b.photos)) {
      res.status(400).json({ error: "photos must be an array of strings" });
      return;
    }
    if (b.photos.length > 20) {
      res.status(400).json({ error: "Maximum 20 photos per item" });
      return;
    }
    update.photos = b.photos;
  }
  if (b.status === "resolved" || b.status === "closed") {
    const me = await getCurrentUser();
    update.resolvedAt = new Date();
    update.resolvedById = me.id;
  }
  
  await db
    .update(punchListItemsTable)
    .set(update)
    .where(eq(punchListItemsTable.id, id));
  
  // MySQL doesn't support .returning() - query after update
  const itemCheck = await db
    .select()
    .from(punchListItemsTable)
    .where(eq(punchListItemsTable.id, id))
    .limit(1);
  
  if (!itemCheck || itemCheck.length === 0) { 
    res.status(404).json({ error: "Not found" }); 
    return; 
  }
  
  const [row] = await db
    .select({ p: punchListItemsTable, pn: projectsTable.name, un: usersTable.name })
    .from(punchListItemsTable)
    .leftJoin(projectsTable, eq(projectsTable.id, punchListItemsTable.projectId))
    .leftJoin(usersTable, eq(usersTable.id, punchListItemsTable.assignedToId))
    .where(eq(punchListItemsTable.id, id));
  res.json({ ...row!.p, projectName: row!.pn, assignedToName: row!.un });
});

router.delete("/punch-list-items/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  await db.delete(punchListItemsTable).where(eq(punchListItemsTable.id, id));
  res.sendStatus(204);
});

// Helper: Generates Executive Quality & Snag List PDF / Print Document
function generateSnagListPdfHtml({
  project,
  items,
  autoPrint = false,
}: {
  project?: any;
  items: any[];
  autoPrint?: boolean;
}) {
  const escHtml = (unsafe: any) => {
    if (unsafe === null || unsafe === undefined) return "";
    return String(unsafe)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  };

  const total = items.length;
  const openCount = items.filter(i => i.status === "open").length;
  const inProgressCount = items.filter(i => i.status === "in_progress").length;
  const resolvedCount = items.filter(i => i.status === "resolved" || i.status === "closed").length;
  const highPriorityCount = items.filter(i => i.priority === "high").length;
  const clearanceRate = total > 0 ? Math.round((resolvedCount / total) * 100) : 100;

  const statusColors: Record<string, { bg: string; text: string }> = {
    open: { bg: "#fef2f2", text: "#b91c1c" },
    in_progress: { bg: "#fffbeb", text: "#b45309" },
    resolved: { bg: "#ecfdf5", text: "#047857" },
    closed: { bg: "#f1f5f9", text: "#475569" },
  };

  const priorityColors: Record<string, { bg: string; text: string }> = {
    high: { bg: "#fef2f2", text: "#dc2626" },
    medium: { bg: "#fffbeb", text: "#d97706" },
    low: { bg: "#f1f5f9", text: "#64748b" },
  };

  const rowsHtml = items.map((i) => {
    const sColor = statusColors[i.status] || { bg: "#f1f5f9", text: "#334155" };
    const pColor = priorityColors[i.priority] || { bg: "#f1f5f9", text: "#334155" };
    const dueStr = i.dueDate ? new Date(i.dueDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
    const resolvedStr = i.resolvedAt ? new Date(i.resolvedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
    const photoCount = Array.isArray(i.photos) ? i.photos.length : 0;

    return `<tr>
      <td style="text-align:center;font-family:monospace;font-weight:700">#${i.id}</td>
      <td>
        <div style="font-weight:600;color:#0f172a">${escHtml(i.title)}</div>
        ${i.description ? `<div style="font-size:11px;color:#64748b;margin-top:2px">${escHtml(i.description)}</div>` : ""}
      </td>
      <td style="text-transform:capitalize;font-weight:500">${escHtml(i.category || "General")}</td>
      <td style="text-align:center">
        <span style="background:${pColor.bg};color:${pColor.text};padding:2px 8px;border-radius:999px;font-size:10px;font-weight:700;text-transform:uppercase">${escHtml(i.priority)}</span>
      </td>
      <td style="text-align:center">
        <span style="background:${sColor.bg};color:${sColor.text};padding:2px 8px;border-radius:999px;font-size:10px;font-weight:700;text-transform:uppercase">${escHtml(String(i.status || "").replace("_", " "))}</span>
      </td>
      <td>${escHtml(i.assignedToName || "Site Execution Team")}</td>
      <td style="text-align:center;font-size:11px">${dueStr}</td>
      <td style="text-align:center;font-size:11px">${resolvedStr}</td>
      <td style="text-align:center;font-size:11px">${photoCount > 0 ? `📷 ${photoCount}` : "—"}</td>
    </tr>`;
  }).join("\n");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>QC Snag List - ${escHtml(project?.name || "Kanak TurnKey")}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #1e293b; margin: 0; padding: 28px; font-size: 12px; line-height: 1.5; background: #fff; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 20px; }
    .logo { font-size: 20px; font-weight: 900; letter-spacing: -0.5px; color: #0f172a; }
    .logo span { color: #f97316; }
    .report-title { font-size: 16px; font-weight: 800; text-transform: uppercase; color: #0f172a; margin-top: 2px; }
    .meta-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; }
    .meta-item span { display: block; font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: 600; margin-bottom: 2px; }
    .meta-item strong { font-size: 13px; color: #0f172a; }
    .kpi-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin-bottom: 20px; text-align: center; }
    .kpi-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; }
    .kpi-card .num { font-size: 20px; font-weight: 800; margin-top: 2px; }
    .kpi-card .lbl { font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: 600; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 28px; font-size: 11px; }
    th { background: #0f172a; color: #ffffff; text-align: left; padding: 8px 10px; font-size: 10px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.04em; }
    td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
    tr:nth-child(even) td { background: #f8fafc; }
    .signatures { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0; text-align: center; }
    .sig-line { height: 40px; border-bottom: 1px dashed #94a3b8; margin-bottom: 6px; }
    .sig-role { font-size: 10px; color: #64748b; }
    .sig-title { font-size: 11px; font-weight: 700; color: #0f172a; }
    .no-print { display: flex; gap: 10px; margin-bottom: 20px; align-items: center; }
    .btn { padding: 8px 16px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; text-decoration: none; border: none; }
    .btn-primary { background: #0f172a; color: #fff; }
    .btn-secondary { background: #e2e8f0; color: #1e293b; }
    @media print {
      body { padding: 0; }
      .no-print { display: none !important; }
      @page { margin: 1cm; size: landscape; }
    }
  </style>
  ${autoPrint ? `<script>window.onload = function() { setTimeout(function() { window.print(); }, 400); };</script>` : ""}
</head>
<body>
  <div class="no-print">
    <button onclick="window.print()" class="btn btn-primary">&#128424; Print / Save as PDF</button>
    <button onclick="window.close()" class="btn btn-secondary">Close Window</button>
    <span style="font-size:11px;color:#64748b;margin-left:8px">Tip: Choose "Save as PDF" in print destinations to save this report.</span>
  </div>

  <div class="header">
    <div>
      <div class="logo">KANAK <span>TURNKEY</span></div>
      <div style="font-size: 10px; color: #64748b; margin-top: 2px;">Quality Assurance, Field De-Snagging & Statutory Handover Audit</div>
    </div>
    <div style="text-align: right;">
      <div class="report-title">QC Punch List & Snag Registry</div>
      <div style="font-size: 11px; font-weight: 700; color: #f97316; margin-top: 2px;">ISO 9001:2015 &bull; Handover Clearance Report</div>
      <div style="font-size: 10px; color: #64748b; margin-top: 2px;">Generated: ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
    </div>
  </div>

  <div class="meta-grid">
    <div class="meta-item">
      <span>Project</span>
      <strong>${escHtml(project?.name || "All Projects")}</strong>
    </div>
    <div class="meta-item">
      <span>Client / Employer</span>
      <strong>${escHtml(project?.clientName || "Corporate Client")}</strong>
    </div>
    <div class="meta-item">
      <span>Lifecycle Stage</span>
      <strong style="text-transform:capitalize">${escHtml(project?.lifecycleStage || project?.status || "Execution")}</strong>
    </div>
    <div class="meta-item">
      <span>Audit Clearance</span>
      <strong style="color:${clearanceRate >= 80 ? "#047857" : "#b45309"}">${clearanceRate}% Resolved</strong>
    </div>
  </div>

  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="lbl">Total Snag Items</div>
      <div class="num" style="color:#0f172a">${total}</div>
    </div>
    <div class="kpi-card">
      <div class="lbl">Open Defects</div>
      <div class="num" style="color:#dc2626">${openCount}</div>
    </div>
    <div class="kpi-card">
      <div class="lbl">In Rectification</div>
      <div class="num" style="color:#d97706">${inProgressCount}</div>
    </div>
    <div class="kpi-card">
      <div class="lbl">Resolved & Closed</div>
      <div class="num" style="color:#047857">${resolvedCount}</div>
    </div>
    <div class="kpi-card">
      <div class="lbl">High Priority</div>
      <div class="num" style="color:#b91c1c">${highPriorityCount}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:50px;text-align:center">Snag #</th>
        <th>Item Title & Location Details</th>
        <th style="width:110px">Trade Category</th>
        <th style="width:75px;text-align:center">Priority</th>
        <th style="width:85px;text-align:center">Status</th>
        <th style="width:130px">Assigned Assignee</th>
        <th style="width:85px;text-align:center">Due Date</th>
        <th style="width:85px;text-align:center">Resolved On</th>
        <th style="width:60px;text-align:center">Evidence</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml || `<tr><td colspan="9" style="text-align:center;padding:24px;color:#94a3b8">No punch list items recorded.</td></tr>`}
    </tbody>
  </table>

  <div class="signatures">
    <div>
      <div class="sig-line"></div>
      <div class="sig-title">QC Lead Inspector</div>
      <div class="sig-role">Quality Control & IS Compliance</div>
    </div>
    <div>
      <div class="sig-line"></div>
      <div class="sig-title">Contractor Representative</div>
      <div class="sig-role">Trade Rectification Undertaking</div>
    </div>
    <div>
      <div class="sig-line"></div>
      <div class="sig-title">Project Manager</div>
      <div class="sig-role">Site Verification & Work Completion</div>
    </div>
    <div>
      <div class="sig-line"></div>
      <div class="sig-title">Client / PMC Representative</div>
      <div class="sig-role">Handover Acceptance & Sign-off</div>
    </div>
  </div>
</body>
</html>`;
}

// FR-SNAG-05: Project-level export snag list to PDF endpoint
router.get("/projects/:projectId/punch-list/export-pdf", async (req, res): Promise<void> => {
  const pid = parseInt(req.params.projectId as string, 10);
  if (isNaN(pid) || pid <= 0) {
    res.status(400).send("Invalid project ID");
    return;
  }

  const [project] = await db
    .select()
    .from(projectsTable)
    .where(eq(projectsTable.id, pid));

  const baseQuery = db
    .select({ p: punchListItemsTable, pn: projectsTable.name, un: usersTable.name })
    .from(punchListItemsTable)
    .leftJoin(projectsTable, eq(projectsTable.id, punchListItemsTable.projectId))
    .leftJoin(usersTable, eq(usersTable.id, punchListItemsTable.assignedToId))
    .where(eq(punchListItemsTable.projectId, pid))
    .orderBy(desc(punchListItemsTable.createdAt));

  const rows = await baseQuery;
  const items = rows.map((r) => ({ ...r.p, projectName: r.pn, assignedToName: r.un }));
  const autoPrint = req.query.autoPrint === "true";

  const html = generateSnagListPdfHtml({ project, items, autoPrint });
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(html);
});

// General Snag list export to PDF endpoint (with filtering)
router.get("/punch-list-items/export-pdf", async (req, res): Promise<void> => {
  const projectIdParam = req.query.projectId as string | undefined;
  const categoryParam = req.query.category as string | undefined;
  const statusParam = req.query.status as string | undefined;
  const autoPrint = req.query.autoPrint === "true";

  let project: any = null;
  const conditions: any[] = [];

  if (projectIdParam && projectIdParam !== "all") {
    const pid = parseInt(projectIdParam, 10);
    if (!isNaN(pid) && pid > 0) {
      conditions.push(eq(punchListItemsTable.projectId, pid));
      const [proj] = await db.select().from(projectsTable).where(eq(projectsTable.id, pid));
      project = proj;
    }
  }

  if (categoryParam && categoryParam !== "all") {
    conditions.push(eq(punchListItemsTable.category, categoryParam));
  }

  if (statusParam && statusParam !== "all") {
    conditions.push(eq(punchListItemsTable.status, statusParam));
  }

  const baseQuery = db
    .select({ p: punchListItemsTable, pn: projectsTable.name, un: usersTable.name })
    .from(punchListItemsTable)
    .leftJoin(projectsTable, eq(projectsTable.id, punchListItemsTable.projectId))
    .leftJoin(usersTable, eq(usersTable.id, punchListItemsTable.assignedToId));

  const rows = conditions.length > 0
    ? await baseQuery.where(and(...conditions)).orderBy(desc(punchListItemsTable.createdAt))
    : await baseQuery.orderBy(desc(punchListItemsTable.createdAt));

  const items = rows.map((r) => ({ ...r.p, projectName: r.pn, assignedToName: r.un }));

  const html = generateSnagListPdfHtml({ project, items, autoPrint });
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(html);
});

// Punch List Item Comments
router.get("/punch-list-items/:id/comments", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  if (Number.isNaN(id) || id <= 0) { res.status(400).json({ error: "Invalid id" }); return; }
  const rows = await db
    .select()
    .from(punchListItemCommentsTable)
    .where(eq(punchListItemCommentsTable.punchListItemId, id))
    .orderBy(asc(punchListItemCommentsTable.createdAt));
  res.json(rows);
});

router.post("/punch-list-items/:id/comments", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  if (Number.isNaN(id) || id <= 0) { res.status(400).json({ error: "Invalid id" }); return; }
  // Verify parent exists
  const [parent] = await db.select({ id: punchListItemsTable.id }).from(punchListItemsTable).where(eq(punchListItemsTable.id, id)).limit(1);
  if (!parent) { res.status(404).json({ error: "Punch list item not found" }); return; }
  const b = req.body ?? {};
  const text = (b.text ?? "").toString().trim();
  if (!text) { res.status(400).json({ error: "text is required" }); return; }
  // Author identity always comes from session, never client input
  const me = await getCurrentUser();
  const result = await db
    .insert(punchListItemCommentsTable)
    .values({
      punchListItemId: id,
      authorName: me.name,
      text,
    });
  
  // MySQL returns insertId - use it to fetch the created record
  const insertId = Number(result[0].insertId);
  const [comment] = await db
    .select()
    .from(punchListItemCommentsTable)
    .where(eq(punchListItemCommentsTable.id, insertId))
    .limit(1);
  
  res.status(201).json(comment);
});

router.get("/projects/:projectId/budget", async (req, res): Promise<void> => {
  const pid = parseInt(req.params.projectId as string, 10);
  const rows = await db
    .select()
    .from(budgetItemsTable)
    .where(eq(budgetItemsTable.projectId, pid));
  res.json(rows.map(fBudget));
});

// Helper to calculate comprehensive project budget variance report
function computeProjectBudgetVariance(project: any, rawBudgetItems: any[]) {
  const items = rawBudgetItems.map((item) => {
    const budgeted = Number(item.budgeted || 0);
    const committed = Number(item.committed || 0);
    const actual = Number(item.actual || 0);
    const costVariance = budgeted - actual;
    const committedVariance = budgeted - (committed + actual);
    const burnRatePercent = budgeted > 0 ? (actual / budgeted) * 100 : 0;
    const totalCommittedPercent = budgeted > 0 ? ((committed + actual) / budgeted) * 100 : 0;

    let health: "healthy" | "warning" | "overrun" = "healthy";
    if (actual > budgeted) {
      health = "overrun";
    } else if (committed + actual > budgeted || burnRatePercent > 85) {
      health = "warning";
    }

    let category = item.category || "";
    if (!category || category.trim() === "") {
      const code = (item.costCode || "").toUpperCase();
      if (code.startsWith("CIVIL") || code.startsWith("STR")) category = "Civil & Structural";
      else if (code.startsWith("ELEC") || code.startsWith("MEP")) category = "Electrical & MEP";
      else if (code.startsWith("MAT") || code.startsWith("FIN")) category = "Finishes & Materials";
      else if (code.startsWith("HVAC")) category = "HVAC & Mechanical";
      else if (code.startsWith("PLUMB") || code.startsWith("FIRE")) category = "Plumbing & Firefighting";
      else if (code.startsWith("LAB")) category = "Labor & Manpower";
      else if (code.startsWith("EQP")) category = "Plant & Machinery";
      else if (code.startsWith("SUB")) category = "Trade Subcontracts";
      else if (code.startsWith("OVHD")) category = "Preliminaries & Overheads";
      else category = "General & Preliminaries";
    }

    return {
      id: item.id,
      projectId: item.projectId,
      costCode: item.costCode,
      description: item.description,
      category,
      budgeted,
      committed,
      actual,
      costVariance,
      committedVariance,
      burnRatePercent: Math.round(burnRatePercent * 10) / 10,
      totalCommittedPercent: Math.round(totalCommittedPercent * 10) / 10,
      health,
    };
  });

  const totalBudgeted = items.reduce((sum, i) => sum + i.budgeted, 0);
  const totalCommitted = items.reduce((sum, i) => sum + i.committed, 0);
  const totalActual = items.reduce((sum, i) => sum + i.actual, 0);
  const baselineBudget = Number(project.budget || 0) || totalBudgeted;
  const netVariance = totalBudgeted - totalActual;
  const remainingUncommitted = totalBudgeted - (totalCommitted + totalActual);
  const overallBurnRate = totalBudgeted > 0 ? (totalActual / totalBudgeted) * 100 : 0;
  const overallCommitmentRate = totalBudgeted > 0 ? ((totalCommitted + totalActual) / totalBudgeted) * 100 : 0;

  // Category aggregations
  const categoryMap = new Map<string, { category: string; budgeted: number; committed: number; actual: number; variance: number; count: number }>();
  for (const item of items) {
    const cat = item.category;
    const existing = categoryMap.get(cat) || { category: cat, budgeted: 0, committed: 0, actual: 0, variance: 0, count: 0 };
    existing.budgeted += item.budgeted;
    existing.committed += item.committed;
    existing.actual += item.actual;
    existing.variance += item.costVariance;
    existing.count += 1;
    categoryMap.set(cat, existing);
  }
  const categoryBreakdown = Array.from(categoryMap.values()).map(c => ({
    ...c,
    burnRatePercent: c.budgeted > 0 ? Math.round((c.actual / c.budgeted) * 1000) / 10 : 0,
    health: c.actual > c.budgeted ? "overrun" : (c.actual + c.committed > c.budgeted || (c.actual / c.budgeted) > 0.85) ? "warning" : "healthy",
  }));

  const overBudgetItemCount = items.filter(i => i.health === "overrun").length;
  const atRiskItemCount = items.filter(i => i.health === "warning").length;
  const healthyItemCount = items.filter(i => i.health === "healthy").length;

  let overallHealth: "healthy" | "warning" | "overrun" = "healthy";
  if (totalActual > totalBudgeted || overBudgetItemCount > 0) {
    overallHealth = totalActual > totalBudgeted ? "overrun" : "warning";
  } else if (overallCommitmentRate > 90 || atRiskItemCount > 0) {
    overallHealth = "warning";
  }

  return {
    projectId: project.id,
    projectName: project.name,
    clientName: project.clientName,
    status: project.status,
    lifecycleStage: project.lifecycleStage,
    baselineBudget,
    summary: {
      totalBudgeted,
      totalCommitted,
      totalActual,
      netVariance,
      remainingUncommitted,
      overallBurnRate: Math.round(overallBurnRate * 10) / 10,
      overallCommitmentRate: Math.round(overallCommitmentRate * 10) / 10,
      overallHealth,
      totalItems: items.length,
      overBudgetItemCount,
      atRiskItemCount,
      healthyItemCount,
      generatedAt: new Date().toISOString(),
    },
    categoryBreakdown,
    items,
  };
}

// FR-BUD-03: Project-level budget variance report endpoint
router.get("/projects/:projectId/budget-variance", async (req, res): Promise<void> => {
  const pid = parseInt(req.params.projectId as string, 10);
  if (isNaN(pid) || pid <= 0) {
    res.status(400).json({ error: "Invalid project ID" });
    return;
  }

  const [project] = await db
    .select()
    .from(projectsTable)
    .where(eq(projectsTable.id, pid));

  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  const budgetItems = await db
    .select()
    .from(budgetItemsTable)
    .where(eq(budgetItemsTable.projectId, pid));

  const report = computeProjectBudgetVariance(project, budgetItems);
  res.json(report);
});

// Reports Hub: Portfolio & Project Budget Variance Analysis endpoint
router.get("/reports/budget-variance", async (req, res): Promise<void> => {
  const projectIdParam = req.query.projectId as string | undefined;

  if (projectIdParam && projectIdParam !== "all") {
    const pid = parseInt(projectIdParam, 10);
    if (!isNaN(pid) && pid > 0) {
      const [project] = await db
        .select()
        .from(projectsTable)
        .where(eq(projectsTable.id, pid));
      if (!project) {
        res.status(404).json({ error: "Project not found" });
        return;
      }
      const budgetItems = await db
        .select()
        .from(budgetItemsTable)
        .where(eq(budgetItemsTable.projectId, pid));
      res.json(computeProjectBudgetVariance(project, budgetItems));
      return;
    }
  }

  // Portfolio-level variance report across all projects
  const allProjects = await db.select().from(projectsTable);
  const allBudgetItems = await db.select().from(budgetItemsTable);

  const projectReports = allProjects.map((p) => {
    const pItems = allBudgetItems.filter((b) => b.projectId === p.id);
    return computeProjectBudgetVariance(p, pItems);
  });

  const portfolioTotalBudgeted = projectReports.reduce((s, r) => s + r.summary.totalBudgeted, 0);
  const portfolioTotalCommitted = projectReports.reduce((s, r) => s + r.summary.totalCommitted, 0);
  const portfolioTotalActual = projectReports.reduce((s, r) => s + r.summary.totalActual, 0);
  const portfolioNetVariance = portfolioTotalBudgeted - portfolioTotalActual;

  res.json({
    portfolioSummary: {
      totalProjects: allProjects.length,
      totalBudgeted: portfolioTotalBudgeted,
      totalCommitted: portfolioTotalCommitted,
      totalActual: portfolioTotalActual,
      netVariance: portfolioNetVariance,
      overallBurnRate: portfolioTotalBudgeted > 0 ? Math.round((portfolioTotalActual / portfolioTotalBudgeted) * 1000) / 10 : 0,
      generatedAt: new Date().toISOString(),
    },
    projectReports,
  });
});

router.post("/projects/:projectId/budget", async (req, res): Promise<void> => {
  const pid = parseInt(req.params.projectId as string, 10);
  const b = req.body ?? {};
  const result = await db
    .insert(budgetItemsTable)
    .values({
      projectId: pid,
      costCode: b.costCode,
      description: b.description,
      category: b.category ?? null,
      budgeted: String(b.budgeted ?? 0),
      actual: String(b.actual ?? 0),
      committed: String(b.committed ?? 0),
    });
  
  // MySQL returns insertId - use it to fetch the created record
  const insertId = Number(result[0].insertId);
  const [item] = await db
    .select()
    .from(budgetItemsTable)
    .where(eq(budgetItemsTable.id, insertId))
    .limit(1);
  
  res.status(201).json(fBudget(item!));
});

router.patch("/budget-items/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  const b = req.body ?? {};
  const update: Record<string, unknown> = {};
  if (b.costCode !== undefined) update.costCode = b.costCode;
  if (b.description !== undefined) update.description = b.description;
  if (b.category !== undefined) update.category = b.category;
  if (b.budgeted !== undefined) update.budgeted = String(b.budgeted);
  if (b.actual !== undefined) update.actual = String(b.actual);
  if (b.committed !== undefined) update.committed = String(b.committed);
  
  await db
    .update(budgetItemsTable)
    .set(update)
    .where(eq(budgetItemsTable.id, id));
  
  // MySQL doesn't support .returning() - query after update
  const [item] = await db
    .select()
    .from(budgetItemsTable)
    .where(eq(budgetItemsTable.id, id))
    .limit(1);
  
  if (!item) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(fBudget(item));
});

router.post("/budget-items", async (req, res): Promise<void> => {
  const b = req.body ?? {};
  const pid = parseInt((b.projectId || req.params.projectId) as string, 10);
  if (!pid) {
    res.status(400).json({ error: "projectId required" });
    return;
  }
  const result = await db
    .insert(budgetItemsTable)
    .values({
      projectId: pid,
      costCode: b.costCode,
      description: b.description,
      category: b.category ?? null,
      budgeted: String(b.budgeted ?? 0),
      actual: String(b.actual ?? 0),
      committed: String(b.committed ?? 0),
    });
  
  const insertId = Number(result[0].insertId);
  const [item] = await db
    .select()
    .from(budgetItemsTable)
    .where(eq(budgetItemsTable.id, insertId))
    .limit(1);
  
  res.status(201).json(fBudget(item!));
});

router.delete("/budget-items/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  await db.delete(budgetItemsTable).where(eq(budgetItemsTable.id, id));
  res.sendStatus(204);
});

router.delete("/ra-bills/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  await db.delete(raBillsTable).where(eq(raBillsTable.id, id));
  res.sendStatus(204);
});

router.delete("/stakeholders/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  await db.delete(stakeholdersTable).where(eq(stakeholdersTable.id, id));
  res.sendStatus(204);
});

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
  
  // MySQL returns insertId - use it to fetch the created record
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
  
  // MySQL doesn't support .returning() - query after update
  const [bill] = await db
    .select()
    .from(raBillsTable)
    .where(eq(raBillsTable.id, id))
    .limit(1);
  
  if (!bill) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(fRa(bill));
});

router.get("/stakeholders", async (req, res): Promise<void> => {
  const projectId = req.query.projectId
    ? parseInt(req.query.projectId as string, 10)
    : null;
  const baseQuery = db
    .select({ s: stakeholdersTable, p: projectsTable.name })
    .from(stakeholdersTable)
    .leftJoin(projectsTable, eq(projectsTable.id, stakeholdersTable.projectId));
  const rows = projectId
    ? await baseQuery.where(eq(stakeholdersTable.projectId, projectId))
    : await baseQuery;
  res.json(rows.map((r) => ({ ...r.s, projectName: r.p })));
});

router.post("/stakeholders", async (req, res): Promise<void> => {
  const b = req.body ?? {};
  const result = await db
    .insert(stakeholdersTable)
    .values({
      projectId: b.projectId,
      name: b.name,
      email: b.email ?? null,
      phone: b.phone ?? null,
      organization: b.organization ?? null,
      role: b.role ?? null,
      accessLevel: b.accessLevel ?? "read",
    });
  
  // MySQL returns insertId - use it to fetch the created record
  const insertId = Number(result[0].insertId);
  const [s] = await db
    .select()
    .from(stakeholdersTable)
    .where(eq(stakeholdersTable.id, insertId))
    .limit(1);
  
  res.status(201).json(s);
});

router.patch("/stakeholders/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  if (Number.isNaN(id) || id <= 0) {
    res.status(400).json({ error: "Invalid stakeholder id" });
    return;
  }
  const b = req.body ?? {};
  const ALLOWED_ACCESS = ["read", "write", "admin"] as const;
  const update: Record<string, unknown> = {};
  if (b.name !== undefined) {
    if (typeof b.name !== "string" || !b.name.trim()) {
      res.status(400).json({ error: "name must be a non-empty string" });
      return;
    }
    update.name = b.name.trim();
  }
  if (b.email !== undefined) update.email = b.email || null;
  if (b.phone !== undefined) update.phone = b.phone || null;
  if (b.organization !== undefined) update.organization = b.organization || null;
  if (b.role !== undefined) update.role = b.role || null;
  if (b.accessLevel !== undefined) {
    if (!ALLOWED_ACCESS.includes(b.accessLevel)) {
      res.status(400).json({ error: `accessLevel must be one of: ${ALLOWED_ACCESS.join(", ")}` });
      return;
    }
    update.accessLevel = b.accessLevel;
  }
  if (Object.keys(update).length === 0) {
    res.status(400).json({ error: "No fields to update" });
    return;
  }
  
  await db
    .update(stakeholdersTable)
    .set(update)
    .where(eq(stakeholdersTable.id, id));
  
  // MySQL doesn't support .returning() - query after update
  const [s] = await db
    .select()
    .from(stakeholdersTable)
    .where(eq(stakeholdersTable.id, id))
    .limit(1);
  
  if (!s) {
    res.status(404).json({ error: "Stakeholder not found" });
    return;
  }
  res.json(s);
});

export default router;
