import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { customFetch } from "./custom-fetch";

// Types
export interface RfqItem {
  id: number;
  rfqId: number;
  itemName: string;
  description?: string;
  specification?: string;
  quantity: number;
  unit: string;
  sortOrder: number;
}

export interface RfqVendor {
  id: number;
  rfqId: number;
  vendorId: number;
  vendorName?: string;
  vendorEmail?: string;
  vendorPhone?: string;
  sentDate?: Date;
  respondedDate?: Date;
  status: string;
}

export interface Rfq {
  id: number;
  rfqNumber: string;
  materialRequestId: number;
  projectId: number;
  title: string;
  description?: string;
  status: string;
  issueDate?: Date;
  dueDate: Date;
  closedDate?: Date;
  sentToVendorCount: number;
  quotesReceivedCount: number;
  selectedQuoteId?: number;
  createdById: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  projectName?: string;
  createdByName?: string;
  materialRequestNumber?: string;
  items?: RfqItem[];
  vendors?: RfqVendor[];
}

// Query keys
export const rfqKeys = {
  all: ["rfqs"] as const,
  lists: () => [...rfqKeys.all, "list"] as const,
  list: (filters: any) => [...rfqKeys.lists(), filters] as const,
  details: () => [...rfqKeys.all, "detail"] as const,
  detail: (id: number) => [...rfqKeys.details(), id] as const,
  stats: () => [...rfqKeys.all, "stats"] as const,
};

// Aliases for compatibility
export { useRfqs as useListRfqs, useRfq as useGetRfq };
export const getListRfqsQueryKey = () => rfqKeys.lists();
export const getGetRfqQueryKey = (id: number) => rfqKeys.detail(id);

// Hooks
export function useRfqs(params?: { projectId?: number; status?: string; materialRequestId?: number }) {
  return useQuery({
    queryKey: rfqKeys.list(params),
    queryFn: async () => {
      const response = await customFetch("/api/procurement/rfqs", { params });
      return ((response as any)?.data ?? response) as Rfq[];
    },
  });
}

export function useRfq(id: number) {
  return useQuery({
    queryKey: rfqKeys.detail(id),
    queryFn: async () => {
      const response = await customFetch(`/api/procurement/rfqs/${id}`);
      return ((response as any)?.data ?? response) as Rfq;
    },
    enabled: !!id,
  });
}

export function useCreateRfq() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      data: {
        projectId?: number;
        materialRequestId?: number;
        title?: string;
        description?: string | null;
        dueDate?: Date | string;
        notes?: string;
        items?: any[];
      };
    }) => {
      const response = await customFetch("/api/procurement/rfqs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input.data),
      });
      return ((response as any)?.data ?? response) as Rfq;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rfqKeys.lists() });
    },
  });
}

export function useCreateRfqFromMaterialRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      materialRequestId: number;
      dueDate: string;
      vendorIds: number[];
      notes?: string;
    }) => {
      const response = await customFetch(
        `/api/procurement/rfqs/from-material-request/${data.materialRequestId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            dueDate: data.dueDate,
            vendorIds: data.vendorIds,
            notes: data.notes,
          }),
        }
      );
      return ((response as any)?.data ?? response) as Rfq;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rfqKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ["material-requests"] });
    },
  });
}

export function useUpdateRfq(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Rfq>) => {
      const response = await customFetch(`/api/procurement/rfqs/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return ((response as any)?.data ?? response) as Rfq;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rfqKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: rfqKeys.lists() });
    },
  });
}

export function useAddRfqVendors(rfqId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (vendorIds: number[]) => {
      const response = await customFetch(`/api/procurement/rfqs/${rfqId}/vendors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendorIds }),
      });
      return (response as any)?.data ?? response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rfqKeys.detail(rfqId) });
    },
  });
}

export function useRemoveRfqVendor(rfqId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (vendorId: number) => {
      await customFetch(`/api/procurement/rfqs/${rfqId}/vendors/${vendorId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rfqKeys.detail(rfqId) });
    },
  });
}

export function useSendRfq(rfqId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const response = await customFetch(`/api/procurement/rfqs/${rfqId}/send`, {
        method: "POST",
      });
      return (response as any)?.data ?? response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rfqKeys.detail(rfqId) });
      queryClient.invalidateQueries({ queryKey: rfqKeys.lists() });
    },
  });
}

export function useEmailRfqPdf(rfqId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data?: { vendorIds?: number[]; subject?: string; message?: string }) => {
      const response = await customFetch(`/api/procurement/rfqs/${rfqId}/email-vendors`, {
        method: "POST",
        body: JSON.stringify(data || {}),
        headers: { "Content-Type": "application/json" },
      });
      return (response as any)?.data ?? response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rfqKeys.detail(rfqId) });
      queryClient.invalidateQueries({ queryKey: rfqKeys.lists() });
    },
  });
}

export function useCloseRfq(rfqId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const response = await customFetch(`/api/procurement/rfqs/${rfqId}/close`, {
        method: "POST",
      });
      return (response as any)?.data ?? response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rfqKeys.detail(rfqId) });
      queryClient.invalidateQueries({ queryKey: rfqKeys.lists() });
    },
  });
}

export function useRfqStats(projectId?: number) {
  return useQuery({
    queryKey: [...rfqKeys.stats(), projectId],
    queryFn: async () => {
      const response = await customFetch("/api/procurement/rfqs/stats/summary", {
        params: { projectId },
      });
      return (response as any)?.data ?? response;
    },
  });
}
