import { Router, type IRouter } from "express";
import { eq, desc, and, or, sql } from "drizzle-orm";
import {
  db,
  procurementMaterialRequestsTable,
  procurementMaterialRequestItemsTable,
  materialRequestApprovalHistoryTable,
  procurementRfqsTable,
  procurementNotificationsTable,
  procurementInventoryItemsTable,
  procurementInventoryTransactionsTable,
  projectsTable,
  usersTable,
} from "@workspace/db";
import { numKeys } from "../lib/transforms";
import { getCurrentUser } from "../lib/session";
import { generateNumber } from "../lib/numbers";

const router: IRouter = Router();

// Transform numeric fields
const fMaterialRequest = (r: Record<string, unknown>) =>
  numKeys(r, ["estimatedCost", "projectId", "requestedById", "approvedById", "rejectedById"]);

const fMaterialRequestItem = (r: Record<string, unknown>) =>
  numKeys(r, ["quantity", "estimatedUnitPrice", "estimatedTotal", "materialRequestId"]);

// ═══════════════════════════════════════════════════════════════════════════
// MATERIAL REQUESTS - List & Get
// ═══════════════════════════════════════════════════════════════════════════

// GET /api/procurement/material-requests - List all material requests
router.get("/", async (req, res): Promise<void> => {
  try {
    const me = await getCurrentUser(req);
    const { projectId, status, userId, showAll } = req.query;

    // Check if user has admin or project_manager role
    const userRoles = typeof me.roles === 'string' ? JSON.parse(me.roles) : (me.roles ?? []);
    const canSeeAll = userRoles.includes('admin') || userRoles.includes('project_manager');

    let query = db
      .select({
        mr: procurementMaterialRequestsTable,
        projectName: projectsTable.name,
        requestedByName: usersTable.name,
      })
      .from(procurementMaterialRequestsTable)
      .leftJoin(projectsTable, eq(projectsTable.id, procurementMaterialRequestsTable.projectId))
      .leftJoin(usersTable, eq(usersTable.id, procurementMaterialRequestsTable.requestedById))
      .$dynamic();

    // Apply filters
    const conditions = [];
    
    // CRITICAL: User-based filtering for data isolation
    // Regular users see only their own requests
    // Admins and PMs see all requests (unless showAll=false)
    if (!canSeeAll || showAll === 'false') {
      // Regular user OR admin/PM explicitly requesting own requests only
      conditions.push(eq(procurementMaterialRequestsTable.requestedById, me.id));
    } else if (userId) {
      // Admin/PM filtering by specific user
      conditions.push(eq(procurementMaterialRequestsTable.requestedById, Number(userId)));
    }
    // If canSeeAll and no userId filter → show all requests
    
    if (projectId) {
      conditions.push(eq(procurementMaterialRequestsTable.projectId, Number(projectId)));
    }
    if (status) {
      conditions.push(eq(procurementMaterialRequestsTable.status, String(status)));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const rows = await query.orderBy(desc(procurementMaterialRequestsTable.createdAt));

    res.json(
      rows.map((r) => ({
        ...fMaterialRequest(r.mr),
        projectName: r.projectName,
        requestedByName: r.requestedByName,
      }))
    );
  } catch (error) {
    console.error("Error fetching material requests:", error);
    res.status(500).json({ error: "Failed to fetch material requests" });
  }
});

// GET /api/procurement/material-requests/pending-manager-approval - Get pending approvals for current manager
// NOTE: This MUST come before /:id route to prevent "pending-manager-approval" being treated as an ID
router.get("/pending-manager-approval", async (req, res): Promise<void> => {
  try {
    const me = await getCurrentUser(req);

    // Check if user is a manager (allow both admin and project_manager roles)
    const userRoles = typeof me.roles === 'string' ? JSON.parse(me.roles) : (me.roles ?? []);
    const isManager = userRoles.includes('admin') || userRoles.includes('project_manager');
    
    if (!isManager) {
      res.status(403).json({ error: "Access denied. Manager role required." });
      return;
    }

    const {page = 1, limit = 20, priority, projectId, search } = req.query;

    // Base query
    let query = db
      .select({
        mr: procurementMaterialRequestsTable,
        projectName: projectsTable.name,
        requestedByName: usersTable.name,
      })
      .from(procurementMaterialRequestsTable)
      .leftJoin(projectsTable, eq(projectsTable.id, procurementMaterialRequestsTable.projectId))
      .leftJoin(usersTable, eq(usersTable.id, procurementMaterialRequestsTable.requestedById))
      .$dynamic();

    // Build filter conditions
    // For admin: show all pending approvals
    // For project_manager: show only assigned to them
    const conditions = [
      eq(procurementMaterialRequestsTable.status, "pending_manager_approval"),
    ];

    // If not admin, restrict to assigned manager
    if (!userRoles.includes('admin')) {
      conditions.push(eq(procurementMaterialRequestsTable.assignedManagerId, me.id));
    }

    if (priority) {
      conditions.push(eq(procurementMaterialRequestsTable.priority, String(priority)));
    }

    if (projectId) {
      conditions.push(eq(procurementMaterialRequestsTable.projectId, Number(projectId)));
    }

    if (search) {
      conditions.push(
        or(
          sql`${procurementMaterialRequestsTable.title} LIKE ${`%${search}%`}`,
          sql`${procurementMaterialRequestsTable.requestNumber} LIKE ${`%${search}%`}`
        )!
      );
    }

    query = query.where(and(...conditions));

    // Get total count
    const [{ count: total }] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(procurementMaterialRequestsTable)
      .where(and(...conditions));

    // Get paginated results
    const offset = (Number(page) - 1) * Number(limit);
    const rows = await query
      .orderBy(desc(procurementMaterialRequestsTable.submittedAt))
      .limit(Number(limit))
      .offset(offset);

    res.json({
      data: rows.map((r) => ({
        ...fMaterialRequest(r.mr),
        projectName: r.projectName,
        requestedByName: r.requestedByName,
      })),
      pagination: {
        total: Number(total),
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(Number(total) / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching pending approvals:", error);
    res.status(500).json({ error: "Failed to fetch pending approvals" });
  }
});

// GET /api/procurement/material-requests/stats/summary - Get summary statistics
// NOTE: This MUST come before /:id route to prevent "stats" being treated as an ID
router.get("/stats/summary", async (req, res): Promise<void> => {
  try {
    const { projectId } = req.query;

    let baseQuery = db
      .select({
        status: procurementMaterialRequestsTable.status,
        count: sql<number>`COUNT(*)`.as("count"),
      })
      .from(procurementMaterialRequestsTable)
      .$dynamic();

    if (projectId) {
      baseQuery = baseQuery.where(
        eq(procurementMaterialRequestsTable.projectId, Number(projectId))
      );
    }

    const results = await baseQuery.groupBy(procurementMaterialRequestsTable.status);

    const summary = {
      draft: 0,
      pending_manager_approval: 0,
      approved: 0,
      rejected: 0,
      pending_rfq: 0,
      rfq_sent: 0,
      quotes_received: 0,
      po_created: 0,
      completed: 0,
      cancelled: 0,
      total: 0,
    };

    results.forEach((r) => {
      const status = r.status as keyof typeof summary;
      if (status in summary) {
        summary[status] = Number(r.count);
        summary.total += Number(r.count);
      }
    });

    res.json(summary);
  } catch (error) {
    console.error("Error fetching summary statistics:", error);
    res.status(500).json({ error: "Failed to fetch summary statistics" });
  }
});

// GET /api/procurement/material-requests/:id - Get single material request with items
router.get("/:id", async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const me = await getCurrentUser(req);

    const [mr] = await db
      .select({
        mr: procurementMaterialRequestsTable,
        projectName: projectsTable.name,
        requestedByName: usersTable.name,
        approvedByName: sql<string>`approved_by.name`.as("approvedByName"),
        rejectedByName: sql<string>`rejected_by.name`.as("rejectedByName"),
        assignedManagerName: sql<string>`manager.name`.as("assignedManagerName"),
      })
      .from(procurementMaterialRequestsTable)
      .leftJoin(projectsTable, eq(projectsTable.id, procurementMaterialRequestsTable.projectId))
      .leftJoin(usersTable, eq(usersTable.id, procurementMaterialRequestsTable.requestedById))
      .leftJoin(
        sql`users AS approved_by`,
        sql`approved_by.id = ${procurementMaterialRequestsTable.approvedById}`
      )
      .leftJoin(
        sql`users AS rejected_by`,
        sql`rejected_by.id = ${procurementMaterialRequestsTable.rejectedById}`
      )
      .leftJoin(
        sql`users AS manager`,
        sql`manager.id = ${procurementMaterialRequestsTable.assignedManagerId}`
      )
      .where(eq(procurementMaterialRequestsTable.id, id));

    if (!mr) {
      res.status(404).json({ error: "Material request not found" });
      return;
    }

    // AUTHORIZATION: Check if user can view this request
    // Owner can view, Admin/PM can view any request
    const userRoles = typeof me.roles === 'string' ? JSON.parse(me.roles) : (me.roles ?? []);
    const canSeeAll = userRoles.includes('admin') || userRoles.includes('project_manager');
    const isOwner = mr.mr.requestedById === me.id;

    if (!isOwner && !canSeeAll) {
      res.status(403).json({ 
        error: "Access denied",
        message: "You can only view your own material requests" 
      });
      return;
    }

    // Get items
    const items = await db
      .select()
      .from(procurementMaterialRequestItemsTable)
      .where(eq(procurementMaterialRequestItemsTable.materialRequestId, id))
      .orderBy(procurementMaterialRequestItemsTable.sortOrder);

    // Get approval history
    const approvalHistory = await db
      .select({
        history: materialRequestApprovalHistoryTable,
        managerName: usersTable.name,
      })
      .from(materialRequestApprovalHistoryTable)
      .leftJoin(usersTable, eq(usersTable.id, materialRequestApprovalHistoryTable.managerId))
      .where(eq(materialRequestApprovalHistoryTable.materialRequestId, id))
      .orderBy(desc(materialRequestApprovalHistoryTable.actionDate));

    res.json({
      ...fMaterialRequest(mr.mr),
      projectName: mr.projectName,
      requestedByName: mr.requestedByName,
      approvedByName: mr.approvedByName,
      rejectedByName: mr.rejectedByName,
      assignedManagerName: mr.assignedManagerName,
      items: items.map(fMaterialRequestItem),
      approvalHistory: approvalHistory.map((h) => ({
        ...h.history,
        managerName: h.managerName,
      })),
    });
  } catch (error) {
    console.error("Error fetching material request:", error);
    res.status(500).json({ error: "Failed to fetch material request" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// MATERIAL REQUESTS - Create & Update
// ═══════════════════════════════════════════════════════════════════════════

// POST /api/procurement/material-requests - Create new material request
router.post("/", async (req, res): Promise<void> => {
  try {
    const me = await getCurrentUser(req);
    const raw = req.body ?? {};
    const b = (raw.data && typeof raw.data === "object") ? { ...raw.data, ...raw } : raw;

    const projectId = Number(b.projectId);
    if (!projectId || isNaN(projectId)) {
      res.status(400).json({ error: "Validation Error", message: "Project is required" });
      return;
    }

    const title = (b.title || "").trim();
    if (!title) {
      res.status(400).json({ error: "Validation Error", message: "Title is required" });
      return;
    }

    const category = b.category || "civil";
    const priority = b.priority || "medium";
    const requiredDate = b.requiredDate || new Date().toISOString().split("T")[0];

    // Generate request number
    const requestNumber = await generateNumber("MR", procurementMaterialRequestsTable, "requestNumber");

    // Create material request
    await db.insert(procurementMaterialRequestsTable).values({
      requestNumber,
      projectId,
      title,
      description: b.description ?? null,
      category,
      priority,
      requiredDate,
      status: "draft",
      requestedById: me.id,
      estimatedCost: b.estimatedCost ? String(b.estimatedCost) : null,
      notes: b.notes ?? null,
    });

    // Get the created request
    const [mr] = await db
      .select()
      .from(procurementMaterialRequestsTable)
      .where(eq(procurementMaterialRequestsTable.requestNumber, requestNumber))
      .limit(1);

    // Create items if provided
    if (b.items && Array.isArray(b.items) && b.items.length > 0) {
      const itemsToInsert = b.items.map((item: any, index: number) => ({
        materialRequestId: mr!.id,
        itemName: item.itemName || title,
        description: item.description ?? null,
        specification: item.specification ?? null,
        quantity: String(item.quantity || 1),
        unit: item.unit || "nos",
        estimatedUnitPrice: item.estimatedUnitPrice ? String(item.estimatedUnitPrice) : null,
        estimatedTotal: item.estimatedTotal ? String(item.estimatedTotal) : null,
        sortOrder: index,
      }));

      await db.insert(procurementMaterialRequestItemsTable).values(itemsToInsert);
    } else if (b.quantity !== undefined && b.quantity !== null && b.quantity !== "") {
      // Single item passed directly in body (e.g. from quick create dialog)
      await db.insert(procurementMaterialRequestItemsTable).values({
        materialRequestId: mr!.id,
        itemName: title,
        description: b.description ?? null,
        specification: null,
        quantity: String(b.quantity || 1),
        unit: b.unit || "nos",
        estimatedUnitPrice: b.estimatedUnitPrice ? String(b.estimatedUnitPrice) : null,
        estimatedTotal: b.estimatedTotal ? String(b.estimatedTotal) : null,
        sortOrder: 0,
      });
    }

    // Get the created request with items
    const items = await db
      .select()
      .from(procurementMaterialRequestItemsTable)
      .where(eq(procurementMaterialRequestItemsTable.materialRequestId, mr!.id))
      .orderBy(procurementMaterialRequestItemsTable.sortOrder);

    res.status(201).json({
      ...fMaterialRequest(mr!),
      items: items.map(fMaterialRequestItem),
    });
  } catch (error) {
    console.error("Error creating material request:", error);
    res.status(500).json({ error: "Failed to create material request" });
  }
});

// PUT /api/procurement/material-requests/:id - Update material request
router.put("/:id", async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const me = await getCurrentUser(req);
    const raw = req.body ?? {};
    const b = (raw.data && typeof raw.data === "object") ? { ...raw.data, ...raw } : raw;

    // First, get the existing request to check ownership
    const [existing] = await db
      .select()
      .from(procurementMaterialRequestsTable)
      .where(eq(procurementMaterialRequestsTable.id, id))
      .limit(1);

    if (!existing) {
      res.status(404).json({ error: "Material request not found" });
      return;
    }

    // AUTHORIZATION: Check if user can edit this request
    // Owner can edit (only if draft), Admin/PM can edit any request
    const userRoles = typeof me.roles === 'string' ? JSON.parse(me.roles) : (me.roles ?? []);
    const canEditAll = userRoles.includes('admin') || userRoles.includes('project_manager');
    const isOwner = existing.requestedById === me.id;

    if (!isOwner && !canEditAll) {
      res.status(403).json({ 
        error: "Access denied",
        message: "You can only edit your own material requests" 
      });
      return;
    }

    // Owner can only edit draft requests
    if (isOwner && !canEditAll && existing.status !== 'draft') {
      res.status(403).json({ 
        error: "Cannot edit",
        message: "You can only edit draft requests. This request has status: " + existing.status 
      });
      return;
    }

    const update: Record<string, unknown> = {};
    if (b.title !== undefined) update.title = b.title;
    if (b.description !== undefined) update.description = b.description;
    if (b.category !== undefined) update.category = b.category;
    if (b.priority !== undefined) update.priority = b.priority;
    if (b.requiredDate !== undefined) update.requiredDate = b.requiredDate;
    if (b.estimatedCost !== undefined) update.estimatedCost = String(b.estimatedCost);
    if (b.notes !== undefined) update.notes = b.notes;

    await db
      .update(procurementMaterialRequestsTable)
      .set(update)
      .where(eq(procurementMaterialRequestsTable.id, id));

    // Get updated request
    const [updated] = await db
      .select()
      .from(procurementMaterialRequestsTable)
      .where(eq(procurementMaterialRequestsTable.id, id))
      .limit(1);

    if (!updated) {
      res.status(404).json({ error: "Material request not found" });
      return;
    }

    res.json(fMaterialRequest(updated));
  } catch (error) {
    console.error("Error updating material request:", error);
    res.status(500).json({ error: "Failed to update material request" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// MATERIAL REQUEST ITEMS - Manage Items
// ═══════════════════════════════════════════════════════════════════════════

// POST /api/procurement/material-requests/:id/items - Add item to request
router.post("/:id/items", async (req, res): Promise<void> => {
  try {
    const materialRequestId = parseInt(req.params.id as string, 10);
    const b = req.body ?? {};

    // Get current max sort order
    const [maxSort] = await db
      .select({ maxOrder: sql<number>`COALESCE(MAX(sort_order), -1)` })
      .from(procurementMaterialRequestItemsTable)
      .where(eq(procurementMaterialRequestItemsTable.materialRequestId, materialRequestId));

    const sortOrder = (maxSort?.maxOrder ?? -1) + 1;

    await db.insert(procurementMaterialRequestItemsTable).values({
      materialRequestId,
      itemName: b.itemName,
      description: b.description ?? null,
      specification: b.specification ?? null,
      quantity: String(b.quantity),
      unit: b.unit,
      estimatedUnitPrice: b.estimatedUnitPrice ? String(b.estimatedUnitPrice) : null,
      estimatedTotal: b.estimatedTotal ? String(b.estimatedTotal) : null,
      sortOrder,
    });

    // Get the created item
    const [item] = await db
      .select()
      .from(procurementMaterialRequestItemsTable)
      .where(
        and(
          eq(procurementMaterialRequestItemsTable.materialRequestId, materialRequestId),
          eq(procurementMaterialRequestItemsTable.sortOrder, sortOrder)
        )
      )
      .limit(1);

    res.status(201).json(fMaterialRequestItem(item!));
  } catch (error) {
    console.error("Error adding item:", error);
    res.status(500).json({ error: "Failed to add item" });
  }
});

// PUT /api/procurement/material-requests/:id/items/:itemId - Update item
router.put("/:id/items/:itemId", async (req, res): Promise<void> => {
  try {
    const itemId = parseInt(req.params.itemId as string, 10);
    const b = req.body ?? {};

    const update: Record<string, unknown> = {};
    if (b.itemName !== undefined) update.itemName = b.itemName;
    if (b.description !== undefined) update.description = b.description;
    if (b.specification !== undefined) update.specification = b.specification;
    if (b.quantity !== undefined) update.quantity = String(b.quantity);
    if (b.unit !== undefined) update.unit = b.unit;
    if (b.estimatedUnitPrice !== undefined) update.estimatedUnitPrice = String(b.estimatedUnitPrice);
    if (b.estimatedTotal !== undefined) update.estimatedTotal = String(b.estimatedTotal);

    await db
      .update(procurementMaterialRequestItemsTable)
      .set(update)
      .where(eq(procurementMaterialRequestItemsTable.id, itemId));

    const [updated] = await db
      .select()
      .from(procurementMaterialRequestItemsTable)
      .where(eq(procurementMaterialRequestItemsTable.id, itemId))
      .limit(1);

    if (!updated) {
      res.status(404).json({ error: "Item not found" });
      return;
    }

    res.json(fMaterialRequestItem(updated));
  } catch (error) {
    console.error("Error updating item:", error);
    res.status(500).json({ error: "Failed to update item" });
  }
});

// DELETE /api/procurement/material-requests/:id/items/:itemId - Delete item
router.delete("/:id/items/:itemId", async (req, res): Promise<void> => {
  try {
    const itemId = parseInt(req.params.itemId as string, 10);

    await db
      .delete(procurementMaterialRequestItemsTable)
      .where(eq(procurementMaterialRequestItemsTable.id, itemId));

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting item:", error);
    res.status(500).json({ error: "Failed to delete item" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// WORKFLOW - Submit for Approval
// ═══════════════════════════════════════════════════════════════════════════

// POST /api/procurement/material-requests/:id/submit - Submit for manager approval
router.post("/:id/submit", async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const me = await getCurrentUser(req);
    const { managerId } = req.body ?? {};

    // Get the material request
    const [mr] = await db
      .select()
      .from(procurementMaterialRequestsTable)
      .where(eq(procurementMaterialRequestsTable.id, id))
      .limit(1);

    if (!mr) {
      res.status(404).json({ error: "Material request not found" });
      return;
    }

    // Validate status
    if (mr.status !== "draft") {
      res.status(400).json({ error: "Only draft requests can be submitted" });
      return;
    }

    // Validate ownership
    if (mr.requestedById !== me.id) {
      res.status(403).json({ error: "You can only submit your own requests" });
      return;
    }

    // Check if request has items
    const items = await db
      .select()
      .from(procurementMaterialRequestItemsTable)
      .where(eq(procurementMaterialRequestItemsTable.materialRequestId, id));

    if (items.length === 0) {
      res.status(400).json({ error: "Cannot submit request without items" });
      return;
    }

    // Manager ID is required
    if (!managerId) {
      res.status(400).json({ 
        error: "Manager ID is required. Please select a manager to review this request." 
      });
      return;
    }

    // Verify manager exists and has manager role
    const [manager] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, managerId))
      .limit(1);

    if (!manager) {
      res.status(400).json({ error: "Assigned manager not found" });
      return;
    }

    // Check if manager has appropriate role
    const managerRoles = typeof manager.roles === 'string' 
      ? JSON.parse(manager.roles) 
      : (manager.roles ?? []);
    
    const isManager = managerRoles.includes('admin') || managerRoles.includes('project_manager');
    
    if (!isManager) {
      res.status(400).json({ error: "Assigned user does not have manager role" });
      return;
    }

    // Update status to pending_manager_approval
    await db
      .update(procurementMaterialRequestsTable)
      .set({
        status: "pending_manager_approval",
        assignedManagerId: managerId,
        submittedAt: new Date(),
      })
      .where(eq(procurementMaterialRequestsTable.id, id));

    // Get the updated request details
    const [updated] = await db
      .select({
        mr: procurementMaterialRequestsTable,
        projectName: projectsTable.name,
        requestedByName: usersTable.name,
        managerName: sql<string>`manager.name`.as("managerName"),
      })
      .from(procurementMaterialRequestsTable)
      .leftJoin(projectsTable, eq(projectsTable.id, procurementMaterialRequestsTable.projectId))
      .leftJoin(usersTable, eq(usersTable.id, procurementMaterialRequestsTable.requestedById))
      .leftJoin(
        sql`users AS manager`,
        sql`manager.id = ${procurementMaterialRequestsTable.assignedManagerId}`
      )
      .where(eq(procurementMaterialRequestsTable.id, id))
      .limit(1);

    // Create notification for assigned manager
    await db.insert(procurementNotificationsTable).values({
      userId: managerId,
      notificationType: "material_request_submitted",
      title: "New Material Request Awaiting Approval",
      message: `Material Request ${mr.requestNumber} for "${mr.title}" requires your approval.`,
      resourceType: "material_request",
      resourceId: id,
      priority: "high",
    });

    res.json({
      ...fMaterialRequest(updated!.mr),
      projectName: updated!.projectName,
      requestedByName: updated!.requestedByName,
      managerName: updated!.managerName,
      message: "Material request submitted for manager approval",
    });
  } catch (error) {
    console.error("Error submitting material request:", error);
    res.status(500).json({ error: "Failed to submit material request" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// WORKFLOW - Approve Request
// ═══════════════════════════════════════════════════════════════════════════

// POST /api/procurement/material-requests/:id/approve - Manager approves request
router.post("/:id/approve", async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const me = await getCurrentUser(req);
    const { comments } = req.body ?? {};

    // Check if user is a manager
    const userRoles = typeof me.roles === 'string' ? JSON.parse(me.roles) : (me.roles ?? []);
    const isManager = userRoles.includes('admin') || userRoles.includes('project_manager');
    
    if (!isManager) {
      res.status(403).json({ error: "Access denied. Manager role required." });
      return;
    }

    // Get the material request
    const [mr] = await db
      .select()
      .from(procurementMaterialRequestsTable)
      .where(eq(procurementMaterialRequestsTable.id, id))
      .limit(1);

    if (!mr) {
      res.status(404).json({ error: "Material request not found" });
      return;
    }

    // Validate status
    if (mr.status !== "pending_manager_approval" && mr.status !== "draft" && mr.status !== "submitted") {
      res.status(400).json({ 
        error: "Only requests with pending_manager_approval status can be approved" 
      });
      return;
    }

    // Update status to approved
    await db
      .update(procurementMaterialRequestsTable)
      .set({
        status: "approved",
        approvedById: me.id,
        approvalDate: new Date(),
        approvalComments: comments || null,
      })
      .where(eq(procurementMaterialRequestsTable.id, id));

    // Create approval history record
    await db.insert(materialRequestApprovalHistoryTable).values({
      materialRequestId: id,
      managerId: me.id,
      action: "APPROVED",
      comments: comments || null,
      actionDate: new Date(),
    });

    // Get the updated request details
    const [updated] = await db
      .select({
        mr: procurementMaterialRequestsTable,
        projectName: projectsTable.name,
        requestedByName: usersTable.name,
      })
      .from(procurementMaterialRequestsTable)
      .leftJoin(projectsTable, eq(projectsTable.id, procurementMaterialRequestsTable.projectId))
      .leftJoin(usersTable, eq(usersTable.id, procurementMaterialRequestsTable.requestedById))
      .where(eq(procurementMaterialRequestsTable.id, id))
      .limit(1);

    // Create notification for requester
    if (updated!.mr.requestedById) {
      await db.insert(procurementNotificationsTable).values({
        userId: updated!.mr.requestedById,
        notificationType: "material_request_approved",
        title: "Material Request Approved",
        message: `Your material request "${updated!.mr.title}" (${updated!.mr.requestNumber}) has been approved by ${me.name}.${comments ? ` Comments: ${comments}` : ''}`,
        resourceType: "material_request",
        resourceId: id,
        priority: "normal",
      });
    }

    res.json({
      ...fMaterialRequest(updated!.mr),
      projectName: updated!.projectName,
      requestedByName: updated!.requestedByName,
      approvedByName: me.name,
      message: "Material request approved successfully",
    });
  } catch (error) {
    console.error("Error approving material request:", error);
    res.status(500).json({ error: "Failed to approve material request" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// WORKFLOW - Reject Request
// ═══════════════════════════════════════════════════════════════════════════

// POST /api/procurement/material-requests/:id/reject - Manager rejects request
router.post("/:id/reject", async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const me = await getCurrentUser(req);
    const { reason } = req.body ?? {};

    // Check if user is a manager
    const userRoles = typeof me.roles === 'string' ? JSON.parse(me.roles) : (me.roles ?? []);
    const isManager = userRoles.includes('admin') || userRoles.includes('project_manager');
    
    if (!isManager) {
      res.status(403).json({ error: "Access denied. Manager role required." });
      return;
    }

    // Validate rejection reason
    if (!reason || reason.trim() === '') {
      res.status(400).json({ error: "Rejection reason is required" });
      return;
    }

    // Get the material request
    const [mr] = await db
      .select()
      .from(procurementMaterialRequestsTable)
      .where(eq(procurementMaterialRequestsTable.id, id))
      .limit(1);

    if (!mr) {
      res.status(404).json({ error: "Material request not found" });
      return;
    }

    // Validate status
    if (mr.status !== "pending_manager_approval" && mr.status !== "draft" && mr.status !== "submitted") {
      res.status(400).json({ 
        error: "Only requests awaiting approval can be rejected" 
      });
      return;
    }

    // Update status to rejected
    await db
      .update(procurementMaterialRequestsTable)
      .set({
        status: "rejected",
        rejectedById: me.id,
        rejectionDate: new Date(),
        rejectionReason: reason,
      })
      .where(eq(procurementMaterialRequestsTable.id, id));

    // Create approval history record
    await db.insert(materialRequestApprovalHistoryTable).values({
      materialRequestId: id,
      managerId: me.id,
      action: "REJECTED",
      comments: reason,
      actionDate: new Date(),
    });

    // Get the updated request details
    const [updated] = await db
      .select({
        mr: procurementMaterialRequestsTable,
        projectName: projectsTable.name,
        requestedByName: usersTable.name,
      })
      .from(procurementMaterialRequestsTable)
      .leftJoin(projectsTable, eq(projectsTable.id, procurementMaterialRequestsTable.projectId))
      .leftJoin(usersTable, eq(usersTable.id, procurementMaterialRequestsTable.requestedById))
      .where(eq(procurementMaterialRequestsTable.id, id))
      .limit(1);

    // Create notification for requester
    if (updated!.mr.requestedById) {
      await db.insert(procurementNotificationsTable).values({
        userId: updated!.mr.requestedById,
        notificationType: "material_request_rejected",
        title: "Material Request Rejected",
        message: `Your material request "${updated!.mr.title}" (${updated!.mr.requestNumber}) has been rejected by ${me.name}. Reason: ${reason}`,
        resourceType: "material_request",
        resourceId: id,
        priority: "high",
      });
    }

    res.json({
      ...fMaterialRequest(updated!.mr),
      projectName: updated!.projectName,
      requestedByName: updated!.requestedByName,
      rejectedByName: me.name,
      message: "Material request rejected successfully",
    });
  } catch (error) {
    console.error("Error rejecting material request:", error);
    res.status(500).json({ error: "Failed to reject material request" });
  }
});

// GET /api/procurement/material-requests/:id/approval-history - Get approval history
router.get("/:id/approval-history", async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);

    // Check if material request exists
    const [mr] = await db
      .select()
      .from(procurementMaterialRequestsTable)
      .where(eq(procurementMaterialRequestsTable.id, id))
      .limit(1);

    if (!mr) {
      res.status(404).json({ error: "Material request not found" });
      return;
    }

    // Get approval history
    const history = await db
      .select({
        history: materialRequestApprovalHistoryTable,
        managerName: usersTable.name,
        managerEmail: usersTable.email,
      })
      .from(materialRequestApprovalHistoryTable)
      .leftJoin(usersTable, eq(usersTable.id, materialRequestApprovalHistoryTable.managerId))
      .where(eq(materialRequestApprovalHistoryTable.materialRequestId, id))
      .orderBy(desc(materialRequestApprovalHistoryTable.actionDate));

    res.json(
      history.map((h) => ({
        ...h.history,
        managerName: h.managerName,
        managerEmail: h.managerEmail,
      }))
    );
  } catch (error) {
    console.error("Error fetching approval history:", error);
    res.status(500).json({ error: "Failed to fetch approval history" });
  }
});

// GET /api/procurement/material-requests/:id/inventory-check - Check in-house stock availability for items
router.get("/:id/inventory-check", async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);

    const [mr] = await db
      .select()
      .from(procurementMaterialRequestsTable)
      .where(eq(procurementMaterialRequestsTable.id, id))
      .limit(1);

    if (!mr) {
      res.status(404).json({ error: "Material request not found" });
      return;
    }

    const items = await db
      .select()
      .from(procurementMaterialRequestItemsTable)
      .where(eq(procurementMaterialRequestItemsTable.materialRequestId, id));

    // Get all inventory items (project specific or general)
    const inventoryItems = await db
      .select()
      .from(procurementInventoryItemsTable);

    let allAvailable = items.length > 0;
    let anyAvailable = false;

    const itemChecks = items.map((item) => {
      const requestedQty = Number(item.quantity);
      
      // Match by exact or partial item name
      const matchedStock = inventoryItems.find((inv) => 
        inv.itemName.toLowerCase().trim() === item.itemName.toLowerCase().trim() ||
        inv.itemCode.toLowerCase() === item.itemName.toLowerCase() ||
        (inv.category && item.itemName.toLowerCase().includes(inv.itemName.toLowerCase()))
      );

      const availableQty = matchedStock ? Number(matchedStock.availableQuantity) : 0;
      const totalQty = matchedStock ? Number(matchedStock.totalQuantity) : 0;
      const inStock = availableQty >= requestedQty;
      const shortage = Math.max(0, requestedQty - availableQty);

      if (!inStock) allAvailable = false;
      if (availableQty > 0) anyAvailable = true;

      return {
        itemId: item.id,
        itemName: item.itemName,
        unit: item.unit,
        requestedQuantity: requestedQty,
        availableQuantity: availableQty,
        totalQuantity: totalQty,
        shortageQuantity: shortage,
        inStock,
        inventoryItemId: matchedStock ? matchedStock.id : null,
        itemCode: matchedStock ? matchedStock.itemCode : null,
      };
    });

    res.json({
      materialRequestId: id,
      requestNumber: mr.requestNumber,
      status: mr.status,
      allAvailableInHouse: allAvailable,
      hasPartialStock: anyAvailable,
      items: itemChecks,
    });
  } catch (error) {
    console.error("Error checking inventory for material request:", error);
    res.status(500).json({ error: "Failed to check inventory availability" });
  }
});

// POST /api/procurement/material-requests/:id/fulfill-inhouse - Fulfill request from in-house stock
router.post("/:id/fulfill-inhouse", async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const me = await getCurrentUser(req);
    const { comments } = req.body ?? {};

    const [mr] = await db
      .select()
      .from(procurementMaterialRequestsTable)
      .where(eq(procurementMaterialRequestsTable.id, id))
      .limit(1);

    if (!mr) {
      res.status(404).json({ error: "Material request not found" });
      return;
    }

    if (mr.status !== "approved" && mr.status !== "pending_manager_approval") {
      res.status(400).json({ 
        error: "Only approved material requests can be fulfilled from in-house inventory." 
      });
      return;
    }

    const items = await db
      .select()
      .from(procurementMaterialRequestItemsTable)
      .where(eq(procurementMaterialRequestItemsTable.materialRequestId, id));

    const inventoryItems = await db
      .select()
      .from(procurementInventoryItemsTable);

    // Process each item and deduct stock
    for (const item of items) {
      const requestedQty = Number(item.quantity);
      const matchedStock = inventoryItems.find((inv) => 
        inv.itemName.toLowerCase().trim() === item.itemName.toLowerCase().trim() ||
        inv.itemCode.toLowerCase() === item.itemName.toLowerCase() ||
        (inv.category && item.itemName.toLowerCase().includes(inv.itemName.toLowerCase()))
      );

      if (matchedStock) {
        const newAvailable = Math.max(0, Number(matchedStock.availableQuantity) - requestedQty);
        const newConsumed = Number(matchedStock.consumedQuantity) + requestedQty;

        // Update inventory record
        await db
          .update(procurementInventoryItemsTable)
          .set({
            availableQuantity: String(newAvailable),
            consumedQuantity: String(newConsumed),
          })
          .where(eq(procurementInventoryItemsTable.id, matchedStock.id));

        // Create transaction record
        const txNumber = await generateNumber("TX-ISSUE", procurementInventoryTransactionsTable);
        await db.insert(procurementInventoryTransactionsTable).values({
          transactionNumber: txNumber,
          inventoryItemId: matchedStock.id,
          projectId: mr.projectId,
          transactionType: "issue_to_project",
          quantity: String(requestedQty),
          unitPrice: matchedStock.averageCost,
          totalValue: String(requestedQty * Number(matchedStock.averageCost || 0)),
          balanceQuantity: String(newAvailable),
          createdById: me.id,
          notes: `Fulfilled for Material Request ${mr.requestNumber}`,
        });
      }
    }

    // Update Material Request to fulfilled
    await db
      .update(procurementMaterialRequestsTable)
      .set({
        status: "fulfilled",
        notes: mr.notes ? `${mr.notes}\n[Fulfilled In-House by ${me.name}]` : `Fulfilled In-House by ${me.name}`,
      })
      .where(eq(procurementMaterialRequestsTable.id, id));

    // Add approval/workflow history
    await db.insert(materialRequestApprovalHistoryTable).values({
      materialRequestId: id,
      managerId: me.id,
      action: "FULFILLED_INHOUSE",
      comments: comments || "Fulfilled and issued from in-house stock.",
      actionDate: new Date(),
    });

    // Notify requester
    if (mr.requestedById) {
      await db.insert(procurementNotificationsTable).values({
        userId: mr.requestedById,
        notificationType: "material_request_fulfilled",
        title: "Material Request Fulfilled (In-House)",
        message: `Your material request "${mr.title}" (${mr.requestNumber}) has been fulfilled from in-house stock and materials issued to project.`,
        resourceType: "material_request",
        resourceId: id,
        priority: "normal",
      });
    }

    res.json({
      success: true,
      message: "Material request fulfilled from in-house inventory successfully",
      status: "fulfilled",
    });
  } catch (error) {
    console.error("Error fulfilling material request in-house:", error);
    res.status(500).json({ error: "Failed to fulfill material request from in-house stock" });
  }
});

export default router;
