import { useState, useMemo } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  useARAgingReport,
  type ARAgingInvoice,
  type ARAgingBucket,
  useListProjects,
} from "@workspace/api-client-react";
import {
  TrendingUp,
  IndianRupee,
  Calendar,
  AlertTriangle,
  Download,
  Printer,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ShieldAlert,
  Users,
  FileText,
  CreditCard,
  Send,
  Building2,
  Layers,
  Sparkles,
  BarChart3,
} from "lucide-react";

interface ARAgingReportViewProps {
  onRecordPayment?: (invoiceId: number, invoiceNumber: string) => void;
  onSendReminder?: (invoiceId: number) => void;
  initialProjectId?: string;
  hideProjectFilter?: boolean;
}

function formatCurrency(val: number | string | undefined | null): string {
  const n = Number(val || 0);
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)} L`;
  return `₹${n.toLocaleString("en-IN")}`;
}

const bucketBadgeStyles: Record<string, string> = {
  "0-30": "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800",
  "31-60": "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800",
  "61-90": "bg-orange-50 text-orange-700 border-orange-300 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-800",
  "90+": "bg-red-50 text-red-700 border-red-300 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800 font-bold",
};

const riskBadgeStyles: Record<string, string> = {
  low: "bg-emerald-100 text-emerald-800 border-emerald-200",
  medium: "bg-amber-100 text-amber-800 border-amber-200",
  high: "bg-orange-100 text-orange-800 border-orange-200",
  critical: "bg-red-100 text-red-800 border-red-200 font-semibold",
};

export function ARAgingReportView({
  onRecordPayment,
  onSendReminder,
  initialProjectId = "all",
  hideProjectFilter = false,
}: ARAgingReportViewProps) {
  const { toast } = useToast();
  const [selectedProject, setSelectedProject] = useState<string>(initialProjectId);
  const [selectedBucket, setSelectedBucket] = useState<string>("all");
  const [selectedClient, setSelectedClient] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const { data: projects = [] } = useListProjects();

  const { data: report, isLoading, refetch } = useARAgingReport({
    projectId: selectedProject !== "all" ? selectedProject : undefined,
    bucket: selectedBucket !== "all" ? selectedBucket : undefined,
    clientId: selectedClient !== "all" ? selectedClient : undefined,
  });

  // Client unique options for filtering
  const clientOptions = useMemo(() => {
    if (!report?.clientSummary) return [];
    return report.clientSummary.map((c) => c.clientName);
  }, [report]);

  // Invoices filtered by search
  const filteredInvoices = useMemo(() => {
    if (!report?.invoices) return [];
    if (!searchQuery.trim()) return report.invoices;
    const q = searchQuery.toLowerCase();
    return report.invoices.filter(
      (inv) =>
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.clientName.toLowerCase().includes(q) ||
        (inv.projectName && inv.projectName.toLowerCase().includes(q))
    );
  }, [report?.invoices, searchQuery]);

  // Export to CSV
  const handleExportCSV = () => {
    if (!filteredInvoices || filteredInvoices.length === 0) {
      toast({ title: "No Data", description: "No invoice records to export.", variant: "destructive" });
      return;
    }

    const headers = [
      "Invoice Number",
      "Project",
      "Client",
      "Invoice Date",
      "Due Date",
      "Overdue (Days)",
      "Age (Days)",
      "Total Amount (INR)",
      "Paid Amount (INR)",
      "Outstanding Balance (INR)",
      "Aging Bucket",
      "Risk Rating",
      "Status",
    ];

    const rows = filteredInvoices.map((inv) => [
      `"${inv.invoiceNumber}"`,
      `"${inv.projectName || "General"}"`,
      `"${inv.clientName}"`,
      `"${inv.invoiceDate?.split("T")[0] || ""}"`,
      `"${inv.dueDate?.split("T")[0] || ""}"`,
      inv.daysOverdue,
      inv.ageDays,
      inv.amount,
      inv.totalPaidAmount,
      inv.outstandingAmount,
      `"${inv.bucket}"`,
      `"${inv.riskLevel.toUpperCase()}"`,
      `"${inv.status}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `AR_Aging_Report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Successful",
      description: "AR Aging Report has been downloaded as CSV.",
    });
  };

  const handlePrint = () => {
    toast({
      title: "Preparing Print Document",
      description: "Formatting AR Aging Report for PDF / Printer...",
    });
    setTimeout(() => {
      window.print();
    }, 400);
  };

  return (
    <div className="space-y-6">
      {/* ── Report Filter & Action Bar ── */}
      <Card className="border shadow-sm bg-card">
        <CardContent className="p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 flex-1">
            {!hideProjectFilter && (
              <div className="w-full sm:w-52">
                <Select value={selectedProject} onValueChange={setSelectedProject}>
                  <SelectTrigger className="h-9 text-xs">
                    <Building2 className="w-3.5 h-3.5 mr-1 text-muted-foreground" />
                    <SelectValue placeholder="All Projects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Projects</SelectItem>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="w-full sm:w-44">
              <Select value={selectedBucket} onValueChange={setSelectedBucket}>
                <SelectTrigger className="h-9 text-xs">
                  <Filter className="w-3.5 h-3.5 mr-1 text-muted-foreground" />
                  <SelectValue placeholder="All Aging Buckets" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Aging Buckets</SelectItem>
                  <SelectItem value="0-30">0–30 Days (Current)</SelectItem>
                  <SelectItem value="31-60">31–60 Days</SelectItem>
                  <SelectItem value="61-90">61–90 Days</SelectItem>
                  <SelectItem value="90+">90+ Days (Critical)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {clientOptions.length > 0 && (
              <div className="w-full sm:w-44">
                <Select value={selectedClient} onValueChange={setSelectedClient}>
                  <SelectTrigger className="h-9 text-xs">
                    <Users className="w-3.5 h-3.5 mr-1 text-muted-foreground" />
                    <SelectValue placeholder="All Clients" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Clients</SelectItem>
                    {clientOptions.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search invoice #, client..."
                className="pl-8 h-9 text-xs"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={handleExportCSV} className="h-9 text-xs gap-1.5 shadow-sm">
              <Download className="w-3.5 h-3.5 text-primary" />
              Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint} className="h-9 text-xs gap-1.5 shadow-sm">
              <Printer className="w-3.5 h-3.5 text-primary" />
              Print Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Key Executive Receivables Metrics ── */}
      {report && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-primary shadow-sm hover:border-primary transition-all">
            <CardContent className="pt-4 pb-3">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <IndianRupee className="w-3.5 h-3.5 text-primary" /> Total AR Outstanding
              </span>
              <p className="text-2xl font-extrabold text-foreground mt-1">
                {formatCurrency(report.totalOutstanding)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Across {filteredInvoices.filter((i) => i.outstandingAmount > 0).length} active receivables
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500 shadow-sm hover:border-red-600 transition-all">
            <CardContent className="pt-4 pb-3">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-red-500" /> Overdue Receivables
              </span>
              <p className="text-2xl font-extrabold text-red-600 dark:text-red-400 mt-1">
                {formatCurrency(report.totalOverdue)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {report.totalOutstanding > 0
                  ? `${Math.round((report.totalOverdue / report.totalOutstanding) * 100)}% of total AR past due date`
                  : "No overdue receivables"}
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500 shadow-sm hover:border-blue-600 transition-all">
            <CardContent className="pt-4 pb-3">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-500" /> Days Sales Outstanding (DSO)
              </span>
              <p className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">
                {report.dsoDays} <span className="text-sm font-normal text-muted-foreground">Days</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Average cash conversion cycle for turnkey billing
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-emerald-500 shadow-sm hover:border-emerald-600 transition-all">
            <CardContent className="pt-4 pb-3">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> Collection Efficiency
              </span>
              <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                {report.collectionEfficiency}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatCurrency(report.totalCollected)} collected of {formatCurrency(report.totalBilled)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── AR Aging Buckets Breakdown (Cards & Stacked Progress) ── */}
      {report?.buckets && (
        <Card className="border shadow-sm">
          <CardHeader className="pb-3 border-b bg-muted/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  Receivables Aging Distribution by Overdue Days
                </CardTitle>
                <CardDescription className="text-xs">
                  Invoices segmented into standard accounting aging cycles: 0-30 days, 31-60 days, 61-90 days, and 90+ days past due.
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs font-mono self-start sm:self-auto">
                As of: {report.asOfDate}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {/* Visual Stacked Multi-Color Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span>Aging Composition (% of Total Outstanding)</span>
                <span className="text-muted-foreground font-mono">{formatCurrency(report.totalOutstanding)}</span>
              </div>
              <div className="h-4 w-full bg-muted/50 rounded-full overflow-hidden flex shadow-inner">
                {report.buckets["0-30"].percentage > 0 && (
                  <div
                    className="h-full bg-emerald-500 hover:opacity-90 transition-opacity"
                    style={{ width: `${report.buckets["0-30"].percentage}%` }}
                    title={`0-30 Days: ${formatCurrency(report.buckets["0-30"].amount)} (${report.buckets["0-30"].percentage}%)`}
                  />
                )}
                {report.buckets["31-60"].percentage > 0 && (
                  <div
                    className="h-full bg-amber-500 hover:opacity-90 transition-opacity"
                    style={{ width: `${report.buckets["31-60"].percentage}%` }}
                    title={`31-60 Days: ${formatCurrency(report.buckets["31-60"].amount)} (${report.buckets["31-60"].percentage}%)`}
                  />
                )}
                {report.buckets["61-90"].percentage > 0 && (
                  <div
                    className="h-full bg-orange-500 hover:opacity-90 transition-opacity"
                    style={{ width: `${report.buckets["61-90"].percentage}%` }}
                    title={`61-90 Days: ${formatCurrency(report.buckets["61-90"].amount)} (${report.buckets["61-90"].percentage}%)`}
                  />
                )}
                {report.buckets["90+"].percentage > 0 && (
                  <div
                    className="h-full bg-red-500 hover:opacity-90 transition-opacity"
                    style={{ width: `${report.buckets["90+"].percentage}%` }}
                    title={`90+ Days: ${formatCurrency(report.buckets["90+"].amount)} (${report.buckets["90+"].percentage}%)`}
                  />
                )}
              </div>
            </div>

            {/* 4 Interactive Bucket Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
              {[
                {
                  key: "0-30",
                  title: "0–30 Days (Current)",
                  desc: "Within standard credit cycle",
                  data: report.buckets["0-30"],
                  border: "hover:border-emerald-500",
                  activeCls: selectedBucket === "0-30" ? "ring-2 ring-emerald-500 bg-emerald-50/30" : "",
                  badgeCls: "bg-emerald-100 text-emerald-800",
                  textColor: "text-emerald-600 dark:text-emerald-400",
                },
                {
                  key: "31-60",
                  title: "31–60 Days",
                  desc: "Follow-up reminder sent",
                  data: report.buckets["31-60"],
                  border: "hover:border-amber-500",
                  activeCls: selectedBucket === "31-60" ? "ring-2 ring-amber-500 bg-amber-50/30" : "",
                  badgeCls: "bg-amber-100 text-amber-800",
                  textColor: "text-amber-600 dark:text-amber-400",
                },
                {
                  key: "61-90",
                  title: "61–90 Days",
                  desc: "Commercial escalation level",
                  data: report.buckets["61-90"],
                  border: "hover:border-orange-500",
                  activeCls: selectedBucket === "61-90" ? "ring-2 ring-orange-500 bg-orange-50/30" : "",
                  badgeCls: "bg-orange-100 text-orange-800",
                  textColor: "text-orange-600 dark:text-orange-400",
                },
                {
                  key: "90+",
                  title: "90+ Days (Critical)",
                  desc: "High default / bad debt risk",
                  data: report.buckets["90+"],
                  border: "hover:border-red-500",
                  activeCls: selectedBucket === "90+" ? "ring-2 ring-red-500 bg-red-50/30" : "",
                  badgeCls: "bg-red-100 text-red-800",
                  textColor: "text-red-600 dark:text-red-400 font-extrabold",
                },
              ].map((b) => (
                <div
                  key={b.key}
                  onClick={() => setSelectedBucket(selectedBucket === b.key ? "all" : b.key)}
                  className={`p-3.5 rounded-lg border bg-card transition-all cursor-pointer ${b.border} ${b.activeCls}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold">{b.title}</span>
                    <Badge className={`text-[10px] px-1.5 py-0 ${b.badgeCls}`}>
                      {b.data.percentage}%
                    </Badge>
                  </div>
                  <div className={`text-xl font-bold mt-1.5 ${b.textColor}`}>
                    {formatCurrency(b.data.amount)}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-1">
                    <span>{b.data.count} Invoices</span>
                    <span>{b.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Client Aging Matrix Summary Table ── */}
      {report?.clientSummary && report.clientSummary.length > 0 && (
        <Card className="border shadow-sm">
          <CardHeader className="pb-3 border-b bg-muted/20">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Client Outstanding & Aging Matrix
            </CardTitle>
            <CardDescription className="text-xs">
              Consolidated debt exposure per client categorized across aging buckets with collection risk profiling.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead className="bg-muted text-muted-foreground border-b font-medium">
                  <tr>
                    <th className="p-3">Client Entity</th>
                    <th className="p-3 text-center">Open Invoices</th>
                    <th className="p-3 text-right">Total Outstanding</th>
                    <th className="p-3 text-right">0–30 Days</th>
                    <th className="p-3 text-right">31–60 Days</th>
                    <th className="p-3 text-right">61–90 Days</th>
                    <th className="p-3 text-right">90+ Days</th>
                    <th className="p-3 text-center">Risk Profile</th>
                  </tr>
                </thead>
                <tbody className="divide-y font-mono">
                  {report.clientSummary.map((cl, idx) => (
                    <tr key={idx} className="hover:bg-muted/10 font-sans">
                      <td className="p-3 font-semibold text-foreground">
                        {cl.clientName}
                      </td>
                      <td className="p-3 text-center font-mono">{cl.invoicesCount}</td>
                      <td className="p-3 text-right font-mono font-bold text-foreground">
                        {formatCurrency(cl.totalOutstanding)}
                      </td>
                      <td className="p-3 text-right font-mono text-emerald-600">
                        {cl.current > 0 ? formatCurrency(cl.current) : "—"}
                      </td>
                      <td className="p-3 text-right font-mono text-amber-600">
                        {cl.days31_60 > 0 ? formatCurrency(cl.days31_60) : "—"}
                      </td>
                      <td className="p-3 text-right font-mono text-orange-600">
                        {cl.days61_90 > 0 ? formatCurrency(cl.days61_90) : "—"}
                      </td>
                      <td className="p-3 text-right font-mono text-red-600 font-bold">
                        {cl.days90Plus > 0 ? formatCurrency(cl.days90Plus) : "—"}
                      </td>
                      <td className="p-3 text-center">
                        <Badge variant="outline" className={`text-[10px] uppercase ${riskBadgeStyles[cl.riskLevel]}`}>
                          {cl.riskLevel}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Itemized Aging Invoices Register (Drill-Down) ── */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3 border-b bg-muted/20 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Itemized Invoice Aging Register ({filteredInvoices.length} Invoices)
            </CardTitle>
            <CardDescription className="text-xs">
              Direct drill-down into open receivables with overdue days counter, milestone contract links, and payment actions.
            </CardDescription>
          </div>

          {selectedBucket !== "all" && (
            <Badge variant="secondary" className="text-xs gap-1 cursor-pointer" onClick={() => setSelectedBucket("all")}>
              Filtered by: {selectedBucket} Days ✕
            </Badge>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              Compiling AR aging calculations...
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              No outstanding invoices found matching current criteria.
            </div>
          ) : (
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead className="bg-muted text-muted-foreground border-b font-medium">
                  <tr>
                    <th className="p-3">Invoice #</th>
                    <th className="p-3">Client & Project Site</th>
                    <th className="p-3">Invoice Date</th>
                    <th className="p-3">Due Date</th>
                    <th className="p-3 text-center">Overdue</th>
                    <th className="p-3 text-right">Invoice Amt</th>
                    <th className="p-3 text-right">Paid</th>
                    <th className="p-3 text-right">Balance Due</th>
                    <th className="p-3 text-center">Aging Bucket</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right pr-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y font-mono">
                  {filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-muted/10 font-sans">
                      <td className="p-3 font-mono font-bold text-primary">
                        {inv.invoiceNumber}
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-foreground">{inv.clientName}</div>
                        <div className="text-[11px] text-muted-foreground truncate max-w-xs">
                          {inv.projectName || "General Project"}
                        </div>
                      </td>
                      <td className="p-3 font-mono text-muted-foreground">
                        {inv.invoiceDate ? inv.invoiceDate.split("T")[0] : "—"}
                      </td>
                      <td className="p-3 font-mono text-muted-foreground">
                        {inv.dueDate ? inv.dueDate.split("T")[0] : "—"}
                      </td>
                      <td className="p-3 text-center font-mono">
                        {inv.isOverdue ? (
                          <Badge variant="outline" className="text-[10px] font-bold text-red-600 border-red-200 bg-red-50">
                            +{inv.daysOverdue}d
                          </Badge>
                        ) : (
                          <span className="text-[11px] text-emerald-600 font-medium">Current</span>
                        )}
                      </td>
                      <td className="p-3 text-right font-mono text-muted-foreground">
                        {formatCurrency(inv.amount)}
                      </td>
                      <td className="p-3 text-right font-mono text-muted-foreground">
                        {formatCurrency(inv.totalPaidAmount)}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-foreground">
                        {formatCurrency(inv.outstandingAmount)}
                      </td>
                      <td className="p-3 text-center">
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-medium ${bucketBadgeStyles[inv.bucket] || ""}`}
                        >
                          {inv.bucket} Days
                        </Badge>
                      </td>
                      <td className="p-3 text-center">
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {inv.status.replace(/_/g, " ")}
                        </Badge>
                      </td>
                      <td className="p-3 pr-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {inv.outstandingAmount > 0 && onRecordPayment && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2 text-[11px] gap-1"
                              onClick={() => onRecordPayment(inv.id, inv.invoiceNumber)}
                            >
                              <CreditCard className="w-3 h-3 text-primary" />
                              Pay
                            </Button>
                          )}
                          {inv.outstandingAmount > 0 && onSendReminder && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-primary"
                              onClick={() => onSendReminder(inv.id)}
                              title="Send Reminder"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
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
  );
}
