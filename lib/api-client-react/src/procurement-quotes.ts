import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { customFetch } from "./custom-fetch";

// Types
export interface QuoteItem {
  id: number;
  quoteId: number;
  rfqItemId: number;
  itemName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  remarks?: string;
  sortOrder: number;
  rfqItemName?: string;
}

export interface VendorQuote {
  id: number;
  quoteNumber: string;
  rfqId: number;
  vendorId: number;
  quotedDate: Date;
  validUntil?: Date;
  deliveryDays: number;
  deliveryTerms?: string;
  paymentTerms?: string;
  subtotal: number;
  taxPercent: number;
  taxAmount: number;
  shippingCost: number;
  totalAmount: number;
  isSelected: boolean;
  selectionReason?: string;
  selectedById?: number;
  selectedDate?: Date;
  status: string;
  notes?: string;
  attachmentUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  vendorName?: string;
  vendorEmail?: string;
  vendorPhone?: string;
  rfqNumber?: string;
  selectedByName?: string;
  items?: QuoteItem[];
}

// Query keys
export const quoteKeys = {
  all: ["quotes"] as const,
  lists: () => [...quoteKeys.all, "list"] as const,
  list: (filters: any) => [...quoteKeys.lists(), filters] as const,
  details: () => [...quoteKeys.all, "detail"] as const,
  detail: (id: number) => [...quoteKeys.details(), id] as const,
  comparison: (rfqId: number) => [...quoteKeys.all, "comparison", rfqId] as const,
};

// Hooks
export function useVendorQuotes(params?: { rfqId?: number; vendorId?: number; status?: string }) {
  return useQuery({
    queryKey: quoteKeys.list(params),
    queryFn: async () => {
      const response = await customFetch("/api/procurement/quotes", { params });
      return ((response as any)?.data ?? response) as VendorQuote[];
    },
  });
}

export function useVendorQuote(id: number) {
  return useQuery({
    queryKey: quoteKeys.detail(id),
    queryFn: async () => {
      const response = await customFetch(`/api/procurement/quotes/${id}`);
      return ((response as any)?.data ?? response) as VendorQuote;
    },
    enabled: !!id,
  });
}

export function useCreateVendorQuote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      rfqId: number;
      vendorId: number;
      quotedDate?: Date;
      validUntil?: Date;
      deliveryDays: number;
      deliveryTerms?: string;
      paymentTerms?: string;
      subtotal: number;
      taxPercent?: number;
      taxAmount?: number;
      shippingCost?: number;
      totalAmount: number;
      notes?: string;
      attachmentUrl?: string;
      items: Array<{
        rfqItemId: number;
        itemName: string;
        quantity: number;
        unit: string;
        unitPrice: number;
        totalPrice: number;
        remarks?: string;
      }>;
    }) => {
      const response = await customFetch("/api/procurement/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return ((response as any)?.data ?? response) as VendorQuote;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quoteKeys.lists() });
    },
  });
}

export function useUpdateVendorQuote(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<VendorQuote>) => {
      const response = await customFetch(`/api/procurement/quotes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return ((response as any)?.data ?? response) as VendorQuote;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quoteKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: quoteKeys.lists() });
    },
  });
}

export function useSelectQuote(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (reason?: string) => {
      const response = await customFetch(`/api/procurement/quotes/${id}/select`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      return (response as any)?.data ?? response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quoteKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: quoteKeys.lists() });
    },
  });
}

export function useRfqQuotesComparison(rfqId: number) {
  return useQuery({
    queryKey: quoteKeys.comparison(rfqId),
    queryFn: async () => {
      const response = await customFetch(`/api/procurement/rfqs/${rfqId}/quotes`);
      return ((response as any)?.data ?? response) as VendorQuote[];
    },
    enabled: !!rfqId,
  });
}

export function useQuoteComparison(id: number) {
  return useQuery({
    queryKey: [...quoteKeys.detail(id), "comparison"],
    queryFn: async () => {
      const response = await customFetch(`/api/procurement/quotes/${id}/comparison`);
      return (response as any)?.data ?? response;
    },
    enabled: !!id,
  });
}
