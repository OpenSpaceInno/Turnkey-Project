import React, { useState, useEffect } from "react";
import { useGetDashboardSummary, useGetRecentActivity, usePermissions, PERMISSIONS } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { MaskedFinancialValue } from "@/components/auth/permission-gate";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Briefcase,
  Building2,
  CheckSquare,
  Users,
  ArrowRight,
  Sparkles,
  Zap,
  ShieldCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  TrendingUp,
  Receipt,
  FileText,
  Plus,
  ShoppingCart,
  HardHat,
  ChevronRight,
  Layers,
  Package,
  FileSpreadsheet,
  Calendar as CalendarIcon,
  Filter,
  RotateCcw,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Link, useLocation } from "wouter";

const COLORS = ["#f97316", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"];

const INR = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { data: summary, isLoading: isLoadingSummary } = useGetDashboardSummary();
  const { data: activity, isLoading: isLoadingActivity } = useGetRecentActivity();
  const { user, activeRole, canViewFinancials, canViewCommercial, isAdmin } = usePermissions();

  // ── Financial Date Range Filter State (FR-DASH-11) ─────────
  const [financialDateRange, setFinancialDateRange] = useState<string>("all");
  const [customStart, setCustomStart] = useState<string>("");
  const [customEnd, setCustomEnd] = useState<string>("");
  const [financialsData, setFinancialsData] = useState<any>(null);
  const [isUpdatingFinancials, setIsUpdatingFinancials] = useState<boolean>(false);
  const [showCustomRangePicker, setShowCustomRangePicker] = useState<boolean>(false);

  // Sync initial financials from summary
  useEffect(() => {
    if (summary?.financials && !financialsData) {
      setFinancialsData(summary.financials);
    }
  }, [summary, financialsData]);

  const handleDateRangeChange = async (newRange: string, start?: string, end?: string) => {
    setFinancialDateRange(newRange);
    setIsUpdatingFinancials(true);

    try {
      let url = `/api/dashboard/financials?dateRange=${newRange}`;
      if (newRange === "custom" && start && end) {
        url += `&startDate=${start}&endDate=${end}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setFinancialsData(data);
      }
    } catch (err) {
      console.error("Failed to fetch filtered financials:", err);
    } finally {
      setIsUpdatingFinancials(false);
    }
  };

  const handleApplyCustomRange = () => {
    if (!customStart || !customEnd) return;
    handleDateRangeChange("custom", customStart, customEnd);
    setShowCustomRangePicker(false);
  };

  const handleResetFilter = () => {
    setCustomStart("");
    setCustomEnd("");
    handleDateRangeChange("all");
    setShowCustomRangePicker(false);
  };

  if (isLoadingSummary || isLoadingActivity) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-24 bg-muted/30 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-muted/40 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!summary || !summary.totals) return null;

  const currentUser = user || (summary as any).user || { name: "Operations Lead", activeRole: "Project Manager" };
  const myProjects: any[] = (summary as any).myProjects || [];
  const nextActions: any[] = (summary as any).nextActions || [];
  const projectHealth: any[] = (summary as any).projectHealth || [];
  const financials = summary.financials;
  const activeFinancials = financialsData || financials;

  const isSiteEngineer = activeRole === "engineer" || activeRole === "site_engineer";

  const roleTitleMap: Record<string, string> = {
    admin: "Super Admin / Executive View",
    project_manager: "Project Management Operations",
    engineer: "Site Engineering & Field Operations",
    site_engineer: "Site Engineering & Field Operations",
    accountant: "Finance & Accounts Command Center",
    procurement_officer: "Supply Chain & Procurement",
    viewer: "Operational Overview",
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      {/* ── 1. Greeting Banner & Role-Specific Quick Actions ── */}
      <div className="rounded-2xl p-6 bg-gradient-to-r from-primary/10 via-primary/5 to-background border border-primary/20 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
              <Sparkles className="h-4 w-4" /> {roleTitleMap[activeRole] || "Operations Hub"}
            </span>
            <Badge variant="outline" className="text-[10px] capitalize font-semibold border-primary/30">
              Role: {activeRole.replace("_", " ")}
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            Good Morning, {currentUser.name}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-xl">
            You have <strong className="text-foreground">{myProjects.length} accessible project(s)</strong> and{" "}
            <strong className="text-foreground">{nextActions.length} action item(s)</strong> matching your responsibilities.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {(isAdmin || activeRole === "project_manager") && (
            <>
              <Button
                size="sm"
                onClick={() => setLocation("/projects")}
                className="gap-1.5 shadow-sm font-semibold"
              >
                <Plus className="h-4 w-4" /> New Project
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setLocation("/leads")}
                className="gap-1.5 font-medium"
              >
                <Users className="h-4 w-4" /> Leads
              </Button>
            </>
          )}

          {isSiteEngineer && (
            <>
              <Button
                size="sm"
                onClick={() => setLocation("/site-execution?tab=daily-reports")}
                className="gap-1.5 shadow-sm font-semibold bg-primary text-primary-foreground"
              >
                <CalendarIcon className="h-4 w-4" /> Log DPR
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setLocation("/site-execution?tab=attendance")}
                className="gap-1.5 font-medium"
              >
                <Users className="h-4 w-4" /> Attendance
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setLocation("/ra-bills?tab=work-completions")}
                className="gap-1.5 font-medium"
              >
                <Layers className="h-4 w-4" /> Record JMR
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setLocation("/procurement/material-requests/new")}
                className="gap-1.5 font-medium"
              >
                <ShoppingCart className="h-4 w-4" /> Raise Indent
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setLocation("/quality-safety?tab=snag-list")}
                className="gap-1.5 font-medium"
              >
                <AlertTriangle className="h-4 w-4" /> Log Snag
              </Button>
            </>
          )}

          {activeRole === "procurement_officer" && (
            <>
              <Button
                size="sm"
                onClick={() => setLocation("/procurement/material-requests")}
                className="gap-1.5 shadow-sm font-semibold"
              >
                <ShoppingCart className="h-4 w-4" /> Process Indents
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setLocation("/procurement/rfqs")}
                className="gap-1.5 font-medium"
              >
                <FileSpreadsheet className="h-4 w-4" /> RFQs & Quotes
              </Button>
            </>
          )}

          {activeRole === "accountant" && (
            <>
              <Button
                size="sm"
                onClick={() => setLocation("/finance")}
                className="gap-1.5 shadow-sm font-semibold"
              >
                <TrendingUp className="h-4 w-4" /> Finance Hub
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setLocation("/finance/ar")}
                className="gap-1.5 font-medium"
              >
                <Receipt className="h-4 w-4" /> Client AR
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setLocation("/finance/ap")}
                className="gap-1.5 font-medium"
              >
                <TrendingDownIcon className="h-4 w-4" /> Vendor AP
              </Button>
            </>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={() => setLocation("/projects")}
            className="gap-1.5 font-medium"
          >
            <Briefcase className="h-4 w-4" /> {isSiteEngineer ? "My Projects" : "All Projects"}
          </Button>
        </div>
      </div>

      {/* ── Site Engineer Field Operations Launch Strip ── */}
      {isSiteEngineer && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-in fade-in">
          <Card 
            className="border shadow-xs hover:border-primary/50 transition-all cursor-pointer bg-card hover:bg-muted/30"
            onClick={() => setLocation("/site-execution?tab=daily-reports")}
          >
            <CardContent className="p-3.5 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                <CalendarIcon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">Daily Progress</span>
                <span className="text-sm font-bold text-foreground truncate block">Submit DPR</span>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="border shadow-xs hover:border-primary/50 transition-all cursor-pointer bg-card hover:bg-muted/30"
            onClick={() => setLocation("/site-execution?tab=attendance")}
          >
            <CardContent className="p-3.5 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
                <Users className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">Manpower</span>
                <span className="text-sm font-bold text-foreground truncate block">Site Attendance</span>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="border shadow-xs hover:border-primary/50 transition-all cursor-pointer bg-card hover:bg-muted/30"
            onClick={() => setLocation("/quality-safety?tab=snag-list")}
          >
            <CardContent className="p-3.5 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">Quality Control</span>
                <span className="text-sm font-bold text-foreground truncate block">Punch List & Snags</span>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="border shadow-xs hover:border-primary/50 transition-all cursor-pointer bg-card hover:bg-muted/30"
            onClick={() => setLocation("/procurement/material-requests")}
          >
            <CardContent className="p-3.5 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
                <Package className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">Materials</span>
                <span className="text-sm font-bold text-foreground truncate block">Indents & Stock</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── 2. Priority Next Actions Feed ── */}
      {nextActions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold flex items-center gap-2 text-foreground">
              <Zap className="h-4 w-4 text-amber-500 fill-amber-500/20" />
              Priority Actions Required ({activeRole.replace("_", " ")})
            </h2>
            <span className="text-xs text-muted-foreground font-medium">
              {nextActions.length} items needing attention
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {nextActions.map((action, idx) => (
              <Card
                key={action.id || idx}
                className="border-2 border-amber-500/20 shadow-sm bg-gradient-to-br from-amber-500/[0.04] to-background hover:border-amber-500/40 transition-all hover:shadow"
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 border-amber-300">
                      {action.category}
                    </Badge>
                    {action.projectName && (
                      <span className="text-[11px] font-semibold text-muted-foreground truncate max-w-[150px]">
                        {action.projectName}
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-foreground line-clamp-1">
                      {action.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                      {action.description}
                    </p>
                  </div>

                  <Button
                    size="sm"
                    className="w-full text-xs font-semibold gap-1.5 h-8 bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
                    onClick={() => setLocation(action.actionUrl)}
                  >
                    <span>{action.actionText}</span>
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ── 3. My Projects Strip ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold flex items-center gap-2 text-foreground">
            <HardHat className="h-4 w-4 text-primary" />
            {isAdmin ? "Active Projects Portfolio" : "My Assigned Projects"}
          </h2>
          <Button variant="ghost" size="sm" asChild className="text-xs text-primary font-semibold gap-1">
            <Link href="/projects">
              View All Projects <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        {myProjects.length === 0 ? (
          <Card className="p-8 text-center space-y-2">
            <Briefcase className="h-8 w-8 text-muted-foreground mx-auto stroke-1" />
            <p className="text-sm font-semibold">No assigned projects yet</p>
            <p className="text-xs text-muted-foreground">
              Ask your administrator to assign you to a project team to view project deliverables.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {myProjects.map((p) => {
              const stageColors: Record<string, string> = {
                setup: "bg-amber-500/10 text-amber-600 border-amber-300",
                planning: "bg-sky-500/10 text-sky-600 border-sky-300",
                procurement: "bg-indigo-500/10 text-indigo-600 border-indigo-300",
                execution: "bg-emerald-500/10 text-emerald-600 border-emerald-300",
                billing: "bg-primary/10 text-primary border-primary/30",
                quality: "bg-purple-500/10 text-purple-600 border-purple-300",
                handover: "bg-teal-500/10 text-teal-600 border-teal-300",
                closed: "bg-muted text-muted-foreground",
              };

              return (
                <Card
                  key={p.id}
                  className="border shadow-sm hover:shadow-md transition-all flex flex-col justify-between hover:border-primary/40 group cursor-pointer"
                  onClick={() => setLocation(`/projects/${p.id}`)}
                >
                  <CardHeader className="p-4 pb-2 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <Badge
                        variant="outline"
                        className={`text-[10px] uppercase font-bold tracking-wider ${
                          stageColors[p.lifecycleStage] || "bg-muted"
                        }`}
                      >
                        {p.lifecycleStage}
                      </Badge>
                      <span className="text-xs font-bold text-foreground">
                        {p.progress}%
                      </span>
                    </div>

                    <CardTitle className="text-sm font-bold group-hover:text-primary transition-colors line-clamp-1 pt-1">
                      {p.name}
                    </CardTitle>
                    <CardDescription className="text-xs line-clamp-1">
                      {p.clientName || "Client Unspecified"} {p.location ? `• ${p.location}` : ""}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="p-4 pt-2 space-y-3">
                    <Progress value={p.progress} className="h-1.5" />

                    <div className="flex items-center justify-between text-xs pt-1 border-t">
                      <span className="text-muted-foreground">{canViewFinancials ? "Budget" : "Location"}</span>
                      <span className="font-semibold text-foreground">
                        {canViewFinancials ? (
                          <MaskedFinancialValue value={p.budget} />
                        ) : (
                          <span>{p.location || "On-site"}</span>
                        )}
                      </span>
                    </div>

                    <div className="bg-muted/40 rounded-lg p-2 text-xs flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[10px] text-muted-foreground block uppercase font-medium">Next Action</span>
                        <span className="font-semibold truncate block text-foreground">
                          {p.nextAction?.title || "Project in progress"}
                        </span>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-primary shrink-0 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* ── 4. Project Health Matrix & Commercial / Role Snapshot ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project Health Table */}
        <Card className="lg:col-span-2 border shadow-sm">
          <CardHeader className="pb-3 border-b bg-muted/10">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Project Operational Health Pulse
            </CardTitle>
            <CardDescription className="text-xs">
              Live status tracking across Schedule, Deliverables, and Quality snags.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 divide-y">
            {projectHealth.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground">
                No active projects to monitor.
              </div>
            ) : (
              projectHealth.map((ph) => (
                <div
                  key={ph.projectId}
                  className="p-3.5 px-4 flex items-center justify-between gap-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold truncate text-foreground">
                        {ph.projectName}
                      </span>
                      <Badge variant="outline" className="text-[10px] capitalize">
                        {ph.lifecycleStage}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span>Progress: <strong className="text-foreground">{ph.progress}%</strong></span>
                      <span>•</span>
                      <span>
                        Quality:{" "}
                        <strong
                          className={
                            ph.qualityStatus === "clear"
                              ? "text-emerald-600 font-semibold"
                              : "text-amber-600 font-semibold"
                          }
                        >
                          {ph.openSnagsCount === 0 ? "Zero Snags" : `${ph.openSnagsCount} Snags Open`}
                        </strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      variant="outline"
                      className={`text-xs font-semibold ${
                        ph.scheduleStatus === "on_track"
                          ? "bg-emerald-50 text-emerald-600 border-emerald-300 dark:bg-emerald-950/30"
                          : "bg-destructive/10 text-destructive border-destructive/30"
                      }`}
                    >
                      {ph.scheduleStatus === "on_track" ? "On Schedule" : "Delayed"}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7 px-2"
                      onClick={() => setLocation(`/projects/${ph.projectId}`)}
                    >
                      Open <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Dynamic Card: Commercial Cash Flow (Admin & Finance) OR Operational Execution (Engineer/PM/Procurement) */}
        {canViewFinancials && activeFinancials ? (
          <Card className="border shadow-sm flex flex-col justify-between overflow-hidden">
            <CardHeader className="pb-3 border-b bg-muted/10 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Commercial & Cash Flow
                </CardTitle>

                {/* ── FR-DASH-11: Date Range Filter for Financial KPIs ── */}
                <div className="flex items-center gap-1.5 self-start sm:self-auto">
                  <Select
                    value={financialDateRange}
                    onValueChange={(val) => {
                      if (val === "custom") {
                        setShowCustomRangePicker(true);
                      } else {
                        setShowCustomRangePicker(false);
                        handleDateRangeChange(val);
                      }
                    }}
                  >
                    <SelectTrigger className="h-7 text-xs font-semibold px-2.5 gap-1.5 bg-background border-border/80 shadow-xs w-auto">
                      <CalendarIcon className="h-3.5 w-3.5 text-primary" />
                      <SelectValue placeholder="Date Range" />
                    </SelectTrigger>
                    <SelectContent align="end" className="text-xs">
                      <SelectItem value="all">All Time (Overall)</SelectItem>
                      <SelectItem value="this_month">This Month (Current)</SelectItem>
                      <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                      <SelectItem value="this_quarter">This Quarter</SelectItem>
                      <SelectItem value="this_fy">Financial Year (FY 26-27)</SelectItem>
                      <SelectItem value="this_year">Calendar Year 2026</SelectItem>
                      <SelectItem value="custom">Custom Date Range...</SelectItem>
                    </SelectContent>
                  </Select>

                  {financialDateRange !== "all" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      onClick={handleResetFilter}
                      title="Reset to All Time"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Active Filter Badge */}
              {activeFinancials.appliedDateRange && activeFinancials.appliedDateRange.range !== "all" && (
                <div className="flex items-center justify-between p-1.5 px-2.5 rounded-md bg-primary/10 border border-primary/20 text-[11px] text-primary font-medium animate-in fade-in">
                  <span className="flex items-center gap-1.5 truncate">
                    <Filter className="h-3 w-3" />
                    <span>Period: <strong>{activeFinancials.appliedDateRange.label}</strong></span>
                  </span>
                  <button
                    onClick={handleResetFilter}
                    className="hover:underline font-bold text-[10px] ml-2 shrink-0 cursor-pointer"
                  >
                    Clear Filter
                  </button>
                </div>
              )}

              {/* Custom Date Range Picker Form */}
              {showCustomRangePicker && (
                <div className="p-3 rounded-lg bg-background border border-border shadow-md space-y-2.5 text-xs animate-in slide-in-from-top-2">
                  <div className="font-semibold text-foreground flex items-center gap-1.5">
                    <CalendarIcon className="h-3.5 w-3.5 text-primary" />
                    <span>Select Custom Date Window</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground font-medium">Start Date</label>
                      <Input
                        type="date"
                        value={customStart}
                        onChange={(e) => setCustomStart(e.target.value)}
                        className="h-7 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground font-medium">End Date</label>
                      <Input
                        type="date"
                        value={customEnd}
                        onChange={(e) => setCustomEnd(e.target.value)}
                        className="h-7 text-xs"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-1.5 pt-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs px-2"
                      onClick={() => setShowCustomRangePicker(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      className="h-6 text-xs px-2.5"
                      onClick={handleApplyCustomRange}
                      disabled={!customStart || !customEnd}
                    >
                      Apply Window
                    </Button>
                  </div>
                </div>
              )}

              <CardDescription className="text-xs">
                Consolidated financial exposure and collection metrics.
              </CardDescription>
            </CardHeader>
            <CardContent className={`p-4 space-y-4 transition-opacity duration-200 ${isUpdatingFinancials ? "opacity-50 pointer-events-none" : "opacity-100"}`}>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-medium">
                    {financialDateRange === "all" ? "Total Portfolio Budget" : "Portfolio Budget"}
                  </span>
                  {financialDateRange !== "all" && activeFinancials.periodBudget && (
                    <Badge variant="outline" className="text-[10px] font-semibold bg-primary/5 border-primary/20">
                      Period Target: {INR.format(activeFinancials.periodBudget)}
                    </Badge>
                  )}
                </div>
                <span className="text-2xl font-black text-foreground">
                  {INR.format(activeFinancials.totalBudget || 0)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                <div className="bg-muted/30 p-2.5 rounded-lg space-y-0.5">
                  <span className="text-[11px] text-muted-foreground font-medium block">
                    {financialDateRange === "all" ? "Total Invoiced" : "Invoiced in Period"}
                  </span>
                  <span className="text-sm font-bold text-foreground">
                    {INR.format(activeFinancials.totalInvoiced || 0)}
                  </span>
                </div>
                <div className="bg-emerald-500/10 p-2.5 rounded-lg space-y-0.5">
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium block">
                    {financialDateRange === "all" ? "Total Collected" : "Collected in Period"}
                  </span>
                  <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                    {INR.format(activeFinancials.totalPaid || 0)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="bg-muted/30 p-2.5 rounded-lg space-y-0.5">
                  <span className="text-[11px] text-muted-foreground font-medium block">
                    {financialDateRange === "all" ? "Site Expenses" : "Expenses in Period"}
                  </span>
                  <span className="text-sm font-bold text-foreground">
                    {INR.format(activeFinancials.totalExpenses || 0)}
                  </span>
                </div>
                <div className="bg-amber-500/10 p-2.5 rounded-lg space-y-0.5">
                  <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium block">
                    {financialDateRange === "all" ? "Overdue Invoices" : "Overdue in Period"}
                  </span>
                  <span className="text-sm font-bold text-amber-700 dark:text-amber-300">
                    {activeFinancials.overdueInvoices || 0} bills
                    {activeFinancials.overdueAmount > 0 && ` (${INR.format(activeFinancials.overdueAmount)})`}
                  </span>
                </div>
              </div>

              {/* Net Cash Flow & Collection Efficiency */}
              <div className="p-2.5 rounded-lg border bg-muted/20 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground font-medium">Net Cash Flow (Period):</span>
                  <span className={`font-bold flex items-center gap-1 ${
                    (activeFinancials.netCashFlow || 0) >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                  }`}>
                    {(activeFinancials.netCashFlow || 0) >= 0 ? "+" : ""}
                    {INR.format(activeFinancials.netCashFlow || 0)}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Collection Efficiency:</span>
                    <span className="font-semibold text-foreground">{activeFinancials.collectionRate || 0}%</span>
                  </div>
                  <Progress value={Math.min(activeFinancials.collectionRate || 0, 100)} className="h-1.5" />
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs font-semibold gap-1 mt-2"
                onClick={() => setLocation("/finance")}
              >
                Open Financial Control Center <ArrowRight className="h-3 w-3" />
              </Button>
            </CardContent>
          </Card>
        ) : isSiteEngineer ? (
          <Card className="border shadow-sm flex flex-col justify-between">
            <CardHeader className="pb-3 border-b bg-muted/10">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <HardHat className="h-4 w-4 text-primary" />
                Site Field Operations Center
              </CardTitle>
              <CardDescription className="text-xs">
                Field measurements, daily logs, and site quality control.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-foreground block">Today's Field Execution Checklist:</span>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Record muster roll attendance, submit shift progress (DPR), and document contractor work measurements.
                </p>
              </div>

              <div className="space-y-2 pt-1">
                <div
                  onClick={() => setLocation("/site-execution?tab=daily-reports")}
                  className="flex items-center justify-between p-2.5 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <CalendarIcon className="h-4 w-4 text-amber-500" />
                    <div>
                      <div className="font-semibold text-foreground">Daily Progress Report (DPR)</div>
                      <div className="text-[10px] text-muted-foreground">Log shift output & site photos</div>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>

                <div
                  onClick={() => setLocation("/site-execution?tab=attendance")}
                  className="flex items-center justify-between p-2.5 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <Users className="h-4 w-4 text-blue-500" />
                    <div>
                      <div className="font-semibold text-foreground">Site Attendance & Manpower</div>
                      <div className="text-[10px] text-muted-foreground">Track contractor workers on site</div>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>

                <div
                  onClick={() => setLocation("/ra-bills?tab=work-completions")}
                  className="flex items-center justify-between p-2.5 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <Layers className="h-4 w-4 text-emerald-500" />
                    <div>
                      <div className="font-semibold text-foreground">Joint Measurements (JMR)</div>
                      <div className="text-[10px] text-muted-foreground">Verify physical contractor quantities</div>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>

                <div
                  onClick={() => setLocation("/procurement/material-requests/new")}
                  className="flex items-center justify-between p-2.5 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <ShoppingCart className="h-4 w-4 text-purple-500" />
                    <div>
                      <div className="font-semibold text-foreground">Material Requisition (Indent)</div>
                      <div className="text-[10px] text-muted-foreground">Request materials for ongoing tasks</div>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>

                <div
                  onClick={() => setLocation("/quality-safety?tab=snag-list")}
                  className="flex items-center justify-between p-2.5 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <AlertTriangle className="h-4 w-4 text-rose-500" />
                    <div>
                      <div className="font-semibold text-foreground">Snag List & De-Snagging</div>
                      <div className="text-[10px] text-muted-foreground">Log defects & upload resolution photos</div>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        ) : activeRole === "procurement_officer" ? (
          <Card className="border shadow-sm flex flex-col justify-between">
            <CardHeader className="pb-3 border-b bg-muted/10">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Package className="h-4 w-4 text-indigo-600" />
                Procurement Pipeline
              </CardTitle>
              <CardDescription className="text-xs">
                Material requisition sourcing and Purchase Order workflow.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2">
                <span className="text-xs text-muted-foreground block font-medium">Supply Chain Sourcing</span>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Convert approved site requisitions into RFQs, compare vendor quotations, and issue Purchase Orders.
                </p>
              </div>

              <div className="p-3 bg-indigo-500/10 rounded-lg border border-indigo-500/20 space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold text-indigo-800 dark:text-indigo-300">
                  <span>Vendor Sourcing</span>
                  <span>Active</span>
                </div>
                <p className="text-[11px] text-indigo-600 dark:text-indigo-400">
                  Track vendor quotes and delivery timelines for all site materials.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <Button
                  size="sm"
                  className="w-full text-xs font-semibold gap-1"
                  onClick={() => setLocation("/procurement/material-requests")}
                >
                  <ShoppingCart className="h-3.5 w-3.5 mr-1" />
                  Process Material Indents
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs font-semibold gap-1"
                  onClick={() => setLocation("/procurement/rfqs")}
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 mr-1" />
                  Manage RFQs & Quotes
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border shadow-sm flex flex-col justify-between">
            <CardHeader className="pb-3 border-b bg-muted/10">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Project Execution Hub
              </CardTitle>
              <CardDescription className="text-xs">
                Project delivery milestones and task management.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2">
                <span className="text-xs text-muted-foreground block font-medium">Operational Status</span>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Monitor active projects, inspect work logs, and maintain milestone schedules.
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs font-semibold gap-1 mt-2"
                onClick={() => setLocation("/projects")}
              >
                Explore Active Projects <ArrowRight className="h-3 w-3" />
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ── 5. Analytics & Portfolio Breakdown ── */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {(isAdmin || activeRole === "project_manager") ? (
          <Card className="lg:col-span-4 border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold">Pre-Construction Lead Funnel</CardTitle>
              <CardDescription className="text-xs">Pipeline value and volume by conversion milestone.</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={summary.leadFunnel ?? []} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" />
                    <XAxis type="number" tickFormatter={(value) => `₹${(value / 100000).toFixed(1)}L`} />
                    <YAxis dataKey="stage" type="category" width={100} tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value: number) => INR.format(value)}
                      contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}
                    />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="lg:col-span-4 border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold">Operational Project Milestones</CardTitle>
              <CardDescription className="text-xs">Execution progress across active delivery projects.</CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {myProjects.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-10">No projects currently assigned.</p>
              ) : (
                myProjects.slice(0, 4).map((p) => (
                  <div key={p.id} className="space-y-1.5 p-3 rounded-lg bg-muted/20 border">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-foreground">{p.name}</span>
                      <span className="text-primary font-bold">{p.progress}%</span>
                    </div>
                    <Progress value={p.progress} className="h-2" />
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        )}

        {/* Project Stage Distribution */}
        <Card className="lg:col-span-3 border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold">Active Portfolio Breakdown</CardTitle>
            <CardDescription className="text-xs">Count of projects by operational status.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={summary.projectsByStatus ?? []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="count"
                    nameKey="status"
                  >
                    {(summary.projectsByStatus ?? []).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function TrendingDownIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="22 17 13.5 8.5 8.5 13.5 2 7" />
      <polyline points="16 17 22 17 22 11" />
    </svg>
  );
}
