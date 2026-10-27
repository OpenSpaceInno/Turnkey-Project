import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  Users,
  HardHat,
  Plus,
  Trash2,
  Calendar,
  Clock,
  Briefcase,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  XCircle,
  TrendingUp,
  DollarSign,
  ArrowRight,
  UserPlus,
  Edit2,
  Save,
  Layers,
  Sparkles,
  BarChart3,
  Check,
  Building2,
  RefreshCw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const INR = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

interface AttendanceTabProps {
  selectedProjectId: string;
  projects: any[];
}

const TRADES = [
  "Civil / Concreting",
  "Bar Bending & Steelwork",
  "Carpentry & Shuttering",
  "Masonry & AAC Blockwork",
  "Electrical & Wiring",
  "Plumbing & Sanitation",
  "Flooring & Tiling",
  "Painting & Finishing",
  "HVAC & Firefighting",
  "Site Supervision & QA",
  "General Labor & Curing",
  "Material Handling & Cleanup",
];

const CATEGORY_DEFAULT_RATES: Record<string, number> = {
  Supervisor: 1350,
  Skilled: 900,
  Unskilled: 500,
};

interface WorkerAttendanceRow {
  id: number | null;
  workerId: number;
  projectId: number;
  projectName: string;
  name: string;
  category: "Supervisor" | "Skilled" | "Unskilled";
  trade: string;
  contractorName: string;
  phone?: string | null;
  assignedDailyWageRate: number;
  attendanceDate: string;
  status: "present" | "half_day" | "absent";
  daysWorked: number;
  dailyWageRate: number;
  payableAmount: number;
  shift: string;
  remarks: string;
  isMarked?: boolean;
}

export function AttendanceTab({ selectedProjectId, projects }: AttendanceTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Active project ID resolution
  const [activeProjectId, setActiveProjectId] = useState<string>(() => {
    if (selectedProjectId && selectedProjectId !== "all") return selectedProjectId;
    return projects[0]?.id ? String(projects[0].id) : "19";
  });

  // Sync if selectedProjectId changes from outside
  React.useEffect(() => {
    if (selectedProjectId && selectedProjectId !== "all") {
      setActiveProjectId(selectedProjectId);
    }
  }, [selectedProjectId]);

  // Main Sub-view tab
  const [activeView, setActiveView] = useState<"muster" | "reports" | "directory">("muster");

  // Date selection
  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Filters
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Reports Period
  const [reportPeriod, setReportPeriod] = useState<"daily" | "weekly" | "monthly">("monthly");

  // Add Worker Modal
  const [addWorkerOpen, setAddWorkerOpen] = useState(false);
  const [newWorker, setNewWorker] = useState({
    name: "",
    category: "Skilled" as "Supervisor" | "Skilled" | "Unskilled",
    trade: "Civil / Concreting",
    contractorName: "",
    dailyWageRate: "900",
    phone: "",
  });

  // Edit Worker Modal
  const [editWorkerOpen, setEditWorkerOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<any>(null);

  // Local state for daily muster roll (allows real-time status and wage rate edits before batch save)
  const [localRows, setLocalRows] = useState<WorkerAttendanceRow[]>([]);
  const [isDirty, setIsDirty] = useState(false);

  // 1. Fetch Daily Muster Roll & Overall Stats
  const {
    data: attendanceData,
    isLoading: isLoadingMuster,
    refetch: refetchMuster,
  } = useQuery({
    queryKey: ["/api/site-execution/worker-attendance", activeProjectId, selectedDate],
    queryFn: async () => {
      const url = `/api/site-execution/worker-attendance?projectId=${activeProjectId}&date=${selectedDate}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch muster roll");
      return res.json();
    },
  });

  // Sync server data to local state whenever fresh data arrives
  React.useEffect(() => {
    if (attendanceData?.records) {
      setLocalRows(attendanceData.records);
      setIsDirty(false);
    }
  }, [attendanceData]);

  // 2. Fetch Labour Cost Reports
  const {
    data: reportsData,
    isLoading: isLoadingReports,
    refetch: refetchReports,
  } = useQuery({
    queryKey: ["/api/site-execution/worker-attendance/reports", activeProjectId, reportPeriod, selectedDate],
    queryFn: async () => {
      const url = `/api/site-execution/worker-attendance/reports?projectId=${activeProjectId}&period=${reportPeriod}&date=${selectedDate}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch labour reports");
      return res.json();
    },
    enabled: activeView === "reports",
  });

  // 3. Fetch Worker Directory
  const {
    data: workersDirectory = [],
    isLoading: isLoadingDirectory,
    refetch: refetchDirectory,
  } = useQuery<any[]>({
    queryKey: ["/api/site-execution/workers", activeProjectId],
    queryFn: async () => {
      const url = `/api/site-execution/workers?projectId=${activeProjectId}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch worker directory");
      return res.json();
    },
  });

  // Mutation: Bulk Save Attendance
  const saveBulkMutation = useMutation({
    mutationFn: async (rowsToSave: WorkerAttendanceRow[]) => {
      const payload = {
        projectId: Number(activeProjectId),
        attendanceDate: selectedDate,
        records: rowsToSave.map((r) => ({
          workerId: r.workerId,
          projectId: r.projectId,
          category: r.category,
          status: r.status,
          dailyWageRate: r.dailyWageRate,
          shift: r.shift,
          remarks: r.remarks,
        })),
      };
      const res = await fetch("/api/site-execution/worker-attendance/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to save muster roll");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-execution/worker-attendance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/site-execution/worker-attendance/reports"] });
      queryClient.invalidateQueries({ queryKey: ["/api/site-execution/attendance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/site-execution/workers"] });
      setIsDirty(false);
      toast({
        title: "Attendance Saved Successfully",
        description: `Logged attendance & calculated wages for ${localRows.length} workers.`,
      });
    },
    onError: (err: any) => {
      toast({
        title: "Save Failed",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  // Mutation: Add Worker
  const addWorkerMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch("/api/site-execution/workers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, projectId: Number(activeProjectId) }),
      });
      if (!res.ok) throw new Error("Failed to register worker");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-execution/workers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/site-execution/worker-attendance"] });
      setAddWorkerOpen(false);
      setNewWorker({
        name: "",
        category: "Skilled",
        trade: "Civil / Concreting",
        contractorName: "",
        dailyWageRate: "900",
        phone: "",
      });
      toast({
        title: "Worker Added",
        description: "New worker added with individual daily wage rate.",
      });
    },
    onError: (err: any) => {
      toast({ title: "Failed to add worker", description: err.message, variant: "destructive" });
    },
  });

  // Mutation: Edit Worker Wage Rate & Details
  const editWorkerMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await fetch(`/api/site-execution/workers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update worker");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-execution/workers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/site-execution/worker-attendance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/site-execution/worker-attendance/reports"] });
      setEditWorkerOpen(false);
      setEditingWorker(null);
      toast({
        title: "Worker Updated",
        description: "Worker details and daily wage rate updated.",
      });
    },
    onError: (err: any) => {
      toast({ title: "Update Failed", description: err.message, variant: "destructive" });
    },
  });

  // Handler: Update status for a worker (Present, Half-Day, Absent)
  const handleStatusChange = (workerId: number, newStatus: "present" | "half_day" | "absent") => {
    setLocalRows((prev) =>
      prev.map((row) => {
        if (row.workerId !== workerId) return row;
        const daysWorked = newStatus === "present" ? 1.0 : newStatus === "half_day" ? 0.5 : 0.0;
        const payableAmount = daysWorked * row.dailyWageRate;
        return {
          ...row,
          status: newStatus,
          daysWorked,
          payableAmount,
          isMarked: true,
        };
      })
    );
    setIsDirty(true);
  };

  // Handler: Edit individual worker's daily wage rate
  const handleRateChange = (workerId: number, newRateStr: string) => {
    const rate = parseFloat(newRateStr);
    const validRate = isNaN(rate) || rate < 0 ? 0 : rate;

    setLocalRows((prev) =>
      prev.map((row) => {
        if (row.workerId !== workerId) return row;
        const payableAmount = row.daysWorked * validRate;
        return {
          ...row,
          dailyWageRate: validRate,
          payableAmount,
        };
      })
    );
    setIsDirty(true);
  };

  // Handler: Mark all as Present
  const handleMarkAllPresent = () => {
    setLocalRows((prev) =>
      prev.map((row) => ({
        ...row,
        status: "present",
        daysWorked: 1.0,
        payableAmount: 1.0 * row.dailyWageRate,
        isMarked: true,
      }))
    );
    setIsDirty(true);
    toast({
      title: "Marked All Present",
      description: "All workers set to Present (1.0 day). Click 'Save Attendance' to persist.",
    });
  };

  // Local real-time calculations from localRows
  const localSummary = useMemo(() => {
    let dailyCost = 0;
    let presentCount = 0;
    let halfDayCount = 0;
    let absentCount = 0;

    const catStats = {
      Supervisor: { count: 0, cost: 0, totalRates: 0 },
      Skilled: { count: 0, cost: 0, totalRates: 0 },
      Unskilled: { count: 0, cost: 0, totalRates: 0 },
    };

    localRows.forEach((r) => {
      dailyCost += r.payableAmount;
      if (r.status === "present") presentCount++;
      else if (r.status === "half_day") halfDayCount++;
      else absentCount++;

      const cat = r.category in catStats ? r.category : "Skilled";
      catStats[cat].count++;
      catStats[cat].cost += r.payableAmount;
      catStats[cat].totalRates += r.dailyWageRate;
    });

    return {
      dailyCost,
      presentCount,
      halfDayCount,
      absentCount,
      catStats,
    };
  }, [localRows]);

  // Filtered rows for muster roll view
  const displayRows = useMemo(() => {
    return localRows.filter((r) => {
      if (filterCategory !== "all" && r.category !== filterCategory) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matches =
          r.name.toLowerCase().includes(q) ||
          r.trade.toLowerCase().includes(q) ||
          r.contractorName?.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [localRows, filterCategory, searchQuery]);

  // Overall benchmark stats from API
  const stats = attendanceData?.stats;

  return (
    <div className="space-y-6">
      {/* 1. Project & View Controller Header */}
      <div className="bg-card border rounded-xl p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-foreground">Site Attendance & Labour Management</h2>
              <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                Individual Wage Rates
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Individual worker wage tracking, automated daily wages based on attendance, and labour cost reporting.
            </p>
          </div>
        </div>

        {/* Project Selector & View Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="w-64">
            <Select value={activeProjectId} onValueChange={setActiveProjectId}>
              <SelectTrigger className="h-9 text-xs font-medium">
                <Building2 className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
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

          <div className="flex bg-muted/60 p-1 rounded-lg border gap-1">
            <Button
              variant={activeView === "muster" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveView("muster")}
              className="h-8 text-xs gap-1.5"
            >
              <Calendar className="h-3.5 w-3.5" />
              Daily Muster Roll
            </Button>
            <Button
              variant={activeView === "reports" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveView("reports")}
              className="h-8 text-xs gap-1.5"
            >
              <BarChart3 className="h-3.5 w-3.5" />
              Labour Cost Reports
            </Button>
            <Button
              variant={activeView === "directory" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveView("directory")}
              className="h-8 text-xs gap-1.5"
            >
              <HardHat className="h-3.5 w-3.5" />
              Worker Directory ({workersDirectory.length})
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards (Daily, Weekly, Monthly Labour Costs & Headcount) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Daily Labour Cost */}
        <Card className="border shadow-sm bg-card hover:border-primary/40 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground font-medium">Daily Labour Cost</span>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  {selectedDate === todayStr ? "Today" : selectedDate}
                </Badge>
              </div>
              <h3 className="text-2xl font-bold mt-1 text-foreground">
                {INR.format(localSummary.dailyCost)}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                <span className="text-emerald-600 font-semibold">{localSummary.presentCount} Present</span> ·{" "}
                <span className="text-amber-600 font-semibold">{localSummary.halfDayCount} Half-day</span> ·{" "}
                <span className="text-rose-500 font-semibold">{localSummary.absentCount} Absent</span>
              </p>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-emerald-600">
              <DollarSign className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        {/* Weekly Labour Cost */}
        <Card className="border shadow-sm bg-card hover:border-primary/40 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground font-medium">Weekly Labour Cost</span>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  Mon-Sun
                </Badge>
              </div>
              <h3 className="text-2xl font-bold mt-1 text-blue-600">
                {INR.format(stats?.weeklyCost || 0)}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Week: {stats?.weekRange?.start?.slice(5)} to {stats?.weekRange?.end?.slice(5)}
              </p>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-blue-600">
              <TrendingUp className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        {/* Monthly Labour Cost */}
        <Card className="border shadow-sm bg-card hover:border-primary/40 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground font-medium">Monthly Labour Cost</span>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  {stats?.monthPrefix || "Month"}
                </Badge>
              </div>
              <h3 className="text-2xl font-bold mt-1 text-indigo-600">
                {INR.format(stats?.monthlyCost || 0)}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Project-wise accumulated labour spend
              </p>
            </div>
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl text-indigo-600">
              <Briefcase className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        {/* Worker Categories & Distinct Rates */}
        <Card className="border shadow-sm bg-card hover:border-primary/40 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium">Active Headcount by Category</span>
              <span className="text-xs font-bold text-foreground">{localRows.length} Total</span>
            </div>
            <div className="mt-2 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-blue-700 dark:text-blue-400 font-medium">
                  <span className="h-2 w-2 rounded-full bg-blue-600" />
                  Supervisor ({localSummary.catStats.Supervisor.count})
                </span>
                <span className="font-semibold text-foreground font-mono">
                  {INR.format(localSummary.catStats.Supervisor.cost)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-medium">
                  <span className="h-2 w-2 rounded-full bg-emerald-600" />
                  Skilled ({localSummary.catStats.Skilled.count})
                </span>
                <span className="font-semibold text-foreground font-mono">
                  {INR.format(localSummary.catStats.Skilled.cost)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-medium">
                  <span className="h-2 w-2 rounded-full bg-amber-600" />
                  Unskilled ({localSummary.catStats.Unskilled.count})
                </span>
                <span className="font-semibold text-foreground font-mono">
                  {INR.format(localSummary.catStats.Unskilled.cost)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. SUB-VIEW: DAILY MUSTER ROLL */}
      {activeView === "muster" && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-muted/20 p-3 rounded-xl border">
            {/* Date and Quick Shortcuts */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 bg-background border px-3 py-1 rounded-lg">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground font-medium">Date:</span>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="h-7 text-xs w-36 border-0 focus-visible:ring-0 p-0 font-medium"
                />
              </div>

              <Button
                variant={selectedDate === todayStr ? "secondary" : "outline"}
                size="sm"
                className="h-8 text-xs"
                onClick={() => setSelectedDate(todayStr)}
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={() => {
                  const d = new Date();
                  d.setDate(d.getDate() - 1);
                  setSelectedDate(d.toISOString().split("T")[0]);
                }}
              >
                Yesterday
              </Button>

              {/* Category Filter */}
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-36 h-8 text-xs">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Supervisor">Supervisors</SelectItem>
                  <SelectItem value="Skilled">Skilled</SelectItem>
                  <SelectItem value="Unskilled">Unskilled</SelectItem>
                </SelectContent>
              </Select>

              {/* Search */}
              <div className="relative w-44">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search worker or trade..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-xs"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllPresent}
                className="h-8 text-xs gap-1.5 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
              >
                <Check className="h-3.5 w-3.5" />
                Mark All Present
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setAddWorkerOpen(true)}
                className="h-8 text-xs gap-1.5"
              >
                <UserPlus className="h-3.5 w-3.5" />
                Add Worker
              </Button>

              <Button
                size="sm"
                onClick={() => saveBulkMutation.mutate(localRows)}
                disabled={saveBulkMutation.isPending || !isDirty}
                className="h-8 text-xs gap-1.5 shadow-sm bg-primary hover:bg-primary/90"
              >
                <Save className="h-3.5 w-3.5" />
                {saveBulkMutation.isPending ? "Saving..." : isDirty ? "Save Attendance *" : "Saved"}
              </Button>
            </div>
          </div>

          {/* Muster Roll Table */}
          <Card className="border shadow-sm">
            <CardHeader className="p-4 border-b bg-muted/20 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <span>Site Muster Roll — {selectedDate}</span>
                  {isDirty && (
                    <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/30">
                      Unsaved Changes
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Click status buttons to mark attendance. Daily wage is automatically calculated based on attendance (1.0d, 0.5d, or 0.0d) and each worker's individual rate.
                </CardDescription>
              </div>
              <div className="text-right">
                <span className="text-xs text-muted-foreground">Day Total: </span>
                <span className="text-base font-bold text-foreground font-mono">
                  {INR.format(localSummary.dailyCost)}
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoadingMuster ? (
                <div className="p-10 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                  Loading site muster roll...
                </div>
              ) : displayRows.length === 0 ? (
                <div className="p-10 text-center text-xs text-muted-foreground space-y-2">
                  <HardHat className="h-8 w-8 mx-auto text-muted-foreground/60" />
                  <p>No workers found for this project and filter criteria.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAddWorkerOpen(true)}
                    className="gap-1.5 text-xs"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    Register First Worker
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-muted/40 text-muted-foreground uppercase text-[10px] tracking-wider border-b">
                      <tr>
                        <th className="p-3 pl-4">#</th>
                        <th className="p-3">Worker Name & Trade</th>
                        <th className="p-3">Category</th>
                        <th className="p-3">Contractor / Agency</th>
                        <th className="p-3 text-center">Attendance Status</th>
                        <th className="p-3 text-center">Days Worked</th>
                        <th className="p-3 text-right">Daily Wage Rate (₹)</th>
                        <th className="p-3 text-right">Total Payable Today (₹)</th>
                        <th className="p-3 pr-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {displayRows.map((row, idx) => {
                        const isPresent = row.status === "present";
                        const isHalfDay = row.status === "half_day";
                        const isAbsent = row.status === "absent";

                        return (
                          <tr
                            key={row.workerId}
                            className={`transition-colors ${
                              isAbsent
                                ? "bg-muted/10 opacity-75"
                                : isHalfDay
                                ? "bg-amber-50/20 dark:bg-amber-950/10"
                                : "hover:bg-muted/20"
                            }`}
                          >
                            <td className="p-3 pl-4 font-mono text-muted-foreground">{idx + 1}</td>

                            {/* Worker Name & Trade */}
                            <td className="p-3 font-medium text-foreground">
                              <div className="flex items-center gap-2">
                                <div className="font-semibold text-foreground text-xs">{row.name}</div>
                              </div>
                              <div className="text-[11px] text-muted-foreground">{row.trade}</div>
                            </td>

                            {/* Category Badge */}
                            <td className="p-3">
                              {row.category === "Supervisor" ? (
                                <Badge className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300 hover:bg-blue-100">
                                  Supervisor
                                </Badge>
                              ) : row.category === "Skilled" ? (
                                <Badge className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 hover:bg-emerald-100">
                                  Skilled
                                </Badge>
                              ) : (
                                <Badge className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 hover:bg-amber-100">
                                  Unskilled
                                </Badge>
                              )}
                            </td>

                            {/* Contractor */}
                            <td className="p-3 text-muted-foreground text-[11px]">
                              {row.contractorName || "Direct Site Hire"}
                            </td>

                            {/* Attendance Status Selection */}
                            <td className="p-3 text-center">
                              <div className="inline-flex items-center rounded-lg border bg-background p-0.5 shadow-xs">
                                <button
                                  type="button"
                                  onClick={() => handleStatusChange(row.workerId, "present")}
                                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all ${
                                    isPresent
                                      ? "bg-emerald-600 text-white shadow-xs"
                                      : "text-muted-foreground hover:text-foreground"
                                  }`}
                                  title="Present (1.0 day worked)"
                                >
                                  Present
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleStatusChange(row.workerId, "half_day")}
                                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all ${
                                    isHalfDay
                                      ? "bg-amber-500 text-white shadow-xs"
                                      : "text-muted-foreground hover:text-foreground"
                                  }`}
                                  title="Half-Day (0.5 day worked)"
                                >
                                  Half-Day
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleStatusChange(row.workerId, "absent")}
                                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all ${
                                    isAbsent
                                      ? "bg-rose-600 text-white shadow-xs"
                                      : "text-muted-foreground hover:text-foreground"
                                  }`}
                                  title="Absent (0.0 day worked)"
                                >
                                  Absent
                                </button>
                              </div>
                            </td>

                            {/* Days Worked */}
                            <td className="p-3 text-center font-mono font-bold">
                              <span
                                className={`px-2 py-0.5 rounded text-[11px] ${
                                  isPresent
                                    ? "bg-emerald-500/10 text-emerald-600"
                                    : isHalfDay
                                    ? "bg-amber-500/10 text-amber-600"
                                    : "bg-muted text-muted-foreground"
                                }`}
                              >
                                {row.daysWorked.toFixed(1)} d
                              </span>
                            </td>

                            {/* Individual Daily Wage Rate (Editable Inline!) */}
                            <td className="p-3 text-right">
                              <div className="inline-flex items-center gap-1">
                                <span className="text-muted-foreground text-[11px]">₹</span>
                                <Input
                                  type="number"
                                  min="0"
                                  step="10"
                                  value={row.dailyWageRate}
                                  onChange={(e) => handleRateChange(row.workerId, e.target.value)}
                                  className="h-7 w-20 text-xs text-right font-mono font-semibold"
                                  title="Individual daily rate for this worker. You can edit this individually anytime."
                                />
                              </div>
                            </td>

                            {/* Total Payable Today (Auto-calculated) */}
                            <td className="p-3 text-right font-mono font-bold whitespace-nowrap">
                              <span
                                className={`text-xs ${
                                  isAbsent
                                    ? "text-muted-foreground"
                                    : isHalfDay
                                    ? "text-amber-600"
                                    : "text-emerald-600"
                                }`}
                              >
                                {INR.format(row.payableAmount)}
                              </span>
                              <div className="text-[10px] text-muted-foreground font-normal">
                                {row.daysWorked} × ₹{row.dailyWageRate}
                              </div>
                            </td>

                            {/* Actions */}
                            <td className="p-3 pr-4 text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                                title="Edit Worker Profile & Default Rate"
                                onClick={() => {
                                  setEditingWorker({
                                    id: row.workerId,
                                    name: row.name,
                                    category: row.category,
                                    trade: row.trade,
                                    contractorName: row.contractorName,
                                    dailyWageRate: row.dailyWageRate,
                                    phone: row.phone || "",
                                  });
                                  setEditWorkerOpen(true);
                                }}
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-muted/40 font-bold border-t">
                      <tr>
                        <td colSpan={5} className="p-3 pl-4 text-foreground">
                          Total Active Workers: {displayRows.length} (
                          {displayRows.filter((r) => r.status === "present").length} Present,{" "}
                          {displayRows.filter((r) => r.status === "half_day").length} Half-Day,{" "}
                          {displayRows.filter((r) => r.status === "absent").length} Absent)
                        </td>
                        <td className="p-3 text-center font-mono">
                          {displayRows.reduce((sum, r) => sum + r.daysWorked, 0).toFixed(1)} d
                        </td>
                        <td className="p-3 text-right text-xs text-muted-foreground">
                          Avg Rate: ₹
                          {displayRows.length > 0
                            ? Math.round(
                                displayRows.reduce((sum, r) => sum + r.dailyWageRate, 0) / displayRows.length
                              )
                            : 0}
                        </td>
                        <td className="p-3 text-right font-mono text-base font-bold text-emerald-600 whitespace-nowrap">
                          {INR.format(displayRows.reduce((sum, r) => sum + r.payableAmount, 0))}
                        </td>
                        <td className="p-3 pr-4 text-center">
                          <Button
                            size="sm"
                            onClick={() => saveBulkMutation.mutate(localRows)}
                            disabled={saveBulkMutation.isPending || !isDirty}
                            className="h-7 text-[11px] gap-1 px-2.5"
                          >
                            <Save className="h-3 w-3" />
                            Save
                          </Button>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* 4. SUB-VIEW: LABOUR COST REPORTS */}
      {activeView === "reports" && (
        <div className="space-y-6">
          {/* Controls Bar for Reports */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-muted/20 p-3 rounded-xl border">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-foreground">Report Period:</span>
              <div className="flex bg-muted p-1 rounded-lg border gap-1">
                <Button
                  variant={reportPeriod === "daily" ? "default" : "ghost"}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setReportPeriod("daily")}
                >
                  Daily ({selectedDate})
                </Button>
                <Button
                  variant={reportPeriod === "weekly" ? "default" : "ghost"}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setReportPeriod("weekly")}
                >
                  Weekly (Mon-Sun)
                </Button>
                <Button
                  variant={reportPeriod === "monthly" ? "default" : "ghost"}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setReportPeriod("monthly")}
                >
                  Monthly ({reportsData?.monthPrefix || "Current"})
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Reference Date:</span>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="h-8 text-xs w-36"
              />
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5"
                onClick={() => refetchReports()}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Refresh Report
              </Button>
            </div>
          </div>

          {/* Benchmark Period Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border shadow-sm bg-card border-blue-500/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-medium">Daily Benchmark</span>
                  <Badge variant="outline" className="text-[10px]">
                    {selectedDate}
                  </Badge>
                </div>
                <h4 className="text-2xl font-bold mt-1 text-blue-600">
                  {INR.format(reportsData?.benchmarks?.daily || 0)}
                </h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  1-day muster roll expenditure
                </p>
              </CardContent>
            </Card>

            <Card className="border shadow-sm bg-card border-indigo-500/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-medium">Weekly Benchmark</span>
                  <Badge variant="outline" className="text-[10px]">
                    {reportsData?.weekRange?.start?.slice(5)} to {reportsData?.weekRange?.end?.slice(5)}
                  </Badge>
                </div>
                <h4 className="text-2xl font-bold mt-1 text-indigo-600">
                  {INR.format(reportsData?.benchmarks?.weekly || 0)}
                </h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  7-day weekly total labour spend
                </p>
              </CardContent>
            </Card>

            <Card className="border shadow-sm bg-card border-emerald-500/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-medium">Monthly Benchmark</span>
                  <Badge variant="outline" className="text-[10px]">
                    {reportsData?.monthPrefix}
                  </Badge>
                </div>
                <h4 className="text-2xl font-bold mt-1 text-emerald-600">
                  {INR.format(reportsData?.benchmarks?.monthly || 0)}
                </h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Cumulative monthly billing amount
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Category Breakdown Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Supervisors */}
            <Card className="border shadow-sm bg-blue-50/30 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wide flex items-center justify-between">
                  <span>Supervisor Category</span>
                  <Badge className="bg-blue-600 text-white text-[10px]">
                    {reportsData?.categories?.supervisor?.workers || 0} Workers
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-1.5">
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-400 font-mono">
                  {INR.format(reportsData?.categories?.supervisor?.totalPayable || 0)}
                </div>
                <div className="text-xs text-muted-foreground flex justify-between">
                  <span>Total Days Worked:</span>
                  <span className="font-semibold text-foreground">
                    {reportsData?.categories?.supervisor?.daysWorked || 0} Days
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Skilled */}
            <Card className="border shadow-sm bg-emerald-50/30 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wide flex items-center justify-between">
                  <span>Skilled Tradesmen</span>
                  <Badge className="bg-emerald-600 text-white text-[10px]">
                    {reportsData?.categories?.skilled?.workers || 0} Workers
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-1.5">
                <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 font-mono">
                  {INR.format(reportsData?.categories?.skilled?.totalPayable || 0)}
                </div>
                <div className="text-xs text-muted-foreground flex justify-between">
                  <span>Total Days Worked:</span>
                  <span className="font-semibold text-foreground">
                    {reportsData?.categories?.skilled?.daysWorked || 0} Days
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Unskilled */}
            <Card className="border shadow-sm bg-amber-50/30 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wide flex items-center justify-between">
                  <span>Unskilled Labour</span>
                  <Badge className="bg-amber-600 text-white text-[10px]">
                    {reportsData?.categories?.unskilled?.workers || 0} Workers
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-1.5">
                <div className="text-2xl font-bold text-amber-700 dark:text-amber-400 font-mono">
                  {INR.format(reportsData?.categories?.unskilled?.totalPayable || 0)}
                </div>
                <div className="text-xs text-muted-foreground flex justify-between">
                  <span>Total Days Worked:</span>
                  <span className="font-semibold text-foreground">
                    {reportsData?.categories?.unskilled?.daysWorked || 0} Days
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Worker Report Table */}
          <Card className="border shadow-sm">
            <CardHeader className="p-4 border-b bg-muted/20 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-primary" />
                  Individual Worker Labour Cost Summary ({reportPeriod.toUpperCase()})
                </CardTitle>
                <CardDescription className="text-xs">
                  Detailed breakdown of days worked, individual wage rates, and total payable amounts for each worker.
                </CardDescription>
              </div>
              <div className="text-right">
                <span className="text-xs text-muted-foreground">Grand Total: </span>
                <span className="text-base font-bold text-foreground font-mono">
                  {INR.format(reportsData?.grandTotalCost || 0)}
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoadingReports ? (
                <div className="p-8 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                  Compiling labour reports...
                </div>
              ) : !reportsData?.workerSummary || reportsData.workerSummary.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  No attendance records recorded for this period. Mark daily attendance to populate reports.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-muted/40 text-muted-foreground uppercase text-[10px] tracking-wider border-b">
                      <tr>
                        <th className="p-3 pl-4">#</th>
                        <th className="p-3">Worker Name & Trade</th>
                        <th className="p-3">Category</th>
                        <th className="p-3">Contractor / Agency</th>
                        <th className="p-3 text-right">Assigned Daily Rate (₹)</th>
                        <th className="p-3 text-center">Present</th>
                        <th className="p-3 text-center">Half-Day</th>
                        <th className="p-3 text-center">Absent</th>
                        <th className="p-3 text-center">Total Days Worked</th>
                        <th className="p-3 pr-4 text-right">Total Payable Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {reportsData.workerSummary.map((item: any, idx: number) => (
                        <tr key={item.workerId} className="hover:bg-muted/20 transition-colors">
                          <td className="p-3 pl-4 font-mono text-muted-foreground">{idx + 1}</td>
                          <td className="p-3 font-semibold text-foreground">
                            <div>{item.name}</div>
                            <div className="text-[11px] text-muted-foreground font-normal">{item.trade}</div>
                          </td>
                          <td className="p-3">
                            <Badge
                              className={`text-[10px] ${
                                item.category === "Supervisor"
                                  ? "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                                  : item.category === "Skilled"
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                                  : "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                              }`}
                            >
                              {item.category}
                            </Badge>
                          </td>
                          <td className="p-3 text-muted-foreground text-[11px]">{item.contractorName}</td>
                          <td className="p-3 text-right font-mono font-bold text-foreground">
                            ₹{item.assignedDailyRate}
                          </td>
                          <td className="p-3 text-center text-emerald-600 font-semibold">{item.presentDays}</td>
                          <td className="p-3 text-center text-amber-600 font-semibold">{item.halfDays}</td>
                          <td className="p-3 text-center text-rose-500 font-semibold">{item.absentDays}</td>
                          <td className="p-3 text-center font-bold font-mono bg-muted/20">
                            {Number(item.totalDaysWorked).toFixed(1)} d
                          </td>
                          <td className="p-3 pr-4 text-right font-mono font-bold text-emerald-600 whitespace-nowrap">
                            {INR.format(item.totalPayableAmount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-muted/40 font-bold border-t">
                      <tr>
                        <td colSpan={8} className="p-3 pl-4 text-foreground">
                          Period Grand Totals ({reportsData.workerSummary.length} Workers)
                        </td>
                        <td className="p-3 text-center font-mono">
                          {Number(reportsData.grandTotalDays || 0).toFixed(1)} d
                        </td>
                        <td className="p-3 pr-4 text-right font-mono text-base font-bold text-emerald-600 whitespace-nowrap">
                          {INR.format(reportsData.grandTotalCost || 0)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* 5. SUB-VIEW: WORKER DIRECTORY & INDIVIDUAL WAGE RATES */}
      {activeView === "directory" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-muted/20 p-3 rounded-xl border">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search workers by name or trade..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-9 text-xs"
                />
              </div>

              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-36 h-9 text-xs">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Supervisor">Supervisor</SelectItem>
                  <SelectItem value="Skilled">Skilled</SelectItem>
                  <SelectItem value="Unskilled">Unskilled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              size="sm"
              onClick={() => setAddWorkerOpen(true)}
              className="gap-1.5 shadow-sm h-9 text-xs"
            >
              <UserPlus className="h-4 w-4" />
              Add New Worker
            </Button>
          </div>

          <Card className="border shadow-sm">
            <CardHeader className="p-4 border-b bg-muted/20">
              <CardTitle className="text-sm font-bold flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <HardHat className="h-4 w-4 text-primary" />
                  Site Worker Directory & Assigned Wage Rates
                </span>
                <Badge variant="outline" className="text-xs">
                  {workersDirectory.length} Active Workers
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Each worker can have a distinct daily wage rate. Click "Edit" to adjust their individual rate anytime.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {isLoadingDirectory ? (
                <div className="p-8 text-center text-xs text-muted-foreground">Loading directory...</div>
              ) : workersDirectory.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  No workers registered. Click "Add New Worker" to add workers with individual daily wage rates.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-muted/40 text-muted-foreground uppercase text-[10px] tracking-wider border-b">
                      <tr>
                        <th className="p-3 pl-4">#</th>
                        <th className="p-3">Worker Name</th>
                        <th className="p-3">Category</th>
                        <th className="p-3">Trade / Skill</th>
                        <th className="p-3">Contractor / Agency</th>
                        <th className="p-3">Phone</th>
                        <th className="p-3 text-right">Default Daily Wage (₹)</th>
                        <th className="p-3 pr-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {workersDirectory
                        .filter((w) => {
                          if (filterCategory !== "all" && w.category !== filterCategory) return false;
                          if (searchQuery) {
                            const q = searchQuery.toLowerCase();
                            return (
                              w.name.toLowerCase().includes(q) ||
                              w.trade.toLowerCase().includes(q) ||
                              w.contractorName?.toLowerCase().includes(q)
                            );
                          }
                          return true;
                        })
                        .map((w, idx) => (
                          <tr key={w.id} className="hover:bg-muted/20 transition-colors">
                            <td className="p-3 pl-4 font-mono text-muted-foreground">{idx + 1}</td>
                            <td className="p-3 font-semibold text-foreground">{w.name}</td>
                            <td className="p-3">
                              <Badge
                                className={`text-[10px] ${
                                  w.category === "Supervisor"
                                    ? "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                                    : w.category === "Skilled"
                                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                                    : "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                                }`}
                              >
                                {w.category}
                              </Badge>
                            </td>
                            <td className="p-3 text-foreground">{w.trade}</td>
                            <td className="p-3 text-muted-foreground">{w.contractorName || "Direct Site Hire"}</td>
                            <td className="p-3 text-muted-foreground font-mono">{w.phone || "—"}</td>
                            <td className="p-3 text-right font-mono font-bold text-foreground">
                              ₹{w.dailyWageRate}
                            </td>
                            <td className="p-3 pr-4 text-right whitespace-nowrap">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-[11px] gap-1"
                                onClick={() => {
                                  setEditingWorker(w);
                                  setEditWorkerOpen(true);
                                }}
                              >
                                <Edit2 className="h-3 w-3" />
                                Edit Rate
                              </Button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* 6. MODAL: ADD NEW WORKER */}
      <Dialog open={addWorkerOpen} onOpenChange={setAddWorkerOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Register New Site Worker
            </DialogTitle>
            <DialogDescription className="text-xs">
              Add a worker with their designated category and individual daily wage rate.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              addWorkerMutation.mutate(newWorker);
            }}
            className="space-y-3.5 pt-2"
          >
            <div className="space-y-1">
              <Label className="text-xs">Worker Full Name *</Label>
              <Input
                placeholder="e.g. Ramesh Kumar, Sunita Devi"
                className="text-xs h-9"
                value={newWorker.name}
                onChange={(e) => setNewWorker({ ...newWorker, name: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Category *</Label>
                <Select
                  value={newWorker.category}
                  onValueChange={(val: "Supervisor" | "Skilled" | "Unskilled") => {
                    setNewWorker({
                      ...newWorker,
                      category: val,
                      dailyWageRate: String(CATEGORY_DEFAULT_RATES[val] || 850),
                    });
                  }}
                >
                  <SelectTrigger className="text-xs h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Supervisor">Supervisor (QA / Lead)</SelectItem>
                    <SelectItem value="Skilled">Skilled (Tradesman)</SelectItem>
                    <SelectItem value="Unskilled">Unskilled (Helper)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-primary">Daily Wage Rate (₹) *</Label>
                <Input
                  type="number"
                  min="0"
                  step="10"
                  className="text-xs h-9 font-mono font-bold"
                  value={newWorker.dailyWageRate}
                  onChange={(e) => setNewWorker({ ...newWorker, dailyWageRate: e.target.value })}
                  required
                />
                <p className="text-[10px] text-muted-foreground">Each worker can have a different rate.</p>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Trade / Craft *</Label>
              <Select
                value={newWorker.trade}
                onValueChange={(val) => setNewWorker({ ...newWorker, trade: val })}
              >
                <SelectTrigger className="text-xs h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRADES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Contractor / Agency Name</Label>
              <Input
                placeholder="e.g. L&T Civil, Supreme Formwork, or Direct Hire"
                className="text-xs h-9"
                value={newWorker.contractorName}
                onChange={(e) => setNewWorker({ ...newWorker, contractorName: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Phone Number (Optional)</Label>
              <Input
                placeholder="+91 98765 43210"
                className="text-xs h-9"
                value={newWorker.phone}
                onChange={(e) => setNewWorker({ ...newWorker, phone: e.target.value })}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAddWorkerOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={addWorkerMutation.isPending}>
                {addWorkerMutation.isPending ? "Adding..." : "Register Worker"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 7. MODAL: EDIT WORKER DETAILS & WAGE RATE */}
      {editingWorker && (
        <Dialog open={editWorkerOpen} onOpenChange={setEditWorkerOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit2 className="h-5 w-5 text-primary" />
                Edit Worker & Wage Rate
              </DialogTitle>
              <DialogDescription className="text-xs">
                Update details or customize the individual daily wage rate for {editingWorker.name}.
              </DialogDescription>
            </DialogHeader>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                editWorkerMutation.mutate({
                  id: editingWorker.id,
                  data: {
                    name: editingWorker.name,
                    category: editingWorker.category,
                    trade: editingWorker.trade,
                    contractorName: editingWorker.contractorName,
                    dailyWageRate: parseFloat(editingWorker.dailyWageRate) || 0,
                    phone: editingWorker.phone,
                  },
                });
              }}
              className="space-y-3.5 pt-2"
            >
              <div className="space-y-1">
                <Label className="text-xs">Worker Full Name</Label>
                <Input
                  className="text-xs h-9"
                  value={editingWorker.name}
                  onChange={(e) => setEditingWorker({ ...editingWorker, name: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Category</Label>
                  <Select
                    value={editingWorker.category}
                    onValueChange={(val) => setEditingWorker({ ...editingWorker, category: val })}
                  >
                    <SelectTrigger className="text-xs h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Supervisor">Supervisor</SelectItem>
                      <SelectItem value="Skilled">Skilled</SelectItem>
                      <SelectItem value="Unskilled">Unskilled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-primary">Daily Wage Rate (₹)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="10"
                    className="text-xs h-9 font-mono font-bold"
                    value={editingWorker.dailyWageRate}
                    onChange={(e) =>
                      setEditingWorker({ ...editingWorker, dailyWageRate: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Trade / Craft</Label>
                <Select
                  value={editingWorker.trade}
                  onValueChange={(val) => setEditingWorker({ ...editingWorker, trade: val })}
                >
                  <SelectTrigger className="text-xs h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRADES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Contractor / Agency Name</Label>
                <Input
                  className="text-xs h-9"
                  value={editingWorker.contractorName || ""}
                  onChange={(e) =>
                    setEditingWorker({ ...editingWorker, contractorName: e.target.value })
                  }
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Phone Number</Label>
                <Input
                  className="text-xs h-9"
                  value={editingWorker.phone || ""}
                  onChange={(e) => setEditingWorker({ ...editingWorker, phone: e.target.value })}
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditWorkerOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={editWorkerMutation.isPending}>
                  {editWorkerMutation.isPending ? "Updating..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
