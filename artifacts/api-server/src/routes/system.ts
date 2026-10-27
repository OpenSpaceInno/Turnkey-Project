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
  await db
    .update(notificationsTable)
    .set({ isRead: true })
    .where(eq(notificationsTable.id, id));
  
  // MySQL doesn't support .returning() - query after update
  const [n] = await db
    .select()
    .from(notificationsTable)
    .where(eq(notificationsTable.id, id))
    .limit(1);
  
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

// Notification Preferences — per-user, per-channel & per-type toggles
router.get("/notifications/preferences", async (_req, res): Promise<void> => {
  const me = await getCurrentUser();
  let [row] = await db
    .select()
    .from(notificationPreferencesTable)
    .where(eq(notificationPreferencesTable.userId, me.id))
    .limit(1);
  if (!row) {
    await db
      .insert(notificationPreferencesTable)
      .values({ userId: me.id, preferences: {} });
    
    // MySQL doesn't support .returning() - query after insert
    [row] = await db
      .select()
      .from(notificationPreferencesTable)
      .where(eq(notificationPreferencesTable.userId, me.id))
      .limit(1);
  }
  res.json({ preferences: row.preferences as Record<string, any> });
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
    await db
      .insert(notificationPreferencesTable)
      .values({ userId: me.id, preferences: prefs });
    
    // MySQL doesn't support .returning() - query after insert
    const [row] = await db
      .select()
      .from(notificationPreferencesTable)
      .where(eq(notificationPreferencesTable.userId, me.id))
      .limit(1);
    
    res.json({ preferences: row.preferences as Record<string, any> });
    return;
  }
  await db
    .update(notificationPreferencesTable)
    .set({ preferences: prefs, updatedAt: new Date() })
    .where(eq(notificationPreferencesTable.userId, me.id));
  
  // MySQL doesn't support .returning() - query after update
  const [row] = await db
    .select()
    .from(notificationPreferencesTable)
    .where(eq(notificationPreferencesTable.userId, me.id))
    .limit(1);
  
  res.json({ preferences: row.preferences as Record<string, any> });
});

// Email Notification on Workflow Events — Endpoints
import {
  sendWorkflowEmail,
  sendTestWorkflowEmail,
  getWorkflowEmailLogs,
} from "../lib/email-service";

// POST /api/notifications/test-email - Trigger a sample workflow event email
router.post("/notifications/test-email", async (req, res): Promise<void> => {
  try {
    const me = await getCurrentUser();
    const { eventType = "ra_bill_submitted", toEmail } = req.body ?? {};
    const targetEmail = toEmail || me.email;

    if (!targetEmail) {
      res.status(400).json({ error: "Recipient email address is required" });
      return;
    }

    const result = await sendTestWorkflowEmail({
      toEmail: targetEmail,
      recipientName: me.name || "Kanak Team Member",
      eventType,
      userId: me.id,
    });

    res.json({
      success: true,
      message: `Test email dispatched to ${targetEmail} for event '${eventType}'`,
      details: result,
    });
  } catch (err: any) {
    console.error("Failed to send test email:", err);
    res.status(500).json({ error: err?.message || "Failed to send test email" });
  }
});

// GET /api/notifications/email-logs - Retrieve workflow email outbox / dispatch logs
router.get("/notifications/email-logs", async (req, res): Promise<void> => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;
    const eventType = req.query.eventType as string | undefined;
    const search = req.query.search as string | undefined;

    const logs = await getWorkflowEmailLogs({ limit, offset, eventType, search });
    res.json(logs);
  } catch (err: any) {
    console.error("Failed to retrieve email logs:", err);
    res.status(500).json({ error: "Failed to retrieve email logs" });
  }
});

// POST /api/notifications/send-email - Dispatch a workflow event email
router.post("/notifications/send-email", async (req, res): Promise<void> => {
  try {
    const me = await getCurrentUser();
    const {
      to,
      recipientName,
      eventType,
      subject,
      title,
      message,
      actionUrl,
      actionLabel,
      metadata,
      force,
    } = req.body ?? {};

    if (!to || !eventType || !subject || !title || !message) {
      res.status(400).json({
        error: "Missing required fields: to, eventType, subject, title, message",
      });
      return;
    }

    const result = await sendWorkflowEmail({
      to,
      recipientName: recipientName || undefined,
      userId: me.id,
      eventType,
      subject,
      title,
      message,
      actionUrl,
      actionLabel,
      metadata,
      force: Boolean(force),
    });

    res.json(result);
  } catch (err: any) {
    console.error("Failed to dispatch workflow email:", err);
    res.status(500).json({ error: err?.message || "Failed to dispatch email" });
  }
});

// Company Settings — singleton row (id = 1)
router.get("/settings/company", async (_req, res): Promise<void> => {
  let [row] = await db.select().from(companySettingsTable).where(eq(companySettingsTable.id, 1)).limit(1);
  if (!row) {
    await db.insert(companySettingsTable).values({ id: 1, companyName: "" });
    // MySQL doesn't support .returning() - query after insert
    [row] = await db.select().from(companySettingsTable).where(eq(companySettingsTable.id, 1)).limit(1);
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
  await db.update(companySettingsTable).set(update).where(eq(companySettingsTable.id, 1));
  
  // MySQL doesn't support .returning() - query after update
  const [updated] = await db.select().from(companySettingsTable).where(eq(companySettingsTable.id, 1)).limit(1);
  
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

// File upload endpoint
import { upload } from "../lib/upload";
import { extractDocumentContent } from "../lib/document-extractor";

router.post("/upload", upload.single("file"), async (req, res): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }
  
  // Return file information including the URL path and extracted data
  const fileUrl = `/uploads/${req.file.filename}`;
  let extractedData = null;
  try {
    extractedData = await extractDocumentContent(
      req.file.path,
      req.file.originalname,
      req.file.mimetype,
      req.file.size
    );
  } catch (err) {
    console.warn("Server document extraction error:", err);
  }

  res.status(201).json({
    fileName: req.file.originalname,
    fileType: req.file.mimetype,
    fileSize: req.file.size,
    fileUrl,
    uploadedAt: new Date().toISOString(),
    extractedData,
  });
});

export default router;
