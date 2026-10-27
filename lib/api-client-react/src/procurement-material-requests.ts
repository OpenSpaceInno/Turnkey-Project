/**
 * React Query hooks for Procurement Material Requests
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { customFetch } from "./custom-fetch";

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

export interface MaterialRequestItem {
  id?: number;
  materialRequestId?: number;
  itemName: string;
  description?: string;
  specification?: string;
  quantity: number;
  unit: string;
  estimatedUnitPrice?: number;
  estimatedTotal?: number;
  sortOrder?: number;
}

export interface MaterialRequest {
  id: number;
  requestNumber: string;
  projectId: number;
  title: string;
  description?: string;
  category: string;
  priority: "low" | "medium" | "high" | "urgent";
  requiredDate: string;
  submittedAt?: string;
  status: "draft" | "pending_manager_approval" | "approved" | "rejected" | "rfq_generated" | "completed";
  requestedById: number;
  assignedManagerId?: number;
  approvedById?: number;
  rejectedById?: number;
  approvalDate?: string;
  approvalComments?: string;
  rejectionDate?: string;
  rejectionReason?: string;
  estimatedCost?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  projectName?: string;
  requestedByName?: string;
  assignedManagerName?: string;
  approvedByName?: string;
  rejectedByName?: string;
  items?: MaterialRequestItem[];
  approvalHistory?: ApprovalHistoryEntry[];
}

export interface ApprovalHistoryEntry {
  id: number;
  materialRequestId: number;
  managerId: number;
  action: "APPROVED" | "REJECTED";
  comments?: string;
  actionDate: string;
  createdAt: string;
  managerName?: string;
  managerEmail?: string;
}

export interface PendingApprovalsResponse {
  data: MaterialRequest[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateMaterialRequestInput {
  projectId: number;
  title: string;
  description?: string;
  category: string;
  priority?: "low" | "medium" | "high" | "urgent";
  requiredDate: string;
  estimatedCost?: number;
  notes?: string;
  items?: Omit<MaterialRequestItem, "id" | "materialRequestId" | "sortOrder">[];
}

export interface UpdateMaterialRequestInput {
  title?: string;
  description?: string;
  category?: string;
  priority?: "low" | "medium" | "high" | "urgent";
  requiredDate?: string;
  estimatedCost?: number;
  notes?: string;
}

export interface MaterialRequestStats {
  total: number;
  draft: number;
  pending_approval: number;
  approved: number;
  rejected: number;
  rfq_generated: number;
  completed: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// API Functions
// ═══════════════════════════════════════════════════════════════════════════

export const listMaterialRequests = (params?: {
  projectId?: number;
  status?: string;
}): Promise<MaterialRequest[]> => {
  const query = new URLSearchParams();
  if (params?.projectId) query.append("projectId", String(params.projectId));
  if (params?.status) query.append("status", params.status);
  const queryString = query.toString();
  return customFetch<MaterialRequest[]>(
    `/api/procurement/material-requests${queryString ? `?${queryString}` : ""}`
  );
};

export const getMaterialRequest = (id: number): Promise<MaterialRequest> =>
  customFetch<MaterialRequest>(`/api/procurement/material-requests/${id}`);

export const listMaterialRequestItems = (
  requestId: number
): Promise<MaterialRequestItem[]> =>
  customFetch<MaterialRequestItem[]>(
    `/api/procurement/material-requests/${requestId}/items`
  );

export const createMaterialRequest = (
  data: CreateMaterialRequestInput | { data: CreateMaterialRequestInput }
): Promise<MaterialRequest> => {
  const payload = (data && typeof data === "object" && "data" in data && (data as any).data) ? (data as any).data : data;
  return customFetch<MaterialRequest>("/api/procurement/material-requests", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const updateMaterialRequest = (
  id: number,
  data: UpdateMaterialRequestInput
): Promise<MaterialRequest> =>
  customFetch<MaterialRequest>(`/api/procurement/material-requests/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

export const addMaterialRequestItem = (
  materialRequestId: number,
  item: Omit<MaterialRequestItem, "id" | "materialRequestId" | "sortOrder">
): Promise<MaterialRequestItem> =>
  customFetch<MaterialRequestItem>(
    `/api/procurement/material-requests/${materialRequestId}/items`,
    {
      method: "POST",
      body: JSON.stringify(item),
    }
  );

export const updateMaterialRequestItem = (
  materialRequestId: number,
  itemId: number,
  data: Partial<Omit<MaterialRequestItem, "id" | "materialRequestId">>
): Promise<MaterialRequestItem> =>
  customFetch<MaterialRequestItem>(
    `/api/procurement/material-requests/${materialRequestId}/items/${itemId}`,
    {
      method: "PUT",
      body: JSON.stringify(data),
    }
  );

export const deleteMaterialRequestItem = (
  materialRequestId: number,
  itemId: number
): Promise<void> =>
  customFetch<void>(
    `/api/procurement/material-requests/${materialRequestId}/items/${itemId}`,
    { method: "DELETE" }
  );

export const submitMaterialRequest = (
  id: number,
  managerId: number
): Promise<MaterialRequest> =>
  customFetch<MaterialRequest>(`/api/procurement/material-requests/${id}/submit`, {
    method: "POST",
    body: JSON.stringify({ managerId }),
  });

export const getPendingManagerApprovals = (params?: {
  page?: number;
  limit?: number;
  priority?: string;
  projectId?: number;
  search?: string;
}): Promise<PendingApprovalsResponse> => {
  const query = new URLSearchParams();
  if (params?.page) query.append("page", String(params.page));
  if (params?.limit) query.append("limit", String(params.limit));
  if (params?.priority) query.append("priority", params.priority);
  if (params?.projectId) query.append("projectId", String(params.projectId));
  if (params?.search) query.append("search", params.search);
  const queryString = query.toString();
  return customFetch<PendingApprovalsResponse>(
    `/api/procurement/material-requests/pending-manager-approval${queryString ? `?${queryString}` : ""}`
  );
};

export const approveMaterialRequest = (
  id: number,
  comments?: string
): Promise<MaterialRequest> =>
  customFetch<MaterialRequest>(`/api/procurement/material-requests/${id}/approve`, {
    method: "POST",
    body: JSON.stringify({ comments }),
  });

export const rejectMaterialRequest = (
  id: number,
  reason: string
): Promise<MaterialRequest> =>
  customFetch<MaterialRequest>(`/api/procurement/material-requests/${id}/reject`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });

export const getApprovalHistory = (id: number): Promise<ApprovalHistoryEntry[]> =>
  customFetch<ApprovalHistoryEntry[]>(
    `/api/procurement/material-requests/${id}/approval-history`
  );

export const getMaterialRequestStats = (
  projectId?: number
): Promise<MaterialRequestStats> => {
  const query = projectId ? `?projectId=${projectId}` : "";
  return customFetch<MaterialRequestStats>(
    `/api/procurement/material-requests/stats/summary${query}`
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// React Query Hooks
// ═══════════════════════════════════════════════════════════════════════════

// Query Keys
export const getMaterialRequestsQueryKey = (params?: {
  projectId?: number;
  status?: string;
}) => ["material-requests", params] as const;

export const getMaterialRequestQueryKey = (id: number) =>
  ["material-requests", id] as const;

export const getMaterialRequestStatsQueryKey = (projectId?: number) =>
  ["material-requests", "stats", projectId] as const;

// List Material Requests
export const useProcurementListMaterialRequests = (params?: {
  projectId?: number;
  status?: string;
}) => {
  return useQuery({
    queryKey: getMaterialRequestsQueryKey(params),
    queryFn: () => listMaterialRequests(params),
  });
};

// Get Single Material Request
export const useProcurementGetMaterialRequest = (id: number) => {
  return useQuery({
    queryKey: getMaterialRequestQueryKey(id),
    queryFn: () => getMaterialRequest(id),
    enabled: !!id && id > 0,
  });
};

// List Material Request Items
export const useProcurementListMaterialRequestItems = (requestId: number) => {
  return useQuery({
    queryKey: ["material-requests", requestId, "items"],
    queryFn: () => listMaterialRequestItems(requestId),
    enabled: !!requestId && requestId > 0,
  });
};

// Get Statistics
export const useProcurementGetMaterialRequestStats = (projectId?: number) => {
  return useQuery({
    queryKey: getMaterialRequestStatsQueryKey(projectId),
    queryFn: () => getMaterialRequestStats(projectId),
  });
};

// Create Material Request
export const useProcurementCreateMaterialRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMaterialRequestInput | { data: CreateMaterialRequestInput }) =>
      createMaterialRequest(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["material-requests"] });
      qc.invalidateQueries({ queryKey: ["/api/material-requests"] });
    },
  });
};

// Update Material Request
export const useProcurementUpdateMaterialRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateMaterialRequestInput }) =>
      updateMaterialRequest(id, data),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: getMaterialRequestQueryKey(variables.id) });
      qc.invalidateQueries({ queryKey: ["material-requests"] });
    },
  });
};

// Add Item
export const useProcurementAddMaterialRequestItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      materialRequestId,
      item,
    }: {
      materialRequestId: number;
      item: Omit<MaterialRequestItem, "id" | "materialRequestId" | "sortOrder">;
    }) => addMaterialRequestItem(materialRequestId, item),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({
        queryKey: getMaterialRequestQueryKey(variables.materialRequestId),
      });
    },
  });
};

// Update Item
export const useProcurementUpdateMaterialRequestItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      materialRequestId,
      itemId,
      data,
    }: {
      materialRequestId: number;
      itemId: number;
      data: Partial<Omit<MaterialRequestItem, "id" | "materialRequestId">>;
    }) => updateMaterialRequestItem(materialRequestId, itemId, data),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({
        queryKey: getMaterialRequestQueryKey(variables.materialRequestId),
      });
    },
  });
};

// Delete Item
export const useProcurementDeleteMaterialRequestItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      materialRequestId,
      itemId,
    }: {
      materialRequestId: number;
      itemId: number;
    }) => deleteMaterialRequestItem(materialRequestId, itemId),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({
        queryKey: getMaterialRequestQueryKey(variables.materialRequestId),
      });
    },
  });
};

// Get Pending Manager Approvals
export const useProcurementGetPendingApprovals = (params?: {
  page?: number;
  limit?: number;
  priority?: string;
  projectId?: number;
  search?: string;
}) => {
  return useQuery({
    queryKey: ["material-requests", "pending-approvals", params],
    queryFn: () => getPendingManagerApprovals(params),
  });
};

// Get Approval History
export const useProcurementGetApprovalHistory = (id: number) => {
  return useQuery({
    queryKey: ["material-requests", id, "approval-history"],
    queryFn: () => getApprovalHistory(id),
    enabled: !!id && id > 0,
  });
};

// Submit for Approval
export const useProcurementSubmitMaterialRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, managerId }: { id: number; managerId: number }) =>
      submitMaterialRequest(id, managerId),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: getMaterialRequestQueryKey(variables.id) });
      qc.invalidateQueries({ queryKey: ["material-requests"] });
      qc.invalidateQueries({ queryKey: ["material-requests", "stats"] });
    },
  });
};

// Approve Request
export const useProcurementApproveMaterialRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, comments }: { id: number; comments?: string }) =>
      approveMaterialRequest(id, comments),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: getMaterialRequestQueryKey(variables.id) });
      qc.invalidateQueries({ queryKey: ["material-requests"] });
      qc.invalidateQueries({ queryKey: ["material-requests", "pending-approvals"] });
      qc.invalidateQueries({ queryKey: ["material-requests", "stats"] });
    },
  });
};

// Reject Request
export const useProcurementRejectMaterialRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      rejectMaterialRequest(id, reason),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: getMaterialRequestQueryKey(variables.id) });
      qc.invalidateQueries({ queryKey: ["material-requests"] });
      qc.invalidateQueries({ queryKey: ["material-requests", "pending-approvals"] });
      qc.invalidateQueries({ queryKey: ["material-requests", "stats"] });
    },
  });
};
