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
  TrendingUp,
  IndianRupee,
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  Send,
  CreditCard,
  ArrowUpRight,
  BarChart3,
  Receipt,
  Shield,
  XCircle,
  Eye,
  ExternalLink,
  ArrowLeft,
  Layers,
} from "lucide-react";
import {
  useARSummary,
  useARRaBills,
  useARInvoices,
  useSubmitARRaBill,
  usePMApproveARRaBill,
  useRequestRevisionARRaBill,
  useCertifyPaymentAR,
  useGenerateARInvoice,
  useSendARInvoice,
  useRecordARPayment,
  useReconcileARInvoice,
  useCloseARInvoice,
} from "@workspace/api-client-react";
import { ARAgingReportView } from "@/components/finance/ar-aging-report";

const statusColors: Record<string, string> = {
  draft:              "bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-600",
  submitted:          "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800",
  revision_requested: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800",
  pm_approved:        "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800",
  payment_certified:  "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-400 dark:border-cyan-800",
  invoice_generated:  "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-400 dark:border-violet-800",
  invoiced:           "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-400 dark:border-violet-800",
  generated:          "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-400 dark:border-violet-800",
  sent:               "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-800",
  payment_pending:    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800",
  partially_paid:     "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/40 dark:text-yellow-400 dark:border-yellow-800",
  paid:               "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800",
  reconciled:         "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-400 dark:border-teal-800",
  closed:             "bg-slate-100 text-slate-500 border-slate-300 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-600",
  overdue:            "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800",
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

export default function AccountsReceivablePage() {
  const { toast } = useToast();
  const { data: summary, isLoading: summaryLoading } = useARSummary();
  const { data: raBills = [], isLoading: raBillsLoading } = useARRaBills();
  const { data: invoices = [], isLoading: invoicesLoading } = useARInvoices();

  const submitRaBill = useSubmitARRaBill();
  const pmApprove = usePMApproveARRaBill();
  const requestRevision = useRequestRevisionARRaBill();
  const certifyPayment = useCertifyPaymentAR();
  const generateInvoice = useGenerateARInvoice();
  const sendInvoice = useSendARInvoice();
  const recordPayment = useRecordARPayment();
  const reconcileInvoice = useReconcileARInvoice();
  const closeInvoice = useCloseARInvoice();

  const [activeTab, setActiveTab] = useState("overview");
  const [paymentDialog, setPaymentDialog] = useState<{ open: boolean; invoiceId?: number; invoiceNumber?: string }>({ open: false });
  const [paymentForm, setPaymentForm] = useState({ paymentAmount: "", paymentDate: new Date().toISOString().split("T")[0], paymentMode: "neft_rtgs", bankReference: "", remarks: "" });
  const [approvalDialog, setApprovalDialog] = useState<{ open: boolean; raBillId?: number; action?: string }>({ open: false });
  const [approvalComments, setApprovalComments] = useState("");

  const handleRecordPayment = async () => {
    if (!paymentDialog.invoiceId || !paymentForm.paymentAmount) return;
    try {
      await recordPayment.mutateAsync({
        invoiceId: paymentDialog.invoiceId,
        paymentAmount: Number(paymentForm.paymentAmount),
        paymentDate: paymentForm.paymentDate,
        paymentMode: paymentForm.paymentMode,
        bankReference: paymentForm.bankReference || undefined,
        remarks: paymentForm.remarks || undefined,
      });
      toast({ title: "Payment Recorded", description: "Client payment has been recorded successfully." });
      setPaymentDialog({ open: false });
      setPaymentForm({ paymentAmount: "", paymentDate: new Date().toISOString().split("T")[0], paymentMode: "neft_rtgs", bankReference: "", remarks: "" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to record payment", variant: "destructive" });
    }
  };

  const handleApprovalAction = async () => {
    if (!approvalDialog.raBillId) return;
    try {
      if (approvalDialog.action === "approve") {
        await pmApprove.mutateAsync({ id: approvalDialog.raBillId, comments: approvalComments });
        toast({ title: "RA Bill Approved", description: "Client RA Bill has been PM approved." });
      } else if (approvalDialog.action === "revision") {
        await requestRevision.mutateAsync({ id: approvalDialog.raBillId, reason: approvalComments });
        toast({ title: "Revision Requested", description: "Revision has been requested for this RA Bill." });
      } else if (approvalDialog.action === "certify") {
        await certifyPayment.mutateAsync({ id: approvalDialog.raBillId, notes: approvalComments });
        toast({ title: "Payment Certified", description: "Payment has been certified." });
      } else if (approvalDialog.action === "generate-invoice") {
        await generateInvoice.mutateAsync({ raBillId: approvalDialog.raBillId });
        toast({ title: "Invoice Generated", description: "Client invoice has been generated from RA Bill." });
      }
      setApprovalDialog({ open: false });
      setApprovalComments("");
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Action failed", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            Accounts Receivable (AR)
          </h1>
          <p className="text-muted-foreground mt-1 ml-11">
            Client billing — RA Bills → Invoices → Payment collection
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link href="/finance">
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
              <ArrowLeft className="w-3.5 h-3.5" /> Finance Hub
            </Button>
          </Link>
          <Link href="/ra-bills">
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
              <FileText className="w-3.5 h-3.5" /> Client RA Bills
            </Button>
          </Link>
          <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800 px-3 py-1.5 text-sm font-semibold self-start sm:self-auto">
            <ArrowUpRight className="w-3.5 h-3.5 mr-1" /> Money In
          </Badge>
        </div>
      </div>

      {/* Summary Cards */}
      {!summaryLoading && summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-emerald-500 hover:shadow-md transition-shadow">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Total Billed</p>
                  <p className="text-2xl font-bold text-foreground leading-none">{formatCurrency(summary.totalBilled)}</p>
                  <p className="text-xs text-muted-foreground mt-1.5">{summary.invoiceCount} invoices</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center shrink-0">
                  <IndianRupee className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Collected</p>
                  <p className="text-2xl font-bold text-foreground leading-none">{formatCurrency(summary.totalCollected)}</p>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    {summary.totalBilled > 0 ? `${((summary.totalCollected / summary.totalBilled) * 100).toFixed(1)}% efficiency` : "—"}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center shrink-0">
                  <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
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
                  <p className="text-xs text-muted-foreground mt-1.5">{summary.raBillCount} RA Bills active</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500 hover:shadow-md transition-shadow">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Overdue</p>
                  <p className="text-2xl font-bold text-foreground leading-none">{formatCurrency(summary.totalOverdue)}</p>
                  <p className="text-xs text-muted-foreground mt-1.5">Requires follow-up</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/40 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Ageing Breakdown */}
      {!summaryLoading && summary?.ageing && (
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-muted-foreground" />
              Receivables Ageing
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1 border-primary/30 text-primary hover:bg-primary/5"
              onClick={() => setActiveTab("aging-report")}
            >
              Detailed Aging Report &rarr;
            </Button>
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
            <TabsTrigger value="ra-bills">
              Client RA Bills (Invoicing)
              {raBills.length > 0 && (
                <span className="ml-1.5 text-[10px] bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 font-semibold">{raBills.length}</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="invoices">
              Client Invoices
              {invoices.length > 0 && (
                <span className="ml-1.5 text-[10px] bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 font-semibold">{invoices.length}</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="aging-report">
              AR Aging Report
            </TabsTrigger>
          </TabsList>
        </div>

        {/* CLIENT RA BILLS */}
        <TabsContent value="ra-bills" className="space-y-4 pt-4">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-500" />
                  Client RA Bills (Invoicing Queue)
                </CardTitle>
                <CardDescription>
                  Verified and certified Running Account bills ready for GST Tax Invoicing. Draft bills and field measurement logs (JMR) are managed in the Client RA Bills Engine.
                </CardDescription>
              </div>
              <Link href="/ra-bills">
                <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 shrink-0">
                  <ExternalLink className="w-3.5 h-3.5" /> Full RA Bills Registry
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {raBillsLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading RA Bills...</div>
              ) : raBills.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>No client RA Bills found</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50 border-b border-border">
                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground text-xs uppercase tracking-wide whitespace-nowrap">Bill #</th>
                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Project / Client</th>
                        <th className="text-right py-3 px-4 font-semibold text-muted-foreground text-xs uppercase tracking-wide whitespace-nowrap">Gross Amt</th>
                        <th className="text-right py-3 px-4 font-semibold text-muted-foreground text-xs uppercase tracking-wide whitespace-nowrap">Net Payable</th>
                        <th className="text-center py-3 px-4 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Status</th>
                        <th className="text-right py-3 px-4 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {raBills.map((bill: any) => (
                        <tr key={bill.id} className="border-t border-border/50 hover:bg-muted/30 transition-colors">
                          <td className="py-3.5 px-4 font-mono text-xs font-semibold text-primary whitespace-nowrap">
                            <Link href={`/ra-bills/detail/${bill.id}`} className="hover:underline">
                              {bill.billNumber}
                            </Link>
                          </td>
                          <td className="py-3.5 px-4">
                            <p className="font-semibold text-sm">{bill.projectName || "—"}</p>
                            <p className="text-xs text-muted-foreground">{bill.clientName || "—"}</p>
                          </td>
                          <td className="py-3.5 px-4 text-right tabular-nums whitespace-nowrap">{formatCurrency(bill.grossAmount)}</td>
                          <td className="py-3.5 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400 tabular-nums whitespace-nowrap">{formatCurrency(bill.netPayableAmount)}</td>
                          <td className="py-3.5 px-4 text-center"><StatusBadge status={bill.status} /></td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center gap-1.5 justify-end">
                              {bill.status === "submitted" && (
                                <>
                                  <Button size="sm" variant="outline" className="h-8 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
                                    onClick={() => setApprovalDialog({ open: true, raBillId: bill.id, action: "approve" })}>
                                    <CheckCircle className="w-3.5 h-3.5 mr-1" /> Approve
                                  </Button>
                                  <Button size="sm" variant="outline" className="h-8 text-xs border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-950/40"
                                    onClick={() => setApprovalDialog({ open: true, raBillId: bill.id, action: "revision" })}>
                                    <XCircle className="w-3.5 h-3.5 mr-1" /> Revise
                                  </Button>
                                </>
                              )}
                              {bill.status === "pm_approved" && (
                                <Button size="sm" variant="outline" className="h-8 text-xs border-cyan-300 text-cyan-700 hover:bg-cyan-50 dark:border-cyan-700 dark:text-cyan-400 dark:hover:bg-cyan-950/40"
                                  onClick={() => setApprovalDialog({ open: true, raBillId: bill.id, action: "certify" })}>
                                  <Shield className="w-3.5 h-3.5 mr-1" /> Certify
                                </Button>
                              )}
                              {bill.status === "payment_certified" && (
                                <Button size="sm" variant="outline" className="h-8 text-xs border-violet-300 text-violet-700 hover:bg-violet-50 dark:border-violet-700 dark:text-violet-400 dark:hover:bg-violet-950/40"
                                  onClick={() => setApprovalDialog({ open: true, raBillId: bill.id, action: "generate-invoice" })}>
                                  <Receipt className="w-3.5 h-3.5 mr-1" /> Generate Invoice
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

        {/* CLIENT INVOICES */}
        <TabsContent value="invoices" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Receipt className="w-5 h-5 text-violet-500" />
                Client Invoices
              </CardTitle>
              <CardDescription>Invoices sent to clients for payment collection</CardDescription>
            </CardHeader>
            <CardContent>
              {invoicesLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading invoices...</div>
              ) : invoices.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Receipt className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>No client invoices found</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50 border-b border-border">
                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground text-xs uppercase tracking-wide whitespace-nowrap">Invoice #</th>
                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Client / Project</th>
                        <th className="text-right py-3 px-4 font-semibold text-muted-foreground text-xs uppercase tracking-wide whitespace-nowrap">Net Amount</th>
                        <th className="text-right py-3 px-4 font-semibold text-muted-foreground text-xs uppercase tracking-wide whitespace-nowrap">Paid</th>
                        <th className="text-right py-3 px-4 font-semibold text-muted-foreground text-xs uppercase tracking-wide whitespace-nowrap">Outstanding</th>
                        <th className="text-center py-3 px-4 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Status</th>
                        <th className="text-right py-3 px-4 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map((inv: any) => (
                        <tr key={inv.id} className="border-t border-border/50 hover:bg-muted/30 transition-colors">
                          <td className="py-3.5 px-4 font-mono text-xs font-semibold text-primary whitespace-nowrap">
                            <Link href={`/ra-bills/invoices/${inv.id}`} className="hover:underline">
                              {inv.invoiceNumber}
                            </Link>
                          </td>
                          <td className="py-3.5 px-4">
                            <p className="font-semibold text-sm">{inv.clientName || "—"}</p>
                            <p className="text-xs text-muted-foreground">{inv.projectName || "—"}</p>
                          </td>
                          <td className="py-3.5 px-4 text-right tabular-nums whitespace-nowrap">{formatCurrency(inv.netAmount || inv.amount)}</td>
                          <td className="py-3.5 px-4 text-right font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums whitespace-nowrap">{formatCurrency(inv.totalPaidAmount)}</td>
                          <td className="py-3.5 px-4 text-right font-bold text-amber-600 dark:text-amber-400 tabular-nums whitespace-nowrap">{formatCurrency(inv.outstandingAmount)}</td>
                          <td className="py-3.5 px-4 text-center"><StatusBadge status={inv.status} /></td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center gap-1.5 justify-end">
                              <Link href={`/ra-bills/invoices/${inv.id}`}>
                                <Button size="sm" variant="ghost" className="h-8 text-xs gap-1 text-muted-foreground hover:text-foreground">
                                  <Eye className="w-3.5 h-3.5" /> Details
                                </Button>
                              </Link>
                              {["generated", "sent", "payment_pending", "partially_paid", "overdue"].includes(inv.status) && (
                                <Button size="sm" variant="outline" className="h-8 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
                                  onClick={() => setPaymentDialog({ open: true, invoiceId: inv.id, invoiceNumber: inv.invoiceNumber })}>
                                  <CreditCard className="w-3.5 h-3.5 mr-1" /> Record Payment
                                </Button>
                              )}
                              {inv.status === "generated" && (
                                <Button size="sm" variant="outline" className="h-8 text-xs border-sky-300 text-sky-700 hover:bg-sky-50 dark:border-sky-700 dark:text-sky-400 dark:hover:bg-sky-950/40"
                                  onClick={async () => {
                                    try {
                                      await sendInvoice.mutateAsync({ id: inv.id });
                                      toast({ title: "Invoice Sent", description: `Invoice ${inv.invoiceNumber} sent.` });
                                    } catch (err: any) {
                                      toast({ title: "Error", description: err.message, variant: "destructive" });
                                    }
                                  }}>
                                  <Send className="w-3.5 h-3.5 mr-1" /> Send
                                </Button>
                              )}
                              {inv.status === "paid" && !inv.reconciled && (
                                <Button size="sm" variant="outline" className="h-8 text-xs border-teal-300 text-teal-700 hover:bg-teal-50 dark:border-teal-700 dark:text-teal-400 dark:hover:bg-teal-950/40"
                                  onClick={async () => {
                                    try {
                                      await reconcileInvoice.mutateAsync({ id: inv.id });
                                      toast({ title: "Reconciled", description: `Invoice ${inv.invoiceNumber} reconciled.` });
                                    } catch (err: any) {
                                      toast({ title: "Error", description: err.message, variant: "destructive" });
                                    }
                                  }}>
                                  <Shield className="w-3.5 h-3.5 mr-1" /> Reconcile
                                </Button>
                              )}
                              {inv.status === "reconciled" && (
                                <Button size="sm" variant="outline" className="h-8 text-xs"
                                  onClick={async () => {
                                    try {
                                      await closeInvoice.mutateAsync(inv.id);
                                      toast({ title: "Closed", description: `Invoice ${inv.invoiceNumber} closed.` });
                                    } catch (err: any) {
                                      toast({ title: "Error", description: err.message, variant: "destructive" });
                                    }
                                  }}>
                                  Close
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

        {/* OVERVIEW (default) */}
        <TabsContent value="overview" className="space-y-4 pt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent RA Bills */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-500" />
                  Recent Client RA Bills
                </CardTitle>
              </CardHeader>
              <CardContent className="divide-y divide-border/50">
                {raBills.length === 0
                  ? <p className="text-sm text-muted-foreground text-center py-6">No RA Bills yet</p>
                  : raBills.slice(0, 5).map((bill: any) => (
                    <div key={bill.id} className="flex items-center justify-between py-3 gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold truncate">{bill.billNumber}</p>
                        <p className="text-xs text-muted-foreground truncate">{bill.projectName}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold">{formatCurrency(bill.netPayableAmount)}</p>
                        <StatusBadge status={bill.status} />
                      </div>
                    </div>
                  ))}
              </CardContent>
            </Card>

            {/* Recent Invoices */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-violet-500" />
                  Recent Client Invoices
                </CardTitle>
              </CardHeader>
              <CardContent className="divide-y divide-border/50">
                {invoices.length === 0
                  ? <p className="text-sm text-muted-foreground text-center py-6">No invoices yet</p>
                  : invoices.slice(0, 5).map((inv: any) => (
                    <div key={inv.id} className="flex items-center justify-between py-3 gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold truncate">{inv.invoiceNumber}</p>
                        <p className="text-xs text-muted-foreground truncate">{inv.clientName}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold">{formatCurrency(inv.outstandingAmount)}</p>
                        <StatusBadge status={inv.status} />
                      </div>
                    </div>
                  ))}
              </CardContent>
            </Card>
          </div>

          {/* Status Distribution */}
          {summary && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">RA Bill Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(summary.raBillStatusCounts || {}).filter(([, v]) => v > 0).map(([status, count]) => (
                      <div key={status} className="flex items-center justify-between">
                        <StatusBadge status={status} />
                        <span className="text-sm font-semibold">{count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">Invoice Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(summary.invoiceStatusCounts || {}).filter(([, v]) => v > 0).map(([status, count]) => (
                      <div key={status} className="flex items-center justify-between">
                        <StatusBadge status={status} />
                        <span className="text-sm font-semibold">{count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* AR AGING REPORT */}
        <TabsContent value="aging-report" className="space-y-4 pt-4">
          <ARAgingReportView
            onRecordPayment={(id, invoiceNum) => {
              setPaymentDialog({ open: true, invoiceId: id, invoiceNumber: invoiceNum });
            }}
          />
        </TabsContent>
      </Tabs>

      {/* Payment Dialog */}
      <Dialog open={paymentDialog.open} onOpenChange={(o) => setPaymentDialog({ ...paymentDialog, open: o })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-600" />
              Record Client Payment
            </DialogTitle>
            <DialogDescription>
              Recording payment for invoice{" "}
              <span className="font-semibold text-foreground">{paymentDialog.invoiceNumber}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">Payment Amount (₹) <span className="text-destructive">*</span></label>
              <Input type="number" placeholder="e.g. 150000" value={paymentForm.paymentAmount}
                onChange={e => setPaymentForm({ ...paymentForm, paymentAmount: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">Payment Date <span className="text-destructive">*</span></label>
              <Input type="date" value={paymentForm.paymentDate}
                onChange={e => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">Payment Mode</label>
              <Select value={paymentForm.paymentMode} onValueChange={v => setPaymentForm({ ...paymentForm, paymentMode: v })}>
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
              <Input placeholder="UTR or Transaction ID" value={paymentForm.bankReference}
                onChange={e => setPaymentForm({ ...paymentForm, bankReference: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">Remarks</label>
              <Textarea placeholder="Optional notes..." rows={2} value={paymentForm.remarks}
                onChange={e => setPaymentForm({ ...paymentForm, remarks: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPaymentDialog({ open: false })}>Cancel</Button>
            <Button onClick={handleRecordPayment} disabled={!paymentForm.paymentAmount || recordPayment.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <CreditCard className="w-4 h-4 mr-2" />
              Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approval/Action Dialog */}
      <Dialog open={approvalDialog.open} onOpenChange={(o) => setApprovalDialog({ ...approvalDialog, open: o })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {approvalDialog.action === "approve" && "PM Approve RA Bill"}
              {approvalDialog.action === "revision" && "Request Revision"}
              {approvalDialog.action === "certify" && "Certify Payment"}
              {approvalDialog.action === "generate-invoice" && "Generate Client Invoice"}
            </DialogTitle>
            <DialogDescription>This action will update the RA Bill workflow status.</DialogDescription>
          </DialogHeader>
          <div className="py-2 space-y-1.5">
            <label className="text-sm font-semibold">Comments</label>
            <Textarea placeholder="Add comments..." rows={3} value={approvalComments}
              onChange={e => setApprovalComments(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setApprovalDialog({ open: false })}>Cancel</Button>
            <Button onClick={handleApprovalAction}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
