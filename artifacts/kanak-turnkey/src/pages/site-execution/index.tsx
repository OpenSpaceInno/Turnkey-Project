import { useState, useEffect } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useListProjects,
  usePermissions,
  PERMISSIONS,
  type Project,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  HardHat,
  Activity,
  Layers,
  Calendar,
  Target,
  CheckCircle2,
  Clock,
  Plus,
  ArrowRight,
  ClipboardCheck,
  FileCheck2,
  Building2,
  Search,
  Users,
  Truck,
  Sun,
  CloudRain,
  Shield,
  ShieldAlert,
  ShieldCheck,
  FileText,
  TrendingUp,
  AlertCircle,
  AlertTriangle,
  ExternalLink,
  ArrowLeft,
  X,
  Trash2,
  Loader2,
  DollarSign,
  Package,
  Boxes,
  Camera,
  CheckSquare,
  Wrench,
  Receipt,
  Eye,
  Award,
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

// Submodule Tab Components (Core Site Execution Workflow)
import { AttendanceTab } from "./components/AttendanceTab";
import { MaterialConsumptionTab } from "./components/MaterialConsumptionTab";
import { EquipmentTrackingTab } from "./components/EquipmentTrackingTab";
import { DailyProgressReportsTab } from "./components/DailyProgressReportsTab";
import { SiteIssuesDelaysTab } from "./components/SiteIssuesDelaysTab";

const INR = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export default function SiteExecutionPage() {
  const [location, setLocation] = useLocation();
  const search = useSearch();
  const { toast } = useToast();
  const { isAdmin, activeRole } = usePermissions();
  const queryClient = useQueryClient();

  // Parse active tab from URL query param if present
  const tabFromUrl = new URLSearchParams(search).get("tab") || "overview";
  const [activeTab, setActiveTab] = useState<string>(tabFromUrl === "work-completions" ? "overview" : tabFromUrl);

  useEffect(() => {
    const currentTab = new URLSearchParams(search).get("tab") || "overview";
    if (currentTab === "work-completions") {
      const pid = new URLSearchParams(search).get("projectId");
      setLocation(pid ? `/ra-bills?tab=work-completions&projectId=${pid}` : "/ra-bills?tab=work-completions");
      return;
    }
    setActiveTab(currentTab);
  }, [search]);

  const [selectedProjectId, setSelectedProjectId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search).get("projectId");
      if (p && p.trim()) return p.trim();
    }
    return "all";
  });

  // Listen for browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const pid = params.get("projectId");
      setSelectedProjectId(pid && pid.trim() ? pid.trim() : "all");
      const currentTab = params.get("tab") || "overview";
      setActiveTab(currentTab);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Sync tab & selectedProjectId to URL query params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (activeTab === "overview") {
      params.delete("tab");
    } else {
      params.set("tab", activeTab);
    }

    if (selectedProjectId === "all") {
      params.delete("projectId");
    } else {
      params.set("projectId", selectedProjectId);
    }

    const qs = params.toString();
    const url = window.location.pathname + (qs ? `?${qs}` : "");
    window.history.replaceState(null, "", url);
  }, [activeTab, selectedProjectId]);

  const [searchFilter, setSearchFilter] = useState("");

  // Fetch unified site execution summary from backend
  const { data: summaryData, isLoading: loadingSummary } = useQuery<any>({
    queryKey: ["/api/site-execution/summary", selectedProjectId],
    queryFn: async () => {
      const url = selectedProjectId !== "all"
        ? `/api/site-execution/summary?projectId=${selectedProjectId}`
        : "/api/site-execution/summary";
      const res = await fetch(url);
      if (!res.ok) return null;
      return res.json();
    },
  });

  // Fetch projects list
  const { data: projects = [], isLoading: loadingProjects } = useListProjects();

  // Fetch DPR records from database
  const { data: dprLogs = [], isLoading: loadingDprs } = useQuery<any[]>({
    queryKey: ["/api/daily-progress-reports", selectedProjectId],
    queryFn: async () => {
      const url = selectedProjectId !== "all"
        ? `/api/daily-progress-reports?projectId=${selectedProjectId}`
        : "/api/daily-progress-reports";
      const res = await fetch(url);
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Fetch site issues and delays for snapshot
  const { data: siteIssues = [] } = useQuery<any[]>({
    queryKey: ["/api/site-execution/issues-delays", selectedProjectId],
    queryFn: async () => {
      const url = selectedProjectId !== "all"
        ? `/api/site-execution/issues-delays?projectId=${selectedProjectId}`
        : "/api/site-execution/issues-delays";
      const res = await fetch(url);
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Filter projects by selection
  const filteredProjects = projects.filter((p: Project) => {
    if (selectedProjectId !== "all" && p.id !== Number(selectedProjectId)) return false;
    if (searchFilter) {
      const q = searchFilter.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        (p.location && p.location.toLowerCase().includes(q)) ||
        (p.clientName && p.clientName.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Filter site issues by selected project
  const filteredIssues = siteIssues.filter(
    (i: any) => selectedProjectId === "all" || String(i.projectId) === String(selectedProjectId)
  );

  // Filter DPR logs strictly by selected project
  const filteredDprLogs = dprLogs.filter(
    (d) => selectedProjectId === "all" || String(d.projectId) === String(selectedProjectId)
  );

  const currentProject = projects.find((p: Project) => String(p.id) === String(selectedProjectId));

  const handleBack = () => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get("from");
    if (from && from.startsWith("/")) {
      setLocation(decodeURIComponent(from));
      return;
    }
    if (selectedProjectId !== "all") {
      setLocation(`/projects/${selectedProjectId}?tab=journey`);
      return;
    }
    setLocation("/projects");
  };


  // KPIs from unified backend summary
  const kpis = summaryData?.kpis || {
    totalHeadcount: 0,
    totalSkilled: 0,
    totalUnskilled: 0,
    totalLaborCost: 0,
    totalMaterialValue: 0,
    totalMaterialItems: 0,
    lowStockMaterials: 0,
    totalEquipmentCount: 0,
    operationalEquipment: 0,
    idleEquipment: 0,
    breakdownEquipment: 0,
    totalEquipmentCost: 0,
    totalInspections: 0,
    passedInspections: 0,
    passRate: 100,
    openSafetyIncidents: 0,
    toolboxTalksCount: 0,
    totalWorkersTrained: 0,
    openDelaysCount: 0,
    totalDelayDaysImpact: 0,
    totalDelayCostImpact: 0,
    overallProgress: 0,
    totalPhotos: 0,
    totalSiteCosts: 0,
    costBreakdown: { labor: 0, material: 0, equipment: 0, petty_cash: 0, site_overheads: 0 },
    totalDprs: dprLogs.length,
  };

  return (
    <div className="space-y-6">
      {/* ── Top Header and Navigation Bar ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBack}
            className="h-9 w-9 p-0 text-muted-foreground hover:text-foreground shrink-0 shadow-sm"
            title="Go back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <div className="p-2.5 bg-primary/10 rounded-xl text-primary shrink-0 shadow-sm">
            <HardHat className="h-6 w-6" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-black tracking-tight text-foreground">
                Site Execution & Operations
              </h1>
              <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold">
                Turnkey Field Ops
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Integrated site manpower, material stock, machinery, QA checklists, safety HSE, delay tracking, DPR, and work measurements.
            </p>
          </div>
        </div>

        {/* Global Project Filter & DPR Quick Action */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 bg-card border rounded-lg px-2.5 py-1 shadow-sm">
            <Building2 className="h-4 w-4 text-primary shrink-0" />
            <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">Site:</span>
            <Select
              value={selectedProjectId}
              onValueChange={(val) => setSelectedProjectId(val)}
            >
              <SelectTrigger className="border-0 shadow-none focus:ring-0 h-7 text-xs font-bold text-foreground w-[180px] sm:w-[220px]">
                <SelectValue placeholder="All Active Sites" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">🌐 All Projects (Enterprise View)</SelectItem>
                {projects.map((p: Project) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            size="sm"
            className="gap-1.5 text-xs h-9 shadow-sm"
            onClick={() => setActiveTab("daily-reports")}
          >
            <Plus className="h-4 w-4" />
            Submit Daily DPR
          </Button>
        </div>
      </div>

      {/* ── Submodule Navigation Tabs ── */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-muted/70 p-1.5 rounded-xl border w-full justify-start flex-wrap h-auto gap-1 shadow-xs">
          <TabsTrigger value="overview" className="gap-1.5 text-xs py-2 px-3">
            <Activity className="h-3.5 w-3.5 text-primary" />
            Overview
          </TabsTrigger>

          <TabsTrigger value="attendance" className="gap-1.5 text-xs py-2 px-3">
            <Users className="h-3.5 w-3.5 text-blue-600" />
            Attendance & Manpower
            {kpis.totalHeadcount > 0 && (
              <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0 font-bold">
                {kpis.totalHeadcount}
              </Badge>
            )}
          </TabsTrigger>

          <TabsTrigger value="materials" className="gap-1.5 text-xs py-2 px-3">
            <Package className="h-3.5 w-3.5 text-emerald-600" />
            Material & Stock
            {kpis.lowStockMaterials > 0 && (
              <Badge variant="outline" className="ml-1 text-[9px] px-1 py-0 bg-amber-50 text-amber-700 border-amber-300">
                {kpis.lowStockMaterials} Low
              </Badge>
            )}
          </TabsTrigger>

          <TabsTrigger value="equipment" className="gap-1.5 text-xs py-2 px-3">
            <Truck className="h-3.5 w-3.5 text-amber-600" />
            Equipment & Plant
            {kpis.operationalEquipment > 0 && (
              <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">
                {kpis.operationalEquipment} Active
              </Badge>
            )}
          </TabsTrigger>

          <TabsTrigger value="daily-reports" className="gap-1.5 text-xs py-2 px-3">
            <Calendar className="h-3.5 w-3.5 text-foreground" />
            Daily DPR Log
            <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">
              {filteredDprLogs.length}
            </Badge>
          </TabsTrigger>



          <TabsTrigger value="delays" className="gap-1.5 text-xs py-2 px-3">
            <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
            Issues & Delays
            {kpis.openDelaysCount > 0 && (
              <Badge variant="outline" className="ml-1 text-[10px] px-1.5 py-0 bg-rose-50 text-rose-700 border-rose-300">
                +{kpis.totalDelayDaysImpact}d
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ═══════════════════════════════════════════════════════════════════════
            TAB 1: UNIFIED SITE EXECUTION OVERVIEW
        ═══════════════════════════════════════════════════════════════════════ */}
        <TabsContent value="overview" className="space-y-6">
          {/* ── Turnkey Site Execution 6-Step Workflow Guide ── */}
          <Card className="border border-primary/20 bg-gradient-to-r from-primary/5 via-primary/10 to-transparent shadow-xs overflow-hidden">
            <CardContent className="p-4 sm:p-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-primary/15">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className="bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider">
                      Turnkey Site Workflow
                    </Badge>
                    <span className="text-xs font-semibold text-muted-foreground">Standard 6-Step Daily Field Execution Cycle</span>
                  </div>
                  <h3 className="text-sm font-bold text-foreground mt-1">
                    Daily Site Progress, Resource Consumption & Work Certification Lifecycle
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[11px] bg-background text-muted-foreground border-border flex items-center gap-1.5 py-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-teal-600" />
                    <span>Quality QC & Safety HSE are in</span>
                    <Link href="/quality-safety" className="font-bold text-teal-600 hover:underline inline-flex items-center gap-0.5">
                      Quality & Safety Module <ArrowRight className="h-3 w-3" />
                    </Link>
                  </Badge>
                </div>
              </div>

              {/* 5-Step Interactive Process Roadmap */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 pt-4">
                <div
                  onClick={() => setActiveTab("attendance")}
                  className="p-3 rounded-lg bg-card/90 border hover:border-primary/50 transition-all cursor-pointer space-y-1 hover:shadow-xs group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-primary font-mono uppercase tracking-wider">Step 1</span>
                    <Users className="h-3.5 w-3.5 text-blue-600 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="font-bold text-xs text-foreground">Attendance & Roll Call</div>
                  <p className="text-[11px] text-muted-foreground leading-tight">
                    Morning muster roll, skilled & helper headcount, daily wage rates.
                  </p>
                </div>

                <div
                  onClick={() => setActiveTab("materials")}
                  className="p-3 rounded-lg bg-card/90 border hover:border-primary/50 transition-all cursor-pointer space-y-1 hover:shadow-xs group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-primary font-mono uppercase tracking-wider">Step 2</span>
                    <Package className="h-3.5 w-3.5 text-emerald-600 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="font-bold text-xs text-foreground">Material Consumption</div>
                  <p className="text-[11px] text-muted-foreground leading-tight">
                    Issue materials & verify site stock balance vs gate deliveries.
                  </p>
                </div>

                <div
                  onClick={() => setActiveTab("equipment")}
                  className="p-3 rounded-lg bg-card/90 border hover:border-primary/50 transition-all cursor-pointer space-y-1 hover:shadow-xs group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-primary font-mono uppercase tracking-wider">Step 3</span>
                    <Truck className="h-3.5 w-3.5 text-amber-600 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="font-bold text-xs text-foreground">Equipment & Plant</div>
                  <p className="text-[11px] text-muted-foreground leading-tight">
                    Track operating hours, cranes, boom pumps, fuel & machinery logs.
                  </p>
                </div>

                <div
                  onClick={() => setActiveTab("daily-reports")}
                  className="p-3 rounded-lg bg-card/90 border hover:border-primary/50 transition-all cursor-pointer space-y-1 hover:shadow-xs group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-primary font-mono uppercase tracking-wider">Step 4</span>
                    <Calendar className="h-3.5 w-3.5 text-primary group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="font-bold text-xs text-foreground">Daily Progress (DPR)</div>
                  <p className="text-[11px] text-muted-foreground leading-tight">
                    Log daily work diary, weather conditions, shift summary & outputs.
                  </p>
                </div>

                <div
                  onClick={() => setActiveTab("delays")}
                  className="p-3 rounded-lg bg-card/90 border hover:border-primary/50 transition-all cursor-pointer space-y-1 hover:shadow-xs group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-primary font-mono uppercase tracking-wider">Step 5</span>
                    <AlertCircle className="h-3.5 w-3.5 text-rose-600 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="font-bold text-xs text-foreground">Hindrances & Delays</div>
                  <p className="text-[11px] text-muted-foreground leading-tight">
                    Log drawing revisions, client holds, utility cuts & delay impact.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Row 1: High-Impact Site KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card
              className="border shadow-sm bg-card hover:border-primary/40 transition-all cursor-pointer"
              onClick={() => setActiveTab("attendance")}
            >
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
                  <span className="flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-blue-600" /> Site Attendance
                  </span>
                  <Badge variant="outline" className="text-[10px]">
                    {kpis.totalHeadcount} Workers
                  </Badge>
                </div>
                <div className="text-2xl font-black text-foreground">
                  {INR.format(kpis.totalLaborCost)}
                </div>
                <div className="flex justify-between text-[11px] text-muted-foreground pt-1 border-t">
                  <span>Skilled: <strong className="text-emerald-600">{kpis.totalSkilled}</strong></span>
                  <span>Unskilled: <strong className="text-amber-600">{kpis.totalUnskilled}</strong></span>
                  <span>Sup: <strong className="text-blue-600">{kpis.totalSupervisors}</strong></span>
                </div>
              </CardContent>
            </Card>

            <Card
              className="border shadow-sm bg-card hover:border-primary/40 transition-all cursor-pointer"
              onClick={() => setActiveTab("materials")}
            >
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
                  <span className="flex items-center gap-1.5">
                    <Package className="h-4 w-4 text-emerald-600" /> Material Consumption
                  </span>
                  {kpis.lowStockMaterials > 0 ? (
                    <Badge variant="outline" className="text-[9px] bg-amber-50 text-amber-700 border-amber-300">
                      {kpis.lowStockMaterials} Low Stock
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] text-emerald-600">Stock Healthy</Badge>
                  )}
                </div>
                <div className="text-2xl font-black text-emerald-600">
                  {INR.format(kpis.totalMaterialValue)}
                </div>
                <div className="flex justify-between text-[11px] text-muted-foreground pt-1 border-t">
                  <span>Items Tracked: <strong>{kpis.totalMaterialItems}</strong></span>
                  <span>RMC & Steel Active</span>
                </div>
              </CardContent>
            </Card>

            <Card
              className="border shadow-sm bg-card hover:border-primary/40 transition-all cursor-pointer"
              onClick={() => setActiveTab("equipment")}
            >
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
                  <span className="flex items-center gap-1.5">
                    <Truck className="h-4 w-4 text-amber-600" /> Plant & Machinery
                  </span>
                  <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-300 font-bold">
                    {kpis.operationalEquipment} Running
                  </Badge>
                </div>
                <div className="text-2xl font-black text-foreground">
                  {INR.format(kpis.totalEquipmentCost)}
                </div>
                <div className="flex justify-between text-[11px] text-muted-foreground pt-1 border-t">
                  <span>Idle: <strong>{kpis.idleEquipment}</strong></span>
                  <span>Breakdown: <strong className={kpis.breakdownEquipment > 0 ? "text-rose-600" : "text-emerald-600"}>{kpis.breakdownEquipment}</strong></span>
                  <span>Total: <strong>{kpis.totalEquipmentCount}</strong></span>
                </div>
              </CardContent>
            </Card>



            <Card
              className="border shadow-sm bg-card hover:border-primary/40 transition-all cursor-pointer"
              onClick={() => setActiveTab("daily-reports")}
            >
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-primary" /> Daily Progress (DPR)
                  </span>
                  <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30 font-bold">
                    {filteredDprLogs.length} Filed
                  </Badge>
                </div>
                <div className="text-2xl font-black text-foreground">
                  {filteredDprLogs.length} Reports
                </div>
                <div className="flex justify-between text-[11px] text-muted-foreground pt-1 border-t">
                  <span>Shift Diaries Active</span>
                  <span className="text-emerald-600 font-medium">Log Today &apos;s DPR →</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Row 2: Secondary Site Execution Indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card
              className="border shadow-sm bg-card hover:border-primary/40 transition-all cursor-pointer"
              onClick={() => setActiveTab("delays")}
            >
              <CardContent className="p-4 space-y-1.5">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4 text-amber-600" /> Site Hindrances & Delays
                </span>
                <div className="flex items-baseline gap-2">
                  <div className={`text-xl font-bold ${kpis.totalDelayDaysImpact > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                    +{kpis.totalDelayDaysImpact} Days
                  </div>
                  <span className="text-xs text-muted-foreground">Schedule Slip</span>
                </div>
                <div className="flex justify-between text-[11px] text-muted-foreground pt-1 border-t">
                  <span>Open Issues: <strong className="text-rose-600">{kpis.openDelaysCount}</strong></span>
                  <span>Cost Impact: <strong>{INR.format(kpis.totalDelayCostImpact)}</strong></span>
                </div>
              </CardContent>
            </Card>

            <Card
              className="border shadow-sm bg-card hover:border-primary/40 transition-all cursor-pointer"
              onClick={() => setActiveTab("photos")}
            >
              <CardContent className="p-4 space-y-1.5">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Camera className="h-4 w-4 text-purple-600" /> Site Photo Records
                </span>
                <div className="flex items-baseline justify-between">
                  <div className="text-xl font-bold text-purple-600">{kpis.totalPhotos} Photos</div>
                  <span className="text-xs text-muted-foreground">Progress Evidence</span>
                </div>
                <div className="flex justify-between text-[11px] text-muted-foreground pt-1 border-t">
                  <span>Visual stage documentation</span>
                  <span className="text-purple-600 font-medium">Open Gallery →</span>
                </div>
              </CardContent>
            </Card>

            <Card
              className="border shadow-sm bg-card hover:border-primary/40 transition-all cursor-pointer"
              onClick={() => setActiveTab("equipment")}
            >
              <CardContent className="p-4 space-y-1.5">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Truck className="h-4 w-4 text-amber-600" /> Plant & Equipment Deployment
                </span>
                <div className="flex items-baseline justify-between">
                  <div className="text-xl font-bold text-foreground">
                    {kpis.operationalEquipment} Running
                  </div>
                  <span className="text-xs text-muted-foreground">of {kpis.totalEquipmentCount} Total</span>
                </div>
                <div className="flex justify-between text-[11px] text-muted-foreground pt-1 border-t">
                  <span>Idle: <strong>{kpis.idleEquipment}</strong></span>
                  <span>Breakdown: <strong className={kpis.breakdownEquipment > 0 ? "text-rose-600" : "text-emerald-600"}>{kpis.breakdownEquipment}</strong></span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Action Hub */}
          <Card className="border shadow-sm bg-muted/20">
            <CardHeader className="p-4 pb-2 border-b">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                Quick Action Launchpad & Data Entry
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 text-xs justify-start gap-2 bg-background hover:bg-primary/5 hover:text-primary font-bold border-primary/30"
                  onClick={() => setActiveTab("daily-reports")}
                >
                  <Calendar className="h-4 w-4 text-primary" />
                  Submit Daily DPR
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 text-xs justify-start gap-2 bg-background hover:bg-primary/5 hover:text-primary"
                  onClick={() => setActiveTab("attendance")}
                >
                  <Users className="h-4 w-4 text-blue-600" />
                  Log Attendance
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 text-xs justify-start gap-2 bg-background hover:bg-primary/5 hover:text-primary"
                  onClick={() => setActiveTab("materials")}
                >
                  <Package className="h-4 w-4 text-emerald-600" />
                  Log Materials
                </Button>



                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 text-xs justify-start gap-2 bg-background hover:bg-primary/5 hover:text-primary"
                  onClick={() => setActiveTab("delays")}
                >
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  Report Delay
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 text-xs justify-start gap-2 bg-background hover:bg-primary/5 hover:text-primary"
                  onClick={() => setActiveTab("photos")}
                >
                  <Camera className="h-4 w-4 text-purple-600" />
                  Upload Photo
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Active Site Work Fronts Card */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3 border-b bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  Active Project Site Work Fronts
                </CardTitle>
                <CardDescription className="text-xs">
                  Real-time execution status, progress velocity, and work crew allocations.
                </CardDescription>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Filter site by name, city..."
                  className="pl-8 h-8 text-xs bg-background"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {filteredProjects.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  No active projects match your search criteria.
                </div>
              ) : (
                <div className="divide-y">
                  {filteredProjects.map((p: Project) => {
                    const progress = p.progress || 0;
                    return (
                      <div
                        key={p.id}
                        className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/30 transition-colors"
                      >
                        <div className="space-y-1 max-w-md">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm text-foreground">
                              {p.name}
                            </span>
                            <Badge
                              variant="outline"
                              className="text-[10px] capitalize bg-blue-50 text-blue-700 border-blue-200"
                            >
                              {p.status?.replace("_", " ") || "Execution"}
                            </Badge>
                            <span className="text-xs text-muted-foreground font-mono">
                              #{p.id}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            Client: <strong className="text-foreground">{p.clientName}</strong> &bull; Location: {p.location || "On-site"}
                          </p>
                          <div className="flex items-center gap-3 text-[11px] text-muted-foreground pt-1">
                            <span>Type: {p.type || "Turnkey EPC"}</span>
                            <span>Budget: {INR.format(p.budget || 0)}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-6 shrink-0">
                          <div className="w-36 space-y-1">
                            <div className="flex justify-between text-xs font-semibold">
                              <span>Progress</span>
                              <span className="text-primary">{progress}%</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-8 gap-1"
                              onClick={() => {
                                setSelectedProjectId(String(p.id));
                                setActiveTab("overview");
                              }}
                            >
                              Focus Site <ArrowRight className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs h-8 text-primary font-semibold"
                              onClick={() => setLocation(`/projects/${p.id}?tab=journey`)}
                            >
                              Journey Map
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Snapshot: Active Hindrances & Latest DPR Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Active Site Hindrances & Delays */}
            <Card className="border shadow-sm">
              <CardHeader className="pb-3 border-b bg-muted/20 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    Active Hindrances & Delays
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Drawing holds, client approvals, and schedule impact logs.
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-primary"
                  onClick={() => setActiveTab("delays")}
                >
                  View in Delays &rarr;
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {filteredIssues.length === 0 ? (
                  <div className="p-6 text-center text-xs text-muted-foreground">
                    No active hindrances or delays logged for this selection.
                  </div>
                ) : (
                  <div className="divide-y text-xs">
                    {filteredIssues.slice(0, 3).map((issue: any) => (
                      <div
                        key={issue.id}
                        className="p-3 px-4 flex items-center justify-between hover:bg-muted/20"
                      >
                        <div>
                          <div className="font-semibold text-foreground">{issue.title}</div>
                          <div className="text-muted-foreground font-mono text-[11px] mt-0.5">
                            {issue.projectName || "General"} &bull; {issue.category?.replace(/_/g, " ")}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            className={`text-[10px] ${
                              issue.status === "resolved"
                                ? "bg-emerald-600 text-white"
                                : issue.severity === "high" || issue.severity === "critical"
                                ? "bg-rose-600 text-white"
                                : "bg-amber-500 text-white"
                            }`}
                          >
                            {issue.status}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-7"
                            onClick={() => setActiveTab("delays")}
                          >
                            View
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Today's DPR Highlights */}
            <Card className="border shadow-sm">
              <CardHeader className="pb-3 border-b bg-muted/20 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    Latest Daily Progress Reports (DPR)
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Site diaries and daily labor output summaries.
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-primary"
                  onClick={() => setActiveTab("daily-reports")}
                >
                  View All ({filteredDprLogs.length})
                </Button>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {filteredDprLogs.length === 0 ? (
                  <div className="p-6 text-center text-xs text-muted-foreground border rounded-lg border-dashed">
                    No DPRs recorded yet for this selection.
                  </div>
                ) : (
                  filteredDprLogs.slice(0, 2).map((log: any) => (
                    <div key={log.id} className="p-3 rounded-lg border bg-muted/30 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground">{log.projectName}</span>
                        <Badge variant="outline" className="text-[10px] bg-background">
                          {log.weather}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground text-[11px] line-clamp-2">
                        {log.workSummary}
                      </p>
                      <div className="flex items-center justify-between pt-1 text-[10px] text-muted-foreground border-t">
                        <span>Headcount: <strong>{log.manpowerCount || 0}</strong> &bull; Shift: {log.shift}</span>
                        <span className="text-emerald-600 font-semibold">{log.status}</span>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════════════
            TAB 2: SITE ATTENDANCE & MANPOWER
        ═══════════════════════════════════════════════════════════════════════ */}
        <TabsContent value="attendance">
          <AttendanceTab selectedProjectId={selectedProjectId} projects={projects} />
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════════════
            TAB 3: MATERIAL CONSUMPTION & STOCK
        ═══════════════════════════════════════════════════════════════════════ */}
        <TabsContent value="materials">
          <MaterialConsumptionTab selectedProjectId={selectedProjectId} projects={projects} />
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════════════
            TAB 4: EQUIPMENT & PLANT TRACKING
        ═══════════════════════════════════════════════════════════════════════ */}
        <TabsContent value="equipment">
          <EquipmentTrackingTab selectedProjectId={selectedProjectId} projects={projects} />
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════════════
            TAB 4: SITE ISSUES & DELAYS TRACKER
        ═══════════════════════════════════════════════════════════════════════ */}
        <TabsContent value="delays">
          <SiteIssuesDelaysTab selectedProjectId={selectedProjectId} projects={projects} />
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════════════
            TAB: DAILY PROGRESS REPORTS (DPR)
        ═══════════════════════════════════════════════════════════════════════ */}
        <TabsContent value="daily-reports" className="space-y-4">
          <DailyProgressReportsTab selectedProjectId={selectedProjectId} projects={projects} />
        </TabsContent>

      </Tabs>

    </div>
  );
}
