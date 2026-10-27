import { useState } from "react";
import { useParams, useLocation, Link } from "wouter";
import {
  useGetMaterialRequest,
  useSubmitMaterialRequest,
  useApproveMaterialRequest,
  useRejectMaterialRequest,
  useListUsers,
  useGetCurrentUser,
  useCreateRfqFromMaterialRequest,
  useListVendors,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Send,
  User,
  Calendar,
  Package,
  AlertCircle,
  Edit,
  FileSignature,
  ClipboardList,
  ShieldCheck,
  Truck,
  Box,
  CheckCircle2,
  Layers,
  ArrowRight,
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive"; icon: any }
> = {
  draft: { label: "Draft", variant: "outline", icon: FileText },
  pending_approval: { label: "Pending Approval", variant: "secondary", icon: Clock },
  pending_manager_approval: { label: "Pending Manager Approval", variant: "secondary", icon: Clock },
  approved: { label: "Approved", variant: "default", icon: CheckCircle },
  rejected: { label: "Rejected", variant: "destructive", icon: XCircle },
  rfq_generated: { label: "RFQ Sourcing", variant: "secondary", icon: ClipboardList },
  fulfilled: { label: "Fulfilled / Stock Issued", variant: "default", icon: ShieldCheck },
  completed: { label: "Completed", variant: "default", icon: CheckCircle },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  low: { label: "Low", color: "text-blue-600" },
  medium: { label: "Medium", color: "text-yellow-600" },
  high: { label: "High", color: "text-orange-600" },
  urgent: { label: "Urgent", color: "text-red-600" },
};

const INR = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

export default function MaterialRequestDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [generateRfqDialogOpen, setGenerateRfqDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedManagerId, setSelectedManagerId] = useState<string>("");
  const [selectedVendorIds, setSelectedVendorIds] = useState<number[]>([]);
  const [rfqDueDate, setRfqDueDate] = useState("");
  const [rfqNotes, setRfqNotes] = useState("");

  const queryClient = useQueryClient();
  const [fulfillDialogOpen, setFulfillDialogOpen] = useState(false);
  const [fulfillComments, setFulfillComments] = useState("");

  // Fetch data
  const { data: request, isLoading } = useGetMaterialRequest(Number(id));
  const { data: currentUser, isLoading: isLoadingUser } = useGetCurrentUser();
  const { data: users } = useListUsers();
  const { data: vendors } = useListVendors();

  // Stock check query
  const { data: stockCheck, refetch: refetchStock } = useQuery({
    queryKey: ["mr-inventory-check", id],
    queryFn: async () => {
      const res = await fetch(`/api/procurement/material-requests/${id}/inventory-check`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!id,
  });

  // Connected RFQs and POs
  const { data: linkedRfqs = [] } = useQuery({
    queryKey: ["mr-linked-rfqs", id],
    queryFn: async () => {
      const res = await fetch(`/api/procurement/rfqs?materialRequestId=${id}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!id,
  });

  const { data: linkedPos = [] } = useQuery({
    queryKey: ["mr-linked-pos", id],
    queryFn: async () => {
      const res = await fetch(`/api/procurement/purchase-orders`);
      if (!res.ok) return [];
      const allPos = await res.json();
      return (allPos || []).filter((p: any) => p.materialRequestId === Number(id));
    },
    enabled: !!id,
  });

  // Items come with the request
  const items = request?.items || [];

  // Filter managers (admin or project_manager role) - EXCLUDE requester
  const managers = (users || []).filter((user) => {
    if (request && user.id === request.requestedById) {
      return false;
    }
    const roles = Array.isArray(user.roles) ? user.roles : [];
    return roles.includes("admin") || roles.includes("project_manager");
  });

  // Check if current user is the requester - CRITICAL for hiding approve/reject buttons
  const isRequester = !!(currentUser && request && currentUser.id === request.requestedById);
  
  // Check if current user can approve (is manager and not the requester)
  const userRoles = Array.isArray(currentUser?.roles) ? currentUser.roles : [];
  const isManager = userRoles.includes("admin") || userRoles.includes("project_manager");
  
  const canApprove = !!(currentUser && request && !isRequester && isManager);

  // Mutations
  const submitMutation = useSubmitMaterialRequest();
  const approveMutation = useApproveMaterialRequest();
  const rejectMutation = useRejectMaterialRequest();
  const generateRfqMutation = useCreateRfqFromMaterialRequest();

  // Fulfill from In-House Stock Mutation
  const fulfillInHouseMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/procurement/material-requests/${id}/fulfill-inhouse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comments: fulfillComments }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to fulfill from in-house stock");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Materials Issued & Fulfilled!",
        description: "Materials have been allocated from in-house stock and issued to the project.",
      });
      setFulfillDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["material-request", Number(id)] });
      refetchStock();
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err.message || "Failed to fulfill in-house",
        variant: "destructive",
      });
    },
  });

  if (isLoading || isLoadingUser) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-2">
          <Clock className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading material request...</p>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-2">
          <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
          <h2 className="text-xl font-semibold">Material Request Not Found</h2>
          <p className="text-sm text-muted-foreground">
            The requested material request could not be found.
          </p>
          <Button onClick={() => navigate("/procurement/material-requests")} className="mt-4">
            Back to Material Requests
          </Button>
        </div>
      </div>
    );
  }

  const statusMeta = STATUS_CONFIG[request.status] || STATUS_CONFIG.draft;
  const priorityMeta = PRIORITY_CONFIG[request.priority] || PRIORITY_CONFIG.medium;
  const StatusIcon = statusMeta.icon;
  const itemsArray = Array.isArray(items) ? items : [];

  // Handle submit for approval
  const handleSubmit = () => {
    setSelectedManagerId("");
    setSubmitDialogOpen(true);
  };

  const confirmSubmit = async () => {
    if (!selectedManagerId) {
      toast({
        title: "Manager selection required",
        description: "Please select a manager to review this request.",
        variant: "destructive",
      });
      return;
    }

    try {
      await submitMutation.mutateAsync({
        id: request.id,
        managerId: parseInt(selectedManagerId),
      });
      toast({
        title: "Submitted for approval",
        description: "The material request has been submitted to the manager.",
      });
      setSubmitDialogOpen(false);
      setSelectedManagerId("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit request",
        variant: "destructive",
      });
    }
  };

  // Handle approve
  const handleApprove = async () => {
    // Double-check authorization
    if (isRequester) {
      toast({
        title: "Not Authorized",
        description: "You cannot approve your own request. Only managers can approve requests.",
        variant: "destructive",
      });
      return;
    }

    if (!isManager) {
      toast({
        title: "Not Authorized",
        description: "Only Project Managers and Admins can approve requests.",
        variant: "destructive",
      });
      return;
    }

    try {
      await approveMutation.mutateAsync({ id: request.id });
      toast({
        title: "Request approved",
        description: "The material request has been approved successfully.",
      });
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to approve request";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Handle reject
  const handleReject = async () => {
    // Double-check authorization
    if (isRequester) {
      toast({
        title: "Not Authorized",
        description: "You cannot reject your own request. Only managers can reject requests.",
        variant: "destructive",
      });
      setRejectDialogOpen(false);
      return;
    }

    if (!isManager) {
      toast({
        title: "Not Authorized",
        description: "Only Project Managers and Admins can reject requests.",
        variant: "destructive",
      });
      setRejectDialogOpen(false);
      return;
    }

    if (!rejectionReason.trim()) return;

    try {
      await rejectMutation.mutateAsync({
        id: request.id,
        reason: rejectionReason,
      });
      toast({
        title: "Request rejected",
        description: "The requester has been notified.",
      });
      setRejectDialogOpen(false);
      setRejectionReason("");
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to reject request";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Handle generate RFQ
  const handleGenerateRfq = async () => {
    if (!rfqDueDate) {
      toast({
        title: "Due date required",
        description: "Please select a due date for the RFQ.",
        variant: "destructive",
      });
      return;
    }

    if (selectedVendorIds.length === 0) {
      toast({
        title: "Vendor selection required",
        description: "Please select at least one vendor for the RFQ.",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await generateRfqMutation.mutateAsync({
        materialRequestId: request!.id,
        dueDate: rfqDueDate,
        vendorIds: selectedVendorIds,
        notes: rfqNotes || undefined,
      });

      toast({
        title: "RFQ Generated",
        description: `RFQ ${result.rfqNumber} has been created successfully.`,
      });

      setGenerateRfqDialogOpen(false);
      setSelectedVendorIds([]);
      setRfqDueDate("");
      setRfqNotes("");

      // Navigate to the RFQ detail page
      navigate(`/procurement/rfqs/${result.id}`);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to generate RFQ";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const totalEstimatedCost = itemsArray.reduce(
    (sum, item) => sum + (item.estimatedTotal || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/procurement/material-requests")}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{request.title}</h1>
              <Badge variant={statusMeta.variant} className="gap-1">
                <StatusIcon className="h-3 w-3" />
                {statusMeta.label}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="font-mono">{request.requestNumber}</span>
              <span>•</span>
              <span className={`font-medium capitalize ${priorityMeta.color}`}>
                {priorityMeta.label} Priority
              </span>
              <span>•</span>
              <span className="capitalize">{request.category}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 flex-wrap">
          {request.status === "draft" && isRequester && (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2"
                onClick={() => navigate(`/procurement/material-requests/${request.id}/edit`)}
              >
                <Edit className="h-4 w-4" />
                Edit
              </Button>
              <Button
                size="sm"
                className="gap-2"
                onClick={handleSubmit}
                disabled={submitMutation.isPending || itemsArray.length === 0}
              >
                <Send className="h-4 w-4" />
                {submitMutation.isPending ? "Submitting..." : "Submit for Approval"}
              </Button>
            </>
          )}

          {/* Approve/Reject buttons - ONLY for managers who are NOT the requester */}
          {request.status === "pending_manager_approval" && !isRequester && canApprove && (
            <>
              <Button
                size="sm"
                variant="destructive"
                className="gap-2"
                onClick={() => setRejectDialogOpen(true)}
                disabled={rejectMutation.isPending}
              >
                <XCircle className="h-4 w-4" />
                Reject
              </Button>
              <Button
                size="sm"
                className="gap-2"
                onClick={handleApprove}
                disabled={approveMutation.isPending}
              >
                <CheckCircle className="h-4 w-4" />
                {approveMutation.isPending ? "Approving..." : "Approve"}
              </Button>
            </>
          )}

          {/* Actions for Approved Request: Fulfill from Stock OR Generate RFQ */}
          {request.status === "approved" && (
            <>
              {stockCheck && (stockCheck.allAvailableInHouse || stockCheck.hasPartialStock) && (
                <Button
                  size="sm"
                  className="gap-2 bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => setFulfillDialogOpen(true)}
                >
                  <Box className="h-4 w-4" />
                  Fulfill from In-House Stock
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                className="gap-2"
                onClick={() => setGenerateRfqDialogOpen(true)}
              >
                <ClipboardList className="h-4 w-4" />
                Generate RFQ for Purchasing
              </Button>
            </>
          )}

          {request.status === "fulfilled" && (
            <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-md text-sm font-semibold">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              Materials Issued & Fulfilled
            </div>
          )}
        </div>
      </div>

      {/* End-to-End Lifecycle Progress Stepper */}
      <Card className="bg-card shadow-sm">
        <CardContent className="p-4">
          <div className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
            Procurement Lifecycle Flow
          </div>
          <div className="flex items-center justify-between overflow-x-auto gap-2 py-1">
            {[
              { label: "1. Request Raised", done: true },
              { label: "2. Manager Approval", done: request.status !== "draft" && request.status !== "rejected" },
              { label: "3. Stock Check / RFQ", done: request.status === "approved" || request.status === "rfq_generated" || request.status === "fulfilled" },
              { label: "4. Vendor Quotes", done: linkedRfqs.some((r: any) => r.quotesReceivedCount > 0) || request.status === "fulfilled" },
              { label: "5. Purchase Order", done: linkedPos.length > 0 || request.status === "fulfilled" },
              { label: "6. Fulfilled & Stocked", done: request.status === "fulfilled" || linkedPos.some((p: any) => p.status === "completed") },
            ].map((stg, sIdx, arr) => (
              <div key={stg.label} className="flex items-center flex-1 min-w-[120px]">
                <div className="flex flex-col items-center gap-1 text-center w-full">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      stg.done
                        ? "bg-green-600 text-white"
                        : "bg-muted text-muted-foreground border"
                    }`}
                  >
                    {stg.done ? "✓" : sIdx + 1}
                  </div>
                  <span className={`text-xs ${stg.done ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                    {stg.label}
                  </span>
                </div>
                {sIdx < arr.length - 1 && (
                  <div className={`h-0.5 w-full mx-1 ${stg.done && arr[sIdx + 1].done ? "bg-green-600" : "bg-muted"}`} />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* In-House Inventory Availability Card */}
          {stockCheck && (
            <Card className={stockCheck.allAvailableInHouse ? "border-green-300 bg-green-50/15" : "border-amber-300 bg-amber-50/15"}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Box className="h-5 w-5 text-primary" />
                    In-House Stock Availability Check
                  </CardTitle>
                  <Badge variant={stockCheck.allAvailableInHouse ? "default" : "secondary"}>
                    {stockCheck.allAvailableInHouse ? "100% In Stock Available" : "Procurement Required"}
                  </Badge>
                </div>
                <CardDescription>
                  {stockCheck.allAvailableInHouse
                    ? "All requested materials are currently in stock in the inventory."
                    : "Some or all items are not available in inventory and require an RFQ."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border bg-card overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/60 border-b">
                      <tr>
                        <th className="p-2.5 text-left font-medium">Material</th>
                        <th className="p-2.5 text-right font-medium">Required Qty</th>
                        <th className="p-2.5 text-right font-medium">In-House Available</th>
                        <th className="p-2.5 text-right font-medium">Shortage</th>
                        <th className="p-2.5 text-right font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {(stockCheck.items || []).map((chk: any) => (
                        <tr key={chk.itemId}>
                          <td className="p-2.5 font-medium">{chk.itemName}</td>
                          <td className="p-2.5 text-right font-mono">{chk.requestedQuantity} {chk.unit}</td>
                          <td className="p-2.5 text-right font-mono font-semibold text-foreground">
                            {chk.availableQuantity} {chk.unit}
                          </td>
                          <td className="p-2.5 text-right font-mono text-muted-foreground">
                            {chk.shortageQuantity > 0 ? `${chk.shortageQuantity} ${chk.unit}` : "0"}
                          </td>
                          <td className="p-2.5 text-right">
                            {chk.inStock ? (
                              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                                In Stock
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
                                Shortage
                              </Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {request.status === "approved" && (
                  <div className="mt-3 flex gap-2 justify-end">
                    {stockCheck.allAvailableInHouse && (
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white gap-2"
                        onClick={() => setFulfillDialogOpen(true)}
                      >
                        <ShieldCheck className="w-4 h-4" />
                        Fulfill Entire Request From Stock
                      </Button>
                    )}
                    {!stockCheck.allAvailableInHouse && (
                      <Button
                        size="sm"
                        variant="default"
                        className="gap-2"
                        onClick={() => setGenerateRfqDialogOpen(true)}
                      >
                        <ClipboardList className="w-4 h-4" />
                        Generate RFQ for Shortage ({stockCheck.items?.filter((i: any) => !i.inStock).length} items)
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Description */}
          {request.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {request.description}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Items Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Material Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">#</th>
                      <th className="px-4 py-3 text-left font-medium">Item Name</th>
                      <th className="px-4 py-3 text-left font-medium">Specification</th>
                      <th className="px-4 py-3 text-right font-medium">Quantity</th>
                      <th className="px-4 py-3 text-right font-medium">Unit Price</th>
                      <th className="px-4 py-3 text-right font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {itemsArray.map((item, index) => (
                      <tr key={item.id} className="hover:bg-accent/50">
                        <td className="px-4 py-3 text-muted-foreground">{index + 1}</td>
                        <td className="px-4 py-3">
                          <div className="font-medium">{item.itemName}</div>
                          {item.description && (
                            <div className="text-xs text-muted-foreground">
                              {item.description}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {item.specification ? (
                            <div className="text-xs text-muted-foreground max-w-xs line-clamp-2">
                              {item.specification}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-mono">
                            {item.quantity} {item.unit}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono">
                          {item.estimatedUnitPrice
                            ? INR.format(item.estimatedUnitPrice)
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-medium">
                          {item.estimatedTotal ? INR.format(item.estimatedTotal) : "—"}
                        </td>
                      </tr>
                    ))}
                    {itemsArray.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                          <Package className="h-8 w-8 mx-auto mb-2 opacity-30" />
                          <p className="text-sm">No items added</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {itemsArray.length > 0 && (
                    <tfoot className="bg-muted/30 border-t">
                      <tr>
                        <td colSpan={5} className="px-4 py-3 text-right font-medium">
                          Total Estimated Cost:
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-lg">
                          {INR.format(totalEstimatedCost)}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {request.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Additional Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {request.notes}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Rejection Reason */}
          {request.status === "rejected" && request.rejectionReason && (
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-lg text-destructive flex items-center gap-2">
                  <XCircle className="h-5 w-5" />
                  Rejection Reason
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {request.rejectionReason}
                </p>
                {request.rejectionDate && request.rejectedByName && (
                  <div className="mt-3 text-xs text-muted-foreground">
                    Rejected by {request.rejectedByName} on{" "}
                    {format(new Date(request.rejectionDate), "PPp")}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - Right Column */}
        <div className="space-y-6">
          {/* Project Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Project
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Link
                href={`/projects/${request.projectId}`}
                className="font-medium text-primary hover:underline"
              >
                {request.projectName}
              </Link>
            </CardContent>
          </Card>

          {/* Required Date */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Required Date
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">
                {format(new Date(request.requiredDate), "PPP")}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(request.requiredDate) < new Date()
                  ? "Overdue"
                  : `${Math.ceil(
                      (new Date(request.requiredDate).getTime() - new Date().getTime()) /
                        (1000 * 60 * 60 * 24)
                    )} days remaining`}
              </p>
            </CardContent>
          </Card>

          {/* Requester Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <User className="h-4 w-4" />
                Requester
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="font-medium">{request.requestedByName}</p>
              <p className="text-xs text-muted-foreground">
                Created {format(new Date(request.createdAt), "PPp")}
              </p>
            </CardContent>
          </Card>

          {/* Approval Info */}
          {request.status === "approved" && request.approvedByName && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                  Approved By
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="font-medium">{request.approvedByName}</p>
                {request.approvalDate && (
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(request.approvalDate), "PPp")}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Estimated Cost Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Cost Estimate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {INR.format(request.estimatedCost || totalEstimatedCost)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Based on {itemsArray.length} item{itemsArray.length !== 1 ? "s" : ""}
              </p>
            </CardContent>
          </Card>

          {/* Connected Sourcing & Orders */}
          {(linkedRfqs.length > 0 || linkedPos.length > 0) && (
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-primary flex items-center gap-1.5">
                  <Layers className="w-4 h-4" /> Connected Procurement Workflow
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                {linkedRfqs.length > 0 && (
                  <div>
                    <div className="font-semibold text-muted-foreground mb-1">Generated RFQs:</div>
                    <div className="space-y-1">
                      {linkedRfqs.map((rfq: any) => (
                        <div key={rfq.id} className="flex items-center justify-between p-1.5 bg-card rounded border">
                          <Link href={`/procurement/rfqs/${rfq.id}`} className="font-mono font-medium text-primary hover:underline">
                            {rfq.rfqNumber}
                          </Link>
                          {rfq.quotesReceivedCount > 0 ? (
                            <Link href={`/procurement/rfqs/${rfq.id}/compare`} className="text-green-600 font-semibold hover:underline">
                              Compare {rfq.quotesReceivedCount} Quotes →
                            </Link>
                          ) : (
                            <span className="text-muted-foreground capitalize">{rfq.status}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {linkedPos.length > 0 && (
                  <div>
                    <div className="font-semibold text-muted-foreground mb-1">Purchase Orders:</div>
                    <div className="space-y-1">
                      {linkedPos.map((po: any) => (
                        <div key={po.id} className="flex items-center justify-between p-1.5 bg-card rounded border">
                          <Link href={`/procurement/purchase-orders/${po.id}`} className="font-mono font-medium text-primary hover:underline">
                            {po.poNumber}
                          </Link>
                          <Badge variant="outline" className="text-[10px] capitalize">
                            {po.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Fulfill from In-House Stock Dialog */}
      <Dialog open={fulfillDialogOpen} onOpenChange={setFulfillDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Box className="h-5 w-5 text-green-600" />
              Fulfill from In-House Inventory
            </DialogTitle>
            <DialogDescription>
              This will allocate and issue the requested materials directly from in-house stock to Project:{" "}
              <strong>{request.projectName}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="bg-green-50/70 border border-green-200 p-3 rounded-lg text-xs space-y-1.5 text-green-900">
              <div className="font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-green-600" /> All items will be deducted from inventory:
              </div>
              <ul className="list-disc pl-4 space-y-0.5">
                {itemsArray.map((i) => (
                  <li key={i.id}>
                    {i.itemName}: {i.quantity} {i.unit}
                  </li>
                ))}
              </ul>
              <div className="pt-1 text-muted-foreground border-t">
                • Records an official "Issue to Project" inventory transaction
                <br />• Marks this Material Request as <strong>Fulfilled</strong>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fulfill-notes">Issuance Notes (Optional)</Label>
              <Textarea
                id="fulfill-notes"
                placeholder="e.g. Issued from Main Warehouse directly to site engineer..."
                value={fulfillComments}
                onChange={(e) => setFulfillComments(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFulfillDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="gap-2 bg-green-600 hover:bg-green-700 text-white"
              onClick={() => fulfillInHouseMutation.mutate()}
              disabled={fulfillInHouseMutation.isPending}
            >
              <ShieldCheck className="w-4 h-4" />
              {fulfillInHouseMutation.isPending ? "Issuing..." : "Confirm & Issue Stock"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Submit Dialog */}
      <Dialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit for Manager Approval</DialogTitle>
            <DialogDescription>
              Select a manager to review and approve this material request.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="rounded-lg border bg-muted/40 p-4">
              <p className="text-sm font-medium">{request.title}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {request.requestNumber} • {request.category}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="manager-select">
                Select Manager <span className="text-destructive">*</span>
              </Label>
              <Select value={selectedManagerId} onValueChange={setSelectedManagerId}>
                <SelectTrigger id="manager-select">
                  <SelectValue placeholder="Choose a manager..." />
                </SelectTrigger>
                <SelectContent>
                  {managers.length === 0 ? (
                    <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                      No managers available
                    </div>
                  ) : (
                    managers.map((manager) => (
                      <SelectItem key={manager.id} value={String(manager.id)}>
                        {manager.name} ({manager.email})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                The selected manager will be notified and can approve or reject this request.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSubmitDialogOpen(false);
                setSelectedManagerId("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmSubmit}
              disabled={!selectedManagerId || submitMutation.isPending}
            >
              {submitMutation.isPending ? "Submitting..." : "Submit for Approval"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Material Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this request. The requester will be
              notified.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="rounded-lg border bg-muted/40 p-4">
              <p className="text-sm font-medium">{request.title}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {request.requestNumber} • {request.requestedByName}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">
                Rejection Reason <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="rejection-reason"
                placeholder="Explain why this request is being rejected..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialogOpen(false);
                setRejectionReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectionReason.trim() || rejectMutation.isPending}
            >
              {rejectMutation.isPending ? "Rejecting..." : "Reject Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generate RFQ Dialog */}
      <Dialog open={generateRfqDialogOpen} onOpenChange={setGenerateRfqDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Generate RFQ from Material Request</DialogTitle>
            <DialogDescription>
              Create a Request for Quotation (RFQ) from this approved material request.
              Select vendors and set a due date for quote submissions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="rounded-lg border bg-muted/40 p-4">
              <p className="text-sm font-medium">{request.title}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {request.requestNumber} • {itemsArray.length} item{itemsArray.length !== 1 ? "s" : ""} • {INR.format(totalEstimatedCost)}
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="rfq-due-date">
                Due Date <span className="text-destructive">*</span>
              </Label>
              <input
                id="rfq-due-date"
                type="date"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                value={rfqDueDate}
                onChange={(e) => setRfqDueDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
              />
              <p className="text-xs text-muted-foreground">
                Deadline for vendors to submit their quotations
              </p>
            </div>

            <div className="space-y-2">
              <Label>
                Select Vendors <span className="text-destructive">*</span>
              </Label>
              <div className="rounded-md border p-4 max-h-60 overflow-y-auto space-y-2">
                {vendors && vendors.length > 0 ? (
                  vendors.map((vendor) => (
                    <label
                      key={vendor.id}
                      className="flex items-start gap-3 p-2 rounded hover:bg-accent cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={selectedVendorIds.includes(vendor.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedVendorIds([...selectedVendorIds, vendor.id]);
                          } else {
                            setSelectedVendorIds(selectedVendorIds.filter((id) => id !== vendor.id));
                          }
                        }}
                      />
                      <div className="flex-1">
                        <div className="font-medium text-sm">{vendor.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {vendor.email} {vendor.phone && `• ${vendor.phone}`}
                        </div>
                      </div>
                    </label>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No vendors available. Please add vendors first.
                  </p>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Selected: {selectedVendorIds.length} vendor{selectedVendorIds.length !== 1 ? "s" : ""}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rfq-notes">Notes (Optional)</Label>
              <Textarea
                id="rfq-notes"
                placeholder="Add any special instructions or requirements for vendors..."
                value={rfqNotes}
                onChange={(e) => setRfqNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setGenerateRfqDialogOpen(false);
                setSelectedVendorIds([]);
                setRfqDueDate("");
                setRfqNotes("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleGenerateRfq}
              disabled={!rfqDueDate || selectedVendorIds.length === 0 || generateRfqMutation.isPending}
            >
              {generateRfqMutation.isPending ? "Generating..." : "Generate RFQ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
