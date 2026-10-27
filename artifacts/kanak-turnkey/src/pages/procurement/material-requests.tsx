import { useState } from "react";
import { Link } from "wouter";
import {
  useProcurementListMaterialRequests as useListMaterialRequests,
  useProcurementGetMaterialRequestStats as useGetMaterialRequestStats,
  useProcurementSubmitMaterialRequest as useSubmitMaterialRequest,
  useProcurementApproveMaterialRequest as useApproveMaterialRequest,
  useProcurementRejectMaterialRequest as useRejectMaterialRequest,
  useListUsers,
  useGetCurrentUser,
  type MaterialRequest,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import {
  Plus,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  FileText,
  Send,
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive"; icon: any }
> = {
  draft: { label: "Draft", variant: "outline", icon: FileText },
  pending_manager_approval: { label: "Pending Manager Approval", variant: "secondary", icon: Clock },
  approved: { label: "Approved", variant: "default", icon: CheckCircle },
  rejected: { label: "Rejected", variant: "destructive", icon: XCircle },
  rfq_generated: { label: "RFQ Generated", variant: "default", icon: CheckCircle },
  completed: { label: "Completed", variant: "default", icon: CheckCircle },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  low: { label: "Low", color: "text-blue-600" },
  medium: { label: "Medium", color: "text-yellow-600" },
  high: { label: "High", color: "text-orange-600" },
  urgent: { label: "Urgent", color: "text-red-600" },
};

export default function MaterialRequests() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedRequest, setSelectedRequest] = useState<MaterialRequest | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedManagerId, setSelectedManagerId] = useState<string>("");

  // Fetch data
  const { data: requests, isLoading } = useListMaterialRequests();
  const { data: stats } = useGetMaterialRequestStats();
  const { data: users } = useListUsers();
  const { data: currentUser } = useGetCurrentUser();

  // Filter managers (admin or project_manager role)
  const managers = (users || []).filter((user) => {
    const roles = Array.isArray(user.roles) ? user.roles : [];
    return roles.includes("admin") || roles.includes("project_manager");
  });

  // Check if current user is a manager
  const userRoles = Array.isArray(currentUser?.roles) ? currentUser.roles : [];
  const isManager = userRoles.includes("admin") || userRoles.includes("project_manager");

  // Mutations
  const submitMutation = useSubmitMaterialRequest();
  const approveMutation = useApproveMaterialRequest();
  const rejectMutation = useRejectMaterialRequest();

  // Filter requests
  const requestsArray = Array.isArray(requests) ? requests : [];
  const filteredRequests = requestsArray.filter((req) => {
    const matchesSearch =
      req.title.toLowerCase().includes(search.toLowerCase()) ||
      req.requestNumber.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || req.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Handle submit for approval
  const handleSubmit = (request: MaterialRequest) => {
    setSelectedRequest(request);
    setSelectedManagerId("");
    setSubmitDialogOpen(true);
  };

  const confirmSubmit = async () => {
    if (!selectedRequest || !selectedManagerId) {
      toast({
        title: "Manager selection required",
        description: "Please select a manager to review this request.",
        variant: "destructive",
      });
      return;
    }

    try {
      await submitMutation.mutateAsync({
        id: selectedRequest.id,
        managerId: parseInt(selectedManagerId),
      });
      toast({
        title: "Submitted for approval",
        description: "The material request has been submitted to the manager.",
      });
      setSubmitDialogOpen(false);
      setSelectedRequest(null);
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
  const handleApprove = async (id: number) => {
    if (!isManager) {
      toast({
        title: "Not Authorized",
        description: "Only Project Managers and Admins can approve requests.",
        variant: "destructive",
      });
      return;
    }

    try {
      await approveMutation.mutateAsync({ id });
      toast({
        title: "Request approved",
        description: "The material request has been approved successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to approve request",
        variant: "destructive",
      });
    }
  };

  // Handle reject
  const handleReject = async () => {
    if (!selectedRequest || !rejectionReason.trim()) return;

    if (!isManager) {
      toast({
        title: "Not Authorized",
        description: "Only Project Managers and Admins can reject requests.",
        variant: "destructive",
      });
      setRejectDialogOpen(false);
      return;
    }

    try {
      await rejectMutation.mutateAsync({
        id: selectedRequest.id,
        reason: rejectionReason,
      });
      toast({
        title: "Request rejected",
        description: "The requester has been notified.",
      });
      setRejectDialogOpen(false);
      setSelectedRequest(null);
      setRejectionReason("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject request",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Material Requests</h1>
          <p className="text-muted-foreground">
            Manage material requisitions and approval workflow
          </p>
        </div>
        <Link href="/procurement/material-requests/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> New Request
          </Button>
        </Link>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Approval
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">
                {stats.pending_manager_approval || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Approved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">{stats.approved}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Rejected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search requests..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="pending_manager_approval">Pending Manager Approval</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="rfq_generated">RFQ Generated</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground border-b">
              <tr>
                <th className="px-4 py-3 font-medium">Request No.</th>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Project</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Priority</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Requester</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredRequests.map((request) => {
                const statusMeta = STATUS_CONFIG[request.status] || STATUS_CONFIG.draft;
                const priorityMeta = PRIORITY_CONFIG[request.priority] || PRIORITY_CONFIG.medium;
                const StatusIcon = statusMeta.icon;

                return (
                  <tr
                    key={request.id}
                    className="hover:bg-accent/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/procurement/material-requests/${request.id}`}
                        className="font-mono text-primary hover:underline"
                      >
                        {request.requestNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{request.title}</div>
                      {request.description && (
                        <div className="text-xs text-muted-foreground line-clamp-1">
                          {request.description}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {request.projectName}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="capitalize">
                        {request.category}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-medium capitalize ${priorityMeta.color}`}>
                        {priorityMeta.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusMeta.variant} className="gap-1">
                        <StatusIcon className="h-3 w-3" />
                        {statusMeta.label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {request.requestedByName}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        {/* Submit button - only for draft requests */}
                        {request.status === "draft" && currentUser && currentUser.id === request.requestedById && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs gap-1"
                            onClick={() => handleSubmit(request)}
                            disabled={submitMutation.isPending}
                          >
                            <Send className="h-3 w-3" />
                            Submit
                          </Button>
                        )}
                        {/* Approve/Reject buttons - for managers */}
                        {request.status === "pending_manager_approval" && 
                         currentUser && 
                         isManager && (
                          <>
                            <Button
                              size="sm"
                              variant="default"
                              className="h-7 text-xs gap-1"
                              onClick={() => handleApprove(request.id)}
                              disabled={approveMutation.isPending}
                            >
                              <CheckCircle className="h-3 w-3" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-7 text-xs gap-1"
                              onClick={() => {
                                setSelectedRequest(request);
                                setRejectDialogOpen(true);
                              }}
                              disabled={rejectMutation.isPending}
                            >
                              <XCircle className="h-3 w-3" />
                              Reject
                            </Button>
                          </>
                        )}
                        {request.status === "rejected" && request.rejectionReason && (
                          <span className="text-xs text-muted-foreground italic">
                            {request.rejectionReason}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredRequests.length === 0 && !isLoading && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-12 text-center text-muted-foreground"
                  >
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="font-medium">No requests found</p>
                    <p className="text-sm mt-1">
                      Create a new material request to get started.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

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
            {selectedRequest && (
              <div className="rounded-lg border bg-muted/40 p-4">
                <p className="text-sm font-medium">{selectedRequest.title}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedRequest.requestNumber} • {selectedRequest.category}
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="manager-select">Select Manager *</Label>
              <Select value={selectedManagerId} onValueChange={setSelectedManagerId}>
                <SelectTrigger id="manager-select">
                  <SelectValue placeholder="Choose a manager..." />
                </SelectTrigger>
                <SelectContent>
                  {managers.map((manager) => (
                    <SelectItem key={manager.id} value={String(manager.id)}>
                      {manager.name} ({manager.email})
                    </SelectItem>
                  ))}
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
                setSelectedRequest(null);
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
            {selectedRequest && (
              <div className="rounded-lg border bg-muted/40 p-4">
                <p className="text-sm font-medium">{selectedRequest.title}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedRequest.requestNumber} • {selectedRequest.requestedByName}
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Rejection Reason *</Label>
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
                setSelectedRequest(null);
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
    </div>
  );
}
