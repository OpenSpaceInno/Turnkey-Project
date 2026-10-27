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
  customFetch<User>("/api/users", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const updateUser = (id: number, data: UpdateUserInput): Promise<User> =>
  customFetch<User>(`/api/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });

export const deleteUser = (id: number): Promise<void> =>
  customFetch<void>(`/api/users/${id}`, { method: "DELETE" });

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

// Switch Role
export interface SwitchRoleInput {
  role: string;
}

export const switchRole = (data: SwitchRoleInput): Promise<User> =>
  customFetch<User>("/api/auth/switch-role", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const useSwitchRole = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: SwitchRoleInput) => switchRole(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/auth/me"] }),
  });
};

// Logout
export const logout = (): Promise<{ message: string }> =>
  customFetch<{ message: string }>("/api/auth/logout", {
    method: "POST",
  });

export const useLogout = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => logout(),
    onSuccess: () => {
      // Clear all cached data
      qc.clear();
      // Redirect to login page
      window.location.href = "/login";
    },
  });
};
