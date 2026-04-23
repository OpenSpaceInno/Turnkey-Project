import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import {
  db,
  notificationsTable,
  auditLogsTable,
  usersTable,
} from "@workspace/db";
import { getCurrentUser } from "../lib/session";

const router: IRouter = Router();

router.get("/notifications", async (_req, res): Promise<void> => {
  const me = await getCurrentUser();
  const rows = await db
    .select()
    .from(notificationsTable)
    .where(eq(notificationsTable.userId, me.id))
    .orderBy(desc(notificationsTable.createdAt));
  res.json(rows);
});

router.post("/notifications/:id/read", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  const [n] = await db
    .update(notificationsTable)
    .set({ isRead: true })
    .where(eq(notificationsTable.id, id))
    .returning();
  if (!n) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(n);
});

router.post("/notifications/clear", async (_req, res): Promise<void> => {
  const me = await getCurrentUser();
  await db
    .update(notificationsTable)
    .set({ isRead: true })
    .where(eq(notificationsTable.userId, me.id));
  res.sendStatus(204);
});

router.get("/audit-logs", async (_req, res): Promise<void> => {
  const rows = await db
    .select({ a: auditLogsTable, u: usersTable.name })
    .from(auditLogsTable)
    .leftJoin(usersTable, eq(usersTable.id, auditLogsTable.userId))
    .orderBy(desc(auditLogsTable.createdAt))
    .limit(200);
  res.json(rows.map((r) => ({ ...r.a, userName: r.u })));
});

export default router;
