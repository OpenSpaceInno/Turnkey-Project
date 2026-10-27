import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { customFetch } from "./custom-fetch";

export interface BillingMilestone {
  id: number;
  projectId: number;
  contractId?: number | null;
  milestoneNumber: string;
  title: string;
  description?: string | null;
  stage: string;
  billingPercent: number;
  expectedAmount: number;
  targetDate?: string | null;
  completionDate?: string | null;
  status: "pending" | "ready_to_bill" | "billed" | "paid" | string;
  raBillId?: number | null;
  billedAmount: number;
  sortOrder: number;
  raBill?: {
    id: number;
    billNumber: string;
    billType: string;
    status: string;
    amount: number;
    grossAmount: number;
    netPayableAmount: number;
    paymentCertificateNumber?: string | null;
    submittedAt?: string | null;
    approvedAt?: string | null;
    paymentCertifiedAt?: string | null;
  } | null;
}

export interface ClientContract {
  id: number;
  contractNumber: string;
  contractType: string;
  projectId: number;
  clientName: string;
  title: string;
  description?: string | null;
  totalAmount: number;
  advancePercent: number;
  retentionPercent: number;
  abgRequired: boolean;
  abgPercent: number;
  abgAmount: number;
  paymentTermsDays: number;
  dlpMonths: number;
  commercialTermsNotes?: string | null;
  tdsPercent: number;
  gstPercent: number;
  startDate?: string | null;
  endDate?: string | null;
  status: string;
}

export interface BillingMilestonesResponse {
  contract: ClientContract | null;
  milestones: BillingMilestone[];
  summary: {
    totalContractValue: number;
    totalBilled: number;
    totalPaid: number;
    totalPending: number;
    billedPercentage: string;
    milestonesCount: number;
    billedCount: number;
  };
}

export interface BudgetPackageAnalysis {
  id: number;
  costCode: string;
  description: string;
  category?: string | null;
  budgeted: number;
  committed: number;
  actual: number;
  consumed: number;
  variance: number;
  utilizationPercent: number;
  severity: "normal" | "warning" | "critical";
  alertMessage?: string;
  isOverBudget: boolean;
  isWarning: boolean;
}

export interface BudgetVarianceAlertsResponse {
  projectId: number;
  projectName: string;
  overall: {
    totalBudget: number;
    totalCommitted: number;
    totalActual: number;
    totalConsumed: number;
    overallVariance: number;
    overallUtilizationPercent: number;
    isOverallOverBudget: boolean;
    isOverallWarning: boolean;
    healthStatus: "healthy" | "warning" | "breached";
  };
  packages: BudgetPackageAnalysis[];
  alerts: BudgetPackageAnalysis[];
  alertCount: number;
  criticalCount: number;
  warningCount: number;
}

export function getBillingMilestonesQueryKey(projectId: number) {
  return [`/api/projects/${projectId}/billing-milestones`] as const;
}

export function getBudgetVarianceAlertsQueryKey(projectId: number) {
  return [`/api/projects/${projectId}/budget-variance-alerts`] as const;
}

export function useBillingMilestones(projectId: number) {
  return useQuery<BillingMilestonesResponse>({
    queryKey: getBillingMilestonesQueryKey(projectId),
    queryFn: () => customFetch<BillingMilestonesResponse>(`/api/projects/${projectId}/billing-milestones`),
    enabled: !!projectId && projectId > 0,
  });
}

export function useBudgetVarianceAlerts(projectId: number) {
  return useQuery<BudgetVarianceAlertsResponse>({
    queryKey: getBudgetVarianceAlertsQueryKey(projectId),
    queryFn: () => customFetch<BudgetVarianceAlertsResponse>(`/api/projects/${projectId}/budget-variance-alerts`),
    enabled: !!projectId && projectId > 0,
    refetchInterval: 15000, // Poll every 15s for real-time alerts
  });
}

export function useRaiseRaBillFromMilestone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ milestoneId }: { milestoneId: number }) => {
      return customFetch<{ bill: any; milestoneId: number; billNumber: string }>(
        `/api/billing-milestones/${milestoneId}/raise-ra-bill`,
        { method: "POST" }
      );
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["/api/ar/ra-bills"] });
      qc.invalidateQueries({ queryKey: ["/api/ar/summary"] });
      qc.invalidateQueries({ queryKey: ["/api/financial-audit"] });
      qc.invalidateQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) &&
          typeof query.queryKey[0] === "string" &&
          (query.queryKey[0].includes("/billing-milestones") || query.queryKey[0].includes("/budget-variance-alerts")),
      });
    },
  });
}

export function useUpdateBillingMilestone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<BillingMilestone> }) => {
      return customFetch<BillingMilestone>(`/api/billing-milestones/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) &&
          typeof query.queryKey[0] === "string" &&
          query.queryKey[0].includes("/billing-milestones"),
      });
    },
  });
}
