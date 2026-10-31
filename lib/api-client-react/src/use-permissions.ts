import { useMemo, useCallback } from "react";
import { useGetCurrentUser } from "./generated/api";
import type { User } from "./generated/api.schemas";

// ─────────────────────────────────────────────────────────────────────────────
// 1. GRANULAR PERMISSION CONSTANTS (Single Source of Truth)
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
export type PermissionValue = (typeof PERMISSIONS)[PermissionKey];

// ─────────────────────────────────────────────────────────────────────────────
// 2. DEFAULT ROLE PERMISSION MAPPING
// ─────────────────────────────────────────────────────────────────────────────

export const ROLE_DEFAULT_PERMISSIONS: Record<string, string[]> = {
  admin: Object.values(PERMISSIONS),

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
};

export interface UserWithPermissions extends User {
  organizationId?: number;
  permissions?: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. REACT HOOK: usePermissions
// ─────────────────────────────────────────────────────────────────────────────

export function usePermissions() {
  const { data: rawUser, isLoading, error } = useGetCurrentUser();
  const user = rawUser as UserWithPermissions | undefined;

  const activeRole = user?.activeRole || "viewer";

  const userPermissions = useMemo<string[]>(() => {
    if (!user) return [];
    if (activeRole === "admin") return Object.values(PERMISSIONS);
    if (Array.isArray(user.permissions) && user.permissions.length > 0) {
      return user.permissions;
    }
    return ROLE_DEFAULT_PERMISSIONS[activeRole] || ROLE_DEFAULT_PERMISSIONS.viewer || [];
  }, [user, activeRole]);

  const hasPermission = useCallback(
    (perm: string) => {
      if (!user) return false;
      if (activeRole === "admin") return true;
      return userPermissions.includes(perm);
    },
    [user, activeRole, userPermissions]
  );

  const hasAnyPermission = useCallback(
    (perms: string[]) => {
      if (!user) return false;
      if (activeRole === "admin") return true;
      return perms.some((p) => userPermissions.includes(p));
    },
    [user, activeRole, userPermissions]
  );

  const hasAllPermissions = useCallback(
    (perms: string[]) => {
      if (!user) return false;
      if (activeRole === "admin") return true;
      return perms.every((p) => userPermissions.includes(p));
    },
    [user, activeRole, userPermissions]
  );

  const canViewFinancials =
    activeRole === "admin" ||
    activeRole === "accountant" ||
    userPermissions.includes(PERMISSIONS.PROJECT_BUDGET_VIEW);

  const canViewCommercial =
    activeRole === "admin" ||
    activeRole === "accountant" ||
    activeRole === "procurement_officer" ||
    userPermissions.includes(PERMISSIONS.PROCUREMENT_COMMERCIAL_VIEW);

  return {
    user,
    isLoading,
    error,
    activeRole,
    organizationId: user?.organizationId ?? 1,
    permissions: userPermissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canViewFinancials,
    canViewCommercial,
    isAdmin: activeRole === "admin",
    isProjectManager: activeRole === "project_manager",
    isEngineer: activeRole === "engineer",
    isAccountant: activeRole === "accountant",
    isProcurementOfficer: activeRole === "procurement_officer",
    isViewer: activeRole === "viewer",
  };
}
