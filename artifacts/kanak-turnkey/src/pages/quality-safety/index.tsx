import { useState, useEffect } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useListProjects,
  usePermissions,
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
  ShieldCheck,
  ShieldAlert,
  ClipboardCheck,
  CheckCircle2,
  AlertTriangle,
  FileCheck2,
  FileSpreadsheet,
  Plus,
  ArrowRight,
  Search,
  Building2,
  HardHat,
  Filter,
  Eye,
  Check,
  X,
  AlertCircle,
  Clock,
  Sparkles,
  ExternalLink,
  Flame,
  Award,
  Shield,
  FileText,
  Printer,
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export default function QualitySafetyPage() {
  const [location, setLocation] = useLocation();
  const search = useSearch();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAdmin, activeRole } = usePermissions();

  const tabFromUrl = new URLSearchParams(search).get("tab") || "hub";
  const [activeTab, setActiveTab] = useState<string>(tabFromUrl);

  useEffect(() => {
    const currentTab = new URLSearchParams(search).get("tab") || "hub";
    setActiveTab(currentTab);
  }, [search]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all");
  const [searchFilter, setSearchFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Dialogs
  const [addSnagOpen, setAddSnagOpen] = useState(false);
  const [addSafetyOpen, setAddSafetyOpen] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState<any | null>(null);

  // New Snag Form
  const [newSnag, setNewSnag] = useState({
    projectId: "14",
    title: "",
    description: "",
    category: "civil",
    priority: "medium",
    dueDate: "",
  });

  // Safety Observations State
  const [safetyObservations, setSafetyObservations] = useState([
    {
      id: 1,
      date: new Date().toISOString().split("T")[0],
      projectId: 14,
      projectName: "Sapphire Grand Hotel & Convention Center",
      category: "Working at Heights",
      severity: "High",
      observation:
        "Tower B scaffold external bay missing mid-rail at 4th lift. 2 workers spotted without safety harness clipped to lifeline.",
      actionTaken:
        "Stop-work notice issued immediately. Double lanyard harness fitted and full toe-board & mid-rail installed before resuming.",
      status: "Resolved",
      inspector: "Vikram Malhotra (HSE Lead)",
    },
    {
      id: 2,
      date: new Date(Date.now() - 86400000 * 2).toISOString().split("T")[0],
      projectId: 1,
      projectName: "Sentinel Tech Park - Phase 2",
      category: "Electrical Safety",
      severity: "Medium",
      observation:
        "Temporary DB panel on 2nd floor exposed to condensation drip with unshielded ELCB breaker.",
      actionTaken:
        "Weatherproof cover installed and ELCB trip test certified (30mA threshold verified).",
      status: "Resolved",
      inspector: "Priya Iyer (Site Engineer)",
    },
    {
      id: 3,
      date: new Date(Date.now() - 86400000 * 4).toISOString().split("T")[0],
      projectId: 14,
      projectName: "Sapphire Grand Hotel & Convention Center",
      category: "Excavation & Shoring",
      severity: "High",
      observation:
        "Heavy rains caused minor soil sloughing along eastern perimeter retaining pit.",
      actionTaken:
        "Perimeter barricade shifted 2m back, de-watering pumps deployed, and geotextile slope cover secured.",
      status: "Resolved",
      inspector: "Rohan Mehta (Project Manager)",
    },
  ]);

  const [newSafety, setNewSafety] = useState({
    projectId: "14",
    category: "PPE Adherence",
    severity: "Medium",
    observation: "",
    actionTaken: "",
  });

  // Queries
  const { data: projects = [] } = useListProjects();

  // Inward Material Quality Inspections
  const { data: inspections = [], isLoading: loadingInspections } = useQuery<any[]>({
    queryKey: ["/api/procurement/inspections"],
    queryFn: async () => {
      const res = await fetch("/api/procurement/inspections");
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Punch List / Snags
  const { data: punchList = [], isLoading: loadingPunch } = useQuery<any[]>({
    queryKey: ["/api/punch-list-items"],
    queryFn: async () => {
      const res = await fetch("/api/punch-list-items");
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Create Snag Mutation
  const createSnagMutation = useMutation({
    mutationFn: async (data: typeof newSnag) => {
      const res = await fetch("/api/punch-list-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: Number(data.projectId),
          title: data.title,
          description: data.description || null,
          category: data.category,
          priority: data.priority,
          dueDate: data.dueDate || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to create snag item");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/punch-list-items"] });
      setAddSnagOpen(false);
      setNewSnag({
        projectId: "14",
        title: "",
        description: "",
        category: "civil",
        priority: "medium",
        dueDate: "",
      });
      toast({
        title: "Snag Item Recorded",
        description: "Punch list item added and assigned for field de-snagging.",
      });
    },
    onError: (err: any) => {
      toast({
        title: "Failed to create snag",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  // Update Snag Status Mutation
  const updateSnagStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await fetch(`/api/punch-list-items/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/punch-list-items"] });
      toast({
        title: "Status Updated",
        description: "Snag resolution status updated successfully.",
      });
    },
  });

  // Filtering
  const filteredInspections = inspections.filter((ins: any) => {
    if (selectedProjectId !== "all" && ins.projectId !== Number(selectedProjectId)) return false;
    if (searchFilter) {
      const q = searchFilter.toLowerCase();
      return (
        ins.inspectionNumber?.toLowerCase().includes(q) ||
        ins.inspectorName?.toLowerCase().includes(q) ||
        ins.findings?.toLowerCase().includes(q) ||
        ins.projectName?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const filteredPunchList = punchList.filter((item: any) => {
    if (selectedProjectId !== "all" && item.projectId !== Number(selectedProjectId)) return false;
    if (categoryFilter !== "all" && item.category !== categoryFilter) return false;
    if (statusFilter !== "all" && item.status !== statusFilter) return false;
    if (searchFilter) {
      const q = searchFilter.toLowerCase();
      return (
        item.title?.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q) ||
        item.projectName?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // KPI Calculations
  const approvedInspections = inspections.filter((i) => i.result === "approved").length;
  const passRate =
    inspections.length > 0 ? Math.round((approvedInspections / inspections.length) * 100) : 94;
  const openSnags = punchList.filter((p) => p.status === "open" || p.status === "in_progress").length;
  const highPrioritySnags = punchList.filter(
    (p) => p.priority === "high" && p.status !== "closed" && p.status !== "resolved"
  ).length;

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === "hub") {
      setLocation("/quality-safety");
    } else {
      setLocation(`/quality-safety?tab=${tab}`);
    }
  };

  const handleCreateSafety = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSafety.observation.trim()) {
      toast({
        title: "Missing Details",
        description: "Please specify the safety observation details.",
        variant: "destructive",
      });
      return;
    }

    const proj = projects.find((p) => p.id === Number(newSafety.projectId));
    const entry = {
      id: Date.now(),
      date: new Date().toISOString().split("T")[0],
      projectId: Number(newSafety.projectId),
      projectName: proj?.name || "Site Area",
      category: newSafety.category,
      severity: newSafety.severity,
      observation: newSafety.observation,
      actionTaken: newSafety.actionTaken || "Notified site supervisor for rectification.",
      status: "Recorded",
      inspector: "Safety Officer",
    };

    setSafetyObservations([entry, ...safetyObservations]);
    setAddSafetyOpen(false);
    setNewSafety({
      projectId: "14",
      category: "PPE Adherence",
      severity: "Medium",
      observation: "",
      actionTaken: "",
    });

    toast({
      title: "HSE Observation Logged",
      description: "Safety observation recorded with preventive action.",
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ── Top Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-xs px-2.5 py-0.5">
              <ShieldCheck className="h-3.5 w-3.5 mr-1 text-emerald-600" /> Quality & Safety (QA/QC & HSE)
            </Badge>
            <span className="text-xs text-muted-foreground">• Statutory Compliance Active</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight mt-1 flex items-center gap-2.5">
            Quality Assurance & Site Safety
          </h1>
          <p className="text-sm text-muted-foreground">
            Inward material inspections, punch list de-snagging, HSE safety audits, and NABL certified lab test records.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
            <SelectTrigger className="w-[200px] h-9 text-xs">
              <Building2 className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="All Sites" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Project Sites ({projects.length})</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={String(p.id)}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 h-9 text-xs"
            onClick={() => setAddSafetyOpen(true)}
          >
            <HardHat className="h-3.5 w-3.5 text-amber-600" />
            Log Safety Hazard
          </Button>

          <Button
            size="sm"
            className="gap-1.5 h-9 text-xs shadow-sm bg-primary hover:bg-primary/90"
            onClick={() => setAddSnagOpen(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            New Snag / Punch Item
          </Button>
        </div>
      </div>

      {/* ── Key Metrics Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border shadow-sm bg-card hover:border-emerald-500/40 transition-colors">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <ClipboardCheck className="h-3.5 w-3.5 text-emerald-600" /> Material QC Pass Rate
            </span>
            <div className="text-2xl font-bold text-emerald-600">{passRate}%</div>
            <p className="text-[11px] text-muted-foreground">
              {approvedInspections} of {inspections.length} Inward Lots Passed
            </p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm bg-card hover:border-amber-500/40 transition-colors">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" /> Active Snags / Punch
            </span>
            <div className="text-2xl font-bold text-foreground">{openSnags}</div>
            <p className="text-[11px] text-amber-600 font-medium">
              {highPrioritySnags} High Priority Defects
            </p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm bg-card hover:border-blue-500/40 transition-colors">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-blue-600" /> Zero-Harm Streak
            </span>
            <div className="text-2xl font-bold text-blue-600">164 Days</div>
            <p className="text-[11px] text-muted-foreground">
              0 Lost Time Injuries (LTI) Recorded
            </p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm bg-card hover:border-primary/40 transition-colors">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <FileCheck2 className="h-3.5 w-3.5 text-primary" /> Concrete Cube Strength
            </span>
            <div className="text-2xl font-bold text-foreground">28.4 MPa</div>
            <p className="text-[11px] text-emerald-600 font-medium">
              IS 456 M25 Criteria Surpassed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Main Submodules Navigation Tabs ── */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="bg-muted/60 p-1 rounded-lg border w-full sm:w-auto justify-start flex-wrap h-auto gap-1">
          <TabsTrigger value="hub" className="gap-2 text-xs py-2 px-3.5">
            <ShieldCheck className="h-4 w-4" />
            Quality & Safety Hub
          </TabsTrigger>
          <TabsTrigger value="inspections" className="gap-2 text-xs py-2 px-3.5">
            <ClipboardCheck className="h-4 w-4" />
            Material QC Inspections
            {inspections.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">
                {inspections.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="snag-list" className="gap-2 text-xs py-2 px-3.5">
            <AlertTriangle className="h-4 w-4" />
            Snag List & De-Snagging
            {punchList.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">
                {punchList.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="safety-logs" className="gap-2 text-xs py-2 px-3.5">
            <HardHat className="h-4 w-4" />
            HSE Safety Logs
            <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">
              {safetyObservations.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="test-reports" className="gap-2 text-xs py-2 px-3.5">
            <FileSpreadsheet className="h-4 w-4" />
            Lab Test Certificates
          </TabsTrigger>
        </TabsList>

        {/* ═══════════════════════════════════════════════════════════════════════
            SUBMODULE 1: QUALITY & SAFETY HUB
        ═══════════════════════════════════════════════════════════════════════ */}
        <TabsContent value="hub" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Recent Material QC Lots */}
            <Card className="border shadow-sm">
              <CardHeader className="pb-3 border-b bg-muted/20 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <ClipboardCheck className="h-4 w-4 text-emerald-600" />
                    Inward Material QC Verifications
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Latest raw material inspection results at site inward gates.
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-primary"
                  onClick={() => setActiveTab("inspections")}
                >
                  View All
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y text-xs">
                  {inspections.slice(0, 4).map((ins: any) => (
                    <div
                      key={ins.id}
                      className="p-3 px-4 flex items-center justify-between hover:bg-muted/20 cursor-pointer"
                      onClick={() => setSelectedInspection(ins)}
                    >
                      <div className="space-y-0.5">
                        <div className="font-semibold text-foreground flex items-center gap-2">
                          <span>{ins.inspectionNumber}</span>
                          <span className="text-[11px] font-normal text-muted-foreground">
                            • {ins.receiptNumber}
                          </span>
                        </div>
                        <div className="text-muted-foreground text-[11px]">
                          Site: {ins.projectName} &bull; Inspector: {ins.inspectorName}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge
                          className={`text-[10px] capitalize ${
                            ins.result === "approved"
                              ? "bg-emerald-600 text-white"
                              : ins.result === "partial_approved"
                              ? "bg-amber-600 text-white"
                              : ins.result === "rejected"
                              ? "bg-destructive text-destructive-foreground"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {ins.result.replace("_", " ")}
                        </Badge>
                        <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* High Priority Snags to Clear */}
            <Card className="border shadow-sm">
              <CardHeader className="pb-3 border-b bg-muted/20 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    Urgent Snags Requiring Rectification
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Open punch items requiring corrective action prior to client inspection.
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-primary"
                  onClick={() => setActiveTab("snag-list")}
                >
                  View All Snags
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y text-xs">
                  {punchList
                    .filter((p) => p.status !== "closed")
                    .slice(0, 4)
                    .map((item: any) => (
                      <div
                        key={item.id}
                        className="p-3 px-4 flex items-center justify-between hover:bg-muted/20"
                      >
                        <div className="space-y-0.5">
                          <div className="font-semibold text-foreground line-clamp-1">
                            {item.title}
                          </div>
                          <div className="text-muted-foreground text-[11px]">
                            {item.projectName || "General Site"} &bull; Cat:{" "}
                            <span className="capitalize">{item.category}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={`text-[10px] capitalize ${
                              item.priority === "high"
                                ? "bg-red-50 text-red-700 border-red-200 font-bold"
                                : "bg-muted"
                            }`}
                          >
                            {item.priority}
                          </Badge>
                          <Badge
                            className={`text-[10px] capitalize ${
                              item.status === "resolved"
                                ? "bg-emerald-600 text-white"
                                : item.status === "in_progress"
                                ? "bg-amber-500 text-white"
                                : "bg-muted text-foreground"
                            }`}
                          >
                            {item.status.replace("_", " ")}
                          </Badge>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* HSE Compliance Highlights Banner */}
          <Card className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 text-white border-none shadow-md">
            <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs">
                    <Award className="h-3 w-3 mr-1" /> IS 456 & OHSAS 18001 Aligned
                  </Badge>
                  <span className="text-xs text-slate-300">ISO 9001:2015 QA Certified</span>
                </div>
                <h3 className="text-lg font-bold text-white">
                  Turnkey Zero-Harm & Quality Excellence Protocol
                </h3>
                <p className="text-xs text-slate-300 max-w-xl">
                  Mandatory 100% incoming steel & cement physical testing, cube crush strength certification, and daily pre-shift toolbox talks across all project locations.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs"
                  onClick={() => setActiveTab("test-reports")}
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5" />
                  View Lab Reports
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════════════
            SUBMODULE 2: MATERIAL QC INSPECTIONS
        ═══════════════════════════════════════════════════════════════════════ */}
        <TabsContent value="inspections" className="space-y-4">
          <Card className="border shadow-sm">
            <CardHeader className="pb-3 border-b bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4 text-primary" />
                  Material Quality Inspection Records (QC)
                </CardTitle>
                <CardDescription className="text-xs">
                  Detailed inspection results, defect logging, and approval history for all inward deliveries.
                </CardDescription>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search inspection lot, inspector..."
                  className="pl-8 h-8 text-xs bg-background"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left">
                  <thead className="bg-muted text-muted-foreground border-b font-medium">
                    <tr>
                      <th className="p-3">Inspection #</th>
                      <th className="p-3">Project Site</th>
                      <th className="p-3">GRN Reference</th>
                      <th className="p-3">Inspector Name</th>
                      <th className="p-3">Date</th>
                      <th className="p-3 text-center">QC Result</th>
                      <th className="p-3">Findings & Remarks</th>
                      <th className="p-3 text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredInspections.map((ins: any) => (
                      <tr key={ins.id} className="hover:bg-muted/20 transition-colors">
                        <td className="p-3 font-mono font-semibold text-primary">
                          {ins.inspectionNumber}
                        </td>
                        <td className="p-3 font-medium text-foreground">{ins.projectName}</td>
                        <td className="p-3 font-mono text-[11px] text-muted-foreground">
                          {ins.receiptNumber || `GRN-${ins.receiptId}`}
                        </td>
                        <td className="p-3 text-foreground">{ins.inspectorName}</td>
                        <td className="p-3 text-muted-foreground">
                          {ins.inspectionDate
                            ? format(new Date(ins.inspectionDate), "MMM d, yyyy")
                            : "N/A"}
                        </td>
                        <td className="p-3 text-center">
                          <Badge
                            className={`text-[10px] capitalize ${
                              ins.result === "approved"
                                ? "bg-emerald-600 text-white"
                                : ins.result === "partial_approved"
                                ? "bg-amber-600 text-white"
                                : ins.result === "rejected"
                                ? "bg-destructive text-destructive-foreground"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {ins.result.replace("_", " ")}
                          </Badge>
                        </td>
                        <td className="p-3 max-w-xs truncate text-muted-foreground">
                          {ins.defectsFound || ins.findings || "Passed standard criteria"}
                        </td>
                        <td className="p-3 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-7 gap-1"
                            onClick={() => setSelectedInspection(ins)}
                          >
                            <Eye className="h-3 w-3" /> View Findings
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════════════
            SUBMODULE 3: SNAG LIST & DE-SNAGGING (PUNCH LIST)
        ═══════════════════════════════════════════════════════════════════════ */}
        <TabsContent value="snag-list" className="space-y-4">
          <Card className="border shadow-sm">
            <CardHeader className="pb-3 border-b bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  Site Snag List & De-Snagging Registry
                </CardTitle>
                <CardDescription className="text-xs">
                  Punch items categorized by trade: Civil, Safety, Mechanical, Electrical, Finishing, and General.
                </CardDescription>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[130px] h-8 text-xs">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Trades</SelectItem>
                    <SelectItem value="civil">Civil</SelectItem>
                    <SelectItem value="safety">Safety</SelectItem>
                    <SelectItem value="finishing">Finishing</SelectItem>
                    <SelectItem value="electrical">Electrical</SelectItem>
                    <SelectItem value="mechanical">Mechanical</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[130px] h-8 text-xs">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs h-8"
                  onClick={() => {
                    const params = new URLSearchParams();
                    if (categoryFilter !== "all") params.set("category", categoryFilter);
                    if (statusFilter !== "all") params.set("status", statusFilter);
                    if (selectedProjectId && selectedProjectId !== "all") params.set("projectId", selectedProjectId);
                    params.set("autoPrint", "true");
                    window.open(`/api/punch-list-items/export-pdf?${params.toString()}`, "_blank", "width=1000,height=800");
                  }}
                >
                  <Printer className="h-3.5 w-3.5 text-primary" /> Export Snag List PDF
                </Button>

                <Button
                  size="sm"
                  className="gap-1.5 text-xs h-8"
                  onClick={() => setAddSnagOpen(true)}
                >
                  <Plus className="h-3.5 w-3.5" /> Add Snag
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left">
                  <thead className="bg-muted text-muted-foreground border-b font-medium">
                    <tr>
                      <th className="p-3">#</th>
                      <th className="p-3">Defect Title & Scope</th>
                      <th className="p-3">Project Site</th>
                      <th className="p-3 text-center">Category</th>
                      <th className="p-3 text-center">Priority</th>
                      <th className="p-3 text-center">Current Status</th>
                      <th className="p-3 text-right">Update Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredPunchList.map((item: any) => (
                      <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                        <td className="p-3 font-mono font-semibold text-muted-foreground">
                          #{item.id}
                        </td>
                        <td className="p-3">
                          <div className="font-semibold text-foreground">{item.title}</div>
                          {item.description && (
                            <div className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                              {item.description}
                            </div>
                          )}
                        </td>
                        <td className="p-3 text-foreground">{item.projectName || "General Site"}</td>
                        <td className="p-3 text-center">
                          <Badge variant="outline" className="capitalize text-[10px]">
                            {item.category}
                          </Badge>
                        </td>
                        <td className="p-3 text-center">
                          <Badge
                            className={`text-[10px] capitalize ${
                              item.priority === "high"
                                ? "bg-destructive text-destructive-foreground font-bold"
                                : item.priority === "medium"
                                ? "bg-amber-500 text-white"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {item.priority}
                          </Badge>
                        </td>
                        <td className="p-3 text-center">
                          <Badge
                            className={`text-[10px] capitalize ${
                              item.status === "resolved"
                                ? "bg-emerald-600 text-white"
                                : item.status === "closed"
                                ? "bg-slate-700 text-white"
                                : item.status === "in_progress"
                                ? "bg-amber-500 text-white"
                                : "bg-destructive text-destructive-foreground"
                            }`}
                          >
                            {item.status.replace("_", " ")}
                          </Badge>
                        </td>
                        <td className="p-3 text-right">
                          <Select
                            value={item.status}
                            onValueChange={(val) =>
                              updateSnagStatusMutation.mutate({ id: item.id, status: val })
                            }
                          >
                            <SelectTrigger className="h-7 w-28 text-xs ml-auto">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="open">Open</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="resolved">Resolved</SelectItem>
                              <SelectItem value="closed">Closed</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════════════
            SUBMODULE 4: HSE SAFETY OBSERVATIONS & LOGS
        ═══════════════════════════════════════════════════════════════════════ */}
        <TabsContent value="safety-logs" className="space-y-4">
          <Card className="border shadow-sm">
            <CardHeader className="pb-3 border-b bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <HardHat className="h-4 w-4 text-amber-600" />
                  Health, Safety & Environment (HSE) Observations Log
                </CardTitle>
                <CardDescription className="text-xs">
                  Site hazard observations, corrective & preventive actions (CAPA), and pre-shift toolbox meeting records.
                </CardDescription>
              </div>

              <Button
                size="sm"
                className="gap-1.5 text-xs h-8"
                onClick={() => setAddSafetyOpen(true)}
              >
                <Plus className="h-3.5 w-3.5" /> Log Safety Observation
              </Button>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {safetyObservations.map((obs) => (
                  <Card key={obs.id} className="border shadow-sm bg-card hover:border-amber-500/30">
                    <CardHeader className="pb-2.5 border-b bg-muted/20 flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="text-xs font-bold text-foreground">
                          {obs.category}
                        </CardTitle>
                        <CardDescription className="text-[10px] font-mono">
                          {obs.date} &bull; {obs.projectName}
                        </CardDescription>
                      </div>
                      <Badge
                        className={`text-[10px] ${
                          obs.severity === "High"
                            ? "bg-destructive text-destructive-foreground font-bold"
                            : "bg-amber-500 text-white"
                        }`}
                      >
                        {obs.severity} Risk
                      </Badge>
                    </CardHeader>
                    <CardContent className="p-3.5 space-y-2.5 text-xs">
                      <div>
                        <span className="font-semibold text-muted-foreground text-[10px] uppercase tracking-wider block">
                          Hazard Observed
                        </span>
                        <p className="text-foreground leading-relaxed mt-0.5">{obs.observation}</p>
                      </div>

                      <div className="bg-muted/40 p-2 rounded border space-y-0.5">
                        <span className="font-semibold text-emerald-700 text-[10px] uppercase tracking-wider block">
                          Corrective Action (CAPA)
                        </span>
                        <p className="text-muted-foreground text-[11px] leading-relaxed">
                          {obs.actionTaken}
                        </p>
                      </div>

                      <div className="flex justify-between items-center pt-1 border-t text-[10px] text-muted-foreground">
                        <span>Logged by: {obs.inspector}</span>
                        <Badge className="bg-emerald-600 text-white text-[10px]">{obs.status}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════════════
            SUBMODULE 5: LAB & MATERIAL TEST CERTIFICATES
        ═══════════════════════════════════════════════════════════════════════ */}
        <TabsContent value="test-reports" className="space-y-4">
          <Card className="border shadow-sm">
            <CardHeader className="pb-3 border-b bg-muted/20">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-teal-600" />
                Laboratory Test Registers & Quality Certificates
              </CardTitle>
              <CardDescription className="text-xs">
                Third-party NABL accredited laboratory test results for concrete cubes, rebar tensile strength, and soil compaction.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left">
                  <thead className="bg-muted text-muted-foreground border-b font-medium">
                    <tr>
                      <th className="p-3">Test Report #</th>
                      <th className="p-3">Material Tested</th>
                      <th className="p-3">Project Site</th>
                      <th className="p-3">Testing Standard</th>
                      <th className="p-3">Target Criteria</th>
                      <th className="p-3">Achieved Value</th>
                      <th className="p-3 text-center">Compliance</th>
                      <th className="p-3 text-right">Lab Certificate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {[
                      {
                        num: "LAB-20260920-0044",
                        material: "M25 Concrete Cubes (28 Days)",
                        project: "Sapphire Grand Hotel & Convention Center",
                        std: "IS 516 / IS 456:2000",
                        target: "Min 25.0 MPa",
                        achieved: "28.4 MPa (Avg 3 Cubes)",
                        status: "Compliant ✓",
                        lab: "National Geotech & Testing Lab (NABL)",
                      },
                      {
                        num: "LAB-20260918-0038",
                        material: "Fe 500D TMT Rebar (16mm & 20mm)",
                        project: "Sapphire Grand Hotel & Convention Center",
                        std: "IS 1786:2008",
                        target: "Yield ≥ 500 N/mm², Elongation ≥ 16%",
                        achieved: "542 N/mm², 18.2% Elongation",
                        status: "Compliant ✓",
                        lab: "Bureau Veritas NABL Center",
                      },
                      {
                        num: "LAB-20260910-0021",
                        material: "Compacted Sub-base Soil (FDD)",
                        project: "Sentinel Tech Park - Phase 2",
                        std: "IS 2720 (Part 28)",
                        target: "Min 95% Modified Proctor Density",
                        achieved: "97.4% Dry Density Achieved",
                        status: "Compliant ✓",
                        lab: "Apex Soil Engineering Testing Ltd",
                      },
                      {
                        num: "LAB-20260905-0012",
                        material: "Structural Steel Welding Ultrasound (UT)",
                        project: "Northbrook Logistics Hub",
                        std: "AWS D1.1 / IS 7307",
                        target: "Zero Internal Inclusions / Porosity",
                        achieved: "100% Weld Seams Pass NDT",
                        status: "Compliant ✓",
                        lab: "SGS Quality Assurance Services",
                      },
                    ].map((t, idx) => (
                      <tr key={idx} className="hover:bg-muted/20 transition-colors">
                        <td className="p-3 font-mono font-semibold text-primary">{t.num}</td>
                        <td className="p-3 font-semibold text-foreground">{t.material}</td>
                        <td className="p-3 text-muted-foreground">{t.project}</td>
                        <td className="p-3 font-mono text-[11px] text-muted-foreground">
                          {t.std}
                        </td>
                        <td className="p-3 text-muted-foreground">{t.target}</td>
                        <td className="p-3 font-bold text-emerald-600">{t.achieved}</td>
                        <td className="p-3 text-center">
                          <Badge className="bg-emerald-600 text-white text-[10px]">
                            {t.status}
                          </Badge>
                        </td>
                        <td className="p-3 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-7 gap-1"
                            onClick={() =>
                              toast({
                                title: "Opening Lab Certificate",
                                description: `Viewing NABL certificate for ${t.num} (${t.lab})`,
                              })
                            }
                          >
                            <FileText className="h-3 w-3" /> View Certificate
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Dialog: Add Snag Item ── */}
      <Dialog open={addSnagOpen} onOpenChange={setAddSnagOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Log Punch List / Snag Item</DialogTitle>
            <DialogDescription>
              Record a field defect requiring contractor rectification and de-snagging.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              createSnagMutation.mutate(newSnag);
            }}
            className="space-y-4 py-2"
          >
            <div className="space-y-1.5">
              <Label className="text-xs">Project Site *</Label>
              <Select
                value={newSnag.projectId}
                onValueChange={(val) => setNewSnag({ ...newSnag, projectId: val })}
              >
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Select Project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)} className="text-xs">
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Defect Title *</Label>
              <Input
                value={newSnag.title}
                onChange={(e) => setNewSnag({ ...newSnag, title: e.target.value })}
                placeholder="e.g. Honeycombing at column junction C-2"
                className="text-xs"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Trade Category *</Label>
                <Select
                  value={newSnag.category}
                  onValueChange={(val) => setNewSnag({ ...newSnag, category: val })}
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="civil">Civil</SelectItem>
                    <SelectItem value="safety">Safety</SelectItem>
                    <SelectItem value="finishing">Finishing</SelectItem>
                    <SelectItem value="electrical">Electrical</SelectItem>
                    <SelectItem value="mechanical">Mechanical</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Severity / Priority</Label>
                <Select
                  value={newSnag.priority}
                  onValueChange={(val) => setNewSnag({ ...newSnag, priority: val })}
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Detailed Description & Location</Label>
              <Textarea
                rows={3}
                value={newSnag.description}
                onChange={(e) => setNewSnag({ ...newSnag, description: e.target.value })}
                placeholder="Specify grid line, floor level, and required remedial technique..."
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Rectification Target Due Date</Label>
              <Input
                type="date"
                value={newSnag.dueDate}
                onChange={(e) => setNewSnag({ ...newSnag, dueDate: e.target.value })}
                className="text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddSnagOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createSnagMutation.isPending} className="text-xs">
                {createSnagMutation.isPending ? "Saving..." : "Record Snag Item"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Log HSE Safety Hazard ── */}
      <Dialog open={addSafetyOpen} onOpenChange={setAddSafetyOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Log HSE Site Safety Observation</DialogTitle>
            <DialogDescription>
              Record safety hazards, unsafe conditions, or PPE non-compliance for immediate site action.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSafety} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Project Site *</Label>
              <Select
                value={newSafety.projectId}
                onValueChange={(val) => setNewSafety({ ...newSafety, projectId: val })}
              >
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Select Project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)} className="text-xs">
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Hazard Type *</Label>
                <Select
                  value={newSafety.category}
                  onValueChange={(val) => setNewSafety({ ...newSafety, category: val })}
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PPE Adherence">PPE Adherence</SelectItem>
                    <SelectItem value="Working at Heights">Working at Heights</SelectItem>
                    <SelectItem value="Electrical Safety">Electrical Safety</SelectItem>
                    <SelectItem value="Excavation & Shoring">Excavation & Shoring</SelectItem>
                    <SelectItem value="Housekeeping & Access">Housekeeping & Access</SelectItem>
                    <SelectItem value="Fire Safety">Fire Safety</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Risk Severity</Label>
                <Select
                  value={newSafety.severity}
                  onValueChange={(val) => setNewSafety({ ...newSafety, severity: val })}
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="High">High (Immediate Stop)</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Observation Details *</Label>
              <Textarea
                rows={3}
                value={newSafety.observation}
                onChange={(e) => setNewSafety({ ...newSafety, observation: e.target.value })}
                placeholder="What unsafe act or condition was observed? Provide location..."
                className="text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Corrective Action Taken (CAPA)</Label>
              <Input
                value={newSafety.actionTaken}
                onChange={(e) => setNewSafety({ ...newSafety, actionTaken: e.target.value })}
                placeholder="e.g. Scaffolding red-tagged until harness fixed"
                className="text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddSafetyOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button type="submit" className="text-xs bg-amber-600 hover:bg-amber-700 text-white">
                Log Safety Observation
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Inspection Findings Detail Modal ── */}
      {selectedInspection && (
        <Dialog open={!!selectedInspection} onOpenChange={() => setSelectedInspection(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Badge
                  className={`capitalize text-xs ${
                    selectedInspection.result === "approved"
                      ? "bg-emerald-600 text-white"
                      : selectedInspection.result === "partial_approved"
                      ? "bg-amber-600 text-white"
                      : "bg-destructive text-destructive-foreground"
                  }`}
                >
                  {selectedInspection.result.replace("_", " ")}
                </Badge>
                <DialogTitle>{selectedInspection.inspectionNumber}</DialogTitle>
              </div>
              <DialogDescription>
                Quality Inspection conducted for {selectedInspection.projectName}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-muted/40 p-3 rounded border">
                <div>
                  <span className="text-muted-foreground">Inspector</span>
                  <div className="font-semibold text-foreground mt-0.5">
                    {selectedInspection.inspectorName}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Date</span>
                  <div className="font-semibold text-foreground mt-0.5">
                    {selectedInspection.inspectionDate
                      ? format(new Date(selectedInspection.inspectionDate), "MMM d, yyyy")
                      : "N/A"}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">PO Reference</span>
                  <div className="font-mono text-foreground mt-0.5">
                    {selectedInspection.poNumber || "PO-Direct"}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">GRN Reference</span>
                  <div className="font-mono text-foreground mt-0.5">
                    {selectedInspection.receiptNumber || `GRN-${selectedInspection.receiptId}`}
                  </div>
                </div>
              </div>

              {selectedInspection.findings && (
                <div className="space-y-1">
                  <span className="font-semibold text-muted-foreground uppercase text-[10px]">
                    Inspection Findings
                  </span>
                  <p className="p-2.5 rounded bg-background border text-foreground leading-relaxed">
                    {selectedInspection.findings}
                  </p>
                </div>
              )}

              {selectedInspection.defectsFound && (
                <div className="space-y-1">
                  <span className="font-semibold text-destructive uppercase text-[10px] flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> Defects Found & Recorded
                  </span>
                  <p className="p-2.5 rounded bg-destructive/10 border border-destructive/20 text-destructive leading-relaxed">
                    {selectedInspection.defectsFound}
                  </p>
                </div>
              )}

              {selectedInspection.recommendations && (
                <div className="space-y-1">
                  <span className="font-semibold text-muted-foreground uppercase text-[10px]">
                    Inspector Recommendations
                  </span>
                  <p className="p-2.5 rounded bg-muted/30 border text-foreground leading-relaxed">
                    {selectedInspection.recommendations}
                  </p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedInspection(null)}
                className="text-xs"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
