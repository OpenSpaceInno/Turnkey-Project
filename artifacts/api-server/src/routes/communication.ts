import { Router, type IRouter } from "express";
import { eq, desc , sql} from "drizzle-orm";
import {
  db,
  communicationsTable,
  meetingsTable,
  documentsTable,
  projectsTable,
  usersTable,
} from "@workspace/db";
import { getCurrentUser } from "../lib/session";

const router: IRouter = Router();

router.get("/communications", async (req, res): Promise<void> => {
  const projectId = req.query.projectId
    ? parseInt(req.query.projectId as string, 10)
    : null;
  const baseQuery = db
    .select({ c: communicationsTable, p: projectsTable.name })
    .from(communicationsTable)
    .leftJoin(
      projectsTable,
      eq(projectsTable.id, communicationsTable.projectId),
    );
  const rows = projectId
    ? await baseQuery.where(eq(communicationsTable.projectId, projectId)).orderBy(desc(communicationsTable.communicationDate))
    : await baseQuery.orderBy(desc(communicationsTable.communicationDate));
  res.json(rows.map((r) => ({ ...r.c, projectName: r.p })));
});

router.post("/communications", async (req, res): Promise<void> => {
  const b = req.body ?? {};
  const me = await getCurrentUser();
  const result = await db
    .insert(communicationsTable)
    .values({
      projectId: b.projectId ?? null,
      stakeholderId: b.stakeholderId ?? null,
      communicationType: b.communicationType,
      subject: b.subject,
      content: b.content ?? null,
      communicationDate: new Date(b.communicationDate),
      participants: b.participants ?? null,
      createdById: me.id,
    });
  
  // MySQL returns insertId - use it to fetch the created record
  const insertId = Number(result[0].insertId);
  const [c] = await db
    .select()
    .from(communicationsTable)
    .where(eq(communicationsTable.id, insertId))
    .limit(1);
  
  res.status(201).json(c);
});

router.get("/meetings", async (req, res): Promise<void> => {
  const projectId = req.query.projectId
    ? parseInt(req.query.projectId as string, 10)
    : null;
  const baseQuery = db
    .select({ m: meetingsTable, p: projectsTable.name })
    .from(meetingsTable)
    .leftJoin(projectsTable, eq(projectsTable.id, meetingsTable.projectId));
  const rows = projectId
    ? await baseQuery.where(eq(meetingsTable.projectId, projectId)).orderBy(desc(meetingsTable.meetingDate))
    : await baseQuery.orderBy(desc(meetingsTable.meetingDate));
  res.json(
    rows.map((r) => {
      const start = r.m.meetingDate;
      const end = new Date(start.getTime() + r.m.duration * 60_000);
      return {
        ...r.m,
        projectName: r.p,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        meetingLink: null,
      };
    }),
  );
});

router.post("/meetings", async (req, res): Promise<void> => {
  const b = req.body ?? {};
  const me = await getCurrentUser();
  const result = await db
    .insert(meetingsTable)
    .values({
      projectId: b.projectId,
      title: b.title,
      meetingDate: new Date(b.meetingDate),
      duration: b.duration ?? 60,
      location: b.location ?? null,
      agenda: b.agenda ?? null,
      minutes: b.minutes ?? null,
      participants: b.participants ?? null,
      createdById: me.id,
    });
  
  // MySQL returns insertId - use it to fetch the created record
  const insertId = Number(result[0].insertId);
  const [m] = await db
    .select()
    .from(meetingsTable)
    .where(eq(meetingsTable.id, insertId))
    .limit(1);
  
  res.status(201).json(m);
});

router.patch("/meetings/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  const b = req.body ?? {};
  const update: Record<string, unknown> = {};
  for (const k of [
    "title",
    "duration",
    "location",
    "agenda",
    "minutes",
    "participants",
  ]) {
    if (b[k] !== undefined) update[k] = b[k];
  }
  if (b.meetingDate !== undefined)
    update.meetingDate = new Date(b.meetingDate);
  
  await db
    .update(meetingsTable)
    .set(update)
    .where(eq(meetingsTable.id, id));
  
  // MySQL doesn't support .returning() - query after update
  const [m] = await db
    .select()
    .from(meetingsTable)
    .where(eq(meetingsTable.id, id))
    .limit(1);
  
  if (!m) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(m);
});

router.get("/documents", async (req, res): Promise<void> => {
  const projectId = req.query.projectId
    ? parseInt(req.query.projectId as string, 10)
    : null;
  const baseQuery = db
    .select({
      d: documentsTable,
      p: projectsTable.name,
      u: usersTable.name,
    })
    .from(documentsTable)
    .leftJoin(projectsTable, eq(projectsTable.id, documentsTable.projectId))
    .leftJoin(usersTable, eq(usersTable.id, documentsTable.uploadedById));
  const rows = projectId
    ? await baseQuery.where(eq(documentsTable.projectId, projectId)).orderBy(desc(documentsTable.uploadedAt))
    : await baseQuery.orderBy(desc(documentsTable.uploadedAt));
  res.json(
    rows.map((r) => ({
      ...r.d,
      projectName: r.p,
      uploadedByName: r.u,
      title: r.d.fileName,
      createdAt: r.d.uploadedAt.toISOString(),
    })),
  );
});

router.post("/documents", async (req, res): Promise<void> => {
  const b = req.body ?? {};
  const projectId = parseInt((b.projectId || req.params.projectId) as string, 10);
  if (!projectId) {
    res.status(400).json({ error: "projectId required" });
    return;
  }
  const fileName = (b.fileName || b.name || "").toString().trim() || "Untitled Document";
  const me = await getCurrentUser();
  const result = await db
    .insert(documentsTable)
    .values({
      projectId,
      fileName,
      fileType: b.fileType ? String(b.fileType).slice(0, 64) : null,
      fileSize: b.fileSize != null && !isNaN(Number(b.fileSize)) ? Number(b.fileSize) : null,
      fileUrl: b.fileUrl ? String(b.fileUrl) : null,
      category: b.category ?? "general",
      version: b.version ? Number(b.version) || 1 : 1,
      status: b.status ?? "active",
      uploadedById: me.id,
    });
  
  // MySQL returns insertId - use it to fetch the created record
  const insertId = Number(result[0].insertId);
  const [d] = await db
    .select()
    .from(documentsTable)
    .where(eq(documentsTable.id, insertId))
    .limit(1);
  
  res.status(201).json({
    ...d,
    title: d?.fileName,
    createdAt: d?.uploadedAt.toISOString(),
    uploadedByName: me.name,
  });
});

router.delete("/documents/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  if (!id) {
    res.status(400).json({ error: "id required" });
    return;
  }
  await db.delete(documentsTable).where(eq(documentsTable.id, id));
  res.sendStatus(204);
});

export default router;
