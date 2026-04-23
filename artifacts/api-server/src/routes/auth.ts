import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { getCurrentUser, setActiveRole, clearUserCache } from "../lib/session";

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

export default router;
