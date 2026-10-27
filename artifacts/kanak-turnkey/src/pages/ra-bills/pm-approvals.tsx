import { useState } from "react";
import { Link } from "wouter";
import {
  useWorkCompletions,
  useWorkflowRaBills,
  useVerifyWorkCompletion,
  useRequestWorkCompletionCorrection,
  useApproveWorkflowRaBill,
  useRequestRevisionWorkflowRaBill,
  useGetCurrentUser,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  FileText,
  ShieldCheck,
  Building,
  User,
  Calendar,
  Eye,
  ArrowRight,
} from "lucide-react";
import { format } from "date-fns";

export default function PmApprovalsPage() {
  const { data: user } = useGetCurrentUser();
  const [activeTab, setActiveTab] = useState("ra-bills");

  // Fetch submitted items
  const { data: pendingWcs, isLoading: loadingWcs, refetch: refetchWcs } = useWorkCompletions({
    status: "submitted",
  });
  const { data: pendingRaBills, isLoading: loadingRaBills, refetch: refetchRaBills } = useWorkflowRaBills({
    status: "submitted",
  });

  const verifyWc = useVerifyWorkCompletion();
  const requestCorrection = useRequestWorkCompletionCorrection();
  const approveBill = useApproveWorkflowRaBill();
  const requestRevision = useRequestRevisionWorkflowRaBill();

  // Dialog states
  const [wcCorrectionId, setWcCorrectionId] = useState<number | null>(null);
  const [wcCorrectionReason, setWcCorrectionReason] = useState("");

  const [raRevisionId, setRaRevisionId] = useState<number | null>(null);
  const [raRevisionReason, setRaRevisionReason] = useState("");

  const [raApproveId, setRaApproveId] = useState<number | null>(null);
  const [raApprovalComments, setRaApprovalComments] = useState("");

  const handleVerifyWc = async (id: number) => {
    if (confirm("Verify this work completion? This certifies measurements on site.")) {
      await verifyWc.mutateAsync(id);
      refetchWcs();
    }
  };

  const handleWcCorrection = async () => {
    if (!wcCorrectionId || !wcCorrectionReason.trim()) return;
    await requestCorrection.mutateAsync({ id: wcCorrectionId, reason: wcCorrectionReason });
    setWcCorrectionId(null);
    setWcCorrectionReason("");
    refetchWcs();
  };

  const handleApproveRa = async () => {
    if (!raApproveId) return;
    await approveBill.mutateAsync({ id: raApproveId, comments: raApprovalComments || undefined });
    setRaApproveId(null);
    setRaApprovalComments("");
    refetchRaBills();
  };

  const handleRaRevision = async () => {
    if (!raRevisionId || !raRevisionReason.trim()) return;
    await requestRevision.mutateAsync({ id: raRevisionId, reason: raRevisionReason });
    setRaRevisionId(null);
    setRaRevisionReason("");
    refetchRaBills();
  };

  const totalPendingWc = pendingWcs?.length || 0;
  const totalPendingRa = pendingRaBills?.length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Link href="/ra-bills" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            RA Bills & Payments
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="text-sm font-medium text-foreground">Approvals Queue</span>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-1">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Project Manager Approvals</h1>
            <p className="text-muted-foreground text-sm">
              Review and certify on-site work completions and approve contractor Running Account (RA) bills.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 font-semibold flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> {totalPendingWc + totalPendingRa} Total Pending
            </span>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full sm:w-[400px] grid-cols-2">
          <TabsTrigger value="ra-bills" className="gap-2">
            RA Bills
            {totalPendingRa > 0 && (
              <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">
                {totalPendingRa}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="work-completions" className="gap-2">
            Work Completions
            {totalPendingWc > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                {totalPendingWc}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── Pending RA Bills ── */}
        <TabsContent value="ra-bills" className="space-y-4 pt-2">
          {loadingRaBills ? (
            <div className="p-8 text-center text-muted-foreground">Loading pending RA bills...</div>
          ) : (!pendingRaBills || pendingRaBills.length === 0) ? (
            <div className="p-12 text-center border rounded-lg bg-card text-muted-foreground space-y-2">
              <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500 opacity-80" />
              <h3 className="font-semibold text-foreground">All Clear! No RA Bills Pending Approval</h3>
              <p className="text-xs">Any newly submitted contractor RA bills will appear here for PM sign-off.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingRaBills.map((bill) => (
                <Card key={bill.id} className="border shadow-sm overflow-hidden hover:border-primary/50 transition-colors">
                  <div className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-muted">
                          {bill.billNumber}
                        </span>
                        <Badge className="bg-blue-600 text-white text-[10px]">AWAITING PM APPROVAL</Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Building className="w-3.5 h-3.5" /> {bill.projectName}
                        </span>
                        {bill.milestone && (
                          <span className="text-xs text-blue-600 font-medium">
                            • {bill.milestone}
                          </span>
                        )}
                      </div>

                      <h3 className="font-semibold text-base text-foreground">{bill.description}</h3>
                      <p className="text-xs text-muted-foreground flex items-center gap-3 flex-wrap">
                        <span>Contractor: <strong className="text-foreground">{bill.vendorName}</strong></span>
                        <span>Contract: {bill.contractTitle}</span>
                        {bill.submittedAt && (
                          <span>Submitted: {format(new Date(bill.submittedAt), "dd MMM yyyy")}</span>
                        )}
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 self-end md:self-auto">
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">Certified Net Payable</div>
                        <div className="text-xl font-black text-emerald-600">
                          ₹{(bill.netPayableAmount || 0).toLocaleString()}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          Gross: ₹{(bill.grossAmount || 0).toLocaleString()} • Ret: {bill.retentionPercent}%
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link href={`/ra-bills/detail/${bill.id}`}>
                          <Button size="sm" variant="outline" className="h-8 gap-1 text-xs">
                            <Eye className="w-3.5 h-3.5" /> Review
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 gap-1 text-xs text-amber-600 border-amber-300 hover:bg-amber-50"
                          onClick={() => setRaRevisionId(bill.id)}
                        >
                          <AlertTriangle className="w-3.5 h-3.5" /> Revise
                        </Button>
                        <Button
                          size="sm"
                          className="h-8 gap-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={() => setRaApproveId(bill.id)}
                        >
                          <ShieldCheck className="w-3.5 h-3.5" /> Approve
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Pending Work Completions ── */}
        <TabsContent value="work-completions" className="space-y-4 pt-2">
          {loadingWcs ? (
            <div className="p-8 text-center text-muted-foreground">Loading pending work completions...</div>
          ) : (!pendingWcs || pendingWcs.length === 0) ? (
            <div className="p-12 text-center border rounded-lg bg-card text-muted-foreground space-y-2">
              <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500 opacity-80" />
              <h3 className="font-semibold text-foreground">No Work Completions Awaiting Verification</h3>
              <p className="text-xs">Logged milestone measurements submitted by site engineers will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingWcs.map((wc) => (
                <Card key={wc.id} className="border shadow-sm overflow-hidden hover:border-primary/50 transition-colors">
                  <div className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-muted">
                          {wc.workCompletionNumber}
                        </span>
                        <Badge className="bg-blue-600 text-white text-[10px]">AWAITING VERIFICATION</Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Building className="w-3.5 h-3.5" /> {wc.projectName}
                        </span>
                        {wc.milestone && (
                          <span className="text-xs text-blue-600 font-medium">
                            • {wc.milestone}
                          </span>
                        )}
                      </div>

                      <h3 className="font-semibold text-base text-foreground">{wc.title}</h3>
                      <p className="text-xs text-muted-foreground flex items-center gap-3 flex-wrap">
                        <span>Contractor: <strong className="text-foreground">{wc.vendorName}</strong></span>
                        <span>Contract: {wc.contractTitle}</span>
                        <span>Completion Date: {format(new Date(wc.completionDate), "dd MMM yyyy")}</span>
                        {wc.creatorName && <span>Logged by: {wc.creatorName}</span>}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-auto">
                      <Link href={`/ra-bills/work-completions/${wc.id}`}>
                        <Button size="sm" variant="outline" className="h-8 gap-1 text-xs">
                          <Eye className="w-3.5 h-3.5" /> Inspect JMR
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 gap-1 text-xs text-amber-600 border-amber-300 hover:bg-amber-50"
                        onClick={() => setWcCorrectionId(wc.id)}
                      >
                        <AlertTriangle className="w-3.5 h-3.5" /> Correction
                      </Button>
                      <Button
                        size="sm"
                        className="h-8 gap-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => handleVerifyWc(wc.id)}
                        disabled={verifyWc.isPending}
                      >
                        <ShieldCheck className="w-3.5 h-3.5" /> Verify Measurements
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* RA Approve Dialog */}
      <Dialog open={raApproveId !== null} onOpenChange={(open) => !open && setRaApproveId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Approve RA Bill</DialogTitle>
            <DialogDescription>
              Confirm project manager approval sign-off for certified billable amount.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label className="text-xs">Approval Comments / Certification Notes</Label>
              <Textarea
                placeholder="e.g. Certified for payment based on site inspection sign-off."
                rows={3}
                value={raApprovalComments}
                onChange={(e) => setRaApprovalComments(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRaApproveId(null)}>
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleApproveRa}
              disabled={approveBill.isPending}
            >
              {approveBill.isPending ? "Approving..." : "Confirm Approval"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* RA Revision Dialog */}
      <Dialog open={raRevisionId !== null} onOpenChange={(open) => !open && setRaRevisionId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Request RA Bill Revision</DialogTitle>
            <DialogDescription>
              State the specific reason or measurement adjustment required.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label className="text-xs">Reason for Revision *</Label>
              <Textarea
                placeholder="e.g. Correct retention deduction from 0% to 5% as per contract clause 4.2."
                rows={4}
                value={raRevisionReason}
                onChange={(e) => setRaRevisionReason(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRaRevisionId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRaRevision}
              disabled={requestRevision.isPending}
            >
              {requestRevision.isPending ? "Submitting..." : "Send Revision Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* WC Correction Dialog */}
      <Dialog open={wcCorrectionId !== null} onOpenChange={(open) => !open && setWcCorrectionId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Request Work Completion Correction</DialogTitle>
            <DialogDescription>
              Notify the site engineer of any missing documents or measurement errors.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label className="text-xs">Correction Notes *</Label>
              <Textarea
                placeholder="e.g. Concrete test cubes report missing for column grid C3."
                rows={4}
                value={wcCorrectionReason}
                onChange={(e) => setWcCorrectionReason(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setWcCorrectionId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleWcCorrection}
              disabled={requestCorrection.isPending}
            >
              {requestCorrection.isPending ? "Submitting..." : "Request Correction"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
