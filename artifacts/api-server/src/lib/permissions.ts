import { db, projectAssignmentsTable, userPermissionOverridesTable } from "@workspace/db";
import { and, eq } from "drizzle-orm";
import type { CurrentUser } from "./session";

// ─────────────────────────────────────────────────────────────────────────────
// 1. GRANULAR PERMISSION CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

export const PERMISSIONS = {
  // General Project
  PROJECT_VIEW: "PROJECT_VIEW",
  PROJECT_EDIT: "PROJECT_EDIT",
  PROJECT_TEAM_MANAGE: "PROJECT_TEAM_MANAGE",

  // Financial & Commercial Data (Restricted Categories C & D)
  PROJECT_BUDGET_VIEW: "PROJECT_BUDGET_VIEW",
  PROJECT_COST_VIEW: "PROJECT_COST_VIEW",
  PROJECT_PROFIT_VIEW: "PROJECT_PROFIT_VIEW",
  PROCUREMENT_COMMERCIAL_VIEW: "PROCUREMENT_COMMERCIAL_VIEW",
  PROCUREMENT_PO_MANAGE: "PROCUREMENT_PO_MANAGE",
  BILLING_VIEW: "BILLING_VIEW",
  BILLING_MANAGE: "BILLING_MANAGE",
  PAYMENT_VIEW: "PAYMENT_VIEW",
  PAYMENT_EXECUTE: "PAYMENT_EXECUTE",

  // Operational Execution (Category B)
  TASK_VIEW: "TASK_VIEW",
  TASK_MANAGE: "TASK_MANAGE",
  PROCUREMENT_VIEW: "PROCUREMENT_VIEW",
  PROCUREMENT_CREATE: "PROCUREMENT_CREATE",
  PROCUREMENT_APPROVE: "PROCUREMENT_APPROVE",
  EXECUTION_MEASURE_CREATE: "EXECUTION_MEASURE_CREATE",
  EXECUTION_MEASURE_VERIFY: "EXECUTION_MEASURE_VERIFY",
  QUALITY_MANAGE: "QUALITY_MANAGE",
  DOCUMENT_VIEW: "DOCUMENT_VIEW",
  DOCUMENT_MANAGE: "DOCUMENT_MANAGE",

  // Administrative (Category E)
  ADMIN_ACCESS: "ADMIN_ACCESS",
  AUDIT_LOG_VIEW: "AUDIT_LOG_VIEW",
  SETTINGS_MANAGE: "SETTINGS_MANAGE",
} as const;

export type PermissionKey = keyof typeof PERMISSIONS;

// ─────────────────────────────────────────────────────────────────────────────
// 2. ROLE-TO-PERMISSIONS MAPPING (BUSINESS LOGIC)
// ─────────────────────────────────────────────────────────────────────────────

const ALL_PERMISSIONS = Object.values(PERMISSIONS);

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: ALL_PERMISSIONS,

  project_manager: [
    PERMISSIONS.PROJECT_VIEW,
    PERMISSIONS.PROJECT_EDIT,
    PERMISSIONS.PROJECT_TEAM_MANAGE,
    PERMISSIONS.TASK_VIEW,
    PERMISSIONS.TASK_MANAGE,
    PERMISSIONS.PROCUREMENT_VIEW,
    PERMISSIONS.PROCUREMENT_CREATE,
    PERMISSIONS.PROCUREMENT_APPROVE,
    PERMISSIONS.EXECUTION_MEASURE_CREATE,
    PERMISSIONS.EXECUTION_MEASURE_VERIFY,
    PERMISSIONS.QUALITY_MANAGE,
    PERMISSIONS.DOCUMENT_VIEW,
    PERMISSIONS.DOCUMENT_MANAGE,
    // Note: PROJECT_BUDGET_VIEW, PROJECT_COST_VIEW, PROJECT_PROFIT_VIEW omitted by default
  ],

  engineer: [
    PERMISSIONS.PROJECT_VIEW,
    PERMISSIONS.TASK_VIEW,
    PERMISSIONS.TASK_MANAGE,
    PERMISSIONS.PROCUREMENT_VIEW,
    PERMISSIONS.PROCUREMENT_CREATE,
    PERMISSIONS.EXECUTION_MEASURE_CREATE,
    PERMISSIONS.QUALITY_MANAGE,
    PERMISSIONS.DOCUMENT_VIEW,
    PERMISSIONS.DOCUMENT_MANAGE,
  ],

  accountant: [
    PERMISSIONS.PROJECT_VIEW,
    PERMISSIONS.PROJECT_BUDGET_VIEW,
    PERMISSIONS.PROJECT_COST_VIEW,
    PERMISSIONS.PROJECT_PROFIT_VIEW,
    PERMISSIONS.PROCUREMENT_VIEW,
    PERMISSIONS.PROCUREMENT_COMMERCIAL_VIEW,
    PERMISSIONS.BILLING_VIEW,
    PERMISSIONS.BILLING_MANAGE,
    PERMISSIONS.PAYMENT_VIEW,
    PERMISSIONS.PAYMENT_EXECUTE,
    PERMISSIONS.EXECUTION_MEASURE_VERIFY,
    PERMISSIONS.DOCUMENT_VIEW,
  ],

  procurement_officer: [
    PERMISSIONS.PROJECT_VIEW,
    PERMISSIONS.PROCUREMENT_VIEW,
    PERMISSIONS.PROCUREMENT_CREATE,
    PERMISSIONS.PROCUREMENT_COMMERCIAL_VIEW,
    PERMISSIONS.PROCUREMENT_PO_MANAGE,
    PERMISSIONS.DOCUMENT_VIEW,
    PERMISSIONS.DOCUMENT_MANAGE,
  ],

  viewer: [
    PERMISSIONS.PROJECT_VIEW,
    PERMISSIONS.TASK_VIEW,
    PERMISSIONS.DOCUMENT_VIEW,
  ],

  client: [
    PERMISSIONS.PROJECT_VIEW,
    PERMISSIONS.DOCUMENT_VIEW,
    PERMISSIONS.BILLING_VIEW,
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. PERMISSION EVALUATION HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns all active permissions for a user based on their activeRole
 * and any user_permission_overrides stored in the database.
 */
export async function getUserPermissions(user: CurrentUser): Promise<string[]> {
  if (user.activeRole === "admin") {
    return ALL_PERMISSIONS;
  }

  const basePermissions = ROLE_PERMISSIONS[user.activeRole] || ROLE_PERMISSIONS.viewer || [];
  const permSet = new Set<string>(basePermissions);

  // Check any overrides
  try {
    const overrides = await db
      .select({ permission: userPermissionOverridesTable.permission, granted: userPermissionOverridesTable.granted })
      .from(userPermissionOverridesTable)
      .where(eq(userPermissionOverridesTable.userId, user.id));

    for (const ov of overrides) {
      if (ov.granted) {
        permSet.add(ov.permission);
      } else {
        permSet.delete(ov.permission);
      }
    }
  } catch (err) {
    // If overrides table query fails, fallback to role permissions safely
  }

  return Array.from(permSet);
}

/**
 * Checks if a user has a specific permission.
 */
export async function hasPermission(user: CurrentUser, permission: string): Promise<boolean> {
  if (user.activeRole === "admin") return true;
  const perms = await getUserPermissions(user);
  return perms.includes(permission);
}

/**
 * Checks if a user has access to a given project (Admin bypass OR explicit project_assignments entry).
 */
export async function hasProjectAccess(
  user: CurrentUser,
  projectId: number
): Promise<{ allowed: boolean; role?: string }> {
  if (user.activeRole === "admin") {
    return { allowed: true, role: "admin" };
  }

  const [assignment] = await db
    .select({ role: projectAssignmentsTable.role })
    .from(projectAssignmentsTable)
    .where(
      and(
        eq(projectAssignmentsTable.projectId, projectId),
        eq(projectAssignmentsTable.userId, user.id)
      )
    )
    .limit(1);

  if (assignment) {
    return { allowed: true, role: assignment.role };
  }

  return { allowed: false };
}

/**
 * Helper to check if user is allowed to view project financial values (budgets, costs, margins).
 */
export function canViewFinancials(user: CurrentUser): boolean {
  return user.activeRole === "admin" || user.activeRole === "accountant";
}

/**
 * Helper to check if user is allowed to view commercial prices (unit rates, PO total amounts).
 */
export function canViewCommercial(user: CurrentUser): boolean {
  return (
    user.activeRole === "admin" ||
    user.activeRole === "accountant" ||
    user.activeRole === "procurement_officer"
  );
}
