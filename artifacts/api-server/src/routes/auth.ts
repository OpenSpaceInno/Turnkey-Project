import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { getCurrentUser, setActiveRole, clearUserCache } from "../lib/session";

const VALID_ROLES = [
  "admin",
  "project_manager",
  "engineer",
  "accountant",
  "procurement_officer",
  "viewer",
] as const;

const router: IRouter = Router();

router.get("/auth/me", async (_req, res): Promise<void> => {
  const user = await getCurrentUser();
  res.json(user);
});

router.post("/auth/switch-role", async (req, res): Promise<void> => {
  const role = (req.body?.role ?? "").toString();
  if (!role) {
    res.status(400).json({ error: "role required" });
    return;
  }
  const user = await setActiveRole(role);
  res.json(user);
});

router.get("/users", async (_req, res): Promise<void> => {
  const users = await db.select().from(usersTable).orderBy(usersTable.id);
  res.json(
    users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      avatarUrl: u.avatarUrl,
      roles: u.roles ?? [],
      activeRole: u.activeRole,
    })),
  );
});

router.patch("/users/:id/roles", async (req, res): Promise<void> => {
  const id = parseInt(
    Array.isArray(req.params.id) ? req.params.id[0]! : req.params.id!,
    10,
  );
  const roles: string[] = Array.isArray(req.body?.roles) ? req.body.roles : [];
  const [user] = await db
    .update(usersTable)
    .set({ roles })
    .where(eq(usersTable.id, id))
    .returning();
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  clearUserCache();
  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    roles: user.roles ?? [],
    activeRole: user.activeRole,
  });
});

// POST /users — create a new user
router.post("/users", async (req, res): Promise<void> => {
  const { name, email, roles, avatarUrl } = req.body ?? {};
  if (!name || !email) {
    res.status(400).json({ error: "name and email are required" });
    return;
  }
  const sanitisedRoles: string[] = Array.isArray(roles)
    ? roles.filter((r: string) => VALID_ROLES.includes(r as typeof VALID_ROLES[number]))
    : ["viewer"];

  try {
    const [user] = await db
      .insert(usersTable)
      .values({
        name: name.toString(),
        email: email.toString(),
        roles: sanitisedRoles,
        avatarUrl: avatarUrl ? avatarUrl.toString() : null,
        activeRole: sanitisedRoles[0] ?? "viewer",
      })
      .returning();
    res.status(201).json({
      id: user!.id,
      email: user!.email,
      name: user!.name,
      avatarUrl: user!.avatarUrl,
      roles: user!.roles ?? [],
      activeRole: user!.activeRole,
    });
  } catch (err: any) {
    if (err?.code === "23505") {
      res.status(409).json({ error: "A user with that email already exists" });
    } else {
      throw err;
    }
  }
});

// PATCH /users/:id — update name / email / avatarUrl
router.patch("/users/:id", async (req, res): Promise<void> => {
  const id = parseInt(
    Array.isArray(req.params.id) ? req.params.id[0]! : req.params.id!,
    10,
  );
  const updates: Partial<{ name: string; email: string; avatarUrl: string }> = {};
  if (req.body?.name !== undefined) updates.name = req.body.name.toString();
  if (req.body?.email !== undefined) updates.email = req.body.email.toString();
  if (req.body?.avatarUrl !== undefined) updates.avatarUrl = req.body.avatarUrl.toString();

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: "Nothing to update" });
    return;
  }

  try {
    const [user] = await db
      .update(usersTable)
      .set(updates)
      .where(eq(usersTable.id, id))
      .returning();
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    clearUserCache();
    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      roles: user.roles ?? [],
      activeRole: user.activeRole,
    });
  } catch (err: any) {
    if (err?.code === "23505") {
      res.status(409).json({ error: "A user with that email already exists" });
    } else {
      throw err;
    }
  }
});

// DELETE /users/:id
router.delete("/users/:id", async (req, res): Promise<void> => {
  const id = parseInt(
    Array.isArray(req.params.id) ? req.params.id[0]! : req.params.id!,
    10,
  );
  const [deleted] = await db
    .delete(usersTable)
    .where(eq(usersTable.id, id))
    .returning();
  if (!deleted) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  clearUserCache();
  res.status(204).send();
});

export default router;
