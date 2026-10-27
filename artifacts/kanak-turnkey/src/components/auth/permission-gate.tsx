import React from "react";
import { usePermissions, PERMISSIONS } from "@workspace/api-client-react";
import { Lock } from "lucide-react";

interface PermissionGateProps {
  permission?: string;
  anyPermissions?: string[];
  allPermissions?: string[];
  roles?: string[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Conditionally renders children if the authenticated user has the necessary permissions/roles.
 */
export function PermissionGate({
  permission,
  anyPermissions,
  allPermissions,
  roles,
  fallback = null,
  children,
}: PermissionGateProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, activeRole, isAdmin } = usePermissions();

  if (isAdmin) {
    return <>{children}</>;
  }

  if (roles && roles.length > 0 && !roles.includes(activeRole)) {
    return <>{fallback}</>;
  }

  if (permission && !hasPermission(permission)) {
    return <>{fallback}</>;
  }

  if (anyPermissions && anyPermissions.length > 0 && !hasAnyPermission(anyPermissions)) {
    return <>{fallback}</>;
  }

  if (allPermissions && allPermissions.length > 0 && !hasAllPermissions(allPermissions)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Renders a monetary value formatted in INR if user has permission,
 * otherwise renders a masked placeholder "₹ ••••••".
 */
export function MaskedFinancialValue({
  value,
  formatter,
  className = "",
  placeholder = "₹ ••••••",
}: {
  value: number | string | null | undefined;
  formatter?: (val: number) => string;
  className?: string;
  placeholder?: string;
}) {
  const { canViewFinancials } = usePermissions();

  if (!canViewFinancials || value === null || value === undefined) {
    return (
      <span className={`inline-flex items-center gap-1 text-muted-foreground/70 font-mono text-sm ${className}`} title="Confidential Financial Data">
        <Lock className="w-3 h-3 text-muted-foreground/50 inline" />
        {placeholder}
      </span>
    );
  }

  const numVal = typeof value === "string" ? parseFloat(value) : value;
  const display = formatter
    ? formatter(numVal)
    : new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(numVal);

  return <span className={className}>{display}</span>;
}

/**
 * Access Denied full-page placeholder for protected routes
 */
export function AccessDeniedView({
  title = "Access Restricted",
  description = "You do not have the required permissions to view this module. Please contact your organization administrator.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center">
      <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 mb-4 shadow-sm">
        <Lock className="w-7 h-7" />
      </div>
      <h2 className="text-xl font-bold tracking-tight text-foreground mb-2">{title}</h2>
      <p className="text-sm text-muted-foreground max-w-md mb-6">{description}</p>
      <a
        href="/"
        className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition shadow-sm"
      >
        Return to Dashboard
      </a>
    </div>
  );
}
