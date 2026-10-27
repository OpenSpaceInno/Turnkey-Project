import { useState } from "react";
import { useParams, useLocation, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
  ChevronLeft,
  CheckCircle2,
  Clock,
  Send,
  Truck,
  Package,
  FileCheck,
  Building2,
  Calendar,
  AlertCircle,
  ClipboardCheck,
  ArrowRight,
  ShieldCheck,
  Box,
  Printer,
  Download,
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const INR = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

const PO_STAGES = [
  { key: "draft", label: "Draft", icon: Clock },
  { key: "issued", label: "Issued to Vendor", icon: Send },
  { key: "acknowledged", label: "Acknowledged", icon: CheckCircle2 },
  { key: "in_transit", label: "In Transit", icon: Truck },
  { key: "delivered", label: "Delivered", icon: Package },
  { key: "completed", label: "QC Approved & Stocked", icon: ShieldCheck },
];

export default function PurchaseOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Modals state
  const [trackingModalOpen, setTrackingModalOpen] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [deliveryStatus, setDeliveryStatus] = useState("in_transit");
  const [trackingNotes, setTrackingNotes] = useState("");

  const [qcModalOpen, setQcModalOpen] = useState(false);
  const [qcInspectorName, setQcInspectorName] = useState("Quality Manager");
  const [qcGrade, setQcGrade] = useState("A");
  const [qcFindings, setQcFindings] = useState("Materials verified against specifications and found in good condition.");
  const [itemAcceptedQuantities, setItemAcceptedQuantities] = useState<Record<number, number>>({});

  // Fetch Purchase Order
  const { data: po, isLoading, refetch } = useQuery({
    queryKey: ["purchase-order", id],
    queryFn: async () => {
      const res = await fetch(`/api/procurement/purchase-orders/${id}`);
      if (!res.ok) throw new Error("Failed to fetch purchase order");
      return res.json();
    },
  });

  // Mutations
  const issueMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/procurement/purchase-orders/${id}/issue`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to issue PO");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "PO Issued", description: "Purchase order has been officially issued to the vendor." });
      refetch();
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to issue PO", variant: "destructive" });
    },
  });

  const acknowledgeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/procurement/purchase-orders/${id}/acknowledge`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: "Vendor confirmed order and delivery timeline" }),
      });
      if (!res.ok) throw new Error("Failed to acknowledge PO");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Acknowledged", description: "Vendor acknowledgment recorded. PO is now active." });
      refetch();
    },
  });

  const trackingMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/procurement/purchase-orders/${id}/tracking`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliveryStatus,
          trackingNumber,
          notes: trackingNotes,
        }),
      });
      if (!res.ok) throw new Error("Failed to update tracking");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Tracking Updated", description: `PO delivery status set to ${deliveryStatus.replace('_', ' ')}.` });
      setTrackingModalOpen(false);
      refetch();
    },
  });

  // Receive Delivery & QC Approval Mutation
  const qcApprovalMutation = useMutation({
    mutationFn: async () => {
      // 1. Create Receipt
      const receiptRes = await fetch("/api/procurement/receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          poId: Number(id),
          deliveryNoteNumber: `DN-${Date.now().toString().slice(-6)}`,
          remarks: "Delivery received on site.",
        }),
      });
      if (!receiptRes.ok) {
        const err = await receiptRes.json().catch(() => ({}));
        throw new Error(err.error || "Failed to create goods receipt (GRN)");
      }
      const receipt = await receiptRes.json();

      // 2. Create Quality Inspection
      const inspectionRes = await fetch("/api/procurement/inspections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiptId: receipt.id,
          inspectorName: qcInspectorName || "Site Quality Inspector",
          findings: qcFindings || "Materials received and verified on site.",
          qualityGrade: qcGrade || "A",
        }),
      });
      if (!inspectionRes.ok) {
        const err = await inspectionRes.json().catch(() => ({}));
        throw new Error(err.error || "Failed to create quality inspection");
      }
      const inspection = await inspectionRes.json();

      // 3. Approve Quality Inspection (auto-stocks to inventory & fulfills Material Request)
      const approveRes = await fetch(`/api/procurement/inspections/${inspection.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          qualityGrade: qcGrade || "A",
          notes: "QC passed. Items received and added to inventory.",
        }),
      });
      if (!approveRes.ok) {
        const err = await approveRes.json().catch(() => ({}));
        throw new Error(err.error || "Failed to approve quality inspection");
      }
      return approveRes.json();
    },
    onSuccess: () => {
      toast({
        title: "Goods Received & Stocked!",
        description: "Items successfully verified, added to inventory, and the Material Request is completed.",
      });
      setQcModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["purchase-order", id] });
      refetch();
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to process inspection", variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-2">
          <Clock className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading Purchase Order...</p>
        </div>
      </div>
    );
  }

  if (!po) {
    return (
      <div className="p-8 text-center space-y-3">
        <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
        <h2 className="text-xl font-bold">Purchase Order Not Found</h2>
        <Button onClick={() => navigate("/procurement?tab=pos")}>Back to Procurement</Button>
      </div>
    );
  }

  const items = po.items || [];
  const currentStatus = po.status;

  // Determine stage index
  const getStageIndex = (status: string) => {
    switch (status) {
      case "draft": return 0;
      case "issued": return 1;
      case "acknowledged": return 2;
      case "in_transit": return 3;
      case "delivered": return 4;
      case "inspected":
      case "completed": return 5;
      default: return 0;
    }
  };

  const currentStageIdx = getStageIndex(currentStatus);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-start gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/procurement?tab=pos")}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">Purchase Order</h1>
              <span className="font-mono text-xl font-bold text-primary">{po.poNumber}</span>
              <Badge
                variant={currentStatus === "completed" ? "default" : "outline"}
                className={`capitalize ${
                  currentStatus === "completed"
                    ? "bg-green-600 text-white"
                    : currentStatus === "in_transit"
                    ? "bg-blue-50 text-blue-700 border-blue-200"
                    : ""
                }`}
              >
                {currentStatus.replace("_", " ")}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Project: <span className="font-medium text-foreground">{po.projectName}</span> • Vendor:{" "}
              <span className="font-medium text-foreground">{po.vendorName}</span>
            </p>
          </div>
        </div>

        {/* Action Buttons based on status */}
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            className="gap-2 border-primary/30 hover:border-primary hover:bg-primary/5 text-primary font-medium shadow-sm"
            onClick={() => window.open(`/api/procurement/purchase-orders/${po.id}/export-pdf?autoPrint=true`, '_blank', 'width=1000,height=850')}
          >
            <Printer className="w-4 h-4 text-primary" />
            Print / Download PO PDF
          </Button>

          {currentStatus === "draft" && (
            <Button
              className="gap-2 bg-primary"
              onClick={() => issueMutation.mutate()}
              disabled={issueMutation.isPending}
            >
              <Send className="w-4 h-4" />
              {issueMutation.isPending ? "Issuing..." : "Issue PO to Vendor"}
            </Button>
          )}

          {currentStatus === "issued" && (
            <Button
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => acknowledgeMutation.mutate()}
              disabled={acknowledgeMutation.isPending}
            >
              <CheckCircle2 className="w-4 h-4" />
              Record Vendor Acknowledgment
            </Button>
          )}

          {(currentStatus === "acknowledged" || currentStatus === "in_transit") && (
            <Button
              className="gap-2"
              variant="outline"
              onClick={() => {
                setDeliveryStatus(currentStatus === "acknowledged" ? "in_transit" : "delivered");
                setTrackingModalOpen(true);
              }}
            >
              <Truck className="w-4 h-4" />
              Update Delivery Tracking
            </Button>
          )}

          {(currentStatus === "delivered" || currentStatus === "in_transit") && (
            <Button
              className="gap-2 bg-green-600 hover:bg-green-700 text-white"
              onClick={() => {
                const initialQty: Record<number, number> = {};
                items.forEach((item: any) => {
                  initialQty[item.id] = Number(item.quantity);
                });
                setItemAcceptedQuantities(initialQty);
                setQcModalOpen(true);
              }}
            >
              <ShieldCheck className="w-4 h-4" />
              Receive & QC Inspection
            </Button>
          )}

          {currentStatus === "completed" && (
            <div className="flex items-center gap-2 text-green-700 bg-green-100/70 border border-green-300 px-3 py-1.5 rounded-md text-sm font-semibold">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              Delivered, Inspected & Added to Inventory
            </div>
          )}
        </div>
      </div>

      {/* Lifecycle Progress Stepper */}
      <Card className="bg-card shadow-sm">
        <CardContent className="p-4">
          <div className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
            Order Lifecycle Progress
          </div>
          <div className="flex items-center justify-between overflow-x-auto gap-2 py-2">
            {PO_STAGES.map((stage, idx) => {
              const isPassed = idx <= currentStageIdx;
              const isCurrent = idx === currentStageIdx;
              const Icon = stage.icon;

              return (
                <div key={stage.key} className="flex items-center flex-1 min-w-[120px]">
                  <div className="flex flex-col items-center gap-1.5 text-center w-full">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                        isCurrent
                          ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                          : isPassed
                          ? "bg-green-500 text-white"
                          : "bg-muted text-muted-foreground border"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span
                      className={`text-xs ${
                        isCurrent
                          ? "font-bold text-foreground"
                          : isPassed
                          ? "font-medium text-foreground"
                          : "text-muted-foreground"
                      }`}
                    >
                      {stage.label}
                    </span>
                  </div>
                  {idx < PO_STAGES.length - 1 && (
                    <div
                      className={`h-0.5 w-full mx-2 ${
                        idx < currentStageIdx ? "bg-green-500" : "bg-muted"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Items */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Purchase Order Line Items</CardTitle>
              <CardDescription>Items ordered from {po.vendorName}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">#</th>
                      <th className="px-4 py-3 text-left font-medium">Item Description</th>
                      <th className="px-4 py-3 text-right font-medium">Qty</th>
                      <th className="px-4 py-3 text-right font-medium">Unit Price</th>
                      <th className="px-4 py-3 text-right font-medium">Total</th>
                      <th className="px-4 py-3 text-right font-medium">Stock Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {items.map((item: any, index: number) => (
                      <tr key={item.id} className="hover:bg-accent/30 transition-colors">
                        <td className="px-4 py-3 text-muted-foreground">{index + 1}</td>
                        <td className="px-4 py-3 font-medium">
                          <div>{item.itemName}</div>
                          {item.description && (
                            <div className="text-xs text-muted-foreground">{item.description}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-mono">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="px-4 py-3 text-right font-mono">{INR.format(item.unitPrice)}</td>
                        <td className="px-4 py-3 text-right font-mono font-semibold">
                          {INR.format(item.totalPrice)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {currentStatus === "completed" ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1">
                              <CheckCircle2 className="w-3 h-3" /> In Inventory
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">
                              Pending Delivery
                            </Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Price Summary */}
              <div className="mt-4 flex justify-end">
                <div className="w-72 bg-muted/30 p-4 rounded-lg space-y-2 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal:</span>
                    <span className="font-mono">{INR.format(po.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Tax / GST:</span>
                    <span className="font-mono">+{INR.format(po.taxAmount || 0)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Shipping:</span>
                    <span className="font-mono">+{INR.format(po.shippingCost || 0)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-base font-bold text-foreground">
                    <span>Total Amount:</span>
                    <span className="font-mono text-primary">{INR.format(po.totalAmount)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delivery & Payment Terms */}
          {(po.deliveryTerms || po.paymentTerms || po.notes) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Terms & Notes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {po.deliveryTerms && (
                  <div>
                    <span className="font-semibold text-muted-foreground">Delivery Terms: </span>
                    <span>{po.deliveryTerms}</span>
                  </div>
                )}
                {po.paymentTerms && (
                  <div>
                    <span className="font-semibold text-muted-foreground">Payment Terms: </span>
                    <span>{po.paymentTerms}</span>
                  </div>
                )}
                {po.notes && (
                  <div className="text-muted-foreground whitespace-pre-wrap pt-2 border-t text-xs">
                    {po.notes}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - Vendor & Source Information */}
        <div className="space-y-6">
          {/* Vendor Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" />
                Vendor Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="font-semibold text-base">{po.vendorName}</div>
              {po.vendorEmail && (
                <div className="text-muted-foreground text-xs">{po.vendorEmail}</div>
              )}
              {po.vendorPhone && (
                <div className="text-muted-foreground text-xs">{po.vendorPhone}</div>
              )}
            </CardContent>
          </Card>

          {/* Tracking & Timeline */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                Key Dates & Tracking
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">PO Issued:</span>
                <span className="font-medium">
                  {po.poDate ? format(new Date(po.poDate), "MMM d, yyyy") : "Draft"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Expected Delivery:</span>
                <span className="font-medium text-foreground">
                  {po.expectedDeliveryDate
                    ? format(new Date(po.expectedDeliveryDate), "MMM d, yyyy")
                    : "—"}
                </span>
              </div>
              {po.trackingNumber && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tracking #:</span>
                  <span className="font-mono font-medium">{po.trackingNumber}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Connected Workflow Links */}
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-primary">Connected Workflow</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {po.materialRequestNumber && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Material Request:</span>
                  <Link
                    href={`/procurement/material-requests/${po.materialRequestId}`}
                    className="font-mono text-xs font-semibold text-primary hover:underline"
                  >
                    {po.materialRequestNumber} →
                  </Link>
                </div>
              )}
              {po.rfqNumber && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">RFQ Sourcing:</span>
                  <Link
                    href={`/procurement/rfqs/${po.rfqId}`}
                    className="font-mono text-xs font-semibold text-primary hover:underline"
                  >
                    {po.rfqNumber} →
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tracking Modal */}
      <Dialog open={trackingModalOpen} onOpenChange={setTrackingModalOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              Update Delivery Tracking
            </DialogTitle>
            <DialogDescription>
              Update dispatch and delivery tracking for Purchase Order {po.poNumber}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="space-y-2">
              <Label htmlFor="deliveryStatus">Status</Label>
              <Select value={deliveryStatus} onValueChange={setDeliveryStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_transit">In Transit (Dispatched)</SelectItem>
                  <SelectItem value="delivered">Delivered to Site</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="trackingNumber">Carrier / Tracking Number</Label>
              <Input
                id="trackingNumber"
                placeholder="e.g. TRK-8891024 / Vehicle # KA-01-AB-1234"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="trackingNotes">Notes / Location Update</Label>
              <Textarea
                id="trackingNotes"
                placeholder="Dispatched from factory warehouse..."
                value={trackingNotes}
                onChange={(e) => setTrackingNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setTrackingModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => trackingMutation.mutate()} disabled={trackingMutation.isPending}>
              {trackingMutation.isPending ? "Updating..." : "Save Tracking"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receive Goods & QC Inspection Modal */}
      <Dialog open={qcModalOpen} onOpenChange={setQcModalOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-green-600" />
              Quality Inspection & Inventory Entry
            </DialogTitle>
            <DialogDescription>
              Verify received materials for {po.poNumber}. Approved items will be automatically added to in-house inventory and complete the Material Request.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="space-y-2">
              <Label htmlFor="inspector">Inspector Name</Label>
              <Input
                id="inspector"
                value={qcInspectorName}
                onChange={(e) => setQcInspectorName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="qcGrade">Quality Grade</Label>
              <Select value={qcGrade} onValueChange={setQcGrade}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">Grade A (Excellent - Full Pass)</SelectItem>
                  <SelectItem value="B">Grade B (Good - Acceptable)</SelectItem>
                  <SelectItem value="C">Grade C (Marginal)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="qcFindings">Inspection Findings</Label>
              <Textarea
                id="qcFindings"
                rows={3}
                value={qcFindings}
                onChange={(e) => setQcFindings(e.target.value)}
              />
            </div>

            <div className="bg-green-50 border border-green-200 p-3 rounded-md text-xs text-green-800 space-y-1">
              <div className="font-semibold flex items-center gap-1">
                <Box className="w-3.5 h-3.5" /> Automated Actions upon Approval:
              </div>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>Creates Goods Received Note (GRN) record</li>
                <li>Stocks accepted quantities into In-House Inventory</li>
                <li>Marks Purchase Order as Complete</li>
                <li>Fulfills original Material Request {po.materialRequestNumber}</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setQcModalOpen(false)}>
              Cancel
            </Button>
            <Button
              className="gap-2 bg-green-600 hover:bg-green-700 text-white"
              onClick={() => qcApprovalMutation.mutate()}
              disabled={qcApprovalMutation.isPending}
            >
              <CheckCircle2 className="w-4 h-4" />
              {qcApprovalMutation.isPending ? "Stocking Items..." : "Approve QC & Add to Stock"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
