import { useState } from "react";
import { Link, useRoute } from "wouter";
import {
  useWorkflowInvoice,
  useSendWorkflowInvoice,
  useRecordInvoicePayment,
  useSendPaymentReminder,
  useReconcileInvoice,
  useCloseInvoice,
  useGetCurrentUser,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Calendar,
  Building,
  User,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  CreditCard,
  Bell,
  CheckSquare,
  ShieldCheck,
  Send,
  Lock,
  DollarSign,
  TrendingDown,
  Upload,
  Clock,
  Mail,
  Phone,
} from "lucide-react";
import { format } from "date-fns";

export default function InvoiceDetail() {
  const [, params] = useRoute("/ra-bills/invoices/:id");
  const id = Number(params?.id);

  const { data: user } = useGetCurrentUser();
  const { data: invoice, isLoading, refetch } = useWorkflowInvoice(id);

  const sendInvoice = useSendWorkflowInvoice();
  const recordPayment = useRecordInvoicePayment();
  const sendReminder = useSendPaymentReminder();
  const reconcile = useReconcileInvoice();
  const closeInv = useCloseInvoice();

  // Modals state
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientNotes, setRecipientNotes] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("Net 30 Days");

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payDate, setPayDate] = useState(new Date().toISOString().split("T")[0]);
  const [payMode, setPayMode] = useState("bank_transfer");
  const [bankRef, setBankRef] = useState("");
  const [txnId, setTxnId] = useState("");
  const [payRemarks, setPayRemarks] = useState("");

  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [reminderType, setReminderType] = useState("email");
  const [reminderSubject, setReminderSubject] = useState("");
  const [reminderMessage, setReminderMessage] = useState("");
  const [reminderRecipient, setReminderRecipient] = useState("");
  const [followUpRemarks, setFollowUpRemarks] = useState("");

  const [isReconcileModalOpen, setIsReconcileModalOpen] = useState(false);
  const [reconcileRemarks, setReconcileRemarks] = useState("");

  if (isLoading) {
    return <div className="p-12 text-center text-muted-foreground">Loading invoice details...</div>;
  }

  if (!invoice) {
    return (
      <div className="p-12 text-center space-y-4">
        <h2 className="text-xl font-bold">Invoice Not Found</h2>
        <Link href="/ra-bills">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  const handleSendInvoice = async () => {
    await sendInvoice.mutateAsync({
      id,
      recipientEmail: recipientEmail || invoice.recipientEmail,
      recipientNotes,
      paymentTerms,
    });
    setIsSendModalOpen(false);
    refetch();
  };

  const handleRecordPayment = async () => {
    if (!payAmount || Number(payAmount) <= 0) {
      alert("Please enter a valid payment amount greater than 0.");
      return;
    }

    await recordPayment.mutateAsync({
      invoiceId: id,
      data: {
        paymentAmount: Number(payAmount),
        paymentDate: payDate,
        paymentMode: payMode,
        bankReference: bankRef || undefined,
        transactionId: txnId || undefined,
        remarks: payRemarks || undefined,
      },
    });

    setIsPaymentModalOpen(false);
    setPayAmount("");
    setBankRef("");
    setTxnId("");
    setPayRemarks("");
    refetch();
  };

  const handleSendReminder = async () => {
    if (!reminderMessage.trim()) {
      alert("Please enter a reminder message.");
      return;
    }

    await sendReminder.mutateAsync({
      invoiceId: id,
      data: {
        reminderType,
        subject: reminderSubject || undefined,
        message: reminderMessage,
        recipient: reminderRecipient || undefined,
        followUpRemarks: followUpRemarks || undefined,
      },
    });

    setIsReminderModalOpen(false);
    setReminderMessage("");
    setReminderSubject("");
    refetch();
  };

  const handleReconcile = async () => {
    await reconcile.mutateAsync({
      id,
      reconciliationRemarks: reconcileRemarks || undefined,
    });
    setIsReconcileModalOpen(false);
    setReconcileRemarks("");
    refetch();
  };

  const handleCloseInvoice = async () => {
    if (!confirm("Are you sure you want to close this invoice? Once closed, no further payments or modifications can be made.")) {
      return;
    }
    await closeInv.mutateAsync(id);
    refetch();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "closed":
        return <Badge className="bg-slate-700 hover:bg-slate-800 text-white gap-1"><Lock className="w-3.5 h-3.5" /> CLOSED</Badge>;
      case "reconciled":
        return <Badge className="bg-emerald-700 hover:bg-emerald-800 text-white gap-1"><ShieldCheck className="w-3.5 h-3.5" /> RECONCILED</Badge>;
      case "paid":
        return <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> FULLY PAID</Badge>;
      case "partially_paid":
        return <Badge className="bg-amber-600 hover:bg-amber-700 text-white gap-1"><Clock className="w-3.5 h-3.5" /> PARTIALLY PAID</Badge>;
      case "sent":
        return <Badge className="bg-blue-600 hover:bg-blue-700 text-white gap-1"><Send className="w-3.5 h-3.5" /> SENT TO CLIENT</Badge>;
      default:
        return <Badge variant="outline">DRAFT</Badge>;
    }
  };

  const totalAmount = invoice.netAmount || invoice.amount || 0;
  const paidPercent = totalAmount > 0 ? Math.min(100, Math.round((invoice.totalPaidAmount / totalAmount) * 100)) : 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link href="/ra-bills">
          <Button variant="ghost" size="sm" className="gap-1.5 h-8 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </Button>
        </Link>
        <span className="font-mono text-xs text-muted-foreground">Invoice #{invoice.id}</span>
      </div>

      {/* Header Info & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-mono text-sm px-2.5 py-0.5 rounded bg-muted font-bold">
              {invoice.invoiceNumber}
            </span>
            {getStatusBadge(invoice.status)}
            {invoice.reconciliationStatus === "reconciled" && (
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Reconciled
              </span>
            )}
            {invoice.billNumber && (
              <Link href={`/ra-bills/detail/${invoice.raBillId}`} className="text-xs text-primary underline">
                Ref: {invoice.billNumber}
              </Link>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Invoice for {invoice.clientName}</h1>
          <p className="text-xs text-muted-foreground flex items-center gap-4 mt-1 flex-wrap">
            <span className="flex items-center gap-1 font-medium text-foreground">
              <Building className="w-3.5 h-3.5" /> {invoice.projectName}
            </span>
            {invoice.contractTitle && (
              <span>Contract: {invoice.contractTitle}</span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Issued: {format(new Date(invoice.invoiceDate), "dd MMM yyyy")}
            </span>
            <span className="flex items-center gap-1 text-amber-600 font-medium">
              Due: {format(new Date(invoice.dueDate), "dd MMM yyyy")}
            </span>
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {invoice.status !== "closed" && (
            <>
              {invoice.status === "draft" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => {
                    setRecipientEmail(invoice.vendorEmail || "");
                    setIsSendModalOpen(true);
                  }}
                >
                  <Send className="w-3.5 h-3.5" /> Send to Client
                </Button>
              )}

              {invoice.outstandingAmount > 0 && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-amber-600 border-amber-300 hover:bg-amber-50"
                    onClick={() => {
                      setReminderRecipient(invoice.vendorEmail || "");
                      setReminderSubject(`Friendly Payment Reminder: Invoice ${invoice.invoiceNumber}`);
                      setReminderMessage(
                        `Dear ${invoice.clientName},\n\nThis is a reminder that Invoice ${invoice.invoiceNumber} for ₹${invoice.outstandingAmount.toLocaleString()} is due on ${format(new Date(invoice.dueDate), "dd MMM yyyy")}. Please process the outstanding payment at your earliest convenience.\n\nThank you,\nFinance & Accounts Team`
                      );
                      setIsReminderModalOpen(true);
                    }}
                  >
                    <Bell className="w-3.5 h-3.5" /> Send Reminder
                  </Button>
                  <Button
                    size="sm"
                    className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => {
                      setPayAmount(String(invoice.outstandingAmount));
                      setIsPaymentModalOpen(true);
                    }}
                  >
                    <CreditCard className="w-3.5 h-3.5" /> Record Payment
                  </Button>
                </>
              )}

              {invoice.reconciliationStatus !== "reconciled" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-blue-600 border-blue-300 hover:bg-blue-50"
                  onClick={() => setIsReconcileModalOpen(true)}
                >
                  <CheckSquare className="w-3.5 h-3.5" /> Reconcile
                </Button>
              )}

              {invoice.reconciliationStatus === "reconciled" && invoice.outstandingAmount <= 0 && (
                <Button
                  size="sm"
                  className="gap-1.5 bg-slate-800 hover:bg-slate-900 text-white"
                  onClick={handleCloseInvoice}
                  disabled={closeInv.isPending}
                >
                  <Lock className="w-3.5 h-3.5" /> Close Invoice
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Progress Bar & Financial KPIs */}
      <Card className="border shadow-sm p-4 bg-card space-y-4">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span>Payment Progress ({paidPercent}%)</span>
          <span className="text-muted-foreground">
            ₹{invoice.totalPaidAmount.toLocaleString()} of ₹{totalAmount.toLocaleString()} Paid
          </span>
        </div>
        <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-600 transition-all duration-500 rounded-full"
            style={{ width: `${paidPercent}%` }}
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
          <div>
            <span className="text-xs text-muted-foreground">Net Invoice Amount</span>
            <p className="text-xl font-bold text-foreground">₹{totalAmount.toLocaleString()}</p>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">Total Paid to Date</span>
            <p className="text-xl font-bold text-emerald-600">₹{invoice.totalPaidAmount.toLocaleString()}</p>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">Outstanding Balance</span>
            <p className="text-xl font-bold text-amber-600">₹{invoice.outstandingAmount.toLocaleString()}</p>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">Reconciliation Status</span>
            <p className="text-sm font-bold uppercase mt-1">
              {invoice.reconciliationStatus === "reconciled" ? (
                <span className="text-emerald-600">✓ RECONCILED</span>
              ) : (
                <span className="text-muted-foreground">PENDING</span>
              )}
            </p>
          </div>
        </div>
      </Card>

      {/* Payment History & Ledger */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3 border-b bg-muted/20 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-primary" /> Recorded Payments Ledger
            </CardTitle>
            <CardDescription className="text-xs">
              Chronological log of payments received against this invoice.
            </CardDescription>
          </div>

          {invoice.outstandingAmount > 0 && invoice.status !== "closed" && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1"
              onClick={() => {
                setPayAmount(String(invoice.outstandingAmount));
                setIsPaymentModalOpen(true);
              }}
            >
              <CreditCard className="w-3.5 h-3.5" /> + Add Payment
            </Button>
          )}
        </CardHeader>
        <CardContent className="pt-4">
          {(!invoice.payments || invoice.payments.length === 0) ? (
            <div className="p-8 text-center text-xs text-muted-foreground space-y-2">
              <CreditCard className="w-8 h-8 mx-auto text-muted-foreground/40" />
              <p>No payments recorded yet for this invoice.</p>
              {invoice.status !== "closed" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsPaymentModalOpen(true)}
                  className="text-xs"
                >
                  Record First Payment
                </Button>
              )}
            </div>
          ) : (
            <div className="border rounded-md overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead className="bg-muted/70 text-muted-foreground font-semibold border-b">
                  <tr>
                    <th className="p-2.5">Payment #</th>
                    <th className="p-2.5">Date</th>
                    <th className="p-2.5">Payment Mode</th>
                    <th className="p-2.5">Bank Ref / Txn ID</th>
                    <th className="p-2.5 text-right font-bold text-foreground">Amount (₹)</th>
                    <th className="p-2.5">Recorded By</th>
                    <th className="p-2.5">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {invoice.payments.map((pay) => (
                    <tr key={pay.id} className="hover:bg-accent/20">
                      <td className="p-2.5 font-mono font-medium">{pay.paymentNumber}</td>
                      <td className="p-2.5">{format(new Date(pay.paymentDate), "dd MMM yyyy")}</td>
                      <td className="p-2.5 font-medium uppercase text-muted-foreground">
                        {pay.paymentMode.replace("_", " ")}
                      </td>
                      <td className="p-2.5 font-mono text-muted-foreground">
                        {pay.bankReference || pay.transactionId || "—"}
                      </td>
                      <td className="p-2.5 text-right font-bold text-emerald-600">
                        ₹{pay.paymentAmount.toLocaleString()}
                      </td>
                      <td className="p-2.5 text-muted-foreground">{pay.recorderName || "User"}</td>
                      <td className="p-2.5 text-muted-foreground">{pay.remarks || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reminders & Follow-up History */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3 border-b bg-muted/20 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" /> Reminders & Follow-up History
            </CardTitle>
            <CardDescription className="text-xs">
              Record of automated and manual payment reminders sent to the client.
            </CardDescription>
          </div>

          {invoice.outstandingAmount > 0 && invoice.status !== "closed" && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1"
              onClick={() => setIsReminderModalOpen(true)}
            >
              <Bell className="w-3.5 h-3.5" /> + New Reminder
            </Button>
          )}
        </CardHeader>
        <CardContent className="pt-4">
          {(!invoice.reminders || invoice.reminders.length === 0) ? (
            <div className="p-6 text-center text-xs text-muted-foreground">
              No payment reminders sent yet.
            </div>
          ) : (
            <div className="space-y-3">
              {invoice.reminders.map((rem) => (
                <div key={rem.id} className="p-3 border rounded-lg bg-card text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <Bell className="w-3.5 h-3.5 text-amber-500" />
                      {rem.reminderType} Reminder
                      {rem.recipient && <span className="text-muted-foreground font-normal">→ {rem.recipient}</span>}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {format(new Date(rem.reminderDate), "dd MMM yyyy, hh:mm a")}
                    </span>
                  </div>
                  {rem.subject && <p className="font-semibold text-foreground">{rem.subject}</p>}
                  <p className="text-muted-foreground bg-muted/40 p-2 rounded whitespace-pre-line">
                    {rem.message}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Sent by: {rem.senderName || "Finance User"}
                    {rem.followUpRemarks && ` • Follow-up notes: ${rem.followUpRemarks}`}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Record Payment Dialog */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record Payment Received</DialogTitle>
            <DialogDescription>
              Record full or partial payment against invoice {invoice.invoiceNumber}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label className="text-xs">Payment Amount (₹) *</Label>
              <Input
                type="number"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                placeholder="Enter amount"
              />
              <span className="text-[10px] text-muted-foreground">
                Current outstanding balance: ₹{invoice.outstandingAmount.toLocaleString()}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Payment Date *</Label>
                <Input
                  type="date"
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Payment Mode *</Label>
                <Select value={payMode} onValueChange={setPayMode}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank_transfer">Bank Transfer (NEFT/RTGS)</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="credit_card">Credit Card</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Bank Reference / UTR</Label>
                <Input
                  value={bankRef}
                  onChange={(e) => setBankRef(e.target.value)}
                  placeholder="e.g. HDFC202609001"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Transaction ID</Label>
                <Input
                  value={txnId}
                  onChange={(e) => setTxnId(e.target.value)}
                  placeholder="e.g. TXN-98212"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Remarks / Notes</Label>
              <Input
                value={payRemarks}
                onChange={(e) => setPayRemarks(e.target.value)}
                placeholder="e.g. Part payment received via RTGS"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentModalOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleRecordPayment}
              disabled={recordPayment.isPending}
            >
              {recordPayment.isPending ? "Recording..." : "Record Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send to Client Dialog */}
      <Dialog open={isSendModalOpen} onOpenChange={setIsSendModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Send Invoice to Client / Vendor</DialogTitle>
            <DialogDescription>
              Mark invoice as dispatched and record client notification details.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label className="text-xs">Recipient Email</Label>
              <Input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="accounts@vendor.com"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Payment Terms</Label>
              <Input
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Email / Dispatch Notes</Label>
              <Textarea
                rows={3}
                value={recipientNotes}
                onChange={(e) => setRecipientNotes(e.target.value)}
                placeholder="Enclosed please find certified RA bill invoice for payment..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSendModalOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleSendInvoice}
              disabled={sendInvoice.isPending}
            >
              {sendInvoice.isPending ? "Sending..." : "Mark as Sent"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Reminder Dialog */}
      <Dialog open={isReminderModalOpen} onOpenChange={setIsReminderModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Send Payment Reminder</DialogTitle>
            <DialogDescription>
              Issue follow-up reminder for overdue or upcoming invoice balance.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Reminder Mode</Label>
                <Select value={reminderType} onValueChange={setReminderType}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email Notice</SelectItem>
                    <SelectItem value="call">Phone Call Follow-up</SelectItem>
                    <SelectItem value="letter">Official Letter</SelectItem>
                    <SelectItem value="system">System Notification</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Recipient / Contact</Label>
                <Input
                  value={reminderRecipient}
                  onChange={(e) => setReminderRecipient(e.target.value)}
                  placeholder="Email or phone..."
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Subject</Label>
              <Input
                value={reminderSubject}
                onChange={(e) => setReminderSubject(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Message *</Label>
              <Textarea
                rows={4}
                value={reminderMessage}
                onChange={(e) => setReminderMessage(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Internal Follow-up Notes</Label>
              <Input
                value={followUpRemarks}
                onChange={(e) => setFollowUpRemarks(e.target.value)}
                placeholder="e.g. Client CFO promised payment by Friday"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReminderModalOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-amber-600 hover:bg-amber-700 text-white"
              onClick={handleSendReminder}
              disabled={sendReminder.isPending}
            >
              {sendReminder.isPending ? "Sending..." : "Send Reminder"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reconcile Dialog */}
      <Dialog open={isReconcileModalOpen} onOpenChange={setIsReconcileModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reconcile with Accounting</DialogTitle>
            <DialogDescription>
              Verify payment receipts against bank statements and reconcile with accounting books.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label className="text-xs">Reconciliation Remarks / Ledger Entry</Label>
              <Textarea
                rows={3}
                value={reconcileRemarks}
                onChange={(e) => setReconcileRemarks(e.target.value)}
                placeholder="e.g. Bank statement transaction verified on HDFC Account #... matched in Tally/ERP."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReconcileModalOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleReconcile}
              disabled={reconcile.isPending}
            >
              {reconcile.isPending ? "Reconciling..." : "Confirm Reconciliation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
