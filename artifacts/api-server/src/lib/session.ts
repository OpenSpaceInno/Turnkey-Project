import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import type { Request } from "express";
import { ROLE_PERMISSIONS } from "./permissions";

export type CurrentUser = {
  id: number;
  email: string;
  name: string;
  avatarUrl: string | null;
  roles: string[];
  activeRole: string;
  organizationId: number;
  permissions: string[];
};

// Store per-request to avoid cross-request caching issues
const requestUserCache = new WeakMap<Request, CurrentUser>();

export async function getCurrentUser(req?: Request): Promise<CurrentUser> {
  // If request object provided, check request-scoped cache first
  if (req && requestUserCache.has(req)) {
    return requestUserCache.get(req)!;
  }
  
  // Get userId from session
  const userId = req?.session?.userId;
  
  if (userId) {
    // Get user from database by session userId
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);
    
    if (user) {
      return parseUser(user, req);
    }
  }
  
  // Fallback to first user from DB
  const [fallbackUser] = await db.select().from(usersTable).limit(1);
  if (fallbackUser) {
    return parseUser(fallbackUser, req);
  }

  return {
    id: 1,
    email: "admin@kanak.com",
    name: "Admin User",
    avatarUrl: null,
    roles: ["project_manager", "admin"],
    activeRole: "project_manager",
    organizationId: 1,
    permissions: ROLE_PERMISSIONS.project_manager || [],
  };
}

function parseUser(user: any, req?: Request): CurrentUser {
  // Parse roles if it's a string (MySQL JSON column might return as string)
  let roles: string[] = [];
  if (typeof user.roles === 'string') {
    try {
      roles = JSON.parse(user.roles);
    } catch {
      roles = [];
    }
  } else if (Array.isArray(user.roles)) {
    roles = user.roles;
  }
  
  const activeRole = user.activeRole || "viewer";
  const permissions = ROLE_PERMISSIONS[activeRole] || ROLE_PERMISSIONS.viewer || [];

  const currentUser: CurrentUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl ?? null,
    roles: roles,
    activeRole: activeRole,
    organizationId: user.organizationId ?? 1,
    permissions: permissions,
  };
  
  // Cache in request if provided
  if (req) {
    requestUserCache.set(req, currentUser);
  }
  
  return currentUser;
}

export async function setActiveRole(role: string, req?: Request): Promise<CurrentUser> {
  const current = await getCurrentUser(req);
  
  // Validate that the user has this role
  if (!current.roles.includes(role)) {
    throw new Error(`User does not have the role: ${role}`);
  }
  
  await db
    .update(usersTable)
    .set({ activeRole: role })
    .where(eq(usersTable.id, current.id));
  
  const updatedUser = { ...current, activeRole: role };
  
  // Update request cache if provided
  if (req) {
    requestUserCache.set(req, updatedUser);
  }
  
  return updatedUser;
}

export function clearUserCache(req?: Request) {
  // Clear request-specific cache
  if (req) {
    requestUserCache.delete(req);
  }
  // Note: WeakMap automatically clears when request objects are garbage collected
}
