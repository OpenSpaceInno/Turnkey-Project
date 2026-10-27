/**
 * Manual (non-generated) hooks for leads CRUD operations.
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { customFetch } from "./custom-fetch";
import type { Lead, LeadInput } from "./generated/api.schemas";

// Helper for mutation options
interface MutationOptions<TData = any, TVariables = any> {
  mutation?: {
    onSuccess?: (data: TData, variables: TVariables, context?: any) => void;
    onError?: (error: any, variables: TVariables, context?: any) => void;
    onSettled?: (data: TData | undefined, error: any, variables: TVariables, context?: any) => void;
  };
}

export const useCreateLead = (options?: MutationOptions<Lead, LeadInput | { data: LeadInput }>) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: LeadInput | { data: LeadInput }) => {
      const payload = (input as any)?.data ? (input as any).data : input;
      return await customFetch<Lead>("/api/leads", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    ...options?.mutation,
    onSuccess: (data, variables, context) => {
      qc.invalidateQueries({ queryKey: ["/api/leads"] });
      options?.mutation?.onSuccess?.(data, variables, context);
    },
  });
};

export const useUpdateLead = (options?: MutationOptions<Lead, { id: number; data: Partial<LeadInput> }>) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<LeadInput> }) => {
      return await customFetch<Lead>(`/api/leads/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    ...options?.mutation,
    onSuccess: (data, variables, context) => {
      qc.invalidateQueries({ queryKey: ["/api/leads"] });
      options?.mutation?.onSuccess?.(data, variables, context);
    },
  });
};

export const useDeleteLead = (options?: MutationOptions<void, number>) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await customFetch<void>(`/api/leads/${id}`, {
        method: "DELETE",
      });
    },
    ...options?.mutation,
    onSuccess: (data, variables, context) => {
      qc.invalidateQueries({ queryKey: ["/api/leads"] });
      options?.mutation?.onSuccess?.(data, variables, context);
    },
  });
};

// BOQ hooks
export const useCreateBoq = (options?: MutationOptions<any, { leadId: number; data: any }>) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ leadId, data }: { leadId: number; data: any }) => {
      return await customFetch(`/api/leads/${leadId}/boqs`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    ...options?.mutation,
    onSuccess: (data, variables, context) => {
      qc.invalidateQueries({ queryKey: ["/api/leads"] });
      options?.mutation?.onSuccess?.(data, variables, context);
    },
  });
};

export const useUpdateBoq = (options?: MutationOptions<any, { id: number; data: any }>) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return await customFetch(`/api/boqs/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    ...options?.mutation,
    onSuccess: (data, variables, context) => {
      qc.invalidateQueries({ queryKey: ["/api/leads"] });
      options?.mutation?.onSuccess?.(data, variables, context);
    },
  });
};

export const useAddBoqItem = (options?: MutationOptions<any, { boqId: number; data: any }>) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ boqId, data }: { boqId: number; data: any }) => {
      return await customFetch(`/api/boqs/${boqId}/items`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    ...options?.mutation,
    onSuccess: (data, variables, context) => {
      qc.invalidateQueries({ queryKey: ["/api/leads"] });
      options?.mutation?.onSuccess?.(data, variables, context);
    },
  });
};

export const useDeleteBoqItem = (options?: MutationOptions<any, { boqId: number; itemId: number }>) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ boqId, itemId }: { boqId: number; itemId: number }) => {
      return await customFetch(`/api/boqs/${boqId}/items/${itemId}`, {
        method: "DELETE",
      });
    },
    ...options?.mutation,
    onSuccess: (data, variables, context) => {
      qc.invalidateQueries({ queryKey: ["/api/leads"] });
      options?.mutation?.onSuccess?.(data, variables, context);
    },
  });
};

// Lead Activity hooks
export const useCreateLeadActivity = (options?: MutationOptions<any, { leadId: number; data: any }>) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ leadId, data }: { leadId: number; data: any }) => {
      return await customFetch(`/api/leads/${leadId}/activities`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    ...options?.mutation,
    onSuccess: (data, variables, context) => {
      qc.invalidateQueries({ queryKey: ["/api/leads"] });
      options?.mutation?.onSuccess?.(data, variables, context);
    },
  });
};

// Site Visit hooks
export const useCreateSiteVisit = (options?: MutationOptions<any, { leadId: number; data: any }>) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ leadId, data }: { leadId: number; data: any }) => {
      return await customFetch(`/api/leads/${leadId}/site-visits`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    ...options?.mutation,
    onSuccess: (data, variables, context) => {
      qc.invalidateQueries({ queryKey: ["/api/leads"] });
      options?.mutation?.onSuccess?.(data, variables, context);
    },
  });
};

export const useUpdateSiteVisit = (options?: MutationOptions<any, { id: number; data: any }>) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return await customFetch(`/api/site-visits/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    ...options?.mutation,
    onSuccess: (data, variables, context) => {
      qc.invalidateQueries({ queryKey: ["/api/leads"] });
      options?.mutation?.onSuccess?.(data, variables, context);
    },
  });
};

// Drawing hooks
export const useCreateDrawing = (options?: MutationOptions<any, { leadId: number; data: any }>) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ leadId, data }: { leadId: number; data: any }) => {
      return await customFetch(`/api/leads/${leadId}/drawings`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    ...options?.mutation,
    onSuccess: (data, variables, context) => {
      qc.invalidateQueries({ queryKey: ["/api/leads"] });
      options?.mutation?.onSuccess?.(data, variables, context);
    },
  });
};

export const useUpdateDrawing = (options?: MutationOptions<any, { id: number; data: any }>) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return await customFetch(`/api/drawings/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    ...options?.mutation,
    onSuccess: (data, variables, context) => {
      qc.invalidateQueries({ queryKey: ["/api/leads"] });
      options?.mutation?.onSuccess?.(data, variables, context);
    },
  });
};

// Negotiation hooks
export const useCreateNegotiation = (options?: MutationOptions<any, { leadId: number; data: any }>) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ leadId, data }: { leadId: number; data: any }) => {
      return await customFetch(`/api/leads/${leadId}/negotiations`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    ...options?.mutation,
    onSuccess: (data, variables, context) => {
      qc.invalidateQueries({ queryKey: ["/api/leads"] });
      options?.mutation?.onSuccess?.(data, variables, context);
    },
  });
};

export const useUpdateNegotiation = (options?: MutationOptions<any, { id: number; data: any }>) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return await customFetch(`/api/negotiations/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    ...options?.mutation,
    onSuccess: (data, variables, context) => {
      qc.invalidateQueries({ queryKey: ["/api/leads"] });
      options?.mutation?.onSuccess?.(data, variables, context);
    },
  });
};

// Convert Lead Hook
export const useConvertLead = (options?: MutationOptions<any, { id?: number; leadId?: number; data?: any }>) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { id?: number; leadId?: number; data?: any }) => {
      const targetId = vars.id ?? vars.leadId;
      if (!targetId) throw new Error("Lead ID is required for conversion");
      return await customFetch<any>(`/api/leads/${targetId}/convert`, {
        method: "POST",
        body: JSON.stringify(vars.data ?? {}),
      });
    },
    ...options?.mutation,
    onSuccess: (data, variables, context) => {
      qc.invalidateQueries({ queryKey: ["/api/leads"] });
      qc.invalidateQueries({ queryKey: ["/api/projects"] });
      options?.mutation?.onSuccess?.(data, variables, context);
    },
    onError: (err, variables, context) => {
      options?.mutation?.onError?.(err, variables, context);
    },
  });
};
