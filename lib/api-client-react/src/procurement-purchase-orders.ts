import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { customFetch } from "./custom-fetch";

// Types
export interface PurchaseOrderItem {
  id: number;
  poId: number;
  itemName: string;
  description?: string;
  specification?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  receivedQuantity: number;
  acceptedQuantity: number;
  rejectedQuantity: number;
  sortOrder: number;
}

export interface PurchaseOrder {
  id: number;
  poNumber: string;
  rfqId: number;
  quoteId: number;
  materialRequestId: number;
  projectId: number;
  vendorId: number;
  poDate: Date;
  expectedDeliveryDate: Date;
  actualDeliveryDate?: Date;
  subtotal: number;
  taxAmount: number;
  shippingCost: number;
  totalAmount: number;
  deliveryTerms?: string;
  paymentTerms?: string;
  status: string;
  isAcknowledged: boolean;
  acknowledgmentDate?: Date;
  acknowledgmentNotes?: string;
  deliveryStatus: string;
  trackingNumber?: string;
  followUpCount: number;
  lastFollowUpDate?: Date;
  createdById: number;
  approvedById?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  vendorName?: string;
  projectName?: string;
  createdByName?: string;
  approvedByName?: string;
  items?: PurchaseOrderItem[];
}

// Query keys
export const purchaseOrderKeys = {
  all: ["purchase-orders"] as const,
  lists: () => [...purchaseOrderKeys.all, "list"] as const,
  list: (filters: any) => [...purchaseOrderKeys.lists(), filters] as const,
  details: () => [...purchaseOrderKeys.all, "detail"] as const,
  detail: (id: number) => [...purchaseOrderKeys.details(), id] as const,
  stats: () => [...purchaseOrderKeys.all, "stats"] as const,
  delayed: () => [...purchaseOrderKeys.all, "delayed"] as const,
};

// Hooks
export function usePurchaseOrders(params?: {
  projectId?: number;
  vendorId?: number;
  status?: string;
  deliveryStatus?: string;
}) {
  return useQuery({
    queryKey: purchaseOrderKeys.list(params),
    queryFn: async () => {
      const response = await customFetch("/api/procurement/purchase-orders", { params });
      return ((response as any)?.data ?? response) as PurchaseOrder[];
    },
  });
}

export function usePurchaseOrder(id: number) {
  return useQuery({
    queryKey: purchaseOrderKeys.detail(id),
    queryFn: async () => {
      const response = await customFetch(`/api/procurement/purchase-orders/${id}`);
      return ((response as any)?.data ?? response) as PurchaseOrder;
    },
    enabled: !!id,
  });
}

export function useCreatePurchaseOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: any) => {
      const payload = input?.data ? input.data : input;
      const response = await customFetch("/api/procurement/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return ((response as any)?.data ?? response) as PurchaseOrder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.lists() });
    },
  });
}

export function useUpdatePurchaseOrder(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<PurchaseOrder>) => {
      const response = await customFetch(`/api/procurement/purchase-orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return ((response as any)?.data ?? response) as PurchaseOrder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.lists() });
    },
  });
}

export function useIssuePurchaseOrder(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const response = await customFetch(`/api/procurement/purchase-orders/${id}/issue`, {
        method: "POST",
      });
      return (response as any)?.data ?? response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.lists() });
    },
  });
}

export function useAcknowledgePurchaseOrder(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (notes?: string) => {
      const response = await customFetch(`/api/procurement/purchase-orders/${id}/acknowledge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      return (response as any)?.data ?? response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.lists() });
    },
  });
}

export function useUpdatePOTracking(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      deliveryStatus?: string;
      trackingNumber?: string;
      notes?: string;
    }) => {
      const response = await customFetch(`/api/procurement/purchase-orders/${id}/tracking`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return (response as any)?.data ?? response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.lists() });
    },
  });
}

export function useCreatePOFollowUp(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { message: string; method?: string }) => {
      const response = await customFetch(`/api/procurement/purchase-orders/${id}/follow-up`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return (response as any)?.data ?? response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.detail(id) });
    },
  });
}

export function useCancelPurchaseOrder(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (reason: string) => {
      const response = await customFetch(`/api/procurement/purchase-orders/${id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      return (response as any)?.data ?? response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.lists() });
    },
  });
}

export function usePurchaseOrderStats(projectId?: number) {
  return useQuery({
    queryKey: [...purchaseOrderKeys.stats(), projectId],
    queryFn: async () => {
      const response = await customFetch("/api/procurement/purchase-orders/stats/summary", {
        params: { projectId },
      });
      return (response as any)?.data ?? response;
    },
  });
}

export function useDelayedPurchaseOrders() {
  return useQuery({
    queryKey: purchaseOrderKeys.delayed(),
    queryFn: async () => {
      const response = await customFetch("/api/procurement/purchase-orders/stats/delayed");
      return ((response as any)?.data ?? response) as PurchaseOrder[];
    },
  });
}
