import React, { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  DollarSign, TrendingUp, AlertTriangle, CheckCircle2,
  Printer, Download, Plus, Filter, Search, Edit3, Trash2,
  Layers, ArrowUpRight, ArrowDownRight, RefreshCw, FileText,
  Building2, CheckCheck, Clock, ShieldAlert, X
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const INR = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0
});

const BUDGET_CATEGORIES = [
  "Civil & Structural",
  "Finishes & Materials",
  "Electrical & MEP",
  "HVAC & Mechanical",
  "Plumbing & Firefighting",
  "Labor & Manpower",
  "Plant & Machinery",
  "Trade Subcontracts",
  "Preliminaries & Overheads",
  "General & Miscellaneous",
] as const;

export interface BudgetVarianceReportProps {
  projectId: number;
  project?: any;
  canManageBudget?: boolean;
  isEmbeddedInReports?: boolean;
}

export function ProjectBudgetTab({
  projectId,
  project: initialProject,
  canManageBudget = true,
  isEmbeddedInReports = false,
}: BudgetVarianceReportProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [healthFilter, setHealthFilter] = useState("all");

  // Modals
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<any | null>(null);
  const [printModalOpen, setPrintModalOpen] = useState(false);

  // Form State
  const [formCostCode, setFormCostCode] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formCategory, setFormCategory] = useState<string>("Civil & Structural");
  const [formBudgeted, setFormBudgeted] = useState("");
  const [formCommitted, setFormCommitted] = useState("0");
  const [formActual, setFormActual] = useState("0");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch live Project Budget Variance Report
  const { data: reportData, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["/api/projects", projectId, "budget-variance"],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/budget-variance`);
      if (!res.ok) throw new Error("Failed to load budget variance report");
      return res.json();
    },
    enabled: !!projectId && projectId > 0,
  });

  const summary = reportData?.summary || {
    totalBudgeted: 0,
    totalCommitted: 0,
    totalActual: 0,
    netVariance: 0,
    remainingUncommitted: 0,
    overallBurnRate: 0,
    overallCommitmentRate: 0,
    overallHealth: "healthy",
    totalItems: 0,
    overBudgetItemCount: 0,
    atRiskItemCount: 0,
    healthyItemCount: 0,
    generatedAt: new Date().toISOString(),
  };

  const projectName = reportData?.projectName || initialProject?.name || `Project #${projectId}`;
  const clientName = reportData?.clientName || initialProject?.clientName || "Corporate Client";
  const baselineBudget = reportData?.baselineBudget || Number(initialProject?.budget || 0) || summary.totalBudgeted;
  const items: any[] = reportData?.items || [];
  const categoryBreakdown: any[] = reportData?.categoryBreakdown || [];

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (selectedCategory !== "all" && item.category !== selectedCategory) return false;
      if (healthFilter !== "all" && item.health !== healthFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesCode = item.costCode?.toLowerCase().includes(q);
        const matchesDesc = item.description?.toLowerCase().includes(q);
        const matchesCat = item.category?.toLowerCase().includes(q);
        if (!matchesCode && !matchesDesc && !matchesCat) return false;
      }
      return true;
    });
  }, [items, selectedCategory, healthFilter, searchQuery]);

  // Open Add Dialog
  const handleOpenAdd = () => {
    setFormCostCode("");
    setFormDescription("");
    setFormCategory("Civil & Structural");
    setFormBudgeted("");
    setFormCommitted("0");
    setFormActual("0");
    setAddDialogOpen(true);
  };

  // Open Edit Dialog
  const handleOpenEdit = (item: any) => {
    setEditItem(item);
    setFormCostCode(item.costCode);
    setFormDescription(item.description);
    setFormCategory(item.category || "Civil & Structural");
    setFormBudgeted(String(item.budgeted));
    setFormCommitted(String(item.committed));
    setFormActual(String(item.actual));
  };

  // Create Budget Item
  const handleCreate = async () => {
    if (!formCostCode.trim() || !formDescription.trim() || !formBudgeted) {
      toast({ title: "Validation Error", description: "Please complete cost code, description, and budgeted amount.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/budget-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          costCode: formCostCode.trim().toUpperCase(),
          description: formDescription.trim(),
          category: formCategory,
          budgeted: Number(formBudgeted) || 0,
          committed: Number(formCommitted) || 0,
          actual: Number(formActual) || 0,
        }),
      });
      if (!res.ok) throw new Error("Failed to create budget item");
      toast({ title: "Cost Code Added", description: `Cost code ${formCostCode} has been recorded in project budget.` });
      setAddDialogOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "budget-variance"] });
      await queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/budget`] });
      await queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}`] });
      await queryClient.invalidateQueries({ queryKey: ["/api/reports/budget-variance"] });
    } catch (err: any) {
      toast({ title: "Failed to add budget line", description: err.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update Budget Item
  const handleUpdate = async () => {
    if (!editItem) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/budget-items/${editItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          costCode: formCostCode.trim().toUpperCase(),
          description: formDescription.trim(),
          category: formCategory,
          budgeted: Number(formBudgeted) || 0,
          committed: Number(formCommitted) || 0,
          actual: Number(formActual) || 0,
        }),
      });
      if (!res.ok) throw new Error("Failed to update budget line");
      toast({ title: "Budget Item Updated", description: `Updated ${formCostCode} successfully.` });
      setEditItem(null);
      await queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "budget-variance"] });
      await queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/budget`] });
      await queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}`] });
      await queryClient.invalidateQueries({ queryKey: ["/api/reports/budget-variance"] });
    } catch (err: any) {
      toast({ title: "Update failed", description: err.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Budget Item
  const handleDelete = async (id: number, code: string) => {
    if (!confirm(`Are you sure you want to delete budget item ${code}?`)) return;
    try {
      const res = await fetch(`/api/budget-items/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete budget item");
      toast({ title: "Item Removed", description: `Budget item ${code} removed.` });
      await queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "budget-variance"] });
      await queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/budget`] });
      await queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}`] });
      await queryClient.invalidateQueries({ queryKey: ["/api/reports/budget-variance"] });
    } catch (err: any) {
      toast({ title: "Delete failed", description: err.message, variant: "destructive" });
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      "Cost Code",
      "Category",
      "Description",
      "Budgeted Amount (INR)",
      "Committed Amount (INR)",
      "Actual Spent (INR)",
      "Cost Variance Balance (INR)",
      "Uncommitted Balance (INR)",
      "Spend Utilization %",
      "Cost Health",
    ];

    const rows = items.map((i) => [
      `"${i.costCode}"`,
      `"${i.category}"`,
      `"${i.description.replace(/"/g, '""')}"`,
      i.budgeted,
      i.committed,
      i.actual,
      i.costVariance,
      i.committedVariance,
      `${i.burnRatePercent}%`,
      i.health.toUpperCase(),
    ]);

    // Summary totals row
    rows.push([
      `"TOTALS"`,
      `"-"`,
      `"Project Baseline Budget: ${baselineBudget}"`,
      summary.totalBudgeted,
      summary.totalCommitted,
      summary.totalActual,
      summary.netVariance,
      summary.remainingUncommitted,
      `${summary.overallBurnRate}%`,
      summary.overallHealth.toUpperCase(),
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Project_${projectId}_Budget_Variance_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "CSV Export Ready", description: "Downloaded project budget variance schedule." });
  };

  // Trigger Native Print with Styled Container
  const handlePrint = () => {
    setPrintModalOpen(true);
  };

  if (isLoading && !reportData) {
    return (
      <div className="flex items-center justify-center p-12 text-muted-foreground gap-2">
        <RefreshCw className="h-5 w-5 animate-spin text-primary" />
        <span>Loading Project Budget Variance Report...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Top Header / Action Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-xs px-2.5 py-0.5">
              <DollarSign className="h-3 w-3 mr-1 text-emerald-600" /> FR-BUD-03 Financial Control
            </Badge>
            <span className="text-xs text-muted-foreground">• Project Variance Audit</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight mt-1">
            Budget Variance & Cost Code Tracking
          </h2>
          <p className="text-xs text-muted-foreground">
            Tender baseline reconciliation comparing authorized packages, trade purchase commitments, and certified actual disbursements.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="text-xs h-8 gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="text-xs h-8 gap-1.5 hover:bg-muted"
          >
            <Download className="h-3.5 w-3.5 text-blue-600" />
            Export CSV
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="text-xs h-8 gap-1.5 hover:bg-muted"
          >
            <Printer className="h-3.5 w-3.5 text-indigo-600" />
            Executive Print / PDF
          </Button>

          {canManageBudget && (
            <Button
              size="sm"
              onClick={handleOpenAdd}
              className="text-xs h-8 gap-1.5 bg-primary text-primary-foreground shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Cost Code
            </Button>
          )}
        </div>
      </div>

      {/* ── Overrun / Risk Alert Banner ── */}
      {summary.overBudgetItemCount > 0 && (
        <div className="p-3.5 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive flex items-start gap-3 text-xs">
          <ShieldAlert className="h-5 w-5 shrink-0 text-destructive mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-sm">
              Critical Cost Overrun Detected ({summary.overBudgetItemCount} {summary.overBudgetItemCount === 1 ? "package" : "packages"} exceeding allocated budget)
            </span>
            <p className="text-muted-foreground">
              Immediate quantity surveyor reconciliation required. Actual certified expenditures have exceeded baseline tender allowances for tagged packages.
            </p>
          </div>
        </div>
      )}

      {/* ── Summary KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tender Budget */}
        <Card className="border shadow-sm bg-card hover:border-primary/40 transition-colors">
          <CardContent className="p-4 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-blue-600" /> Tender Budget Baseline
              </span>
              <Badge variant="outline" className="text-[10px] font-mono px-1.5">
                {summary.totalItems} Cost Codes
              </Badge>
            </div>
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {INR.format(summary.totalBudgeted)}
            </div>
            <div className="text-[11px] text-muted-foreground flex items-center justify-between">
              <span>Project Target:</span>
              <span className="font-semibold">{INR.format(baselineBudget)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Committed Liabilities */}
        <Card className="border shadow-sm bg-card hover:border-indigo-500/40 transition-colors">
          <CardContent className="p-4 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-indigo-600" /> Committed POs & Contracts
              </span>
              <span className="text-[11px] font-semibold text-indigo-600">
                {summary.overallCommitmentRate}% of Budget
              </span>
            </div>
            <div className="text-2xl font-bold tracking-tight text-indigo-600">
              {INR.format(summary.totalCommitted)}
            </div>
            <div className="text-[11px] text-muted-foreground flex items-center justify-between">
              <span>Remaining Uncommitted:</span>
              <span className="font-semibold text-foreground">{INR.format(summary.remainingUncommitted)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Actual Spend */}
        <Card className="border shadow-sm bg-card hover:border-emerald-500/40 transition-colors">
          <CardContent className="p-4 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-600" /> Actual Certified Spend
              </span>
              <span className="text-[11px] font-semibold text-emerald-600">
                {summary.overallBurnRate}% Burn Rate
              </span>
            </div>
            <div className="text-2xl font-bold tracking-tight text-emerald-600">
              {INR.format(summary.totalActual)}
            </div>
            <div className="text-[11px] text-muted-foreground flex items-center justify-between">
              <span>Disbursed & Invoiced:</span>
              <span className="font-semibold">{INR.format(summary.totalActual)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Net Cost Variance */}
        <Card className={`border shadow-sm bg-card transition-colors ${summary.netVariance < 0 ? "border-destructive/40 bg-destructive/5" : "hover:border-emerald-500/40"}`}>
          <CardContent className="p-4 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5 text-emerald-600" /> Net Cost Variance
              </span>
              <Badge
                className={`text-[10px] px-1.5 uppercase ${
                  summary.overallHealth === "overrun"
                    ? "bg-destructive text-white"
                    : summary.overallHealth === "warning"
                    ? "bg-amber-500 text-white"
                    : "bg-emerald-600 text-white"
                }`}
              >
                {summary.overallHealth}
              </Badge>
            </div>
            <div className={`text-2xl font-bold tracking-tight ${summary.netVariance < 0 ? "text-destructive" : "text-emerald-600"}`}>
              {summary.netVariance >= 0 ? `+${INR.format(summary.netVariance)}` : INR.format(summary.netVariance)}
            </div>
            <div className="text-[11px] text-muted-foreground flex items-center justify-between">
              <span>Budget Health:</span>
              <span className="font-semibold">
                {summary.netVariance >= 0 ? `${Math.round(((summary.totalBudgeted - summary.totalActual) / (summary.totalBudgeted || 1)) * 100)}% buffer remaining` : "Budget Exceeded"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Interactive Dual-Tone Utilization Bar ── */}
      <Card className="border shadow-sm bg-card p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
          <div className="flex items-center gap-4">
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-primary" /> Budget Consumption Breakdown
            </span>
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 inline-block" /> Actual Spend ({summary.overallBurnRate}%)
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-full bg-indigo-500 inline-block" /> Committed Contracts ({Math.max(0, summary.overallCommitmentRate - summary.overallBurnRate)}%)
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-slate-700 inline-block" /> Remaining Buffer ({Math.max(0, 100 - summary.overallCommitmentRate)}%)
              </span>
            </div>
          </div>
          <span className="text-[11px] font-mono text-muted-foreground">
            {INR.format(summary.totalActual + summary.totalCommitted)} Total Encumbered / {INR.format(summary.totalBudgeted)}
          </span>
        </div>

        {/* Stacked Bar */}
        <div className="w-full h-3 rounded-full bg-muted overflow-hidden flex shadow-inner">
          <div
            className="bg-emerald-500 transition-all duration-500"
            style={{ width: `${Math.min(100, summary.overallBurnRate)}%` }}
            title={`Actual Spend: ${summary.overallBurnRate}%`}
          />
          <div
            className="bg-indigo-500 transition-all duration-500"
            style={{ width: `${Math.min(100 - Math.min(100, summary.overallBurnRate), Math.max(0, summary.overallCommitmentRate - summary.overallBurnRate))}%` }}
            title={`Committed: ${Math.max(0, summary.overallCommitmentRate - summary.overallBurnRate)}%`}
          />
        </div>
      </Card>

      {/* ── Category Breakdown Cards ── */}
      {categoryBreakdown.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground px-1">
            <span>Package Category Allocation Summary</span>
            <span>{categoryBreakdown.length} Trade Categories</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {categoryBreakdown.map((cat, idx) => {
              const isSelected = selectedCategory === cat.category;
              return (
                <div
                  key={idx}
                  onClick={() => setSelectedCategory(isSelected ? "all" : cat.category)}
                  className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                    isSelected
                      ? "border-primary bg-primary/10 shadow-sm"
                      : "border-border bg-card hover:border-primary/40 hover:bg-muted/30"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold truncate text-foreground" title={cat.category}>
                      {cat.category}
                    </span>
                    <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">
                      {cat.count}
                    </Badge>
                  </div>
                  <div className="text-[11px] text-muted-foreground mb-1">
                    Budget: <span className="font-semibold text-foreground">{INR.format(cat.budgeted)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1.5">
                    <span>Spend: {INR.format(cat.actual)}</span>
                    <span className={cat.variance < 0 ? "text-destructive font-bold" : "text-emerald-600 font-bold"}>
                      {cat.burnRatePercent}%
                    </span>
                  </div>
                  <Progress value={Math.min(100, cat.burnRatePercent)} className="h-1" />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Cost Code Schedule & Filters ── */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3 border-b bg-muted/20 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Itemized Cost Code Variance Schedule
            </CardTitle>
            <CardDescription className="text-xs">
              Detailed tracking of line-item budgets, commitments, actuals, and cost health status.
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative w-44 sm:w-56">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search code or desc..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-xs bg-background"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="h-8 text-xs w-36 bg-background">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {BUDGET_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Health Filter */}
            <Select value={healthFilter} onValueChange={setHealthFilter}>
              <SelectTrigger className="h-8 text-xs w-32 bg-background">
                <SelectValue placeholder="Health" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="healthy">Healthy</SelectItem>
                <SelectItem value="warning">At Risk / Near Limit</SelectItem>
                <SelectItem value="overrun">Over Budget</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead className="bg-muted text-muted-foreground border-b font-medium">
                <tr>
                  <th className="p-3">Cost Code</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Package Description</th>
                  <th className="p-3 text-right">Allocated Budget</th>
                  <th className="p-3 text-right">Committed PO/Contract</th>
                  <th className="p-3 text-right">Actual Incurred</th>
                  <th className="p-3 text-right">Cost Variance</th>
                  <th className="p-3 text-right">Uncommitted</th>
                  <th className="p-3 text-center">Health</th>
                  {canManageBudget && <th className="p-3 text-center">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredItems.map((item) => {
                  const isOverrun = item.costVariance < 0;
                  return (
                    <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                      <td className="p-3 font-mono font-bold text-primary whitespace-nowrap">
                        {item.costCode}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <Badge variant="outline" className="text-[10px] bg-muted/40 font-normal">
                          {item.category}
                        </Badge>
                      </td>
                      <td className="p-3 font-medium text-foreground max-w-xs truncate" title={item.description}>
                        {item.description}
                      </td>
                      <td className="p-3 text-right font-medium whitespace-nowrap">
                        {INR.format(item.budgeted)}
                      </td>
                      <td className="p-3 text-right font-medium text-indigo-600 whitespace-nowrap">
                        {INR.format(item.committed)}
                      </td>
                      <td className="p-3 text-right font-bold text-emerald-600 whitespace-nowrap">
                        {INR.format(item.actual)}
                      </td>
                      <td className={`p-3 text-right font-semibold whitespace-nowrap ${isOverrun ? "text-destructive" : "text-emerald-600"}`}>
                        {item.costVariance >= 0 ? `+${INR.format(item.costVariance)}` : INR.format(item.costVariance)}
                      </td>
                      <td className="p-3 text-right font-medium text-muted-foreground whitespace-nowrap">
                        {INR.format(item.committedVariance)}
                      </td>
                      <td className="p-3 text-center whitespace-nowrap">
                        {item.health === "overrun" && (
                          <Badge className="bg-destructive text-white text-[10px] px-1.5 py-0.5">
                            Overrun
                          </Badge>
                        )}
                        {item.health === "warning" && (
                          <Badge className="bg-amber-500 text-white text-[10px] px-1.5 py-0.5">
                            At Risk
                          </Badge>
                        )}
                        {item.health === "healthy" && (
                          <Badge className="bg-emerald-600 text-white text-[10px] px-1.5 py-0.5">
                            Healthy
                          </Badge>
                        )}
                      </td>
                      {canManageBudget && (
                        <td className="p-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 hover:bg-muted"
                              onClick={() => handleOpenEdit(item)}
                              title="Edit Cost Code Line"
                            >
                              <Edit3 className="h-3.5 w-3.5 text-muted-foreground" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 hover:bg-destructive/10 text-destructive"
                              onClick={() => handleDelete(item.id, item.costCode)}
                              title="Delete Cost Code"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}

                {filteredItems.length === 0 && (
                  <tr>
                    <td colSpan={canManageBudget ? 10 : 9} className="p-8 text-center text-muted-foreground">
                      No budget line items match the filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
              {/* Grand Totals Footer */}
              {filteredItems.length > 0 && (
                <tfoot className="bg-muted/50 border-t-2 border-border font-bold text-xs">
                  <tr>
                    <td colSpan={3} className="p-3 text-foreground">
                      TOTALS ({filteredItems.length} items shown)
                    </td>
                    <td className="p-3 text-right">
                      {INR.format(filteredItems.reduce((acc, i) => acc + i.budgeted, 0))}
                    </td>
                    <td className="p-3 text-right text-indigo-600">
                      {INR.format(filteredItems.reduce((acc, i) => acc + i.committed, 0))}
                    </td>
                    <td className="p-3 text-right text-emerald-600">
                      {INR.format(filteredItems.reduce((acc, i) => acc + i.actual, 0))}
                    </td>
                    <td className="p-3 text-right text-foreground">
                      {INR.format(filteredItems.reduce((acc, i) => acc + i.costVariance, 0))}
                    </td>
                    <td className="p-3 text-right text-muted-foreground">
                      {INR.format(filteredItems.reduce((acc, i) => acc + i.committedVariance, 0))}
                    </td>
                    <td colSpan={canManageBudget ? 2 : 1} className="p-3 text-center text-muted-foreground">
                      -
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ── Dialog: Add Cost Code Item ── */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Budget Cost Code</DialogTitle>
            <DialogDescription>
              Assign a new WBS cost code, allocated budget, and trade package category.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="space-y-1.5">
              <Label htmlFor="add-code" className="text-xs">Cost Code <span className="text-destructive">*</span></Label>
              <Input
                id="add-code"
                placeholder="e.g. CIVIL-001 or MEP-02"
                value={formCostCode}
                onChange={(e) => setFormCostCode(e.target.value)}
                className="h-8 text-xs font-mono uppercase"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="add-category" className="text-xs">Trade Package Category</Label>
              <Select value={formCategory} onValueChange={setFormCategory}>
                <SelectTrigger id="add-category" className="h-8 text-xs">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {BUDGET_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="add-desc" className="text-xs">Package Description <span className="text-destructive">*</span></Label>
              <Input
                id="add-desc"
                placeholder="e.g. Substructure Foundation & Concrete Pour"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="add-budgeted" className="text-xs">Budgeted (₹) <span className="text-destructive">*</span></Label>
                <Input
                  id="add-budgeted"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={formBudgeted}
                  onChange={(e) => setFormBudgeted(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="add-committed" className="text-xs">Committed (₹)</Label>
                <Input
                  id="add-committed"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={formCommitted}
                  onChange={(e) => setFormCommitted(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="add-actual" className="text-xs">Actual Spent (₹)</Label>
                <Input
                  id="add-actual"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={formActual}
                  onChange={(e) => setFormActual(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setAddDialogOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreate} disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Budget Line"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Edit Cost Code Item ── */}
      <Dialog open={!!editItem} onOpenChange={(open) => !open && setEditItem(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Cost Code Package</DialogTitle>
            <DialogDescription>
              Update baseline allocation, purchase commitments, or incurred actuals for {editItem?.costCode}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="space-y-1.5">
              <Label htmlFor="edit-code" className="text-xs">Cost Code</Label>
              <Input
                id="edit-code"
                value={formCostCode}
                onChange={(e) => setFormCostCode(e.target.value)}
                className="h-8 text-xs font-mono uppercase"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-category" className="text-xs">Trade Package Category</Label>
              <Select value={formCategory} onValueChange={setFormCategory}>
                <SelectTrigger id="edit-category" className="h-8 text-xs">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {BUDGET_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-desc" className="text-xs">Description</Label>
              <Input
                id="edit-desc"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="edit-budgeted" className="text-xs">Budgeted (₹)</Label>
                <Input
                  id="edit-budgeted"
                  type="number"
                  min="0"
                  value={formBudgeted}
                  onChange={(e) => setFormBudgeted(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-committed" className="text-xs">Committed (₹)</Label>
                <Input
                  id="edit-committed"
                  type="number"
                  min="0"
                  value={formCommitted}
                  onChange={(e) => setFormCommitted(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-actual" className="text-xs">Actual Spent (₹)</Label>
                <Input
                  id="edit-actual"
                  type="number"
                  min="0"
                  value={formActual}
                  onChange={(e) => setFormActual(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setEditItem(null)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleUpdate} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Executive Print / PDF Document Modal ── */}
      <Dialog open={printModalOpen} onOpenChange={setPrintModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-6">
          <DialogHeader className="border-b pb-4">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-lg font-bold flex items-center gap-2">
                  <Printer className="h-5 w-5 text-primary" />
                  Executive Project Budget Variance & Audit Report
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Certified document formatted for executive review, client audits, and financial board records.
                </DialogDescription>
              </div>

              <Button
                size="sm"
                className="gap-1.5 text-xs bg-primary text-primary-foreground"
                onClick={() => {
                  window.print();
                }}
              >
                <Printer className="h-3.5 w-3.5" />
                Print / Save PDF
              </Button>
            </div>
          </DialogHeader>

          {/* Printable Layout Container */}
          <div className="space-y-6 pt-4 text-xs font-sans print:p-0">
            {/* Header / Letterhead */}
            <div className="flex justify-between items-start border-b pb-4">
              <div>
                <div className="text-lg font-black tracking-wider text-primary">KANAK TURNKEY PROJECTS</div>
                <div className="text-xs text-muted-foreground">Engineering, Procurement & Turnkey Execution</div>
                <div className="text-[11px] text-muted-foreground mt-1">CIN: U45200MH2021PTC368921 • GSTIN: 27AABCK8921M1Z5</div>
              </div>
              <div className="text-right space-y-0.5 text-[11px]">
                <div className="font-bold text-sm">AUDIT VARIANCE REPORT</div>
                <div className="text-muted-foreground">Report Ref: VAR-{projectId}-{new Date().getFullYear()}</div>
                <div className="text-muted-foreground">Date: {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</div>
                <div className="text-muted-foreground">Standard: ISO 9001:2015 & IS 456</div>
              </div>
            </div>

            {/* Project Identification */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 rounded-lg bg-muted/30 border">
              <div>
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">Project Name</span>
                <div className="font-bold text-sm text-foreground">{projectName}</div>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">Client Organization</span>
                <div className="font-bold text-foreground">{clientName}</div>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">Baseline Target</span>
                <div className="font-bold text-foreground">{INR.format(baselineBudget)}</div>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">Overall Cost Health</span>
                <div>
                  <Badge className={`text-[10px] uppercase ${summary.overallHealth === "overrun" ? "bg-destructive text-white" : summary.overallHealth === "warning" ? "bg-amber-500 text-white" : "bg-emerald-600 text-white"}`}>
                    {summary.overallHealth}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Executive Variance Summary Box */}
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted/60 p-2.5 font-bold text-xs border-b">
                1. EXECUTIVE FINANCIAL CONTROL SUMMARY
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 text-center">
                <div className="p-3">
                  <div className="text-[10px] text-muted-foreground">Authorized Tender Budget</div>
                  <div className="text-base font-bold text-foreground mt-0.5">{INR.format(summary.totalBudgeted)}</div>
                  <div className="text-[10px] text-muted-foreground">100.0% Allocation</div>
                </div>
                <div className="p-3">
                  <div className="text-[10px] text-muted-foreground">Committed Subcontracts & POs</div>
                  <div className="text-base font-bold text-indigo-600 mt-0.5">{INR.format(summary.totalCommitted)}</div>
                  <div className="text-[10px] text-muted-foreground">{summary.overallCommitmentRate}% Encumbered</div>
                </div>
                <div className="p-3">
                  <div className="text-[10px] text-muted-foreground">Actual Certified Disbursements</div>
                  <div className="text-base font-bold text-emerald-600 mt-0.5">{INR.format(summary.totalActual)}</div>
                  <div className="text-[10px] text-muted-foreground">{summary.overallBurnRate}% Disbursed</div>
                </div>
                <div className="p-3">
                  <div className="text-[10px] text-muted-foreground">Net Cost Variance Buffer</div>
                  <div className={`text-base font-bold mt-0.5 ${summary.netVariance < 0 ? "text-destructive" : "text-emerald-600"}`}>
                    {summary.netVariance >= 0 ? `+${INR.format(summary.netVariance)}` : INR.format(summary.netVariance)}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {summary.netVariance >= 0 ? "Under Baseline Budget" : "Budget Overrun"}
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Itemized Schedule */}
            <div className="space-y-2">
              <div className="font-bold text-xs">2. COMPLETE COST CODE BREAKDOWN & VARIANCE ANALYSIS</div>
              <table className="w-full text-left border rounded-lg text-[11px]">
                <thead className="bg-muted/70 text-muted-foreground border-b font-medium">
                  <tr>
                    <th className="p-2">Cost Code</th>
                    <th className="p-2">Category</th>
                    <th className="p-2">Package Description</th>
                    <th className="p-2 text-right">Budget (₹)</th>
                    <th className="p-2 text-right">Committed (₹)</th>
                    <th className="p-2 text-right">Actual (₹)</th>
                    <th className="p-2 text-right">Variance (₹)</th>
                    <th className="p-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td className="p-2 font-mono font-semibold">{item.costCode}</td>
                      <td className="p-2 text-muted-foreground">{item.category}</td>
                      <td className="p-2">{item.description}</td>
                      <td className="p-2 text-right">{INR.format(item.budgeted)}</td>
                      <td className="p-2 text-right">{INR.format(item.committed)}</td>
                      <td className="p-2 text-right font-medium">{INR.format(item.actual)}</td>
                      <td className={`p-2 text-right font-bold ${item.costVariance < 0 ? "text-destructive" : "text-emerald-600"}`}>
                        {item.costVariance >= 0 ? `+${INR.format(item.costVariance)}` : INR.format(item.costVariance)}
                      </td>
                      <td className="p-2 text-center uppercase text-[9px] font-bold">
                        {item.health}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-muted/40 font-bold border-t">
                  <tr>
                    <td colSpan={3} className="p-2">Total Project Encumbrances</td>
                    <td className="p-2 text-right">{INR.format(summary.totalBudgeted)}</td>
                    <td className="p-2 text-right">{INR.format(summary.totalCommitted)}</td>
                    <td className="p-2 text-right">{INR.format(summary.totalActual)}</td>
                    <td className={`p-2 text-right ${summary.netVariance < 0 ? "text-destructive" : "text-emerald-600"}`}>
                      {INR.format(summary.netVariance)}
                    </td>
                    <td className="p-2 text-center">-</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Statutory Sign-off */}
            <div className="pt-8 border-t grid grid-cols-3 gap-6 text-center text-[10px]">
              <div className="space-y-8">
                <div className="h-8 border-b border-dashed" />
                <div>
                  <div className="font-bold text-foreground">Site Quantity Surveyor</div>
                  <div className="text-muted-foreground">Measurement & JMR Certification</div>
                </div>
              </div>
              <div className="space-y-8">
                <div className="h-8 border-b border-dashed" />
                <div>
                  <div className="font-bold text-foreground">Project Manager</div>
                  <div className="text-muted-foreground">Physical Verification & Timeline Review</div>
                </div>
              </div>
              <div className="space-y-8">
                <div className="h-8 border-b border-dashed" />
                <div>
                  <div className="font-bold text-foreground">Chief Financial Officer</div>
                  <div className="text-muted-foreground">Corporate Budget Approval & Auditing</div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
