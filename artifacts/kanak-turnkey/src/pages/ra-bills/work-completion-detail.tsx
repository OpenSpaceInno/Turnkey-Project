import { useState } from "react";
import { Link, useRoute } from "wouter";
import {
  useWorkCompletion,
  useSubmitWorkCompletion,
  useVerifyWorkCompletion,
  useRequestWorkCompletionCorrection,
  useAddWorkCompletionDocument,
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
} from "lucide-react";
import { format } from "date-fns";

export default function WorkCompletionDetail() {
  const [, params] = useRoute("/ra-bills/work-completions/:id");
  const id = Number(params?.id);

  const { data: user } = useGetCurrentUser();
  const { data: wc, isLoading, refetch } = useWorkCompletion(id);

  const submitWc = useSubmitWorkCompletion();
  const verifyWc = useVerifyWorkCompletion();
  const requestCorrection = useRequestWorkCompletionCorrection();
  const addDoc = useAddWorkCompletionDocument();

  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);
  const [correctionReason, setCorrectionReason] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  if (isLoading) {
    return <div className="p-12 text-center text-muted-foreground">Loading work completion details...</div>;
  }

  if (!wc) {
    return (
      <div className="p-12 text-center space-y-4">
        <h2 className="text-xl font-bold">Work Completion Not Found</h2>
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

  const totalCurrentValue = (wc.items || []).reduce(
    (sum, item) => sum + (Number(item.currentAmount) || 0),
    0
  );

  const handleVerify = async () => {
    if (!confirm("Are you sure you want to verify this work completion? This will update the contractor's completed quantities.")) {
      return;
    }
    await verifyWc.mutateAsync(id);
    refetch();
  };

  const handleCorrectionSubmit = async () => {
    if (!correctionReason.trim()) {
      alert("Please provide the correction reason.");
      return;
    }
    await requestCorrection.mutateAsync({ id, reason: correctionReason });
    setIsCorrectionModalOpen(false);
    setCorrectionReason("");
    refetch();
  };

  const handleSubmitForVerification = async () => {
    await submitWc.mutateAsync(id);
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
      case "verified":
        return <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> VERIFIED</Badge>;
      case "submitted":
        return <Badge className="bg-blue-600 hover:bg-blue-700 text-white gap-1"><Send className="w-3.5 h-3.5" /> PENDING VERIFICATION</Badge>;
      case "correction_required":
        return <Badge variant="destructive" className="gap-1"><AlertTriangle className="w-3.5 h-3.5" /> CORRECTION REQUIRED</Badge>;
      default:
        return <Badge variant="outline">DRAFT</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link href="/ra-bills">
          <Button variant="ghost" size="sm" className="gap-1.5 h-8 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to RA Bills
          </Button>
        </Link>
        <span className="font-mono text-xs text-muted-foreground">ID: #{wc.id}</span>
      </div>

      {/* Verified Banner Callout */}
      {wc.status === "verified" && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-emerald-950 dark:text-emerald-300">
                Work Completion Verified by {wc.verifierName || "Project Manager"}
              </h3>
              <p className="text-xs text-emerald-800 dark:text-emerald-400">
                Site measurements verified on {wc.verifiedAt ? format(new Date(wc.verifiedAt), "dd MMM yyyy, hh:mm a") : "today"}. Ready to prepare RA Bill.
              </p>
            </div>
          </div>
          <Link href={`/ra-bills/new?workCompletionId=${wc.id}&contractId=${wc.contractId}`}>
            <Button size="sm" className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium shrink-0">
              Prepare RA Bill <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      )}

      {/* Correction Required Banner */}
      {wc.status === "correction_required" && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-amber-900 dark:text-amber-200 text-sm">
              Correction Requested by Project Manager
            </h4>
            <p className="text-xs text-amber-800 dark:text-amber-300">
              "{wc.correctionReason}"
            </p>
            <div className="pt-2">
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs border-amber-500/50"
                onClick={handleSubmitForVerification}
                disabled={submitWc.isPending}
              >
                Re-submit for Verification
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
              {wc.workCompletionNumber}
            </span>
            {getStatusBadge(wc.status)}
            {wc.milestone && (
              <span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 font-medium">
                {wc.milestone}
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{wc.title}</h1>
          <p className="text-xs text-muted-foreground flex items-center gap-4 mt-1 flex-wrap">
            <span className="flex items-center gap-1 font-medium text-foreground">
              <Building className="w-3.5 h-3.5" /> {wc.projectName}
            </span>
            <span className="flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" /> Contract: {wc.contractTitle} ({wc.contractNumber})
            </span>
            <span className="flex items-center gap-1">
              <User className="w-3.5 h-3.5" /> Vendor: {wc.vendorName}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Completion Date: {format(new Date(wc.completionDate), "dd MMM yyyy")}
            </span>
          </p>
        </div>

        {/* Action Controls for PM / Engineer */}
        <div className="flex items-center gap-2">
          {wc.status === "draft" && (
            <Button
              size="sm"
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleSubmitForVerification}
              disabled={submitWc.isPending}
            >
              <Send className="w-4 h-4" /> Submit for Verification
            </Button>
          )}

          {wc.status === "submitted" && isManagerOrAdmin && (
            <>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-amber-600 border-amber-300 hover:bg-amber-50"
                onClick={() => setIsCorrectionModalOpen(true)}
              >
                <AlertTriangle className="w-4 h-4" /> Request Correction
              </Button>
              <Button
                size="sm"
                className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={handleVerify}
                disabled={verifyWc.isPending}
              >
                <ShieldCheck className="w-4 h-4" /> Verify Measurements
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Summary Stats Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-medium">Verified Work Value</CardDescription>
            <CardTitle className="text-2xl font-bold text-emerald-600">
              ₹{totalCurrentValue.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Sum of measured completed line items</p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-medium">Measured Line Items</CardDescription>
            <CardTitle className="text-2xl font-bold">
              {wc.items?.length || 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Items with work progress recorded</p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-medium">Attached Proofs</CardDescription>
            <CardTitle className="text-2xl font-bold flex items-center justify-between">
              {wc.documents?.length || 0}
              <Paperclip className="w-5 h-5 text-muted-foreground/60" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">JMR sheets, test certificates, photos</p>
          </CardContent>
        </Card>
      </div>

      {/* BOQ Line Items Table */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3 border-b bg-muted/20 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" /> Measured Quantities Abstract
            </CardTitle>
            <CardDescription className="text-xs">
              Itemized measurements comparing contract baseline with previous and current progress.
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
                  <th className="p-2.5 w-24 text-right">Agreed Qty</th>
                  <th className="p-2.5 w-20 text-right">Rate (₹)</th>
                  <th className="p-2.5 w-24 text-right">Prev Verified</th>
                  <th className="p-2.5 w-24 text-right font-bold text-foreground">Current Measured</th>
                  <th className="p-2.5 w-24 text-right text-blue-600">Cumulative</th>
                  <th className="p-2.5 w-28 text-right font-bold">Current Amount</th>
                  <th className="p-2.5 w-32">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(wc.items || []).map((item, idx) => (
                  <tr key={item.id} className="hover:bg-accent/20">
                    <td className="p-2.5 font-mono text-muted-foreground">{item.itemNumber || idx + 1}</td>
                    <td className="p-2.5 font-medium">{item.description}</td>
                    <td className="p-2.5 text-muted-foreground">{item.unit}</td>
                    <td className="p-2.5 text-right">{item.contractQty}</td>
                    <td className="p-2.5 text-right">₹{item.rate.toLocaleString()}</td>
                    <td className="p-2.5 text-right text-muted-foreground">{item.previousCompletedQty}</td>
                    <td className="p-2.5 text-right font-bold text-foreground">{item.currentCompletedQty}</td>
                    <td className="p-2.5 text-right font-semibold text-blue-600">{item.cumulativeQty}</td>
                    <td className="p-2.5 text-right font-bold text-foreground">
                      ₹{item.currentAmount.toLocaleString()}
                    </td>
                    <td className="p-2.5 text-muted-foreground">{item.remarks || "—"}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-muted/40 font-bold border-t">
                <tr>
                  <td colSpan={8} className="p-2.5 text-right">Total Measured Billable Amount:</td>
                  <td className="p-2.5 text-right text-emerald-600 text-sm">
                    ₹{totalCurrentValue.toLocaleString()}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {wc.remarks && (
            <div className="mt-4 p-3 bg-muted/30 rounded-md border text-xs">
              <span className="font-semibold text-muted-foreground block mb-0.5">Site Engineer Remarks:</span>
              <p className="text-foreground">{wc.remarks}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Supporting Documents Section */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3 border-b bg-muted/20 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Paperclip className="w-4 h-4 text-primary" /> Supporting Documents & JMR
            </CardTitle>
            <CardDescription className="text-xs">
              Verification documents attached to this work completion record.
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
            <p className="text-xs text-blue-600 animate-pulse mb-3">Uploading document...</p>
          )}

          {(!wc.documents || wc.documents.length === 0) ? (
            <div className="p-6 text-center text-xs text-muted-foreground">
              No documents attached yet. Click "Upload File" above to attach inspection photos or JMR sheets.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {wc.documents.map((doc) => (
                <div
                  key={doc.id}
                  className="p-3 border rounded-lg bg-card flex items-center justify-between hover:bg-accent/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-muted flex items-center justify-center text-primary">
                      <FileCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-semibold text-primary hover:underline block truncate max-w-[200px]"
                      >
                        {doc.fileName}
                      </a>
                      <span className="text-[10px] text-muted-foreground block uppercase">
                        {doc.documentType.replace("_", " ")} • {format(new Date(doc.uploadedAt), "dd MMM yyyy")}
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

      {/* Correction Request Dialog */}
      <Dialog open={isCorrectionModalOpen} onOpenChange={setIsCorrectionModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Request Work Completion Correction</DialogTitle>
            <DialogDescription>
              Specify the discrepancies or necessary revisions required from the site team before verification.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label className="text-xs">Reason for Correction / Revision *</Label>
              <Textarea
                placeholder="e.g. Concrete cube strength report missing for beam B-12. Please attach lab test certificate."
                rows={4}
                value={correctionReason}
                onChange={(e) => setCorrectionReason(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCorrectionModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleCorrectionSubmit}
              disabled={requestCorrection.isPending}
            >
              {requestCorrection.isPending ? "Submitting..." : "Send Revision Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
