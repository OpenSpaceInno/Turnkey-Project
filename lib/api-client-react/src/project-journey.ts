import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { customFetch } from "./custom-fetch";

// Setup Checklist Types
export interface SetupChecklistItem {
  key: string;
  title: string;
  description: string;
  completed: boolean;
  actionUrl: string;
  actionLabel: string;
}

export interface SetupChecklistResponse {
  projectId: number;
  projectName: string;
  completedCount: number;
  totalCount: number;
  percentage: number;
  isComplete: boolean;
  items: SetupChecklistItem[];
}

// Next Action Types
export interface NextActionResponse {
  hasAction: boolean;
  priority: "high" | "medium" | "normal";
  stage: string;
  key: string;
  title: string;
  description: string;
  actionText: string;
  actionUrl: string;
}

// Project Team Member
export interface ProjectTeamMember {
  id: number;
  projectId: number;
  userId: number;
  role: string;
  assignedAt: string;
  assignedById: number | null;
  userName: string | null;
  userEmail: string | null;
  userAvatarUrl: string | null;
  userActiveRole: string | null;
}

// Project Vendor Contract
export interface ProjectVendorContract {
  id: number;
  contractNumber: string;
  contractType: string;
  projectId: number;
  vendorId: number;
  title: string;
  description?: string | null;
  totalAmount: number;
  retentionPercent: number;
  advancePercent: number;
  tdsPercent: number;
  gstPercent: number;
  status: string;
  startDate?: string | null;
  endDate?: string | null;
  vendorName: string | null;
  vendorEmail: string | null;
  vendorPhone: string | null;
  vendorCategory: string | null;
}

// Project Execution Summary
export interface ExecutionSummaryResponse {
  milestones: Array<{
    id: number;
    milestoneNumber: string;
    title: string;
    description?: string | null;
    stage: string;
    billingPercent: number;
    expectedAmount: number;
    billedAmount: number;
    status: string;
    targetDate?: string | null;
    completionDate?: string | null;
  }>;
  completions: Array<{
    id: number;
    workCompletionNumber: string;
    title: string;
    milestone?: string | null;
    completionDate: string;
    status: string;
  }>;
  taskStats: {
    total: number;
    done: number;
    inProgress: number;
    todo: number;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// REACT QUERY HOOKS
// ─────────────────────────────────────────────────────────────────────────────

export const getProjectSetupChecklistQueryKey = (projectId: number) => [
  "projects",
  projectId,
  "setup-checklist",
];

export const getProjectNextActionQueryKey = (projectId: number) => [
  "projects",
  projectId,
  "next-action",
];

export const getProjectTeamQueryKey = (projectId: number) => [
  "projects",
  projectId,
  "team",
];

export const getProjectVendorsQueryKey = (projectId: number) => [
  "projects",
  projectId,
  "vendors",
];

export const getProjectExecutionSummaryQueryKey = (projectId: number) => [
  "projects",
  projectId,
  "execution-summary",
];

export function useGetProjectSetupChecklist(projectId?: number) {
  return useQuery<SetupChecklistResponse>({
    queryKey: getProjectSetupChecklistQueryKey(projectId!),
    queryFn: () => customFetch(`/api/projects/${projectId}/setup-checklist`),
    enabled: !!projectId && projectId > 0,
  });
}

export function useGetProjectNextAction(projectId?: number) {
  return useQuery<NextActionResponse>({
    queryKey: getProjectNextActionQueryKey(projectId!),
    queryFn: () => customFetch(`/api/projects/${projectId}/next-action`),
    enabled: !!projectId && projectId > 0,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

export function useAdvanceProjectStage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, stage }: { projectId: number; stage: string }) =>
      customFetch(`/api/projects/${projectId}/advance-stage`, {
        method: "POST",
        body: JSON.stringify({ stage }),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["projects", variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({
        queryKey: getProjectNextActionQueryKey(variables.projectId),
      });
      queryClient.invalidateQueries({
        queryKey: getProjectSetupChecklistQueryKey(variables.projectId),
      });
    },
  });
}

export function useGetProjectTeam(projectId?: number) {
  return useQuery<ProjectTeamMember[]>({
    queryKey: getProjectTeamQueryKey(projectId!),
    queryFn: () => customFetch(`/api/projects/${projectId}/team`),
    enabled: !!projectId && projectId > 0,
  });
}

export function useAssignProjectTeamMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      projectId,
      userId,
      role,
    }: {
      projectId: number;
      userId: number;
      role: string;
    }) =>
      customFetch(`/api/projects/${projectId}/team`, {
        method: "POST",
        body: JSON.stringify({ userId, role }),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: getProjectTeamQueryKey(variables.projectId),
      });
      queryClient.invalidateQueries({
        queryKey: getProjectSetupChecklistQueryKey(variables.projectId),
      });
    },
  });
}

export function useRemoveProjectTeamMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, userId }: { projectId: number; userId: number }) =>
      customFetch(`/api/projects/${projectId}/team/${userId}`, {
        method: "DELETE",
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: getProjectTeamQueryKey(variables.projectId),
      });
      queryClient.invalidateQueries({
        queryKey: getProjectSetupChecklistQueryKey(variables.projectId),
      });
    },
  });
}

export function useGetProjectVendors(projectId?: number) {
  return useQuery<ProjectVendorContract[]>({
    queryKey: getProjectVendorsQueryKey(projectId!),
    queryFn: () => customFetch(`/api/projects/${projectId}/vendors`),
    enabled: !!projectId && projectId > 0,
  });
}

export function useGetProjectExecutionSummary(projectId?: number) {
  return useQuery<ExecutionSummaryResponse>({
    queryKey: getProjectExecutionSummaryQueryKey(projectId!),
    queryFn: () => customFetch(`/api/projects/${projectId}/execution-summary`),
    enabled: !!projectId && projectId > 0,
  });
}
