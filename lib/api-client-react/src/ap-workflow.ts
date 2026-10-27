import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { customFetch } from "./custom-fetch";

// ==========================================
// TYPES — Accounts Payable (AP)
// ==========================================

export interface APSummary {
  totalPayable: number;
  totalPaid: number;
  totalOutstanding: number;
  totalOverdue: number;
  pendingApprovals: number;
  scheduledPayments: number;
  activeDiscrepancies: number;
  vendorInvoiceCount: number;
  vendorRaBillCount: number;
  statusCounts: Record<string, number>;
  ageing: { current: number; days31_60: number; days61_90: number; days90Plus: number };
}

export interface VendorRaBill {
  id: number;
  projectId: number;
  contractId?: number;
  vendorId?: number;
  billType: string;
  workCompletionId?: number;
  billNumber: string;
  description?: string;
  amount: string;
  milestone?: string;
  grossAmount: string;
  cumulativeAmount: string;
  retentionAmount: string;
  netPayableAmount: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  projectName?: string;
  vendorName?: string;
  contractTitle?: string;
}

export interface APVendorInvoice {
  id: number;
  projectId: number;
  vendorId: number;
  contractId?: number;
  purchaseOrderId?: number;
  vendorRaBillId?: number;
  invoiceNumber: string;
  invoiceDate?: string;
  dueDate?: string;
  amount: string;
  grossAmount: string;
  taxAmount: string;
  retentionAmount: string;
  advanceRecovery: string;
  tdsAmount: string;
  otherDeductions: string;
  netPayableAmount: string;
  poMatched: boolean;
  measurementMatched: boolean;
  quantityRateValidated: boolean;
  discrepancyFlag: boolean;
  clarificationNotes?: string;
  status: string;
  pmApprovedById?: number;
  pmApprovedAt?: string;
  pmComments?: string;
  financeVerifiedById?: number;
  financeVerifiedAt?: string;
  financeComments?: string;
  paymentApprovedById?: number;
  paymentApprovedAt?: string;
  paymentScheduledDate?: string;
  scheduledAmount: string;
  totalPaidAmount: string;
  outstandingAmount: string;
  reconciled: boolean;
  documentUrl?: string;
  createdAt: string;
  updatedAt: string;
  projectName?: string;
  vendorName?: string;
  contractTitle?: string;
  payments?: VendorPayment[];
  discrepancies?: APDiscrepancy[];
}

export interface VendorPayment {
  id: number;
  vendorInvoiceId: number;
  vendorId: number;
  projectId: number;
  vendorRaBillId?: number;
  paymentNumber: string;
  paymentDate: string;
  paymentAmount: string;
  paymentMode: string;
  bankReference?: string;
  transactionId?: string;
  fromBankAccount?: string;
  remarks?: string;
  createdAt: string;
  vendorName?: string;
  projectName?: string;
}

export interface APDiscrepancy {
  id: number;
  vendorInvoiceId: number;
  vendorId: number;
  discrepancyType: string;
  description: string;
  claimedAmount: string;
  verifiedAmount: string;
  differenceAmount: string;
  status: string;
  resolutionNotes?: string;
  raisedById: number;
  resolvedById?: number;
  resolvedAt?: string;
  createdAt: string;
}

export interface ThreeWayMatchResult {
  poMatch: boolean;
  measurementMatch: boolean;
  quantityRateValid: boolean;
  hasDiscrepancy: boolean;
  discrepancies: any[];
  newStatus: string;
}

// ==========================================
// QUERY KEYS
// ==========================================
export const apQueryKeys = {
  summary: (projectId?: number) => ["ap", "summary", projectId] as const,
  raBills: (filters?: Record<string, any>) => ["ap", "ra-bills", filters] as const,
  raBill: (id: number) => ["ap", "ra-bill", id] as const,
  invoices: (filters?: Record<string, any>) => ["ap", "invoices", filters] as const,
  invoice: (id: number) => ["ap", "invoice", id] as const,
  payments: (filters?: Record<string, any>) => ["ap", "payments", filters] as const,
  discrepancies: (filters?: Record<string, any>) => ["ap", "discrepancies", filters] as const,
};

// ==========================================
// QUERIES
// ==========================================
export function useAPSummary(projectId?: number) {
  return useQuery({
    queryKey: apQueryKeys.summary(projectId),
    queryFn: () => customFetch<APSummary>("/api/ap/summary", {
      params: projectId ? { projectId } : undefined,
    }),
  });
}

export function useAPRaBills(filters?: Record<string, any>) {
  return useQuery({
    queryKey: apQueryKeys.raBills(filters),
    queryFn: () => customFetch<VendorRaBill[]>("/api/ap/ra-bills", { params: filters }),
  });
}

export function useAPRaBill(id: number) {
  return useQuery({
    queryKey: apQueryKeys.raBill(id),
    queryFn: () => customFetch<any>(`/api/ap/ra-bills/${id}`),
    enabled: !!id,
  });
}

export function useAPInvoices(filters?: Record<string, any>) {
  return useQuery({
    queryKey: apQueryKeys.invoices(filters),
    queryFn: () => customFetch<APVendorInvoice[]>("/api/ap/invoices", { params: filters }),
  });
}

export function useAPInvoice(id: number) {
  return useQuery({
    queryKey: apQueryKeys.invoice(id),
    queryFn: () => customFetch<APVendorInvoice>(`/api/ap/invoices/${id}`),
    enabled: !!id,
  });
}

export function useAPPayments(filters?: Record<string, any>) {
  return useQuery({
    queryKey: apQueryKeys.payments(filters),
    queryFn: () => customFetch<VendorPayment[]>("/api/ap/payments", { params: filters }),
  });
}

export function useAPDiscrepancies(filters?: Record<string, any>) {
  return useQuery({
    queryKey: apQueryKeys.discrepancies(filters),
    queryFn: () => customFetch<APDiscrepancy[]>("/api/ap/discrepancies", { params: filters }),
  });
}

// ==========================================
// MUTATIONS
// ==========================================
export function useCreateVendorRaBill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      customFetch("/api/ap/ra-bills", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ap"] }); },
  });
}

export function useCreateAPVendorInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      customFetch("/api/ap/invoices", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ap"] }); },
  });
}

export function useThreeWayMatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (invoiceId: number) =>
      customFetch<ThreeWayMatchResult>(`/api/ap/invoices/${invoiceId}/match`, { method: "POST" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ap"] }); },
  });
}

export function useRaiseDiscrepancy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { invoiceId: number; discrepancyType: string; description: string; claimedAmount: number; verifiedAmount: number }) =>
      customFetch(`/api/ap/invoices/${data.invoiceId}/discrepancies`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ap"] }); },
  });
}

export function useResolveDiscrepancy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { discrepancyId: number; resolutionNotes: string }) =>
      customFetch(`/api/ap/discrepancies/${data.discrepancyId}/resolve`, {
        method: "POST",
        body: JSON.stringify({ resolutionNotes: data.resolutionNotes }),
      }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ap"] }); },
  });
}

export function useRequestVendorClarification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { invoiceId: number; notes: string }) =>
      customFetch(`/api/ap/invoices/${data.invoiceId}/clarify`, {
        method: "POST",
        body: JSON.stringify({ notes: data.notes }),
      }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ap"] }); },
  });
}

export function usePMApproveAPInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { invoiceId: number; comments?: string }) =>
      customFetch(`/api/ap/invoices/${data.invoiceId}/pm-approve`, {
        method: "POST",
        body: JSON.stringify({ comments: data.comments }),
      }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ap"] }); },
  });
}

export function useFinanceVerifyAPInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { invoiceId: number; comments?: string }) =>
      customFetch(`/api/ap/invoices/${data.invoiceId}/finance-verify`, {
        method: "POST",
        body: JSON.stringify({ comments: data.comments }),
      }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ap"] }); },
  });
}

export function useApproveAPPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (invoiceId: number) =>
      customFetch(`/api/ap/invoices/${invoiceId}/approve-payment`, { method: "POST" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ap"] }); },
  });
}

export function useScheduleAPPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { invoiceId: number; scheduledDate: string; scheduledAmount: number }) =>
      customFetch(`/api/ap/invoices/${data.invoiceId}/schedule`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ap"] }); },
  });
}

export function usePayVendor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      invoiceId: number;
      paymentAmount: number;
      paymentDate: string;
      paymentMode: string;
      bankReference?: string;
      transactionId?: string;
      fromBankAccount?: string;
      remarks?: string;
    }) =>
      customFetch(`/api/ap/invoices/${data.invoiceId}/pay`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ap"] }); },
  });
}

export function useReconcileAPInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { invoiceId: number; remarks?: string }) =>
      customFetch(`/api/ap/invoices/${data.invoiceId}/reconcile`, {
        method: "POST",
        body: JSON.stringify({ remarks: data.remarks }),
      }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ap"] }); },
  });
}

export function useCloseAPInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (invoiceId: number) =>
      customFetch(`/api/ap/invoices/${invoiceId}/close`, { method: "POST" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ap"] }); },
  });
}
