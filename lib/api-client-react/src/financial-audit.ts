import { useQuery } from "@tanstack/react-query";
import { customFetch } from "./custom-fetch";

export interface FinancialAuditLog {
  id: number;
  workflowType: string; // 'AR' | 'AP' | 'EXPENSE'
  entityType: string;   // 'client_ra_bill' | 'client_invoice' | 'client_payment' | 'vendor_ra_bill' | 'vendor_invoice' | 'vendor_payment' | 'site_expense'
  entityId: number;
  action: string;
  previousStatus?: string | null;
  newStatus: string;
  userId: number;
  userName?: string | null;
  comments?: string | null;
  metadata?: Record<string, any> | null;
  createdAt: string;
}

export interface FinancialAuditParams {
  workflowType?: string;
  entityType?: string;
  entityId?: number;
  projectId?: number;
}

export function getFinancialAuditLogsQueryKey(params?: FinancialAuditParams) {
  return ["/api/financial-audit", params] as const;
}

export function useFinancialAuditLogs(params?: FinancialAuditParams) {
  return useQuery<FinancialAuditLog[]>({
    queryKey: getFinancialAuditLogsQueryKey(params),
    queryFn: async () => {
      const sp = new URLSearchParams();
      if (params?.workflowType) sp.set("workflowType", params.workflowType);
      if (params?.entityType) sp.set("entityType", params.entityType);
      if (params?.entityId) sp.set("entityId", String(params.entityId));
      if (params?.projectId) sp.set("projectId", String(params.projectId));

      const queryStr = sp.toString();
      const url = `/api/financial-audit${queryStr ? `?${queryStr}` : ""}`;
      return customFetch<FinancialAuditLog[]>(url);
    },
  });
}
