import { useMutation, useQuery, useQueryClient, type UseMutationOptions, type UseQueryOptions } from "@tanstack/react-query";
import { customFetch } from "./custom-fetch";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface RoleSwitchRequest {
  id: number;
  userId: number;
  currentRole: string;
  requestedRole: string;
  reason: string | null;
  status: "pending" | "approved" | "rejected";
  requestedAt: string;
  reviewedById: number | null;
  reviewedAt: string | null;
  reviewComments: string | null;
  createdAt: string;
  updatedAt: string;
  userName?: string;
  userEmail?: string;
  reviewerName?: string;
}

export interface CreateRoleSwitchRequestInput {
  requestedRole: string;
  reason: string;
}

export interface ApproveRoleSwitchRequestInput {
  comments?: string;
}

export interface RejectRoleSwitchRequestInput {
  comments: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// API FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

// Create role switch request
export const createRoleSwitchRequest = (data: CreateRoleSwitchRequestInput): Promise<RoleSwitchRequest> =>
  customFetch<RoleSwitchRequest>("/api/role-switch-requests", {
    method: "POST",
    body: JSON.stringify(data),
  });

// Get user's own requests
export const getMyRoleSwitchRequests = (): Promise<RoleSwitchRequest[]> =>
  customFetch<RoleSwitchRequest[]>("/api/role-switch-requests/my-requests");

// Get pending requests (Project Manager only)
export const getPendingRoleSwitchRequests = (): Promise<RoleSwitchRequest[]> =>
  customFetch<RoleSwitchRequest[]>("/api/role-switch-requests/pending");

// Get all requests with filters (Project Manager only)
export const getRoleSwitchRequests = (params?: {
  status?: string;
  userId?: number;
}): Promise<RoleSwitchRequest[]> => {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.append("status", params.status);
  if (params?.userId) searchParams.append("userId", params.userId.toString());
  
  const queryString = searchParams.toString();
  return customFetch<RoleSwitchRequest[]>(
    `/api/role-switch-requests${queryString ? `?${queryString}` : ""}`
  );
};

// Get single request
export const getRoleSwitchRequest = (id: number): Promise<RoleSwitchRequest> =>
  customFetch<RoleSwitchRequest>(`/api/role-switch-requests/${id}`);

// Approve request (Project Manager only)
export const approveRoleSwitchRequest = (
  id: number,
  data: ApproveRoleSwitchRequestInput
): Promise<RoleSwitchRequest> =>
  customFetch<RoleSwitchRequest>(`/api/role-switch-requests/${id}/approve`, {
    method: "POST",
    body: JSON.stringify(data),
  });

// Reject request (Project Manager only)
export const rejectRoleSwitchRequest = (
  id: number,
  data: RejectRoleSwitchRequestInput
): Promise<RoleSwitchRequest> =>
  customFetch<RoleSwitchRequest>(`/api/role-switch-requests/${id}/reject`, {
    method: "POST",
    body: JSON.stringify(data),
  });

// ═══════════════════════════════════════════════════════════════════════════
// REACT QUERY HOOKS
// ═══════════════════════════════════════════════════════════════════════════

// Hook: Create role switch request
export const useCreateRoleSwitchRequest = (
  options?: UseMutationOptions<RoleSwitchRequest, Error, CreateRoleSwitchRequestInput>
) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRoleSwitchRequestInput) => createRoleSwitchRequest(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/role-switch-requests/my-requests"] });
      qc.invalidateQueries({ queryKey: ["/api/role-switch-requests/pending"] });
    },
    ...options,
  });
};

// Hook: Get user's own requests
export const useMyRoleSwitchRequests = (
  options?: UseQueryOptions<RoleSwitchRequest[], Error>
) => {
  return useQuery({
    queryKey: ["/api/role-switch-requests/my-requests"],
    queryFn: () => getMyRoleSwitchRequests(),
    ...options,
  });
};

// Hook: Get pending requests (Project Manager only)
export const usePendingRoleSwitchRequests = (
  options?: UseQueryOptions<RoleSwitchRequest[], Error>
) => {
  return useQuery({
    queryKey: ["/api/role-switch-requests/pending"],
    queryFn: () => getPendingRoleSwitchRequests(),
    ...options,
  });
};

// Hook: Get all requests with filters (Project Manager only)
export const useRoleSwitchRequests = (
  params?: { status?: string; userId?: number },
  options?: UseQueryOptions<RoleSwitchRequest[], Error>
) => {
  return useQuery({
    queryKey: ["/api/role-switch-requests", params],
    queryFn: () => getRoleSwitchRequests(params),
    ...options,
  });
};

// Hook: Get single request
export const useRoleSwitchRequest = (
  id: number,
  options?: UseQueryOptions<RoleSwitchRequest, Error>
) => {
  return useQuery({
    queryKey: ["/api/role-switch-requests", id],
    queryFn: () => getRoleSwitchRequest(id),
    enabled: !!id,
    ...options,
  });
};

// Hook: Approve request (Project Manager only)
export const useApproveRoleSwitchRequest = (
  options?: UseMutationOptions<
    RoleSwitchRequest,
    Error,
    { id: number; data: ApproveRoleSwitchRequestInput }
  >
) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ApproveRoleSwitchRequestInput }) =>
      approveRoleSwitchRequest(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/role-switch-requests"] });
      qc.invalidateQueries({ queryKey: ["/api/role-switch-requests/pending"] });
      qc.invalidateQueries({ queryKey: ["/api/role-switch-requests/my-requests"] });
    },
    ...options,
  });
};

// Hook: Reject request (Project Manager only)
export const useRejectRoleSwitchRequest = (
  options?: UseMutationOptions<
    RoleSwitchRequest,
    Error,
    { id: number; data: RejectRoleSwitchRequestInput }
  >
) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: RejectRoleSwitchRequestInput }) =>
      rejectRoleSwitchRequest(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/role-switch-requests"] });
      qc.invalidateQueries({ queryKey: ["/api/role-switch-requests/pending"] });
      qc.invalidateQueries({ queryKey: ["/api/role-switch-requests/my-requests"] });
    },
    ...options,
  });
};

// ═══════════════════════════════════════════════════════════════════════════
// AUTHORIZATION HELPER HOOK
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Hook to check if current user is a Project Manager
 * Used for conditional rendering of approve/reject buttons
 * 
 * IMPORTANT: This hook MUST be used in frontend to hide/disable
 * approve and reject buttons for non-Project Manager users
 */
export const useIsProjectManager = (): boolean => {
  // Note: useGetMe is imported from the generated API or users module
  // This implementation will work once the hook is properly imported
  // For now, returning false as safe default
  
  // TODO: Import useGetMe and implement like this:
  // const { data: user } = useGetMe();
  // if (!user) return false;
  // const userRoles = Array.isArray(user.roles) ? user.roles : [];
  // return userRoles.includes('project_manager');
  
  return false;
};
