// API Client React - Main Exports
export * from "./generated/api.schemas";
export { setBaseUrl, setAuthTokenGetter, customFetch } from "./custom-fetch";
export type { AuthTokenGetter } from "./custom-fetch";
export * from "./users";
export * from "./leads";
export * from "./mutation-stubs";
export * from "./role-switch-requests";

// Export query key functions from generated API
export { 
  getGetCurrentUserQueryKey,
  getListUsersQueryKey,
  getGetDashboardSummaryQueryKey,
  getGetRecentActivityQueryKey,
  getListLeadsQueryKey,
  getGetLeadQueryKey,
  getGetLeadsSummaryQueryKey,
  getListLeadActivitiesQueryKey,
  getListSiteVisitsQueryKey,
  getListDrawingsQueryKey,
  getListBoqsQueryKey,
  getGetBoqQueryKey,
  getListNegotiationsQueryKey,
  getListProjectsQueryKey,
  getGetProjectQueryKey,
  getListTaskTemplatesQueryKey,
  getGetTaskTemplateQueryKey,
  getListTasksQueryKey,
  getListBudgetItemsQueryKey,
  getListRaBillsQueryKey,
  getListExpensesQueryKey,
  getListInvoicesQueryKey,
  getListVendorInvoicesQueryKey,
  getListFinancialInstrumentsQueryKey,
  getListVendorsQueryKey,
  getListPunchListItemsQueryKey,
  getListPunchListItemCommentsQueryKey,
  getListStakeholdersQueryKey,
  getListCommunicationsQueryKey,
  getListMeetingsQueryKey,
  getListDocumentsQueryKey,
  getListNotificationsQueryKey,
  getListAuditLogsQueryKey,
  getCompanySettingsQueryKey,
  getNotificationPreferencesQueryKey,
  // Old query keys from generated API
  getListMaterialRequestsQueryKey,
  getListPurchaseOrdersQueryKey,
  getListMaterialsQueryKey,
} from "./generated/api";

// Export procurement material requests hooks
export {
  useProcurementListMaterialRequests as useListMaterialRequests,
  useProcurementGetMaterialRequest as useGetMaterialRequest,
  useProcurementListMaterialRequestItems as useListMaterialRequestItems,
  useProcurementGetMaterialRequestStats as useGetMaterialRequestStats,
  useProcurementCreateMaterialRequest as useCreateMaterialRequest,
  useProcurementUpdateMaterialRequest as useUpdateMaterialRequest,
  useProcurementSubmitMaterialRequest as useSubmitMaterialRequest,
  useProcurementApproveMaterialRequest as useApproveMaterialRequest,
  useProcurementRejectMaterialRequest as useRejectMaterialRequest,
  useProcurementAddMaterialRequestItem as useAddMaterialRequestItem,
  useProcurementUpdateMaterialRequestItem as useUpdateMaterialRequestItem,
  useProcurementDeleteMaterialRequestItem as useDeleteMaterialRequestItem,
  useProcurementGetPendingApprovals,
  useProcurementGetApprovalHistory,
  // Also export with original names for direct usage
  useProcurementListMaterialRequests,
  useProcurementGetMaterialRequest,
  useProcurementGetMaterialRequestStats,
  useProcurementSubmitMaterialRequest,
  useProcurementApproveMaterialRequest,
  useProcurementRejectMaterialRequest,
  type MaterialRequest,
  type MaterialRequestItem,
  type CreateMaterialRequestInput,
  type UpdateMaterialRequestInput,
  type MaterialRequestStats,
  type ApprovalHistoryEntry,
  type PendingApprovalsResponse,
} from "./procurement-material-requests";

// Note: The procurement module exports the main hooks:
// - useListMaterialRequests (from procurement-material-requests)
// For old/simple usage, generated API versions are available as:
// - useListMaterialRequestsOld, useListRfqsOld, etc.

// Export old generated hooks for backward compatibility (with "Old" suffix)
export { 
  useListMaterialRequests as useListMaterialRequestsOld,
  useListRfqs as useListRfqsOld,
  useGetRfq as useGetRfqOld,
  useListPurchaseOrders as useListPurchaseOrdersOld,
  useListPurchaseOrders, // Also export without suffix for components that use it
} from "./generated/api";

// Re-export Rfq and PurchaseOrder explicitly to resolve ambiguity
export type { Rfq } from "./procurement-rfqs";
export type { PurchaseOrder } from "./procurement-purchase-orders";

// Export procurement RFQs hooks
export * from "./procurement-rfqs";

// Export procurement quotes hooks
export * from "./procurement-quotes";

// Export procurement purchase orders hooks
export * from "./procurement-purchase-orders";

// Export procurement inventory hooks
export * from "./procurement-inventory";

// Export RA Bill & Vendor Payment workflow hooks
export * from "./ra-bill-workflow";

// Export commonly used hooks from generated API (excluding procurement conflicts)
export {
  // Auth & Users
  useGetCurrentUser,
  useListUsers,
  useUpdateUserRoles,
  
  // Dashboard
  useGetDashboardSummary,
  useGetRecentActivity,
  
  // Leads
  useListLeads,
  useGetLead,
  useGetLeadsSummary,
  useListLeadActivities,
  useListSiteVisits,
  useListDrawings,
  useListBoqs,
  useGetBoq,
  useListNegotiations,
  
  // Projects
  useListProjects,
  useGetProject,
  
  // Task Templates
  useListTaskTemplates,
  useGetTaskTemplate,
  useCreateTaskTemplateItem,
  useUpdateTaskTemplateItem,
  useDeleteTaskTemplateItem,
  
  // Tasks
  useListTasks,
  
  // Budget & Finance
  useListBudgetItems,
  useListRaBills,
  useListExpenses,
  useListInvoices,
  useListVendorInvoices,
  useListFinancialInstruments,
  
  // Vendors
  useListVendors,
  useCreateVendor,
  useUpdateVendor,
  
  // Materials
  useListMaterials,
  
  // Stakeholders
  useListStakeholders,
  
  // Communications
  useListCommunications,
  
  // Meetings
  useListMeetings,
  
  // Documents
  useListDocuments,
  
  // Notifications
  useListNotifications,
  useMarkNotificationRead,
  useClearNotifications,
  
  // Audit Logs
  useListAuditLogs,
  
  // Punch List Items
  useListPunchListItems,
  useListPunchListItemComments,
  
  // Company Settings
  useGetCompanySettings,
  useUpdateCompanySettings,
  
  // Notification Preferences
  useGetNotificationPreferences,
  useUpdateNotificationPreferences,
} from "./generated/api";

// RA Bill Workflow & Project Journey
export * from "./ra-bill-workflow";

// Accounts Receivable (AR) Workflow Hooks
export * from "./ar-workflow";

// Accounts Payable (AP) Workflow Hooks
export * from "./ap-workflow";

// Financial Audit Trail Hooks
export * from "./financial-audit";

// Milestone-to-Billing Schedule & Budget Variance Alerts
export * from "./billing-milestones";

// Project Centric Journey, Setup Checklist, Next Action Engine & Team Hooks
export * from "./project-journey";

// Role-Based Access Control & Visibility Hook
export * from "./use-permissions";

// Financial Instruments Expiry Alerts & Actions
export * from "./financial-instruments";

// Module 9: Reports & Analytics
export * from "./reports";
