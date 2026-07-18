/**
 * Manual (non-generated) hooks for user CRUD operations.
 * These complement the orval-generated useListUsers / useUpdateUserRoles hooks.
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { customFetch } from "./custom-fetch";
import type { User } from "./generated/api.schemas";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  roles?: string[];
  avatarUrl?: string;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  avatarUrl?: string;
}

// ---------------------------------------------------------------------------
// Fetch helpers
// ---------------------------------------------------------------------------

export const createUser = (data: CreateUserInput): Promise<User> =>
  customFetch<User>("/users", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const updateUser = (id: number, data: UpdateUserInput): Promise<User> =>
  customFetch<User>(`/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });

export const deleteUser = (id: number): Promise<void> =>
  customFetch<void>(`/users/${id}`, { method: "DELETE" });

// ---------------------------------------------------------------------------
// React Query hooks
// ---------------------------------------------------------------------------

export const useCreateUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateUserInput) => createUser(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["listUsers"] }),
  });
};

export const useUpdateUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateUserInput }) =>
      updateUser(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["listUsers"] }),
  });
};

export const useDeleteUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteUser(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["listUsers"] }),
  });
};
