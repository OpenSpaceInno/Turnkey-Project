import { Router, type IRouter } from "express";
import { eq, desc, and, sql } from "drizzle-orm";
import {
  db,
  roleSwitchRequestsTable,
  usersTable,
  auditLogsTable,
} from "@workspace/db";
import { numKeys } from "../lib/transforms";
import { getCurrentUser } from "../lib/session";

const router: IRouter = Router();

// Transform numeric fields
const fRoleSwitchRequest = (r: Record<string, unknown>) =>
  numKeys(r, ["userId", "reviewedById"]);

// ═══════════════════════════════════════════════════════════════════════════
// AUTHORIZATION MIDDLEWARE - PROJECT MANAGER ONLY
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Middleware to ensure ONLY Project Managers can access the route
 * This is STRICTLY enforced - even admins need project_manager role
 */
const projectManagerOnly = async (req: any, res: any, next: any) => {
  try {
    const me = await getCurrentUser(req);
    
    // Parse roles (handle both string and array formats)
    const userRoles = typeof me.roles === 'string' 
      ? JSON.parse(me.roles) 
      : (me.roles ?? []);
    
    // Check if user has project_manager role
    if (!userRoles.includes('project_manager')) {
      res.status(403).json({ 
        error: "Unauthorized Access",
        message: "Only Project Managers can approve or reject role switch requests" 
      });
      return;
    }
    
    next();
  } catch (error) {
    console.error("Authorization error:", error);
    res.status(403).json({ 
      error: "Unauthorized Access",
      message: "Authentication required" 
    });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// ROLE SWITCH REQUESTS - Create & List
// ═══════════════════════════════════════════════════════════════════════════

// POST /api/role-switch-requests - Create new role switch request
router.post("/", async (req, res): Promise<void> => {
  try {
    const me = await getCurrentUser(req);
    const { requestedRole, reason } = req.body ?? {};

    // Validate requested role
    const validRoles = ['admin', 'project_manager', 'engineer', 'accountant', 'procurement_officer', 'viewer'];
    if (!requestedRole || !validRoles.includes(requestedRole)) {
      res.status(400).json({ 
        error: "Invalid requested role. Must be one of: " + validRoles.join(", ") 
      });
      return;
    }

    // Validate reason is provided
    if (!reason || reason.trim() === '') {
      res.status(400).json({ error: "Reason is required for role switch request" });
      return;
    }

    // Check if user already has this role
    const userRoles = typeof me.roles === 'string' ? JSON.parse(me.roles) : (me.roles ?? []);
    if (userRoles.includes(requestedRole)) {
      res.status(400).json({ error: `You already have the ${requestedRole} role` });
      return;
    }

    // Check if there's already a pending request for this role
    const [existingPending] = await db
      .select()
      .from(roleSwitchRequestsTable)
      .where(
        and(
          eq(roleSwitchRequestsTable.userId, me.id),
          eq(roleSwitchRequestsTable.requestedRole, requestedRole),
          eq(roleSwitchRequestsTable.status, "pending")
        )
      )
      .limit(1);

    if (existingPending) {
      res.status(400).json({ 
        error: `You already have a pending request for the ${requestedRole} role` 
      });
      return;
    }

    // Create role switch request
    await db.insert(roleSwitchRequestsTable).values({
      userId: me.id,
      currentRole: me.activeRole,
      requestedRole,
      reason,
      status: "pending",
      requestedAt: new Date(),
    });

    // Get the created request
    const [created] = await db
      .select({
        request: roleSwitchRequestsTable,
        userName: usersTable.name,
        userEmail: usersTable.email,
      })
      .from(roleSwitchRequestsTable)
      .leftJoin(usersTable, eq(usersTable.id, roleSwitchRequestsTable.userId))
      .where(
        and(
          eq(roleSwitchRequestsTable.userId, me.id),
          eq(roleSwitchRequestsTable.requestedRole, requestedRole)
        )
      )
      .orderBy(desc(roleSwitchRequestsTable.createdAt))
      .limit(1);

    res.status(201).json({
      ...fRoleSwitchRequest(created!.request),
      userName: created!.userName,
      userEmail: created!.userEmail,
    });
  } catch (error) {
    console.error("Error creating role switch request:", error);
    res.status(500).json({ error: "Failed to create role switch request" });
  }
});

// GET /api/role-switch-requests/my-requests - Get current user's requests
router.get("/my-requests", async (req, res): Promise<void> => {
  try {
    const me = await getCurrentUser(req);

    const requests = await db
      .select({
        request: roleSwitchRequestsTable,
        reviewerName: usersTable.name,
      })
      .from(roleSwitchRequestsTable)
      .leftJoin(usersTable, eq(usersTable.id, roleSwitchRequestsTable.reviewedById))
      .where(eq(roleSwitchRequestsTable.userId, me.id))
      .orderBy(desc(roleSwitchRequestsTable.createdAt));

    res.json(
      requests.map((r) => ({
        ...fRoleSwitchRequest(r.request),
        reviewerName: r.reviewerName,
      }))
    );
  } catch (error) {
    console.error("Error fetching user requests:", error);
    res.status(500).json({ error: "Failed to fetch requests" });
  }
});

// GET /api/role-switch-requests/pending - Get pending requests (Project Manager ONLY)
router.get("/pending", projectManagerOnly, async (req, res): Promise<void> => {
  try {
    const requests = await db
      .select({
        request: roleSwitchRequestsTable,
        userName: usersTable.name,
        userEmail: usersTable.email,
      })
      .from(roleSwitchRequestsTable)
      .leftJoin(usersTable, eq(usersTable.id, roleSwitchRequestsTable.userId))
      .where(eq(roleSwitchRequestsTable.status, "pending"))
      .orderBy(roleSwitchRequestsTable.requestedAt);

    res.json(
      requests.map((r) => ({
        ...fRoleSwitchRequest(r.request),
        userName: r.userName,
        userEmail: r.userEmail,
      }))
    );
  } catch (error) {
    console.error("Error fetching pending requests:", error);
    res.status(500).json({ error: "Failed to fetch pending requests" });
  }
});

// GET /api/role-switch-requests - List all requests (Project Manager ONLY)
router.get("/", projectManagerOnly, async (req, res): Promise<void> => {
  try {
    const { status, userId } = req.query;

    let query = db
      .select({
        request: roleSwitchRequestsTable,
        userName: usersTable.name,
        userEmail: usersTable.email,
        reviewerName: sql<string>`reviewer.name`.as("reviewerName"),
      })
      .from(roleSwitchRequestsTable)
      .leftJoin(usersTable, eq(usersTable.id, roleSwitchRequestsTable.userId))
      .leftJoin(
        sql`users AS reviewer`,
        sql`reviewer.id = ${roleSwitchRequestsTable.reviewedById}`
      )
      .$dynamic();

    // Apply filters
    const conditions = [];
    if (status) {
      conditions.push(eq(roleSwitchRequestsTable.status, String(status)));
    }
    if (userId) {
      conditions.push(eq(roleSwitchRequestsTable.userId, Number(userId)));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const requests = await query.orderBy(desc(roleSwitchRequestsTable.createdAt));

    res.json(
      requests.map((r) => ({
        ...fRoleSwitchRequest(r.request),
        userName: r.userName,
        userEmail: r.userEmail,
        reviewerName: r.reviewerName,
      }))
    );
  } catch (error) {
    console.error("Error fetching requests:", error);
    res.status(500).json({ error: "Failed to fetch requests" });
  }
});

// GET /api/role-switch-requests/:id - Get single request
router.get("/:id", async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const me = await getCurrentUser(req);

    const [request] = await db
      .select({
        request: roleSwitchRequestsTable,
        userName: usersTable.name,
        userEmail: usersTable.email,
        reviewerName: sql<string>`reviewer.name`.as("reviewerName"),
      })
      .from(roleSwitchRequestsTable)
      .leftJoin(usersTable, eq(usersTable.id, roleSwitchRequestsTable.userId))
      .leftJoin(
        sql`users AS reviewer`,
        sql`reviewer.id = ${roleSwitchRequestsTable.reviewedById}`
      )
      .where(eq(roleSwitchRequestsTable.id, id))
      .limit(1);

    if (!request) {
      res.status(404).json({ error: "Request not found" });
      return;
    }

    // Check authorization - request owner or project manager
    const userRoles = typeof me.roles === 'string' ? JSON.parse(me.roles) : (me.roles ?? []);
    const isProjectManager = userRoles.includes('project_manager');
    const isOwner = request.request.userId === me.id;

    if (!isOwner && !isProjectManager) {
      res.status(403).json({ 
        error: "Unauthorized Access",
        message: "You can only view your own requests" 
      });
      return;
    }

    res.json({
      ...fRoleSwitchRequest(request.request),
      userName: request.userName,
      userEmail: request.userEmail,
      reviewerName: request.reviewerName,
    });
  } catch (error) {
    console.error("Error fetching request:", error);
    res.status(500).json({ error: "Failed to fetch request" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// ROLE SWITCH REQUESTS - Approve (PROJECT MANAGER ONLY)
// ═══════════════════════════════════════════════════════════════════════════

// POST /api/role-switch-requests/:id/approve - Approve request (PROJECT MANAGER ONLY)
router.post("/:id/approve", projectManagerOnly, async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const me = await getCurrentUser(req);
    const { comments } = req.body ?? {};

    // Get the request
    const [request] = await db
      .select()
      .from(roleSwitchRequestsTable)
      .where(eq(roleSwitchRequestsTable.id, id))
      .limit(1);

    if (!request) {
      res.status(404).json({ error: "Request not found" });
      return;
    }

    // Validate status
    if (request.status !== "pending") {
      res.status(400).json({ 
        error: `Cannot approve request with status: ${request.status}. Only pending requests can be approved.` 
      });
      return;
    }

    // Get the user
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, request.userId))
      .limit(1);

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Add the new role to user's roles
    const userRoles = typeof user.roles === 'string' ? JSON.parse(user.roles) : (user.roles ?? []);
    if (!userRoles.includes(request.requestedRole)) {
      userRoles.push(request.requestedRole);
      
      await db
        .update(usersTable)
        .set({ roles: JSON.stringify(userRoles) })
        .where(eq(usersTable.id, request.userId));
    }

    // Update request status to approved
    await db
      .update(roleSwitchRequestsTable)
      .set({
        status: "approved",
        reviewedById: me.id,
        reviewedAt: new Date(),
        reviewComments: comments || null,
      })
      .where(eq(roleSwitchRequestsTable.id, id));

    // Create audit log
    await db.insert(auditLogsTable).values({
      userId: me.id,
      activity: "ROLE_SWITCH_REQUEST_APPROVED",
      resourceType: "role_switch_request",
      resourceId: id,
      ipAddress: req.ip || null,
      status: "success",
      metadata: JSON.stringify({
        requestUserId: request.userId,
        requestUserName: user.name,
        currentRole: request.currentRole,
        requestedRole: request.requestedRole,
        approvedBy: me.name,
        approvedById: me.id,
        comments,
        approvedAt: new Date(),
      }),
    });

    // Get updated request
    const [updated] = await db
      .select({
        request: roleSwitchRequestsTable,
        userName: usersTable.name,
        userEmail: usersTable.email,
      })
      .from(roleSwitchRequestsTable)
      .leftJoin(usersTable, eq(usersTable.id, roleSwitchRequestsTable.userId))
      .where(eq(roleSwitchRequestsTable.id, id))
      .limit(1);

    res.json({
      ...fRoleSwitchRequest(updated!.request),
      userName: updated!.userName,
      userEmail: updated!.userEmail,
      reviewerName: me.name,
      message: "Role switch request approved successfully",
    });
  } catch (error) {
    console.error("Error approving request:", error);
    res.status(500).json({ error: "Failed to approve request" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// ROLE SWITCH REQUESTS - Reject (PROJECT MANAGER ONLY)
// ═══════════════════════════════════════════════════════════════════════════

// POST /api/role-switch-requests/:id/reject - Reject request (PROJECT MANAGER ONLY)
router.post("/:id/reject", projectManagerOnly, async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const me = await getCurrentUser(req);
    const { comments } = req.body ?? {};

    // Validate rejection comments are provided
    if (!comments || comments.trim() === '') {
      res.status(400).json({ error: "Rejection comments are required" });
      return;
    }

    // Get the request
    const [request] = await db
      .select()
      .from(roleSwitchRequestsTable)
      .where(eq(roleSwitchRequestsTable.id, id))
      .limit(1);

    if (!request) {
      res.status(404).json({ error: "Request not found" });
      return;
    }

    // Validate status
    if (request.status !== "pending") {
      res.status(400).json({ 
        error: `Cannot reject request with status: ${request.status}. Only pending requests can be rejected.` 
      });
      return;
    }

    // Get the user
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, request.userId))
      .limit(1);

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Update request status to rejected
    await db
      .update(roleSwitchRequestsTable)
      .set({
        status: "rejected",
        reviewedById: me.id,
        reviewedAt: new Date(),
        reviewComments: comments,
      })
      .where(eq(roleSwitchRequestsTable.id, id));

    // Create audit log
    await db.insert(auditLogsTable).values({
      userId: me.id,
      activity: "ROLE_SWITCH_REQUEST_REJECTED",
      resourceType: "role_switch_request",
      resourceId: id,
      ipAddress: req.ip || null,
      status: "success",
      metadata: JSON.stringify({
        requestUserId: request.userId,
        requestUserName: user.name,
        currentRole: request.currentRole,
        requestedRole: request.requestedRole,
        rejectedBy: me.name,
        rejectedById: me.id,
        comments,
        rejectedAt: new Date(),
      }),
    });

    // Get updated request
    const [updated] = await db
      .select({
        request: roleSwitchRequestsTable,
        userName: usersTable.name,
        userEmail: usersTable.email,
      })
      .from(roleSwitchRequestsTable)
      .leftJoin(usersTable, eq(usersTable.id, roleSwitchRequestsTable.userId))
      .where(eq(roleSwitchRequestsTable.id, id))
      .limit(1);

    res.json({
      ...fRoleSwitchRequest(updated!.request),
      userName: updated!.userName,
      userEmail: updated!.userEmail,
      reviewerName: me.name,
      message: "Role switch request rejected successfully",
    });
  } catch (error) {
    console.error("Error rejecting request:", error);
    res.status(500).json({ error: "Failed to reject request" });
  }
});

export default router;
