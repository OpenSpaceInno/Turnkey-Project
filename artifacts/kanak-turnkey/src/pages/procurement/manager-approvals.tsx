import { useState } from "react";
import { useLocation } from "wouter";
import {
  useProcurementGetPendingApprovals,
  useProcurementApproveMaterialRequest,
  useProcurementRejectMaterialRequest,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

export default function ManagerApprovalsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [priorityFilter, setPriorityFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  
  // State for dialogs
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
  const [approvalComments, setApprovalComments] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  const { data, isLoading, error, refetch } = useProcurementGetPendingApprovals({
    page,
    limit: 20,
    priority: priorityFilter || undefined,
    search: searchTerm || undefined,
  });

  const approveMutation = useProcurementApproveMaterialRequest();
  const rejectMutation = useProcurementRejectMaterialRequest();

  const handleApprove = (id: number) => {
    setSelectedRequestId(id);
    setApprovalComments("");
    setApproveDialogOpen(true);
  };

  const handleReject = (id: number) => {
    setSelectedRequestId(id);
    setRejectionReason("");
    setRejectDialogOpen(true);
  };

  const confirmApprove = () => {
    if (!selectedRequestId) return;
    
    approveMutation.mutate(
      { id: selectedRequestId, comments: approvalComments || undefined },
      {
        onSuccess: () => {
          toast({
            title: "Material Request Approved",
            description: "The material request has been approved successfully. It is now ready for RFQ creation.",
          });
          setApproveDialogOpen(false);
          setSelectedRequestId(null);
          setApprovalComments("");
          refetch();
        },
        onError: (err: any) => {
          toast({
            title: "Approval Failed",
            description: err?.message || "Failed to approve material request",
            variant: "destructive",
          });
        },
      }
    );
  };

  const confirmReject = () => {
    if (!selectedRequestId || !rejectionReason.trim()) {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for rejecting this material request.",
        variant: "destructive",
      });
      return;
    }
    
    rejectMutation.mutate(
      { id: selectedRequestId, reason: rejectionReason },
      {
        onSuccess: () => {
          toast({
            title: "Material Request Rejected",
            description: "The material request has been rejected.",
          });
          setRejectDialogOpen(false);
          setSelectedRequestId(null);
          setRejectionReason("");
          refetch();
        },
        onError: (err: any) => {
          toast({
            title: "Rejection Failed",
            description: err?.message || "Failed to reject material request",
            variant: "destructive",
          });
        },
      }
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Error loading pending approvals: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Manager Approvals</h1>
        <p className="text-gray-600 mt-1">Review and approve material requests</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by title or number..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm("");
                setPriorityFilter("");
                setPage(1);
              }}
              className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading pending approvals...</p>
        </div>
      )}

      {/* Pending Approvals List */}
      {!isLoading && data && (
        <>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Pending Approvals ({data.pagination.total})
                </h2>
              </div>
            </div>

            {data.data.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No pending approvals
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  All material requests have been reviewed.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {data.data.map((request) => (
                  <div
                    key={request.id}
                    className="px-6 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <button
                            onClick={() =>
                              setLocation(`/procurement/material-requests/${request.id}`)
                            }
                            className="text-lg font-medium text-blue-600 hover:text-blue-800 hover:underline text-left"
                          >
                            {request.title}
                          </button>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(
                              request.priority
                            )}`}
                          >
                            {request.priority.toUpperCase()}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div className="flex items-center gap-4 flex-wrap">
                            <span>
                              <strong>Request #:</strong> {request.requestNumber}
                            </span>
                            <span>
                              <strong>Requested by:</strong>{" "}
                              {request.requestedByName || "Unknown"}
                            </span>
                            <span>
                              <strong>Category:</strong> {request.category}
                            </span>
                            <span>
                              <strong>Required Date:</strong>{" "}
                              {new Date(request.requiredDate).toLocaleDateString()}
                            </span>
                          </div>
                          {request.description && (
                            <p className="text-gray-500 mt-2">
                              {request.description}
                            </p>
                          )}
                          {request.submittedAt && (
                            <p className="text-xs text-gray-400 mt-1">
                              Submitted on{" "}
                              {new Date(request.submittedAt).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleApprove(request.id)}
                          disabled={
                            approveMutation.isPending || rejectMutation.isPending
                          }
                          className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(request.id)}
                          disabled={
                            approveMutation.isPending || rejectMutation.isPending
                          }
                          className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {data.pagination.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing page {data.pagination.page} of{" "}
                {data.pagination.totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    setPage((p) => Math.min(data.pagination.totalPages, p + 1))
                  }
                  disabled={page === data.pagination.totalPages}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Approve Dialog */}
      {approveDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Approve Material Request
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to approve this material request? This action
              will allow RFQ creation.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comments (Optional)
              </label>
              <textarea
                value={approvalComments}
                onChange={(e) => setApprovalComments(e.target.value)}
                placeholder="Add approval comments..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setApproveDialogOpen(false);
                  setSelectedRequestId(null);
                  setApprovalComments("");
                }}
                disabled={approveMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmApprove}
                disabled={approveMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-gray-400"
              >
                {approveMutation.isPending ? "Approving..." : "Confirm Approval"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Dialog */}
      {rejectDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Reject Material Request
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Please provide a reason for rejecting this material request.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rejection Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain why this request is being rejected..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                {rejectionReason.length} characters
              </p>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setRejectDialogOpen(false);
                  setSelectedRequestId(null);
                  setRejectionReason("");
                }}
                disabled={rejectMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmReject}
                disabled={rejectMutation.isPending || !rejectionReason.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:bg-gray-400"
              >
                {rejectMutation.isPending ? "Rejecting..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
