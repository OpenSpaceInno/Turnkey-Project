import {
  pgTable,
  serial,
  integer,
  text,
  varchar,
  timestamp,
  date,
  boolean,
  numeric,
  doublePrecision,
  jsonb,
} from "drizzle-orm/pg-core";

const ts = () => ({
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  avatarUrl: text("avatar_url"),
  roles: text("roles").array().notNull().default([]),
  activeRole: varchar("active_role", { length: 50 }).notNull().default("admin"),
  ...ts(),
});

export const leadsTable = pgTable("leads", {
  id: serial("id").primaryKey(),
  leadNumber: varchar("lead_number", { length: 64 }).notNull().unique(),
  customerName: varchar("customer_name", { length: 255 }).notNull(),
  company: varchar("company", { length: 255 }),
  contactEmail: varchar("contact_email", { length: 255 }),
  contactPhone: varchar("contact_phone", { length: 64 }),
  projectType: varchar("project_type", { length: 128 }),
  location: varchar("location", { length: 255 }),
  budgetEstimate: numeric("budget_estimate", { precision: 14, scale: 2 }),
  leadSource: varchar("lead_source", { length: 128 }),
  status: varchar("status", { length: 32 }).notNull().default("new"),
  stage: varchar("stage", { length: 32 }).notNull().default("lead_creation"),
  priority: varchar("priority", { length: 16 }).notNull().default("medium"),
  ownerId: integer("owner_id"),
  expectedClosureDate: date("expected_closure_date"),
  wonProjectId: integer("won_project_id"),
  notes: text("notes"),
  ...ts(),
});

export const leadActivitiesTable = pgTable("lead_activities", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").notNull(),
  activityType: varchar("activity_type", { length: 64 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  createdById: integer("created_by_id"),
  ...ts(),
});

export const siteVisitsTable = pgTable("site_visits", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").notNull(),
  visitDate: date("visit_date").notNull(),
  visitTime: varchar("visit_time", { length: 16 }),
  engineerId: integer("engineer_id"),
  siteAddress: text("site_address"),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  measurements: text("measurements"),
  observations: text("observations"),
  status: varchar("status", { length: 32 }).notNull().default("pending"),
  ...ts(),
});

export const drawingsTable = pgTable("drawings", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileType: varchar("file_type", { length: 64 }),
  fileSize: integer("file_size"),
  fileUrl: text("file_url"),
  version: integer("version").notNull().default(1),
  status: varchar("status", { length: 32 }).notNull().default("draft"),
  reviewerComments: text("reviewer_comments"),
  uploadedById: integer("uploaded_by_id"),
  reviewedById: integer("reviewed_by_id"),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const boqsTable = pgTable("boqs", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").notNull(),
  version: integer("version").notNull().default(1),
  status: varchar("status", { length: 32 }).notNull().default("draft"),
  subtotal: numeric("subtotal", { precision: 14, scale: 2 })
    .notNull()
    .default("0"),
  taxTotal: numeric("tax_total", { precision: 14, scale: 2 })
    .notNull()
    .default("0"),
  marginTotal: numeric("margin_total", { precision: 14, scale: 2 })
    .notNull()
    .default("0"),
  grandTotal: numeric("grand_total", { precision: 14, scale: 2 })
    .notNull()
    .default("0"),
  createdById: integer("created_by_id"),
  approvedById: integer("approved_by_id"),
  ...ts(),
});

export const boqItemsTable = pgTable("boq_items", {
  id: serial("id").primaryKey(),
  boqId: integer("boq_id").notNull(),
  itemName: varchar("item_name", { length: 255 }).notNull(),
  category: varchar("category", { length: 128 }),
  quantity: numeric("quantity", { precision: 14, scale: 2 }).notNull(),
  unit: varchar("unit", { length: 32 }),
  unitPrice: numeric("unit_price", { precision: 14, scale: 2 }).notNull(),
  taxPercent: numeric("tax_percent", { precision: 6, scale: 2 })
    .notNull()
    .default("0"),
  marginPercent: numeric("margin_percent", { precision: 6, scale: 2 })
    .notNull()
    .default("0"),
  totalPrice: numeric("total_price", { precision: 14, scale: 2 })
    .notNull()
    .default("0"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const negotiationsTable = pgTable("negotiations", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").notNull(),
  roundNumber: integer("round_number").notNull().default(1),
  revisedAmount: numeric("revised_amount", { precision: 14, scale: 2 }),
  discountPercent: numeric("discount_percent", { precision: 6, scale: 2 }),
  status: varchar("status", { length: 32 }).notNull().default("pending"),
  requiresApproval: boolean("requires_approval").notNull().default(false),
  notes: text("notes"),
  createdById: integer("created_by_id"),
  approvedById: integer("approved_by_id"),
  ...ts(),
});

export const projectsTable = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 128 }),
  location: varchar("location", { length: 255 }),
  clientName: varchar("client_name", { length: 255 }),
  startDate: date("start_date"),
  endDate: date("end_date"),
  budget: numeric("budget", { precision: 14, scale: 2 }),
  description: text("description"),
  status: varchar("status", { length: 32 }).notNull().default("planning"),
  progress: integer("progress").notNull().default(0),
  teamSize: integer("team_size"),
  createdById: integer("created_by_id"),
  ...ts(),
});

export const tasksTable = pgTable("tasks", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  assignedToId: integer("assigned_to_id"),
  startDate: date("start_date"),
  endDate: date("end_date"),
  priority: varchar("priority", { length: 16 }).notNull().default("medium"),
  status: varchar("status", { length: 32 }).notNull().default("todo"),
  progress: integer("progress").notNull().default(0),
  parentTaskId: integer("parent_task_id"),
  createdById: integer("created_by_id"),
  ...ts(),
});

export const budgetItemsTable = pgTable("budget_items", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  costCode: varchar("cost_code", { length: 64 }).notNull(),
  description: varchar("description", { length: 255 }).notNull(),
  budgeted: numeric("budgeted", { precision: 14, scale: 2 })
    .notNull()
    .default("0"),
  actual: numeric("actual", { precision: 14, scale: 2 })
    .notNull()
    .default("0"),
  committed: numeric("committed", { precision: 14, scale: 2 })
    .notNull()
    .default("0"),
});

export const raBillsTable = pgTable("ra_bills", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  billNumber: varchar("bill_number", { length: 64 }).notNull(),
  description: text("description"),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  milestone: varchar("milestone", { length: 255 }),
  status: varchar("status", { length: 32 }).notNull().default("draft"),
  createdById: integer("created_by_id"),
  ...ts(),
});

export const expensesTable = pgTable("expenses", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  description: varchar("description", { length: 255 }).notNull(),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  category: varchar("category", { length: 32 }).notNull(),
  expenseDate: date("expense_date").notNull(),
  receiptUrl: text("receipt_url"),
  status: varchar("status", { length: 32 }).notNull().default("draft"),
  submittedById: integer("submitted_by_id"),
  approvedById: integer("approved_by_id"),
  ...ts(),
});

export const invoicesTable = pgTable("invoices", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  invoiceNumber: varchar("invoice_number", { length: 64 }).notNull(),
  clientName: varchar("client_name", { length: 255 }).notNull(),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  invoiceDate: date("invoice_date").notNull(),
  dueDate: date("due_date").notNull(),
  paymentDate: date("payment_date"),
  reconciled: boolean("reconciled").notNull().default(false),
  status: varchar("status", { length: 32 }).notNull().default("draft"),
  ...ts(),
});

export const vendorInvoicesTable = pgTable("vendor_invoices", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  vendorId: integer("vendor_id").notNull(),
  purchaseOrderId: integer("purchase_order_id"),
  invoiceNumber: varchar("invoice_number", { length: 64 }).notNull(),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  discrepancyNotes: text("discrepancy_notes"),
  status: varchar("status", { length: 32 }).notNull().default("received"),
  paymentDate: date("payment_date"),
  ...ts(),
});

export const financialInstrumentsTable = pgTable("financial_instruments", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id"),
  instrumentType: varchar("instrument_type", { length: 32 }).notNull(),
  bgSubType: varchar("bg_sub_type", { length: 32 }),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  issueDate: date("issue_date"),
  expiryDate: date("expiry_date"),
  releaseDate: date("release_date"),
  bankName: varchar("bank_name", { length: 255 }),
  referenceNumber: varchar("reference_number", { length: 128 }),
  retentionPercent: numeric("retention_percent", { precision: 6, scale: 2 }),
  status: varchar("status", { length: 32 }).notNull().default("active"),
  notes: text("notes"),
  createdById: integer("created_by_id"),
  ...ts(),
});

export const vendorsTable = pgTable("vendors", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  contactPerson: varchar("contact_person", { length: 255 }),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 64 }),
  address: text("address"),
  category: varchar("category", { length: 128 }),
  rating: numeric("rating", { precision: 3, scale: 1 })
    .notNull()
    .default("0"),
  status: varchar("status", { length: 16 }).notNull().default("active"),
  ...ts(),
});

export const materialRequestsTable = pgTable("material_requests", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  quantity: numeric("quantity", { precision: 14, scale: 2 }).notNull(),
  unit: varchar("unit", { length: 32 }).notNull(),
  status: varchar("status", { length: 32 }).notNull().default("pending"),
  createdById: integer("created_by_id"),
  ...ts(),
});

export const rfqsTable = pgTable("rfqs", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  materialRequestId: integer("material_request_id"),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 32 }).notNull().default("draft"),
  createdById: integer("created_by_id"),
  ...ts(),
});

export const quotationsTable = pgTable("quotations", {
  id: serial("id").primaryKey(),
  rfqId: integer("rfq_id").notNull(),
  vendorId: integer("vendor_id").notNull(),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  deliveryDays: integer("delivery_days").notNull(),
  notes: text("notes"),
  isSelected: boolean("is_selected").notNull().default(false),
  ...ts(),
});

export const purchaseOrdersTable = pgTable("purchase_orders", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  vendorId: integer("vendor_id").notNull(),
  poNumber: varchar("po_number", { length: 64 }).notNull(),
  description: text("description"),
  totalAmount: numeric("total_amount", { precision: 14, scale: 2 }).notNull(),
  deliveryDate: date("delivery_date"),
  status: varchar("status", { length: 32 }).notNull().default("draft"),
  inspectionStatus: varchar("inspection_status", { length: 16 })
    .notNull()
    .default("pending"),
  createdById: integer("created_by_id"),
  ...ts(),
});

export const materialsTable = pgTable("materials", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id"),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  unit: varchar("unit", { length: 32 }).notNull(),
  quantityOnHand: numeric("quantity_on_hand", { precision: 14, scale: 2 })
    .notNull()
    .default("0"),
  quantityCommitted: numeric("quantity_committed", { precision: 14, scale: 2 })
    .notNull()
    .default("0"),
  quantityConsumed: numeric("quantity_consumed", { precision: 14, scale: 2 })
    .notNull()
    .default("0"),
  minimumStock: numeric("minimum_stock", { precision: 14, scale: 2 })
    .notNull()
    .default("0"),
});

export const stakeholdersTable = pgTable("stakeholders", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 64 }),
  organization: varchar("organization", { length: 255 }),
  role: varchar("role", { length: 128 }),
  accessLevel: varchar("access_level", { length: 16 })
    .notNull()
    .default("read"),
});

export const communicationsTable = pgTable("communications", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id"),
  stakeholderId: integer("stakeholder_id"),
  communicationType: varchar("communication_type", { length: 16 }).notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  content: text("content"),
  communicationDate: timestamp("communication_date", { withTimezone: true })
    .notNull(),
  participants: text("participants"),
  createdById: integer("created_by_id"),
  ...ts(),
});

export const meetingsTable = pgTable("meetings", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  meetingDate: timestamp("meeting_date", { withTimezone: true }).notNull(),
  duration: integer("duration").notNull().default(60),
  location: varchar("location", { length: 255 }),
  agenda: text("agenda"),
  minutes: text("minutes"),
  participants: text("participants"),
  createdById: integer("created_by_id"),
  ...ts(),
});

export const documentsTable = pgTable("documents", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileType: varchar("file_type", { length: 64 }),
  fileSize: integer("file_size"),
  fileUrl: text("file_url"),
  category: varchar("category", { length: 32 }).notNull().default("general"),
  version: integer("version").notNull().default(1),
  status: varchar("status", { length: 16 }).notNull().default("active"),
  uploadedById: integer("uploaded_by_id"),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const punchListItemsTable = pgTable("punch_list_items", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 64 }).notNull().default("general"),
  priority: varchar("priority", { length: 16 }).notNull().default("medium"),
  status: varchar("status", { length: 32 }).notNull().default("open"),
  assignedToId: integer("assigned_to_id"),
  dueDate: date("due_date"),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  resolvedById: integer("resolved_by_id"),
  createdById: integer("created_by_id"),
  photos: jsonb("photos").notNull().default([]),
  ...ts(),
});

export const punchListItemCommentsTable = pgTable("punch_list_item_comments", {
  id: serial("id").primaryKey(),
  punchListItemId: integer("punch_list_item_id").notNull(),
  authorName: varchar("author_name", { length: 255 }).notNull(),
  text: text("text").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const notificationsTable = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  notificationType: varchar("notification_type", { length: 64 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message"),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const taskTemplatesTable = pgTable("task_templates", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  projectType: varchar("project_type", { length: 128 }),
  isDefault: boolean("is_default").notNull().default(false),
  createdById: integer("created_by_id"),
  ...ts(),
});

export const taskTemplateItemsTable = pgTable("task_template_items", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  phase: varchar("phase", { length: 128 }),
  priority: varchar("priority", { length: 16 }).notNull().default("medium"),
  estimatedDays: integer("estimated_days"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const notificationPreferencesTable = pgTable("notification_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  preferences: jsonb("preferences").notNull().default({}),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const companySettingsTable = pgTable("company_settings", {
  id: serial("id").primaryKey(),
  companyName: varchar("company_name", { length: 255 }).notNull().default(""),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 100 }),
  country: varchar("country", { length: 100 }).default("India"),
  pincode: varchar("pincode", { length: 20 }),
  currency: varchar("currency", { length: 10 }).notNull().default("INR"),
  gstNumber: varchar("gst_number", { length: 50 }),
  phone: varchar("phone", { length: 30 }),
  email: varchar("email", { length: 255 }),
  website: varchar("website", { length: 255 }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const auditLogsTable = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  activity: varchar("activity", { length: 255 }).notNull(),
  resourceType: varchar("resource_type", { length: 64 }).notNull(),
  resourceId: integer("resource_id"),
  ipAddress: varchar("ip_address", { length: 64 }),
  status: varchar("status", { length: 32 }).notNull().default("success"),
  metadata: text("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
