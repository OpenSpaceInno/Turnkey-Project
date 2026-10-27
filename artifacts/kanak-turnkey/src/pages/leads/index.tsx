import { useState } from "react";
import { Link } from "wouter";
import { useListLeads, useGetLeadsSummary, useUpdateLead } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Search,
  Filter,
  Kanban,
  LayoutList,
  FileSpreadsheet,
  Download,
  RotateCcw,
  Sparkles,
  MapPin,
  Layers,
  Calculator,
  Scale,
  Trophy,
  Calendar,
  User,
  ArrowRight,
  MoreVertical,
  CheckCircle2,
  Clock,
  Briefcase,
} from "lucide-react";
import { format } from "date-fns";
import { NewLeadDialog } from "@/components/dialogs/create-dialogs";
import { useToast } from "@/hooks/use-toast";

// ── Helpers ──────────────────────────────────────────────────────────────────

const INR = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const formatCompactINR = (amount: number) => {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)} L`;
  }
  return INR.format(amount);
};

interface PipelineStage {
  key: string;
  label: string;
  subtitle: string;
  badgeClass: string;
  columnClass: string;
  icon: any;
}

const STAGES: PipelineStage[] = [
  {
    key: "lead_creation",
    label: "Lead Creation",
    subtitle: "New enquiries & leads",
    badgeClass: "bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-900",
    columnClass: "border-blue-200/50 dark:border-blue-900/30",
    icon: Sparkles,
  },
  {
    key: "site_visit",
    label: "Site Visit",
    subtitle: "Inspections & measurements",
    badgeClass: "bg-purple-500/10 text-purple-600 border-purple-200 dark:border-purple-900",
    columnClass: "border-purple-200/50 dark:border-purple-900/30",
    icon: MapPin,
  },
  {
    key: "drawings",
    label: "Drawings",
    subtitle: "2D/3D architectural plans",
    badgeClass: "bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-900",
    columnClass: "border-amber-200/50 dark:border-amber-900/30",
    icon: Layers,
  },
  {
    key: "boq",
    label: "BOQ & Estimate",
    subtitle: "Cost sheets & estimates",
    badgeClass: "bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-900",
    columnClass: "border-emerald-200/50 dark:border-emerald-900/30",
    icon: Calculator,
  },
  {
    key: "negotiation",
    label: "Negotiation",
    subtitle: "Discounts & commercial terms",
    badgeClass: "bg-orange-500/10 text-orange-600 border-orange-200 dark:border-orange-900",
    columnClass: "border-orange-200/50 dark:border-orange-900/30",
    icon: Scale,
  },
  {
    key: "finalization",
    label: "Finalization",
    subtitle: "Contracts awarded / Won",
    badgeClass: "bg-teal-500/10 text-teal-600 border-teal-200 dark:border-teal-900",
    columnClass: "border-teal-200/50 dark:border-teal-900/30",
    icon: Trophy,
  },
];

const priorityColor: Record<string, string> = {
  urgent: "bg-red-500/10 text-red-600 border-red-300 dark:border-red-900",
  high: "bg-orange-500/10 text-orange-600 border-orange-300 dark:border-orange-900",
  medium: "bg-blue-500/10 text-blue-600 border-blue-300 dark:border-blue-900",
  low: "bg-slate-500/10 text-slate-600 border-slate-300 dark:border-slate-800",
};

export default function Leads() {
  const { data: leads, isLoading: isLoadingLeads } = useListLeads();
  const { data: summary, isLoading: isLoadingSummary } = useGetLeadsSummary();
  const updateLeadMutation = useUpdateLead();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // View state
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  const leadsArray = Array.isArray(leads) ? leads : [];

  // Filter leads
  const filteredLeads = leadsArray.filter((lead: any) => {
    const matchesSearch =
      !search ||
      lead.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      lead.leadNumber?.toLowerCase().includes(search.toLowerCase()) ||
      lead.company?.toLowerCase().includes(search.toLowerCase()) ||
      lead.location?.toLowerCase().includes(search.toLowerCase());

    const matchesStage =
      stageFilter === "all" ||
      (stageFilter === "finalization"
        ? lead.stage === "finalization" || lead.stage === "won" || lead.status === "won"
        : lead.stage === stageFilter);

    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || lead.priority === priorityFilter;

    return matchesSearch && matchesStage && matchesStatus && matchesPriority;
  });

  // Helper to match lead with Kanban column
  const isLeadInColumn = (lead: any, columnKey: string) => {
    if (columnKey === "finalization") {
      return lead.stage === "finalization" || lead.stage === "won" || lead.status === "won";
    }
    // If won, don't show in earlier stages
    if (lead.status === "won") return false;
    return lead.stage === columnKey;
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, leadId: number) => {
    e.dataTransfer.setData("text/plain", leadId.toString());
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, stageKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverStage !== stageKey) {
      setDragOverStage(stageKey);
    }
  };

  const handleDragLeave = () => {
    setDragOverStage(null);
  };

  const handleDrop = async (e: React.DragEvent, targetStageKey: string) => {
    e.preventDefault();
    setDragOverStage(null);
    const rawId = e.dataTransfer.getData("text/plain");
    const leadId = parseInt(rawId, 10);
    if (!leadId) return;

    await moveLeadToStage(leadId, targetStageKey);
  };

  const moveLeadToStage = async (leadId: number, targetStageKey: string) => {
    const stageObj = STAGES.find((s) => s.key === targetStageKey);
    const stageName = stageObj?.label || targetStageKey;

    try {
      const payload: Record<string, any> = { stage: targetStageKey };
      if (targetStageKey === "finalization") {
        payload.status = "won";
      }

      await updateLeadMutation.mutateAsync({
        id: leadId,
        data: payload,
      });

      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leads/summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/summary"] });

      toast({
        title: "Stage Updated",
        description: `Lead moved to ${stageName}.`,
      });
    } catch (err: any) {
      toast({
        title: "Update Failed",
        description: err?.message || "Could not update lead stage.",
        variant: "destructive",
      });
    }
  };

  // ── Excel Export (FR-LEAD-13) ──────────────────────────────────────────────
  const exportToExcel = (leadsToExport: any[]) => {
    const escapeXml = (unsafe: any) => {
      if (unsafe === null || unsafe === undefined) return "";
      return String(unsafe)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
    };

    const xmlRows = leadsToExport
      .map(
        (l) => `   <Row>
    <Cell ss:StyleID="Text"><Data ss:Type="String">${escapeXml(l.leadNumber)}</Data></Cell>
    <Cell ss:StyleID="Text"><Data ss:Type="String">${escapeXml(l.customerName)}</Data></Cell>
    <Cell ss:StyleID="Text"><Data ss:Type="String">${escapeXml(l.company || "-")}</Data></Cell>
    <Cell ss:StyleID="Text"><Data ss:Type="String">${escapeXml(l.contactPhone || "-")}</Data></Cell>
    <Cell ss:StyleID="Text"><Data ss:Type="String">${escapeXml(l.contactEmail || "-")}</Data></Cell>
    <Cell ss:StyleID="Text"><Data ss:Type="String">${escapeXml(l.projectType || "-")}</Data></Cell>
    <Cell ss:StyleID="Text"><Data ss:Type="String">${escapeXml(l.location || "-")}</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${l.budgetEstimate ?? 0}</Data></Cell>
    <Cell ss:StyleID="Center"><Data ss:Type="String">${escapeXml(l.stage?.replace("_", " "))}</Data></Cell>
    <Cell ss:StyleID="Center"><Data ss:Type="String">${escapeXml(l.status)}</Data></Cell>
    <Cell ss:StyleID="Center"><Data ss:Type="String">${escapeXml(l.priority)}</Data></Cell>
    <Cell ss:StyleID="Text"><Data ss:Type="String">${escapeXml(l.ownerName || "-")}</Data></Cell>
    <Cell ss:StyleID="Center"><Data ss:Type="String">${escapeXml(l.expectedClosureDate || "-")}</Data></Cell>
    <Cell ss:StyleID="Center"><Data ss:Type="String">${escapeXml(new Date(l.createdAt).toLocaleDateString())}</Data></Cell>
   </Row>`
      )
      .join("\n");

    const xmlContent = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Author>Kanak Turnkey</Author>
  <Created>${new Date().toISOString()}</Created>
 </DocumentProperties>
 <Styles>
  <Style ss:ID="Header">
   <Font ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#0F172A" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="Text">
   <Alignment ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="Center">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="Currency">
   <NumberFormat ss:Format="₹#,##0"/>
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Leads Pipeline">
  <Table>
   <Column ss:Width="120"/>
   <Column ss:Width="160"/>
   <Column ss:Width="160"/>
   <Column ss:Width="120"/>
   <Column ss:Width="160"/>
   <Column ss:Width="140"/>
   <Column ss:Width="130"/>
   <Column ss:Width="120"/>
   <Column ss:Width="110"/>
   <Column ss:Width="100"/>
   <Column ss:Width="90"/>
   <Column ss:Width="130"/>
   <Column ss:Width="110"/>
   <Column ss:Width="100"/>
   <Row ss:StyleID="Header">
    <Cell><Data ss:Type="String">Lead Number</Data></Cell>
    <Cell><Data ss:Type="String">Customer Name</Data></Cell>
    <Cell><Data ss:Type="String">Company</Data></Cell>
    <Cell><Data ss:Type="String">Phone</Data></Cell>
    <Cell><Data ss:Type="String">Email</Data></Cell>
    <Cell><Data ss:Type="String">Project Type</Data></Cell>
    <Cell><Data ss:Type="String">Location</Data></Cell>
    <Cell><Data ss:Type="String">Budget Estimate (INR)</Data></Cell>
    <Cell><Data ss:Type="String">Stage</Data></Cell>
    <Cell><Data ss:Type="String">Status</Data></Cell>
    <Cell><Data ss:Type="String">Priority</Data></Cell>
    <Cell><Data ss:Type="String">Owner</Data></Cell>
    <Cell><Data ss:Type="String">Expected Closure</Data></Cell>
    <Cell><Data ss:Type="String">Created Date</Data></Cell>
   </Row>
${xmlRows}
  </Table>
 </Worksheet>
</Workbook>`;

    const blob = new Blob([xmlContent], {
      type: "application/vnd.ms-excel;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Leads_Pipeline_${format(new Date(), "yyyy-MM-dd")}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Excel File Generated",
      description: `Exported ${leadsToExport.length} lead(s) to Excel.`,
    });
  };

  const exportToCsv = (leadsToExport: any[]) => {
    const headers = [
      "Lead Number",
      "Customer Name",
      "Company",
      "Phone",
      "Email",
      "Project Type",
      "Location",
      "Budget Estimate",
      "Stage",
      "Status",
      "Priority",
      "Owner",
      "Expected Closure Date",
      "Created Date",
    ];

    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const csvRows = [
      headers.join(","),
      ...leadsToExport.map((l) =>
        [
          escapeCsv(l.leadNumber),
          escapeCsv(l.customerName),
          escapeCsv(l.company),
          escapeCsv(l.contactPhone),
          escapeCsv(l.contactEmail),
          escapeCsv(l.projectType),
          escapeCsv(l.location),
          escapeCsv(l.budgetEstimate ?? 0),
          escapeCsv(l.stage),
          escapeCsv(l.status),
          escapeCsv(l.priority),
          escapeCsv(l.ownerName),
          escapeCsv(l.expectedClosureDate),
          escapeCsv(l.createdAt),
        ].join(",")
      ),
    ];

    const blob = new Blob(["\uFEFF" + csvRows.join("\r\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Leads_Pipeline_${format(new Date(), "yyyy-MM-dd")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "CSV File Generated",
      description: `Exported ${leadsToExport.length} lead(s) to CSV.`,
    });
  };

  const handleResetFilters = () => {
    setSearch("");
    setStageFilter("all");
    setStatusFilter("all");
    setPriorityFilter("all");
  };

  const hasActiveFilters =
    search !== "" ||
    stageFilter !== "all" ||
    statusFilter !== "all" ||
    priorityFilter !== "all";

  if (isLoadingLeads || isLoadingSummary) {
    return (
      <div className="p-8 space-y-4 animate-pulse">
        <div className="h-10 bg-muted/40 rounded w-1/4" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-muted/30 rounded-xl" />
          ))}
        </div>
        <div className="h-96 bg-muted/20 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* ── 1. Header & Controls ──────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-2">
            Leads Pipeline
          </h1>
          <p className="text-muted-foreground text-sm">
            Track sales opportunities, drag leads across stages, and export pipeline data.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* View Toggle */}
          <div className="flex items-center rounded-lg border bg-muted/50 p-1 shadow-sm">
            <Button
              variant={viewMode === "kanban" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("kanban")}
              className="gap-1.5 text-xs font-semibold h-8"
            >
              <Kanban className="h-3.5 w-3.5" />
              Kanban
            </Button>
            <Button
              variant={viewMode === "table" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("table")}
              className="gap-1.5 text-xs font-semibold h-8"
            >
              <LayoutList className="h-3.5 w-3.5" />
              Table
            </Button>
          </div>

          {/* Export to Excel Dropdown (FR-LEAD-13) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 h-9 text-xs font-semibold border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20">
                <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                Export to Excel
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="text-xs">Export Options</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => exportToExcel(filteredLeads)}
                className="gap-2 cursor-pointer text-xs"
              >
                <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                <span>Export Filtered ({filteredLeads.length}) to Excel (.xls)</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => exportToExcel(leadsArray)}
                className="gap-2 cursor-pointer text-xs"
              >
                <Download className="h-4 w-4 text-primary" />
                <span>Export All ({leadsArray.length}) to Excel (.xls)</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => exportToCsv(filteredLeads)}
                className="gap-2 cursor-pointer text-xs"
              >
                <Download className="h-4 w-4 text-muted-foreground" />
                <span>Export to CSV (.csv)</span>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a
                  href="/api/leads/export"
                  download
                  className="flex items-center gap-2 cursor-pointer text-xs w-full py-1.5 px-2"
                >
                  <Download className="h-4 w-4 text-muted-foreground" />
                  <span>Direct Download via API</span>
                </a>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* New Lead Dialog */}
          <NewLeadDialog
            trigger={
              <Button className="shrink-0 gap-2 h-9 text-xs font-semibold shadow-sm">
                <Plus className="h-4 w-4" /> New Lead
              </Button>
            }
          />
        </div>
      </div>

      {/* ── 2. KPI Summary Cards ──────────────────────────────────────────────── */}
      {summary && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border shadow-xs hover:shadow-sm transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Total Leads
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black">{summary.totalLeads ?? 0}</div>
              <p className="text-[11px] text-muted-foreground mt-0.5">Active prospects in CRM</p>
            </CardContent>
          </Card>
          <Card className="border shadow-xs hover:shadow-sm transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Pipeline Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-primary">
                {INR.format(summary.pipelineValue ?? 0)}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">Estimated opportunity value</p>
            </CardContent>
          </Card>
          <Card className="border shadow-xs hover:shadow-sm transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Conversion Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-emerald-600">
                {summary.conversionRate ? summary.conversionRate.toFixed(1) : "0.0"}%
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">Won to total leads ratio</p>
            </CardContent>
          </Card>
          <Card className="border shadow-xs hover:shadow-sm transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Qualified Leads
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-blue-600">
                {summary.qualifiedLeads ?? 0}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">High-intent client inquiries</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── 3. Filters & Search Bar (FR-LEAD-10 / 11) ──────────────────────────── */}
      <div className="bg-card border rounded-xl p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by customer, lead no., company..."
              className="pl-8 h-9 text-xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Stage Filter */}
          <Select value={stageFilter} onValueChange={setStageFilter}>
            <SelectTrigger className="w-[150px] h-9 text-xs">
              <SelectValue placeholder="All Stages" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stages</SelectItem>
              {STAGES.map((s) => (
                <SelectItem key={s.key} value={s.key}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px] h-9 text-xs">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="qualified">Qualified</SelectItem>
              <SelectItem value="won">Won</SelectItem>
              <SelectItem value="lost">Lost</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          {/* Priority Filter */}
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[130px] h-9 text-xs">
              <SelectValue placeholder="All Priorities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="gap-1.5 h-9 text-xs text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </Button>
          )}
        </div>

        <div className="text-xs text-muted-foreground">
          Showing <span className="font-bold text-foreground">{filteredLeads.length}</span> of{" "}
          <span className="font-bold text-foreground">{leadsArray.length}</span> leads
        </div>
      </div>

      {/* ── 4. Main Views: Kanban vs. Table ───────────────────────────────────── */}
      {viewMode === "kanban" ? (
        /* ── Kanban View (FR-LEAD-12) ── */
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <span>💡 <strong>Drag & Drop</strong> lead cards across columns to advance pipeline stages.</span>
            <span>Total Columns: {STAGES.length}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5 items-start overflow-x-auto pb-4">
            {STAGES.map((stage) => {
              const StageIcon = stage.icon;
              const stageLeads = filteredLeads.filter((l) => isLeadInColumn(l, stage.key));
              const stageTotalValue = stageLeads.reduce(
                (sum, l) => sum + (Number(l.budgetEstimate) || 0),
                0
              );
              const isDragOver = dragOverStage === stage.key;

              return (
                <div
                  key={stage.key}
                  onDragOver={(e) => handleDragOver(e, stage.key)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, stage.key)}
                  className={`flex flex-col rounded-xl border bg-card/60 backdrop-blur-sm transition-all duration-200 min-h-[550px] ${
                    stage.columnClass
                  } ${
                    isDragOver
                      ? "ring-2 ring-primary border-primary bg-primary/5 shadow-md"
                      : "shadow-xs"
                  }`}
                >
                  {/* Column Header */}
                  <div className="p-3 border-b bg-muted/40 rounded-t-xl space-y-1.5">
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5">
                        <StageIcon className="h-4 w-4 text-primary" />
                        <span className="text-xs font-bold text-foreground truncate">
                          {stage.label}
                        </span>
                      </div>
                      <Badge
                        variant="secondary"
                        className="text-[10px] font-bold px-1.5 py-0 h-4 bg-background border"
                      >
                        {stageLeads.length}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span className="truncate">{stage.subtitle}</span>
                      <span className="font-semibold text-foreground/80 font-mono">
                        {formatCompactINR(stageTotalValue)}
                      </span>
                    </div>
                  </div>

                  {/* Lead Cards List */}
                  <div className="p-2.5 space-y-2.5 flex-1 overflow-y-auto max-h-[700px]">
                    {stageLeads.map((lead: any) => (
                      <div
                        key={lead.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, lead.id)}
                        className="group relative rounded-lg border bg-background p-3 shadow-xs hover:shadow-md hover:border-primary/50 transition-all duration-200 cursor-grab active:cursor-grabbing space-y-2.5"
                      >
                        {/* Top: Lead No & Priority */}
                        <div className="flex items-center justify-between gap-2">
                          <Link
                            href={`/leads/${lead.id}`}
                            className="font-mono text-xs font-bold text-primary hover:underline truncate"
                          >
                            {lead.leadNumber}
                          </Link>

                          <div className="flex items-center gap-1">
                            {lead.priority && (
                              <Badge
                                variant="outline"
                                className={`text-[9px] uppercase font-bold tracking-wider px-1.5 py-0 h-4 ${
                                  priorityColor[lead.priority] || ""
                                }`}
                              >
                                {lead.priority}
                              </Badge>
                            )}

                            {/* Quick Stage Move Dropdown Menu */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5 p-0 text-muted-foreground opacity-60 group-hover:opacity-100 hover:text-foreground"
                                >
                                  <MoreVertical className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuLabel className="text-[11px]">
                                  Move Stage To:
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {STAGES.map((s) => (
                                  <DropdownMenuItem
                                    key={s.key}
                                    disabled={lead.stage === s.key}
                                    onClick={() => moveLeadToStage(lead.id, s.key)}
                                    className="text-xs cursor-pointer gap-2"
                                  >
                                    <ArrowRight className="h-3 w-3 text-primary" />
                                    <span>{s.label}</span>
                                  </DropdownMenuItem>
                                ))}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                  <Link
                                    href={`/leads/${lead.id}`}
                                    className="text-xs cursor-pointer font-medium text-primary"
                                  >
                                    View Full Details →
                                  </Link>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>

                        {/* Customer & Company */}
                        <div>
                          <Link
                            href={`/leads/${lead.id}`}
                            className="text-sm font-bold text-foreground hover:text-primary transition-colors line-clamp-1"
                          >
                            {lead.customerName}
                          </Link>
                          {lead.company && (
                            <p className="text-[11px] text-muted-foreground truncate">
                              {lead.company}
                            </p>
                          )}
                        </div>

                        {/* Project Type & Location */}
                        {(lead.projectType || lead.location) && (
                          <div className="space-y-1 text-[11px] text-muted-foreground bg-muted/30 p-2 rounded-md">
                            {lead.projectType && (
                              <div className="flex items-center gap-1.5 truncate">
                                <Briefcase className="h-3 w-3 text-muted-foreground shrink-0" />
                                <span className="truncate">{lead.projectType}</span>
                              </div>
                            )}
                            {lead.location && (
                              <div className="flex items-center gap-1.5 truncate">
                                <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                                <span className="truncate">{lead.location}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Value & Status */}
                        <div className="pt-1 border-t border-border/60 flex items-center justify-between gap-2">
                          <div className="font-mono text-xs font-black text-foreground">
                            {lead.budgetEstimate ? INR.format(lead.budgetEstimate) : "—"}
                          </div>

                          <Badge
                            variant={
                              lead.status === "won"
                                ? "default"
                                : lead.status === "lost"
                                ? "destructive"
                                : "secondary"
                            }
                            className="text-[9px] capitalize font-semibold px-1.5 py-0 h-4"
                          >
                            {lead.status}
                          </Badge>
                        </div>

                        {/* Footer: Owner and Closure Date */}
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-0.5">
                          <span className="flex items-center gap-1 truncate max-w-[100px]">
                            <User className="h-3 w-3 shrink-0" />
                            <span className="truncate">{lead.ownerName || "Unassigned"}</span>
                          </span>

                          {lead.expectedClosureDate && (
                            <span className="flex items-center gap-1 shrink-0 font-medium text-foreground/70">
                              <Clock className="h-3 w-3 shrink-0" />
                              <span>{lead.expectedClosureDate}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    ))}

                    {stageLeads.length === 0 && (
                      <div className="flex flex-col items-center justify-center p-6 text-center border-2 border-dashed border-border/60 rounded-lg min-h-[120px] text-muted-foreground">
                        <p className="text-[11px]">No leads in this stage.</p>
                        <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                          Drag leads here
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ── Table View ── */
        <div className="rounded-xl border bg-card shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground border-b text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Lead No.</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Stage</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Budget Value</th>
                  <th className="px-4 py-3">Owner</th>
                  <th className="px-4 py-3">Won Project</th>
                  <th className="px-4 py-3 text-right">Created</th>
                  <th className="px-4 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredLeads.map((lead: any) => (
                  <tr key={lead.id} className="hover:bg-accent/40 transition-colors">
                    <td className="px-4 py-3">
                      <Link
                        href={`/leads/${lead.id}`}
                        className="font-mono text-xs font-bold text-primary hover:underline"
                      >
                        {lead.leadNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-foreground">{lead.customerName}</div>
                      {lead.company && (
                        <div className="text-xs text-muted-foreground">{lead.company}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          lead.status === "won"
                            ? "default"
                            : lead.status === "lost"
                            ? "destructive"
                            : "secondary"
                        }
                        className="text-[10px] capitalize font-semibold"
                      >
                        {lead.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-[10px] capitalize font-medium">
                        {lead.stage?.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={`text-[9px] uppercase font-bold tracking-wider px-1.5 py-0 h-4 ${
                          priorityColor[lead.priority] || ""
                        }`}
                      >
                        {lead.priority || "medium"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold text-foreground">
                      {lead.budgetEstimate ? INR.format(lead.budgetEstimate) : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {lead.ownerName || "Unassigned"}
                    </td>
                    <td className="px-4 py-3">
                      {lead.wonProjectId ? (
                        <Link
                          href={`/projects/${lead.wonProjectId}`}
                          className="text-primary text-xs font-medium hover:underline inline-flex items-center gap-1"
                        >
                          Project #{lead.wonProjectId} →
                        </Link>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                      {format(new Date(lead.createdAt), "MMM d, yyyy")}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Link
                        href={`/leads/${lead.id}`}
                        className="text-xs text-primary font-medium hover:underline"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
                {filteredLeads.length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-4 py-12 text-center text-muted-foreground">
                      <p className="text-sm font-medium">No leads found matching your criteria.</p>
                      <p className="text-xs mt-1">Try resetting your search or filter filters.</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleResetFilters}
                        className="mt-3 text-xs"
                      >
                        Reset Filters
                      </Button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
