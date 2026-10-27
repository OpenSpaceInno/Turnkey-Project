# API Reference
## Kanak TurnKey — v1.0

> Document Type: API Reference
> Base URL: `http://localhost:3000/api`
> Auth: Cookie-based session (all endpoints require login unless noted)
> Last Updated: October 2026

---

## Conventions

- All responses are `application/json`
- Monetary fields are returned as `number` (converted via `numKeys()`)
- Dates returned as ISO 8601 strings
- `status` fields are `string` enums (see Data Model doc for valid values)
- Error response: `{ "error": "descriptive message" }`

---

## Authentication

### POST /api/auth/login
Login with email and password.

**Request Body:**
```json
{
  "email": "ananya.rao@kanak.in",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "id": 1,
  "name": "Ananya Rao",
  "email": "ananya.rao@kanak.in",
  "roles": ["admin", "project_manager"],
  "activeRole": "admin"
}
```

---

### POST /api/auth/logout
Clear session.

**Response (200):** `{ "ok": true }`

---

### GET /api/auth/me
Get current session user.

**Response (200):** Same shape as login response + `permissions[]`

---

## Dashboard

### GET /api/dashboard/summary
Role-aware dashboard data.

**Response (200):**
```json
{
  "user": { "id": 1, "name": "...", "activeRole": "admin" },
  "totals": { "projects": 11, "leads": 14, "tasks": 140, "vendors": 14 },
  "financials": { "totalBudget": 50000000, "totalExpenses": 0, "totalInvoiced": 0, "totalPaid": 0, "overdueInvoices": 0 },
  "procurement": { "activePos": 3, "pendingRequests": 2, "lowStockMaterials": 1 },
  "projectsByStatus": [{ "status": "active", "count": 8 }],
  "tasksByStatus": [{ "status": "todo", "count": 45 }],
  "leadFunnel": [{ "stage": "boq", "count": 4, "value": 1200000 }],
  "myProjects": [...],
  "nextActions": [...],
  "projectHealth": [...]
}
```

> Note: `financials` is `null` for roles without `financials:view` permission.

---

### GET /api/dashboard/activity
Recent activity feed (last 15 items from lead activities + notifications).

---

## Leads

### GET /api/leads
List all leads.

**Response (200):** Array of lead objects with nested `assignedTo` user.

---

### POST /api/leads
Create a new lead.

**Request Body:**
```json
{
  "customerName": "Ramesh Industries",
  "company": "Ramesh Industries Pvt Ltd",
  "phone": "9876543210",
  "email": "ramesh@example.com",
  "projectType": "Civil & Structural",
  "location": "Pune, Maharashtra",
  "budgetEstimate": 5000000,
  "assignedToId": 2,
  "priority": "high",
  "advancePercent": 10,
  "retentionPercent": 5,
  "paymentTermsDays": 30
}
```

**Response (201):** Created lead object.

---

### GET /api/leads/:id
Get a single lead with all sub-resources (activities, site visits, drawings, BOQs, negotiations).

---

### PATCH /api/leads/:id
Update lead fields.

---

### POST /api/leads/:id/convert
Convert a won lead to a project.

**Request Body:**
```json
{ "projectName": "Ramesh Factory Extension" }
```

**Response (201):** Created project object.

---

### GET /api/leads/summary
Aggregated lead statistics (totalLeads, pipelineValue, conversionRate, qualifiedLeads).

---

### POST /api/leads/:id/activities
Log a lead activity.

**Request Body:**
```json
{
  "activityType": "call",
  "title": "Follow-up call",
  "description": "Discussed revised BOQ",
  "scheduledAt": "2026-10-25T11:00:00Z"
}
```

---

### POST /api/leads/:id/site-visits
Create a site visit.

### PATCH /api/leads/:id/site-visits/:svId
Update site visit (mark complete, add observations).

### POST /api/leads/:id/drawings
Upload a drawing. `multipart/form-data` with `file` field.

### POST /api/leads/:id/boqs
Create a BOQ for the lead.

### POST /api/leads/:id/boqs/:boqId/items
Add a BOQ line item. Totals auto-recomputed.

### PATCH /api/leads/:id/boqs/:boqId/items/:itemId
Update a BOQ line item. Totals auto-recomputed.

### DELETE /api/leads/:id/boqs/:boqId/items/:itemId
Remove a BOQ line item.

### POST /api/leads/:id/negotiations
Add a negotiation round.

---

## Projects

### GET /api/projects
List all projects.

**Query Params:** `?status=active&lifecycleStage=execution`

---

### POST /api/projects
Create a project.

**Request Body:**
```json
{
  "name": "Ramesh Factory Extension",
  "projectType": "Civil & Structural",
  "clientName": "Ramesh Industries Pvt Ltd",
  "location": "Pune, Maharashtra",
  "startDate": "2026-11-01",
  "endDate": "2027-04-30",
  "budget": 5000000,
  "projectManagerId": 2,
  "leadId": 5
}
```

---

### GET /api/projects/:id
Get project with full detail (tasks, team, budget, milestones, documents, snags).

---

### PATCH /api/projects/:id
Update project (name, dates, status, lifecycleStage, progress, etc.).

---

### GET /api/projects/:id/journey
Get the project journey timeline (lifecycle stage history and key events).

---

### POST /api/projects/:id/team
Add team member to project.

**Request Body:** `{ "userId": 3, "role": "engineer" }`

---

### DELETE /api/projects/:id/team/:userId
Remove team member.

---

### POST /api/projects/:id/tasks
Create a task.

**Request Body:**
```json
{
  "title": "Excavation — Grid A",
  "description": "...",
  "assigneeId": 3,
  "startDate": "2026-11-05",
  "dueDate": "2026-11-10",
  "priority": "high",
  "parentTaskId": null
}
```

---

### PATCH /api/projects/:id/tasks/:taskId
Update task (status, progress, dates, assignee).

---

### POST /api/projects/:id/billing-milestones
Create a billing milestone.

---

### POST /api/projects/:id/documents
Upload a project document. `multipart/form-data`.

---

### POST /api/projects/:id/punch-list
Create a snag/punch list item.

### PATCH /api/projects/:id/punch-list/:itemId
Update snag item (status, assignee, resolve).

---

## Procurement — Material Requests

### GET /api/procurement/material-requests
List all MRs. Filter: `?status=pending_manager_approval&projectId=5`

### POST /api/procurement/material-requests
Create MR.

**Request Body:**
```json
{
  "projectId": 5,
  "title": "Concrete & Reinforcement Steel — Phase 1",
  "priority": "high",
  "requiredDate": "2026-11-15",
  "items": [
    { "itemName": "OPC 53 Grade Cement", "category": "Civil", "quantity": 500, "unit": "Bags", "specifications": "...", "estimatedUnitCost": 320 },
    { "itemName": "Fe500 TMT Bars 12mm", "category": "Civil", "quantity": 2000, "unit": "Kg", "specifications": "...", "estimatedUnitCost": 65 }
  ]
}
```

### GET /api/procurement/material-requests/:id
Get MR with items and approval history.

### PATCH /api/procurement/material-requests/:id
Update MR (title, priority, items, required date). Only in draft status.

### POST /api/procurement/material-requests/:id/submit
Submit MR for PM approval.

### POST /api/procurement/material-requests/:id/approve
PM approves MR.
**Body:** `{ "comments": "Approved. Proceed with RFQ." }`

### POST /api/procurement/material-requests/:id/reject
PM rejects MR.
**Body:** `{ "reason": "Quantities seem high. Revise." }`

---

## Procurement — RFQs

### GET /api/procurement/rfqs
List all RFQs. Filter: `?status=sent&projectId=5`

### POST /api/procurement/rfqs
Create RFQ from an approved MR.

**Request Body:**
```json
{
  "materialRequestId": 12,
  "vendorIds": [1, 2, 3],
  "dueDate": "2026-11-10",
  "notes": "Please quote with GST breakdown separately."
}
```

### GET /api/procurement/rfqs/:id
Get RFQ with items, vendors, and quotes.

### PATCH /api/procurement/rfqs/:id
Update RFQ (status, notes, due date).

### POST /api/procurement/rfqs/:id/vendors
Add vendors to RFQ.
**Body:** `{ "vendorIds": [4, 5] }`

### PATCH /api/procurement/rfqs/:id/vendors/:rfqVendorId
Update vendor response status.

---

## Procurement — Vendor Quotes

### GET /api/procurement/quotes
List quotes. Filter: `?rfqId=7`

### POST /api/procurement/quotes
Record a vendor quote.

**Request Body:**
```json
{
  "rfqId": 7,
  "vendorId": 2,
  "totalAmount": 185000,
  "deliveryDays": 7,
  "paymentTerms": "30 days credit",
  "validityDate": "2026-11-20",
  "items": [
    { "rfqItemId": 1, "itemName": "OPC Cement", "quantity": 500, "unit": "Bags", "unitPrice": 310, "totalPrice": 155000, "taxPercent": 18 }
  ]
}
```

### GET /api/procurement/rfqs/:rfqId/quote-comparison
Side-by-side quote comparison for an RFQ.

### POST /api/procurement/quotes/:id/select
Select a quote as the winner.
**Body:** `{ "selectionReason": "Best price with shortest delivery" }`

---

## Procurement — Purchase Orders

### GET /api/procurement/purchase-orders
List POs. Filter: `?status=issued&vendorId=2`

### POST /api/procurement/purchase-orders
Create PO from a selected quote.

**Request Body:**
```json
{
  "quoteId": 15,
  "deliveryAddress": "Ramesh Factory Site, Pune",
  "specialInstructions": "Deliver between 8am-5pm only"
}
```

### GET /api/procurement/purchase-orders/:id
Get PO with items, GRNs, and quality inspections.

### PATCH /api/procurement/purchase-orders/:id
Update PO status (issue, acknowledge, mark in_transit, etc.).

---

## Procurement — GRN & Quality

### POST /api/procurement/receipts
Record a GRN against a PO.

**Request Body:**
```json
{
  "poId": 8,
  "receivedDate": "2026-11-16",
  "deliveryNoteNumber": "DN-2026-0112",
  "vehicleNumber": "MH12AB1234",
  "items": [
    { "poItemId": 1, "receivedQuantity": 500, "condition": "good" }
  ]
}
```

### POST /api/procurement/inspections
Create quality inspection against a GRN.

**Request Body:**
```json
{
  "receiptId": 5,
  "inspectionDate": "2026-11-16",
  "inspectorName": "Priya Iyer",
  "result": "approved",
  "items": [
    { "receiptItemId": 1, "quantityChecked": 500, "qualityGrade": "A", "defectDescription": null }
  ]
}
```

---

## Procurement — Inventory

### GET /api/procurement/inventory
List all inventory items. Filter: `?projectId=5&lowStock=true`

### GET /api/procurement/inventory/:id
Get inventory item with transaction history.

### POST /api/procurement/inventory/:id/transactions
Record a manual inventory transaction (issue/return/adjustment).

---

## Finance — AR Workflow

### GET /api/finance/ar/invoices
List all AR invoices.

### PATCH /api/finance/ar/invoices/:id
Update invoice (mark sent, record acknowledgment).

### POST /api/finance/ar/invoices/:id/payments
Record a payment against an invoice.

**Request Body:**
```json
{
  "paymentDate": "2026-12-01",
  "amount": 500000,
  "paymentMode": "neft_rtgs",
  "bankReference": "UTR2026120100001",
  "transactionId": "TXN-HDFC-001"
}
```

### POST /api/finance/ar/invoices/:id/reconcile
Mark invoice as reconciled after full payment.

---

## Finance — AP Workflow

### GET /api/finance/ap/vendor-invoices
List all vendor invoices.

### POST /api/finance/ap/vendor-invoices
Record a received vendor invoice.

**Request Body:**
```json
{
  "projectId": 5,
  "vendorId": 2,
  "poId": 8,
  "vendorInvoiceNumber": "INV-VENDOR-2026-001",
  "invoiceDate": "2026-11-20",
  "grossAmount": 185000,
  "tdsAmount": 1850,
  "gstAmount": 33300,
  "netPayable": 182850
}
```

### POST /api/finance/ap/vendor-invoices/:id/three-way-match
Trigger 3-way match validation.

### POST /api/finance/ap/vendor-invoices/:id/certify
PM certifies vendor invoice for payment.

### POST /api/finance/ap/vendor-invoices/:id/verify
Finance verifies and schedules payment.

### POST /api/finance/ap/payments
Record a vendor payment.

---

## RA Bills

### GET /api/ra-bills
List RA Bills. Filter: `?projectId=5&status=submitted`

### POST /api/ra-bills
Create an RA Bill.

### GET /api/ra-bills/:id
Get RA Bill with items, deductions, documents, and approval history.

### PATCH /api/ra-bills/:id
Update RA Bill (items, deductions). Only in draft status.

### POST /api/ra-bills/:id/submit
Submit for PM approval.

### POST /api/ra-bills/:id/approve
PM approves RA Bill.

### POST /api/ra-bills/:id/request-revision
PM requests revision.

### POST /api/ra-bills/:id/generate-invoice
Generate client invoice from approved RA Bill.

### POST /api/ra-bills/:id/documents
Upload supporting documents. `multipart/form-data`.

---

## Contracts

### GET /api/contracts
List contracts. Filter: `?projectId=5&contractType=client`

### POST /api/contracts
Create a contract.

**Request Body:**
```json
{
  "projectId": 5,
  "contractType": "client",
  "contractNumber": "KT-CON-2026-001",
  "title": "Civil Construction Contract",
  "value": 5000000,
  "startDate": "2026-11-01",
  "endDate": "2027-04-30",
  "advancePercent": 10,
  "retentionPercent": 5,
  "tdsPercent": 1,
  "gstPercent": 18,
  "dlpMonths": 12,
  "boqItems": [
    { "itemCode": "CIVIL-001", "description": "Excavation", "unit": "CUM", "quantity": 500, "rate": 150 }
  ]
}
```

---

## Site Execution

### GET /api/site-execution/dprs
List DPRs. Filter: `?projectId=5&date=2026-11-15`

### POST /api/site-execution/dprs
Create a DPR.

### GET /api/site-execution/dprs/:id
Get DPR with all sub-records.

### POST /api/site-execution/attendance
Log site attendance.

### POST /api/site-execution/material-logs
Log material consumption.

### POST /api/site-execution/equipment-logs
Log equipment utilisation.

### POST /api/site-execution/work-progress
Log work progress against an activity.

### POST /api/site-execution/photos
Upload site photo. `multipart/form-data`.

### POST /api/site-execution/safety-incidents
Log a safety incident.

### POST /api/site-execution/quality-inspections
Log a quality inspection.

### POST /api/site-execution/issues-delays
Log a site issue or delay.

### GET /api/site-execution/workers/:projectId
List workers for a project.

### POST /api/site-execution/workers/:projectId
Add a worker to the project directory.

---

## Task Templates

### GET /api/task-templates
List all task templates.

### POST /api/task-templates
Create a task template.

### POST /api/task-templates/:id/apply/:projectId
Apply a template to a project — bulk-creates tasks.

---

## Administration

### GET /api/admin/users
List all users (Admin only).

### POST /api/admin/users
Create a user.

### PATCH /api/admin/users/:id
Update user (name, roles, status).

### GET /api/admin/audit-logs
Get audit logs with filters.

### GET /api/admin/role-switch-requests
List pending role switch requests.

### POST /api/admin/role-switch-requests/:id/approve
Approve a role switch.

### POST /api/admin/role-switch-requests/:id/reject
Reject a role switch.

---

## Company Settings

### GET /api/company-settings
Get company settings.

### PATCH /api/company-settings
Update company settings.

### POST /api/company-settings/logo
Upload company logo. `multipart/form-data`.

---

## Vendors

### GET /api/procurement/vendors
List vendors.

### POST /api/procurement/vendors
Create vendor.

**Request Body:**
```json
{
  "name": "Ultratech Cement Distributors",
  "companyName": "Ultratech Dist Pvt Ltd",
  "contactPerson": "Ramesh Kumar",
  "email": "ramesh@ultratech-dist.com",
  "phone": "9876543210",
  "gstin": "29AABCU9603R1ZV",
  "categories": ["Civil", "Building Materials"],
  "city": "Pune",
  "state": "Maharashtra"
}
```

### GET /api/procurement/vendors/:id
Get vendor with performance history.

### PATCH /api/procurement/vendors/:id
Update vendor.

---

*API Reference v1.0 — Add new endpoints to this document before they go into code review.*
