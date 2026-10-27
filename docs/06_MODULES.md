# Module Documentation
## Kanak TurnKey — v1.0

> Document Type: Module-wise Feature & Workflow Documentation
> Audience: Product Team, Engineering, QA, Future Developers
> Last Updated: October 2026

---

## How to Read This Document

Each module section contains:
1. **Purpose** — Why this module exists
2. **User Roles** — Who uses it and what they can do
3. **Workflow** — The step-by-step business flow
4. **UI Pages** — What screens exist in the frontend
5. **API Endpoints** — Routes that power the module
6. **DB Tables** — Tables that store this module's data
7. **Current Gaps** — What is missing
8. **Enhancement Ideas** — Future improvements, including industry extensions

---

## Module 1: Authentication & User Management

### Purpose
Control who can access the system and what they can do. Supports role-based access with granular permission overrides and temporary role switching for flexible on-site operations.

### User Roles
| Role | Access |
|---|---|
| admin | Full access — create/edit all users and permissions |
| All others | Can request role switch; see their own profile |

### Workflow
```
1. Admin creates user accounts (email, name, roles)
2. User logs in by email selection (password enforcement — Phase 1)
3. User's "active role" determines what they see
4. User requests role switch → PM/Admin approves/rejects
5. All critical actions automatically logged to audit_logs
```

### UI Pages
- `/login` — Login page (email selector)
- `/admin/users` — User management (Admin only)
- `/admin/role-approvals` — Role switch request queue
- `/audit-logs` — Full audit trail (Admin only)
- `/settings/profile` — User profile page

### DB Tables
`users`, `organizations`, `user_permission_overrides`, `role_switch_requests`, `audit_logs`

### Current Gaps
- Password validation not enforced (security risk)
- No password reset flow
- No email verification on user creation

### Enhancement Ideas (Future)
- SSO / Google OAuth login
- Two-factor authentication (2FA)
- Session management dashboard (view and revoke active sessions)

---

## Module 2: Dashboard

### Purpose
Role-aware command center giving every user a personalised view of what matters most to them — without overwhelming them with irrelevant information.

### User Roles
| Role | Sees |
|---|---|
| admin | Full portfolio: financials, all projects, lead funnel, procurement |
| project_manager | My projects, lead funnel, pending MR approvals, overdue invoices |
| engineer | My projects, site actions, task status |
| accountant | Financial KPIs, overdue invoices, AR/AP summary |
| procurement_officer | Active POs, pending MRs, low stock alerts |
| viewer | My projects (read-only), task status |

### Workflow
```
1. User logs in → Dashboard loads (role-specific data from API)
2. Greeting banner shows active role context
3. "Next Actions" panel highlights most urgent items
4. "My Projects" widget shows relevant projects with health indicators
5. Charts visualise lead funnel, task status, project distribution
6. Financial KPIs shown only to roles with financials:view permission
7. Clicking any card/metric navigates to the relevant module
```

### UI Pages
- `/` (root) — Dashboard (`dashboard.tsx`)

### DB Tables
Aggregates data from most tables — no dedicated dashboard tables.

### Current Gaps
- No date range filter for financial KPIs
- No drill-down from chart segments

### Enhancement Ideas
- Personalised widget layout (drag to reorder)
- Custom KPI cards per company
- Export dashboard snapshot as PDF for management reporting

---

## Module 3: Lead Management (CRM)

### Purpose
Manage the full pre-sales lifecycle from first client enquiry through site visit, design, BOQ, negotiation, and contract award. This is the **entry point** to the entire turnkey lifecycle.

### User Roles
| Role | Access |
|---|---|
| admin, project_manager | Full CRUD, stage progression, lead conversion |
| Others | No access (leads are commercial data) |

### Workflow
```
STAGE 1: Lead Creation
  → Capture: customer, contact, project type, location, budget estimate
  → Assign owner (PM or Admin)
  → Set priority and expected closure date

STAGE 2: Site Visit
  → Schedule site visit (assign engineer, set date)
  → Record: site address, measurements, observations, photos
  → Mark visit as completed

STAGE 3: Drawings
  → Upload architecture/engineering drawings (PDF, DWG, images)
  → Version drawings (v1, v2, ...)
  → Mark drawing status: draft → reviewed → approved
  → Add reviewer comments

STAGE 4: BOQ (Bill of Quantities)
  → Create BOQ with line items:
     - Name, category, quantity, unit, unit price, tax %, margin %
  → System auto-computes: subtotal, tax total, margin, grand total
  → Multiple BOQ versions supported

STAGE 5: Negotiation
  → Log negotiation rounds (revised amount, discount %)
  → Track negotiation status
  → Management approval for significant discounts

STAGE 6: Finalization
  → Mark lead as Won, Lost, or Cancelled
  → Won: Convert lead → Project
     (commercial terms: advance %, retention %, ABG, payment terms carried over)
  → Lost/Cancelled: Log reason for pipeline analysis

LOG ACTIVITIES throughout all stages:
  → Calls, emails, meetings, notes (timestamp + created_by)
```

### UI Pages
- `/leads` — Lead list with summary cards, search, filter
- `/leads/:id` — Lead detail (93KB — comprehensive single-page lead management)
  - Tabs: Overview | Activities | Site Visits | Drawings | BOQ | Negotiation | Convert

### DB Tables
`leads`, `lead_activities`, `site_visits`, `drawings`, `boqs`, `boq_items`, `negotiations`

### Current Gaps
- Lead list filter is basic (only search by name/number)
- No Kanban pipeline board
- BOQ export to Excel/PDF missing
- No lead scoring or win probability

### Enhancement Ideas (All Industries)
- **Kanban board**: Drag leads across stages visually
- **Lead scoring**: AI-computed probability of winning based on lead profile
- **Quote comparison**: Compare multiple BOQ versions before submission
- **Email integration**: Send BOQ/proposal to client directly from lead
- **Calendar integration**: Sync site visits with Google Calendar
- **Furniture industry**: Line items in BOQ become furniture items (piece × dimensions × material × finish → price)

---

## Module 4: Project Management

### Purpose
Central hub for managing the full project lifecycle from setup through execution and handover. Every downstream module (procurement, billing, site execution) is linked to a project.

### User Roles
| Role | Access |
|---|---|
| admin, project_manager | Full project management |
| engineer | View project, update tasks, submit DPR |
| accountant, procurement_officer | View project; manage their respective sub-modules |
| viewer | Read-only |

### Workflow
```
PROJECT SETUP (setupComplete must be true before mobilisation):
  → Create project (from lead or manually)
  → Upload signed contract
  → Define billing milestones
  → Upload baseline budget / BOQ
  → Assign team members (PM, engineers, procurement officer)
  → Define task schedule (or apply task template)

PROJECT EXECUTION (lifecycle advances through stages):
  setup → procurement → execution → billing → quality → handover → closed

KEY ACTIONS PER STAGE:
  procurement:   Approve material requests; track POs
  execution:     Daily DPR; task progress; issue tracking
  billing:       RA Bills; invoicing; payment tracking
  quality:       Punch list resolution; quality inspections
  handover:      Final inspection; handover certificate; DLP period begins
  closed:        All bills settled; retention released; ABG released
```

### UI Pages
- `/projects` — Project list
- `/projects/:id` — Project detail (104KB — multi-tab comprehensive view)
  - Tabs: Overview | Tasks | Team | Budget | Milestones | Commercial | Documents | Snags | Journey
- `/task-templates` — Manage reusable task templates
- `/tasks` — Personal task inbox (all tasks assigned to current user)

### DB Tables
`projects`, `project_assignments`, `tasks`, `budget_items`, `billing_milestones`, `documents`, `punch_list_items`, `punch_list_item_comments`, `stakeholders`, `contracts`, `contract_boq_items`

### Current Gaps
- No Gantt chart view
- No S-Curve (planned vs. actual) chart
- No critical path analysis
- Project search limited
- Punch list PDF export missing

### Enhancement Ideas
- **Gantt Chart**: DHTMLX Gantt or Frappe Gantt for visual scheduling
- **S-Curve**: Chart cumulative planned vs. actual progress over project timeline
- **Baseline vs. Revised Schedule**: Track schedule slippage
- **EVM (Earned Value Management)**: SPI (Schedule Performance Index), CPI (Cost Performance Index), EAC (Estimate at Completion)
- **Risk Register**: Log and track project risks with mitigation plans
- **Client Correspondence Log**: Track all formal communications with client
- **Furniture industry**: Project type = "Manufacturing Order" with production stages (raw material → cutting → assembly → finishing → delivery → installation)

---

## Module 5: Procurement

### Purpose
End-to-end procurement lifecycle from site material requisition through purchase order fulfilment to inventory receipt. Ensures no materials are procured without proper approval and documentation.

### User Roles
| Role | Access |
|---|---|
| admin | Full access |
| project_manager | Approve MRs; view all procurement |
| engineer | Submit MRs; view status |
| procurement_officer | Manage RFQs, quotes, POs, GRNs |
| accountant | View only (for AP reconciliation) |

### Workflow
```
STEP 1: Material Request (MR)
  Engineer → Submit MR with line items, specs, required date
  PM → Reviews and Approves / Rejects with comments
  [Approval history logged]

STEP 2: RFQ (Request for Quotation)
  Procurement Officer → Creates RFQ from approved MR
  Selects vendors to invite
  [RFQ sent to vendors — email: Phase 2]
  Tracks vendor response status

STEP 3: Vendor Quotes
  Records each vendor's quote (line item pricing)
  Side-by-side comparison view
  Selects best vendor with reason

STEP 4: Purchase Order
  PO auto-generated from selected quote
  Issued to vendor
  Vendor acknowledges PO
  Delivery tracked (in transit → delivered)

STEP 5: Goods Received Note (GRN)
  Records delivery (vehicle, driver, delivery note)
  Checks received quantities vs. PO quantities

STEP 6: Quality Inspection
  Inspector grades each item (A/B/C/Rejected)
  Result: approved / rejected / partial_approved
  Rejected items flagged for vendor return

STEP 7: Inventory Update
  Quality-approved items automatically added to inventory
  Inventory tracks: on_hand, allocated, consumed, on_order
  Low-stock alerts at minimum_stock level
```

### UI Pages
- `/procurement` — Procurement hub (tabs: MRs, RFQs, POs, Inventory)
- `/procurement/material-requests/:id` — MR detail with approval workflow
- `/procurement/rfqs/:id` — RFQ detail with vendor management
- `/procurement/rfqs/:id/quote-compare` — Side-by-side quote comparison
- `/procurement/purchase-orders/:id` — PO detail with GRN and QC
- `/procurement/manager-approvals` — PM's MR approval queue
- `/procurement/notifications` — Procurement alerts

### DB Tables
`procurement_material_requests`, `_items`, `_approval_history`, `procurement_rfqs`, `_rfq_items`, `_rfq_vendors`, `procurement_vendor_quotes`, `_quote_items`, `procurement_purchase_orders`, `_po_items`, `procurement_material_receipts`, `_receipt_items`, `procurement_quality_inspections`, `_inspection_items`, `procurement_inventory_items`, `_transactions`, `vendors`

### Current Gaps
- Vendor email delivery for RFQs (Phase 2)
- PO PDF generation
- Vendor follow-up automation
- Vendor catalogue / price history
- Vendor performance scorecard

### Enhancement Ideas
- **Email RFQ**: Auto-email RFQ PDF to vendor contacts on publish
- **Vendor portal**: Vendors submit quotes online (Phase 3)
- **Price history**: Track price trends per material over time
- **Preferred vendor lists**: Per project or per material category
- **Budget compliance check**: MR item cost vs. budget line item — alert if over-budget
- **Furniture industry**: Material Request = Raw Material Requisition (wood species, fabric type, hardware fittings); Vendor Quote = from timber merchant, foam supplier, hardware importer

---

## Module 6: Site Execution

### Purpose
Record and track all daily site operations — manpower, materials, equipment, work progress, quality, safety, and costs. Forms the evidence base for measurement billing (RA Bills).

### User Roles
| Role | Access |
|---|---|
| engineer | Submit DPRs, log all site data |
| project_manager | View and review all DPRs |
| admin | Full access |

### Workflow
```
DAILY CYCLE:
  Morning: Engineer opens DPR for the day
  
  During day:
    - Log work progress (activity vs. planned quantities)
    - Record material consumption (opening → received → consumed → closing stock)
    - Log equipment hours and fuel
    - Take and upload categorised site photos
    - Record any safety observations or incidents
    
  End of day: Submit DPR → Status: "Submitted to PM"
  
  CONCURRENTLY:
    - Log individual worker attendance + auto-compute wages
    - Report site issues and delays with impact quantification
    - Conduct quality inspections with pass/fail against checkpoints
    - Log daily site costs (petty cash, transport, overheads)
```

### UI Pages
- `/site-execution` — Site execution hub (select project)
- `/site-execution?project=:id` — Project site view
  - Tabs: DPR | Attendance | Materials | Equipment | Work Progress | Photos | Safety | Quality | Issues | Costs

### DB Tables
`daily_progress_reports`, `site_attendance`, `site_workers`, `site_worker_attendance`, `site_material_logs`, `site_equipment_logs`, `site_work_progress`, `site_photos`, `site_quality_inspections`, `site_safety_incidents`, `site_issues_delays`, `site_daily_costs`

### Current Gaps
- No mobile/PWA — DPR cannot be submitted from site on phone
- DPR quantities do not auto-populate billing measurement (JMR → WCC)
- No GPS-tagged photos
- No S-Curve integration (DPR progress → planned vs. actual chart)

### Enhancement Ideas
- **Mobile PWA**: Offline-capable DPR submission from Android/iOS browser
- **DPR → Billing Bridge**: Work progress quantities auto-populate WCC
- **Photo geo-tagging**: GPS coordinates embedded in site photos
- **QR code scan attendance**: Site workers scan QR on entry — auto-logs attendance
- **Safety toolbox talk records**: Formal template for daily toolbox talks
- **Subcontractor daily reports**: Separate sub-contractor measurement sheets
- **Furniture industry**: DPR becomes "Production Log" (cutting list, assembly progress, QC results before despatch)

---

## Module 7: RA Bills & Contracts

### Purpose
Implement the core **turnkey billing model** — measurement-based progressive billing (Running Account Bills). Each RA Bill is raised against a verified work completion certificate and links to the contract BOQ.

### User Roles
| Role | Access |
|---|---|
| project_manager | Create WCC, submit RA Bills, approve/reject |
| accountant | View, generate invoices, manage deductions |
| admin | Full access |
| engineer | Submit WCC |

### Workflow
```
CONTRACT SETUP:
  → Create client contract with BOQ items (description, unit, quantity, rate)
  → Define commercial terms: advance %, retention %, TDS %, GST %, DLP months
  → Create billing milestones linked to contract

CYCLE 1: First RA Bill (e.g., after 30% work done)
  STEP 1: Work Completion Certificate (WCC)
    Engineer/PM records quantities executed per BOQ item
    Uploads supporting docs (measurement sheets, joint inspection records)
    WCC status: draft → submitted → verified

  STEP 2: RA Bill Preparation
    System populates:
      - BOQ item-wise: qty executed this period + cumulative qty
      - Gross amount = sum of (qty × rate)
      - Less: Retention (e.g., 5% of gross)
      - Less: Advance Recovery (if advance was paid)
      - Less: TDS (if applicable)
      - Add: GST
      - Net Payable = Gross − Retention − Advance Recovery − TDS + GST
    Previous cumulative billed is auto-shown; only incremental amount billed

  STEP 3: Approval
    PM reviews RA Bill → Approve or Request Revision
    Full approval history logged (who, when, comments)

  STEP 4: Invoice Generation
    Approved RA Bill → Generate Client Invoice
    Invoice number auto-assigned
    Invoice sent to client (manual email currently)

CYCLE 2, 3... N: Repeat for each billing milestone
  - System always carries forward cumulative quantities from previous cycles
  - Retention accumulates (released at project closure)
  - Advance recovered progressively

FINAL BILL:
  - Final measurements agreed with client
  - Retention released
  - ABG released
  - Project financially closed
```

### UI Pages
- `/ra-bills` — RA Bill list with filters
- `/ra-bills/:id` — Full RA Bill detail, approval workflow, documents

### DB Tables
`contracts`, `contract_boq_items`, `billing_milestones`, `work_completions`, `work_completion_items`, `work_completion_documents`, `ra_bills`, `ra_bill_items`, `ra_bill_documents`, `ra_bill_approval_history`, `invoices`, `invoice_payments`, `payment_reminders`

### Current Gaps
- No PDF generation for RA Bills and invoices
- No email delivery of invoices
- TDS auto-computation not implemented
- Deduction schedule not configurable per RA Bill (fixed from contract)

### Enhancement Ideas
- **PDF generation**: Professional invoice/RA Bill PDF with company letterhead
- **Email delivery**: Send invoice directly from system to client email
- **TDS auto-compute**: Based on vendor/client PAN and TDS applicability
- **Digital signature**: eSign invoices before sending
- **Retention tracker**: Visual retention balance and release schedule
- **Furniture industry**: "RA Bill" becomes "Delivery Milestone Invoice" (e.g., 40% on factory completion, 60% on installation completion)

---

## Module 8: Finance (AR/AP)

### Purpose
Unified Accounts Receivable and Accounts Payable management. AR handles client billing and payment collections. AP handles vendor invoice verification (3-way match), discrepancy resolution, and payment processing.

### User Roles
| Role | Access |
|---|---|
| accountant | Full AR/AP management |
| project_manager | View and certify vendor invoices |
| admin | Full access |
| Others | No access (financials:view required) |

### Workflow — AR (Client Side)

```
Invoice generated (from RA Bill) → Delivered to client
→ Mark as Sent → Client acknowledges
→ Payment Pending (due date tracking)
→ Payment received → Record partial or full payment
→ Invoice reconciled (fully paid) → Closed

Parallel: Overdue tracking → Payment reminders sent
```

### Workflow — AP (Vendor Side)

```
Vendor submits invoice →
System performs 3-Way Match:
  ┌────────────────────────────────────────────────────┐
  │ PO (what was ordered)                              │
  │ GRN (what was received)                            │
  │ Vendor Invoice (what is being claimed)             │
  └────────────────────────────────────────────────────┘
  If all match → Status: verified
  If mismatch → Flag discrepancy (type, amount difference)
    → Discrepancy resolved with vendor → Status: resolved
    
PM certifies invoice → Finance verifies
→ Payment approved → Payment scheduled → Payment made
→ UTR/reference recorded → Invoice reconciled
```

### UI Pages
- `/finance` — Finance hub (project-wise financial overview, financial instruments)
- `/finance/ar` — Accounts Receivable management (47KB)
- `/finance/ap` — Accounts Payable management (37KB)

### DB Tables
`invoices`, `invoice_payments`, `payment_reminders`, `vendor_invoices`, `vendor_payments`, `ap_discrepancies`, `financial_audit_logs`, `financial_instruments`, `expenses`

### Current Gaps
- No AR aging report (0-30, 31-60, 61-90, 90+ days)
- No cash flow projection
- No project P&L report
- No Excel/PDF export of financial reports
- TDS not auto-computed
- No bank integration for payment initiation

### Enhancement Ideas
- **AR Aging Dashboard**: Visual aging buckets with drill-down
- **Cash Flow Projection**: Month-wise receivables vs. payables projection
- **Project P&L**: Revenue − Direct Cost (materials + labour + subcontractor) − Overhead = Margin
- **GST reconciliation**: Match vendor invoices with GSTR-2A data from GSTN portal
- **Bank integration**: Auto-import bank statements for payment matching
- **Tally sync**: Export payment vouchers to Tally ERP (Phase 3)

---

## Module 9: Communications

### Purpose
Track all project and lead communications — phone calls, emails, meetings, site visits — as a searchable record.

### User Roles
| Role | Access |
|---|---|
| project_manager, admin | Full access |
| Others | View communications for their projects |

### Workflow
```
Log communication → Select type (email/call/meeting/site_visit)
→ Attach to Lead or Project
→ Record: date, attendees, subject, notes/minutes
→ Set follow-up date if required
```

### UI Pages
- `/communications` — Communication log

### DB Tables
`communications`, `meetings`, `notifications`, `notification_preferences`

### Current Gaps
- No email send/receive integration
- No meeting calendar view
- No automatic meeting reminders

---

## Module 10: Reports & Analytics

### Purpose
Give leadership and project managers a data-driven view of project performance, financial health, and operational efficiency.

### Status
**CRITICAL GAP** — The reports module is a stub page with no functional reports.

### Reports Needed (Phase 1)

| Report | Audience | Key Data |
|---|---|---|
| Project Progress Summary | PM, Admin | Progress %, schedule variance, milestone status |
| Project P&L | Admin, Accountant | Budget vs. Actual vs. Invoiced vs. Paid |
| Procurement Summary | PM, Procurement | MR count, PO value, pending deliveries, inventory value |
| AR Aging | Accountant, Admin | Outstanding invoices by age bucket |
| Vendor Payment Ledger | Accountant | AP payments per vendor |
| Cash Flow | Admin | Month-wise projected AR vs. AP |

### Reports Needed (Phase 2)

| Report | Audience | Key Data |
|---|---|---|
| S-Curve | PM, Admin | Planned vs. Actual progress over time |
| Earned Value Report | PM, Admin | SPI, CPI, EAC, ETC |
| Safety Summary | Admin | Incidents by type and severity |
| Quality Summary | Admin | Inspection pass rate by project |
| Lead Pipeline Analytics | Admin, PM | Conversion rate, win rate, average BOQ value |

### DB Tables
No dedicated tables — reports are aggregation queries across existing tables.

---

## Module 11: Administration

### Purpose
System administration — user management, audit logs, and global settings.

### Workflow
```
User Management:
  Admin → Create/Edit/Deactivate users
  Admin → Assign/modify roles
  Admin → Override specific permissions per user

Role Switch Requests:
  User → Request role switch (reason provided)
  PM/Admin → Approve or Reject
  System → Logs action; updates active role

Audit Logs:
  Automatic → All create/update/delete/approve/pay actions logged
  Admin → Search and filter by user, action, entity, date range

Company Settings:
  Admin → Set company name, GSTIN, PAN, address
  Admin → Upload logo and letterhead
  Admin → Configure bank details (for payment display)
```

### UI Pages
- `/admin/users` — User list and management
- `/admin/role-approvals` — Role switch request queue
- `/audit-logs` — Audit log viewer
- `/settings` — Company settings
- `/notifications` — In-app notification inbox

---

## Industry Extension Guide

### How to Add a New Industry Vertical

**Step 1: Define the Project Type**
Add the new project type to `projectsTable.projectType` enum (e.g., `"furniture"`, `"interiors"`, `"landscaping"`).

**Step 2: Configure Stage Names**
The lead stages and project lifecycle stages can be configured via company settings in Phase 3. For now, add type-specific stage name mappings in the frontend.

**Step 3: Define BOQ Item Categories**
Each industry has different BOQ line item categories:
- Construction: `Civil`, `Structural`, `MEP`, `Finishing`
- Furniture: `Seating`, `Storage`, `Tables`, `Beds`, `Upholstery`, `Hardware`
- Interiors: `False Ceiling`, `Flooring`, `Wall Treatment`, `Lighting`, `FF&E`

**Step 4: Configure Billing Model**
| Industry | Billing Model |
|---|---|
| Construction (Turnkey) | RA Bills (measurement-based) |
| Furniture Manufacturing | Milestone (50% advance, 50% delivery) |
| Interiors Fit-out | Milestone + RA Bill hybrid |
| Landscaping | RA Bill or Milestone |

**Step 5: Adapt DPR / Progress Reports**
For furniture: Production Log (cutting qty, assembly qty, finishing qty)
For interiors: DPR similar to construction

**Step 6: QC Checklist Templates**
Define per-industry inspection checkpoints in `task_templates` / `site_quality_inspections`.

### Industry Mapping Table

| Turnkey Term | Construction | Furniture | Interiors | Landscaping |
|---|---|---|---|---|
| Lead | Client Enquiry | Quote Request | Design Enquiry | Site Development Query |
| BOQ | Bill of Quantities | Furniture Schedule | Item Schedule | Plant & Material Schedule |
| Site Visit | Site Inspection | Factory / Showroom Demo | Space Measurement | Site Survey |
| Drawing | Civil/MEP Drawing | CAD/3D Render | Interior Layout | Landscape Plan |
| RA Bill | Running Account Bill | Delivery Invoice | Stage Bill | Monthly Bill |
| DPR | Daily Progress Report | Production Log | Daily Work Report | Site Activity Log |
| GRN | Goods Received Note | Factory Intake Note | Material Receipt | Nursery Delivery Note |
| Punch List | Snag List | Defect Report | Snagging List | Defect List |
| Handover | Project Handover | Delivery & Installation Complete | Space Handover | Landscape Handover |

---

*Module Documentation v1.0 — Update when a module's workflow, screens, or data model changes.*
