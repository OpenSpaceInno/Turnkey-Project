import {
  mysqlTable,
  int,
  text,
  mediumtext,
  varchar,
  timestamp,
  date,
  boolean,
  decimal,
  double,
  json,
} from "drizzle-orm/mysql-core";

const ts = () => ({
  createdAt: timestamp("created_at")
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const organizationsTable = mysqlTable("organizations", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 64 }).notNull().unique(),
  status: varchar("status", { length: 32 }).notNull().default("active"),
  ...ts(),
});

export const usersTable = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organization_id").notNull().default(1),
  email: varchar("email", { length: 255 }).notNull().unique(),
  phone: varchar("phone", { length: 32 }).unique(),
  name: varchar("name", { length: 255 }).notNull(),
  passwordHash: text("password_hash"),
  avatarUrl: text("avatar_url"),
  roles: json("roles").notNull().$default(() => []),
  activeRole: varchar("active_role", { length: 50 }).notNull().default("admin"),
  resetToken: varchar("reset_token", { length: 255 }),
  resetTokenExpiresAt: timestamp("reset_token_expires_at"),
  twoFactorEnabled: boolean("two_factor_enabled").notNull().default(false),
  twoFactorSecret: text("two_factor_secret"),
  twoFactorBackupCodes: json("two_factor_backup_codes"),
  ...ts(),
});

export const userPermissionOverridesTable = mysqlTable("user_permission_overrides", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  permission: varchar("permission", { length: 64 }).notNull(),
  granted: boolean("granted").notNull().default(true),
  grantedById: int("granted_by_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const leadsTable = mysqlTable("leads", {
  id: int("id").autoincrement().primaryKey(),
  leadNumber: varchar("lead_number", { length: 64 }).notNull().unique(),
  customerName: varchar("customer_name", { length: 255 }).notNull(),
  company: varchar("company", { length: 255 }),
  contactEmail: varchar("contact_email", { length: 255 }),
  contactPhone: varchar("contact_phone", { length: 64 }),
  projectType: varchar("project_type", { length: 128 }),
  location: varchar("location", { length: 255 }),
  budgetEstimate: decimal("budget_estimate", { precision: 14, scale: 2 }),
  leadSource: varchar("lead_source", { length: 128 }),
  status: varchar("status", { length: 32 }).notNull().default("new"),
  stage: varchar("stage", { length: 32 }).notNull().default("lead_creation"),
  priority: varchar("priority", { length: 16 }).notNull().default("medium"),
  ownerId: int("owner_id"),
  expectedClosureDate: date("expected_closure_date"),
  wonProjectId: int("won_project_id"),
  notes: text("notes"),
  advancePercent: decimal("advance_percent", { precision: 5, scale: 2 }).default("10.00"),
  retentionPercent: decimal("retention_percent", { precision: 5, scale: 2 }).default("5.00"),
  abgRequired: boolean("abg_required").default(false),
  abgPercent: decimal("abg_percent", { precision: 5, scale: 2 }).default("0.00"),
  abgAmount: decimal("abg_amount", { precision: 14, scale: 2 }).default("0.00"),
  paymentTermsDays: int("payment_terms_days").default(30),
  dlpMonths: int("dlp_months").default(12),
  organizationId: int("organization_id").default(1),
  commercialTermsNotes: text("commercial_terms_notes"),
  ...ts(),
});

export const leadActivitiesTable = mysqlTable("lead_activities", {
  id: int("id").autoincrement().primaryKey(),
  leadId: int("lead_id").notNull(),
  activityType: varchar("activity_type", { length: 64 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  createdById: int("created_by_id"),
  ...ts(),
});

export const siteVisitsTable = mysqlTable("site_visits", {
  id: int("id").autoincrement().primaryKey(),
  leadId: int("lead_id").notNull(),
  visitDate: date("visit_date").notNull(),
  visitTime: varchar("visit_time", { length: 16 }),
  engineerId: int("engineer_id"),
  siteAddress: text("site_address"),
  latitude: double("latitude"),
  longitude: double("longitude"),
  measurements: text("measurements"),
  observations: text("observations"),
  status: varchar("status", { length: 32 }).notNull().default("pending"),
  ...ts(),
});

export const drawingsTable = mysqlTable("drawings", {
  id: int("id").autoincrement().primaryKey(),
  leadId: int("lead_id").notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileType: varchar("file_type", { length: 64 }),
  fileSize: int("file_size"),
  fileUrl: text("file_url"),
  version: int("version").notNull().default(1),
  status: varchar("status", { length: 32 }).notNull().default("draft"),
  reviewerComments: text("reviewer_comments"),
  uploadedById: int("uploaded_by_id"),
  reviewedById: int("reviewed_by_id"),
  uploadedAt: timestamp("uploaded_at")
    .notNull()
    .defaultNow(),
});

export const boqsTable = mysqlTable("boqs", {
  id: int("id").autoincrement().primaryKey(),
  leadId: int("lead_id").notNull(),
  version: int("version").notNull().default(1),
  status: varchar("status", { length: 32 }).notNull().default("draft"),
  subtotal: decimal("subtotal", { precision: 14, scale: 2 })
    .notNull()
    .default("0"),
  taxTotal: decimal("tax_total", { precision: 14, scale: 2 })
    .notNull()
    .default("0"),
  marginTotal: decimal("margin_total", { precision: 14, scale: 2 })
    .notNull()
    .default("0"),
  grandTotal: decimal("grand_total", { precision: 14, scale: 2 })
    .notNull()
    .default("0"),
  createdById: int("created_by_id"),
  approvedById: int("approved_by_id"),
  ...ts(),
});

export const boqItemsTable = mysqlTable("boq_items", {
  id: int("id").autoincrement().primaryKey(),
  boqId: int("boq_id").notNull(),
  itemName: varchar("item_name", { length: 255 }).notNull(),
  category: varchar("category", { length: 128 }),
  quantity: decimal("quantity", { precision: 14, scale: 2 }).notNull(),
  unit: varchar("unit", { length: 32 }),
  unitPrice: decimal("unit_price", { precision: 14, scale: 2 }).notNull(),
  taxPercent: decimal("tax_percent", { precision: 6, scale: 2 })
    .notNull()
    .default("0"),
  marginPercent: decimal("margin_percent", { precision: 6, scale: 2 })
    .notNull()
    .default("0"),
  totalPrice: decimal("total_price", { precision: 14, scale: 2 })
    .notNull()
    .default("0"),
  sortOrder: int("sort_order").notNull().default(0),
});

export const negotiationsTable = mysqlTable("negotiations", {
  id: int("id").autoincrement().primaryKey(),
  leadId: int("lead_id").notNull(),
  roundNumber: int("round_number").notNull().default(1),
  revisedAmount: decimal("revised_amount", { precision: 14, scale: 2 }),
  discountPercent: decimal("discount_percent", { precision: 6, scale: 2 }),
  status: varchar("status", { length: 32 }).notNull().default("pending"),
  requiresApproval: boolean("requires_approval").notNull().default(false),
  notes: text("notes"),
  createdById: int("created_by_id"),
  approvedById: int("approved_by_id"),
  ...ts(),
});

export const projectsTable = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 128 }),
  location: varchar("location", { length: 255 }),
  clientName: varchar("client_name", { length: 255 }),
  startDate: date("start_date"),
  endDate: date("end_date"),
  budget: decimal("budget", { precision: 14, scale: 2 }),
  description: text("description"),
  status: varchar("status", { length: 32 }).notNull().default("planning"),
  lifecycleStage: varchar("lifecycle_stage", { length: 32 }).notNull().default("setup"),
  projectManagerId: int("project_manager_id"),
  setupComplete: boolean("setup_complete").notNull().default(false),
  organizationId: int("organization_id"),
  progress: int("progress").notNull().default(0),
  teamSize: int("team_size"),
  createdById: int("created_by_id"),
  ...ts(),
});

export const projectAssignmentsTable = mysqlTable("project_assignments", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("project_id").notNull(),
  userId: int("user_id").notNull(),
  role: varchar("role", { length: 64 }).notNull().default("team_member"),
  assignedAt: timestamp("assigned_at").notNull().defaultNow(),
  assignedById: int("assigned_by_id"),
  ...ts(),
});

export const tasksTable = mysqlTable("tasks", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("project_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  assignedToId: int("assigned_to_id"),
  startDate: date("start_date"),
  endDate: date("end_date"),
  priority: varchar("priority", { length: 16 }).notNull().default("medium"),
  status: varchar("status", { length: 32 }).notNull().default("todo"),
  progress: int("progress").notNull().default(0),
  parentTaskId: int("parent_task_id"),
  createdById: int("created_by_id"),
  ...ts(),
});

export const budgetItemsTable = mysqlTable("budget_items", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("project_id").notNull(),
  costCode: varchar("cost_code", { length: 64 }).notNull(),
  description: varchar("description", { length: 255 }).notNull(),
  category: varchar("category", { length: 128 }),
  budgeted: decimal("budgeted", { precision: 14, scale: 2 })
    .notNull()
    .default("0"),
  actual: decimal("actual", { precision: 14, scale: 2 })
    .notNull()
    .default("0"),
  committed: decimal("committed", { precision: 14, scale: 2 })
    .notNull()
    .default("0"),
});

export const raBillsTable = mysqlTable("ra_bills", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("project_id").notNull(),
  contractId: int("contract_id"),
  vendorId: int("vendor_id"),
  billType: varchar("bill_type", { length: 32 }).notNull().default("client"), // client (AR) vs vendor (AP)
  clientName: varchar("client_name", { length: 255 }),
  workCompletionId: int("work_completion_id"),
  billNumber: varchar("bill_number", { length: 64 }).notNull(),
  description: text("description"),
  amount: decimal("amount", { precision: 14, scale: 2 }).notNull().default("0"),
  milestone: varchar("milestone", { length: 255 }),
  billingPeriodStart: date("billing_period_start"),
  billingPeriodEnd: date("billing_period_end"),
  
  // Financial breakdown
  grossAmount: decimal("gross_amount", { precision: 14, scale: 2 }).notNull().default("0"),
  cumulativeAmount: decimal("cumulative_amount", { precision: 14, scale: 2 }).notNull().default("0"),
  retentionPercent: decimal("retention_percent", { precision: 5, scale: 2 }).notNull().default("5.00"),
  retentionAmount: decimal("retention_amount", { precision: 14, scale: 2 }).notNull().default("0"),
  advanceRecovery: decimal("advance_recovery", { precision: 14, scale: 2 }).notNull().default("0"),
  tdsPercent: decimal("tds_percent", { precision: 5, scale: 2 }).notNull().default("2.00"),
  tdsAmount: decimal("tds_amount", { precision: 14, scale: 2 }).notNull().default("0"),
  gstPercent: decimal("gst_percent", { precision: 5, scale: 2 }).notNull().default("18.00"),
  gstAmount: decimal("gst_amount", { precision: 14, scale: 2 }).notNull().default("0"),
  otherDeductions: decimal("other_deductions", { precision: 14, scale: 2 }).notNull().default("0"),
  deductionRemarks: text("deduction_remarks"),
  netPayableAmount: decimal("net_payable_amount", { precision: 14, scale: 2 }).notNull().default("0"),

  // Status & approval workflow: draft, submitted, approved, revision_requested, payment_certified, invoice_generated, closed
  status: varchar("status", { length: 32 }).notNull().default("draft"),
  documentUrl: text("document_url"),
  createdById: int("created_by_id"),
  submittedAt: timestamp("submitted_at"),
  submittedById: int("submitted_by_id"),
  approvedById: int("approved_by_id"),
  approvedAt: timestamp("approved_at"),
  approvalComments: text("approval_comments"),
  revisionRequestedById: int("revision_requested_by_id"),
  revisionRequestedAt: timestamp("revision_requested_at"),
  revisionReason: text("revision_reason"),

  // Payment Certification
  paymentCertifiedAt: timestamp("payment_certified_at"),
  paymentCertifiedById: int("payment_certified_by_id"),
  paymentCertificateNumber: varchar("payment_certificate_number", { length: 64 }),
  paymentCertificateNotes: text("payment_certificate_notes"),
  ...ts(),
});

export const expensesTable = mysqlTable("expenses", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("project_id").notNull(),
  description: varchar("description", { length: 255 }).notNull(),
  amount: decimal("amount", { precision: 14, scale: 2 }).notNull(),
  category: varchar("category", { length: 32 }).notNull(),
  expenseDate: date("expense_date").notNull(),
  receiptUrl: text("receipt_url"),
  status: varchar("status", { length: 32 }).notNull().default("draft"),
  submittedById: int("submitted_by_id"),
  approvedById: int("approved_by_id"),
  ...ts(),
});

export const invoicesTable = mysqlTable("invoices", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("project_id").notNull(),
  raBillId: int("ra_bill_id"),
  vendorId: int("vendor_id"),
  contractId: int("contract_id"),
  invoiceNumber: varchar("invoice_number", { length: 64 }).notNull(),
  clientName: varchar("client_name", { length: 255 }).notNull(),
  amount: decimal("amount", { precision: 14, scale: 2 }).notNull(),
  grossAmount: decimal("gross_amount", { precision: 14, scale: 2 }),
  deductions: decimal("deductions", { precision: 14, scale: 2 }).default("0"),
  taxAmount: decimal("tax_amount", { precision: 14, scale: 2 }).default("0"),
  netAmount: decimal("net_amount", { precision: 14, scale: 2 }),
  invoiceDate: date("invoice_date").notNull(),
  dueDate: date("due_date").notNull(),
  paymentDate: date("payment_date"),
  paymentTerms: varchar("payment_terms", { length: 255 }),
  billingPeriod: varchar("billing_period", { length: 128 }),
  bankDetails: text("bank_details"),
  deliveryStatus: varchar("delivery_status", { length: 32 }).notNull().default("pending"), // pending, sent, viewed, acknowledged
  
  sentAt: timestamp("sent_at"),
  sentById: int("sent_by_id"),
  recipientEmail: varchar("recipient_email", { length: 255 }),
  recipientNotes: text("recipient_notes"),

  totalPaidAmount: decimal("total_paid_amount", { precision: 14, scale: 2 }).notNull().default("0"),
  outstandingAmount: decimal("outstanding_amount", { precision: 14, scale: 2 }).notNull().default("0"),
  reconciliationStatus: varchar("reconciliation_status", { length: 32 }).notNull().default("pending"),
  reconciled: boolean("reconciled").notNull().default(false),
  reconciledById: int("reconciled_by_id"),
  reconciledAt: timestamp("reconciled_at"),
  reconciliationRemarks: text("reconciliation_remarks"),

  // Status: generated, sent, payment_pending, partially_paid, paid, reconciled, closed
  status: varchar("status", { length: 32 }).notNull().default("draft"),
  documentUrl: text("document_url"),
  ...ts(),
});

export const vendorInvoicesTable = mysqlTable("vendor_invoices", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("project_id").notNull(),
  vendorId: int("vendor_id").notNull(),
  contractId: int("contract_id"),
  purchaseOrderId: int("purchase_order_id"),
  vendorRaBillId: int("vendor_ra_bill_id"),
  invoiceNumber: varchar("invoice_number", { length: 64 }).notNull(),
  invoiceDate: date("invoice_date"),
  dueDate: date("due_date"),
  amount: decimal("amount", { precision: 14, scale: 2 }).notNull(),
  grossAmount: decimal("gross_amount", { precision: 14, scale: 2 }).notNull().default("0"),
  taxAmount: decimal("tax_amount", { precision: 14, scale: 2 }).notNull().default("0"),
  retentionAmount: decimal("retention_amount", { precision: 14, scale: 2 }).notNull().default("0"),
  advanceRecovery: decimal("advance_recovery", { precision: 14, scale: 2 }).notNull().default("0"),
  tdsAmount: decimal("tds_amount", { precision: 14, scale: 2 }).notNull().default("0"),
  otherDeductions: decimal("other_deductions", { precision: 14, scale: 2 }).notNull().default("0"),
  netPayableAmount: decimal("net_payable_amount", { precision: 14, scale: 2 }).notNull().default("0"),

  // AP 3-Way Matching & Validations
  poMatched: boolean("po_matched").notNull().default(false),
  measurementMatched: boolean("measurement_matched").notNull().default(false),
  quantityRateValidated: boolean("quantity_rate_validated").notNull().default(false),
  discrepancyFlag: boolean("discrepancy_flag").notNull().default(false),
  discrepancyNotes: text("discrepancy_notes"),
  clarificationNotes: text("clarification_notes"),

  // Status: vendor_ra_bill_received, under_verification, po_matched, measurement_verified, invoice_received, invoice_matched, discrepancy, vendor_clarification, pm_approved, finance_verified, payment_approved, payment_scheduled, paid, reconciled, closed
  status: varchar("status", { length: 32 }).notNull().default("received"),

  // Approvals
  pmApprovedById: int("pm_approved_by_id"),
  pmApprovedAt: timestamp("pm_approved_at"),
  pmComments: text("pm_comments"),
  financeVerifiedById: int("finance_verified_by_id"),
  financeVerifiedAt: timestamp("finance_verified_at"),
  financeComments: text("finance_comments"),
  paymentApprovedById: int("payment_approved_by_id"),
  paymentApprovedAt: timestamp("payment_approved_at"),

  // Payments & Scheduling
  paymentScheduledDate: date("payment_scheduled_date"),
  scheduledAmount: decimal("scheduled_amount", { precision: 14, scale: 2 }).notNull().default("0"),
  paymentDate: date("payment_date"),
  totalPaidAmount: decimal("total_paid_amount", { precision: 14, scale: 2 }).notNull().default("0"),
  outstandingAmount: decimal("outstanding_amount", { precision: 14, scale: 2 }).notNull().default("0"),

  // Reconciliation
  reconciled: boolean("reconciled").notNull().default(false),
  reconciledById: int("reconciled_by_id"),
  reconciledAt: timestamp("reconciled_at"),
  reconciliationRemarks: text("reconciliation_remarks"),

  documentUrl: text("document_url"),
  ...ts(),
});

export const financialInstrumentsTable = mysqlTable("financial_instruments", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("project_id"),
  instrumentType: varchar("instrument_type", { length: 32 }).notNull(),
  bgSubType: varchar("bg_sub_type", { length: 32 }),
  amount: decimal("amount", { precision: 14, scale: 2 }).notNull(),
  issueDate: date("issue_date"),
  expiryDate: date("expiry_date"),
  releaseDate: date("release_date"),
  bankName: varchar("bank_name", { length: 255 }),
  referenceNumber: varchar("reference_number", { length: 128 }),
  retentionPercent: decimal("retention_percent", { precision: 6, scale: 2 }),
  status: varchar("status", { length: 32 }).notNull().default("active"),
  notes: text("notes"),
  createdById: int("created_by_id"),
  ...ts(),
});

export const vendorsTable = mysqlTable("vendors", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  contactPerson: varchar("contact_person", { length: 255 }),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 64 }),
  address: text("address"),
  category: varchar("category", { length: 128 }),
  rating: decimal("rating", { precision: 3, scale: 1 })
    .notNull()
    .default("0"),
  status: varchar("status", { length: 16 }).notNull().default("active"),
  ...ts(),
});

export const materialRequestsTable = mysqlTable("material_requests", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("project_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  quantity: decimal("quantity", { precision: 14, scale: 2 }).notNull(),
  unit: varchar("unit", { length: 32 }).notNull(),
  status: varchar("status", { length: 32 }).notNull().default("pending"),
  createdById: int("created_by_id"),
  ...ts(),
});

export const rfqsTable = mysqlTable("rfqs", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("project_id").notNull(),
  materialRequestId: int("material_request_id"),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 32 }).notNull().default("draft"),
  createdById: int("created_by_id"),
  ...ts(),
});

export const quotationsTable = mysqlTable("quotations", {
  id: int("id").autoincrement().primaryKey(),
  rfqId: int("rfq_id").notNull(),
  vendorId: int("vendor_id").notNull(),
  amount: decimal("amount", { precision: 14, scale: 2 }).notNull(),
  deliveryDays: int("delivery_days").notNull(),
  notes: text("notes"),
  isSelected: boolean("is_selected").notNull().default(false),
  ...ts(),
});

export const purchaseOrdersTable = mysqlTable("purchase_orders", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("project_id").notNull(),
  vendorId: int("vendor_id").notNull(),
  poNumber: varchar("po_number", { length: 64 }).notNull(),
  description: text("description"),
  totalAmount: decimal("total_amount", { precision: 14, scale: 2 }).notNull(),
  deliveryDate: date("delivery_date"),
  status: varchar("status", { length: 32 }).notNull().default("draft"),
  inspectionStatus: varchar("inspection_status", { length: 16 })
    .notNull()
    .default("pending"),
  createdById: int("created_by_id"),
  ...ts(),
});

export const materialsTable = mysqlTable("materials", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("project_id"),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  unit: varchar("unit", { length: 32 }).notNull(),
  quantityOnHand: decimal("quantity_on_hand", { precision: 14, scale: 2 })
    .notNull()
    .default("0"),
  quantityCommitted: decimal("quantity_committed", { precision: 14, scale: 2 })
    .notNull()
    .default("0"),
  quantityConsumed: decimal("quantity_consumed", { precision: 14, scale: 2 })
    .notNull()
    .default("0"),
  minimumStock: decimal("minimum_stock", { precision: 14, scale: 2 })
    .notNull()
    .default("0"),
});

export const stakeholdersTable = mysqlTable("stakeholders", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("project_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 64 }),
  organization: varchar("organization", { length: 255 }),
  role: varchar("role", { length: 128 }),
  accessLevel: varchar("access_level", { length: 16 })
    .notNull()
    .default("read"),
});

export const communicationsTable = mysqlTable("communications", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("project_id"),
  stakeholderId: int("stakeholder_id"),
  communicationType: varchar("communication_type", { length: 16 }).notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  content: text("content"),
  communicationDate: timestamp("communication_date")
    .notNull(),
  participants: text("participants"),
  createdById: int("created_by_id"),
  ...ts(),
});

export const meetingsTable = mysqlTable("meetings", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("project_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  meetingDate: timestamp("meeting_date").notNull(),
  duration: int("duration").notNull().default(60),
  location: varchar("location", { length: 255 }),
  agenda: text("agenda"),
  minutes: text("minutes"),
  participants: text("participants"),
  createdById: int("created_by_id"),
  ...ts(),
});

export const documentsTable = mysqlTable("documents", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("project_id").notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileType: varchar("file_type", { length: 64 }),
  fileSize: int("file_size"),
  fileUrl: text("file_url"),
  category: varchar("category", { length: 32 }).notNull().default("general"),
  version: int("version").notNull().default(1),
  status: varchar("status", { length: 16 }).notNull().default("active"),
  uploadedById: int("uploaded_by_id"),
  uploadedAt: timestamp("uploaded_at")
    .notNull()
    .defaultNow(),
});

export const punchListItemsTable = mysqlTable("punch_list_items", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("project_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 64 }).notNull().default("general"),
  priority: varchar("priority", { length: 16 }).notNull().default("medium"),
  status: varchar("status", { length: 32 }).notNull().default("open"),
  assignedToId: int("assigned_to_id"),
  dueDate: date("due_date"),
  resolvedAt: timestamp("resolved_at"),
  resolvedById: int("resolved_by_id"),
  createdById: int("created_by_id"),
  photos: json("photos").notNull().default([]),
  ...ts(),
});

export const punchListItemCommentsTable = mysqlTable("punch_list_item_comments", {
  id: int("id").autoincrement().primaryKey(),
  punchListItemId: int("punch_list_item_id").notNull(),
  authorName: varchar("author_name", { length: 255 }).notNull(),
  text: text("text").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const notificationsTable = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id"),
  notificationType: varchar("notification_type", { length: 64 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message"),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at")
    .notNull()
    .defaultNow(),
});

export const taskTemplatesTable = mysqlTable("task_templates", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  projectType: varchar("project_type", { length: 128 }),
  isDefault: boolean("is_default").notNull().default(false),
  createdById: int("created_by_id"),
  ...ts(),
});

export const taskTemplateItemsTable = mysqlTable("task_template_items", {
  id: int("id").autoincrement().primaryKey(),
  templateId: int("template_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  phase: varchar("phase", { length: 128 }),
  priority: varchar("priority", { length: 16 }).notNull().default("medium"),
  estimatedDays: int("estimated_days"),
  sortOrder: int("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const notificationPreferencesTable = mysqlTable("notification_preferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().unique(),
  preferences: json("preferences").notNull().default({}),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const emailLogsTable = mysqlTable("email_logs", {
  id: int("id").autoincrement().primaryKey(),
  recipientEmail: varchar("recipient_email", { length: 255 }).notNull(),
  recipientName: varchar("recipient_name", { length: 255 }),
  userId: int("user_id"),
  eventType: varchar("event_type", { length: 64 }).notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  status: varchar("status", { length: 32 }).notNull().default("delivered"),
  bodyPreview: text("body_preview"),
  bodyHtml: mediumtext("body_html"),
  metadata: json("metadata"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const companySettingsTable = mysqlTable("company_settings", {
  id: int("id").autoincrement().primaryKey(),
  companyName: varchar("company_name", { length: 255 }).notNull().default(""),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 100 }),
  country: varchar("country", { length: 100 }).default("India"),
  pincode: varchar("pincode", { length: 20 }),
  currency: varchar("currency", { length: 10 }).notNull().default("INR"),
  gstNumber: varchar("gst_number", { length: 50 }),
  panNumber: varchar("pan_number", { length: 50 }),
  phone: varchar("phone", { length: 30 }),
  email: varchar("email", { length: 255 }),
  website: varchar("website", { length: 255 }),
  logoUrl: text("logo_url"),
  bankName: varchar("bank_name", { length: 255 }),
  accountNumber: varchar("account_number", { length: 100 }),
  ifscCode: varchar("ifsc_code", { length: 50 }),
  branchName: varchar("branch_name", { length: 255 }),
  authorizedSignatory: varchar("authorized_signatory", { length: 255 }),
  signatoryTitle: varchar("signatory_title", { length: 100 }),
  invoiceTerms: text("invoice_terms"),
  invoiceFooter: text("invoice_footer"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const auditLogsTable = mysqlTable("audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id"),
  activity: varchar("activity", { length: 255 }).notNull(),
  resourceType: varchar("resource_type", { length: 64 }).notNull(),
  resourceId: int("resource_id"),
  ipAddress: varchar("ip_address", { length: 64 }),
  status: varchar("status", { length: 32 }).notNull().default("success"),
  metadata: text("metadata"),
  createdAt: timestamp("created_at")
    .notNull()
    .defaultNow(),
});

// ═══════════════════════════════════════════════════════════════════════════
// ROLE SWITCH REQUESTS - Only Project Managers Can Approve/Reject
// ═══════════════════════════════════════════════════════════════════════════

export const roleSwitchRequestsTable = mysqlTable("role_switch_requests", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  currentRole: varchar("current_role", { length: 50 }).notNull(),
  requestedRole: varchar("requested_role", { length: 50 }).notNull(),
  reason: text("reason"),
  status: varchar("status", { length: 32 }).notNull().default("pending"), // pending, approved, rejected
  requestedAt: timestamp("requested_at").notNull().defaultNow(),
  reviewedById: int("reviewed_by_id"),
  reviewedAt: timestamp("reviewed_at"),
  reviewComments: text("review_comments"),
  ...ts(),
});

// ═══════════════════════════════════════════════════════════════════════════
// PROCUREMENT & INVENTORY LIFECYCLE MODULE
// ═══════════════════════════════════════════════════════════════════════════

// Material Requests - Requisition & Approval Stage
export const procurementMaterialRequestsTable = mysqlTable("procurement_material_requests", {
  id: int("id").autoincrement().primaryKey(),
  requestNumber: varchar("request_number", { length: 64 }).notNull().unique(),
  projectId: int("project_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 128 }).notNull(), // civil, mechanical, electrical, etc.
  priority: varchar("priority", { length: 16 }).notNull().default("medium"), // low, medium, high, urgent
  requiredDate: date("required_date").notNull(),
  submittedAt: timestamp("submitted_at"),
  
  // Status workflow
  status: varchar("status", { length: 32 }).notNull().default("draft"), 
  // draft → pending_manager_approval → approved → rfq_generated → completed | rejected
  
  // Approval tracking
  requestedById: int("requested_by_id").notNull(),
  assignedManagerId: int("assigned_manager_id"),
  approvedById: int("approved_by_id"),
  rejectedById: int("rejected_by_id"),
  approvalDate: timestamp("approval_date"),
  approvalComments: text("approval_comments"),
  rejectionDate: timestamp("rejection_date"),
  rejectionReason: text("rejection_reason"),
  
  // Metadata
  estimatedCost: decimal("estimated_cost", { precision: 14, scale: 2 }),
  notes: text("notes"),
  ...ts(),
});

// Material Request Items - Line items for each request
export const procurementMaterialRequestItemsTable = mysqlTable("procurement_material_request_items", {
  id: int("id").autoincrement().primaryKey(),
  materialRequestId: int("material_request_id").notNull(),
  itemName: varchar("item_name", { length: 255 }).notNull(),
  description: text("description"),
  specification: text("specification"),
  quantity: decimal("quantity", { precision: 14, scale: 2 }).notNull(),
  unit: varchar("unit", { length: 32 }).notNull(), // kg, ton, pieces, sqft, etc.
  estimatedUnitPrice: decimal("estimated_unit_price", { precision: 14, scale: 2 }),
  estimatedTotal: decimal("estimated_total", { precision: 14, scale: 2 }),
  sortOrder: int("sort_order").notNull().default(0),
});

// Material Request Approval History
export const materialRequestApprovalHistoryTable = mysqlTable("material_request_approval_history", {
  id: int("id").autoincrement().primaryKey(),
  materialRequestId: int("material_request_id").notNull(),
  managerId: int("manager_id").notNull(),
  action: varchar("action", { length: 32 }).notNull(), // APPROVED, REJECTED
  comments: text("comments"),
  actionDate: timestamp("action_date").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// RFQs - Request for Quotation
export const procurementRfqsTable = mysqlTable("procurement_rfqs", {
  id: int("id").autoincrement().primaryKey(),
  rfqNumber: varchar("rfq_number", { length: 64 }).notNull().unique(),
  materialRequestId: int("material_request_id"),
  projectId: int("project_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  
  // Status workflow
  status: varchar("status", { length: 32 }).notNull().default("draft"),
  // draft → sent → receiving_quotes → quotes_received → evaluated → completed | cancelled
  
  // Dates
  issueDate: date("issue_date"),
  dueDate: date("due_date").notNull(),
  closedDate: date("closed_date"),
  
  // Tracking
  sentToVendorCount: int("sent_to_vendor_count").notNull().default(0),
  quotesReceivedCount: int("quotes_received_count").notNull().default(0),
  selectedQuoteId: int("selected_quote_id"),
  
  createdById: int("created_by_id").notNull(),
  notes: text("notes"),
  ...ts(),
});

// RFQ Items - Line items copied from material request
export const procurementRfqItemsTable = mysqlTable("procurement_rfq_items", {
  id: int("id").autoincrement().primaryKey(),
  rfqId: int("rfq_id").notNull(),
  itemName: varchar("item_name", { length: 255 }).notNull(),
  description: text("description"),
  specification: text("specification"),
  quantity: decimal("quantity", { precision: 14, scale: 2 }).notNull(),
  unit: varchar("unit", { length: 32 }).notNull(),
  sortOrder: int("sort_order").notNull().default(0),
});

// RFQ Vendors - Track which vendors received this RFQ
export const procurementRfqVendorsTable = mysqlTable("procurement_rfq_vendors", {
  id: int("id").autoincrement().primaryKey(),
  rfqId: int("rfq_id").notNull(),
  vendorId: int("vendor_id").notNull(),
  sentDate: timestamp("sent_date"),
  respondedDate: timestamp("responded_date"),
  status: varchar("status", { length: 32 }).notNull().default("sent"), // sent, responded, declined, no_response
});

// Vendor Quotes - Sourcing & Vendor Evaluation Stage
export const procurementVendorQuotesTable = mysqlTable("procurement_vendor_quotes", {
  id: int("id").autoincrement().primaryKey(),
  quoteNumber: varchar("quote_number", { length: 64 }).notNull().unique(),
  rfqId: int("rfq_id").notNull(),
  vendorId: int("vendor_id").notNull(),
  
  // Quote details
  quotedDate: date("quoted_date").notNull(),
  validUntil: date("valid_until"),
  deliveryDays: int("delivery_days").notNull(),
  deliveryTerms: text("delivery_terms"),
  paymentTerms: text("payment_terms"),
  
  // Pricing
  subtotal: decimal("subtotal", { precision: 14, scale: 2 }).notNull(),
  taxPercent: decimal("tax_percent", { precision: 6, scale: 2 }).notNull().default("0"),
  taxAmount: decimal("tax_amount", { precision: 14, scale: 2 }).notNull().default("0"),
  shippingCost: decimal("shipping_cost", { precision: 14, scale: 2 }).notNull().default("0"),
  totalAmount: decimal("total_amount", { precision: 14, scale: 2 }).notNull(),
  
  // Selection
  isSelected: boolean("is_selected").notNull().default(false),
  selectionReason: text("selection_reason"),
  selectedById: int("selected_by_id"),
  selectedDate: timestamp("selected_date"),
  
  // Status
  status: varchar("status", { length: 32 }).notNull().default("submitted"), // submitted, under_review, selected, rejected
  
  notes: text("notes"),
  attachmentUrl: text("attachment_url"),
  ...ts(),
});

// Vendor Quote Items - Line item prices from vendor
export const procurementVendorQuoteItemsTable = mysqlTable("procurement_vendor_quote_items", {
  id: int("id").autoincrement().primaryKey(),
  quoteId: int("quote_id").notNull(),
  rfqItemId: int("rfq_item_id"),
  itemName: varchar("item_name", { length: 255 }).notNull(),
  quantity: decimal("quantity", { precision: 14, scale: 2 }).notNull(),
  unit: varchar("unit", { length: 32 }).notNull(),
  unitPrice: decimal("unit_price", { precision: 14, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 14, scale: 2 }).notNull(),
  remarks: text("remarks"),
  sortOrder: int("sort_order").notNull().default(0),
});

// Purchase Orders - PO & Tracking Stage
export const procurementPurchaseOrdersTable = mysqlTable("procurement_purchase_orders", {
  id: int("id").autoincrement().primaryKey(),
  poNumber: varchar("po_number", { length: 64 }).notNull().unique(),
  rfqId: int("rfq_id"),
  quoteId: int("quote_id"),
  materialRequestId: int("material_request_id"),
  projectId: int("project_id").notNull(),
  vendorId: int("vendor_id").notNull(),
  
  // PO Details
  poDate: date("po_date").notNull(),
  expectedDeliveryDate: date("expected_delivery_date"),
  actualDeliveryDate: date("actual_delivery_date"),
  
  // Pricing (copied from quote)
  subtotal: decimal("subtotal", { precision: 14, scale: 2 }).notNull(),
  taxAmount: decimal("tax_amount", { precision: 14, scale: 2 }).notNull().default("0"),
  shippingCost: decimal("shipping_cost", { precision: 14, scale: 2 }).notNull().default("0"),
  totalAmount: decimal("total_amount", { precision: 14, scale: 2 }).notNull(),
  
  // Terms
  deliveryTerms: text("delivery_terms"),
  paymentTerms: text("payment_terms"),
  
  // Status workflow
  status: varchar("status", { length: 32 }).notNull().default("draft"),
  // draft → issued → acknowledged → in_transit → delivered → inspected → completed | cancelled
  
  // Vendor acknowledgment
  isAcknowledged: boolean("is_acknowledged").notNull().default(false),
  acknowledgmentDate: timestamp("acknowledgment_date"),
  acknowledgmentNotes: text("acknowledgment_notes"),
  
  // Delivery tracking
  deliveryStatus: varchar("delivery_status", { length: 32 }).notNull().default("pending"),
  // pending → in_transit → delivered → delayed
  trackingNumber: varchar("tracking_number", { length: 128 }),
  
  // Follow-ups
  followUpCount: int("follow_up_count").notNull().default(0),
  lastFollowUpDate: timestamp("last_follow_up_date"),
  
  createdById: int("created_by_id").notNull(),
  approvedById: int("approved_by_id"),
  notes: text("notes"),
  ...ts(),
});

// Purchase Order Items
export const procurementPurchaseOrderItemsTable = mysqlTable("procurement_purchase_order_items", {
  id: int("id").autoincrement().primaryKey(),
  poId: int("po_id").notNull(),
  itemName: varchar("item_name", { length: 255 }).notNull(),
  description: text("description"),
  specification: text("specification"),
  quantity: decimal("quantity", { precision: 14, scale: 2 }).notNull(),
  unit: varchar("unit", { length: 32 }).notNull(),
  unitPrice: decimal("unit_price", { precision: 14, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 14, scale: 2 }).notNull(),
  receivedQuantity: decimal("received_quantity", { precision: 14, scale: 2 }).notNull().default("0"),
  acceptedQuantity: decimal("accepted_quantity", { precision: 14, scale: 2 }).notNull().default("0"),
  rejectedQuantity: decimal("rejected_quantity", { precision: 14, scale: 2 }).notNull().default("0"),
  sortOrder: int("sort_order").notNull().default(0),
});

// Material Receipt - Goods Received Note
export const procurementMaterialReceiptsTable = mysqlTable("procurement_material_receipts", {
  id: int("id").autoincrement().primaryKey(),
  receiptNumber: varchar("receipt_number", { length: 64 }).notNull().unique(),
  poId: int("po_id").notNull(),
  projectId: int("project_id").notNull(),
  vendorId: int("vendor_id").notNull(),
  
  receivedDate: timestamp("received_date").notNull().defaultNow(),
  receivedById: int("received_by_id").notNull(),
  
  // Delivery details
  deliveryNoteNumber: varchar("delivery_note_number", { length: 64 }),
  vehicleNumber: varchar("vehicle_number", { length: 64 }),
  driverName: varchar("driver_name", { length: 255 }),
  driverContact: varchar("driver_contact", { length: 64 }),
  
  remarks: text("remarks"),
  attachmentUrls: json("attachment_urls").notNull().default([]), // photos of delivery
  ...ts(),
});

// Material Receipt Items
export const procurementMaterialReceiptItemsTable = mysqlTable("procurement_material_receipt_items", {
  id: int("id").autoincrement().primaryKey(),
  receiptId: int("receipt_id").notNull(),
  poItemId: int("po_item_id").notNull(),
  receivedQuantity: decimal("received_quantity", { precision: 14, scale: 2 }).notNull(),
  remarks: text("remarks"),
});

// Quality Inspection - QC & Inventory Entry Stage
export const procurementQualityInspectionsTable = mysqlTable("procurement_quality_inspections", {
  id: int("id").autoincrement().primaryKey(),
  inspectionNumber: varchar("inspection_number", { length: 64 }).notNull().unique(),
  receiptId: int("receipt_id").notNull(),
  poId: int("po_id").notNull(),
  projectId: int("project_id").notNull(),
  
  // Inspection details
  inspectionDate: timestamp("inspection_date").notNull().defaultNow(),
  inspectedById: int("inspected_by_id").notNull(),
  inspectorName: varchar("inspector_name", { length: 255 }).notNull(),
  
  // Result
  result: varchar("result", { length: 32 }).notNull().default("pending"),
  // pending → approved → rejected → partial_approved
  
  // Findings
  findings: text("findings"),
  defectsFound: text("defects_found"),
  recommendations: text("recommendations"),
  
  // Photos
  photoUrls: json("photo_urls").notNull().default([]),
  
  // Decision tracking
  approvedById: int("approved_by_id"),
  approvalDate: timestamp("approval_date"),
  rejectionReason: text("rejection_reason"),
  
  ...ts(),
});

// Quality Inspection Items
export const procurementQualityInspectionItemsTable = mysqlTable("procurement_quality_inspection_items", {
  id: int("id").autoincrement().primaryKey(),
  inspectionId: int("inspection_id").notNull(),
  receiptItemId: int("receipt_item_id").notNull(),
  poItemId: int("po_item_id").notNull(),
  
  itemName: varchar("item_name", { length: 255 }).notNull(),
  receivedQuantity: decimal("received_quantity", { precision: 14, scale: 2 }).notNull(),
  
  // Inspection result
  status: varchar("status", { length: 32 }).notNull().default("pending"),
  // pending → approved → rejected
  
  acceptedQuantity: decimal("accepted_quantity", { precision: 14, scale: 2 }).notNull().default("0"),
  rejectedQuantity: decimal("rejected_quantity", { precision: 14, scale: 2 }).notNull().default("0"),
  
  // Quality checks
  qualityGrade: varchar("quality_grade", { length: 16 }), // A, B, C, Rejected
  defectDescription: text("defect_description"),
  remarks: text("remarks"),
  
  sortOrder: int("sort_order").notNull().default(0),
});

// Inventory Items - Final storage after approval
export const procurementInventoryItemsTable = mysqlTable("procurement_inventory_items", {
  id: int("id").autoincrement().primaryKey(),
  itemCode: varchar("item_code", { length: 64 }).notNull().unique(),
  projectId: int("project_id"),
  
  // Item details
  itemName: varchar("item_name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 128 }).notNull(),
  unit: varchar("unit", { length: 32 }).notNull(),
  
  // Quantities
  totalQuantity: decimal("total_quantity", { precision: 14, scale: 2 }).notNull().default("0"),
  availableQuantity: decimal("available_quantity", { precision: 14, scale: 2 }).notNull().default("0"),
  allocatedQuantity: decimal("allocated_quantity", { precision: 14, scale: 2 }).notNull().default("0"),
  consumedQuantity: decimal("consumed_quantity", { precision: 14, scale: 2 }).notNull().default("0"),
  
  // Stock levels
  minimumStock: decimal("minimum_stock", { precision: 14, scale: 2 }).notNull().default("0"),
  reorderLevel: decimal("reorder_level", { precision: 14, scale: 2 }).notNull().default("0"),
  
  // Costing
  averageCost: decimal("average_cost", { precision: 14, scale: 2 }).notNull().default("0"),
  lastPurchasePrice: decimal("last_purchase_price", { precision: 14, scale: 2 }),
  lastPurchaseDate: date("last_purchase_date"),
  
  // Location
  warehouseLocation: varchar("warehouse_location", { length: 255 }),
  
  // Status
  status: varchar("status", { length: 32 }).notNull().default("active"), // active, low_stock, out_of_stock, discontinued
  
  ...ts(),
});

// Inventory Transactions - All movements in/out
export const procurementInventoryTransactionsTable = mysqlTable("procurement_inventory_transactions", {
  id: int("id").autoincrement().primaryKey(),
  transactionNumber: varchar("transaction_number", { length: 64 }).notNull().unique(),
  inventoryItemId: int("inventory_item_id").notNull(),
  projectId: int("project_id"),
  
  // Transaction details
  transactionType: varchar("transaction_type", { length: 32 }).notNull(),
  // goods_receipt, issue_to_project, return_from_project, adjustment, rejection
  
  transactionDate: timestamp("transaction_date").notNull().defaultNow(),
  
  // Quantities
  quantity: decimal("quantity", { precision: 14, scale: 2 }).notNull(),
  unitPrice: decimal("unit_price", { precision: 14, scale: 2 }),
  totalValue: decimal("total_value", { precision: 14, scale: 2 }),
  
  // Balance after transaction
  balanceQuantity: decimal("balance_quantity", { precision: 14, scale: 2 }).notNull(),
  
  // References
  poId: int("po_id"),
  inspectionId: int("inspection_id"),
  taskId: int("task_id"),
  
  // Details
  remarks: text("remarks"),
  createdById: int("created_by_id").notNull(),
  
  ...ts(),
});

// Vendor Follow-ups - Automated tracking
export const procurementVendorFollowUpsTable = mysqlTable("procurement_vendor_follow_ups", {
  id: int("id").autoincrement().primaryKey(),
  poId: int("po_id").notNull(),
  vendorId: int("vendor_id").notNull(),
  
  followUpDate: timestamp("follow_up_date").notNull().defaultNow(),
  followUpType: varchar("follow_up_type", { length: 32 }).notNull(), // email, phone, automated
  followUpReason: varchar("follow_up_reason", { length: 64 }).notNull(), // delayed_delivery, no_acknowledgment, quality_issue
  
  message: text("message"),
  response: text("response"),
  responseDate: timestamp("response_date"),
  
  followUpById: int("follow_up_by_id"),
  status: varchar("status", { length: 32 }).notNull().default("sent"), // sent, responded, no_response
  
  ...ts(),
});

// Procurement Notifications - Workflow notifications
export const procurementNotificationsTable = mysqlTable("procurement_notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  notificationType: varchar("notification_type", { length: 64 }).notNull(),
  // material_request_approved, material_request_rejected, rfq_created, quote_received, 
  // po_issued, material_delivered, inspection_completed, quality_rejected
  
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message"),
  
  // References
  resourceType: varchar("resource_type", { length: 64 }).notNull(),
  resourceId: int("resource_id").notNull(),
  
  isRead: boolean("is_read").notNull().default(false),
  readAt: timestamp("read_at"),
  
  priority: varchar("priority", { length: 16 }).notNull().default("normal"), // low, normal, high, urgent
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ==========================================
// RA BILL & VENDOR PAYMENT WORKFLOW SCHEMAS
// ==========================================

// Contracts / Work Orders for Vendors
export const contractsTable = mysqlTable("contracts", {
  id: int("id").autoincrement().primaryKey(),
  contractNumber: varchar("contract_number", { length: 64 }).notNull().unique(),
  contractType: varchar("contract_type", { length: 32 }).notNull().default("vendor"), // client, vendor
  projectId: int("project_id").notNull(),
  vendorId: int("vendor_id"),
  clientName: varchar("client_name", { length: 255 }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  totalAmount: decimal("total_amount", { precision: 14, scale: 2 }).notNull().default("0"),
  retentionPercent: decimal("retention_percent", { precision: 5, scale: 2 }).notNull().default("5.00"),
  advancePercent: decimal("advance_percent", { precision: 5, scale: 2 }).notNull().default("0.00"),
  abgRequired: boolean("abg_required").default(false),
  abgPercent: decimal("abg_percent", { precision: 5, scale: 2 }).default("0.00"),
  abgAmount: decimal("abg_amount", { precision: 14, scale: 2 }).default("0.00"),
  paymentTermsDays: int("payment_terms_days").default(30),
  dlpMonths: int("dlp_months").default(12),
  commercialTermsNotes: text("commercial_terms_notes"),
  tdsPercent: decimal("tds_percent", { precision: 5, scale: 2 }).notNull().default("2.00"),
  gstPercent: decimal("gst_percent", { precision: 5, scale: 2 }).notNull().default("18.00"),
  startDate: date("start_date"),
  endDate: date("end_date"),
  status: varchar("status", { length: 32 }).notNull().default("active"), // draft, active, completed, terminated
  createdById: int("created_by_id"),
  ...ts(),
});

// Milestone-to-Billing Schedule (Direct Mapping from Milestones to Contract Billing %)
export const billingMilestonesTable = mysqlTable("billing_milestones", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("project_id").notNull(),
  contractId: int("contract_id"),
  milestoneNumber: varchar("milestone_number", { length: 64 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  stage: varchar("stage", { length: 64 }).notNull().default("general"), // mobilization, substructure, superstructure, mep, finishes, handover
  billingPercent: decimal("billing_percent", { precision: 5, scale: 2 }).notNull().default("0.00"),
  expectedAmount: decimal("expected_amount", { precision: 14, scale: 2 }).notNull().default("0.00"),
  targetDate: date("target_date"),
  completionDate: date("completion_date"),
  status: varchar("status", { length: 32 }).notNull().default("pending"), // pending, ready_to_bill, billed, paid
  raBillId: int("ra_bill_id"),
  billedAmount: decimal("billed_amount", { precision: 14, scale: 2 }).notNull().default("0.00"),
  sortOrder: int("sort_order").notNull().default(0),
  ...ts(),
});

// BOQ Items linked to a Contract
export const contractBoqItemsTable = mysqlTable("contract_boq_items", {
  id: int("id").autoincrement().primaryKey(),
  contractId: int("contract_id").notNull(),
  itemNumber: varchar("item_number", { length: 64 }),
  description: text("description").notNull(),
  unit: varchar("unit", { length: 32 }).notNull().default("nos"),
  quantity: decimal("quantity", { precision: 14, scale: 3 }).notNull(),
  rate: decimal("rate", { precision: 14, scale: 2 }).notNull(),
  totalAmount: decimal("total_amount", { precision: 14, scale: 2 }).notNull(),
  cumulativeCompletedQty: decimal("cumulative_completed_qty", { precision: 14, scale: 3 }).notNull().default("0"),
  cumulativeBilledQty: decimal("cumulative_billed_qty", { precision: 14, scale: 3 }).notNull().default("0"),
  sortOrder: int("sort_order").notNull().default(0),
  ...ts(),
});

// Work Completion Verification Records
export const workCompletionsTable = mysqlTable("work_completions", {
  id: int("id").autoincrement().primaryKey(),
  workCompletionNumber: varchar("work_completion_number", { length: 64 }).notNull().unique(),
  projectId: int("project_id").notNull(),
  contractId: int("contract_id").notNull(),
  vendorId: int("vendor_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  milestone: varchar("milestone", { length: 255 }),
  completionDate: date("completion_date").notNull(),
  remarks: text("remarks"),
  status: varchar("status", { length: 32 }).notNull().default("draft"), // draft, submitted, verified, correction_required
  submittedAt: timestamp("submitted_at"),
  verifiedById: int("verified_by_id"),
  verifiedAt: timestamp("verified_at"),
  correctionReason: text("correction_reason"),
  createdById: int("created_by_id"),
  ...ts(),
});

// Work Completion Line Items
export const workCompletionItemsTable = mysqlTable("work_completion_items", {
  id: int("id").autoincrement().primaryKey(),
  workCompletionId: int("work_completion_id").notNull(),
  contractBoqItemId: int("contract_boq_item_id").notNull(),
  description: text("description").notNull(),
  unit: varchar("unit", { length: 32 }).notNull(),
  rate: decimal("rate", { precision: 14, scale: 2 }).notNull(),
  previousCompletedQty: decimal("previous_completed_qty", { precision: 14, scale: 3 }).notNull().default("0"),
  currentCompletedQty: decimal("current_completed_qty", { precision: 14, scale: 3 }).notNull().default("0"),
  cumulativeQty: decimal("cumulative_qty", { precision: 14, scale: 3 }).notNull().default("0"),
  currentAmount: decimal("current_amount", { precision: 14, scale: 2 }).notNull().default("0"),
  remarks: text("remarks"),
  sortOrder: int("sort_order").notNull().default(0),
  ...ts(),
});

// Work Completion Supporting Documents
export const workCompletionDocumentsTable = mysqlTable("work_completion_documents", {
  id: int("id").autoincrement().primaryKey(),
  workCompletionId: int("work_completion_id").notNull(),
  documentType: varchar("document_type", { length: 64 }).notNull(), // site_photo, test_report, measurement_sheet, jmr, other
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileUrl: text("file_url").notNull(),
  fileSize: int("file_size"),
  uploadedById: int("uploaded_by_id"),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
});

// RA Bill Line Items (Abstract & Measurement details)
export const raBillItemsTable = mysqlTable("ra_bill_items", {
  id: int("id").autoincrement().primaryKey(),
  raBillId: int("ra_bill_id").notNull(),
  contractBoqItemId: int("contract_boq_item_id").notNull(),
  description: text("description").notNull(),
  unit: varchar("unit", { length: 32 }).notNull(),
  rate: decimal("rate", { precision: 14, scale: 2 }).notNull(),
  contractQuantity: decimal("contract_quantity", { precision: 14, scale: 3 }).notNull(),
  previousBilledQty: decimal("previous_billed_qty", { precision: 14, scale: 3 }).notNull().default("0"),
  currentBilledQty: decimal("current_billed_qty", { precision: 14, scale: 3 }).notNull().default("0"),
  cumulativeBilledQty: decimal("cumulative_billed_qty", { precision: 14, scale: 3 }).notNull().default("0"),
  previousAmount: decimal("previous_amount", { precision: 14, scale: 2 }).notNull().default("0"),
  currentAmount: decimal("current_amount", { precision: 14, scale: 2 }).notNull().default("0"),
  cumulativeAmount: decimal("cumulative_amount", { precision: 14, scale: 2 }).notNull().default("0"),
  sortOrder: int("sort_order").notNull().default(0),
  ...ts(),
});

// RA Bill Supporting Documents
export const raBillDocumentsTable = mysqlTable("ra_bill_documents", {
  id: int("id").autoincrement().primaryKey(),
  raBillId: int("ra_bill_id").notNull(),
  documentType: varchar("document_type", { length: 64 }).notNull(), // measurement_sheet, abstract_sheet, joint_inspection, invoice_copy, tax_invoice, other
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileUrl: text("file_url").notNull(),
  fileSize: int("file_size"),
  uploadedById: int("uploaded_by_id"),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
});

// RA Bill Approval History & Audit Trail
export const raBillApprovalHistoryTable = mysqlTable("ra_bill_approval_history", {
  id: int("id").autoincrement().primaryKey(),
  raBillId: int("ra_bill_id").notNull(),
  action: varchar("action", { length: 64 }).notNull(), // created, submitted, approved, revision_requested, invoice_generated
  userId: int("user_id").notNull(),
  previousStatus: varchar("previous_status", { length: 32 }),
  newStatus: varchar("new_status", { length: 32 }).notNull(),
  comments: text("comments"),
  actionDate: timestamp("action_date").notNull().defaultNow(),
});

// Payments made against Invoices (Full, Partial, Advances)
export const invoicePaymentsTable = mysqlTable("invoice_payments", {
  id: int("id").autoincrement().primaryKey(),
  invoiceId: int("invoice_id").notNull(),
  raBillId: int("ra_bill_id"),
  paymentNumber: varchar("payment_number", { length: 64 }).notNull(),
  paymentDate: date("payment_date").notNull(),
  paymentAmount: decimal("payment_amount", { precision: 14, scale: 2 }).notNull(),
  paymentMode: varchar("payment_mode", { length: 32 }).notNull(), // bank_transfer, neft_rtgs, cheque, upi, credit_card, other
  bankReference: varchar("bank_reference", { length: 128 }),
  transactionId: varchar("transaction_id", { length: 128 }),
  remarks: text("remarks"),
  documentUrl: text("document_url"),
  recordedById: int("recorded_by_id").notNull(),
  ...ts(),
});

// Payment Follow-ups and Reminders
export const paymentRemindersTable = mysqlTable("payment_reminders", {
  id: int("id").autoincrement().primaryKey(),
  invoiceId: int("invoice_id").notNull(),
  reminderDate: timestamp("reminder_date").notNull().defaultNow(),
  reminderType: varchar("reminder_type", { length: 32 }).notNull(), // email, call, letter, system
  subject: varchar("subject", { length: 255 }),
  message: text("message").notNull(),
  recipient: varchar("recipient", { length: 255 }),
  followUpRemarks: text("follow_up_remarks"),
  sentById: int("sent_by_id").notNull(),
  ...ts(),
});

// Vendor Payments (AP Payments - Money direction: Our Bank -> Vendor)
export const vendorPaymentsTable = mysqlTable("vendor_payments", {
  id: int("id").autoincrement().primaryKey(),
  vendorInvoiceId: int("vendor_invoice_id").notNull(),
  vendorId: int("vendor_id").notNull(),
  projectId: int("project_id").notNull(),
  vendorRaBillId: int("vendor_ra_bill_id"),
  paymentNumber: varchar("payment_number", { length: 64 }).notNull(),
  paymentDate: date("payment_date").notNull(),
  paymentAmount: decimal("payment_amount", { precision: 14, scale: 2 }).notNull(),
  paymentMode: varchar("payment_mode", { length: 32 }).notNull().default("neft_rtgs"), // neft_rtgs, bank_transfer, cheque, upi, other
  bankReference: varchar("bank_reference", { length: 128 }),
  transactionId: varchar("transaction_id", { length: 128 }),
  fromBankAccount: varchar("from_bank_account", { length: 128 }),
  vendorBankDetails: text("vendor_bank_details"),
  remarks: text("remarks"),
  documentUrl: text("document_url"),
  recordedById: int("recorded_by_id").notNull(),
  ...ts(),
});

// AP Discrepancies Table (Mismatch tracking between Vendor Invoice, PO & Verified Measurement)
export const apDiscrepanciesTable = mysqlTable("ap_discrepancies", {
  id: int("id").autoincrement().primaryKey(),
  vendorInvoiceId: int("vendor_invoice_id").notNull(),
  vendorId: int("vendor_id").notNull(),
  discrepancyType: varchar("discrepancy_type", { length: 64 }).notNull(), // quantity_mismatch, rate_mismatch, tax_mismatch, duplicate_billing, unverified_work, other
  description: text("description").notNull(),
  claimedAmount: decimal("claimed_amount", { precision: 14, scale: 2 }).notNull(),
  verifiedAmount: decimal("verified_amount", { precision: 14, scale: 2 }).notNull(),
  differenceAmount: decimal("difference_amount", { precision: 14, scale: 2 }).notNull(),
  status: varchar("status", { length: 32 }).notNull().default("open"), // open, under_clarification, resolved, rejected
  resolutionNotes: text("resolution_notes"),
  raisedById: int("raised_by_id").notNull(),
  resolvedById: int("resolved_by_id"),
  resolvedAt: timestamp("resolved_at"),
  ...ts(),
});

// Financial Audit Logs (Unified audit tracking for AR and AP workflows)
export const financialAuditLogsTable = mysqlTable("financial_audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  workflowType: varchar("workflow_type", { length: 16 }).notNull(), // AR, AP
  entityType: varchar("entity_type", { length: 64 }).notNull(), // client_ra_bill, client_invoice, client_payment, vendor_ra_bill, vendor_invoice, vendor_payment, reconciliation
  entityId: int("entity_id").notNull(),
  action: varchar("action", { length: 64 }).notNull(),
  previousStatus: varchar("previous_status", { length: 64 }),
  newStatus: varchar("new_status", { length: 64 }).notNull(),
  userId: int("user_id").notNull(),
  userName: varchar("user_name", { length: 255 }),
  comments: text("comments"),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Daily Progress Reports (DPR) Table
export const dailyProgressReportsTable = mysqlTable("daily_progress_reports", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("project_id").notNull(),
  reportDate: varchar("report_date", { length: 32 }).notNull(),
  weather: varchar("weather", { length: 128 }).default("Sunny / Clear"),
  shift: varchar("shift", { length: 64 }).default("Day Shift"),
  workSummary: text("work_summary").notNull(),
  workLocation: varchar("work_location", { length: 255 }),
  materialsConsumed: text("materials_consumed"),
  manpowerCount: int("manpower_count").default(0),
  manpowerBreakdown: json("manpower_breakdown").$default(() => ({})),
  equipment: json("equipment").$default(() => []),
  photos: json("photos").$default(() => []),
  siteIssues: text("site_issues"),
  status: varchar("status", { length: 64 }).default("Submitted to PM"),
  createdById: int("created_by_id"),
  ...ts(),
});

export type DailyProgressReport = typeof dailyProgressReportsTable.$inferSelect;
export type InsertDailyProgressReport = typeof dailyProgressReportsTable.$inferInsert;

// ─────────────────────────────────────────────────────────────────────────────
// SITE EXECUTION MODULE EXTENSIONS
// ─────────────────────────────────────────────────────────────────────────────

// 1. Site Attendance & Manpower Tracking
export const siteAttendanceTable = mysqlTable("site_attendance", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("project_id").notNull(),
  attendanceDate: varchar("attendance_date", { length: 32 }).notNull(),
  contractorName: varchar("contractor_name", { length: 255 }).default("Direct / General"),
  trade: varchar("trade", { length: 128 }).notNull(),
  skilledCount: int("skilled_count").default(0).notNull(),
  unskilledCount: int("unskilled_count").default(0).notNull(),
  supervisorCount: int("supervisor_count").default(0).notNull(),
  shift: varchar("shift", { length: 64 }).default("Day Shift"),
  hoursWorked: decimal("hours_worked", { precision: 6, scale: 2 }).default("8.00"),
  wageRatePerDay: decimal("wage_rate_per_day", { precision: 12, scale: 2 }).default("0.00"),
  totalLaborCost: decimal("total_labor_cost", { precision: 14, scale: 2 }).default("0.00"),
  remarks: text("remarks"),
  dprId: int("dpr_id"),
  createdById: int("created_by_id"),
  ...ts(),
});

export type SiteAttendance = typeof siteAttendanceTable.$inferSelect;
export type InsertSiteAttendance = typeof siteAttendanceTable.$inferInsert;

// 1.1 Individual Site Worker Directory & Wage Setup
export const siteWorkersTable = mysqlTable("site_workers", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("project_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 64 }).notNull().default("Skilled"), // "Skilled", "Unskilled", "Supervisor"
  trade: varchar("trade", { length: 128 }).notNull().default("Civil / Concreting"),
  contractorName: varchar("contractor_name", { length: 255 }).default("Direct Site Hire"),
  dailyWageRate: decimal("daily_wage_rate", { precision: 12, scale: 2 }).notNull().default("800.00"),
  phone: varchar("phone", { length: 32 }),
  status: varchar("status", { length: 32 }).default("active"),
  ...ts(),
});

export type SiteWorker = typeof siteWorkersTable.$inferSelect;
export type InsertSiteWorker = typeof siteWorkersTable.$inferInsert;

// 1.2 Individual Worker Daily Attendance & Wage Calculation
export const siteWorkerAttendanceTable = mysqlTable("site_worker_attendance", {
  id: int("id").autoincrement().primaryKey(),
  workerId: int("worker_id").notNull(),
  projectId: int("project_id").notNull(),
  attendanceDate: varchar("attendance_date", { length: 32 }).notNull(),
  status: varchar("status", { length: 32 }).notNull().default("present"), // "present", "half_day", "absent"
  daysWorked: decimal("days_worked", { precision: 4, scale: 2 }).notNull().default("1.00"), // 1.00, 0.50, 0.00
  dailyWageRate: decimal("daily_wage_rate", { precision: 12, scale: 2 }).notNull(),
  payableAmount: decimal("payable_amount", { precision: 12, scale: 2 }).notNull(),
  shift: varchar("shift", { length: 64 }).default("Day Shift"),
  remarks: text("remarks"),
  createdById: int("created_by_id"),
  ...ts(),
});

export type SiteWorkerAttendance = typeof siteWorkerAttendanceTable.$inferSelect;
export type InsertSiteWorkerAttendance = typeof siteWorkerAttendanceTable.$inferInsert;

// 2. Material Consumption & Site Stock Tracking
export const siteMaterialLogsTable = mysqlTable("site_material_logs", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("project_id").notNull(),
  logDate: varchar("log_date", { length: 32 }).notNull(),
  materialName: varchar("material_name", { length: 255 }).notNull(),
  category: varchar("category", { length: 128 }).default("Civil & Structural"),
  unit: varchar("unit", { length: 32 }).notNull().default("Units"),
  openingStock: decimal("opening_stock", { precision: 12, scale: 2 }).default("0.00"),
  quantityReceived: decimal("quantity_received", { precision: 12, scale: 2 }).default("0.00"),
  quantityConsumed: decimal("quantity_consumed", { precision: 12, scale: 2 }).notNull().default("0.00"),
  closingStock: decimal("closing_stock", { precision: 12, scale: 2 }).notNull().default("0.00"),
  unitCost: decimal("unit_cost", { precision: 12, scale: 2 }).default("0.00"),
  totalCost: decimal("total_cost", { precision: 14, scale: 2 }).default("0.00"),
  location: varchar("location", { length: 255 }),
  remarks: text("remarks"),
  dprId: int("dpr_id"),
  createdById: int("created_by_id"),
  ...ts(),
});

export type SiteMaterialLog = typeof siteMaterialLogsTable.$inferSelect;
export type InsertSiteMaterialLog = typeof siteMaterialLogsTable.$inferInsert;

// 3. Equipment & Plant Tracking
export const siteEquipmentLogsTable = mysqlTable("site_equipment_logs", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("project_id").notNull(),
  logDate: varchar("log_date", { length: 32 }).notNull(),
  equipmentName: varchar("equipment_name", { length: 255 }).notNull(),
  equipmentType: varchar("equipment_type", { length: 128 }).default("Heavy Machinery"),
  status: varchar("status", { length: 64 }).notNull().default("operational"), // operational, idle, maintenance, breakdown, demobilized
  hoursOperated: decimal("hours_operated", { precision: 6, scale: 2 }).default("0.00"),
  fuelConsumedLitres: decimal("fuel_consumed_litres", { precision: 8, scale: 2 }).default("0.00"),
  operatorName: varchar("operator_name", { length: 255 }),
  dailyCost: decimal("daily_cost", { precision: 14, scale: 2 }).default("0.00"),
  remarks: text("remarks"),
  dprId: int("dpr_id"),
  createdById: int("created_by_id"),
  ...ts(),
});

export type SiteEquipmentLog = typeof siteEquipmentLogsTable.$inferSelect;
export type InsertSiteEquipmentLog = typeof siteEquipmentLogsTable.$inferInsert;

// 4. Quality Inspection Logs & Checklists
export const siteQualityInspectionsTable = mysqlTable("site_quality_inspections", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("project_id").notNull(),
  inspectionDate: varchar("inspection_date", { length: 32 }).notNull(),
  inspectionTitle: varchar("inspection_title", { length: 255 }).notNull(),
  checklistCategory: varchar("checklist_category", { length: 128 }).notNull().default("Civil & Structure"),
  location: varchar("location", { length: 255 }),
  status: varchar("status", { length: 64 }).notNull().default("passed"), // passed, conditional_pass, failed, pending_reinspection
  inspectedBy: varchar("inspected_by", { length: 255 }),
  checkpointsTotal: int("checkpoints_total").default(0),
  checkpointsPassed: int("checkpoints_passed").default(0),
  correctiveActions: text("corrective_actions"),
  remarks: text("remarks"),
  linkedTaskId: int("linked_task_id"),
  createdById: int("created_by_id"),
  ...ts(),
});

export type SiteQualityInspection = typeof siteQualityInspectionsTable.$inferSelect;
export type InsertSiteQualityInspection = typeof siteQualityInspectionsTable.$inferInsert;

// 5. Safety & Incident Reports
export const siteSafetyIncidentsTable = mysqlTable("site_safety_incidents", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("project_id").notNull(),
  incidentDate: varchar("incident_date", { length: 32 }).notNull(),
  reportType: varchar("report_type", { length: 64 }).notNull().default("observation"), // observation, near_miss, first_aid, minor_injury, major_incident, toolbox_talk, ppe_audit
  title: varchar("title", { length: 255 }).notNull(),
  severity: varchar("severity", { length: 32 }).notNull().default("low"), // low, medium, high, critical
  status: varchar("status", { length: 64 }).notNull().default("open"), // open, investigating, corrective_action_taken, closed
  location: varchar("location", { length: 255 }),
  description: text("description").notNull(),
  actionTaken: text("action_taken"),
  reportedBy: varchar("reported_by", { length: 255 }),
  workersAttended: int("workers_attended").default(0),
  createdById: int("created_by_id"),
  ...ts(),
});

export type SiteSafetyIncident = typeof siteSafetyIncidentsTable.$inferSelect;
export type InsertSiteSafetyIncident = typeof siteSafetyIncidentsTable.$inferInsert;

// 6. Site Issues & Delays Tracker
export const siteIssuesDelaysTable = mysqlTable("site_issues_delays", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("project_id").notNull(),
  reportedDate: varchar("reported_date", { length: 32 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  category: varchar("category", { length: 64 }).notNull().default("material_shortage"), // drawing_design, material_shortage, labor_unavailability, weather_delay, client_approval, site_access, power_water, equipment_failure, other
  severity: varchar("severity", { length: 32 }).notNull().default("medium"), // low, medium, high, critical
  status: varchar("status", { length: 64 }).notNull().default("open"), // open, in_progress, resolved, escalated
  daysImpact: int("days_impact").default(0),
  costImpact: decimal("cost_impact", { precision: 14, scale: 2 }).default("0.00"),
  mitigationPlan: text("mitigation_plan"),
  resolutionDate: varchar("resolution_date", { length: 32 }),
  assignedTo: varchar("assigned_to", { length: 255 }),
  createdById: int("created_by_id"),
  ...ts(),
});

export type SiteIssueDelay = typeof siteIssuesDelaysTable.$inferSelect;
export type InsertSiteIssueDelay = typeof siteIssuesDelaysTable.$inferInsert;

// 7. Work Progress Tracking
export const siteWorkProgressTable = mysqlTable("site_work_progress", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("project_id").notNull(),
  progressDate: varchar("progress_date", { length: 32 }).notNull(),
  activityName: varchar("activity_name", { length: 255 }).notNull(),
  category: varchar("category", { length: 128 }).default("Civil"),
  unit: varchar("unit", { length: 32 }).default("Sq.ft"),
  plannedQuantity: decimal("planned_quantity", { precision: 12, scale: 2 }).default("0.00"),
  executedToday: decimal("executed_today", { precision: 12, scale: 2 }).default("0.00"),
  cumulativeExecuted: decimal("cumulative_executed", { precision: 12, scale: 2 }).default("0.00"),
  targetQuantity: decimal("target_quantity", { precision: 12, scale: 2 }).default("0.00"),
  percentCompleted: int("percent_completed").default(0),
  location: varchar("location", { length: 255 }),
  taskId: int("task_id"),
  milestoneId: int("milestone_id"),
  dprId: int("dpr_id"),
  remarks: text("remarks"),
  createdById: int("created_by_id"),
  ...ts(),
});

export type SiteWorkProgress = typeof siteWorkProgressTable.$inferSelect;
export type InsertSiteWorkProgress = typeof siteWorkProgressTable.$inferInsert;

// 8. Site Photo Documentation
export const sitePhotosTable = mysqlTable("site_photos", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("project_id").notNull(),
  capturedDate: varchar("captured_date", { length: 32 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  category: varchar("category", { length: 64 }).notNull().default("progress"), // progress, quality, safety, defect, material, milestone
  imageUrl: text("image_url").notNull(),
  location: varchar("location", { length: 255 }),
  latitude: double("latitude"),
  longitude: double("longitude"),
  gpsAccuracy: double("gps_accuracy"),
  geotagAddress: varchar("geotag_address", { length: 255 }),
  description: text("description"),
  stage: varchar("stage", { length: 128 }),
  dprId: int("dpr_id"),
  createdById: int("created_by_id"),
  ...ts(),
});

export type SitePhoto = typeof sitePhotosTable.$inferSelect;
export type InsertSitePhoto = typeof sitePhotosTable.$inferInsert;

// 9. Project-wise Daily Site Cost Tracking
export const siteDailyCostsTable = mysqlTable("site_daily_costs", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("project_id").notNull(),
  costDate: varchar("cost_date", { length: 32 }).notNull(),
  costType: varchar("cost_type", { length: 64 }).notNull(), // labor, material, equipment, petty_cash, transport, site_overheads
  description: varchar("description", { length: 255 }).notNull(),
  amount: decimal("amount", { precision: 14, scale: 2 }).notNull().default("0.00"),
  vendorOrPayee: varchar("vendor_or_payee", { length: 255 }),
  voucherRef: varchar("voucher_ref", { length: 128 }),
  paymentStatus: varchar("payment_status", { length: 32 }).default("paid"), // paid, unpaid, pending_approval
  dprId: int("dpr_id"),
  createdById: int("created_by_id"),
  ...ts(),
});

export type SiteDailyCost = typeof siteDailyCostsTable.$inferSelect;
export type InsertSiteDailyCost = typeof siteDailyCostsTable.$inferInsert;
