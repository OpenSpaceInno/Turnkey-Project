import { Router, type IRouter, type Request, type Response } from "express";
import { db, financialAuditLogsTable, usersTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";

const router: IRouter = Router();

// Helper to log financial audit event
export async function logFinancialAudit(params: {
  workflowType: "AR" | "AP";
  entityType: string;
  entityId: number;
  action: string;
  previousStatus?: string | null;
  newStatus: string;
  userId: number;
  userName?: string;
  comments?: string;
  metadata?: Record<string, any>;
}) {
  try {
    let name = params.userName;
    if (!name && params.userId) {
      const [u] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, params.userId)).limit(1);
      if (u) name = u.name;
    }

    await db.insert(financialAuditLogsTable).values({
      workflowType: params.workflowType,
      entityType: params.entityType,
      entityId: params.entityId,
      action: params.action,
      previousStatus: params.previousStatus || null,
      newStatus: params.newStatus,
      userId: params.userId,
      userName: name || "System User",
      comments: params.comments || null,
      metadata: params.metadata ? JSON.stringify(params.metadata) : null,
    });
  } catch (err) {
    console.error("Failed to write financial audit log:", err);
  }
}

// GET /api/financial-audit - Query audit logs for AR, AP, or Expenses
router.get("/financial-audit", async (req: Request, res: Response): Promise<void> => {
  try {
    const { workflowType, entityType, entityId, projectId } = req.query;

    let conditions: any[] = [];
    if (workflowType && typeof workflowType === "string" && workflowType.toUpperCase() !== "ALL") {
      conditions.push(eq(financialAuditLogsTable.workflowType, workflowType.toUpperCase()));
    }
    if (entityType && typeof entityType === "string") {
      conditions.push(eq(financialAuditLogsTable.entityType, entityType));
    }
    if (entityId) {
      conditions.push(eq(financialAuditLogsTable.entityId, Number(entityId)));
    }

    const query = db.select().from(financialAuditLogsTable);
    const rows = conditions.length > 0
      ? await query.where(and(...conditions)).orderBy(desc(financialAuditLogsTable.createdAt)).limit(200)
      : await query.orderBy(desc(financialAuditLogsTable.createdAt)).limit(200);

    const parsed = rows.map(r => ({
      ...r,
      metadata: typeof r.metadata === "string" ? JSON.parse(r.metadata) : r.metadata,
    }));

    if (projectId) {
      const pId = Number(projectId);
      const filtered = parsed.filter(r => {
        const meta = r.metadata;
        if (!meta) return false;
        return Number(meta.projectId) === pId || Number(meta.project_id) === pId;
      });
      res.json(filtered);
      return;
    }

    res.json(parsed);
  } catch (error: any) {
    console.error("Error fetching financial audit logs:", error);
    res.status(500).json({ error: "Failed to fetch financial audit logs" });
  }
});

export default router;
