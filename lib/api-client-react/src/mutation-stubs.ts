/**
 * Stub mutation hooks for modules that don't have backend implementations yet.
 * These provide the expected API but will fail gracefully if the endpoints don't exist.
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { customFetch } from "./custom-fetch";

// Generic mutation hook creator
const createMutationHook = (endpoint: string, method: "POST" | "PATCH" | "DELETE", queryKey: string[]) => {
  return () => {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: async (params: any) => {
        const { id, data, ...rest } = params || {};
        const url = id ? `${endpoint}/${id}` : endpoint;
        const bodyPayload =
          data !== undefined
            ? typeof data === "object" && data !== null
              ? { ...rest, ...data }
              : data
            : Object.keys(rest).length > 0
            ? rest
            : undefined;
        const response = await customFetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: bodyPayload !== undefined ? JSON.stringify(bodyPayload) : undefined,
        });
        return response;
      },
      onSuccess: () => {
        qc.invalidateQueries({ queryKey });
      },
    });
  };
};

// Projects
export const useCreateProject = createMutationHook("/api/projects", "POST", ["/api/projects"]);
export const useUpdateProject = createMutationHook("/api/projects", "PATCH", ["/api/projects"]);
export const useDeleteProject = createMutationHook("/api/projects", "DELETE", ["/api/projects"]);

// Tasks
export const useCreateTask = createMutationHook("/api/tasks", "POST", ["/api/tasks"]);
export const useUpdateTask = createMutationHook("/api/tasks", "PATCH", ["/api/tasks"]);
export const useDeleteTask = createMutationHook("/api/tasks", "DELETE", ["/api/tasks"]);

// Task Templates
export const useCreateTaskTemplate = createMutationHook("/api/task-templates", "POST", ["/api/task-templates"]);
export const useUpdateTaskTemplate = createMutationHook("/api/task-templates", "PATCH", ["/api/task-templates"]);
export const useDeleteTaskTemplate = createMutationHook("/api/task-templates", "DELETE", ["/api/task-templates"]);
export const useApplyTaskTemplate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: any) => {
      const { id, data, ...rest } = params || {};
      const templateId = id || data?.templateId;
      const url = `/api/task-templates/${templateId}/apply`;
      const response = await customFetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data || {}),
        ...rest,
      });
      return response;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/task-templates"] });
      qc.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
  });
};

// Documents
export const useCreateDocument = createMutationHook("/api/documents", "POST", ["/api/documents"]);
export const useUpdateDocument = createMutationHook("/api/documents", "PATCH", ["/api/documents"]);
export const useDeleteDocument = createMutationHook("/api/documents", "DELETE", ["/api/documents"]);

// Communications
export const useCreateCommunication = createMutationHook("/api/communications", "POST", ["/api/communications"]);
export const useUpdateCommunication = createMutationHook("/api/communications", "PATCH", ["/api/communications"]);
export const useDeleteCommunication = createMutationHook("/api/communications", "DELETE", ["/api/communications"]);

// Meetings
export const useCreateMeeting = createMutationHook("/api/meetings", "POST", ["/api/meetings"]);
export const useUpdateMeeting = createMutationHook("/api/meetings", "PATCH", ["/api/meetings"]);
export const useDeleteMeeting = createMutationHook("/api/meetings", "DELETE", ["/api/meetings"]);

// Notifications
export const useMarkNotificationAsRead = createMutationHook("/api/notifications", "PATCH", ["/api/notifications"]);
export const useDeleteNotification = createMutationHook("/api/notifications", "DELETE", ["/api/notifications"]);

// Budget Items
export const useCreateBudgetItem = createMutationHook("/api/budget-items", "POST", ["/api/budget-items"]);
export const useUpdateBudgetItem = createMutationHook("/api/budget-items", "PATCH", ["/api/budget-items"]);

// Punch List Items
export const useCreatePunchListItem = createMutationHook("/api/punch-list-items", "POST", ["/api/punch-list-items"]);
export const useUpdatePunchListItem = createMutationHook("/api/punch-list-items", "PATCH", ["/api/punch-list-items"]);
export const useDeletePunchListItem = createMutationHook("/api/punch-list-items", "DELETE", ["/api/punch-list-items"]);
export const useCreatePunchListItemComment = createMutationHook("/api/punch-list-item-comments", "POST", ["/api/punch-list-items"]);
export const useUpdatePunchListItemComment = createMutationHook("/api/punch-list-item-comments", "PATCH", ["/api/punch-list-items"]);
export const useDeletePunchListItemComment = createMutationHook("/api/punch-list-item-comments", "DELETE", ["/api/punch-list-items"]);

// Stakeholders
export const useCreateStakeholder = createMutationHook("/api/stakeholders", "POST", ["/api/stakeholders"]);
export const useUpdateStakeholder = createMutationHook("/api/stakeholders", "PATCH", ["/api/stakeholders"]);
export const useDeleteStakeholder = createMutationHook("/api/stakeholders", "DELETE", ["/api/stakeholders"]);

// Vendors
// Note: useCreateVendor and useUpdateVendor come from generated API
// useDeleteVendor is kept here as it's not in the generated API
export const useDeleteVendor = createMutationHook("/api/vendors", "DELETE", ["/api/vendors"]);

// Financial Instruments
export const useCreateFinancialInstrument = createMutationHook("/api/financial-instruments", "POST", ["/api/financial-instruments"]);
export const useUpdateFinancialInstrument = createMutationHook("/api/financial-instruments", "PATCH", ["/api/financial-instruments"]);
export const useDeleteFinancialInstrument = createMutationHook("/api/financial-instruments", "DELETE", ["/api/financial-instruments"]);

// Expenses
export const useCreateExpense = createMutationHook("/api/expenses", "POST", ["/api/expenses"]);
export const useUpdateExpense = createMutationHook("/api/expenses", "PATCH", ["/api/expenses"]);
export const useDeleteExpense = createMutationHook("/api/expenses", "DELETE", ["/api/expenses"]);

// Invoices
export const useCreateInvoice = createMutationHook("/api/invoices", "POST", ["/api/invoices"]);
export const useUpdateInvoice = createMutationHook("/api/invoices", "PATCH", ["/api/invoices"]);
export const useDeleteInvoice = createMutationHook("/api/invoices", "DELETE", ["/api/invoices"]);

// RA Bills
export const useCreateRaBill = createMutationHook("/api/ra-bills", "POST", ["/api/ra-bills"]);
export const useUpdateRaBill = createMutationHook("/api/ra-bills", "PATCH", ["/api/ra-bills"]);
export const useDeleteRaBill = createMutationHook("/api/ra-bills", "DELETE", ["/api/ra-bills"]);

// Vendor Invoices
export const useCreateVendorInvoice = createMutationHook("/api/vendor-invoices", "POST", ["/api/vendor-invoices"]);
export const useUpdateVendorInvoice = createMutationHook("/api/vendor-invoices", "PATCH", ["/api/vendor-invoices"]);
export const useDeleteVendorInvoice = createMutationHook("/api/vendor-invoices", "DELETE", ["/api/vendor-invoices"]);

// Materials
export const useCreateMaterial = createMutationHook("/api/materials", "POST", ["/api/materials"]);
export const useUpdateMaterial = createMutationHook("/api/materials", "PATCH", ["/api/materials"]);
export const useDeleteMaterial = createMutationHook("/api/materials", "DELETE", ["/api/materials"]);



