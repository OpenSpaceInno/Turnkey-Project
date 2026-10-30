import { Link, useLocation, useSearch } from "wouter";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Layers,
  Settings,
  ShieldAlert,
  ChevronDown,
  ChevronRight,
  ShoppingCart,
  DollarSign,
  Package,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Building,
  ClipboardList,
  Receipt,
  FileText,
  UserCog,
  LayoutTemplate,
  FolderOpen,
  HardHat,
  ShieldCheck,
  BarChart3,
  Activity,
  Calendar,
  Target,
  ClipboardCheck,
  AlertTriangle,
  FileSpreadsheet,
  CheckSquare,
  Scale,
  AlertCircle,
  Truck,
  Camera,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePermissions, PERMISSIONS } from "@workspace/api-client-react";

interface NavItem {
  name: string;
  href: string;
  icon: any;
  permission?: string;
  anyPermissions?: string[];
  roles?: string[];
}

export function Sidebar() {
  const [location] = useLocation();
  const search = useSearch();
  const currentFullPath = search ? `${location}?${search}` : location;
  const { user, activeRole, isAdmin, hasPermission, hasAnyPermission } = usePermissions();

  const isSiteEngineer = activeRole === "engineer" || activeRole === "site_engineer";

  const [procurementExpanded, setProcurementExpanded] = useState(
    location.startsWith("/procurement")
  );
  const [siteExecutionExpanded, setSiteExecutionExpanded] = useState(
    location.startsWith("/site-execution") || currentFullPath.includes("tab=work-completions") || isSiteEngineer
  );
  const [qualitySafetyExpanded, setQualitySafetyExpanded] = useState(
    !isSiteEngineer && location.startsWith("/quality-safety")
  );
  const [billingExpanded, setBillingExpanded] = useState(
    !isSiteEngineer && (location.startsWith("/ra-bills") || location.startsWith("/finance"))
  );
  const [reportsExpanded, setReportsExpanded] = useState(
    !isSiteEngineer && location.startsWith("/reports")
  );
  const [adminExpanded, setAdminExpanded] = useState(
    !isSiteEngineer && (location.startsWith("/admin") || location.startsWith("/settings") || location.startsWith("/audit-logs"))
  );

  // Keep accordions expanded when navigating to routes inside them
  useEffect(() => {
    if (location.startsWith("/procurement")) setProcurementExpanded(true);
    if (location.startsWith("/site-execution") || currentFullPath.includes("tab=work-completions")) setSiteExecutionExpanded(true);
    if (!isSiteEngineer && location.startsWith("/quality-safety")) setQualitySafetyExpanded(true);
    if (!isSiteEngineer && (location.startsWith("/ra-bills") || location.startsWith("/finance"))) setBillingExpanded(true);
    if (!isSiteEngineer && location.startsWith("/reports")) setReportsExpanded(true);
    if (!isSiteEngineer && (location.startsWith("/admin") || location.startsWith("/settings") || location.startsWith("/audit-logs"))) setAdminExpanded(true);
  }, [location, currentFullPath, isSiteEngineer]);

  // Helper to determine if a submenu item is active based on path & query params
  const isSubmenuItemActive = (itemHref: string) => {
    if (itemHref.includes("?")) {
      return currentFullPath === itemHref;
    }
    if (
      itemHref !== "/procurement" &&
      itemHref !== "/site-execution" &&
      itemHref !== "/quality-safety" &&
      itemHref !== "/finance" &&
      itemHref !== "/ra-bills" &&
      itemHref !== "/reports"
    ) {
      return location === itemHref || location.startsWith(itemHref + "/");
    }
    if (location !== itemHref) return false;
    const tab = new URLSearchParams(search).get("tab");
    if (!tab) return true;
    if (itemHref === "/site-execution" && tab === "overview") return true;
    if (itemHref === "/quality-safety" && tab === "hub") return true;
    if (itemHref === "/reports" && tab === "hub") return true;
    if (itemHref === "/procurement" && tab === "mr") return true;
    if (itemHref === "/ra-bills" && tab === "ra-bills") return true;
    return false;
  };

  if (!user) {
    return null;
  }

  // Dynamic permission and role access check
  const isItemVisible = (item: NavItem) => {
    if (isAdmin) return true;
    if (item.permission && hasPermission(item.permission)) return true;
    if (item.anyPermissions && hasAnyPermission(item.anyPermissions)) return true;
    if (item.roles && item.roles.includes(activeRole)) return true;
    if (!item.permission && !item.anyPermissions && (!item.roles || item.roles.length === 0)) return true;
    return false;
  };

  // 1. Core Primary Items (Sales & Projects)
  const primaryNav: NavItem[] = [
    { name: isSiteEngineer ? "Field Dashboard" : "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Leads & Opportunities", href: "/leads", icon: Users, roles: ["admin", "project_manager"] },
    { name: isSiteEngineer ? "My Site Projects" : "My Projects", href: "/projects", icon: Briefcase, permission: PERMISSIONS.PROJECT_VIEW },
  ];

  // 2. Procurement & Sourcing Submenu (Site materials & indents for Site Engineer)
  const procurementSubmenu: NavItem[] = [
    { name: "Procurement Hub", href: "/procurement", icon: ShoppingCart, roles: ["admin", "procurement_officer", "project_manager", "accountant"] },
    { name: isSiteEngineer ? "Material Indents (MR)" : "Material Requests", href: "/procurement/material-requests", icon: ClipboardList, anyPermissions: [PERMISSIONS.PROCUREMENT_CREATE, PERMISSIONS.PROCUREMENT_VIEW] },
    { name: "Manager Approvals", href: "/procurement/manager-approvals", icon: CheckCircle, permission: PERMISSIONS.PROCUREMENT_APPROVE, roles: ["admin", "project_manager"] },
    { name: "RFQs & Quotations", href: "/procurement/rfqs", icon: FileText, permission: PERMISSIONS.PROCUREMENT_COMMERCIAL_VIEW, roles: ["admin", "procurement_officer"] },
    { name: "Purchase Orders", href: "/procurement?tab=pos", icon: Package, permission: PERMISSIONS.PROCUREMENT_COMMERCIAL_VIEW, roles: ["admin", "procurement_officer", "accountant"] },
    { name: isSiteEngineer ? "Site Stock & Inventory" : "Site Inventory", href: "/procurement?tab=materials", icon: Package, permission: PERMISSIONS.PROCUREMENT_VIEW },
    { name: "Vendors & Suppliers", href: "/procurement?tab=vendors", icon: Building, permission: PERMISSIONS.PROCUREMENT_VIEW, roles: ["admin", "procurement_officer", "project_manager"] },
  ];

  // 3. Site Execution Submenu (Turnkey Operational Workflow Order)
  const siteExecutionSubmenu: NavItem[] = [
    { name: "Execution Overview", href: "/site-execution", icon: Activity, permission: PERMISSIONS.PROJECT_VIEW },
    { name: "Daily Progress (DPR)", href: "/site-execution?tab=daily-reports", icon: Calendar, permission: PERMISSIONS.PROJECT_VIEW },
    { name: "Site Attendance & Manpower", href: "/site-execution?tab=attendance", icon: Users, permission: PERMISSIONS.PROJECT_VIEW },
    { name: "Field Measurements (JMR)", href: "/ra-bills?tab=work-completions", icon: Layers, permission: PERMISSIONS.PROJECT_VIEW },
    { name: "Material Consumption & Stock", href: "/site-execution?tab=materials", icon: Package, permission: PERMISSIONS.PROJECT_VIEW },
    { name: "Equipment Tracking", href: "/site-execution?tab=equipment", icon: Truck, permission: PERMISSIONS.PROJECT_VIEW },
    { name: "Site Issues & Delays", href: "/site-execution?tab=delays", icon: AlertCircle, permission: PERMISSIONS.PROJECT_VIEW },
  ];

  // 4. Quality & Safety Submenu
  const qualitySafetySubmenu: NavItem[] = [
    { name: "Quality & Safety Hub", href: "/quality-safety", icon: ShieldCheck, permission: PERMISSIONS.PROJECT_VIEW },
    { name: "Snag List & De-Snagging", href: "/quality-safety?tab=snag-list", icon: AlertTriangle, permission: PERMISSIONS.PROJECT_VIEW },
    { name: "Material QC Inspections", href: "/quality-safety?tab=inspections", icon: ClipboardCheck, anyPermissions: [PERMISSIONS.QUALITY_MANAGE, PERMISSIONS.PROCUREMENT_VIEW] },
    { name: "Safety Observations & HSE", href: "/quality-safety?tab=safety-logs", icon: HardHat, permission: PERMISSIONS.PROJECT_VIEW },
    { name: "Lab Test Certificates", href: "/quality-safety?tab=test-reports", icon: FileSpreadsheet, permission: PERMISSIONS.PROJECT_VIEW },
  ];

  // 5. Billing & Payments Submenu (Commercial & Financial Lifecycle - Hidden for Site Engineer)
  const billingSubmenu: NavItem[] = [
    { name: "Commercial & Finance Hub", href: "/finance", icon: DollarSign, roles: ["admin", "accountant"] },
    { name: "Contracts & Scope BOQ", href: "/ra-bills/contracts", icon: Building, roles: ["admin", "project_manager", "accountant"] },
    { name: "Work Measurements (JMR)", href: "/ra-bills?tab=work-completions", icon: Layers, roles: ["admin", "project_manager", "accountant"] },
    { name: "Client RA Bills", href: "/ra-bills", icon: Receipt, permission: PERMISSIONS.BILLING_VIEW, roles: ["admin", "project_manager", "accountant"] },
    { name: "Client AR (Receivables)", href: "/finance/ar", icon: TrendingUp, roles: ["admin", "accountant"] },
    { name: "Vendor AP (Payables)", href: "/finance/ap", icon: TrendingDown, roles: ["admin", "accountant"] },
  ];

  // 6. Reports & Analytics Submenu (Hidden for Site Engineer)
  const reportsSubmenu: NavItem[] = [
    { name: "Reports Central Hub", href: "/reports", icon: BarChart3, permission: PERMISSIONS.PROJECT_VIEW },
    { name: "Project Progress & S-Curve", href: "/reports?tab=project-progress", icon: TrendingUp, permission: PERMISSIONS.PROJECT_VIEW },
    { name: "Financial & Cost Variance", href: "/reports?tab=financial-variance", icon: Scale, roles: ["admin", "accountant", "project_manager"] },
    { name: "Procurement & Stock Audit", href: "/reports?tab=procurement-summary", icon: Package, roles: ["admin", "procurement_officer", "project_manager"] },
    { name: "Quality & HSE Compliance", href: "/reports?tab=quality-safety", icon: ShieldCheck, permission: PERMISSIONS.PROJECT_VIEW },
  ];

  // 7. Documents & Collaboration
  const collaborationNav: NavItem[] = [
    { name: isSiteEngineer ? "Drawings & Documents" : "Documents & Records", href: "/documents", icon: FolderOpen, permission: PERMISSIONS.DOCUMENT_VIEW },
    { name: "Task Plan Templates", href: "/task-templates", icon: LayoutTemplate, permission: PERMISSIONS.TASK_MANAGE, roles: ["admin", "project_manager"] },
  ];

  // 8. Settings & Administration (Hidden for Site Engineer)
  const adminSubmenu: NavItem[] = [
    { name: "User Management", href: "/admin", icon: UserCog, permission: PERMISSIONS.ADMIN_ACCESS, roles: ["admin"] },
    { name: "Role Switch Approvals", href: "/admin/role-approvals", icon: CheckCircle, permission: PERMISSIONS.PROJECT_TEAM_MANAGE, roles: ["admin", "project_manager"] },
    { name: "System Settings", href: "/settings", icon: Settings, roles: ["admin"] },
    { name: "Audit Trail", href: "/audit-logs", icon: ShieldAlert, permission: PERMISSIONS.AUDIT_LOG_VIEW, roles: ["admin"] },
  ];

  const visiblePrimaryNav = primaryNav.filter(isItemVisible);
  const visibleProcurementSubmenu = procurementSubmenu.filter(isItemVisible);
  const visibleSiteExecutionSubmenu = siteExecutionSubmenu.filter(isItemVisible);
  const visibleQualitySafetySubmenu = qualitySafetySubmenu.filter(isItemVisible);
  const visibleBillingSubmenu = billingSubmenu.filter(isItemVisible);
  const visibleReportsSubmenu = reportsSubmenu.filter(isItemVisible);
  const visibleCollaborationNav = collaborationNav.filter(isItemVisible);
  const visibleAdminSubmenu = adminSubmenu.filter(isItemVisible);

  const hasProcurementAccess = visibleProcurementSubmenu.length > 0;
  const hasSiteExecutionAccess = visibleSiteExecutionSubmenu.length > 0;
  // Strictly hide Quality & Safety, Billing, Reports, and Admin for Site Engineers
  const hasQualitySafetyAccess = !isSiteEngineer && visibleQualitySafetySubmenu.length > 0;
  const hasBillingAccess = !isSiteEngineer && visibleBillingSubmenu.length > 0;
  const hasReportsAccess = !isSiteEngineer && visibleReportsSubmenu.length > 0;
  const hasAdminAccess = !isSiteEngineer && visibleAdminSubmenu.length > 0;

  return (
    <div className="flex flex-col w-64 border-r bg-sidebar text-sidebar-foreground select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-sidebar-border bg-sidebar-accent/10">
        <Link href="/">
          <div className="flex items-center gap-3 font-bold text-lg tracking-tight text-sidebar-primary cursor-pointer hover:opacity-90 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-black shadow-sm">
              K
            </div>
            <div>
              <div className="leading-tight font-extrabold text-sidebar-foreground">Kanak Turnkey</div>
              <div className="text-[10px] font-medium text-sidebar-foreground/60 uppercase tracking-widest">
                Operations Platform
              </div>
            </div>
          </div>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {/* Core Navigation */}
        <div className="space-y-1">
          <div className="text-[11px] font-bold text-sidebar-foreground/50 uppercase tracking-wider mb-2 px-3">
            {isSiteEngineer ? "Site Operations" : "Operations Lifecycle"}
          </div>
          <nav className="space-y-1">
            {/* 1. Primary items (Dashboard, Leads, Projects) */}
            {visiblePrimaryNav.map((item) => {
              const isActive =
                item.href === "/"
                  ? location === "/"
                  : location.startsWith(item.href);

              return (
                <Link key={item.name} href={item.href}>
                  <div
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    )}
                  >
                    <item.icon className="w-4 h-4 shrink-0" />
                    <span>{item.name}</span>
                  </div>
                </Link>
              );
            })}

            {/* 2. Procurement & Sourcing Accordion (or Site Materials & Indents for Site Engineer) */}
            {hasProcurementAccess && (
              <div>
                <div
                  onClick={() => setProcurementExpanded(!procurementExpanded)}
                  className={cn(
                    "flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer",
                    location.startsWith("/procurement") && !procurementExpanded
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  )}
                >
                  <div className="flex items-center gap-3">
                    {isSiteEngineer ? (
                      <Package className="w-4 h-4 text-sidebar-foreground/60 shrink-0" />
                    ) : (
                      <ShoppingCart className="w-4 h-4 text-sidebar-foreground/60 shrink-0" />
                    )}
                    <span>{isSiteEngineer ? "Site Materials & Indents" : "Procurement & Supply"}</span>
                  </div>
                  {procurementExpanded ? (
                    <ChevronDown className="w-4 h-4 text-sidebar-foreground/60" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-sidebar-foreground/60" />
                  )}
                </div>

                {procurementExpanded && (
                  <div className="ml-5 mt-1 space-y-0.5 border-l-2 border-primary/20 pl-2.5">
                    {visibleProcurementSubmenu.map((item) => {
                      const isActive = isSubmenuItemActive(item.href);

                      return (
                        <Link key={item.name} href={item.href}>
                          <div
                            className={cn(
                              "flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer",
                              isActive
                                ? "bg-primary/10 text-primary font-bold"
                                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                            )}
                          >
                            <item.icon className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{item.name}</span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 3. Site Execution Accordion [NEW] */}
            {hasSiteExecutionAccess && (
              <div>
                <div
                  onClick={() => setSiteExecutionExpanded(!siteExecutionExpanded)}
                  className={cn(
                    "flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer",
                    location.startsWith("/site-execution") && !siteExecutionExpanded
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <HardHat className="w-4 h-4 text-sidebar-foreground/60 shrink-0" />
                    <span>Site Execution</span>
                  </div>
                  {siteExecutionExpanded ? (
                    <ChevronDown className="w-4 h-4 text-sidebar-foreground/60" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-sidebar-foreground/60" />
                  )}
                </div>

                {siteExecutionExpanded && (
                  <div className="ml-5 mt-1 space-y-0.5 border-l-2 border-amber-500/30 pl-2.5">
                    {visibleSiteExecutionSubmenu.map((item) => {
                      const isActive = isSubmenuItemActive(item.href);

                      return (
                        <Link key={item.name} href={item.href}>
                          <div
                            className={cn(
                              "flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer",
                              isActive
                                ? "bg-primary/10 text-primary font-bold"
                                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                            )}
                          >
                            <item.icon className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{item.name}</span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 4. Quality & Safety Accordion [NEW] */}
            {hasQualitySafetyAccess && (
              <div>
                <div
                  onClick={() => setQualitySafetyExpanded(!qualitySafetyExpanded)}
                  className={cn(
                    "flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer",
                    location.startsWith("/quality-safety") && !qualitySafetyExpanded
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-4 h-4 text-sidebar-foreground/60 shrink-0" />
                    <span>Quality & Safety</span>
                  </div>
                  {qualitySafetyExpanded ? (
                    <ChevronDown className="w-4 h-4 text-sidebar-foreground/60" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-sidebar-foreground/60" />
                  )}
                </div>

                {qualitySafetyExpanded && (
                  <div className="ml-5 mt-1 space-y-0.5 border-l-2 border-emerald-500/30 pl-2.5">
                    {visibleQualitySafetySubmenu.map((item) => {
                      const isActive = isSubmenuItemActive(item.href);

                      return (
                        <Link key={item.name} href={item.href}>
                          <div
                            className={cn(
                              "flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer",
                              isActive
                                ? "bg-primary/10 text-primary font-bold"
                                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                            )}
                          >
                            <item.icon className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{item.name}</span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 5. Billing & Payments Accordion */}
            {hasBillingAccess && (
              <div>
                <div
                  onClick={() => setBillingExpanded(!billingExpanded)}
                  className={cn(
                    "flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer",
                    (location.startsWith("/finance") || location.startsWith("/ra-bills")) && !billingExpanded
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-4 h-4 text-sidebar-foreground/60 shrink-0" />
                    <span>Billing & Payments</span>
                  </div>
                  {billingExpanded ? (
                    <ChevronDown className="w-4 h-4 text-sidebar-foreground/60" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-sidebar-foreground/60" />
                  )}
                </div>

                {billingExpanded && (
                  <div className="ml-5 mt-1 space-y-0.5 border-l-2 border-primary/20 pl-2.5">
                    {visibleBillingSubmenu.map((item) => {
                      const isActive = isSubmenuItemActive(item.href);

                      return (
                        <Link key={item.name} href={item.href}>
                          <div
                            className={cn(
                              "flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer",
                              isActive
                                ? "bg-primary/10 text-primary font-bold"
                                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                            )}
                          >
                            <item.icon className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{item.name}</span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 6. Reports & Analytics Accordion [NEW] */}
            {hasReportsAccess && (
              <div>
                <div
                  onClick={() => setReportsExpanded(!reportsExpanded)}
                  className={cn(
                    "flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer",
                    location.startsWith("/reports") && !reportsExpanded
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <BarChart3 className="w-4 h-4 text-sidebar-foreground/60 shrink-0" />
                    <span>Reports & Analytics</span>
                  </div>
                  {reportsExpanded ? (
                    <ChevronDown className="w-4 h-4 text-sidebar-foreground/60" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-sidebar-foreground/60" />
                  )}
                </div>

                {reportsExpanded && (
                  <div className="ml-5 mt-1 space-y-0.5 border-l-2 border-indigo-500/30 pl-2.5">
                    {visibleReportsSubmenu.map((item) => {
                      const isActive = isSubmenuItemActive(item.href);

                      return (
                        <Link key={item.name} href={item.href}>
                          <div
                            className={cn(
                              "flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer",
                              isActive
                                ? "bg-primary/10 text-primary font-bold"
                                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                            )}
                          >
                            <item.icon className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{item.name}</span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 7. Collaboration & Documentation */}
            {visibleCollaborationNav.map((item) => {
              const isActive = location.startsWith(item.href);
              return (
                <Link key={item.name} href={item.href}>
                  <div
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    )}
                  >
                    <item.icon className="w-4 h-4 text-sidebar-foreground/60 shrink-0" />
                    <span>{item.name}</span>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* 8. Settings Section */}
        {hasAdminAccess && (
          <div className="space-y-1 pt-2 border-t border-sidebar-border">
            <div
              onClick={() => setAdminExpanded(!adminExpanded)}
              className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            >
              <div className="flex items-center gap-3">
                <Settings className="w-4 h-4 text-sidebar-foreground/60 shrink-0" />
                <span>Settings</span>
              </div>
              {adminExpanded ? (
                <ChevronDown className="w-4 h-4 text-sidebar-foreground/60" />
              ) : (
                <ChevronRight className="w-4 h-4 text-sidebar-foreground/60" />
              )}
            </div>

            {adminExpanded && (
              <div className="ml-5 mt-1 space-y-0.5 border-l-2 border-sidebar-border pl-2.5">
                {visibleAdminSubmenu.map((item) => {
                  const isActive = location === item.href;
                  return (
                    <Link key={item.name} href={item.href}>
                      <div
                        className={cn(
                          "flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer",
                          isActive
                            ? "bg-primary/10 text-primary font-bold"
                            : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                        )}
                      >
                        <item.icon className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{item.name}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
