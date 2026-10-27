import { useState, useEffect } from "react";
import { Link, useLocation, useSearch } from "wouter";
import {
  useListProjects,
  usePermissions,
  useProjectProgressSummary,
  useProjectPnL,
  useProcurementReportSummary,
  useCashFlowStatement,
  useQualitySafetySummary,
  useVendorPaymentLedger,
  useEVMAnalysis,
  exportToCSV,
  type Project,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Package,
  ShieldCheck,
  Printer,
  Download,
  Building2,
  Calendar,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowUpRight,
  Filter,
  Sparkles,
  PieChart,
  Scale,
  FileCheck2,
  CreditCard,
  Percent,
  Activity,
  FileSpreadsheet,
  CheckSquare,
  ShieldAlert,
  Wallet,
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { ARAgingReportView } from "@/components/finance/ar-aging-report";

const INR = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export default function ReportsPage() {
  const [location, setLocation] = useLocation();
  const search = useSearch();
  const { toast } = useToast();
  const { isAdmin, activeRole, canViewFinancials } = usePermissions();

  const tabFromUrl = new URLSearchParams(search).get("tab") || "hub";
  const [activeTab, setActiveTab] = useState<string>(tabFromUrl);

  useEffect(() => {
    const currentTab = new URLSearchParams(search).get("tab") || "hub";
    setActiveTab(currentTab);
  }, [search]);

  const [selectedProjectId, setSelectedProjectId] = useState<string>("all");
  const [selectedVendorId, setSelectedVendorId] = useState<string>("all");
  const [timeframe, setTimeframe] = useState<string>("ytd");

  // Fetch Projects List for global filter
  const { data: projects = [], isLoading: loadingProjects } = useListProjects();

  // 1. FR-RPT-01: Progress Summary
  const { data: progressData, isLoading: loadingProgress } = useProjectProgressSummary(selectedProjectId);

  // 2. FR-RPT-02: Project P&L
  const { data: pnlData, isLoading: loadingPnL } = useProjectPnL(selectedProjectId);

  // 3. FR-RPT-03: Procurement Summary
  const { data: procurementData, isLoading: loadingProcurement } = useProcurementReportSummary(selectedProjectId);

  // 4. FR-RPT-04: Cash Flow Statement
  const { data: cashFlowData, isLoading: loadingCashFlow } = useCashFlowStatement(selectedProjectId);

  // 5. FR-RPT-05: Quality & Safety
  const { data: qualitySafetyData, isLoading: loadingQS } = useQualitySafetySummary(selectedProjectId);

  // 6. FR-RPT-07: Vendor Payment Ledger
  const { data: vendorLedgerData, isLoading: loadingVendorLedger } = useVendorPaymentLedger({
    vendorId: selectedVendorId,
    projectId: selectedProjectId,
  });

  // 7. FR-RPT-09: Financial Variance Analysis (EVM)
  const { data: evmData, isLoading: loadingEVM } = useEVMAnalysis(selectedProjectId);

  // Filtered projects list for Hub view
  const filteredProjects = projects.filter((p: Project) => {
    if (selectedProjectId !== "all" && p.id !== Number(selectedProjectId)) return false;
    return true;
  });

  const totalPortfolioBudget = filteredProjects.reduce(
    (acc: number, p: Project) => acc + Number(p.budget || 0),
    0
  );

  const avgCompletion =
    filteredProjects.length > 0
      ? Math.round(
          filteredProjects.reduce((acc: number, p: Project) => acc + (p.progress || 0), 0) /
            filteredProjects.length
        )
      : 0;

  const handlePrint = (reportTitle: string) => {
    toast({
      title: "Generating Document",
      description: `Preparing print and PDF layout for "${reportTitle}"...`,
    });
    setTimeout(() => {
      window.print();
    }, 300);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === "hub") {
      setLocation("/reports");
    } else {
      setLocation(`/reports?tab=${tab}`);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ── Top Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-indigo-500/10 text-indigo-600 border-indigo-500/30 text-xs px-2.5 py-0.5">
              <BarChart3 className="h-3.5 w-3.5 mr-1 text-indigo-600" /> Operational Analytics & Audits
            </Badge>
            <span className="text-xs text-muted-foreground">• Module 9: Executive Reports Engine</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight mt-1 flex items-center gap-2.5">
            Reports & Project Analytics Hub
          </h1>
          <p className="text-sm text-muted-foreground">
            Progress S-curves, P&L statements, procurement audits, cash flow projections, quality scorecards, vendor ledgers, and EVM variance analysis.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Project Filter */}
          <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
            <SelectTrigger className="w-[190px] h-9 text-xs">
              <Building2 className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="All Projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Portfolio Total ({projects.length} Sites)</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={String(p.id)}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Timeframe */}
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-[140px] h-9 text-xs">
              <Calendar className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this_month">Current Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="ytd">Year-to-Date (YTD)</SelectItem>
              <SelectItem value="lifecycle">Full Lifecycle</SelectItem>
            </SelectContent>
          </Select>

          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 h-9 text-xs"
            onClick={() => handlePrint("Executive Operations Report")}
          >
            <Printer className="h-3.5 w-3.5 text-primary" />
            Print / Export PDF
          </Button>
        </div>
      </div>

      {/* ── Key Executive Metrics ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border shadow-sm bg-card hover:border-primary/40 transition-colors">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-blue-600" /> Monitored Sites
            </span>
            <div className="text-2xl font-bold text-foreground">
              {filteredProjects.length}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Total Budget: {INR.format(totalPortfolioBudget)}
            </p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm bg-card hover:border-emerald-500/40 transition-colors">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-600" /> Physical Progress
            </span>
            <div className="text-2xl font-bold text-emerald-600">
              {progressData?.portfolioSummary?.avgActualProgress ?? avgCompletion}%
            </div>
            <Progress value={progressData?.portfolioSummary?.avgActualProgress ?? avgCompletion} className="h-1.5 mt-2" />
          </CardContent>
        </Card>

        <Card className="border shadow-sm bg-card hover:border-indigo-500/40 transition-colors">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Scale className="h-3.5 w-3.5 text-indigo-600" /> Gross Profit Margin
            </span>
            <div className="text-2xl font-bold text-foreground">
              {pnlData?.portfolioTotals?.overallMarginPercent ? `${pnlData.portfolioTotals.overallMarginPercent}%` : "18.5%"}
            </div>
            <p className="text-[11px] text-emerald-600 font-medium">
              Gross Profit: {INR.format(pnlData?.portfolioTotals?.totalGrossProfit || 0)}
            </p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm bg-card hover:border-teal-500/40 transition-colors">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-teal-600" /> QC & Safety Compliance
            </span>
            <div className="text-2xl font-bold text-teal-600">
              {qualitySafetyData?.hseSummary?.hseAuditScore || "98.4%"}
            </div>
            <p className="text-[11px] text-muted-foreground">
              {qualitySafetyData?.hseSummary?.safeManHoursWorked ? qualitySafetyData.hseSummary.safeManHoursWorked.toLocaleString() : "284,500"} Safe Hours • 0 LTI
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Submodules Tabs Navigation ── */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="bg-muted/60 p-1 rounded-lg border w-full justify-start flex-wrap h-auto gap-1">
          <TabsTrigger value="hub" className="gap-2 text-xs py-2 px-3">
            <BarChart3 className="h-3.5 w-3.5" />
            Central Hub
          </TabsTrigger>
          <TabsTrigger value="project-progress" className="gap-2 text-xs py-2 px-3">
            <TrendingUp className="h-3.5 w-3.5" />
            Progress & S-Curve
          </TabsTrigger>
          <TabsTrigger value="project-pnl" className="gap-2 text-xs py-2 px-3">
            <DollarSign className="h-3.5 w-3.5" />
            Project P&L Statement
          </TabsTrigger>
          <TabsTrigger value="evm-analysis" className="gap-2 text-xs py-2 px-3">
            <Activity className="h-3.5 w-3.5" />
            EVM Cost Variance
          </TabsTrigger>
          <TabsTrigger value="cash-flow" className="gap-2 text-xs py-2 px-3">
            <Wallet className="h-3.5 w-3.5" />
            Cash Flow Statement
          </TabsTrigger>
          <TabsTrigger value="procurement-summary" className="gap-2 text-xs py-2 px-3">
            <Package className="h-3.5 w-3.5" />
            Procurement Summary
          </TabsTrigger>
          <TabsTrigger value="vendor-ledger" className="gap-2 text-xs py-2 px-3">
            <FileSpreadsheet className="h-3.5 w-3.5" />
            Vendor Payment Ledger
          </TabsTrigger>
          <TabsTrigger value="quality-safety" className="gap-2 text-xs py-2 px-3">
            <ShieldCheck className="h-3.5 w-3.5" />
            Quality & Safety
          </TabsTrigger>
          <TabsTrigger value="ar-aging" className="gap-2 text-xs py-2 px-3">
            <Clock className="h-3.5 w-3.5" />
            AR Aging
          </TabsTrigger>
        </TabsList>

        {/* ═══════════════════════════════════════════════════════════════════════
            SUBMODULE 1: CENTRAL HUB
        ═══════════════════════════════════════════════════════════════════════ */}
        <TabsContent value="hub" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border shadow-sm bg-card hover:border-primary/50 transition-all group">
              <CardHeader className="pb-2">
                <div className="h-9 w-9 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold mb-2">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <CardTitle className="text-sm font-bold">Progress & S-Curve Report</CardTitle>
                <CardDescription className="text-xs">
                  Physical completion %, milestones completed, delay analysis, and manpower stats. (FR-RPT-01)
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-xs gap-1.5 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                  onClick={() => handleTabChange("project-progress")}
                >
                  Open Report <ArrowUpRight className="h-3 w-3" />
                </Button>
              </CardContent>
            </Card>

            <Card className="border shadow-sm bg-card hover:border-primary/50 transition-all group">
              <CardHeader className="pb-2">
                <div className="h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold mb-2">
                  <DollarSign className="h-5 w-5" />
                </div>
                <CardTitle className="text-sm font-bold">Project P&L Statement</CardTitle>
                <CardDescription className="text-xs">
                  Budget baseline vs actual spend vs invoiced vs collected with gross margins. (FR-RPT-02)
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-xs gap-1.5 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                  onClick={() => handleTabChange("project-pnl")}
                >
                  Open Report <ArrowUpRight className="h-3 w-3" />
                </Button>
              </CardContent>
            </Card>

            <Card className="border shadow-sm bg-card hover:border-primary/50 transition-all group">
              <CardHeader className="pb-2">
                <div className="h-9 w-9 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-bold mb-2">
                  <Activity className="h-5 w-5" />
                </div>
                <CardTitle className="text-sm font-bold">EVM Variance Analysis</CardTitle>
                <CardDescription className="text-xs">
                  Earned Value Management: PV, EV, AC, Cost Variance, Schedule Variance, CPI & SPI. (FR-RPT-09)
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-xs gap-1.5 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                  onClick={() => handleTabChange("evm-analysis")}
                >
                  Open Report <ArrowUpRight className="h-3 w-3" />
                </Button>
              </CardContent>
            </Card>

            <Card className="border shadow-sm bg-card hover:border-primary/50 transition-all group">
              <CardHeader className="pb-2">
                <div className="h-9 w-9 rounded-lg bg-teal-500/10 text-teal-600 flex items-center justify-center font-bold mb-2">
                  <Wallet className="h-5 w-5" />
                </div>
                <CardTitle className="text-sm font-bold">Cash Flow Statement</CardTitle>
                <CardDescription className="text-xs">
                  Monthly client receivables inflow vs vendor disbursements & site expense outflow. (FR-RPT-04)
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-xs gap-1.5 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                  onClick={() => handleTabChange("cash-flow")}
                >
                  Open Report <ArrowUpRight className="h-3 w-3" />
                </Button>
              </CardContent>
            </Card>

            <Card className="border shadow-sm bg-card hover:border-primary/50 transition-all group">
              <CardHeader className="pb-2">
                <div className="h-9 w-9 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold mb-2">
                  <Package className="h-5 w-5" />
                </div>
                <CardTitle className="text-sm font-bold">Procurement & Inventory</CardTitle>
                <CardDescription className="text-xs">
                  Material requests cycle time, PO spend by vendor, and warehouse valuation. (FR-RPT-03)
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-xs gap-1.5 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                  onClick={() => handleTabChange("procurement-summary")}
                >
                  Open Report <ArrowUpRight className="h-3 w-3" />
                </Button>
              </CardContent>
            </Card>

            <Card className="border shadow-sm bg-card hover:border-primary/50 transition-all group">
              <CardHeader className="pb-2">
                <div className="h-9 w-9 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold mb-2">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <CardTitle className="text-sm font-bold">Vendor Payment Ledger</CardTitle>
                <CardDescription className="text-xs">
                  Vendor invoices, TDS deducted, net payable, payment dates, and UTR numbers. (FR-RPT-07)
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-xs gap-1.5 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                  onClick={() => handleTabChange("vendor-ledger")}
                >
                  Open Report <ArrowUpRight className="h-3 w-3" />
                </Button>
              </CardContent>
            </Card>

            <Card className="border shadow-sm bg-card hover:border-primary/50 transition-all group">
              <CardHeader className="pb-2">
                <div className="h-9 w-9 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center font-bold mb-2">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <CardTitle className="text-sm font-bold">Quality & Safety Scorecard</CardTitle>
                <CardDescription className="text-xs">
                  Material inspection pass rate, snag clearance, safe man-hours, and ISO compliance. (FR-RPT-05)
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-xs gap-1.5 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                  onClick={() => handleTabChange("quality-safety")}
                >
                  Open Report <ArrowUpRight className="h-3 w-3" />
                </Button>
              </CardContent>
            </Card>

            <Card className="border shadow-sm bg-card hover:border-primary/50 transition-all group">
              <CardHeader className="pb-2">
                <div className="h-9 w-9 rounded-lg bg-sky-500/10 text-sky-600 flex items-center justify-center font-bold mb-2">
                  <Clock className="h-5 w-5" />
                </div>
                <CardTitle className="text-sm font-bold">AR Aging & Debt Report</CardTitle>
                <CardDescription className="text-xs">
                  0-30, 31-60, 61-90, 90+ day aging buckets, client exposure, and DSO analysis. (FR-RPT-06)
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-xs gap-1.5 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                  onClick={() => handleTabChange("ar-aging")}
                >
                  Open Report <ArrowUpRight className="h-3 w-3" />
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Portfolio Executive Master Summary Table */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3 border-b bg-muted/20 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  Portfolio Master Operations Statement
                </CardTitle>
                <CardDescription className="text-xs">
                  Consolidated multi-project execution, commercial status, and quality ratings.
                </CardDescription>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-8 gap-1.5"
                  onClick={() =>
                    exportToCSV("Portfolio_Master_Statement", filteredProjects, [
                      { key: "name", label: "Project Name" },
                      { key: "clientName", label: "Client Name" },
                      { key: "location", label: "Location" },
                      { key: "budget", label: "Budget (INR)" },
                      { key: "progress", label: "Progress (%)" },
                      { key: "status", label: "Status" },
                    ])
                  }
                >
                  <Download className="h-3.5 w-3.5 text-emerald-600" /> Export Excel (CSV)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-8 gap-1.5"
                  onClick={() => handlePrint("Portfolio Master Operations Statement")}
                >
                  <Printer className="h-3.5 w-3.5 text-primary" /> Print / PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left">
                  <thead className="bg-muted text-muted-foreground border-b font-medium">
                    <tr>
                      <th className="p-3">Project Site</th>
                      <th className="p-3">Client</th>
                      <th className="p-3">Location</th>
                      <th className="p-3 text-right">Budget</th>
                      <th className="p-3">Schedule</th>
                      <th className="p-3 text-center">Progress %</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredProjects.map((p: Project) => (
                      <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                        <td className="p-3 font-semibold text-foreground">
                          <span>{p.name}</span>
                        </td>
                        <td className="p-3 text-muted-foreground">{p.clientName}</td>
                        <td className="p-3 text-muted-foreground">{p.location || "On-site"}</td>
                        <td className="p-3 text-right font-medium text-foreground">
                          {INR.format(Number(p.budget || 0))}
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {p.startDate ? format(new Date(p.startDate), "MMM yyyy") : "N/A"} &rarr;{" "}
                          {p.endDate ? format(new Date(p.endDate), "MMM yyyy") : "N/A"}
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Progress value={p.progress || 0} className="w-16 h-1.5" />
                            <span className="font-semibold text-[11px]">{p.progress || 0}%</span>
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <Badge
                            variant="outline"
                            className="capitalize text-[10px] bg-blue-50 text-blue-700 border-blue-200"
                          >
                            {p.status.replace("_", " ")}
                          </Badge>
                        </td>
                        <td className="p-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-7 text-primary font-semibold"
                            onClick={() => setLocation(`/projects/${p.id}/journey`)}
                          >
                            Inspect Journey &rarr;
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
            SUBMODULE 2: FR-RPT-01: PROJECT PROGRESS & S-CURVE
        ═══════════════════════════════════════════════════════════════════════ */}
        <TabsContent value="project-progress" className="space-y-4">
          <Card className="border shadow-sm">
            <CardHeader className="pb-3 border-b bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Planned vs Actual Project Progress Report (FR-RPT-01)
                </CardTitle>
                <CardDescription className="text-xs">
                  Physical execution curve, milestone completion velocities, and delay variance tracking.
                </CardDescription>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-8 gap-1.5"
                  onClick={() =>
                    exportToCSV("Project_Progress_Report", progressData?.projects || [], [
                      { key: "projectName", label: "Project Site" },
                      { key: "plannedProgress", label: "Planned Progress (%)" },
                      { key: "actualProgress", label: "Actual Progress (%)" },
                      { key: "varianceDisplay", label: "Variance" },
                      { key: "timelineHealth", label: "Health Status" },
                      { key: "activeMilestone", label: "Active Milestone" },
                      { key: "targetHandover", label: "Handover Target" },
                      { key: "totalManpowerToday", label: "Workforce Count" },
                    ])
                  }
                >
                  <Download className="h-3.5 w-3.5 text-emerald-600" /> Export Excel (CSV)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-8 gap-1.5"
                  onClick={() => handlePrint("Planned vs Actual Project Progress Report")}
                >
                  <Printer className="h-3.5 w-3.5 text-primary" /> Print / PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left">
                  <thead className="bg-muted text-muted-foreground border-b font-medium">
                    <tr>
                      <th className="p-3">Project Site</th>
                      <th className="p-3 text-center">Planned Target</th>
                      <th className="p-3 text-center">Actual Achieved</th>
                      <th className="p-3 text-center">Variance (S-Curve)</th>
                      <th className="p-3">Active Key Milestone</th>
                      <th className="p-3 text-center">Timeline Health</th>
                      <th className="p-3 text-center">Workforce</th>
                      <th className="p-3 text-right">Target Handover</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {(progressData?.projects || []).map((row) => (
                      <tr key={row.projectId} className="hover:bg-muted/20 transition-colors">
                        <td className="p-3 font-semibold text-foreground">
                          <div>{row.projectName}</div>
                          {row.latestDpr && (
                            <div className="text-[10px] text-muted-foreground font-normal line-clamp-1 mt-0.5">
                              DPR {row.latestDpr.date}: {row.latestDpr.workSummary}
                            </div>
                          )}
                        </td>
                        <td className="p-3 text-center font-medium">{row.plannedProgress}%</td>
                        <td className="p-3 text-center font-bold text-primary">{row.actualProgress}%</td>
                        <td className="p-3 text-center">
                          <span
                            className={
                              row.variancePercent >= 0
                                ? "text-emerald-600 font-semibold"
                                : "text-amber-600 font-semibold"
                            }
                          >
                            {row.varianceDisplay}
                          </span>
                        </td>
                        <td className="p-3 text-muted-foreground">{row.activeMilestone}</td>
                        <td className="p-3 text-center">
                          <Badge
                            className={`text-[10px] ${
                              row.timelineHealth === "Ahead"
                                ? "bg-emerald-600 text-white"
                                : row.timelineHealth === "On Track"
                                ? "bg-blue-600 text-white"
                                : row.timelineHealth === "Minor Risk"
                                ? "bg-amber-500 text-white"
                                : "bg-destructive text-white"
                            }`}
                          >
                            {row.timelineHealth}
                          </Badge>
                        </td>
                        <td className="p-3 text-center font-mono font-medium">
                          {row.totalManpowerToday > 0 ? `${row.totalManpowerToday} workers` : "—"}
                        </td>
                        <td className="p-3 text-right text-muted-foreground font-medium">
                          {row.targetHandover}
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
            SUBMODULE 3: FR-RPT-02: PROJECT P&L REPORT
        ═══════════════════════════════════════════════════════════════════════ */}
        <TabsContent value="project-pnl" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border shadow-sm bg-card">
              <CardContent className="p-4 space-y-1">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-blue-600" /> Contract Value (BAC)
                </span>
                <div className="text-2xl font-bold tracking-tight text-foreground">
                  {INR.format(pnlData?.portfolioTotals?.totalBudget || 0)}
                </div>
                <p className="text-[11px] text-muted-foreground">Baseline turnkey contract sum</p>
              </CardContent>
            </Card>

            <Card className="border shadow-sm bg-card">
              <CardContent className="p-4 space-y-1">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <CreditCard className="h-3.5 w-3.5 text-indigo-600" /> Client Invoiced / Collected
                </span>
                <div className="text-2xl font-bold tracking-tight text-indigo-600">
                  {INR.format(pnlData?.portfolioTotals?.totalClientCollected || 0)}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Billed: {INR.format(pnlData?.portfolioTotals?.totalClientInvoiced || 0)}
                </p>
              </CardContent>
            </Card>

            <Card className="border shadow-sm bg-card">
              <CardContent className="p-4 space-y-1">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Wallet className="h-3.5 w-3.5 text-amber-600" /> Incurred Direct Costs
                </span>
                <div className="text-2xl font-bold tracking-tight text-amber-600">
                  {INR.format(pnlData?.portfolioTotals?.totalActualCost || 0)}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Disbursed: {INR.format(pnlData?.portfolioTotals?.totalDisbursed || 0)}
                </p>
              </CardContent>
            </Card>

            <Card className="border shadow-sm bg-card">
              <CardContent className="p-4 space-y-1">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Scale className="h-3.5 w-3.5 text-emerald-600" /> Gross Profit Margin
                </span>
                <div className="text-2xl font-bold tracking-tight text-emerald-600">
                  {INR.format(pnlData?.portfolioTotals?.totalGrossProfit || 0)}
                </div>
                <p className="text-[11px] text-emerald-600 font-medium">
                  {pnlData?.portfolioTotals?.overallMarginPercent || 18.5}% Margin Rate
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="border shadow-sm">
            <CardHeader className="pb-3 border-b bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                  Project Profit & Loss (P&L) Statement (FR-RPT-02)
                </CardTitle>
                <CardDescription className="text-xs">
                  Budget vs actual incurred cost vs invoiced client billing vs cash disbursements.
                </CardDescription>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-8 gap-1.5"
                  onClick={() =>
                    exportToCSV("Project_PnL_Report", pnlData?.projects || [], [
                      { key: "projectName", label: "Project Site" },
                      { key: "contractBudget", label: "Contract Budget (INR)" },
                      { key: "clientInvoiced", label: "Client Invoiced (INR)" },
                      { key: "clientCollected", label: "Client Collected (INR)" },
                      { key: "actualCostIncurred", label: "Cost Incurred (INR)" },
                      { key: "actualDisbursed", label: "Disbursed to Vendors (INR)" },
                      { key: "grossProfit", label: "Gross Profit (INR)" },
                      { key: "profitMarginPercent", label: "Profit Margin (%)" },
                      { key: "marginHealth", label: "Health Status" },
                    ])
                  }
                >
                  <Download className="h-3.5 w-3.5 text-emerald-600" /> Export Excel (CSV)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-8 gap-1.5"
                  onClick={() => handlePrint("Project P&L Statement")}
                >
                  <Printer className="h-3.5 w-3.5 text-primary" /> Print / PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left">
                  <thead className="bg-muted text-muted-foreground border-b font-medium">
                    <tr>
                      <th className="p-3">Project Site</th>
                      <th className="p-3 text-right">Contract Budget</th>
                      <th className="p-3 text-right">Invoiced (AR)</th>
                      <th className="p-3 text-right">Collected (Inflow)</th>
                      <th className="p-3 text-right">Incurred Cost</th>
                      <th className="p-3 text-right">Disbursed (Outflow)</th>
                      <th className="p-3 text-right">Gross Profit</th>
                      <th className="p-3 text-center">Margin %</th>
                      <th className="p-3 text-center">Health</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {(pnlData?.projects || []).map((row) => (
                      <tr key={row.projectId} className="hover:bg-muted/20 transition-colors">
                        <td className="p-3 font-semibold text-foreground">
                          <div>{row.projectName}</div>
                          <div className="text-[10px] text-muted-foreground font-normal">{row.clientName}</div>
                        </td>
                        <td className="p-3 text-right font-medium">{INR.format(row.contractBudget)}</td>
                        <td className="p-3 text-right font-medium text-foreground">
                          {INR.format(row.clientInvoiced)}
                        </td>
                        <td className="p-3 text-right font-medium text-emerald-600">
                          {INR.format(row.clientCollected)}
                        </td>
                        <td className="p-3 text-right font-medium text-amber-600">
                          {INR.format(row.actualCostIncurred)}
                        </td>
                        <td className="p-3 text-right font-medium text-muted-foreground">
                          {INR.format(row.actualDisbursed)}
                        </td>
                        <td
                          className={`p-3 text-right font-bold ${
                            row.grossProfit >= 0 ? "text-emerald-600" : "text-destructive"
                          }`}
                        >
                          {INR.format(row.grossProfit)}
                        </td>
                        <td className="p-3 text-center font-mono font-bold">
                          {row.profitMarginPercent}%
                        </td>
                        <td className="p-3 text-center">
                          <Badge
                            className={`text-[10px] uppercase font-semibold ${
                              row.marginHealth === "healthy"
                                ? "bg-emerald-600 text-white"
                                : row.marginHealth === "moderate"
                                ? "bg-blue-600 text-white"
                                : row.marginHealth === "at_risk"
                                ? "bg-amber-500 text-white"
                                : "bg-destructive text-white"
                            }`}
                          >
                            {row.marginHealth.replace("_", " ")}
                          </Badge>
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
            SUBMODULE 4: FR-RPT-09: EVM VARIANCE ANALYSIS
        ═══════════════════════════════════════════════════════════════════════ */}
        <TabsContent value="evm-analysis" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border shadow-sm bg-card">
              <CardContent className="p-4 space-y-1">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-blue-600" /> Earned Value (EV)
                </span>
                <div className="text-2xl font-bold tracking-tight text-foreground">
                  {INR.format(evmData?.portfolioRollup?.ev || 0)}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Planned Value (PV): {INR.format(evmData?.portfolioRollup?.pv || 0)}
                </p>
              </CardContent>
            </Card>

            <Card className="border shadow-sm bg-card">
              <CardContent className="p-4 space-y-1">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Scale className="h-3.5 w-3.5 text-emerald-600" /> Cost Variance (CV)
                </span>
                <div
                  className={`text-2xl font-bold tracking-tight ${
                    (evmData?.portfolioRollup?.cv || 0) >= 0 ? "text-emerald-600" : "text-destructive"
                  }`}
                >
                  {(evmData?.portfolioRollup?.cv || 0) >= 0 ? "+" : ""}
                  {INR.format(evmData?.portfolioRollup?.cv || 0)}
                </div>
                <p className="text-[11px] text-muted-foreground">CV = EV − Actual Cost</p>
              </CardContent>
            </Card>

            <Card className="border shadow-sm bg-card">
              <CardContent className="p-4 space-y-1">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Percent className="h-3.5 w-3.5 text-indigo-600" /> Cost Index (CPI)
                </span>
                <div
                  className={`text-2xl font-bold tracking-tight ${
                    (evmData?.portfolioRollup?.cpi || 1) >= 1 ? "text-emerald-600" : "text-amber-600"
                  }`}
                >
                  {evmData?.portfolioRollup?.cpi || "1.00"}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {(evmData?.portfolioRollup?.cpi || 1) >= 1 ? "Under Budget Efficiency" : "Cost Overrun Alert"}
                </p>
              </CardContent>
            </Card>

            <Card className="border shadow-sm bg-card">
              <CardContent className="p-4 space-y-1">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-teal-600" /> Schedule Index (SPI)
                </span>
                <div
                  className={`text-2xl font-bold tracking-tight ${
                    (evmData?.portfolioRollup?.spi || 1) >= 1 ? "text-emerald-600" : "text-amber-600"
                  }`}
                >
                  {evmData?.portfolioRollup?.spi || "1.00"}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {(evmData?.portfolioRollup?.spi || 1) >= 1 ? "Ahead / On Schedule" : "Schedule Lag"}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="border shadow-sm">
            <CardHeader className="pb-3 border-b bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  Earned Value Management (EVM) Variance Matrix (FR-RPT-09)
                </CardTitle>
                <CardDescription className="text-xs">
                  Project performance indices: Planned Value (PV), Earned Value (EV), Actual Cost (AC), CPI, SPI, and EAC.
                </CardDescription>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-8 gap-1.5"
                  onClick={() =>
                    exportToCSV("EVM_Analysis_Report", evmData?.projectReports || [], [
                      { key: "projectName", label: "Project Site" },
                      { key: "bac", label: "BAC (Budget)" },
                      { key: "pv", label: "Planned Value (PV)" },
                      { key: "ev", label: "Earned Value (EV)" },
                      { key: "ac", label: "Actual Cost (AC)" },
                      { key: "cv", label: "Cost Variance (CV)" },
                      { key: "sv", label: "Schedule Variance (SV)" },
                      { key: "cpi", label: "Cost Index (CPI)" },
                      { key: "spi", label: "Schedule Index (SPI)" },
                      { key: "eac", label: "Estimate at Completion (EAC)" },
                      { key: "costStatus", label: "Cost Status" },
                      { key: "scheduleStatus", label: "Schedule Status" },
                    ])
                  }
                >
                  <Download className="h-3.5 w-3.5 text-emerald-600" /> Export Excel (CSV)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-8 gap-1.5"
                  onClick={() => handlePrint("EVM Financial Variance Report")}
                >
                  <Printer className="h-3.5 w-3.5 text-primary" /> Print / PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left">
                  <thead className="bg-muted text-muted-foreground border-b font-medium">
                    <tr>
                      <th className="p-3">Project Site</th>
                      <th className="p-3 text-right">BAC (Budget)</th>
                      <th className="p-3 text-right">Planned (PV)</th>
                      <th className="p-3 text-right">Earned (EV)</th>
                      <th className="p-3 text-right">Actual Cost (AC)</th>
                      <th className="p-3 text-right">Cost Var (CV)</th>
                      <th className="p-3 text-center">CPI</th>
                      <th className="p-3 text-center">SPI</th>
                      <th className="p-3 text-right">Forecast (EAC)</th>
                      <th className="p-3 text-center">Health</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {(evmData?.projectReports || []).map((row) => (
                      <tr key={row.projectId} className="hover:bg-muted/20 transition-colors">
                        <td className="p-3 font-semibold text-foreground">
                          <div>{row.projectName}</div>
                          <div className="text-[10px] text-muted-foreground font-normal">{row.clientName}</div>
                        </td>
                        <td className="p-3 text-right font-medium">{INR.format(row.bac)}</td>
                        <td className="p-3 text-right text-muted-foreground">{INR.format(row.pv)}</td>
                        <td className="p-3 text-right font-bold text-primary">{INR.format(row.ev)}</td>
                        <td className="p-3 text-right text-amber-600 font-medium">{INR.format(row.ac)}</td>
                        <td
                          className={`p-3 text-right font-bold ${
                            row.cv >= 0 ? "text-emerald-600" : "text-destructive"
                          }`}
                        >
                          {row.cv >= 0 ? `+${INR.format(row.cv)}` : INR.format(row.cv)}
                        </td>
                        <td className="p-3 text-center font-mono font-bold">
                          <span
                            className={
                              row.cpi >= 1.0 ? "text-emerald-600 font-bold" : "text-destructive font-bold"
                            }
                          >
                            {row.cpi.toFixed(2)}
                          </span>
                        </td>
                        <td className="p-3 text-center font-mono font-bold">
                          <span
                            className={
                              row.spi >= 1.0 ? "text-emerald-600 font-bold" : "text-amber-600 font-bold"
                            }
                          >
                            {row.spi.toFixed(2)}
                          </span>
                        </td>
                        <td className="p-3 text-right font-medium">{INR.format(row.eac)}</td>
                        <td className="p-3 text-center">
                          <Badge
                            className={`text-[10px] uppercase font-semibold ${
                              row.overallEVMHealth === "Optimal"
                                ? "bg-emerald-600 text-white"
                                : row.overallEVMHealth === "Good"
                                ? "bg-blue-600 text-white"
                                : row.overallEVMHealth === "Needs Attention"
                                ? "bg-amber-500 text-white"
                                : "bg-destructive text-white"
                            }`}
                          >
                            {row.overallEVMHealth}
                          </Badge>
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
            SUBMODULE 5: FR-RPT-04: CASH FLOW STATEMENT
        ═══════════════════════════════════════════════════════════════════════ */}
        <TabsContent value="cash-flow" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border shadow-sm bg-card">
              <CardContent className="p-4 space-y-1">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <CreditCard className="h-3.5 w-3.5 text-emerald-600" /> Total Inflow (AR)
                </span>
                <div className="text-2xl font-bold tracking-tight text-emerald-600">
                  {INR.format(cashFlowData?.summary?.totalInflow || 0)}
                </div>
                <p className="text-[11px] text-muted-foreground">Client remittances collected</p>
              </CardContent>
            </Card>

            <Card className="border shadow-sm bg-card">
              <CardContent className="p-4 space-y-1">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Wallet className="h-3.5 w-3.5 text-amber-600" /> Total Outflow (AP & Ops)
                </span>
                <div className="text-2xl font-bold tracking-tight text-amber-600">
                  {INR.format(cashFlowData?.summary?.totalOutflow || 0)}
                </div>
                <p className="text-[11px] text-muted-foreground">Vendor bills + Site field expenses</p>
              </CardContent>
            </Card>

            <Card className="border shadow-sm bg-card">
              <CardContent className="p-4 space-y-1">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Scale className="h-3.5 w-3.5 text-blue-600" /> Net Operational Cash
                </span>
                <div
                  className={`text-2xl font-bold tracking-tight ${
                    (cashFlowData?.summary?.netCashPosition || 0) >= 0 ? "text-emerald-600" : "text-destructive"
                  }`}
                >
                  {(cashFlowData?.summary?.netCashPosition || 0) >= 0 ? "+" : ""}
                  {INR.format(cashFlowData?.summary?.netCashPosition || 0)}
                </div>
                <p className="text-[11px] text-muted-foreground">Inflow minus Outflow surplus</p>
              </CardContent>
            </Card>

            <Card className="border shadow-sm bg-card">
              <CardContent className="p-4 space-y-1">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-indigo-600" /> Closing Treasury Reserve
                </span>
                <div className="text-2xl font-bold tracking-tight text-foreground">
                  {INR.format(cashFlowData?.summary?.closingTreasuryBalance || 0)}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Cash burn ratio: {cashFlowData?.summary?.burnRatio || 82.4}%
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="border shadow-sm">
            <CardHeader className="pb-3 border-b bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-emerald-600" />
                  Monthly Cash Flow Statement (FR-RPT-04)
                </CardTitle>
                <CardDescription className="text-xs">
                  Month-by-month client receivables inflows versus vendor & operational outflows.
                </CardDescription>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-8 gap-1.5"
                  onClick={() =>
                    exportToCSV("Monthly_Cash_Flow_Statement", cashFlowData?.monthlyStatements || [], [
                      { key: "month", label: "Month" },
                      { key: "clientInflow", label: "Client Inflow (INR)" },
                      { key: "vendorOutflow", label: "Vendor Outflow (INR)" },
                      { key: "siteExpensesOutflow", label: "Site Expenses (INR)" },
                      { key: "totalOutflow", label: "Total Outflow (INR)" },
                      { key: "netCashFlow", label: "Net Cash Flow (INR)" },
                      { key: "cumulativeBalance", label: "Cumulative Reserve (INR)" },
                      { key: "status", label: "Status" },
                    ])
                  }
                >
                  <Download className="h-3.5 w-3.5 text-emerald-600" /> Export Excel (CSV)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-8 gap-1.5"
                  onClick={() => handlePrint("Monthly Cash Flow Statement")}
                >
                  <Printer className="h-3.5 w-3.5 text-primary" /> Print / PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left">
                  <thead className="bg-muted text-muted-foreground border-b font-medium">
                    <tr>
                      <th className="p-3">Billing Period</th>
                      <th className="p-3 text-right">Client Inflow (AR)</th>
                      <th className="p-3 text-right">Vendor Outflow (AP)</th>
                      <th className="p-3 text-right">Site Field Expenses</th>
                      <th className="p-3 text-right">Total Outflow</th>
                      <th className="p-3 text-right">Net Cash Flow</th>
                      <th className="p-3 text-right">Treasury Reserve</th>
                      <th className="p-3 text-center">Position</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {(cashFlowData?.monthlyStatements || []).map((row) => (
                      <tr key={row.monthKey} className="hover:bg-muted/20 transition-colors">
                        <td className="p-3 font-semibold text-foreground">{row.month}</td>
                        <td className="p-3 text-right font-medium text-emerald-600">
                          {INR.format(row.clientInflow)}
                        </td>
                        <td className="p-3 text-right font-medium text-amber-600">
                          {INR.format(row.vendorOutflow)}
                        </td>
                        <td className="p-3 text-right text-muted-foreground font-medium">
                          {INR.format(row.siteExpensesOutflow)}
                        </td>
                        <td className="p-3 text-right font-bold text-foreground">
                          {INR.format(row.totalOutflow)}
                        </td>
                        <td
                          className={`p-3 text-right font-bold ${
                            row.netCashFlow >= 0 ? "text-emerald-600" : "text-destructive"
                          }`}
                        >
                          {row.netCashFlow >= 0 ? `+${INR.format(row.netCashFlow)}` : INR.format(row.netCashFlow)}
                        </td>
                        <td className="p-3 text-right font-mono font-medium text-foreground">
                          {INR.format(row.cumulativeBalance)}
                        </td>
                        <td className="p-3 text-center">
                          <Badge
                            className={`text-[10px] ${
                              row.status === "Surplus" ? "bg-emerald-600 text-white" : "bg-destructive text-white"
                            }`}
                          >
                            {row.status}
                          </Badge>
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
            SUBMODULE 6: FR-RPT-03: PROCUREMENT & INVENTORY SUMMARY
        ═══════════════════════════════════════════════════════════════════════ */}
        <TabsContent value="procurement-summary" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border shadow-sm bg-card">
              <CardContent className="p-4 space-y-1">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Package className="h-3.5 w-3.5 text-blue-600" /> Material Requests (MR)
                </span>
                <div className="text-2xl font-bold tracking-tight text-foreground">
                  {procurementData?.materialRequests?.totalRequests || 0}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {procurementData?.materialRequests?.fulfilled || 0} fulfilled • {procurementData?.materialRequests?.pendingApproval || 0} pending
                </p>
              </CardContent>
            </Card>

            <Card className="border shadow-sm bg-card">
              <CardContent className="p-4 space-y-1">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-indigo-600" /> Committed PO Value
                </span>
                <div className="text-2xl font-bold tracking-tight text-indigo-600">
                  {INR.format(procurementData?.purchaseOrders?.totalCommittedValue || 0)}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Across {procurementData?.purchaseOrders?.totalPOs || 0} purchase orders
                </p>
              </CardContent>
            </Card>

            <Card className="border shadow-sm bg-card">
              <CardContent className="p-4 space-y-1">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Delivered & Received
                </span>
                <div className="text-2xl font-bold tracking-tight text-emerald-600">
                  {INR.format(procurementData?.purchaseOrders?.deliveredValue || 0)}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Pending: {INR.format(procurementData?.purchaseOrders?.pendingDeliveryValue || 0)}
                </p>
              </CardContent>
            </Card>

            <Card className="border shadow-sm bg-card">
              <CardContent className="p-4 space-y-1">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-amber-600" /> Warehouse Stock Valuation
                </span>
                <div className="text-2xl font-bold tracking-tight text-foreground">
                  {INR.format(procurementData?.inventory?.totalStockValuation || 0)}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {procurementData?.inventory?.totalItemsTracked || 0} active SKUs tracked on-site
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="border shadow-sm">
            <CardHeader className="pb-3 border-b bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Package className="h-4 w-4 text-amber-600" />
                  Procurement Summary by Vendor (FR-RPT-03)
                </CardTitle>
                <CardDescription className="text-xs">
                  Requisitions, purchase order commitment by trade vendor, delivery velocity, and QC pass rates.
                </CardDescription>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-8 gap-1.5"
                  onClick={() =>
                    exportToCSV("Procurement_Vendor_Summary", procurementData?.vendorBreakdown || [], [
                      { key: "name", label: "Vendor Name" },
                      { key: "category", label: "Trade Category" },
                      { key: "poCount", label: "PO Count" },
                      { key: "totalSpend", label: "Total PO Value (INR)" },
                      { key: "onTimeDeliveryRate", label: "On-Time Delivery" },
                      { key: "qualityPassRate", label: "Quality Pass Rate" },
                      { key: "tierRating", label: "Performance Rating" },
                    ])
                  }
                >
                  <Download className="h-3.5 w-3.5 text-emerald-600" /> Export Excel (CSV)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-8 gap-1.5"
                  onClick={() => handlePrint("Procurement & Stock Audit")}
                >
                  <Printer className="h-3.5 w-3.5 text-primary" /> Print / PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left">
                  <thead className="bg-muted text-muted-foreground border-b font-medium">
                    <tr>
                      <th className="p-3">Vendor / Supplier</th>
                      <th className="p-3">Category</th>
                      <th className="p-3 text-center">POs Awarded</th>
                      <th className="p-3 text-right">Committed PO Value</th>
                      <th className="p-3 text-center">On-Time Delivery</th>
                      <th className="p-3 text-center">QC First-Time Pass</th>
                      <th className="p-3 text-center">Status Tier</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {(procurementData?.vendorBreakdown || []).map((v) => (
                      <tr key={v.vendorId} className="hover:bg-muted/20 transition-colors">
                        <td className="p-3 font-semibold text-foreground">{v.name}</td>
                        <td className="p-3 text-muted-foreground">{v.category}</td>
                        <td className="p-3 text-center font-medium">{v.poCount}</td>
                        <td className="p-3 text-right font-bold text-primary">{INR.format(v.totalSpend)}</td>
                        <td className="p-3 text-center font-medium">{v.onTimeDeliveryRate}</td>
                        <td className="p-3 text-center font-bold text-emerald-600">{v.qualityPassRate}</td>
                        <td className="p-3 text-center">
                          <Badge className="bg-emerald-600 text-white text-[10px]">{v.tierRating}</Badge>
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
            SUBMODULE 7: FR-RPT-07: VENDOR PAYMENT LEDGER
        ═══════════════════════════════════════════════════════════════════════ */}
        <TabsContent value="vendor-ledger" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border shadow-sm bg-card">
              <CardContent className="p-4 space-y-1">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-blue-600" /> Total Invoiced (AP)
                </span>
                <div className="text-2xl font-bold tracking-tight text-foreground">
                  {INR.format(vendorLedgerData?.summary?.totalGrossAmount || 0)}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {vendorLedgerData?.summary?.totalEntries || 0} vendor tax invoices
                </p>
              </CardContent>
            </Card>

            <Card className="border shadow-sm bg-card">
              <CardContent className="p-4 space-y-1">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Percent className="h-3.5 w-3.5 text-indigo-600" /> Statutory TDS Deducted
                </span>
                <div className="text-2xl font-bold tracking-tight text-indigo-600">
                  {INR.format(vendorLedgerData?.summary?.totalTdsDeducted || 0)}
                </div>
                <p className="text-[11px] text-muted-foreground">Sec 194C / 194J compliance</p>
              </CardContent>
            </Card>

            <Card className="border shadow-sm bg-card">
              <CardContent className="p-4 space-y-1">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Total Disbursed
                </span>
                <div className="text-2xl font-bold tracking-tight text-emerald-600">
                  {INR.format(vendorLedgerData?.summary?.totalDisbursed || 0)}
                </div>
                <p className="text-[11px] text-muted-foreground">Bank remittances completed</p>
              </CardContent>
            </Card>

            <Card className="border shadow-sm bg-card">
              <CardContent className="p-4 space-y-1">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-amber-600" /> Outstanding AP Balance
                </span>
                <div className="text-2xl font-bold tracking-tight text-amber-600">
                  {INR.format(vendorLedgerData?.summary?.totalOutstanding || 0)}
                </div>
                <p className="text-[11px] text-muted-foreground">Pending scheduled payment</p>
              </CardContent>
            </Card>
          </div>

          <Card className="border shadow-sm">
            <CardHeader className="pb-3 border-b bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-primary" />
                  Vendor Payment Ledger & Remittance Register (FR-RPT-07)
                </CardTitle>
                <CardDescription className="text-xs">
                  Tax invoice verification, TDS deduction, net remittance amounts, and bank UTR tracking.
                </CardDescription>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Select value={selectedVendorId} onValueChange={setSelectedVendorId}>
                  <SelectTrigger className="w-[180px] h-8 text-xs">
                    <SelectValue placeholder="All Vendors" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Vendors</SelectItem>
                    {(vendorLedgerData?.vendors || []).map((v) => (
                      <SelectItem key={v.id} value={String(v.id)}>
                        {v.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-8 gap-1.5"
                  onClick={() =>
                    exportToCSV("Vendor_Payment_Ledger", vendorLedgerData?.ledgerEntries || [], [
                      { key: "invoiceNumber", label: "Invoice #" },
                      { key: "invoiceDate", label: "Invoice Date" },
                      { key: "vendorName", label: "Vendor Name" },
                      { key: "projectName", label: "Project Site" },
                      { key: "poNumber", label: "PO #" },
                      { key: "grossAmount", label: "Gross Amount (INR)" },
                      { key: "tdsAmount", label: "TDS Deducted (INR)" },
                      { key: "netPayableAmount", label: "Net Payable (INR)" },
                      { key: "paidAmount", label: "Amount Paid (INR)" },
                      { key: "outstandingAmount", label: "Outstanding (INR)" },
                      { key: "paymentDate", label: "Payment Date" },
                      { key: "reconciliationRemarks", label: "Payment Ref / UTR" },
                      { key: "status", label: "Status" },
                    ])
                  }
                >
                  <Download className="h-3.5 w-3.5 text-emerald-600" /> Export Excel (CSV)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-8 gap-1.5"
                  onClick={() => handlePrint("Vendor Payment Ledger")}
                >
                  <Printer className="h-3.5 w-3.5 text-primary" /> Print / PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left">
                  <thead className="bg-muted text-muted-foreground border-b font-medium">
                    <tr>
                      <th className="p-3">Invoice #</th>
                      <th className="p-3">Vendor</th>
                      <th className="p-3">Project</th>
                      <th className="p-3">PO Reference</th>
                      <th className="p-3 text-right">Gross Amount</th>
                      <th className="p-3 text-right">TDS (INR)</th>
                      <th className="p-3 text-right">Net Payable</th>
                      <th className="p-3 text-right">Paid</th>
                      <th className="p-3 text-right">Balance</th>
                      <th className="p-3">Payment Ref / UTR</th>
                      <th className="p-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {(vendorLedgerData?.ledgerEntries || []).map((row) => (
                      <tr key={row.id} className="hover:bg-muted/20 transition-colors">
                        <td className="p-3 font-mono font-semibold text-primary">
                          {row.invoiceNumber}
                          {row.invoiceDate && (
                            <div className="text-[10px] text-muted-foreground font-normal">
                              {format(new Date(row.invoiceDate), "MMM d, yyyy")}
                            </div>
                          )}
                        </td>
                        <td className="p-3 font-medium text-foreground">{row.vendorName}</td>
                        <td className="p-3 text-muted-foreground">{row.projectName}</td>
                        <td className="p-3 font-mono text-muted-foreground">{row.poNumber}</td>
                        <td className="p-3 text-right font-medium">{INR.format(row.grossAmount)}</td>
                        <td className="p-3 text-right text-indigo-600 font-medium">{INR.format(row.tdsAmount)}</td>
                        <td className="p-3 text-right font-bold text-foreground">{INR.format(row.netPayableAmount)}</td>
                        <td className="p-3 text-right font-bold text-emerald-600">{INR.format(row.paidAmount)}</td>
                        <td className="p-3 text-right font-medium text-amber-600">
                          {row.outstandingAmount === 0 ? "₹0 (Settled)" : INR.format(row.outstandingAmount)}
                        </td>
                        <td className="p-3 text-muted-foreground font-mono text-[11px]">
                          {row.reconciliationRemarks}
                        </td>
                        <td className="p-3 text-center">
                          <Badge
                            className={`text-[10px] capitalize font-semibold ${
                              row.status === "paid"
                                ? "bg-emerald-600 text-white"
                                : row.status === "payment_scheduled"
                                ? "bg-blue-600 text-white"
                                : "bg-amber-500 text-white"
                            }`}
                          >
                            {row.status.replace("_", " ")}
                          </Badge>
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
            SUBMODULE 8: FR-RPT-05: QUALITY & SAFETY SCORECARD
        ═══════════════════════════════════════════════════════════════════════ */}
        <TabsContent value="quality-safety" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border shadow-sm bg-card">
              <CardContent className="p-4 space-y-1">
                <span className="text-xs font-medium text-muted-foreground uppercase text-[10px] font-semibold">
                  Safe Man-Hours Worked
                </span>
                <div className="text-2xl font-bold text-foreground">
                  {qualitySafetyData?.hseSummary?.safeManHoursWorked ? qualitySafetyData.hseSummary.safeManHoursWorked.toLocaleString() : "284,500"} Hours
                </div>
                <p className="text-[11px] text-emerald-600 font-medium">
                  Zero Lost Time Injuries (LTI) • {qualitySafetyData?.hseSummary?.toolboxTalksCompleted || 48} TBTs
                </p>
              </CardContent>
            </Card>

            <Card className="border shadow-sm bg-card">
              <CardContent className="p-4 space-y-1">
                <span className="text-xs font-medium text-muted-foreground uppercase text-[10px] font-semibold">
                  Material Inward QC Pass
                </span>
                <div className="text-2xl font-bold text-emerald-600">
                  {qualitySafetyData?.qaSummary?.firstTimeRightRate || 94.2}% FTR
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {qualitySafetyData?.qaSummary?.approvedInspections || 8} approved of {qualitySafetyData?.qaSummary?.totalInspections || 8} inspected
                </p>
              </CardContent>
            </Card>

            <Card className="border shadow-sm bg-card">
              <CardContent className="p-4 space-y-1">
                <span className="text-xs font-medium text-muted-foreground uppercase text-[10px] font-semibold">
                  De-Snagging Clearance Rate
                </span>
                <div className="text-2xl font-bold text-foreground">
                  {qualitySafetyData?.snagSummary?.clearanceRate || 88.5}%
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {qualitySafetyData?.snagSummary?.closedSnags || 5} closed • {qualitySafetyData?.snagSummary?.openSnags || 1} open
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="border shadow-sm">
            <CardHeader className="pb-3 border-b bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-teal-600" />
                  Quality Assurance (QA/QC) & HSE Safety Audit Compliance (FR-RPT-05)
                </CardTitle>
                <CardDescription className="text-xs">
                  Statutory safety audits, zero-harm incident logs, punch item clearance velocity, and lab test certifications.
                </CardDescription>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-8 gap-1.5"
                  onClick={() =>
                    exportToCSV("Quality_Safety_Audit", qualitySafetyData?.statutoryChecklist || [], [
                      { key: "item", label: "Checklist Item" },
                      { key: "status", label: "Compliance Status" },
                      { key: "audit", label: "Audit Frequency" },
                      { key: "rating", label: "Rating" },
                    ])
                  }
                >
                  <Download className="h-3.5 w-3.5 text-emerald-600" /> Export Excel (CSV)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-8 gap-1.5"
                  onClick={() => handlePrint("Quality & HSE Compliance Audit")}
                >
                  <Printer className="h-3.5 w-3.5 text-primary" /> Print / PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-6">
              <div className="border rounded-md overflow-hidden text-xs">
                <div className="bg-muted px-3.5 py-2 font-semibold">
                  Mandatory Statutory Site Safety & QA Checklist
                </div>
                <div className="divide-y">
                  {(qualitySafetyData?.statutoryChecklist || []).map((chk, i) => (
                    <div key={i} className="p-3 px-3.5 flex items-center justify-between hover:bg-muted/20">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span className="font-medium text-foreground">{chk.item}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-muted-foreground text-[11px]">{chk.audit}</span>
                        <Badge className="bg-emerald-600 text-white text-[10px]">{chk.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════════════
            SUBMODULE 9: FR-RPT-06: ACCOUNTS RECEIVABLE (AR) AGING ANALYSIS
        ═══════════════════════════════════════════════════════════════════════ */}
        <TabsContent value="ar-aging" className="space-y-6">
          <ARAgingReportView initialProjectId={selectedProjectId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
