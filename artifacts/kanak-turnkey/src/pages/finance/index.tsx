import { useState, useMemo } from "react";
import { Link, useSearch, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListExpenses,
  useListInvoices,
  useListVendorInvoices,
  useListFinancialInstruments,
  useListRaBills,
  useListPurchaseOrders,
  useContracts,
  useUpdateRaBill,
  useUpdateInvoice,
  useUpdateVendorInvoice,
  useExpiringFinancialInstrumentsAlerts,
  getListRaBillsQueryKey,
  getListInvoicesQueryKey,
  getListVendorInvoicesQueryKey,
  getListFinancialInstrumentsQueryKey,
  getExpiringFinancialInstrumentsAlertsQueryKey,
  getGetDashboardSummaryQueryKey,
} from "@workspace/api-client-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  FileText,
  Paperclip,
  Check,
  X,
  Send,
  Bell,
  CheckSquare,
  Lock,
  ShieldCheck,
  AlertCircle,
  AlertTriangle,
  Calendar,
  CreditCard,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Wallet,
  Receipt,
  Landmark,
  BadgePercent,
  Layers,
  Building,
  Clock,
  ArrowUpRight,
  Shield,
  ShieldAlert,
  ExternalLink,
  RefreshCw,
  FileCheck,
} from "lucide-react";
import { format } from "date-fns";
import {
  NewExpenseDialog,
  NewFinancialInstrumentDialog,
  RenewFinancialInstrumentDialog,
  ReleaseFinancialInstrumentDialog,
} from "@/components/dialogs/finance-dialogs";
import {
  RaiseDiscrepancyDialog,
  RecordPaymentDialog,
  GenerateInvoiceFromRaBillDialog,
} from "@/components/dialogs/finance-workflow-dialogs";
import {
  DocumentPreviewModal,
  DocumentPreviewData,
} from "@/components/dialogs/document-preview-modal";

const INR = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export default function Finance() {
  const qc = useQueryClient();
  const search = useSearch();
  const [, setLocation] = useLocation();
  const searchTab = new URLSearchParams(search).get("tab") || "overview";
  const [activeTab, setActiveTab] = useState(searchTab);
  const [instrumentFilter, setInstrumentFilter] = useState<"all" | "expiring30" | "active" | "released">("all");

  const [previewDoc, setPreviewDoc] = useState<DocumentPreviewData | null>(null);
  const { data: raBills, isLoading: loadingRaBills } = useListRaBills();
  const { data: expenses, isLoading: loadingExpenses } = useListExpenses();
  const { data: invoices, isLoading: loadingInvoices } = useListInvoices();
  const { data: vendorInvoices, isLoading: loadingVendorInvoices } = useListVendorInvoices();
  const { data: instruments, isLoading: loadingInstruments } = useListFinancialInstruments();
  const { data: expiringAlerts, isLoading: loadingExpiringAlerts } = useExpiringFinancialInstrumentsAlerts();
  const { data: purchaseOrders } = useListPurchaseOrders();
  const { data: contracts } = useContracts();

  const updateRaBill = useUpdateRaBill();
  const updateInvoice = useUpdateInvoice();
  const updateVendorInvoice = useUpdateVendorInvoice();

  // Helper function to build PO lookup map
  const poMap = useMemo(
    () => new Map((Array.isArray(purchaseOrders) ? purchaseOrders : []).map((po) => [po.id, po])),
    [purchaseOrders]
  );

  const raBillsList = useMemo(() => (Array.isArray(raBills) ? raBills : []), [raBills]);
  const expensesList = useMemo(() => (Array.isArray(expenses) ? expenses : []), [expenses]);
  const invoicesList = useMemo(() => (Array.isArray(invoices) ? invoices : []), [invoices]);
  const vendorInvoicesList = useMemo(() => (Array.isArray(vendorInvoices) ? vendorInvoices : []), [vendorInvoices]);
  const instrumentsList = useMemo(() => (Array.isArray(instruments) ? instruments : []), [instruments]);
  const contractsList = useMemo(() => (Array.isArray(contracts) ? contracts : []), [contracts]);

  // Enriched instruments with expiry calculation fallback and alert states
  const enrichedInstruments = useMemo(() => {
    const today = new Date("2026-10-23T00:00:00Z");
    return instrumentsList.map((inst) => {
      let days = (inst as any).daysToExpiry;
      if (days === undefined && inst.expiryDate) {
        const exp = new Date(inst.expiryDate);
        days = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      }
      const isExpSoon =
        (inst as any).isExpiringSoon !== undefined
          ? (inst as any).isExpiringSoon
          : inst.status === "active" && days !== undefined && days <= 30 && days >= 0;
      const isExp =
        (inst as any).isExpired !== undefined
          ? (inst as any).isExpired
          : inst.status === "active" && days !== undefined && days < 0;
      let level = (inst as any).alertLevel;
      if (!level) {
        if (inst.status !== "active") level = "none";
        else if (days !== undefined && days < 0) level = "critical";
        else if (days !== undefined && days <= 15) level = "critical";
        else if (days !== undefined && days <= 30) level = "warning";
        else level = "none";
      }
      return {
        ...inst,
        daysToExpiry: days,
        isExpiringSoon: isExpSoon,
        isExpired: isExp,
        alertLevel: level,
      };
    });
  }, [instrumentsList]);

  const filteredInstruments = useMemo(() => {
    if (instrumentFilter === "expiring30") {
      return enrichedInstruments.filter(
        (i) => i.status === "active" && i.daysToExpiry !== undefined && i.daysToExpiry <= 30
      );
    }
    if (instrumentFilter === "active") {
      return enrichedInstruments.filter((i) => i.status === "active");
    }
    if (instrumentFilter === "released") {
      return enrichedInstruments.filter((i) => i.status === "released");
    }
    return enrichedInstruments;
  }, [enrichedInstruments, instrumentFilter]);

  // Aggregate KPI summary
  const totalClientBilled = useMemo(
    () => invoicesList.reduce((sum, inv) => sum + Number(inv.amount || 0), 0),
    [invoicesList]
  );
  const totalClientCollected = useMemo(
    () =>
      invoicesList
        .filter((inv) => inv.status === "paid" || inv.status === "closed")
        .reduce((sum, inv) => sum + Number(inv.amount || 0), 0),
    [invoicesList]
  );
  const totalClientOutstanding = Math.max(0, totalClientBilled - totalClientCollected);

  const totalVendorBilled = useMemo(
    () => vendorInvoicesList.reduce((sum, vi) => sum + Number(vi.amount || 0), 0),
    [vendorInvoicesList]
  );
  const totalVendorPaid = useMemo(
    () =>
      vendorInvoicesList
        .filter((vi) => vi.status === "paid")
        .reduce((sum, vi) => sum + Number(vi.amount || 0), 0),
    [vendorInvoicesList]
  );
  const totalVendorOutstanding = Math.max(0, totalVendorBilled - totalVendorPaid);

  const totalSiteExpenses = useMemo(
    () => expensesList.reduce((sum, exp) => sum + Number(exp.amount || 0), 0),
    [expensesList]
  );
  const totalActiveInstruments = useMemo(
    () =>
      instrumentsList
        .filter((i) => i.status === "active")
        .reduce((sum, i) => sum + Number(i.amount || 0), 0),
    [instrumentsList]
  );

  // Workflow Action Queues
  // 1. Certified / Approved RA Bills awaiting Client Tax Invoice
  const raBillsAwaitingInvoicing = useMemo(
    () => raBillsList.filter((b) => b.status === "approved" || b.status === "payment_certified"),
    [raBillsList]
  );

  // 2. Client Invoices pending collection
  const invoicesPendingPayment = useMemo(
    () => invoicesList.filter((i) => i.status === "sent" || i.status === "draft" || i.status === "overdue"),
    [invoicesList]
  );

  // 3. Vendor Invoices pending approval / payment
  const vendorInvoicesPendingAction = useMemo(
    () => vendorInvoicesList.filter((vi) => vi.status === "received" || vi.status === "draft" || vi.status === "approved" || vi.status === "scheduled"),
    [vendorInvoicesList]
  );

  const handleRaStatusUpdate = async (id: number, status: string) => {
    await updateRaBill.mutateAsync({ id, data: { status } });
    await Promise.all([
      qc.invalidateQueries({ queryKey: getListRaBillsQueryKey() }),
      qc.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() }),
    ]);
  };

  const handleInvoiceStatusUpdate = async (id: number, data: Record<string, any>) => {
    await updateInvoice.mutateAsync({ id, data });
    await Promise.all([
      qc.invalidateQueries({ queryKey: getListInvoicesQueryKey() }),
      qc.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() }),
    ]);
  };

  const handleVendorInvoiceStatusUpdate = async (id: number, data: Record<string, any>) => {
    await updateVendorInvoice.mutateAsync({ id, data });
    await Promise.all([
      qc.invalidateQueries({ queryKey: getListVendorInvoicesQueryKey() }),
      qc.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() }),
    ]);
  };

  return (
    <div className="space-y-6">
      {/* ── Executive Header ── */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Wallet className="w-4 h-4" />
            </div>
            Commercial & Finance Hub
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Unified Turnkey Financial Operations: Client Receivables (AR), Vendor Payables (AP), Site Field Expenses & Bank Guarantees
          </p>
        </div>

        {/* Global Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/ra-bills/new">
            <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs border-primary/30 text-primary hover:bg-primary/5">
              <Plus className="w-3.5 h-3.5" /> Prepare RA Bill
            </Button>
          </Link>
          <NewExpenseDialog
            trigger={
              <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs">
                <Plus className="w-3.5 h-3.5" /> Record Expense
              </Button>
            }
          />
          <NewFinancialInstrumentDialog
            trigger={
              <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs">
                <Plus className="w-3.5 h-3.5" /> Add Guarantee / LC
              </Button>
            }
          />
          <Link href="/finance/ar">
            <Button size="sm" className="gap-1.5 h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
              <TrendingUp className="w-3.5 h-3.5" /> Client AR Hub
            </Button>
          </Link>
          <Link href="/finance/ap">
            <Button size="sm" className="gap-1.5 h-8 text-xs bg-purple-600 hover:bg-purple-700 text-white">
              <TrendingDown className="w-3.5 h-3.5" /> Vendor AP Hub
            </Button>
          </Link>
        </div>
      </div>

      {/* ── Unified 5-Stage Turnkey Commercial Lifecycle Navigator ── */}
      <Card className="border bg-gradient-to-r from-blue-950/10 via-emerald-950/10 to-purple-950/10 dark:from-blue-950/30 dark:via-emerald-950/30 dark:to-purple-950/30 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                Unified Turnkey Billing & Commercial Workflow
              </span>
            </div>
            <Badge variant="outline" className="text-[11px] font-medium border-primary/20 text-primary">
              End-to-End Consolidated Pipeline
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {/* Stage 1: Contract & Scope BOQ */}
            <Link href="/ra-bills/contracts" className="group">
              <div className="bg-card/90 hover:bg-card p-3 rounded-lg border hover:border-blue-500/50 hover:shadow-sm transition-all h-full flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">1. CONTRACT SETUP</span>
                  <Building className="w-3.5 h-3.5 text-blue-500" />
                </div>
                <div>
                  <div className="font-semibold text-xs text-foreground group-hover:text-blue-600 transition-colors">
                    Contracts & BOQ
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {contractsList.length} registered contracts
                  </div>
                </div>
                <div className="mt-2.5 pt-2 border-t flex items-center justify-between text-[10px] font-medium text-blue-600">
                  <span>Manage BOQ Items</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </Link>

            {/* Stage 2: Measurement (JMR) */}
            <Link href="/ra-bills?tab=work-completions" className="group">
              <div className="bg-card/90 hover:bg-card p-3 rounded-lg border hover:border-emerald-500/50 hover:shadow-sm transition-all h-full flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">2. MEASUREMENT</span>
                  <Layers className="w-3.5 h-3.5 text-emerald-500" />
                </div>
                <div>
                  <div className="font-semibold text-xs text-foreground group-hover:text-emerald-600 transition-colors">
                    Work Measurements (JMR)
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    Site measurements & sign-offs
                  </div>
                </div>
                <div className="mt-2.5 pt-2 border-t flex items-center justify-between text-[10px] font-medium text-emerald-600">
                  <span>Verify JMR</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </Link>

            {/* Stage 3: Client RA Bills */}
            <Link href="/ra-bills" className="group">
              <div className="bg-card/90 hover:bg-card p-3 rounded-lg border hover:border-indigo-500/50 hover:shadow-sm transition-all h-full flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">3. PROGRESS BILLING</span>
                  <FileText className="w-3.5 h-3.5 text-indigo-500" />
                </div>
                <div>
                  <div className="font-semibold text-xs text-foreground group-hover:text-indigo-600 transition-colors">
                    Client RA Bills
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {raBillsList.length} bills ({raBillsAwaitingInvoicing.length} ready to invoice)
                  </div>
                </div>
                <div className="mt-2.5 pt-2 border-t flex items-center justify-between text-[10px] font-medium text-indigo-600">
                  <span>Prepare & Certify</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </Link>

            {/* Stage 4: Client AR Invoicing */}
            <Link href="/finance/ar" className="group">
              <div className="bg-card/90 hover:bg-card p-3 rounded-lg border hover:border-emerald-500/50 hover:shadow-sm transition-all h-full flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">4. CLIENT INFLOW (AR)</span>
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <div>
                  <div className="font-semibold text-xs text-foreground group-hover:text-emerald-600 transition-colors">
                    Accounts Receivable
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {invoicesList.length} tax invoices ({INR.format(totalClientOutstanding)} due)
                  </div>
                </div>
                <div className="mt-2.5 pt-2 border-t flex items-center justify-between text-[10px] font-medium text-emerald-600">
                  <span>Collect Payments</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </Link>

            {/* Stage 5: Vendor AP Disbursements */}
            <Link href="/finance/ap" className="group">
              <div className="bg-card/90 hover:bg-card p-3 rounded-lg border hover:border-purple-500/50 hover:shadow-sm transition-all h-full flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">5. VENDOR OUTFLOW (AP)</span>
                  <TrendingDown className="w-3.5 h-3.5 text-purple-600" />
                </div>
                <div>
                  <div className="font-semibold text-xs text-foreground group-hover:text-purple-600 transition-colors">
                    Accounts Payable
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {vendorInvoicesList.length} vendor bills (3-Way PO match)
                  </div>
                </div>
                <div className="mt-2.5 pt-2 border-t flex items-center justify-between text-[10px] font-medium text-purple-600">
                  <span>Verify & Pay</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </Link>
          </div>
        </div>
      </Card>

      {/* ── Financial Health KPIs ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* AR Collection */}
        <Card className="shadow-sm border-l-4 border-l-blue-600">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Client Billing (AR)</span>
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-foreground font-mono">
              {INR.format(totalClientCollected)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Collected of <span className="font-semibold text-foreground">{INR.format(totalClientBilled)}</span> billed
            </p>
          </CardContent>
        </Card>

        {/* AP Payables */}
        <Card className="shadow-sm border-l-4 border-l-purple-600">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Vendor Payables (AP)</span>
              <div className="p-2 rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400">
                <TrendingDown className="w-4 h-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-foreground font-mono">
              {INR.format(totalVendorPaid)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Disbursed of <span className="font-semibold text-foreground">{INR.format(totalVendorBilled)}</span> invoices
            </p>
          </CardContent>
        </Card>

        {/* Site Expenses */}
        <Card className="shadow-sm border-l-4 border-l-amber-600">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Site Operating Expenses</span>
              <div className="p-2 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
                <Receipt className="w-4 h-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-foreground font-mono">
              {INR.format(totalSiteExpenses)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="font-semibold text-foreground">{expensesList.length}</span> total field vouchers logged
            </p>
          </CardContent>
        </Card>

        {/* Financial Instruments */}
        <Card className="shadow-sm border-l-4 border-l-emerald-600">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Bank Guarantees / LCs</span>
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                <Landmark className="w-4 h-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-foreground font-mono">
              {INR.format(totalActiveInstruments)}
            </div>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">
                  {instrumentsList.filter((i) => i.status === "active").length}
                </span>{" "}
                active securities
              </p>
              {expiringAlerts && expiringAlerts.expiring30DaysCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("instruments");
                    setInstrumentFilter("expiring30");
                  }}
                  className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-800 bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/60 dark:text-amber-300 px-2 py-0.5 rounded-full border border-amber-300 transition-colors"
                >
                  <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                  <span>{expiringAlerts.expiring30DaysCount} Expiring (&lt;30d)</span>
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Tabs for Unified Management ── */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 max-w-lg h-auto p-1 bg-muted/60">
          <TabsTrigger value="overview" className="text-xs py-2">
            Pipeline Queues
          </TabsTrigger>
          <TabsTrigger value="expenses" className="text-xs py-2">
            Site Expenses ({expensesList.length})
          </TabsTrigger>
          <TabsTrigger value="instruments" className="text-xs py-2 flex items-center justify-center gap-1.5">
            <span>Guarantees & LC ({instrumentsList.length})</span>
            {expiringAlerts && expiringAlerts.expiring30DaysCount > 0 && (
              <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-500 text-white">
                {expiringAlerts.expiring30DaysCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── 1. PIPELINE OVERVIEW & ACTION QUEUES ── */}
        <TabsContent value="overview" className="space-y-6 pt-2">
          {/* Quick Hub Jump Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/finance/ar" className="block group">
              <Card className="h-full border hover:border-blue-500/50 hover:shadow-md transition-all">
                <CardContent className="p-5 flex items-center justify-between">
                  <div className="flex items-start gap-3.5">
                    <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 shrink-0">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm text-foreground group-hover:text-blue-600 transition-colors">
                          Accounts Receivable (AR) Hub
                        </h3>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 text-[10px]">
                          Client Inflow
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Client tax invoices, payment recordings with TDS & bank ref, invoice reconciliation, and 90-day aging buckets.
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-blue-600 group-hover:translate-x-1 transition-all shrink-0 ml-4" />
                </CardContent>
              </Card>
            </Link>

            <Link href="/finance/ap" className="block group">
              <Card className="h-full border hover:border-purple-500/50 hover:shadow-md transition-all">
                <CardContent className="p-5 flex items-center justify-between">
                  <div className="flex items-start gap-3.5">
                    <div className="p-2.5 rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400 shrink-0">
                      <TrendingDown className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm text-foreground group-hover:text-purple-600 transition-colors">
                          Accounts Payable (AP) Hub
                        </h3>
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-400 text-[10px]">
                          Vendor Outflow
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Process vendor bills, 3-way match (PO + GRN + Bill), PM certifications, discrepancies, and scheduled releases.
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-purple-600 group-hover:translate-x-1 transition-all shrink-0 ml-4" />
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* 30-Day Financial Instruments Expiry Alert Banner */}
          {expiringAlerts && expiringAlerts.expiring30DaysCount > 0 && (
            <Card className="border-amber-400/80 bg-amber-50/70 dark:bg-amber-950/30 shadow-sm overflow-hidden">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-amber-500/20 text-amber-800 dark:text-amber-300 rounded-lg shrink-0 mt-0.5">
                      <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-sm text-amber-900 dark:text-amber-200">
                          Attention: {expiringAlerts.expiring30DaysCount} Financial Instrument{expiringAlerts.expiring30DaysCount > 1 ? "s" : ""} Expiring Within 30 Days
                        </h4>
                        <Badge className="bg-amber-600 text-white text-[10px] font-bold">
                          {INR.format(expiringAlerts.expiring30DaysAmount)} Value at Risk
                        </Badge>
                      </div>
                      <p className="text-xs text-amber-800/80 dark:text-amber-300/80 mt-1">
                        Bank Guarantees and LCs must be renewed or discharged before expiry to avoid liquidated damages, invocation, or non-compliance.
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {expiringAlerts.expiringInstruments.map((inst) => (
                          <div
                            key={inst.id}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/90 dark:bg-slate-900/90 rounded border border-amber-300 dark:border-amber-700/60 text-xs shadow-xs"
                          >
                            <span className="font-mono font-bold text-foreground">{inst.instrumentNumber}</span>
                            <span className="text-muted-foreground">({inst.projectName || inst.bankName})</span>
                            <span className="font-mono font-semibold text-primary">{INR.format(Number(inst.amount))}</span>
                            <Badge
                              variant="outline"
                              className={`text-[10px] py-0 px-1.5 ${
                                inst.alertLevel === "critical"
                                  ? "bg-rose-100 text-rose-700 border-rose-300 font-bold"
                                  : "bg-amber-100 text-amber-700 border-amber-300 font-medium"
                              }`}
                            >
                              ⚠️ {inst.daysToExpiry} days left
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      setActiveTab("instruments");
                      setInstrumentFilter("expiring30");
                    }}
                    className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white text-xs gap-1.5"
                  >
                    View & Renew Instruments <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Queue 1: Approved RA Bills Awaiting Client Tax Invoice */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  Certified RA Bills Ready for Tax Invoicing
                </CardTitle>
                <CardDescription className="text-xs">
                  Running account bills approved by PM and payment-certified, awaiting GST Tax Invoice generation
                </CardDescription>
              </div>
              <Link href="/ra-bills">
                <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
                  View Full RA Bills Registry <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0 border-t">
              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left">
                  <thead className="bg-muted/50 text-muted-foreground border-b">
                    <tr>
                      <th className="p-3 font-medium">Bill #</th>
                      <th className="p-3 font-medium">Project</th>
                      <th className="p-3 font-medium">Milestone / Scope</th>
                      <th className="p-3 font-medium text-right">Certified Amount</th>
                      <th className="p-3 font-medium text-center">Status</th>
                      <th className="p-3 font-medium text-right">Invoicing Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {raBillsAwaitingInvoicing.length > 0 ? (
                      raBillsAwaitingInvoicing.map((bill) => (
                        <tr key={bill.id} className="hover:bg-muted/20 transition-colors">
                          <td className="p-3 font-mono font-semibold text-primary">
                            <Link href={`/ra-bills/detail/${bill.id}`} className="hover:underline">
                              {bill.billNumber}
                            </Link>
                          </td>
                          <td className="p-3 font-medium">{bill.projectName || "—"}</td>
                          <td className="p-3">
                            <div className="font-medium text-foreground">{bill.milestone || "General RA Bill"}</div>
                            {bill.description && (
                              <div className="text-[11px] text-muted-foreground line-clamp-1">
                                {bill.description}
                              </div>
                            )}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-foreground">
                            {INR.format(Number(bill.amount))}
                          </td>
                          <td className="p-3 text-center">
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 text-[10px] capitalize font-semibold">
                              {bill.status.replace("_", " ")}
                            </Badge>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <GenerateInvoiceFromRaBillDialog
                                raBill={{
                                  id: bill.id,
                                  projectId: bill.projectId,
                                  billNumber: bill.billNumber,
                                  amount: bill.amount,
                                  milestone: bill.milestone,
                                  description: bill.description,
                                  documentUrl: (bill as any).documentUrl,
                                  projectName: bill.projectName,
                                }}
                                trigger={
                                  <Button size="sm" className="h-7 text-xs gap-1 bg-primary text-primary-foreground hover:bg-primary/90">
                                    <Receipt className="w-3 h-3" /> Generate Invoice
                                  </Button>
                                }
                              />
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-muted-foreground">
                          <CheckCircle2 className="w-6 h-6 mx-auto mb-1 text-emerald-500 opacity-80" />
                          All certified RA bills have been invoiced. New progress bills can be initiated in the{" "}
                          <Link href="/ra-bills/new" className="text-primary underline font-medium">
                            Client RA Bills Engine
                          </Link>.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Action Queue 2: Pending Client Collections & Overdue Invoices */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  Client Receivables Awaiting Remittance
                </CardTitle>
                <CardDescription className="text-xs">
                  Tax invoices issued to clients pending payment confirmation or overdue follow-up
                </CardDescription>
              </div>
              <Link href="/finance/ar">
                <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
                  Go to Client AR Hub <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0 border-t">
              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left">
                  <thead className="bg-muted/50 text-muted-foreground border-b">
                    <tr>
                      <th className="p-3 font-medium">Invoice #</th>
                      <th className="p-3 font-medium">Project</th>
                      <th className="p-3 font-medium">Due Date</th>
                      <th className="p-3 font-medium text-right">Amount</th>
                      <th className="p-3 font-medium text-center">Status</th>
                      <th className="p-3 font-medium text-right">Collection Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {invoicesPendingPayment.length > 0 ? (
                      invoicesPendingPayment.slice(0, 5).map((invoice) => (
                        <tr key={invoice.id} className="hover:bg-muted/20 transition-colors">
                          <td className="p-3 font-mono font-semibold text-primary">
                            <Link href={`/ra-bills/invoices/${invoice.id}`} className="hover:underline">
                              {invoice.invoiceNumber}
                            </Link>
                          </td>
                          <td className="p-3 font-medium">{invoice.projectName || "—"}</td>
                          <td className="p-3 text-muted-foreground">
                            {invoice.dueDate ? format(new Date(invoice.dueDate), "MMM d, yyyy") : "—"}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-foreground">
                            {INR.format(Number(invoice.amount))}
                          </td>
                          <td className="p-3 text-center">
                            <Badge
                              variant="outline"
                              className={`text-[10px] capitalize font-semibold ${
                                invoice.status === "overdue"
                                  ? "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-400"
                                  : "bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/40 dark:text-blue-400"
                              }`}
                            >
                              {invoice.status}
                            </Badge>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <RecordPaymentDialog
                                type="client"
                                id={invoice.id}
                                invoiceNumber={invoice.invoiceNumber}
                                amount={invoice.amount}
                                trigger={
                                  <Button size="sm" className="h-7 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white">
                                    <CreditCard className="w-3 h-3" /> Record Payment
                                  </Button>
                                }
                              />
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-muted-foreground">
                          No pending receivables found. All issued client invoices are fully settled.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── 2. SITE EXPENSES TAB ── */}
        <TabsContent value="expenses">
          <Card className="shadow-sm">
            <CardHeader className="pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-amber-600" />
                  Site Field Expenses & Imprest
                </CardTitle>
                <CardDescription className="text-xs">
                  Petty cash, site consumables, equipment fuel, transit and operational vouchers
                </CardDescription>
              </div>
              <NewExpenseDialog
                trigger={
                  <Button size="sm" className="gap-1.5 h-8 text-xs">
                    <Plus className="w-3.5 h-3.5" /> Record Expense
                  </Button>
                }
              />
            </CardHeader>
            <CardContent className="p-0 border-t">
              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left">
                  <thead className="bg-muted/50 text-muted-foreground border-b">
                    <tr>
                      <th className="p-3 font-medium">Date</th>
                      <th className="p-3 font-medium">Project</th>
                      <th className="p-3 font-medium">Category</th>
                      <th className="p-3 font-medium">Description</th>
                      <th className="p-3 font-medium text-right">Amount</th>
                      <th className="p-3 font-medium text-center">Receipt</th>
                      <th className="p-3 font-medium text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {expensesList.map((expense) => (
                      <tr key={expense.id} className="hover:bg-muted/20 transition-colors">
                        <td className="p-3 text-muted-foreground">
                          {expense.expenseDate
                            ? format(new Date(expense.expenseDate), "MMM d, yyyy")
                            : "—"}
                        </td>
                        <td className="p-3 font-medium">{expense.projectName || "—"}</td>
                        <td className="p-3 capitalize">
                          <span className="font-medium text-foreground">{expense.category}</span>
                        </td>
                        <td className="p-3 text-muted-foreground">{expense.description}</td>
                        <td className="p-3 text-right font-mono font-bold text-foreground">
                          {INR.format(Number(expense.amount))}
                        </td>
                        <td className="p-3 text-center">
                          {(expense as any).receiptUrl || (expense as any).documentUrl ? (
                            <button
                              type="button"
                              onClick={() =>
                                setPreviewDoc({
                                  url: (expense as any).receiptUrl || (expense as any).documentUrl,
                                  title: `Receipt — ${expense.description || expense.category}`,
                                  type: "receipt",
                                  description: expense.description,
                                  amount: expense.amount,
                                  date: expense.expenseDate || undefined,
                                  projectName: expense.projectName || undefined,
                                  category: expense.category,
                                  status: expense.status,
                                })
                              }
                              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline bg-blue-50 dark:bg-blue-950/40 dark:text-blue-300 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800"
                            >
                              <Paperclip className="w-3.5 h-3.5" /> View
                            </button>
                          ) : (
                            <span className="text-[11px] text-muted-foreground italic">None</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <Badge
                            variant="outline"
                            className={`text-[10px] capitalize font-semibold ${
                              expense.status === "approved" || expense.status === "reimbursed"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400"
                                : expense.status === "rejected"
                                ? "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-400"
                                : "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-400"
                            }`}
                          >
                            {expense.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                    {expensesList.length === 0 && !loadingExpenses && (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-muted-foreground">
                          No site expenses recorded yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── 3. FINANCIAL INSTRUMENTS TAB ── */}
        <TabsContent value="instruments" className="space-y-4">
          {/* Top Expiry Alert Box */}
          {expiringAlerts && expiringAlerts.expiring30DaysCount > 0 && (
            <Card className="border-amber-400 bg-amber-50/70 dark:bg-amber-950/30 shadow-sm">
              <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/20 text-amber-800 dark:text-amber-300 shrink-0">
                    <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-amber-950 dark:text-amber-200">
                        {expiringAlerts.expiring30DaysCount} Bank Guarantee{expiringAlerts.expiring30DaysCount > 1 ? "s" : ""} Expiring Within 30 Days
                      </span>
                      <Badge className="bg-amber-600 text-white text-[10px] font-bold">
                        {INR.format(expiringAlerts.expiring30DaysAmount)} at risk
                      </Badge>
                    </div>
                    <p className="text-xs text-amber-900/80 dark:text-amber-300/80 mt-0.5">
                      Urgent action required: obtain bank validity extensions or collect client DLP discharge letters prior to the expiry cutoff.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant={instrumentFilter === "expiring30" ? "default" : "outline"}
                    onClick={() =>
                      setInstrumentFilter(instrumentFilter === "expiring30" ? "all" : "expiring30")
                    }
                    className={`h-8 text-xs gap-1.5 ${
                      instrumentFilter === "expiring30"
                        ? "bg-amber-600 hover:bg-amber-700 text-white"
                        : "border-amber-400 text-amber-800 hover:bg-amber-100"
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {instrumentFilter === "expiring30" ? "Show All Instruments" : "Filter Expiring (<30d)"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="shadow-sm">
            <CardHeader className="pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-emerald-600" />
                  Bank Guarantees & Letters of Credit
                </CardTitle>
                <CardDescription className="text-xs">
                  Mobilization ABG, Performance BG (PBG), Retention BG, and procurement letters of credit
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {/* Filter Pills */}
                <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border text-xs">
                  <button
                    type="button"
                    onClick={() => setInstrumentFilter("all")}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                      instrumentFilter === "all"
                        ? "bg-background text-foreground shadow-xs font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    All ({enrichedInstruments.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setInstrumentFilter("expiring30")}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${
                      instrumentFilter === "expiring30"
                        ? "bg-amber-600 text-white shadow-xs font-semibold"
                        : "text-amber-700 dark:text-amber-400 hover:bg-amber-100/50"
                    }`}
                  >
                    <AlertTriangle className="w-3 h-3" />
                    Expiring &lt;30d ({expiringAlerts?.expiring30DaysCount || 0})
                  </button>
                  <button
                    type="button"
                    onClick={() => setInstrumentFilter("active")}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                      instrumentFilter === "active"
                        ? "bg-background text-foreground shadow-xs font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Active ({enrichedInstruments.filter((i) => i.status === "active").length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setInstrumentFilter("released")}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                      instrumentFilter === "released"
                        ? "bg-background text-foreground shadow-xs font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Released ({enrichedInstruments.filter((i) => i.status === "released").length})
                  </button>
                </div>

                <NewFinancialInstrumentDialog
                  trigger={
                    <Button size="sm" className="gap-1.5 h-8 text-xs">
                      <Plus className="w-3.5 h-3.5" /> Add Instrument
                    </Button>
                  }
                />
              </div>
            </CardHeader>
            <CardContent className="p-0 border-t">
              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left">
                  <thead className="bg-muted/50 text-muted-foreground border-b">
                    <tr>
                      <th className="p-3 font-medium">Instrument No.</th>
                      <th className="p-3 font-medium">Type</th>
                      <th className="p-3 font-medium">Project</th>
                      <th className="p-3 font-medium">Issuing Bank</th>
                      <th className="p-3 font-medium text-right">Amount</th>
                      <th className="p-3 font-medium">Expiry & Alert</th>
                      <th className="p-3 font-medium text-center">Status</th>
                      <th className="p-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredInstruments.map((inst) => {
                      const isExpSoon =
                        inst.isExpiringSoon ||
                        (inst.status === "active" &&
                          inst.daysToExpiry !== undefined &&
                          inst.daysToExpiry <= 30 &&
                          inst.daysToExpiry >= 0);
                      const isExp =
                        inst.isExpired ||
                        (inst.status === "active" &&
                          inst.daysToExpiry !== undefined &&
                          inst.daysToExpiry < 0);
                      return (
                        <tr
                          key={inst.id}
                          className={`hover:bg-muted/20 transition-colors ${
                            isExpSoon
                              ? "bg-amber-50/40 dark:bg-amber-950/20 border-l-4 border-l-amber-500"
                              : isExp
                              ? "bg-rose-50/40 dark:bg-rose-950/20 border-l-4 border-l-rose-500"
                              : ""
                          }`}
                        >
                          <td className="p-3 font-mono font-semibold text-primary">
                            <div>{inst.instrumentNumber}</div>
                            {inst.referenceNumber && inst.referenceNumber !== inst.instrumentNumber && (
                              <div className="text-[10px] text-muted-foreground font-normal">
                                Ref: {inst.referenceNumber}
                              </div>
                            )}
                          </td>
                          <td className="p-3">
                            <span className="font-semibold text-foreground capitalize">
                              {inst.instrumentType.replace(/_/g, " ")}
                            </span>
                            {(inst as any).bgSubType && (
                              <div className="text-[10px] text-muted-foreground capitalize">
                                {(inst as any).bgSubType.replace(/_/g, " ")}
                              </div>
                            )}
                          </td>
                          <td className="p-3 font-medium">{inst.projectName || "—"}</td>
                          <td className="p-3 text-muted-foreground">{inst.bankName || "—"}</td>
                          <td className="p-3 text-right font-mono font-bold text-foreground">
                            {INR.format(Number(inst.amount))}
                          </td>
                          <td className="p-3">
                            <div className="font-mono text-xs">
                              {inst.expiryDate
                                ? format(new Date(inst.expiryDate), "MMM d, yyyy")
                                : "—"}
                            </div>
                            {/* Expiry countdown badge */}
                            {inst.status === "active" && inst.daysToExpiry !== undefined && (
                              <div className="mt-1">
                                {inst.daysToExpiry < 0 ? (
                                  <Badge
                                    variant="outline"
                                    className="bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/50 dark:text-rose-400 text-[10px] font-bold"
                                  >
                                    🚨 Expired ({Math.abs(inst.daysToExpiry)}d ago)
                                  </Badge>
                                ) : inst.daysToExpiry <= 15 ? (
                                  <Badge
                                    variant="outline"
                                    className="bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/50 dark:text-rose-400 text-[10px] font-bold animate-pulse"
                                  >
                                    🚨 Expires in {inst.daysToExpiry} days
                                  </Badge>
                                ) : inst.daysToExpiry <= 30 ? (
                                  <Badge
                                    variant="outline"
                                    className="bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/50 dark:text-amber-400 text-[10px] font-semibold"
                                  >
                                    ⚠️ Expires in {inst.daysToExpiry} days
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="outline"
                                    className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 text-[10px]"
                                  >
                                    ✅ Valid ({inst.daysToExpiry}d)
                                  </Badge>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            <Badge
                              variant="outline"
                              className={`text-[10px] capitalize font-semibold ${
                                inst.status === "active"
                                  ? isExpSoon
                                    ? "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-400"
                                    : "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400"
                                  : inst.status === "released"
                                  ? "bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/40 dark:text-blue-400"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {inst.status}
                            </Badge>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {inst.status === "active" && (
                                <>
                                  <RenewFinancialInstrumentDialog
                                    instrument={{
                                      id: inst.id,
                                      instrumentNumber: inst.instrumentNumber,
                                      instrumentType: inst.instrumentType,
                                      bgSubType: (inst as any).bgSubType,
                                      amount: inst.amount,
                                      bankName: inst.bankName,
                                      expiryDate: inst.expiryDate,
                                      projectName: inst.projectName,
                                    }}
                                    trigger={
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-7 text-xs px-2 gap-1 border-amber-300 text-amber-800 hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-950/40"
                                      >
                                        <RefreshCw className="w-3 h-3 text-amber-600" /> Extend
                                      </Button>
                                    }
                                  />
                                  <ReleaseFinancialInstrumentDialog
                                    instrument={{
                                      id: inst.id,
                                      instrumentNumber: inst.instrumentNumber,
                                      instrumentType: inst.instrumentType,
                                      bgSubType: (inst as any).bgSubType,
                                      amount: inst.amount,
                                      bankName: inst.bankName,
                                      expiryDate: inst.expiryDate,
                                      projectName: inst.projectName,
                                    }}
                                    trigger={
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-7 text-xs px-2 gap-1 border-emerald-300 text-emerald-800 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-950/40"
                                      >
                                        <FileCheck className="w-3 h-3 text-emerald-600" /> Release
                                      </Button>
                                    }
                                  />
                                </>
                              )}
                              {inst.status === "released" && (
                                <span className="text-[11px] text-muted-foreground italic">Discharged</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredInstruments.length === 0 && !loadingInstruments && (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-muted-foreground">
                          {instrumentFilter === "expiring30" ? (
                            <div className="flex flex-col items-center justify-center gap-1.5">
                              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                              <span className="font-medium text-foreground">No instruments expiring in the next 30 days</span>
                              <span className="text-xs">All active bank guarantees and letters of credit have valid tenure beyond 30 days.</span>
                            </div>
                          ) : (
                            "No financial instruments found matching the selected filter."
                          )}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* In-page Document & Receipt Preview Modal */}
      <DocumentPreviewModal
        preview={previewDoc}
        onClose={() => setPreviewDoc(null)}
      />
    </div>
  );
}
