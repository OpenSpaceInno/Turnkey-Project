import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { customFetch } from "./custom-fetch";

// Types
export interface InventoryTransaction {
  id: number;
  transactionNumber: string;
  inventoryItemId: number;
  projectId?: number;
  transactionType: string;
  transactionDate: Date;
  quantity: number;
  unitPrice?: number;
  totalValue?: number;
  balanceQuantity: number;
  poId?: number;
  inspectionId?: number;
  taskId?: number;
  remarks?: string;
  createdById: number;
  createdAt: Date;
  updatedAt: Date;
  createdByName?: string;
  projectName?: string;
  taskTitle?: string;
}

export interface InventoryItem {
  id: number;
  itemCode: string;
  projectId?: number;
  itemName: string;
  description?: string;
  category: string;
  unit: string;
  totalQuantity: number;
  availableQuantity: number;
  allocatedQuantity: number;
  consumedQuantity: number;
  minimumStock: number;
  reorderLevel: number;
  averageCost: number;
  lastPurchasePrice?: number;
  lastPurchaseDate?: Date;
  warehouseLocation?: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  projectName?: string;
  transactions?: InventoryTransaction[];
}

// Query keys
export const inventoryKeys = {
  all: ["inventory"] as const,
  lists: () => [...inventoryKeys.all, "list"] as const,
  list: (filters: any) => [...inventoryKeys.lists(), filters] as const,
  details: () => [...inventoryKeys.all, "detail"] as const,
  detail: (id: number) => [...inventoryKeys.details(), id] as const,
  transactions: (id: number) => [...inventoryKeys.detail(id), "transactions"] as const,
  lowStock: () => [...inventoryKeys.all, "low-stock"] as const,
  byProject: (projectId: number) => [...inventoryKeys.all, "by-project", projectId] as const,
  stats: () => [...inventoryKeys.all, "stats"] as const,
  history: (id: number) => [...inventoryKeys.detail(id), "history"] as const,
};

// Hooks
export function useInventoryItems(params?: { projectId?: number; category?: string; status?: string }) {
  return useQuery({
    queryKey: inventoryKeys.list(params),
    queryFn: async () => {
      const response = await customFetch("/api/procurement/inventory", { params });
      return ((response as any)?.data ?? response) as InventoryItem[];
    },
  });
}

export function useInventoryItem(id: number) {
  return useQuery({
    queryKey: inventoryKeys.detail(id),
    queryFn: async () => {
      const response = await customFetch(`/api/procurement/inventory/${id}`);
      return ((response as any)?.data ?? response) as InventoryItem;
    },
    enabled: !!id,
  });
}

export function useCreateInventoryItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      projectId?: number;
      itemName: string;
      description?: string;
      category: string;
      unit: string;
      totalQuantity?: number;
      availableQuantity?: number;
      minimumStock?: number;
      reorderLevel?: number;
      averageCost?: number;
      lastPurchasePrice?: number;
      lastPurchaseDate?: Date;
      warehouseLocation?: string;
    }) => {
      const response = await customFetch("/api/procurement/inventory", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return ((response as any)?.data ?? response) as InventoryItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() });
    },
  });
}

export function useUpdateInventoryItem(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<InventoryItem>) => {
      const response = await customFetch(`/api/procurement/inventory/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      return ((response as any)?.data ?? response) as InventoryItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() });
    },
  });
}

export function useInventoryTransactions(id: number) {
  return useQuery({
    queryKey: inventoryKeys.transactions(id),
    queryFn: async () => {
      const response = await customFetch(`/api/procurement/inventory/${id}/transactions`);
      return ((response as any)?.data ?? response) as InventoryTransaction[];
    },
    enabled: !!id,
  });
}

export function useIssueInventory(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      quantity: number;
      projectId?: number;
      taskId?: number;
      remarks?: string;
    }) => {
      const response = await customFetch(`/api/procurement/inventory/${id}/issue`, {
        method: "POST",
        body: JSON.stringify(data),
      });
      return (response as any)?.data ?? response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.transactions(id) });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() });
    },
  });
}

export function useReturnInventory(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      quantity: number;
      projectId?: number;
      taskId?: number;
      remarks?: string;
    }) => {
      const response = await customFetch(`/api/procurement/inventory/${id}/return`, {
        method: "POST",
        body: JSON.stringify(data),
      });
      return (response as any)?.data ?? response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.transactions(id) });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() });
    },
  });
}

export function useAdjustInventory(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      quantity: number;
      adjustmentType: "increase" | "decrease";
      remarks?: string;
    }) => {
      const response = await customFetch(`/api/procurement/inventory/${id}/adjust`, {
        method: "POST",
        body: JSON.stringify(data),
      });
      return (response as any)?.data ?? response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.transactions(id) });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() });
    },
  });
}

export function useLowStockItems(projectId?: number) {
  return useQuery({
    queryKey: [...inventoryKeys.lowStock(), projectId],
    queryFn: async () => {
      const response = await customFetch("/api/procurement/inventory/low-stock", {
        params: { projectId },
      });
      return ((response as any)?.data ?? response) as InventoryItem[];
    },
  });
}

export function useInventoryByProject(projectId: number) {
  return useQuery({
    queryKey: inventoryKeys.byProject(projectId),
    queryFn: async () => {
      const response = await customFetch(`/api/procurement/inventory/by-project/${projectId}`);
      return ((response as any)?.data ?? response) as InventoryItem[];
    },
    enabled: !!projectId,
  });
}

export function useInventoryStats(projectId?: number) {
  return useQuery({
    queryKey: [...inventoryKeys.stats(), projectId],
    queryFn: async () => {
      const response = await customFetch("/api/procurement/inventory/stats/summary", {
        params: { projectId },
      });
      return (response as any)?.data ?? response;
    },
  });
}

export function useInventoryHistory(id: number) {
  return useQuery({
    queryKey: inventoryKeys.history(id),
    queryFn: async () => {
      const response = await customFetch(`/api/procurement/inventory/${id}/history`);
      return (response as any)?.data ?? response;
    },
    enabled: !!id,
  });
}

export function useSearchInventory() {
  return useMutation({
    mutationFn: async (params: { query?: string; projectId?: number; category?: string }) => {
      const response = await customFetch("/api/procurement/inventory/search", { params });
      return ((response as any)?.data ?? response) as InventoryItem[];
    },
  });
}
