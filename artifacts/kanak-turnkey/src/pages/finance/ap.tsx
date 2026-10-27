import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  TrendingDown,
  TrendingUp,
  ArrowLeft,
  IndianRupee,
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  CreditCard,
  ArrowDownRight,
  BarChart3,
  Receipt,
  Shield,
  Search,
  AlertCircle,
  CalendarClock,
  Ban,
  ThumbsUp,
  CircleDollarSign,
} from "lucide-react";
import {
  useAPSummary,
  useAPRaBills,
  useAPInvoices,
  useAPPayments,
  useAPDiscrepancies,
  useThreeWayMatch,
  usePMApproveAPInvoice,
  useFinanceVerifyAPInvoice,
  useApproveAPPayment,
  useScheduleAPPayment,
  usePayVendor,
  useReconcileAPInvoice,
  useCloseAPInvoice,
  useRequestVendorClarification,
  useRaiseDiscrepancy,
  useResolveDiscrepancy,
} from "@workspace/api-client-react";

const statusColors: Record<string, string> = {
  received:              "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800",
  under_verification:    "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-800",
  po_matched:            "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-400 dark:border-cyan-800",
  measurement_verified:  "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-400 dark:border-teal-800",
  invoice_received:      "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800",
  invoice_matched:       "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800",
  matched:               "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800",
  discrepancy:           "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800",
  vendor_clarification:  "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800",
  pm_approved:           "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800",
  finance_verified:      "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-400 dark:border-teal-800",
  payment_approved:      "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-400 dark:border-cyan-800",
  payment_scheduled:     "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-400 dark:border-violet-800",
  scheduled:             "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-400 dark:border-violet-800",
  paid:                  "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800",
  reconciled:            "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-400 dark:border-teal-800",
  closed:                "bg-slate-100 text-slate-500 border-slate-300 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-600",
  open:                  "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800",
  under_clarification:   "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800",
  resolved:              "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800",
  rejected:              "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800",
  submitted:             "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800",
  draft:                 "bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-600",
};

function formatCurrency(val: number | string | undefined | null): string {
  const n = Number(val || 0);
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)} L`;
  return `₹${n.toLocaleString("en-IN")}`;
}

function StatusBadge({ status }: { status: string }) {
  const label = status.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  const cls = statusColors[status] ?? "bg-slate-100 text-slate-600 border-slate-300";
  return (
    <Badge variant="outline" className={`text-xs font-medium px-2 py-0.5 ${cls}`}>
      {label}
    </Badge>
  );
}

function MatchIcon({ matched }: { matched: boolean }) {
  return matched
    ? <CheckCircle className="w-4 h-4 text-emerald-400" />
    : <AlertCircle className="w-4 h-4 text-gray-500" />;
}

export default function AccountsPayablePage() {
  const { toast } = useToast();
  const { data: summary, isLoading: summaryLoading } = useAPSummary();
  const { data: raBills = [], isLoading: raBillsLoading } = useAPRaBills();
  const { data: invoices = [], isLoading: invoicesLoading } = useAPInvoices();
  const { data: payments = [] } = useAPPayments();
  const { data: discrepancies = [] } = useAPDiscrepancies();

  const threeWayMatch = useThreeWayMatch();
  const pmApprove = usePMApproveAPInvoice();
  const financeVerify = useFinanceVerifyAPInvoice();
  const approvePayment = useApproveAPPayment();
  const schedulePayment = useScheduleAPPayment();
  const payVendor = usePayVendor();
  const reconcileInvoice = useReconcileAPInvoice();
  const closeInvoice = useCloseAPInvoice();
  const requestClarification = useRequestVendorClarification();
  const resolveDisc = useResolveDiscrepancy();

  const [activeTab, setActiveTab] = useState("overview");
  const [payDialog, setPayDialog] = useState<{ open: boolean; invoiceId?: number; invoiceNumber?: string; outstanding?: number }>({ open: false });
  const [payForm, setPayForm] = useState({ paymentAmount: "", paymentDate: new Date().toISOString().split("T")[0], paymentMode: "neft_rtgs", bankReference: "", fromBankAccount: "", remarks: "" });
  const [scheduleDialog, setScheduleDialog] = useState<{ open: boolean; invoiceId?: number }>({ open: false });
  const [scheduleForm, setScheduleForm] = useState({ scheduledDate: "", scheduledAmount: "" });
  const [clarifyDialog, setClarifyDialog] = useState<{ open: boolean; invoiceId?: number }>({ open: false });
  const [clarifyNotes, setClarifyNotes] = useState("");
  const [actionComments, setActionComments] = useState("");

  const handlePayVendor = async () => {
    if (!payDialog.invoiceId || !payForm.paymentAmount) return;
    try {
      await payVendor.mutateAsync({
        invoiceId: payDialog.invoiceId,
        paymentAmount: Number(payForm.paymentAmount),
        paymentDate: payForm.paymentDate,
        paymentMode: payForm.paymentMode,
        bankReference: payForm.bankReference || undefined,
        fromBankAccount: payForm.fromBankAccount || undefined,
        remarks: payForm.remarks || undefined,
      });
      toast({ title: "Payment Recorded", description: "Vendor payment has been recorded successfully." });
      setPayDialog({ open: false });
      setPayForm({ paymentAmount: "", paymentDate: new Date().toISOString().split("T")[0], paymentMode: "neft_rtgs", bankReference: "", fromBankAccount: "", remarks: "" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to record payment", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center shrink-0">
              <TrendingDown className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            </div>
            Accounts Payable (AP)
          </h1>
          <p className="text-muted-foreground mt-1 ml-11">
            Vendor billing — RA Bills, Invoice verification, 3-Way matching, and Payments
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link href="/finance">
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
              <ArrowLeft className="w-3.5 h-3.5" /> Finance Hub
            </Button>
          </Link>
          <Link href="/finance/ar">
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" /> Client AR
            </Button>
          </Link>
          <Badge className="bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800 px-3 py-1.5 text-sm font-semibold self-start sm:self-auto">
            <ArrowDownRight className="w-3.5 h-3.5 mr-1" /> Money Out
          </Badge>
        </div>
      </div>

      {/* Commercial Guidance Callout */}
      <div className="p-3.5 bg-purple-50/70 border border-purple-200 dark:bg-purple-950/30 dark:border-purple-900 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
          <span>
            <strong>Vendor Outflow Lifecycle:</strong> Vendor Bills undergo 3-way matching against Purchase Orders (PO) and Goods Receipt Notes (GRN), followed by PM approval, tax verification, and payment releases. For client-side billing, visit <Link href="/ra-bills" className="underline font-semibold text-primary">Client RA Bills</Link> or <Link href="/finance/ar" className="underline font-semibold text-primary">Client Receivables</Link>.
          </span>
        </div>
      </div>

      {/* Summary Cards */}
      {!summaryLoading && summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-rose-500 hover:shadow-md transition-shadow">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Total Payable</p>
                  <p className="text-2xl font-bold text-foreground leading-none">{formatCurrency(summary.totalPayable)}</p>
                  <p className="text-xs text-muted-foreground mt-1.5">{summary.vendorInvoiceCount} invoices</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/40 flex items-center justify-center shrink-0">
                  <IndianRupee className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-emerald-500 hover:shadow-md transition-shadow">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Paid</p>
                  <p className="text-2xl font-bold text-foreground leading-none">{formatCurrency(summary.totalPaid)}</p>
                  <p className="text-xs text-muted-foreground mt-1.5">{payments.length} payments</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center shrink-0">
                  <CreditCard className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-amber-500 hover:shadow-md transition-shadow">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Outstanding</p>
                  <p className="text-2xl font-bold text-foreground leading-none">{formatCurrency(summary.totalOutstanding)}</p>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    {summary.pendingApprovals > 0 && `${summary.pendingApprovals} pending approvals`}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-violet-500 hover:shadow-md transition-shadow">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Scheduled</p>
                  <p className="text-2xl font-bold text-foreground leading-none">{summary.scheduledPayments}</p>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    {summary.activeDiscrepancies > 0 && (
                      <span className="text-red-600 dark:text-red-400">{summary.activeDiscrepancies} discrepancies</span>
                    )}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-950/40 flex items-center justify-center shrink-0">
                  <CalendarClock className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Ageing Breakdown */}
      {!summaryLoading && summary?.ageing && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-muted-foreground" />
              Payables Ageing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: "0–30 days (Current)",  value: summary.ageing.current,    color: "bg-emerald-500" },
                { label: "31–60 days",            value: summary.ageing.days31_60,  color: "bg-amber-500" },
                { label: "61–90 days",            value: summary.ageing.days61_90,  color: "bg-orange-500" },
                { label: "90+ days (Critical)",   value: summary.ageing.days90Plus, color: "bg-red-500" },
              ].map(bucket => {
                const pct = Math.min(100, (bucket.value / Math.max(summary.totalOutstanding, 1)) * 100);
                return (
                  <div key={bucket.label} className="space-y-2">
                    <div className="flex items-end justify-between gap-1">
                      <span className="text-base font-bold text-foreground">{formatCurrency(bucket.value)}</span>
                      <span className="text-xs text-muted-foreground">{pct.toFixed(0)}%</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${bucket.color}`}
                        style={{ width: `${Math.max(pct, bucket.value > 0 ? 4 : 0)}%` }} />
                    </div>
                    <p className="text-xs text-muted-foreground font-medium">{bucket.label}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="overflow-x-auto">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="vendor-ra-bills">
              Vendor RA Bills
              {raBills.length > 0 && (
                <span className="ml-1.5 text-[10px] bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 font-semibold">{raBills.length}</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="vendor-invoices">
              Vendor Invoices
              {invoices.length > 0 && (
                <span className="ml-1.5 text-[10px] bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 font-semibold">{invoices.length}</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="discrepancies">Discrepancies</TabsTrigger>
          </TabsList>
        </div>

        {/* VENDOR RA BILLS */}
        <TabsContent value="vendor-ra-bills" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-500" />
                Vendor RA Bills
              </CardTitle>
              <CardDescription>Running Account Bills received from vendors for completed work</CardDescription>
            </CardHeader>
            <CardContent>
              {raBillsLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading vendor RA Bills...</div>
              ) : raBills.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>No vendor RA Bills received</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50 border-b border-border">
                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground text-xs uppercase tracking-wide whitespace-nowrap">Bill #</th>
                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Vendor / Project</th>
                        <th className="text-right py-3 px-4 font-semibold text-muted-foreground text-xs uppercase tracking-wide whitespace-nowrap">Gross Amt</th>
                        <th className="text-right py-3 px-4 font-semibold text-muted-foreground text-xs uppercase tracking-wide whitespace-nowrap">Net Payable</th>
                        <th className="text-center py-3 px-4 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {raBills.map((bill: any) => (
                        <tr key={bill.id} className="border-t border-border/50 hover:bg-muted/30 transition-colors">
                          <td className="py-3.5 px-4 font-mono text-xs font-semibold text-primary whitespace-nowrap">{bill.billNumber}</td>
                          <td className="py-3.5 px-4">
                            <p className="font-semibold text-sm">{bill.vendorName || "—"}</p>
                            <p className="text-xs text-muted-foreground">{bill.projectName || "—"}</p>
                          </td>
                          <td className="py-3.5 px-4 text-right tabular-nums whitespace-nowrap">{formatCurrency(bill.grossAmount)}</td>
                          <td className="py-3.5 px-4 text-right font-bold text-rose-600 dark:text-rose-400 tabular-nums whitespace-nowrap">{formatCurrency(bill.netPayableAmount)}</td>
                          <td className="py-3.5 px-4 text-center"><StatusBadge status={bill.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* VENDOR INVOICES */}
        <TabsContent value="vendor-invoices" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Receipt className="w-5 h-5 text-violet-500" />
                Vendor Invoices
              </CardTitle>
              <CardDescription>Invoices received from vendors — verify, match, approve, and pay</CardDescription>
            </CardHeader>
            <CardContent>
              {invoicesLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading vendor invoices...</div>
              ) : invoices.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Receipt className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>No vendor invoices found</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50 border-b border-border">
                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground text-xs uppercase tracking-wide whitespace-nowrap">Invoice #</th>
                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Vendor</th>
                        <th className="text-right py-3 px-4 font-semibold text-muted-foreground text-xs uppercase tracking-wide whitespace-nowrap">Net Payable</th>
                        <th className="text-right py-3 px-4 font-semibold text-muted-foreground text-xs uppercase tracking-wide whitespace-nowrap">Paid</th>
                        <th className="text-right py-3 px-4 font-semibold text-muted-foreground text-xs uppercase tracking-wide whitespace-nowrap">Outstanding</th>
                        <th className="text-center py-3 px-4 font-semibold text-muted-foreground text-xs uppercase tracking-wide">3-Way Match</th>
                        <th className="text-center py-3 px-4 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Status</th>
                        <th className="text-right py-3 px-4 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map((inv: any) => (
                        <tr key={inv.id} className="border-t border-border/50 hover:bg-muted/30 transition-colors">
                          <td className="py-3.5 px-4 font-mono text-xs font-semibold text-primary whitespace-nowrap">{inv.invoiceNumber}</td>
                          <td className="py-3.5 px-4 font-medium">{inv.vendorName || "—"}</td>
                          <td className="py-3.5 px-4 text-right tabular-nums whitespace-nowrap">{formatCurrency(inv.netPayableAmount || inv.amount)}</td>
                          <td className="py-3.5 px-4 text-right font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums whitespace-nowrap">{formatCurrency(inv.totalPaidAmount)}</td>
                          <td className="py-3.5 px-4 text-right font-bold text-amber-600 dark:text-amber-400 tabular-nums whitespace-nowrap">{formatCurrency(inv.outstandingAmount)}</td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center justify-center gap-1.5">
                              <span title="PO Match"><MatchIcon matched={!!inv.poMatched} /></span>
                              <span title="Measurement"><MatchIcon matched={!!inv.measurementMatched} /></span>
                              <span title="Qty/Rate"><MatchIcon matched={!!inv.quantityRateValidated} /></span>
                              {inv.discrepancyFlag && <AlertTriangle className="w-4 h-4 text-red-500" title="Discrepancy" />}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-center"><StatusBadge status={inv.status} /></td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center gap-1.5 justify-end flex-wrap">
                              {["received", "under_verification"].includes(inv.status) && (
                                <Button size="sm" variant="outline" className="h-8 text-xs border-cyan-300 text-cyan-700 hover:bg-cyan-50 dark:border-cyan-700 dark:text-cyan-400 dark:hover:bg-cyan-950/40"
                                  disabled={threeWayMatch.isPending}
                                  onClick={async () => {
                                    try {
                                      const result = await threeWayMatch.mutateAsync(inv.id);
                                      toast({
                                        title: result.hasDiscrepancy ? "Discrepancies Found" : "Match Successful",
                                        description: result.hasDiscrepancy
                                          ? `${result.discrepancies.length} discrepancies found`
                                          : "3-way match passed — PO, Measurement, and Invoice verified",
                                        variant: result.hasDiscrepancy ? "destructive" : undefined,
                                      });
                                    } catch (err: any) {
                                      toast({ title: "Error", description: err.message, variant: "destructive" });
                                    }
                                  }}>
                                  <Search className="w-3.5 h-3.5 mr-1" /> Match
                                </Button>
                              )}
                              {["invoice_matched", "matched"].includes(inv.status) && (
                                <Button size="sm" variant="outline" className="h-8 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
                                  onClick={async () => {
                                    try {
                                      await pmApprove.mutateAsync({ invoiceId: inv.id });
                                      toast({ title: "PM Approved", description: `Invoice ${inv.invoiceNumber} PM approved.` });
                                    } catch (err: any) { toast({ title: "Error", description: err.message, variant: "destructive" }); }
                                  }}>
                                  <ThumbsUp className="w-3.5 h-3.5 mr-1" /> PM Approve
                                </Button>
                              )}
                              {inv.status === "pm_approved" && (
                                <Button size="sm" variant="outline" className="h-8 text-xs border-teal-300 text-teal-700 hover:bg-teal-50 dark:border-teal-700 dark:text-teal-400 dark:hover:bg-teal-950/40"
                                  onClick={async () => {
                                    try {
                                      await financeVerify.mutateAsync({ invoiceId: inv.id });
                                      toast({ title: "Finance Verified", description: `Invoice ${inv.invoiceNumber} finance verified.` });
                                    } catch (err: any) { toast({ title: "Error", description: err.message, variant: "destructive" }); }
                                  }}>
                                  <Shield className="w-3.5 h-3.5 mr-1" /> Finance
                                </Button>
                              )}
                              {inv.status === "finance_verified" && (
                                <Button size="sm" variant="outline" className="h-8 text-xs border-cyan-300 text-cyan-700 hover:bg-cyan-50 dark:border-cyan-700 dark:text-cyan-400 dark:hover:bg-cyan-950/40"
                                  onClick={async () => {
                                    try {
                                      await approvePayment.mutateAsync(inv.id);
                                      toast({ title: "Payment Approved", description: `Payment approved for ${inv.invoiceNumber}.` });
                                    } catch (err: any) { toast({ title: "Error", description: err.message, variant: "destructive" }); }
                                  }}>
                                  <CheckCircle className="w-3.5 h-3.5 mr-1" /> Approve Pay
                                </Button>
                              )}
                              {inv.status === "payment_approved" && (
                                <Button size="sm" variant="outline" className="h-8 text-xs border-violet-300 text-violet-700 hover:bg-violet-50 dark:border-violet-700 dark:text-violet-400 dark:hover:bg-violet-950/40"
                                  onClick={() => setScheduleDialog({ open: true, invoiceId: inv.id })}>
                                  <CalendarClock className="w-3.5 h-3.5 mr-1" /> Schedule
                                </Button>
                              )}
                              {["payment_scheduled", "scheduled", "payment_approved"].includes(inv.status) && (
                                <Button size="sm" variant="outline" className="h-8 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
                                  onClick={() => setPayDialog({ open: true, invoiceId: inv.id, invoiceNumber: inv.invoiceNumber, outstanding: Number(inv.outstandingAmount) })}>
                                  <CreditCard className="w-3.5 h-3.5 mr-1" /> Pay Vendor
                                </Button>
                              )}
                              {inv.status === "discrepancy" && (
                                <Button size="sm" variant="outline" className="h-8 text-xs border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-950/40"
                                  onClick={() => setClarifyDialog({ open: true, invoiceId: inv.id })}>
                                  <AlertCircle className="w-3.5 h-3.5 mr-1" /> Clarify
                                </Button>
                              )}
                              {inv.status === "paid" && (
                                <Button size="sm" variant="ghost" className="h-7 text-xs text-teal-400"
                                  onClick={async () => {
                                    try {
                                      await reconcileInvoice.mutateAsync({ invoiceId: inv.id });
                                      toast({ title: "Reconciled", description: `Invoice ${inv.invoiceNumber} reconciled.` });
                                    } catch (err: any) { toast({ title: "Error", description: err.message, variant: "destructive" }); }
                                  }}>
                                  <Shield className="w-3.5 h-3.5 mr-1" /> Reconcile
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
        </TabsContent>

        {/* PAYMENTS */}
        <TabsContent value="payments" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CircleDollarSign className="w-5 h-5 text-emerald-500" />
                Vendor Payments
              </CardTitle>
              <CardDescription>Payments made to vendors (Our Bank → Vendor)</CardDescription>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>No vendor payments recorded yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50 border-b border-border">
                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground text-xs uppercase tracking-wide whitespace-nowrap">Payment #</th>
                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Vendor / Project</th>
                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground text-xs uppercase tracking-wide whitespace-nowrap">Date</th>
                        <th className="text-right py-3 px-4 font-semibold text-muted-foreground text-xs uppercase tracking-wide whitespace-nowrap">Amount</th>
                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Mode</th>
                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Reference</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((p: any) => (
                        <tr key={p.id} className="border-t border-border/50 hover:bg-muted/30 transition-colors">
                          <td className="py-3.5 px-4 font-mono text-xs font-semibold text-primary whitespace-nowrap">{p.paymentNumber}</td>
                          <td className="py-3.5 px-4">
                            <p className="font-semibold text-sm">{p.vendorName || "—"}</p>
                            <p className="text-xs text-muted-foreground">{p.projectName || "—"}</p>
                          </td>
                          <td className="py-3.5 px-4 text-xs whitespace-nowrap">{p.paymentDate}</td>
                          <td className="py-3.5 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400 tabular-nums whitespace-nowrap">{formatCurrency(p.paymentAmount)}</td>
                          <td className="py-3.5 px-4 text-xs uppercase">{(p.paymentMode || "").replace(/_/g, " ")}</td>
                          <td className="py-3.5 px-4 font-mono text-xs">{p.bankReference || p.transactionId || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* DISCREPANCIES */}
        <TabsContent value="discrepancies" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                AP Discrepancies
              </CardTitle>
              <CardDescription>Mismatches between vendor invoice, PO, and verified measurements</CardDescription>
            </CardHeader>
            <CardContent>
              {discrepancies.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCircle className="w-10 h-10 mx-auto mb-3 opacity-30 text-emerald-500" />
                  <p>No discrepancies — all invoices match</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {discrepancies.map((d: any) => (
                    <div key={d.id} className="border border-border/30 rounded-lg p-4 hover:bg-muted/20 transition-colors">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs bg-orange-500/10 text-orange-400 border-orange-500/30">
                              {(d.discrepancyType || "").replace(/_/g, " ")}
                            </Badge>
                            <StatusBadge status={d.status} />
                          </div>
                          <p className="text-sm">{d.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span>Claimed: <span className="font-semibold text-foreground">{formatCurrency(d.claimedAmount)}</span></span>
                            <span>Verified: <span className="font-semibold text-foreground">{formatCurrency(d.verifiedAmount)}</span></span>
                            <span>Diff: <span className="font-semibold text-red-400">{formatCurrency(d.differenceAmount)}</span></span>
                          </div>
                        </div>
                        {d.status === "open" && (
                          <Button size="sm" variant="outline" className="text-xs"
                            onClick={async () => {
                              try {
                                await resolveDisc.mutateAsync({ discrepancyId: d.id, resolutionNotes: "Resolved after verification" });
                                toast({ title: "Resolved", description: "Discrepancy has been resolved." });
                              } catch (err: any) { toast({ title: "Error", description: err.message, variant: "destructive" }); }
                            }}>
                            Resolve
                          </Button>
                        )}
                      </div>
                      {d.resolutionNotes && (
                        <p className="text-xs text-muted-foreground mt-2 italic">Resolution: {d.resolutionNotes}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* OVERVIEW */}
        <TabsContent value="overview" className="space-y-4 pt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Recent Vendor RA Bills</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {raBills.slice(0, 5).map((bill: any) => (
                  <div key={bill.id} className="flex items-center justify-between py-2 border-b border-border/20 last:border-0">
                    <div>
                      <p className="text-sm font-medium">{bill.billNumber}</p>
                      <p className="text-xs text-muted-foreground">{bill.vendorName} • {bill.projectName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{formatCurrency(bill.netPayableAmount)}</p>
                      <StatusBadge status={bill.status} />
                    </div>
                  </div>
                ))}
                {raBills.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No vendor RA Bills</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Recent Vendor Invoices</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {invoices.slice(0, 5).map((inv: any) => (
                  <div key={inv.id} className="flex items-center justify-between py-2 border-b border-border/20 last:border-0">
                    <div>
                      <p className="text-sm font-medium">{inv.invoiceNumber}</p>
                      <p className="text-xs text-muted-foreground">{inv.vendorName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{formatCurrency(inv.outstandingAmount)}</p>
                      <StatusBadge status={inv.status} />
                    </div>
                  </div>
                ))}
                {invoices.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No vendor invoices</p>}
              </CardContent>
            </Card>
          </div>

          {summary && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Invoice Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {Object.entries(summary.statusCounts || {}).filter(([, v]) => v > 0).map(([status, count]) => (
                    <div key={status} className="flex items-center gap-2">
                      <StatusBadge status={status} />
                      <span className="text-sm font-semibold">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Pay Vendor Dialog */}
      <Dialog open={payDialog.open} onOpenChange={(o) => setPayDialog({ ...payDialog, open: o })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-rose-600" />
              Pay Vendor
            </DialogTitle>
            <DialogDescription>
              Recording payment for invoice{" "}
              <span className="font-semibold text-foreground">{payDialog.invoiceNumber}</span>.
              Outstanding: <span className="font-bold text-foreground">{formatCurrency(payDialog.outstanding)}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">Payment Amount (₹) <span className="text-destructive">*</span></label>
              <Input type="number" placeholder="Enter amount" value={payForm.paymentAmount}
                onChange={e => setPayForm({ ...payForm, paymentAmount: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">Payment Date <span className="text-destructive">*</span></label>
              <Input type="date" value={payForm.paymentDate}
                onChange={e => setPayForm({ ...payForm, paymentDate: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">Payment Mode</label>
              <Select value={payForm.paymentMode} onValueChange={v => setPayForm({ ...payForm, paymentMode: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="neft_rtgs">NEFT / RTGS</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">Bank Reference / UTR</label>
              <Input placeholder="UTR / Transaction ID" value={payForm.bankReference}
                onChange={e => setPayForm({ ...payForm, bankReference: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">From Bank Account</label>
              <Input placeholder="Our bank account" value={payForm.fromBankAccount}
                onChange={e => setPayForm({ ...payForm, fromBankAccount: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">Remarks</label>
              <Textarea placeholder="Optional remarks" rows={2} value={payForm.remarks}
                onChange={e => setPayForm({ ...payForm, remarks: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPayDialog({ open: false })}>Cancel</Button>
            <Button onClick={handlePayVendor} disabled={!payForm.paymentAmount || payVendor.isPending}
              className="bg-rose-600 hover:bg-rose-700 text-white">
              <CreditCard className="w-4 h-4 mr-2" />
              Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Payment Dialog */}
      <Dialog open={scheduleDialog.open} onOpenChange={(o) => setScheduleDialog({ ...scheduleDialog, open: o })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Scheduled Date *</label>
              <Input type="date" value={scheduleForm.scheduledDate}
                onChange={e => setScheduleForm({ ...scheduleForm, scheduledDate: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Amount (₹)</label>
              <Input type="number" placeholder="Amount to pay" value={scheduleForm.scheduledAmount}
                onChange={e => setScheduleForm({ ...scheduleForm, scheduledAmount: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setScheduleDialog({ open: false })}>Cancel</Button>
            <Button onClick={async () => {
              if (!scheduleDialog.invoiceId || !scheduleForm.scheduledDate) return;
              try {
                await schedulePayment.mutateAsync({
                  invoiceId: scheduleDialog.invoiceId,
                  scheduledDate: scheduleForm.scheduledDate,
                  scheduledAmount: Number(scheduleForm.scheduledAmount || 0),
                });
                toast({ title: "Scheduled", description: "Payment scheduled." });
                setScheduleDialog({ open: false });
                setScheduleForm({ scheduledDate: "", scheduledAmount: "" });
              } catch (err: any) { toast({ title: "Error", description: err.message, variant: "destructive" }); }
            }}>
              <CalendarClock className="w-4 h-4 mr-2" /> Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Vendor Clarification Dialog */}
      <Dialog open={clarifyDialog.open} onOpenChange={(o) => setClarifyDialog({ ...clarifyDialog, open: o })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Vendor Clarification</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium">Clarification Notes</label>
            <Textarea placeholder="Describe what needs clarification..." value={clarifyNotes}
              onChange={e => setClarifyNotes(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setClarifyDialog({ open: false })}>Cancel</Button>
            <Button onClick={async () => {
              if (!clarifyDialog.invoiceId || !clarifyNotes) return;
              try {
                await requestClarification.mutateAsync({ invoiceId: clarifyDialog.invoiceId, notes: clarifyNotes });
                toast({ title: "Clarification Requested", description: "Vendor clarification request sent." });
                setClarifyDialog({ open: false });
                setClarifyNotes("");
              } catch (err: any) { toast({ title: "Error", description: err.message, variant: "destructive" }); }
            }}>
              Send Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
