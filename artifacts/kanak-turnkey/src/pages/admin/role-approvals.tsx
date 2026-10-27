import { useState } from "react";
import { 
  usePendingRoleSwitchRequests, 
  useApproveRoleSwitchRequest, 
  useRejectRoleSwitchRequest,
  useGetCurrentUser,
  type RoleSwitchRequest 
} from "@workspace/api-client-react";

/**
 * Role Approvals Dashboard
 * 
 * AUTHORIZATION: This page should ONLY be accessible to Project Managers
 * - Sidebar menu item should be hidden for non-PMs
 * - Route should redirect non-PMs
 * - Approve/Reject buttons shown ONLY to PMs
 */
export default function RoleApprovalsPage() {
  const { data: currentUser } = useGetCurrentUser();
  const { data: pendingRequests, isLoading } = usePendingRoleSwitchRequests();
  const approveMutation = useApproveRoleSwitchRequest();
  const rejectMutation = useRejectRoleSwitchRequest();

  const [selectedRequest, setSelectedRequest] = useState<RoleSwitchRequest | null>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [comments, setComments] = useState("");

  // Check if user is Project Manager
  const userRoles = Array.isArray(currentUser?.roles) ? currentUser.roles : [];
  const isProjectManager = userRoles.includes('project_manager');

  // Redirect or show unauthorized message if not PM
  if (currentUser && !isProjectManager) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-md p-8 bg-white rounded-lg shadow-md text-center">
          <div className="mb-4">
            <svg className="w-16 h-16 mx-auto text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Unauthorized Access</h1>
          <p className="text-gray-600 mb-6">
            Only Project Managers can approve or reject role switch requests.
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const handleApprove = (request: RoleSwitchRequest) => {
    setSelectedRequest(request);
    setComments("");
    setShowApproveDialog(true);
  };

  const handleReject = (request: RoleSwitchRequest) => {
    setSelectedRequest(request);
    setComments("");
    setShowRejectDialog(true);
  };

  const confirmApprove = () => {
    if (!selectedRequest) return;

    approveMutation.mutate(
      { id: selectedRequest.id, data: { comments: comments || undefined } },
      {
        onSuccess: () => {
          setShowApproveDialog(false);
          setSelectedRequest(null);
          setComments("");
        },
      }
    );
  };

  const confirmReject = () => {
    if (!selectedRequest || !comments.trim()) {
      alert("Rejection reason is required");
      return;
    }

    rejectMutation.mutate(
      { id: selectedRequest.id, data: { comments } },
      {
        onSuccess: () => {
          setShowRejectDialog(false);
          setSelectedRequest(null);
          setComments("");
        },
      }
    );
  };

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      admin: "bg-purple-100 text-purple-800",
      project_manager: "bg-blue-100 text-blue-800",
      engineer: "bg-green-100 text-green-800",
      accountant: "bg-yellow-100 text-yellow-800",
      procurement_officer: "bg-indigo-100 text-indigo-800",
      viewer: "bg-gray-100 text-gray-800",
    };
    return colors[role] || "bg-gray-100 text-gray-800";
  };

  const getPriorityColor = (currentRole: string, requestedRole: string) => {
    // Higher risk role changes get higher priority
    const riskLevels: Record<string, number> = {
      admin: 5,
      project_manager: 4,
      engineer: 3,
      accountant: 3,
      procurement_officer: 3,
      viewer: 1,
    };

    const requestedLevel = riskLevels[requestedRole] || 1;
    const currentLevel = riskLevels[currentRole] || 1;
    const diff = requestedLevel - currentLevel;

    if (diff >= 3) return "text-red-600";
    if (diff >= 2) return "text-orange-600";
    return "text-blue-600";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading pending requests...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Role Switch Approvals</h1>
        <p className="text-gray-600">
          Review and approve role switch requests from team members
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Requests</p>
              <p className="text-3xl font-bold text-gray-900">{pendingRequests?.length || 0}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Your Role</p>
              <p className="text-xl font-bold text-gray-900">Project Manager</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Authorization</p>
              <p className="text-xl font-bold text-green-600">Approved</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Requests List */}
      {(!pendingRequests || pendingRequests.length === 0) ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-xl font-medium text-gray-900 mb-2">No Pending Requests</h3>
          <p className="text-gray-600">All role switch requests have been processed</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Requested Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reason
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Requested Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-gray-600 font-medium">
                            {request.userName?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{request.userName}</div>
                          <div className="text-sm text-gray-500">{request.userEmail}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(request.currentRole)}`}>
                        {request.currentRole.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(request.requestedRole)}`}>
                        {request.requestedRole.replace('_', ' ')}
                      </span>
                      <span className={`ml-2 ${getPriorityColor(request.currentRole, request.requestedRole)}`}>
                        ↑
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate" title={request.reason || ""}>
                        {request.reason}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(request.requestedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {/* CRITICAL: These buttons ONLY shown to Project Managers */}
                      {isProjectManager && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleApprove(request)}
                            disabled={approveMutation.isPending}
                            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(request)}
                            disabled={rejectMutation.isPending}
                            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                      {!isProjectManager && (
                        <span className="text-gray-400 text-xs">No permission</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Approve Dialog */}
      {showApproveDialog && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Approve Role Switch Request</h3>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                User: <span className="font-medium text-gray-900">{selectedRequest.userName}</span>
              </p>
              <p className="text-sm text-gray-600 mb-2">
                Role Change: <span className="font-medium">{selectedRequest.currentRole}</span> → <span className="font-medium text-green-600">{selectedRequest.requestedRole}</span>
              </p>
              <p className="text-sm text-gray-600 mb-4">
                Reason: {selectedRequest.reason}
              </p>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comments (optional)
              </label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                rows={3}
                placeholder="Add any comments about this approval..."
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowApproveDialog(false);
                  setSelectedRequest(null);
                  setComments("");
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmApprove}
                disabled={approveMutation.isPending}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {approveMutation.isPending ? "Approving..." : "Approve"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Dialog */}
      {showRejectDialog && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Reject Role Switch Request</h3>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                User: <span className="font-medium text-gray-900">{selectedRequest.userName}</span>
              </p>
              <p className="text-sm text-gray-600 mb-2">
                Role Change: <span className="font-medium">{selectedRequest.currentRole}</span> → <span className="font-medium text-red-600">{selectedRequest.requestedRole}</span>
              </p>
              <p className="text-sm text-gray-600 mb-4">
                Reason: {selectedRequest.reason}
              </p>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rejection Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                rows={3}
                placeholder="Please provide a reason for rejection..."
                required
              />
              {!comments.trim() && (
                <p className="text-xs text-red-600 mt-1">Rejection reason is mandatory</p>
              )}
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowRejectDialog(false);
                  setSelectedRequest(null);
                  setComments("");
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmReject}
                disabled={rejectMutation.isPending || !comments.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {rejectMutation.isPending ? "Rejecting..." : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
