import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { customFetch } from "./custom-fetch";

// ==========================================
// TYPES — Accounts Receivable (AR)
// ==========================================

export interface ARSummary {
  totalBilled: number;
  totalCollected: number;
  totalOutstanding: number;
  totalOverdue: number;
  invoiceCount: number;
  raBillCount: number;
  invoiceStatusCounts: Record<string, number>;
  raBillStatusCounts: Record<string, number>;
  ageing: { current: number; days31_60: number; days61_90: number; days90Plus: number };
}

export interface ClientRaBill {
  id: number;
  projectId: number;
  contractId?: number;
  vendorId?: number;
  billType: string;
  clientName?: string;
  workCompletionId?: number;
  billNumber: string;
  description?: string;
  amount: string;
  milestone?: string;
  billingPeriodStart?: string;
  billingPeriodEnd?: string;
  grossAmount: string;
  cumulativeAmount: string;
  retentionPercent: string;
  retentionAmount: string;
  advanceRecovery: string;
  tdsPercent: string;
  tdsAmount: string;
  gstPercent: string;
  gstAmount: string;
  otherDeductions: string;
  deductionRemarks?: string;
  netPayableAmount: string;
  status: string;
  paymentCertifiedAt?: string;
  paymentCertifiedById?: number;
  paymentCertificateNumber?: string;
  paymentCertificateNotes?: string;
  createdAt: string;
  updatedAt: string;
  projectName?: string;
  vendorName?: string;
  contractTitle?: string;
}

export interface ClientInvoice {
  id: number;
  projectId: number;
  raBillId?: number;
  vendorId?: number;
  contractId?: number;
  invoiceNumber: string;
  clientName: string;
  amount: string;
  grossAmount?: string;
  deductions?: string;
  taxAmount?: string;
  netAmount?: string;
  invoiceDate: string;
  dueDate: string;
  paymentDate?: string;
  paymentTerms?: string;
  billingPeriod?: string;
  bankDetails?: string;
  deliveryStatus: string;
  sentAt?: string;
  totalPaidAmount: string;
  outstandingAmount: string;
  reconciliationStatus: string;
  reconciled: boolean;
  status: string;
  documentUrl?: string;
  createdAt: string;
  updatedAt: string;
  projectName?: string;
}

export interface ARAgingBucket {
  key: string;
  label: string;
  amount: number;
  count: number;
  percentage: number;
  color: string;
  range: string;
}

export interface ARAgingInvoice {
  id: number;
  invoiceNumber: string;
  projectId: number;
  projectName?: string;
  projectCode?: string;
  clientName: string;
  invoiceDate: string;
  dueDate: string;
  daysOverdue: number;
  ageDays: number;
  grossAmount: number;
  amount: number;
  totalPaidAmount: number;
  outstandingAmount: number;
  status: string;
  deliveryStatus: string;
  bucket: "0-30" | "31-60" | "61-90" | "90+";
  riskLevel: "low" | "medium" | "high" | "critical";
  isOverdue: boolean;
}

export interface ARAgingClientSummary {
  clientName: string;
  totalBilled: number;
  totalPaid: number;
  totalOutstanding: number;
  current: number;
  days31_60: number;
  days61_90: number;
  days90Plus: number;
  invoicesCount: number;
  oldestDueDate?: string;
  riskLevel: "low" | "medium" | "high" | "critical";
}

export interface ARAgingReport {
  asOfDate: string;
  totalBilled: number;
  totalCollected: number;
  totalOutstanding: number;
  totalOverdue: number;
  collectionEfficiency: number;
  dsoDays: number;
  buckets: {
    "0-30": ARAgingBucket;
    "31-60": ARAgingBucket;
    "61-90": ARAgingBucket;
    "90+": ARAgingBucket;
  };
  clientSummary: ARAgingClientSummary[];
  invoices: ARAgingInvoice[];
}

// ==========================================
// QUERY KEYS
// ==========================================
export const arQueryKeys = {
  summary: (projectId?: number) => ["ar", "summary", projectId] as const,
  agingReport: (filters?: Record<string, any>) => ["ar", "aging-report", filters] as const,
  contracts: (projectId?: number) => ["ar", "contracts", projectId] as const,
  raBills: (filters?: Record<string, any>) => ["ar", "ra-bills", filters] as const,
  raBill: (id: number) => ["ar", "ra-bill", id] as const,
  raBillDocuments: (id: number) => ["ar", "ra-bill-documents", id] as const,
  invoices: (filters?: Record<string, any>) => ["ar", "invoices", filters] as const,
  invoice: (id: number) => ["ar", "invoice", id] as const,
  payments: (invoiceId?: number) => ["ar", "payments", invoiceId] as const,
  reminders: (invoiceId?: number) => ["ar", "reminders", invoiceId] as const,
};

// ==========================================
// QUERIES
// ==========================================
export function useARSummary(projectId?: number) {
  return useQuery({
    queryKey: arQueryKeys.summary(projectId),
    queryFn: () => customFetch<ARSummary>("/api/ar/summary", {
      params: projectId ? { projectId } : undefined,
    }),
  });
}

export function useARAgingReport(filters?: { projectId?: string | number; bucket?: string; clientId?: string }) {
  return useQuery({
    queryKey: arQueryKeys.agingReport(filters),
    queryFn: () => customFetch<ARAgingReport>("/api/ar/aging-report", {
      params: filters,
    }),
  });
}

export function useARContracts(projectId?: number) {
  return useQuery({
    queryKey: arQueryKeys.contracts(projectId),
    queryFn: () => customFetch<any[]>("/api/ar/contracts", {
      params: projectId ? { projectId } : undefined,
    }),
  });
}

export function useARRaBills(filters?: Record<string, any>) {
  return useQuery({
    queryKey: arQueryKeys.raBills(filters),
    queryFn: () => customFetch<ClientRaBill[]>("/api/ar/ra-bills", { params: filters }),
  });
}

export function useARRaBill(id: number) {
  return useQuery({
    queryKey: arQueryKeys.raBill(id),
    queryFn: () => customFetch<any>(`/api/ar/ra-bills/${id}`),
    enabled: !!id,
  });
}

export function useARRaBillDocuments(id: number) {
  return useQuery({
    queryKey: arQueryKeys.raBillDocuments(id),
    queryFn: () => customFetch<any[]>(`/api/ar/ra-bills/${id}/documents`),
    enabled: !!id,
  });
}

export function useARInvoices(filters?: Record<string, any>) {
  return useQuery({
    queryKey: arQueryKeys.invoices(filters),
    queryFn: () => customFetch<ClientInvoice[]>("/api/ar/invoices", { params: filters }),
  });
}

export function useARInvoice(id: number) {
  return useQuery({
    queryKey: arQueryKeys.invoice(id),
    queryFn: () => customFetch<any>(`/api/ar/invoices/${id}`),
    enabled: !!id,
  });
}

export function useARPayments(invoiceId?: number) {
  return useQuery({
    queryKey: arQueryKeys.payments(invoiceId),
    queryFn: () => customFetch<any[]>("/api/ar/payments", {
      params: invoiceId ? { invoiceId } : undefined,
    }),
  });
}

// ==========================================
// MUTATIONS
// ==========================================
export function useSubmitARRaBill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => customFetch(`/api/ar/ra-bills/${id}/submit`, { method: "POST" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ar"] }); },
  });
}

export function usePMApproveARRaBill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { id: number; comments?: string }) =>
      customFetch(`/api/ar/ra-bills/${data.id}/pm-approve`, {
        method: "POST",
        body: JSON.stringify({ comments: data.comments }),
      }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ar"] }); },
  });
}

export function useRequestRevisionARRaBill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { id: number; reason: string }) =>
      customFetch(`/api/ar/ra-bills/${data.id}/request-revision`, {
        method: "POST",
        body: JSON.stringify({ reason: data.reason }),
      }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ar"] }); },
  });
}

export function useCertifyPaymentAR() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { id: number; notes?: string }) =>
      customFetch(`/api/ar/ra-bills/${data.id}/certify-payment`, {
        method: "POST",
        body: JSON.stringify({ notes: data.notes }),
      }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ar"] }); },
  });
}

export function useGenerateARInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { raBillId: number; billingPeriod?: string; paymentTerms?: string; dueDate?: string }) =>
      customFetch(`/api/ar/ra-bills/${data.raBillId}/generate-invoice`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ar"] }); },
  });
}

export function useSendARInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { id: number; recipientEmail?: string; recipientNotes?: string }) =>
      customFetch(`/api/ar/invoices/${data.id}/send`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ar"] }); },
  });
}

export function useRecordARPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { invoiceId: number; paymentAmount: number; paymentDate: string; paymentMode: string; bankReference?: string; remarks?: string }) =>
      customFetch(`/api/ar/invoices/${data.invoiceId}/payments`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ar"] }); },
  });
}

export function useReconcileARInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { id: number; remarks?: string }) =>
      customFetch(`/api/ar/invoices/${data.id}/reconcile`, {
        method: "POST",
        body: JSON.stringify({ remarks: data.remarks }),
      }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ar"] }); },
  });
}

export function useCloseARInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      customFetch(`/api/ar/invoices/${id}/close`, { method: "POST" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ar"] }); },
  });
}

export function useSendARReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { invoiceId: number; subject?: string; message: string; recipient?: string; reminderType?: string }) =>
      customFetch(`/api/ar/invoices/${data.invoiceId}/reminders`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ar"] }); },
  });
}
