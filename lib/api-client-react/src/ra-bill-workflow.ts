import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { customFetch } from "./custom-fetch";

// ==========================================
// TYPES
// ==========================================

export interface ContractBoqItem {
  id: number;
  contractId: number;
  itemNumber?: string;
  description: string;
  unit: string;
  quantity: number;
  rate: number;
  totalAmount: number;
  cumulativeCompletedQty: number;
  cumulativeBilledQty: number;
  remainingCompletedQty?: number;
  remainingBilledQty?: number;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Contract {
  id: number;
  contractNumber: string;
  projectId: number;
  vendorId: number;
  title: string;
  description?: string;
  totalAmount: number;
  retentionPercent: number;
  advancePercent: number;
  tdsPercent: number;
  gstPercent: number;
  startDate?: string;
  endDate?: string;
  status: "draft" | "active" | "completed" | "terminated";
  createdById?: number;
  createdAt: string;
  updatedAt: string;
  projectName?: string;
  vendorName?: string;
  vendorEmail?: string;
  vendorPhone?: string;
  creatorName?: string;
  boqItems?: ContractBoqItem[];
}

export interface WorkCompletionItem {
  id: number;
  workCompletionId: number;
  contractBoqItemId: number;
  itemNumber?: string;
  description: string;
  unit: string;
  rate: number;
  contractQty?: number;
  previousCompletedQty: number;
  currentCompletedQty: number;
  cumulativeQty: number;
  currentAmount: number;
  remarks?: string;
  sortOrder: number;
}

export interface WorkCompletionDocument {
  id: number;
  workCompletionId: number;
  documentType: string;
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  uploadedById?: number;
  uploadedAt: string;
  uploaderName?: string;
}

export interface WorkCompletion {
  id: number;
  workCompletionNumber: string;
  projectId: number;
  contractId: number;
  vendorId: number;
  title: string;
  milestone?: string;
  completionDate: string;
  remarks?: string;
  status: "draft" | "submitted" | "verified" | "correction_required";
  submittedAt?: string;
  verifiedById?: number;
  verifiedAt?: string;
  correctionReason?: string;
  createdById?: number;
  createdAt: string;
  updatedAt: string;
  projectName?: string;
  contractTitle?: string;
  contractNumber?: string;
  vendorName?: string;
  creatorName?: string;
  verifierName?: string;
  items?: WorkCompletionItem[];
  documents?: WorkCompletionDocument[];
}

export interface RaBillItem {
  id: number;
  raBillId: number;
  contractBoqItemId: number;
  itemNumber?: string;
  description: string;
  unit: string;
  rate: number;
  contractQuantity: number;
  previousBilledQty: number;
  currentBilledQty: number;
  cumulativeBilledQty: number;
  previousAmount: number;
  currentAmount: number;
  cumulativeAmount: number;
  sortOrder: number;
}

export interface RaBillDocument {
  id: number;
  raBillId: number;
  documentType: string;
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  uploadedById?: number;
  uploadedAt: string;
  uploaderName?: string;
}

export interface RaBillApprovalHistory {
  id: number;
  raBillId: number;
  action: string;
  userId: number;
  previousStatus?: string;
  newStatus: string;
  comments?: string;
  actionDate: string;
  userName?: string;
  userRole?: string;
}

export interface WorkflowRaBill {
  id: number;
  projectId: number;
  contractId?: number;
  vendorId?: number;
  workCompletionId?: number;
  billNumber: string;
  description?: string;
  amount: number;
  milestone?: string;
  billingPeriodStart?: string;
  billingPeriodEnd?: string;
  grossAmount: number;
  retentionPercent: number;
  retentionAmount: number;
  advanceRecovery: number;
  tdsPercent: number;
  tdsAmount: number;
  gstPercent: number;
  gstAmount: number;
  otherDeductions: number;
  deductionRemarks?: string;
  netPayableAmount: number;
  status: "draft" | "submitted" | "approved" | "revision_requested" | "invoice_generated";
  documentUrl?: string;
  createdById?: number;
  submittedAt?: string;
  submittedById?: number;
  approvedById?: number;
  approvedAt?: string;
  approvalComments?: string;
  revisionRequestedById?: number;
  revisionRequestedAt?: string;
  revisionReason?: string;
  createdAt: string;
  updatedAt: string;
  projectName?: string;
  contractTitle?: string;
  contractNumber?: string;
  contractTotal?: number;
  vendorName?: string;
  vendorEmail?: string;
  vendorPhone?: string;
  vendorGst?: string;
  creatorName?: string;
  submitterName?: string;
  approverName?: string;
  invoice?: WorkflowInvoice;
  items?: RaBillItem[];
  documents?: RaBillDocument[];
  history?: RaBillApprovalHistory[];
}

export interface InvoicePayment {
  id: number;
  invoiceId: number;
  raBillId?: number;
  paymentNumber: string;
  paymentDate: string;
  paymentAmount: number;
  paymentMode: string;
  bankReference?: string;
  transactionId?: string;
  remarks?: string;
  documentUrl?: string;
  recordedById: number;
  recorderName?: string;
  createdAt: string;
}

export interface PaymentReminder {
  id: number;
  invoiceId: number;
  reminderDate: string;
  reminderType: string;
  subject?: string;
  message: string;
  recipient?: string;
  followUpRemarks?: string;
  sentById: number;
  senderName?: string;
  createdAt: string;
}

export interface WorkflowInvoice {
  id: number;
  projectId: number;
  raBillId?: number;
  vendorId?: number;
  contractId?: number;
  invoiceNumber: string;
  clientName: string;
  amount: number;
  grossAmount?: number;
  deductions?: number;
  taxAmount?: number;
  netAmount?: number;
  invoiceDate: string;
  dueDate: string;
  paymentDate?: string;
  paymentTerms?: string;
  sentAt?: string;
  sentById?: number;
  recipientEmail?: string;
  recipientNotes?: string;
  totalPaidAmount: number;
  outstandingAmount: number;
  reconciliationStatus: "pending" | "reconciled";
  reconciled: boolean;
  reconciledById?: number;
  reconciledAt?: string;
  reconciliationRemarks?: string;
  status: "draft" | "sent" | "partially_paid" | "paid" | "reconciled" | "closed";
  documentUrl?: string;
  createdAt: string;
  updatedAt: string;
  projectName?: string;
  vendorName?: string;
  vendorEmail?: string;
  vendorPhone?: string;
  vendorGst?: string;
  billNumber?: string;
  contractTitle?: string;
  payments?: InvoicePayment[];
  reminders?: PaymentReminder[];
}

export interface WorkflowStatsSummary {
  contracts: { total: number; totalValue: number };
  workCompletions: { total: number; pendingVerification: number; verified: number };
  raBills: {
    total: number;
    draft: number;
    pendingApproval: number;
    approved: number;
    revisionRequested: number;
    totalGrossAmount: number;
    totalNetPayableAmount: number;
    totalRetentionAmount: number;
  };
  invoices: {
    total: number;
    paidCount: number;
    unpaidCount: number;
    partiallyPaidCount: number;
    reconciledCount: number;
    totalPaidAmount: number;
    totalOutstandingAmount: number;
  };
}

// ==========================================
// QUERY KEYS
// ==========================================

export const workflowKeys = {
  all: ["ra-bill-workflow"] as const,
  stats: (projectId?: number) => [...workflowKeys.all, "stats", projectId] as const,
  contracts: {
    all: () => [...workflowKeys.all, "contracts"] as const,
    list: (params?: any) => [...workflowKeys.contracts.all(), "list", params] as const,
    detail: (id: number) => [...workflowKeys.contracts.all(), "detail", id] as const,
  },
  workCompletions: {
    all: () => [...workflowKeys.all, "work-completions"] as const,
    list: (params?: any) => [...workflowKeys.workCompletions.all(), "list", params] as const,
    detail: (id: number) => [...workflowKeys.workCompletions.all(), "detail", id] as const,
  },
  raBills: {
    all: () => [...workflowKeys.all, "ra-bills"] as const,
    list: (params?: any) => [...workflowKeys.raBills.all(), "list", params] as const,
    detail: (id: number) => [...workflowKeys.raBills.all(), "detail", id] as const,
  },
  invoices: {
    all: () => [...workflowKeys.all, "invoices"] as const,
    list: (params?: any) => [...workflowKeys.invoices.all(), "list", params] as const,
    detail: (id: number) => [...workflowKeys.invoices.all(), "detail", id] as const,
  },
};

// ==========================================
// STATS HOOKS
// ==========================================

export function useWorkflowStats(projectId?: number) {
  return useQuery({
    queryKey: workflowKeys.stats(projectId),
    queryFn: async () => {
      const res = await customFetch("/api/ra-bill-workflow/stats/summary", {
        params: projectId ? { projectId } : undefined,
      });
      return ((res as any)?.data ?? res) as WorkflowStatsSummary;
    },
  });
}

// ==========================================
// CONTRACTS HOOKS
// ==========================================

export function useContracts(params?: {
  projectId?: number;
  vendorId?: number;
  status?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: workflowKeys.contracts.list(params),
    queryFn: async () => {
      const res = await customFetch("/api/ra-bill-workflow/contracts", { params });
      return ((res as any)?.data ?? res) as Contract[];
    },
  });
}

export function useContract(id: number) {
  return useQuery({
    queryKey: workflowKeys.contracts.detail(id),
    queryFn: async () => {
      const res = await customFetch(`/api/ra-bill-workflow/contracts/${id}`);
      return ((res as any)?.data ?? res) as Contract;
    },
    enabled: !!id,
  });
}

export function useCreateContract() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      projectId: number;
      vendorId: number;
      title: string;
      description?: string;
      totalAmount?: number;
      retentionPercent?: number;
      advancePercent?: number;
      tdsPercent?: number;
      gstPercent?: number;
      startDate?: string;
      endDate?: string;
      status?: string;
      boqItems?: Array<{
        itemNumber?: string;
        description: string;
        unit: string;
        quantity: number;
        rate: number;
      }>;
    }) => {
      return customFetch("/api/ra-bill-workflow/contracts", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workflowKeys.contracts.all() });
      queryClient.invalidateQueries({ queryKey: workflowKeys.all });
    },
  });
}

export function useUpdateContract() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Contract> }) => {
      return customFetch(`/api/ra-bill-workflow/contracts/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: workflowKeys.contracts.detail(id) });
      queryClient.invalidateQueries({ queryKey: workflowKeys.contracts.list() });
    },
  });
}

export function useAddContractBoqItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      contractId,
      item,
    }: {
      contractId: number;
      item: {
        itemNumber?: string;
        description: string;
        unit: string;
        quantity: number;
        rate: number;
      };
    }) => {
      return customFetch(`/api/ra-bill-workflow/contracts/${contractId}/boq-items`, {
        method: "POST",
        body: JSON.stringify(item),
      });
    },
    onSuccess: (_, { contractId }) => {
      queryClient.invalidateQueries({ queryKey: workflowKeys.contracts.detail(contractId) });
      queryClient.invalidateQueries({ queryKey: workflowKeys.contracts.list() });
    },
  });
}

export function useUpdateContractBoqItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      contractId,
      itemId,
      item,
    }: {
      contractId: number;
      itemId: number;
      item: {
        itemNumber?: string;
        description: string;
        unit: string;
        quantity: number;
        rate: number;
      };
    }) => {
      return customFetch(`/api/ra-bill-workflow/contracts/${contractId}/boq-items/${itemId}`, {
        method: "PUT",
        body: JSON.stringify(item),
      });
    },
    onSuccess: (_, { contractId }) => {
      queryClient.invalidateQueries({ queryKey: workflowKeys.contracts.detail(contractId) });
      queryClient.invalidateQueries({ queryKey: workflowKeys.contracts.list() });
    },
  });
}

export function useDeleteContractBoqItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ contractId, itemId }: { contractId: number; itemId: number }) => {
      return customFetch(`/api/ra-bill-workflow/contracts/${contractId}/boq-items/${itemId}`, {
        method: "DELETE",
      });
    },
    onSuccess: (_, { contractId }) => {
      queryClient.invalidateQueries({ queryKey: workflowKeys.contracts.detail(contractId) });
      queryClient.invalidateQueries({ queryKey: workflowKeys.contracts.list() });
    },
  });
}

// ==========================================
// WORK COMPLETIONS HOOKS
// ==========================================

export function useWorkCompletions(params?: {
  projectId?: number;
  contractId?: number;
  vendorId?: number;
  status?: string;
}) {
  return useQuery({
    queryKey: workflowKeys.workCompletions.list(params),
    queryFn: async () => {
      const res = await customFetch("/api/ra-bill-workflow/work-completions", { params });
      return ((res as any)?.data ?? res) as WorkCompletion[];
    },
  });
}

export function useWorkCompletion(id: number) {
  return useQuery({
    queryKey: workflowKeys.workCompletions.detail(id),
    queryFn: async () => {
      const res = await customFetch(`/api/ra-bill-workflow/work-completions/${id}`);
      return ((res as any)?.data ?? res) as WorkCompletion;
    },
    enabled: !!id,
  });
}

export function useCreateWorkCompletion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      projectId: number;
      contractId: number;
      vendorId: number;
      title: string;
      milestone?: string;
      completionDate: string;
      remarks?: string;
      items: Array<{
        contractBoqItemId: number;
        currentCompletedQty: number;
        remarks?: string;
      }>;
      documents?: Array<{
        documentType: string;
        fileName: string;
        fileUrl: string;
        fileSize?: number;
      }>;
    }) => {
      return customFetch("/api/ra-bill-workflow/work-completions", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workflowKeys.workCompletions.all() });
      queryClient.invalidateQueries({ queryKey: workflowKeys.all });
    },
  });
}

export function useSubmitWorkCompletion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      return customFetch(`/api/ra-bill-workflow/work-completions/${id}/submit`, {
        method: "POST",
      });
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: workflowKeys.workCompletions.detail(id) });
      queryClient.invalidateQueries({ queryKey: workflowKeys.workCompletions.list() });
      queryClient.invalidateQueries({ queryKey: workflowKeys.all });
    },
  });
}

export function useVerifyWorkCompletion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      return customFetch(`/api/ra-bill-workflow/work-completions/${id}/verify`, {
        method: "POST",
      });
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: workflowKeys.workCompletions.detail(id) });
      queryClient.invalidateQueries({ queryKey: workflowKeys.workCompletions.list() });
      queryClient.invalidateQueries({ queryKey: workflowKeys.contracts.all() });
      queryClient.invalidateQueries({ queryKey: workflowKeys.all });
    },
  });
}

export function useRequestWorkCompletionCorrection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      return customFetch(`/api/ra-bill-workflow/work-completions/${id}/request-correction`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      });
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: workflowKeys.workCompletions.detail(id) });
      queryClient.invalidateQueries({ queryKey: workflowKeys.workCompletions.list() });
      queryClient.invalidateQueries({ queryKey: workflowKeys.all });
    },
  });
}

export function useAddWorkCompletionDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      document,
    }: {
      id: number;
      document: {
        documentType: string;
        fileName: string;
        fileUrl: string;
        fileSize?: number;
      };
    }) => {
      return customFetch(`/api/ra-bill-workflow/work-completions/${id}/documents`, {
        method: "POST",
        body: JSON.stringify(document),
      });
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: workflowKeys.workCompletions.detail(id) });
    },
  });
}

// ==========================================
// RA BILLS HOOKS
// ==========================================

export function useWorkflowRaBills(params?: {
  projectId?: number;
  contractId?: number;
  vendorId?: number;
  status?: string;
}) {
  return useQuery({
    queryKey: workflowKeys.raBills.list(params),
    queryFn: async () => {
      const res = await customFetch("/api/ra-bill-workflow/ra-bills", { params });
      return ((res as any)?.data ?? res) as WorkflowRaBill[];
    },
  });
}

export function useWorkflowRaBill(id: number) {
  return useQuery({
    queryKey: workflowKeys.raBills.detail(id),
    queryFn: async () => {
      const res = await customFetch(`/api/ra-bill-workflow/ra-bills/${id}`);
      return ((res as any)?.data ?? res) as WorkflowRaBill;
    },
    enabled: !!id,
  });
}

export function useCreateWorkflowRaBill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      projectId: number;
      contractId: number;
      vendorId: number;
      workCompletionId?: number;
      description?: string;
      milestone?: string;
      billingPeriodStart?: string;
      billingPeriodEnd?: string;
      retentionPercent?: number;
      advanceRecovery?: number;
      tdsPercent?: number;
      gstPercent?: number;
      otherDeductions?: number;
      deductionRemarks?: string;
      items: Array<{
        contractBoqItemId: number;
        currentBilledQty: number;
      }>;
      documents?: Array<{
        documentType: string;
        fileName: string;
        fileUrl: string;
        fileSize?: number;
      }>;
    }) => {
      return customFetch("/api/ra-bill-workflow/ra-bills", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workflowKeys.raBills.all() });
      queryClient.invalidateQueries({ queryKey: workflowKeys.all });
    },
  });
}

export function useSubmitWorkflowRaBill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      return customFetch(`/api/ra-bill-workflow/ra-bills/${id}/submit`, {
        method: "POST",
      });
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: workflowKeys.raBills.detail(id) });
      queryClient.invalidateQueries({ queryKey: workflowKeys.raBills.list() });
      queryClient.invalidateQueries({ queryKey: workflowKeys.all });
    },
  });
}

export function useApproveWorkflowRaBill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, comments }: { id: number; comments?: string }) => {
      return customFetch(`/api/ra-bill-workflow/ra-bills/${id}/approve`, {
        method: "POST",
        body: JSON.stringify({ comments }),
      });
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: workflowKeys.raBills.detail(id) });
      queryClient.invalidateQueries({ queryKey: workflowKeys.raBills.list() });
      queryClient.invalidateQueries({ queryKey: workflowKeys.contracts.all() });
      queryClient.invalidateQueries({ queryKey: workflowKeys.all });
    },
  });
}

export function useRequestRevisionWorkflowRaBill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      return customFetch(`/api/ra-bill-workflow/ra-bills/${id}/request-revision`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      });
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: workflowKeys.raBills.detail(id) });
      queryClient.invalidateQueries({ queryKey: workflowKeys.raBills.list() });
      queryClient.invalidateQueries({ queryKey: workflowKeys.all });
    },
  });
}

export function useAddWorkflowRaBillDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      document,
    }: {
      id: number;
      document: {
        documentType: string;
        fileName: string;
        fileUrl: string;
        fileSize?: number;
      };
    }) => {
      return customFetch(`/api/ra-bill-workflow/ra-bills/${id}/documents`, {
        method: "POST",
        body: JSON.stringify(document),
      });
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: workflowKeys.raBills.detail(id) });
    },
  });
}

// ==========================================
// INVOICES & PAYMENTS HOOKS
// ==========================================

export function useGenerateInvoiceFromRaBill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      raBillId,
      paymentTerms,
      dueDate,
    }: {
      raBillId: number;
      paymentTerms?: string;
      dueDate?: string;
    }) => {
      return customFetch(`/api/ra-bill-workflow/ra-bills/${raBillId}/generate-invoice`, {
        method: "POST",
        body: JSON.stringify({ paymentTerms, dueDate }),
      });
    },
    onSuccess: (_, { raBillId }) => {
      queryClient.invalidateQueries({ queryKey: workflowKeys.raBills.detail(raBillId) });
      queryClient.invalidateQueries({ queryKey: workflowKeys.raBills.list() });
      queryClient.invalidateQueries({ queryKey: workflowKeys.invoices.all() });
      queryClient.invalidateQueries({ queryKey: workflowKeys.all });
    },
  });
}

export function useWorkflowInvoices(params?: {
  projectId?: number;
  vendorId?: number;
  status?: string;
}) {
  return useQuery({
    queryKey: workflowKeys.invoices.list(params),
    queryFn: async () => {
      const res = await customFetch("/api/ra-bill-workflow/invoices", { params });
      return ((res as any)?.data ?? res) as WorkflowInvoice[];
    },
  });
}

export function useWorkflowInvoice(id: number) {
  return useQuery({
    queryKey: workflowKeys.invoices.detail(id),
    queryFn: async () => {
      const res = await customFetch(`/api/ra-bill-workflow/invoices/${id}`);
      return ((res as any)?.data ?? res) as WorkflowInvoice;
    },
    enabled: !!id,
  });
}

export function useSendWorkflowInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      recipientEmail,
      recipientNotes,
      paymentTerms,
    }: {
      id: number;
      recipientEmail?: string;
      recipientNotes?: string;
      paymentTerms?: string;
    }) => {
      return customFetch(`/api/ra-bill-workflow/invoices/${id}/send`, {
        method: "POST",
        body: JSON.stringify({ recipientEmail, recipientNotes, paymentTerms }),
      });
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: workflowKeys.invoices.detail(id) });
      queryClient.invalidateQueries({ queryKey: workflowKeys.invoices.list() });
      queryClient.invalidateQueries({ queryKey: workflowKeys.all });
    },
  });
}

export function useRecordInvoicePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      invoiceId,
      data,
    }: {
      invoiceId: number;
      data: {
        paymentAmount: number;
        paymentDate: string;
        paymentMode: string;
        bankReference?: string;
        transactionId?: string;
        remarks?: string;
        documentUrl?: string;
      };
    }) => {
      return customFetch(`/api/ra-bill-workflow/invoices/${invoiceId}/record-payment`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: (_, { invoiceId }) => {
      queryClient.invalidateQueries({ queryKey: workflowKeys.invoices.detail(invoiceId) });
      queryClient.invalidateQueries({ queryKey: workflowKeys.invoices.list() });
      queryClient.invalidateQueries({ queryKey: workflowKeys.all });
    },
  });
}

export function useSendPaymentReminder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      invoiceId,
      data,
    }: {
      invoiceId: number;
      data: {
        reminderType?: string;
        subject?: string;
        message: string;
        recipient?: string;
        followUpRemarks?: string;
      };
    }) => {
      return customFetch(`/api/ra-bill-workflow/invoices/${invoiceId}/send-reminder`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: (_, { invoiceId }) => {
      queryClient.invalidateQueries({ queryKey: workflowKeys.invoices.detail(invoiceId) });
    },
  });
}

export function useReconcileInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      reconciliationRemarks,
    }: {
      id: number;
      reconciliationRemarks?: string;
    }) => {
      return customFetch(`/api/ra-bill-workflow/invoices/${id}/reconcile`, {
        method: "POST",
        body: JSON.stringify({ reconciliationRemarks }),
      });
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: workflowKeys.invoices.detail(id) });
      queryClient.invalidateQueries({ queryKey: workflowKeys.invoices.list() });
      queryClient.invalidateQueries({ queryKey: workflowKeys.all });
    },
  });
}

export function useCloseInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      return customFetch(`/api/ra-bill-workflow/invoices/${id}/close`, {
        method: "POST",
      });
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: workflowKeys.invoices.detail(id) });
      queryClient.invalidateQueries({ queryKey: workflowKeys.invoices.list() });
      queryClient.invalidateQueries({ queryKey: workflowKeys.all });
    },
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// PROJECT JOURNEY & END-TO-END WORKFLOW HOOKS
// ═══════════════════════════════════════════════════════════════════════════

export interface ProjectJourneyData {
  project: {
    id: number;
    name: string;
    clientName?: string;
    type?: string;
    location?: string;
    budget: number;
    status: string;
    progress: number;
    description?: string;
    startDate?: string;
    endDate?: string;
  };
  tasks: Array<{
    id: number;
    title: string;
    status: string;
    priority: string;
    progress: number;
    startDate?: string;
    endDate?: string;
  }>;
  budgetItems: Array<{
    id: number;
    costCode: string;
    description: string;
    budgeted: number;
    actual: number;
    committed: number;
  }>;
  procurement: {
    materialRequest: any;
    rfq: any;
    quotes: any[];
    purchaseOrder: any;
    receipt: any;
    inspection: any;
    inventory: any[];
  };
  contract: any;
  workCompletion: any;
  raBill: any;
  invoice: any;
  vendorAP?: {
    invoice: any;
    payment: any;
    matching: any;
  };
  expenses?: any[];
  handover?: {
    snagItems: any[];
    vccNumber: string;
    vccDate: string;
    dlpPeriodMonths: number;
    dlpExpiryDate: string;
    retentionHeld: number;
    retentionReleaseStage1: number;
    retentionReleaseStage2: number;
    status: string;
  };
}

export function useGetProjectJourney(projectId: number) {
  return useQuery<ProjectJourneyData>({
    queryKey: ["project-journey", projectId],
    queryFn: () => customFetch(`/api/ra-bill-workflow/journey/${projectId}`),
    enabled: Boolean(projectId),
  });
}

export function useSeedProjectJourney() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (projectId: number) =>
      customFetch(`/api/ra-bill-workflow/journey/${projectId}/seed`, { method: "POST" }),
    onSuccess: (_, projectId) => {
      queryClient.invalidateQueries({ queryKey: ["project-journey", projectId] });
      queryClient.invalidateQueries({ queryKey: workflowKeys.all });
    },
  });
}

