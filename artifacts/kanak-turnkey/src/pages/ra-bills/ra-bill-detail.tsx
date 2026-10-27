import { useState } from "react";
import { Link, useRoute } from "wouter";
import {
  useWorkflowRaBill,
  useSubmitWorkflowRaBill,
  useApproveWorkflowRaBill,
  useRequestRevisionWorkflowRaBill,
  useGenerateInvoiceFromRaBill,
  useAddWorkflowRaBillDocument,
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
  ArrowLeft,
  Calendar,
  Building,
  User,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Paperclip,
  Upload,
  ArrowRight,
  ShieldCheck,
  Send,
  Layers,
  FileText,
  DollarSign,
  Receipt,
  Clock,
  ExternalLink,
} from "lucide-react";
import { format } from "date-fns";

export default function RaBillDetail() {
  const [, params] = useRoute("/ra-bills/detail/:id");
  const id = Number(params?.id);

  const { data: user } = useGetCurrentUser();
  const { data: bill, isLoading, refetch } = useWorkflowRaBill(id);

  const submitBill = useSubmitWorkflowRaBill();
  const approveBill = useApproveWorkflowRaBill();
  const requestRevision = useRequestRevisionWorkflowRaBill();
  const generateInvoice = useGenerateInvoiceFromRaBill();
  const addDoc = useAddWorkflowRaBillDocument();

  // Modals state
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [approvalComments, setApprovalComments] = useState("");

  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [revisionReason, setRevisionReason] = useState("");

  const [isGenerateInvoiceModalOpen, setIsGenerateInvoiceModalOpen] = useState(false);
  const [invoiceTerms, setInvoiceTerms] = useState("Net 30 Days");
  const [invoiceDueDate, setInvoiceDueDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );

  const [isUploading, setIsUploading] = useState(false);

  if (isLoading) {
    return <div className="p-12 text-center text-muted-foreground">Loading RA Bill details...</div>;
  }

  if (!bill) {
    return (
      <div className="p-12 text-center space-y-4">
        <h2 className="text-xl font-bold">RA Bill Not Found</h2>
        <Link href="/ra-bills">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  const isManagerOrAdmin =
    user?.activeRole === "admin" ||
    user?.activeRole === "project_manager" ||
    (Array.isArray(user?.roles) &&
      (user?.roles.includes("admin") || user?.roles.includes("project_manager")));

  const handleApprove = async () => {
    await approveBill.mutateAsync({ id, comments: approvalComments || undefined });
    setIsApproveModalOpen(false);
    setApprovalComments("");
    refetch();
  };

  const handleRevisionSubmit = async () => {
    if (!revisionReason.trim()) {
      alert("Please provide a reason for requesting revision.");
      return;
    }
    await requestRevision.mutateAsync({ id, reason: revisionReason });
    setIsRevisionModalOpen(false);
    setRevisionReason("");
    refetch();
  };

  const handleGenerateInvoice = async () => {
    await generateInvoice.mutateAsync({
      raBillId: id,
      paymentTerms: invoiceTerms,
      dueDate: invoiceDueDate,
    });
    setIsGenerateInvoiceModalOpen(false);
    refetch();
  };

  const handleSubmitForApproval = async () => {
    await submitBill.mutateAsync(id);
    refetch();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, docType: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();

      await addDoc.mutateAsync({
        id,
        document: {
          documentType: docType,
          fileName: data.fileName || file.name,
          fileUrl: data.fileUrl,
          fileSize: data.fileSize || file.size,
        },
      });
      refetch();
    } catch (err) {
      console.error(err);
      alert("Failed to upload document");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> PM APPROVED</Badge>;
      case "submitted":
        return <Badge className="bg-blue-600 hover:bg-blue-700 text-white gap-1"><Clock className="w-3.5 h-3.5" /> PENDING PM APPROVAL</Badge>;
      case "revision_requested":
        return <Badge variant="destructive" className="gap-1"><AlertTriangle className="w-3.5 h-3.5" /> REVISION REQUESTED</Badge>;
      case "invoice_generated":
        return <Badge className="bg-purple-600 hover:bg-purple-700 text-white gap-1"><Receipt className="w-3.5 h-3.5" /> INVOICE GENERATED</Badge>;
      default:
        return <Badge variant="outline">DRAFT</Badge>;
    }
  };

  const remainingContractAmount = Math.max(
    0,
    (bill.contractTotal || 0) - (bill.grossAmount || 0)
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link href="/ra-bills">
          <Button variant="ghost" size="sm" className="gap-1.5 h-8 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to RA Bills
          </Button>
        </Link>
        <span className="font-mono text-xs text-muted-foreground">RA ID: #{bill.id}</span>
      </div>

      {/* Invoice Generated Callout Banner */}
      {bill.invoice && (
        <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-purple-950 dark:text-purple-300">
                Invoice {bill.invoice.invoiceNumber} Generated
              </h3>
              <p className="text-xs text-purple-800 dark:text-purple-400">
                Net invoice of ₹{bill.invoice.amount.toLocaleString()} is currently in status{" "}
                <span className="font-bold uppercase">{bill.invoice.status}</span>.
              </p>
            </div>
          </div>
          <Link href={`/ra-bills/invoices/${bill.invoice.id}`}>
            <Button size="sm" className="gap-2 bg-purple-600 hover:bg-purple-700 text-white font-medium shrink-0">
              Track & Pay Invoice <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      )}

      {/* Approved Ready for Invoice Banner */}
      {bill.status === "approved" && !bill.invoice && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-emerald-950 dark:text-emerald-300">
                RA Bill Approved by {bill.approverName || "Project Manager"}
              </h3>
              <p className="text-xs text-emerald-800 dark:text-emerald-400">
                Approval sign-off complete. Next step: Generate formal invoice and send to client / accounts for payment.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => setIsGenerateInvoiceModalOpen(true)}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium shrink-0"
          >
            <Receipt className="w-4 h-4" /> Generate Invoice
          </Button>
        </div>
      )}

      {/* Revision Requested Callout */}
      {bill.status === "revision_requested" && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-amber-900 dark:text-amber-200 text-sm">
              Revision Requested by Project Manager
            </h4>
            <p className="text-xs text-amber-800 dark:text-amber-300">
              "{bill.revisionReason}"
            </p>
            <div className="pt-2">
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs border-amber-500/50"
                onClick={handleSubmitForApproval}
                disabled={submitBill.isPending}
              >
                Re-submit for PM Approval
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-mono text-sm px-2.5 py-0.5 rounded bg-muted font-bold">
              {bill.billNumber}
            </span>
            {getStatusBadge(bill.status)}
            {bill.milestone && (
              <span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 font-medium">
                {bill.milestone}
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{bill.description}</h1>
          <p className="text-xs text-muted-foreground flex items-center gap-4 mt-1 flex-wrap">
            <span className="flex items-center gap-1 font-medium text-foreground">
              <Building className="w-3.5 h-3.5" /> {bill.projectName}
            </span>
            <span className="flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" /> Contract: {bill.contractTitle} ({bill.contractNumber})
            </span>
            <span className="flex items-center gap-1">
              <User className="w-3.5 h-3.5" /> Contractor: {bill.vendorName}
            </span>
            {bill.billingPeriodEnd && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Period End: {format(new Date(bill.billingPeriodEnd), "dd MMM yyyy")}
              </span>
            )}
          </p>
        </div>

        {/* Action Controls for PM */}
        <div className="flex items-center gap-2">
          {bill.status === "draft" && (
            <Button
              size="sm"
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleSubmitForApproval}
              disabled={submitBill.isPending}
            >
              <Send className="w-4 h-4" /> Submit for Approval
            </Button>
          )}

          {bill.status === "submitted" && isManagerOrAdmin && (
            <>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-amber-600 border-amber-300 hover:bg-amber-50"
                onClick={() => setIsRevisionModalOpen(true)}
              >
                <AlertTriangle className="w-4 h-4" /> Request Revision
              </Button>
              <Button
                size="sm"
                className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => setIsApproveModalOpen(true)}
              >
                <ShieldCheck className="w-4 h-4" /> Approve RA Bill
              </Button>
            </>
          )}

          {bill.status === "approved" && !bill.invoice && (
            <Button
              size="sm"
              className="gap-2 bg-purple-600 hover:bg-purple-700 text-white"
              onClick={() => setIsGenerateInvoiceModalOpen(true)}
            >
              <Receipt className="w-4 h-4" /> Generate Invoice
            </Button>
          )}
        </div>
      </div>

      {/* KPI Financial Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-medium">Gross Current Billed</CardDescription>
            <CardTitle className="text-xl font-bold">
              ₹{(bill.grossAmount || 0).toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Contract baseline: ₹{(bill.contractTotal || 0).toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-medium">Total Deductions</CardDescription>
            <CardTitle className="text-xl font-bold text-amber-600">
              - ₹{((bill.retentionAmount || 0) + (bill.advanceRecovery || 0) + (bill.tdsAmount || 0) + (bill.otherDeductions || 0)).toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Retention: ₹{(bill.retentionAmount || 0).toLocaleString()} ({bill.retentionPercent}%)</p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-medium">Net Payable Amount</CardDescription>
            <CardTitle className="text-2xl font-black text-emerald-600">
              ₹{(bill.netPayableAmount || 0).toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Includes GST: ₹{(bill.gstAmount || 0).toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-medium">Contract Remaining</CardDescription>
            <CardTitle className="text-xl font-bold text-blue-600">
              ₹{remainingContractAmount.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Unbilled contract balance</p>
          </CardContent>
        </Card>
      </div>

      {/* Abstract Sheet & BOQ Line Items */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3 border-b bg-muted/20 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Receipt className="w-4 h-4 text-primary" /> Measurement Abstract & Bill Quantities
            </CardTitle>
            <CardDescription className="text-xs">
              Itemized billing table showing previous, current, and cumulative quantities with contract rates.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="border rounded-md overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead className="bg-muted/70 text-muted-foreground font-semibold border-b">
                <tr>
                  <th className="p-2.5 w-12">#</th>
                  <th className="p-2.5">Scope Description</th>
                  <th className="p-2.5 w-16">Unit</th>
                  <th className="p-2.5 w-20 text-right">Rate (₹)</th>
                  <th className="p-2.5 w-24 text-right">Agreed Qty</th>
                  <th className="p-2.5 w-24 text-right">Prev Billed</th>
                  <th className="p-2.5 w-24 text-right font-bold text-foreground">Current Billed</th>
                  <th className="p-2.5 w-24 text-right text-blue-600">Cumulative</th>
                  <th className="p-2.5 w-28 text-right font-bold">Current Amount</th>
                  <th className="p-2.5 w-28 text-right text-muted-foreground">Cum. Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(bill.items || []).map((item, idx) => (
                  <tr key={item.id} className="hover:bg-accent/20">
                    <td className="p-2.5 font-mono text-muted-foreground">{item.itemNumber || idx + 1}</td>
                    <td className="p-2.5 font-medium">{item.description}</td>
                    <td className="p-2.5 text-muted-foreground">{item.unit}</td>
                    <td className="p-2.5 text-right">₹{item.rate.toLocaleString()}</td>
                    <td className="p-2.5 text-right text-muted-foreground">{item.contractQuantity}</td>
                    <td className="p-2.5 text-right text-muted-foreground">{item.previousBilledQty}</td>
                    <td className="p-2.5 text-right font-bold text-foreground">{item.currentBilledQty}</td>
                    <td className="p-2.5 text-right font-semibold text-blue-600">{item.cumulativeBilledQty}</td>
                    <td className="p-2.5 text-right font-bold text-foreground">
                      ₹{item.currentAmount.toLocaleString()}
                    </td>
                    <td className="p-2.5 text-right text-muted-foreground">
                      ₹{item.cumulativeAmount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Deductions Detailed Abstract */}
          <div className="mt-4 p-4 bg-muted/40 rounded-lg border text-xs max-w-md ml-auto space-y-2">
            <h4 className="font-bold uppercase tracking-wider text-muted-foreground border-b pb-1">
              Certificate Summary
            </h4>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Gross Measured Amount:</span>
              <span className="font-semibold">₹{(bill.grossAmount || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-emerald-600">
              <span>(+) GST ({bill.gstPercent}%):</span>
              <span className="font-semibold">+ ₹{(bill.gstAmount || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-amber-600">
              <span>(-) Retention ({bill.retentionPercent}%):</span>
              <span className="font-semibold">- ₹{(bill.retentionAmount || 0).toLocaleString()}</span>
            </div>
            {Number(bill.advanceRecovery) > 0 && (
              <div className="flex justify-between text-amber-600">
                <span>(-) Advance Recovery:</span>
                <span className="font-semibold">- ₹{(bill.advanceRecovery || 0).toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-amber-600">
              <span>(-) TDS ({bill.tdsPercent}%):</span>
              <span className="font-semibold">- ₹{(bill.tdsAmount || 0).toLocaleString()}</span>
            </div>
            {Number(bill.otherDeductions) > 0 && (
              <div className="flex justify-between text-amber-600">
                <span>(-) Other Deductions ({bill.deductionRemarks || "Misc"}):</span>
                <span className="font-semibold">- ₹{(bill.otherDeductions || 0).toLocaleString()}</span>
              </div>
            )}
            <div className="pt-2 border-t flex justify-between items-center text-sm font-bold">
              <span>Certified Net Payable:</span>
              <span className="text-lg text-primary font-black">
                ₹{(bill.netPayableAmount || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Supporting Documents & Audit Log Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Supporting Docs */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-3 border-b bg-muted/20 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-primary" /> Supporting Documents
              </CardTitle>
              <CardDescription className="text-xs">
                Measurement sheets, tax invoices, and verification sign-offs.
              </CardDescription>
            </div>
            <label className="cursor-pointer">
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1 pointer-events-none">
                <Upload className="w-3.5 h-3.5" /> Upload File
              </Button>
              <input
                type="file"
                className="hidden"
                onChange={(e) => handleFileUpload(e, "other")}
                disabled={isUploading}
              />
            </label>
          </CardHeader>
          <CardContent className="pt-4">
            {isUploading && (
              <p className="text-xs text-blue-600 animate-pulse mb-2">Uploading...</p>
            )}
            {(!bill.documents || bill.documents.length === 0) ? (
              <div className="p-6 text-center text-xs text-muted-foreground">
                No documents attached yet.
              </div>
            ) : (
              <div className="space-y-2">
                {bill.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-2.5 border rounded-md bg-card flex items-center justify-between text-xs hover:bg-accent/20"
                  >
                    <div className="flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-emerald-600" />
                      <div>
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-primary hover:underline block truncate max-w-[200px]"
                        >
                          {doc.fileName}
                        </a>
                        <span className="text-[10px] text-muted-foreground uppercase">
                          {doc.documentType.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                    <a href={doc.fileUrl} target="_blank" rel="noreferrer">
                      <Button variant="ghost" size="sm" className="h-7 text-xs">
                        View
                      </Button>
                    </a>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Approval History / Audit Trail */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-3 border-b bg-muted/20">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" /> Approval History & Audit Trail
            </CardTitle>
            <CardDescription className="text-xs">
              Complete chronological record of actions taken on this bill.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {(!bill.history || bill.history.length === 0) ? (
              <div className="p-6 text-center text-xs text-muted-foreground">
                No history recorded yet.
              </div>
            ) : (
              <div className="space-y-3">
                {bill.history.map((hist) => (
                  <div key={hist.id} className="flex items-start gap-2.5 text-xs">
                    <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground uppercase tracking-wider text-[11px]">
                          {hist.action.replace("_", " ")}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {format(new Date(hist.actionDate), "dd MMM yyyy, hh:mm a")}
                        </span>
                      </div>
                      <p className="text-muted-foreground text-[11px]">
                        By <span className="font-medium text-foreground">{hist.userName || "User"}</span> ({hist.userRole || "User"})
                      </p>
                      {hist.comments && (
                        <p className="mt-0.5 text-foreground bg-muted/50 p-1.5 rounded text-[11px]">
                          "{hist.comments}"
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* PM Approve Dialog */}
      <Dialog open={isApproveModalOpen} onOpenChange={setIsApproveModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Approve RA Bill</DialogTitle>
            <DialogDescription>
              Confirm approval for RA Bill {bill.billNumber} for ₹{(bill.netPayableAmount || 0).toLocaleString()}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label className="text-xs">Approval Comments / Certification Notes</Label>
              <Textarea
                placeholder="e.g. Certified for payment based on site verification of concrete works."
                rows={3}
                value={approvalComments}
                onChange={(e) => setApprovalComments(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApproveModalOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleApprove}
              disabled={approveBill.isPending}
            >
              {approveBill.isPending ? "Approving..." : "Confirm Approval"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revision Request Dialog */}
      <Dialog open={isRevisionModalOpen} onOpenChange={setIsRevisionModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Request RA Bill Revision</DialogTitle>
            <DialogDescription>
              Specify the deduction adjustments or measurement discrepancies that require revision.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label className="text-xs">Reason for Revision *</Label>
              <Textarea
                placeholder="e.g. Quantity for plastering exceeds approved BOQ limit. Apply 5% retention deduction correctly."
                rows={4}
                value={revisionReason}
                onChange={(e) => setRevisionReason(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRevisionModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRevisionSubmit}
              disabled={requestRevision.isPending}
            >
              {requestRevision.isPending ? "Submitting..." : "Send Revision Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generate Invoice Dialog */}
      <Dialog open={isGenerateInvoiceModalOpen} onOpenChange={setIsGenerateInvoiceModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Generate Tax Invoice</DialogTitle>
            <DialogDescription>
              Generate formal invoice from approved RA Bill {bill.billNumber} for ₹{(bill.netPayableAmount || 0).toLocaleString()}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label className="text-xs">Payment Terms</Label>
              <Input
                value={invoiceTerms}
                onChange={(e) => setInvoiceTerms(e.target.value)}
                placeholder="e.g. Net 30 Days"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Due Date</Label>
              <Input
                type="date"
                value={invoiceDueDate}
                onChange={(e) => setInvoiceDueDate(e.target.value)}
              />
            </div>

            <div className="p-3 bg-muted/40 rounded border text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Recipient:</span>
                <span className="font-semibold">{bill.vendorName || "Vendor"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Net Invoice Amount:</span>
                <span className="font-bold text-emerald-600">₹{(bill.netPayableAmount || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsGenerateInvoiceModalOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-purple-600 hover:bg-purple-700 text-white"
              onClick={handleGenerateInvoice}
              disabled={generateInvoice.isPending}
            >
              {generateInvoice.isPending ? "Generating..." : "Generate Invoice"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
