import { useState, useEffect } from "react";
import { Link, useSearch, useLocation } from "wouter";
import {
  useWorkflowStats,
  useWorkflowRaBills,
  useWorkCompletions,
  useWorkflowInvoices,
  useContracts,
  useListProjects,
  useGetCurrentUser,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Layers,
  FileText,
  Receipt,
  CreditCard,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  DollarSign,
  ShieldCheck,
  Building,
  Calendar,
  Lock,
  Send,
  Eye,
  HelpCircle,
  ArrowLeft,
  Building2,
  X,
} from "lucide-react";
import { format } from "date-fns";

export default function RaBillsDashboard() {
  const search = useSearch();
  const [, setLocation] = useLocation();
  const searchTab = new URLSearchParams(search).get("tab") || "ra-bills";
  const [activeTab, setActiveTab] = useState(searchTab);
  const [searchQuery, setSearchQuery] = useState("");
  const [projectFilter, setProjectFilter] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search).get("projectId");
      if (p && p.trim()) return p.trim();
    }
    return "all";
  });

  // Listen for browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const pid = params.get("projectId");
      setProjectFilter(pid && pid.trim() ? pid.trim() : "all");
      const tabFromUrl = params.get("tab");
      if (tabFromUrl) setActiveTab(tabFromUrl);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Sync tab & projectFilter with URL query
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (activeTab === "ra-bills") {
      params.delete("tab");
    } else {
      params.set("tab", activeTab);
    }

    if (projectFilter === "all") {
      params.delete("projectId");
    } else {
      params.set("projectId", projectFilter);
    }

    const qs = params.toString();
    const url = window.location.pathname + (qs ? `?${qs}` : "");
    window.history.replaceState(null, "", url);
  }, [activeTab, projectFilter]);

  useEffect(() => {
    const tabFromUrl = new URLSearchParams(search).get("tab");
    if (tabFromUrl) setActiveTab(tabFromUrl);
  }, [search]);

  const { data: user } = useGetCurrentUser();
  const selectedProjId = projectFilter !== "all" ? Number(projectFilter) : undefined;

  const { data: stats } = useWorkflowStats(selectedProjId);
  const { data: raBills, isLoading: loadingBills } = useWorkflowRaBills(
    selectedProjId ? { projectId: selectedProjId } : undefined
  );
  const { data: workCompletions, isLoading: loadingWcs } = useWorkCompletions(
    selectedProjId ? { projectId: selectedProjId } : undefined
  );
  const { data: invoices, isLoading: loadingInvoices } = useWorkflowInvoices(
    selectedProjId ? { projectId: selectedProjId } : undefined
  );
  const { data: contracts, isLoading: loadingContracts } = useContracts(
    selectedProjId ? { projectId: selectedProjId } : undefined
  );
  const { data: projects } = useListProjects();

  const currentProject = (projects || []).find((p: any) => String(p.id) === String(projectFilter));

  const handleBack = () => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get("from");
    if (from && from.startsWith("/")) {
      setLocation(decodeURIComponent(from));
      return;
    }
    if (projectFilter !== "all") {
      setLocation(`/projects/${projectFilter}?tab=journey`);
      return;
    }
    setLocation("/projects");
  };

  const isManagerOrAdmin =
    user?.activeRole === "admin" ||
    user?.activeRole === "project_manager" ||
    (Array.isArray(user?.roles) &&
      (user?.roles.includes("admin") || user?.roles.includes("project_manager")));

  return (
    <div className="space-y-6">
      {/* Top Header with Back to Lifecycle Map Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {projectFilter !== "all" ? (
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBack}
                className="gap-1.5 text-xs font-semibold h-7 px-2.5 shadow-xs border-primary/30 text-primary hover:bg-primary/10"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Lifecycle Map
              </Button>
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-xs px-2.5 py-0.5 font-semibold">
                <Building2 className="h-3 w-3 mr-1 inline" />
                Project #{projectFilter}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                Phase 4: Billing & Handover
              </Badge>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
              {currentProject?.name ? `${currentProject.name} — RA Bills & Invoicing` : "RA Bills & Vendor Payments"}
            </h1>
            <p className="text-muted-foreground text-xs md:text-sm">
              Work completions, running account billing abstracts, client tax invoices, and payment reconciliations.
            </p>
          </div>
        ) : (
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Client RA Bills & Progress Billing</h1>
            <p className="text-muted-foreground text-sm">
              Standard Operating Billing Engine: Work Measurements (JMR) → RA Bill Abstract → PM Sign-off → Invoicing Hand-off
            </p>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Link href="/finance">
            <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs">
              <TrendingUp className="w-3.5 h-3.5" /> Finance Hub
            </Button>
          </Link>

          <Link href="/finance/ar">
            <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400">
              <Receipt className="w-3.5 h-3.5" /> Client AR
            </Button>
          </Link>

          {isManagerOrAdmin && (
            <Link href="/ra-bills/pm-approvals">
              <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs border-blue-300 text-blue-600 hover:bg-blue-50">
                <Clock className="w-3.5 h-3.5" /> PM Approvals
                {((stats?.workCompletions.pendingVerification || 0) + (stats?.raBills.pendingApproval || 0)) > 0 && (
                  <Badge variant="destructive" className="h-4 px-1 text-[10px] ml-1">
                    {(stats?.workCompletions.pendingVerification || 0) + (stats?.raBills.pendingApproval || 0)}
                  </Badge>
                )}
              </Button>
            </Link>
          )}

          <Link href="/ra-bills/work-completions/new">
            <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs">
              <Layers className="w-3.5 h-3.5" /> Log JMR
            </Button>
          </Link>

          <Link href="/ra-bills/new">
            <Button size="sm" className="gap-1.5 h-8 bg-primary text-primary-foreground hover:bg-primary/90 text-xs">
              <Plus className="w-3.5 h-3.5" /> Prepare RA Bill
            </Button>
          </Link>
        </div>
      </div>

      {/* Visual Workflow Pipeline Graphic Banner */}
      <Card className="border bg-gradient-to-r from-blue-950/10 via-emerald-950/10 to-purple-950/10 dark:from-blue-950/40 dark:via-emerald-950/40 dark:to-purple-950/40 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" /> Standard Operating Workflow
            </span>
            <span className="text-[11px] text-muted-foreground hidden sm:inline">
              ISO 9001 / Construction Project Billing Standard
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 text-center text-xs">
            {/* Step 1 */}
            <div className="bg-card/80 p-2.5 rounded-md border flex flex-col items-center justify-between gap-1 shadow-xs">
              <span className="text-[10px] font-semibold text-muted-foreground">1. MEASURE & LOG</span>
              <div className="font-bold text-foreground flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-blue-500" /> Work Completion
              </div>
              <Badge variant="outline" className="text-[10px] font-mono">
                {stats?.workCompletions.total || 0} Logged
              </Badge>
            </div>

            {/* Step 2 */}
            <div className="bg-card/80 p-2.5 rounded-md border flex flex-col items-center justify-between gap-1 shadow-xs">
              <span className="text-[10px] font-semibold text-muted-foreground">2. PM VERIFICATION</span>
              <div className="font-bold text-foreground flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Verify JMR
              </div>
              <Badge variant="secondary" className="text-[10px] font-mono">
                {stats?.workCompletions.pendingVerification || 0} Pending
              </Badge>
            </div>

            {/* Step 3 */}
            <div className="bg-card/80 p-2.5 rounded-md border flex flex-col items-center justify-between gap-1 shadow-xs">
              <span className="text-[10px] font-semibold text-muted-foreground">3. RA CERTIFICATE</span>
              <div className="font-bold text-foreground flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-indigo-500" /> Prepare RA Bill
              </div>
              <Badge variant="outline" className="text-[10px] font-mono">
                {stats?.raBills.total || 0} Bills
              </Badge>
            </div>

            {/* Step 4 */}
            <div className="bg-card/80 p-2.5 rounded-md border flex flex-col items-center justify-between gap-1 shadow-xs">
              <span className="text-[10px] font-semibold text-muted-foreground">4. PM APPROVAL</span>
              <div className="font-bold text-foreground flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-500" /> Sign-off / Revise
              </div>
              <Badge className="bg-amber-600 text-white text-[10px] font-mono">
                {stats?.raBills.pendingApproval || 0} Pending
              </Badge>
            </div>

            {/* Step 5 */}
            <div className="bg-card/80 p-2.5 rounded-md border flex flex-col items-center justify-between gap-1 shadow-xs">
              <span className="text-[10px] font-semibold text-muted-foreground">5. TAX INVOICE</span>
              <div className="font-bold text-foreground flex items-center gap-1">
                <Receipt className="w-3.5 h-3.5 text-purple-500" /> Generate & Send
              </div>
              <Badge variant="outline" className="text-[10px] font-mono">
                {stats?.invoices.total || 0} Issued
              </Badge>
            </div>

            {/* Step 6 */}
            <div className="bg-card/80 p-2.5 rounded-md border flex flex-col items-center justify-between gap-1 shadow-xs">
              <span className="text-[10px] font-semibold text-muted-foreground">6. RECONCILIATION</span>
              <div className="font-bold text-foreground flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-emerald-600" /> Reconcile & Close
              </div>
              <Badge className="bg-emerald-600 text-white text-[10px] font-mono">
                {stats?.invoices.paidCount || 0} Paid
              </Badge>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-border/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">
              💡 <strong>End-to-End Scenario Flow</strong>: Experience this entire billing cycle interconnected with project setup, BOQ, budget, and procurement.
            </span>
            <Link href="/projects/14/journey">
              <Button variant="link" size="sm" className="h-auto p-0 text-xs font-semibold text-primary gap-1">
                Explore Turnkey Lifecycle (Sapphire Grand) <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="border shadow-xs">
          <CardHeader className="p-3 pb-1">
            <CardDescription className="text-[10px] uppercase font-semibold">Total Contracts</CardDescription>
            <CardTitle className="text-lg font-bold">
              ₹{((stats?.contracts.totalValue || 0) / 100000).toFixed(1)}L
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 text-[11px] text-muted-foreground">
            {stats?.contracts.total || 0} active work orders
          </CardContent>
        </Card>

        <Card className="border shadow-xs">
          <CardHeader className="p-3 pb-1">
            <CardDescription className="text-[10px] uppercase font-semibold">Gross Billed</CardDescription>
            <CardTitle className="text-lg font-bold text-foreground">
              ₹{((stats?.raBills.totalGrossAmount || 0) / 100000).toFixed(1)}L
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 text-[11px] text-muted-foreground">
            Cumulative measurements
          </CardContent>
        </Card>

        <Card className="border shadow-xs">
          <CardHeader className="p-3 pb-1">
            <CardDescription className="text-[10px] uppercase font-semibold">Net Certified</CardDescription>
            <CardTitle className="text-lg font-bold text-blue-600">
              ₹{((stats?.raBills.totalNetPayableAmount || 0) / 100000).toFixed(1)}L
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 text-[11px] text-muted-foreground">
            {stats?.raBills.approved || 0} approved bills
          </CardContent>
        </Card>

        <Card className="border shadow-xs">
          <CardHeader className="p-3 pb-1">
            <CardDescription className="text-[10px] uppercase font-semibold">Retention Held</CardDescription>
            <CardTitle className="text-lg font-bold text-amber-600">
              ₹{((stats?.raBills.totalRetentionAmount || 0) / 100000).toFixed(1)}L
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 text-[11px] text-muted-foreground">
            Defect liability security
          </CardContent>
        </Card>

        <Card className="border shadow-xs">
          <CardHeader className="p-3 pb-1">
            <CardDescription className="text-[10px] uppercase font-semibold">Total Payments</CardDescription>
            <CardTitle className="text-lg font-bold text-emerald-600">
              ₹{((stats?.invoices.totalPaidAmount || 0) / 100000).toFixed(1)}L
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 text-[11px] text-muted-foreground">
            {stats?.invoices.paidCount || 0} invoices settled
          </CardContent>
        </Card>

        <Card className="border shadow-xs">
          <CardHeader className="p-3 pb-1">
            <CardDescription className="text-[10px] uppercase font-semibold">Outstanding Due</CardDescription>
            <CardTitle className="text-lg font-bold text-rose-600">
              ₹{((stats?.invoices.totalOutstandingAmount || 0) / 100000).toFixed(1)}L
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 text-[11px] text-muted-foreground">
            {stats?.invoices.unpaidCount || 0} pending invoices
          </CardContent>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-card p-3 rounded-lg border">
        <div className="flex items-center gap-2 w-full sm:w-80">
          <Search className="w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search bills, completions, invoices, vendors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="h-8 text-xs w-[180px]">
              <SelectValue placeholder="All Projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects ({(projects || []).length})</SelectItem>
              {(projects || []).map((p) => (
                <SelectItem key={p.id} value={String(p.id)}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {projectFilter !== "all" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setProjectFilter("all")}
              className="h-8 text-xs gap-1 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" /> Show All
            </Button>
          )}

          <Link href="/ra-bills/contracts">
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
              <Building className="w-3.5 h-3.5" /> Manage Contracts
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="ra-bills" className="gap-2">
            <FileText className="w-4 h-4" /> RA Bills
            {raBills && raBills.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-muted font-mono">
                {raBills.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="work-completions" className="gap-2">
            <Layers className="w-4 h-4" /> Work Completions
            {workCompletions && workCompletions.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-muted font-mono">
                {workCompletions.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="invoices" className="gap-2">
            <Receipt className="w-4 h-4" /> Invoices & Payments
            {invoices && invoices.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-muted font-mono">
                {invoices.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="contracts" className="gap-2">
            <Building className="w-4 h-4" /> Contracts
          </TabsTrigger>
        </TabsList>

        {/* ── TAB 1: RA Bills ── */}
        <TabsContent value="ra-bills" className="space-y-4 pt-2">
          {loadingBills ? (
            <div className="p-8 text-center text-muted-foreground">Loading RA bills...</div>
          ) : (!raBills || raBills.length === 0) ? (
            <div className="p-12 text-center border rounded-lg bg-card text-muted-foreground space-y-3">
              <FileText className="w-10 h-10 mx-auto text-muted-foreground/40" />
              <h3 className="font-semibold text-foreground">No RA Bills Found</h3>
              <p className="text-xs">Prepare your first RA bill from verified work completions or contract BOQ items.</p>
              <Link href="/ra-bills/new">
                <Button size="sm" className="gap-2">
                  <Plus className="w-4 h-4" /> Prepare RA Bill
                </Button>
              </Link>
            </div>
          ) : (
            <div className="border rounded-md overflow-x-auto bg-card">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/70 text-muted-foreground font-semibold border-b">
                  <tr>
                    <th className="p-3">Bill Number</th>
                    <th className="p-3">Project / Contract</th>
                    <th className="p-3">Vendor</th>
                    <th className="p-3">Milestone</th>
                    <th className="p-3 text-right">Gross Amount</th>
                    <th className="p-3 text-right font-bold text-foreground">Net Payable</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {raBills.map((bill) => (
                    <tr key={bill.id} className="hover:bg-accent/30 transition-colors">
                      <td className="p-3 font-mono font-bold text-foreground">
                        <Link href={`/ra-bills/detail/${bill.id}`} className="hover:underline text-primary">
                          {bill.billNumber}
                        </Link>
                      </td>
                      <td className="p-3">
                        <span className="font-medium text-foreground block">{bill.projectName}</span>
                        <span className="text-[10px] text-muted-foreground">{bill.contractTitle}</span>
                      </td>
                      <td className="p-3 font-medium text-foreground">{bill.vendorName}</td>
                      <td className="p-3 text-muted-foreground">{bill.milestone || "—"}</td>
                      <td className="p-3 text-right text-muted-foreground">
                        ₹{(bill.grossAmount || 0).toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-bold text-emerald-600 text-sm">
                        ₹{(bill.netPayableAmount || 0).toLocaleString()}
                      </td>
                      <td className="p-3">
                        {bill.status === "approved" && (
                          <Badge className="bg-emerald-600 text-white text-[10px]">APPROVED</Badge>
                        )}
                        {bill.status === "submitted" && (
                          <Badge className="bg-blue-600 text-white text-[10px]">PENDING APPROVAL</Badge>
                        )}
                        {bill.status === "revision_requested" && (
                          <Badge variant="destructive" className="text-[10px]">REVISION REQ.</Badge>
                        )}
                        {bill.status === "invoice_generated" && (
                          <Badge className="bg-purple-600 text-white text-[10px]">INVOICED</Badge>
                        )}
                        {bill.status === "draft" && (
                          <Badge variant="outline" className="text-[10px]">DRAFT</Badge>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {(bill.status === "approved" || bill.status === "payment_certified") && (
                            <Link href="/finance/ar?tab=ra-bills">
                              <Button size="sm" className="h-7 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white">
                                <Receipt className="w-3 h-3" /> Issue Invoice
                              </Button>
                            </Link>
                          )}
                          <Link href={`/ra-bills/detail/${bill.id}`}>
                            <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                              <Eye className="w-3.5 h-3.5" /> View
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* ── TAB 2: Work Completions ── */}
        <TabsContent value="work-completions" className="space-y-4 pt-2">
          {loadingWcs ? (
            <div className="p-8 text-center text-muted-foreground">Loading work completions...</div>
          ) : (!workCompletions || workCompletions.length === 0) ? (
            <div className="p-12 text-center border rounded-lg bg-card text-muted-foreground space-y-3">
              <Layers className="w-10 h-10 mx-auto text-muted-foreground/40" />
              <h3 className="font-semibold text-foreground">No Work Completions Logged</h3>
              <p className="text-xs">Record on-site measured quantities for completed construction milestones.</p>
              <Link href="/ra-bills/work-completions/new">
                <Button size="sm" className="gap-2">
                  <Plus className="w-4 h-4" /> Log Completion
                </Button>
              </Link>
            </div>
          ) : (
            <div className="border rounded-md overflow-x-auto bg-card">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/70 text-muted-foreground font-semibold border-b">
                  <tr>
                    <th className="p-3">Ref Number</th>
                    <th className="p-3">Completion Title</th>
                    <th className="p-3">Project / Contract</th>
                    <th className="p-3">Contractor</th>
                    <th className="p-3">Completion Date</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {workCompletions.map((wc) => (
                    <tr key={wc.id} className="hover:bg-accent/30 transition-colors">
                      <td className="p-3 font-mono font-bold text-foreground">
                        <Link href={`/ra-bills/work-completions/${wc.id}`} className="hover:underline text-primary">
                          {wc.workCompletionNumber}
                        </Link>
                      </td>
                      <td className="p-3 font-medium text-foreground">{wc.title}</td>
                      <td className="p-3">
                        <span className="font-medium text-foreground block">{wc.projectName}</span>
                        <span className="text-[10px] text-muted-foreground">{wc.contractTitle}</span>
                      </td>
                      <td className="p-3 font-medium text-foreground">{wc.vendorName}</td>
                      <td className="p-3 text-muted-foreground">
                        {format(new Date(wc.completionDate), "dd MMM yyyy")}
                      </td>
                      <td className="p-3">
                        {wc.status === "verified" && (
                          <Badge className="bg-emerald-600 text-white text-[10px]">VERIFIED</Badge>
                        )}
                        {wc.status === "submitted" && (
                          <Badge className="bg-blue-600 text-white text-[10px]">AWAITING VERIFY</Badge>
                        )}
                        {wc.status === "correction_required" && (
                          <Badge variant="destructive" className="text-[10px]">CORRECTION REQ.</Badge>
                        )}
                        {wc.status === "draft" && (
                          <Badge variant="outline" className="text-[10px]">DRAFT</Badge>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <Link href={`/ra-bills/work-completions/${wc.id}`}>
                          <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                            <Eye className="w-3.5 h-3.5" /> Inspect JMR
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* ── TAB 3: Invoices & Payments ── */}
        <TabsContent value="invoices" className="space-y-4 pt-2">
          <div className="p-3.5 bg-blue-50/70 border border-blue-200 dark:bg-blue-950/30 dark:border-blue-900 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <Receipt className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <span>
                <strong>Client Receivables (AR) Hub:</strong> Official client tax invoices, payment collections, TDS deduction tracking, and aging analysis are managed in Accounts Receivable.
              </span>
            </div>
            <Link href="/finance/ar">
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1 border-blue-300 text-blue-700 hover:bg-blue-100/50 dark:border-blue-700 dark:text-blue-300 shrink-0">
                Open Client AR Hub <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          </div>

          {loadingInvoices ? (
            <div className="p-8 text-center text-muted-foreground">Loading invoices...</div>
          ) : (!invoices || invoices.length === 0) ? (
            <div className="p-12 text-center border rounded-lg bg-card text-muted-foreground space-y-3">
              <Receipt className="w-10 h-10 mx-auto text-muted-foreground/40" />
              <h3 className="font-semibold text-foreground">No Invoices Generated Yet</h3>
              <p className="text-xs">Invoices are generated upon PM approval of contractor RA bills.</p>
            </div>
          ) : (
            <div className="border rounded-md overflow-x-auto bg-card">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/70 text-muted-foreground font-semibold border-b">
                  <tr>
                    <th className="p-3">Invoice Number</th>
                    <th className="p-3">Client / Vendor</th>
                    <th className="p-3">Project / RA Ref</th>
                    <th className="p-3 text-right">Net Amount</th>
                    <th className="p-3 text-right text-emerald-600 font-bold">Paid to Date</th>
                    <th className="p-3 text-right text-amber-600 font-bold">Outstanding</th>
                    <th className="p-3">Due Date</th>
                    <th className="p-3">Payment Status</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-accent/30 transition-colors">
                      <td className="p-3 font-mono font-bold text-foreground">
                        <Link href={`/ra-bills/invoices/${inv.id}`} className="hover:underline text-primary">
                          {inv.invoiceNumber}
                        </Link>
                      </td>
                      <td className="p-3 font-medium text-foreground">{inv.clientName || inv.vendorName}</td>
                      <td className="p-3">
                        <span className="font-medium text-foreground block">{inv.projectName}</span>
                        {inv.billNumber && (
                          <span className="text-[10px] text-muted-foreground">RA: {inv.billNumber}</span>
                        )}
                      </td>
                      <td className="p-3 text-right font-medium">
                        ₹{(inv.netAmount || inv.amount).toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-bold text-emerald-600">
                        ₹{inv.totalPaidAmount.toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-bold text-amber-600">
                        ₹{inv.outstandingAmount.toLocaleString()}
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {format(new Date(inv.dueDate), "dd MMM yyyy")}
                      </td>
                      <td className="p-3">
                        {inv.status === "paid" && (
                          <Badge className="bg-emerald-600 text-white text-[10px]">PAID</Badge>
                        )}
                        {inv.status === "partially_paid" && (
                          <Badge className="bg-amber-600 text-white text-[10px]">PARTIAL</Badge>
                        )}
                        {inv.status === "sent" && (
                          <Badge className="bg-blue-600 text-white text-[10px]">SENT</Badge>
                        )}
                        {inv.status === "closed" && (
                          <Badge className="bg-slate-700 text-white text-[10px]">CLOSED</Badge>
                        )}
                        {inv.status === "draft" && (
                          <Badge variant="outline" className="text-[10px]">DRAFT</Badge>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <Link href={`/ra-bills/invoices/${inv.id}`}>
                          <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                            <CreditCard className="w-3.5 h-3.5" /> Track & Pay
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* ── TAB 4: Contracts ── */}
        <TabsContent value="contracts" className="space-y-4 pt-2">
          <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 dark:bg-indigo-950/30 dark:border-indigo-900 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <Building className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>
                <strong>Contracts & Scope BOQ Engine:</strong> Itemized work scopes, unit measurement rates, and retention percentages are configured in the Contracts manager.
              </span>
            </div>
            <Link href="/ra-bills/contracts">
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1 border-indigo-300 text-indigo-700 hover:bg-indigo-100/50 dark:border-indigo-700 dark:text-indigo-300 shrink-0">
                Manage Contracts & BOQ <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          </div>

          {loadingContracts ? (
            <div className="p-8 text-center text-muted-foreground">Loading contracts...</div>
          ) : (!contracts || contracts.length === 0) ? (
            <div className="p-12 text-center border rounded-lg bg-card text-muted-foreground space-y-3">
              <Building className="w-10 h-10 mx-auto text-muted-foreground/40" />
              <h3 className="font-semibold text-foreground">No Contracts Found</h3>
              <p className="text-xs">Create your first vendor work contract to start managing BOQ items.</p>
              <Link href="/ra-bills/contracts">
                <Button size="sm" className="gap-2">
                  <Plus className="w-4 h-4" /> Create Contract
                </Button>
              </Link>
            </div>
          ) : (
            <div className="border rounded-md overflow-x-auto bg-card">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/70 text-muted-foreground font-semibold border-b">
                  <tr>
                    <th className="p-3">Contract #</th>
                    <th className="p-3">Work Title</th>
                    <th className="p-3">Project</th>
                    <th className="p-3">Vendor / Contractor</th>
                    <th className="p-3 text-right">Total Value</th>
                    <th className="p-3">Retention %</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {contracts.map((c) => (
                    <tr key={c.id} className="hover:bg-accent/30 transition-colors">
                      <td className="p-3 font-mono font-bold text-foreground">{c.contractNumber}</td>
                      <td className="p-3 font-medium text-foreground">{c.title}</td>
                      <td className="p-3 font-medium text-foreground">{c.projectName}</td>
                      <td className="p-3 text-muted-foreground">{c.vendorName}</td>
                      <td className="p-3 text-right font-bold text-emerald-600">
                        ₹{(c.totalAmount || 0).toLocaleString()}
                      </td>
                      <td className="p-3 font-medium">{c.retentionPercent}%</td>
                      <td className="p-3">
                        <Badge variant={c.status === "active" ? "default" : "secondary"}>
                          {c.status.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="p-3 text-right">
                        <Link href="/ra-bills/contracts">
                          <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                            Manage BOQ <ArrowRight className="w-3 h-3" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
