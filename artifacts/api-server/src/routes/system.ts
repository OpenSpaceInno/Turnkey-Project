import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import {
  db,
  notificationsTable,
  auditLogsTable,
  usersTable,
  companySettingsTable,
  notificationPreferencesTable,
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

// Notification Preferences — per-user, per-type toggles
router.get("/notifications/preferences", async (_req, res): Promise<void> => {
  const me = await getCurrentUser();
  let [row] = await db
    .select()
    .from(notificationPreferencesTable)
    .where(eq(notificationPreferencesTable.userId, me.id))
    .limit(1);
  if (!row) {
    [row] = await db
      .insert(notificationPreferencesTable)
      .values({ userId: me.id, preferences: {} })
      .returning();
  }
  res.json({ preferences: row.preferences as Record<string, boolean> });
});

router.patch("/notifications/preferences", async (req, res): Promise<void> => {
  const me = await getCurrentUser();
  const prefs = (req.body ?? {}).preferences ?? {};
  const [existing] = await db
    .select({ id: notificationPreferencesTable.id })
    .from(notificationPreferencesTable)
    .where(eq(notificationPreferencesTable.userId, me.id))
    .limit(1);
  if (!existing) {
    const [row] = await db
      .insert(notificationPreferencesTable)
      .values({ userId: me.id, preferences: prefs })
      .returning();
    res.json({ preferences: row.preferences as Record<string, boolean> });
    return;
  }
  const [row] = await db
    .update(notificationPreferencesTable)
    .set({ preferences: prefs, updatedAt: new Date() })
    .where(eq(notificationPreferencesTable.userId, me.id))
    .returning();
  res.json({ preferences: row.preferences as Record<string, boolean> });
});

// Company Settings — singleton row (id = 1)
router.get("/settings/company", async (_req, res): Promise<void> => {
  let [row] = await db.select().from(companySettingsTable).where(eq(companySettingsTable.id, 1)).limit(1);
  if (!row) {
    [row] = await db.insert(companySettingsTable).values({ id: 1, companyName: "" }).returning();
  }
  res.json(row);
});

router.patch("/settings/company", async (req, res): Promise<void> => {
  const b = req.body ?? {};
  const allowed = ["companyName", "address", "city", "state", "country", "pincode", "currency", "gstNumber", "phone", "email", "website"];
  const update: Record<string, unknown> = { updatedAt: new Date() };
  for (const k of allowed) {
    if (b[k] !== undefined) update[k] = b[k];
  }
  let [row] = await db.select({ id: companySettingsTable.id }).from(companySettingsTable).where(eq(companySettingsTable.id, 1)).limit(1);
  if (!row) {
    await db.insert(companySettingsTable).values({ id: 1, companyName: "" });
  }
  const [updated] = await db.update(companySettingsTable).set(update).where(eq(companySettingsTable.id, 1)).returning();
  res.json(updated);
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
