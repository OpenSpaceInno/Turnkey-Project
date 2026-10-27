import { Router, type IRouter } from "express";
import { eq, desc, and, sql } from "drizzle-orm";
import { db, procurementNotificationsTable } from "@workspace/db";
import { numKeys } from "../lib/transforms";
import { getCurrentUser } from "../lib/session";

const router: IRouter = Router();

// Transform numeric fields
const fNotification = (r: Record<string, unknown>) =>
  numKeys(r, ["userId", "resourceId"]);

// ═══════════════════════════════════════════════════════════════════════════
// PROCUREMENT NOTIFICATIONS - List & Read
// ═══════════════════════════════════════════════════════════════════════════

// GET /api/procurement/notifications - Get notifications for current user
router.get("/", async (req, res): Promise<void> => {
  try {
    const me = await getCurrentUser();
    const { isRead, notificationType, limit } = req.query;

    let query = db
      .select()
      .from(procurementNotificationsTable)
      .where(eq(procurementNotificationsTable.userId, me.id))
      .$dynamic();

    const conditions = [eq(procurementNotificationsTable.userId, me.id)];

    if (isRead !== undefined) {
      conditions.push(eq(procurementNotificationsTable.isRead, isRead === "true"));
    }

    if (notificationType) {
      conditions.push(eq(procurementNotificationsTable.notificationType, String(notificationType)));
    }

    if (conditions.length > 1) {
      query = query.where(and(...conditions));
    }

    let orderedQuery = query.orderBy(desc(procurementNotificationsTable.createdAt));

    if (limit) {
      orderedQuery = orderedQuery.limit(Number(limit));
    }

    const rows = await orderedQuery;

    res.json(rows.map(fNotification));
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// MARK AS READ
// ═══════════════════════════════════════════════════════════════════════════

// PUT /api/procurement/notifications/:id/read - Mark notification as read
router.put("/:id/read", async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const me = await getCurrentUser();

    // Check if notification belongs to current user
    const [notification] = await db
      .select()
      .from(procurementNotificationsTable)
      .where(eq(procurementNotificationsTable.id, id))
      .limit(1);

    if (!notification) {
      res.status(404).json({ error: "Notification not found" });
      return;
    }

    if (notification.userId !== me.id) {
      res.status(403).json({ error: "Unauthorized" });
      return;
    }

    // Mark as read
    await db
      .update(procurementNotificationsTable)
      .set({
        isRead: true,
        readAt: new Date(),
      })
      .where(eq(procurementNotificationsTable.id, id));

    const [updated] = await db
      .select()
      .from(procurementNotificationsTable)
      .where(eq(procurementNotificationsTable.id, id))
      .limit(1);

    res.json(fNotification(updated!));
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// MARK ALL AS READ
// ═══════════════════════════════════════════════════════════════════════════

// PUT /api/procurement/notifications/read-all - Mark all notifications as read
router.put("/read-all", async (req, res): Promise<void> => {
  try {
    const me = await getCurrentUser();

    await db
      .update(procurementNotificationsTable)
      .set({
        isRead: true,
        readAt: new Date(),
      })
      .where(
        and(
          eq(procurementNotificationsTable.userId, me.id),
          eq(procurementNotificationsTable.isRead, false)
        )
      );

    // Get count of updated notifications
    const [result] = await db
      .select({
        count: sql<number>`COUNT(*)`.as("count"),
      })
      .from(procurementNotificationsTable)
      .where(
        and(
          eq(procurementNotificationsTable.userId, me.id),
          eq(procurementNotificationsTable.isRead, true)
        )
      );

    res.json({
      message: "All notifications marked as read",
      count: Number(result?.count ?? 0),
    });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({ error: "Failed to mark all notifications as read" });
  }
});

export default router;
