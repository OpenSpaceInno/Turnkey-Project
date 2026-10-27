# Functional Requirements Document (FRD)
## Kanak TurnKey — v1.0

> Document Type: Functional Requirements Document (FRD)
> Audience: Product, Engineering, QA
> Last Updated: October 2026

---

## Priority Legend

| Priority | Meaning |
|---|---|
| P0 | Must have — core workflow; product is broken without it |
| P1 | Should have — important; needed for Phase 2 |
| P2 | Nice to have — Phase 3 or future enhancement |

---

## Module 1: Authentication & User Management

| FR ID | Requirement | Priority | Status |
|---|---|---|---|
| FR-AUTH-01 | User can log in with email and password | P0 | ✅ Done |
| FR-AUTH-02 | Session maintained for 24 hours via secure cookie | P0 | ✅ Done |
| FR-AUTH-03 | Each user has one or more assigned roles | P0 | ✅ Done |
| FR-AUTH-04 | User has one "active role" that governs current session permissions | P0 | ✅ Done |
| FR-AUTH-05 | User can request a role switch (e.g., Engineer → PM temporarily) | P1 | ✅ Done |
| FR-AUTH-06 | Role switch request must be approved by PM or Admin | P1 | ✅ Done |
| FR-AUTH-07 | Admin can create, edit, deactivate users | P0 | ✅ Done |
| FR-AUTH-08 | Admin can override individual permissions per user | P1 | ✅ Done |
| FR-AUTH-09 | All login/logout events are audit logged | P0 | ✅ Done |
| FR-AUTH-10 | Password reset flow via email | P0 | ✅ Done |
| FR-AUTH-11 | Two-factor authentication (2FA) | P2 | ✅ Done |
| FR-AUTH-12 | Mobile phone & OTP login for Mobile PWA (field engineers) | P1 | ✅ Done |

---

## Module 2: Dashboard

| FR ID | Requirement | Priority | Status |
|---|---|---|---|
| FR-DASH-01 | Role-aware dashboard greeting showing active role | P0 | ✅ Done |
| FR-DASH-02 | "My Projects" widget showing projects relevant to logged-in user | P0 | ✅ Done |
| FR-DASH-03 | Project health summary (schedule, budget, quality) per project | P0 | ✅ Done |
| FR-DASH-04 | Lead funnel chart (stages vs. count and value) | P1 | ✅ Done |
| FR-DASH-05 | Financial KPIs (budget, expenses, invoiced, paid) — masked for non-financial roles | P0 | ✅ Done |
| FR-DASH-06 | Task status distribution chart | P0 | ✅ Done |
| FR-DASH-07 | Procurement alerts (active POs, pending MRs, low stock) | P1 | ✅ Done |
| FR-DASH-08 | Overdue invoice alert with count | P0 | ✅ Done |
| FR-DASH-09 | "Next Actions" panel — role-specific actionable items | P0 | ✅ Done |
| FR-DASH-10 | Clicking a dashboard card navigates to relevant module | P1 | ✅ Done |
| FR-DASH-11 | Date range filter for financial KPIs | P2 | ✅ Done |

---

## Module 3: Lead Management (CRM)

### 3.1 Lead Lifecycle

| FR ID | Requirement | Priority | Status |
|---|---|---|---|
| FR-LEAD-01 | Create a lead with customer name, contact, project type, location, budget estimate | P0 | ✅ Done |
| FR-LEAD-02 | Lead auto-assigned a unique lead number (LD-YYYYMMDD-XXXX) | P0 | ✅ Done |
| FR-LEAD-03 | Assign lead to an owner (PM or Admin) | P0 | ✅ Done |
| FR-LEAD-04 | Progress lead through stages: lead_creation → site_visit → drawings → boq → negotiation → finalization | P0 | ✅ Done |
| FR-LEAD-05 | Set lead priority (low, medium, high, urgent) | P1 | ✅ Done |
| FR-LEAD-06 | Set expected closure date | P1 | ✅ Done |
| FR-LEAD-07 | Log lead activities (calls, emails, meetings, notes) with timestamp | P0 | ✅ Done |
| FR-LEAD-08 | Mark lead as Won, Lost, or Cancelled | P0 | ✅ Done |
| FR-LEAD-09 | Won lead auto-creates a project with commercial terms carried over | P0 | ✅ Done |
| FR-LEAD-10 | Filter leads by status, stage, owner, date range | P1 | ✅ Done |
| FR-LEAD-11 | Search leads by customer name or lead number | P1 | ✅ Done |
| FR-LEAD-12 | Kanban view of lead pipeline by stage | P2 | ✅ Done |
| FR-LEAD-13 | Export lead list to Excel | P2 | ✅ Done |

### 3.2 Site Visit

| FR ID | Requirement | Priority | Status |
|---|---|---|---|
| FR-SV-01 | Schedule a site visit against a lead with date, time, engineer assigned | P0 | ✅ Done |
| FR-SV-02 | Record site address, measurements, observations | P0 | ✅ Done |
| FR-SV-03 | Capture geolocation (lat/lng) for site visit | P1 | ✅ Schema; UI basic |
| FR-SV-04 | Mark site visit as completed or cancelled | P0 | ✅ Done |

### 3.3 Drawings

| FR ID | Requirement | Priority | Status |
|---|---|---|---|
| FR-DRW-01 | Upload drawing files against a lead | P0 | ✅ Done |
| FR-DRW-02 | Support multiple file types (PDF, DWG, images) | P0 | ✅ Done |
| FR-DRW-03 | Version control drawings (v1, v2, etc.) | P0 | ✅ Done |
| FR-DRW-04 | Mark drawing status: draft, approved, superseded | P1 | ✅ Done |
| FR-DRW-05 | Add reviewer comments to drawings | P1 | ✅ Done |

### 3.4 BOQ (Bill of Quantities)

| FR ID | Requirement | Priority | Status |
|---|---|---|---|
| FR-BOQ-01 | Create a BOQ against a lead with line items | P0 | ✅ Done |
| FR-BOQ-02 | Each line item has: name, category, quantity, unit, unit price, tax %, margin % | P0 | ✅ Done |
| FR-BOQ-03 | Auto-compute totals: subtotal, tax total, margin, grand total | P0 | ✅ Done |
| FR-BOQ-04 | Support multiple BOQ versions | P1 | ✅ Done |
| FR-BOQ-05 | Approve/reject BOQ | P1 | ✅ Done |
| FR-BOQ-06 | Export BOQ to Excel/PDF | P1 | ✅ Done |

### 3.5 Negotiation

| FR ID | Requirement | Priority | Status |
|---|---|---|---|
| FR-NEG-01 | Log negotiation rounds with revised amount and discount | P0 | ✅ Done |
| FR-NEG-02 | Track negotiation status (pending, approved) | P0 | ✅ Done |
| FR-NEG-03 | Flag negotiations requiring management approval | P1 | ✅ Done |

---

## Module 4: Project Management

### 4.1 Project Core

| FR ID | Requirement | Priority | Status |
|---|---|---|---|
| FR-PROJ-01 | Create project with name, type, location, client, dates, budget | P0 | ✅ Done |
| FR-PROJ-02 | Auto-link project to source lead | P0 | ✅ Done |
| FR-PROJ-03 | Project lifecycle: setup → procurement → execution → billing → quality → handover → closed | P0 | ✅ Done |
| FR-PROJ-04 | Manually advance lifecycle stage | P0 | ✅ Done |
| FR-PROJ-05 | Project setup checklist (contract, milestone, budget must be set before mobilisation) | P0 | ✅ Done |
| FR-PROJ-06 | Project journey / visual timeline view | P1 | ✅ Done |

### 4.2 Team & Assignments

| FR ID | Requirement | Priority | Status |
|---|---|---|---|
| FR-TEAM-01 | Assign Project Manager to project | P0 | ✅ Done |
| FR-TEAM-02 | Assign team members with roles | P0 | ✅ Done |
| FR-TEAM-03 | Remove team members | P0 | ✅ Done |

### 4.3 Tasks

| FR ID | Requirement | Priority | Status |
|---|---|---|---|
| FR-TASK-01 | Create tasks within a project | P0 | ✅ Done |
| FR-TASK-02 | Task has: title, description, assignee, start date, end date, priority, status | P0 | ✅ Done |
| FR-TASK-03 | Task statuses: todo, in_progress, in_review, completed | P0 | ✅ Done |
| FR-TASK-04 | Sub-tasks (parent-child hierarchy) | P1 | ✅ Done |
| FR-TASK-05 | Task progress tracking (0-100%) | P0 | ✅ Done |
| FR-TASK-06 | Apply task template to auto-generate standard tasks | P1 | ✅ Done |
| FR-TASK-07 | Gantt chart view of project tasks | P1 | ✅ Done |
| FR-TASK-08 | Critical path analysis | P2 | ✅ Done |

### 4.4 Budget Tracking

| FR ID | Requirement | Priority | Status |
|---|---|---|---|
| FR-BUD-01 | Define budget line items with cost codes and categories | P0 | ✅ Done |
| FR-BUD-02 | Track budgeted vs. actual vs. committed amounts | P0 | ✅ Done |
| FR-BUD-03 | Project-level budget variance report | P1 | ✅ Done |

### 4.5 Billing Milestones

| FR ID | Requirement | Priority | Status |
|---|---|---|---|
| FR-BM-01 | Define billing milestones per project with percentage and expected amount | P0 | ✅ Done |
| FR-BM-02 | Link milestones to lifecycle stage | P0 | ✅ Done |
| FR-BM-03 | Track milestone status: pending, ready_to_bill, billed, paid | P0 | ✅ Done |
| FR-BM-04 | Link RA Bill to milestone on billing | P0 | ✅ Done |

### 4.6 Punch List / Snag List

| FR ID | Requirement | Priority | Status |
|---|---|---|---|
| FR-SNAG-01 | Create snag items with title, category, priority, assignee | P0 | ✅ Done |
| FR-SNAG-02 | Upload photos to snag items | P0 | ✅ Done |
| FR-SNAG-03 | Mark snags as open, in_progress, resolved | P0 | ✅ Done |
| FR-SNAG-04 | Add comments to snag items | P1 | ✅ Done |
| FR-SNAG-05 | Export snag list to PDF | P1 | ✅ Done |

### 4.7 Documents

| FR ID | Requirement | Priority | Status |
|---|---|---|---|
| FR-DOC-01 | Upload documents against a project | P0 | ✅ Done |
| FR-DOC-02 | Categorise documents (contract, drawing, report, invoice, other) | P0 | ✅ Done |
| FR-DOC-03 | Version control documents | P1 | ✅ Done |
| FR-DOC-04 | Download/view documents | P0 | ✅ Done |

---

## Module 5: Procurement

### 5.1 Material Requests

| FR ID | Requirement | Priority | Status |
|---|---|---|---|
| FR-MR-01 | Engineer submits material request with line items, specs, required date | P0 | ✅ Done |
| FR-MR-02 | MR auto-assigned unique request number | P0 | ✅ Done |
| FR-MR-03 | MR workflow: draft → pending_manager_approval → approved → rfq_generated → completed | P0 | ✅ Done |
| FR-MR-04 | PM approves or rejects MR with comments | P0 | ✅ Done |
| FR-MR-05 | Approval history logged | P0 | ✅ Done |
| FR-MR-06 | PM dashboard shows all pending MRs | P0 | ✅ Done |
| FR-MR-07 | MR can be linked to specific project | P0 | ✅ Done |
| FR-MR-08 | Estimated cost on MR line items | P1 | ✅ Done |

### 5.2 RFQ (Request for Quotation)

| FR ID | Requirement | Priority | Status |
|---|---|---|---|
| FR-RFQ-01 | Generate RFQ from approved MR | P0 | ✅ Done |
| FR-RFQ-02 | RFQ auto-assigned unique RFQ number | P0 | ✅ Done |
| FR-RFQ-03 | Add one or more vendors to RFQ | P0 | ✅ Done |
| FR-RFQ-04 | RFQ workflow: draft → sent → receiving_quotes → quotes_received → evaluated → completed | P0 | ✅ Done |
| FR-RFQ-05 | Set RFQ due date | P0 | ✅ Done |
| FR-RFQ-06 | Email RFQ PDF to vendor contacts | P1 | ✅ Done |
| FR-RFQ-07 | Track vendor response status (sent, responded, declined, no_response) | P0 | ✅ Done |

### 5.3 Vendor Quotes

| FR ID | Requirement | Priority | Status |
|---|---|---|---|
| FR-QT-01 | Record vendor quote against an RFQ | P0 | ✅ Done |
| FR-QT-02 | Quote includes line item pricing (qty, unit price, total) | P0 | ✅ Done |
| FR-QT-03 | Quote includes delivery days, payment terms, validity | P0 | ✅ Done |
| FR-QT-04 | Side-by-side quote comparison view | P0 | ✅ Done |
| FR-QT-05 | Mark one quote as selected with reason | P0 | ✅ Done |

### 5.4 Purchase Orders

| FR ID | Requirement | Priority | Status |
|---|---|---|---|
| FR-PO-01 | Generate PO from selected vendor quote | P0 | ✅ Done |
| FR-PO-02 | PO auto-assigned unique PO number | P0 | ✅ Done |
| FR-PO-03 | PO workflow: draft → issued → acknowledged → in_transit → delivered → inspected → completed | P0 | ✅ Done |
| FR-PO-04 | Track vendor acknowledgment of PO | P0 | ✅ Done |
| FR-PO-05 | Track delivery status and expected delivery date | P0 | ✅ Done |
| FR-PO-06 | Log vendor follow-up attempts | P1 | ⚠️ Schema only |
| FR-PO-07 | Print / download PO as PDF | P1 | ✅ Done |

### 5.5 Goods Received Note (GRN)

| FR ID | Requirement | Priority | Status |
|---|---|---|---|
| FR-GRN-01 | Record GRN against a PO with received quantities per line item | P0 | ✅ Done |
| FR-GRN-02 | GRN includes delivery details (vehicle, driver, delivery note number) | P0 | ✅ Done |
| FR-GRN-03 | Upload delivery photos with GRN | P0 | ✅ Done |
| FR-GRN-04 | GRN auto-assigned unique receipt number | P0 | ✅ Done |

### 5.6 Quality Inspection

| FR ID | Requirement | Priority | Status |
|---|---|---|---|
| FR-QC-01 | Conduct quality inspection against GRN | P0 | ✅ Done |
| FR-QC-02 | Inspection results: pending, approved, rejected, partial_approved | P0 | ✅ Done |
| FR-QC-03 | Per-item quality grade (A, B, C, Rejected) with defect description | P0 | ✅ Done |
| FR-QC-04 | Upload inspection photos | P0 | ✅ Done |
| FR-QC-05 | Approved items auto-added to inventory | P0 | ✅ Done |

### 5.7 Inventory

| FR ID | Requirement | Priority | Status |
|---|---|---|---|
| FR-INV-01 | Inventory updated on quality-approved GRN | P0 | ✅ Done |
| FR-INV-02 | Track: total, available, allocated, consumed quantities | P0 | ✅ Done |
| FR-INV-03 | Track average cost and last purchase price | P0 | ✅ Done |
| FR-INV-04 | Set minimum stock level and reorder level | P1 | ✅ Done |
| FR-INV-05 | Alert when stock falls below minimum | P1 | ✅ Done |
| FR-INV-06 | Inventory transaction log (goods receipt, issue, return, adjustment) | P0 | ✅ Done |

---

## Module 6: Site Execution

| FR ID | Requirement | Priority | Status |
|---|---|---|---|
| FR-SITE-01 | Submit Daily Progress Report (DPR) with date, weather, shift, work summary | P0 | ✅ Done |
| FR-SITE-02 | Log contractor/trade-wise manpower attendance in DPR | P0 | ✅ Done |
| FR-SITE-03 | Log individual worker attendance with wage calculation | P0 | ✅ Done |
| FR-SITE-04 | Log material consumption with opening/closing stock | P0 | ✅ Done |
| FR-SITE-05 | Log equipment utilisation, fuel, and operating hours | P0 | ✅ Done |
| FR-SITE-06 | Log daily work progress (activity vs. planned quantity) | P0 | ✅ Done |
| FR-SITE-07 | Upload site photos categorised by type (progress, quality, safety, defect) | P0 | ✅ Done |
| FR-SITE-08 | Log site issues and delays with impact days and cost | P0 | ✅ Done |
| FR-SITE-09 | Log safety incidents (observation, near miss, first aid, toolbox talk) | P0 | ✅ Done |
| FR-SITE-10 | Conduct quality inspection with pass/fail per checkpoint | P0 | ✅ Done |
| FR-SITE-11 | Track daily site costs (labour, material, petty cash, equipment) | P0 | ✅ Done |
| FR-SITE-12 | Site worker directory per project | P1 | ✅ Done |
| FR-SITE-13 | Offline DPR submission (mobile PWA) | P1 | ✅ Done |
| FR-SITE-14 | DPR quantities feed into billing measurement (JMR → WCC) | P1 | ✅ Done |
| FR-SITE-15 | GPS-tagged site photo upload | P2 | ✅ Done |

---

## Module 7: RA Bills & Contracts

### 7.1 Contracts

| FR ID | Requirement | Priority | Status |
|---|---|---|---|
| FR-CON-01 | Create client contract with BOQ, milestones, commercial terms | P0 | ✅ Done |
| FR-CON-02 | Create vendor/subcontractor contract with BOQ | P0 | ✅ Done |
| FR-CON-03 | Contract commercial terms: retention %, advance %, TDS %, GST %, DLP months | P0 | ✅ Done |
| FR-CON-04 | Track ABG (Advance Bank Guarantee) linked to contract | P1 | ✅ Done |
| FR-CON-05 | Contract status: draft, active, completed, terminated | P0 | ✅ Done |

### 7.2 Work Completion Certificates

| FR ID | Requirement | Priority | Status |
|---|---|---|---|
| FR-WCC-01 | Record work completion against contract BOQ with current quantities | P0 | ✅ Done |
| FR-WCC-02 | Auto-carry forward cumulative completed quantities | P0 | ✅ Done |
| FR-WCC-03 | WCC workflow: draft → submitted → verified → correction_required | P0 | ✅ Done |
| FR-WCC-04 | Upload supporting documents (measurement sheets, photos, JMR) | P0 | ✅ Done |

### 7.3 RA Bills

| FR ID | Requirement | Priority | Status |
|---|---|---|---|
| FR-RAB-01 | Create RA Bill from verified WCC | P0 | ✅ Done |
| FR-RAB-02 | RA Bill auto-computes: gross, retention, advance recovery, TDS, GST, net payable | P0 | ✅ Done |
| FR-RAB-03 | RA Bill workflow: draft → submitted → approved → payment_certified → invoice_generated → closed | P0 | ✅ Done |
| FR-RAB-04 | PM can approve or request revision with comments | P0 | ✅ Done |
| FR-RAB-05 | Full approval history with timestamps | P0 | ✅ Done |
| FR-RAB-06 | Generate client invoice from approved RA Bill | P0 | ✅ Done |
| FR-RAB-07 | Upload RA Bill supporting documents | P0 | ✅ Done |

---

## Module 8: Finance (AR/AP)

### 8.1 Accounts Receivable (AR)

| FR ID | Requirement | Priority | Status |
|---|---|---|---|
| FR-AR-01 | View all client invoices across projects | P0 | ✅ Done |
| FR-AR-02 | Track invoice status: generated, sent, payment_pending, partially_paid, paid, reconciled | P0 | ✅ Done |
| FR-AR-03 | Record invoice delivery (sent, viewed, acknowledged) | P0 | ✅ Done |
| FR-AR-04 | Record partial or full payment against invoice | P0 | ✅ Done |
| FR-AR-05 | Reconcile invoice after payment | P0 | ✅ Done |
| FR-AR-06 | Send payment reminders | P1 | ⚠️ Schema only |
| FR-AR-07 | AR aging report (0-30, 31-60, 61-90, 90+ days) | P1 | ✅ Done |

### 8.2 Accounts Payable (AP)

| FR ID | Requirement | Priority | Status |
|---|---|---|---|
| FR-AP-01 | Record vendor invoice received | P0 | ✅ Done |
| FR-AP-02 | 3-way matching: PO + GRN + Vendor Invoice | P0 | ✅ Done |
| FR-AP-03 | Flag discrepancies (quantity, rate, tax mismatch) | P0 | ✅ Done |
| FR-AP-04 | Resolve discrepancies with notes | P0 | ✅ Done |
| FR-AP-05 | PM certifies vendor invoice for payment | P0 | ✅ Done |
| FR-AP-06 | Finance verifies and schedules payment | P0 | ✅ Done |
| FR-AP-07 | Record vendor payment with UTR/reference | P0 | ✅ Done |
| FR-AP-08 | Reconcile vendor invoice after payment | P0 | ✅ Done |

### 8.3 Financial Instruments

| FR ID | Requirement | Priority | Status |
|---|---|---|---|
| FR-FI-01 | Track financial instruments: BG (Performance, Advance), LC, EMD | P0 | ✅ Done |
| FR-FI-02 | Record issue date, expiry date, release date | P0 | ✅ Done |
| FR-FI-03 | Alert on instruments expiring within 30 days | P1 | ✅ Done |

### 8.4 Expenses

| FR ID | Requirement | Priority | Status |
|---|---|---|---|
| FR-EXP-01 | Log project expenses with category and receipt | P0 | ✅ Done |
| FR-EXP-02 | Expense approval workflow | P1 | ⚠️ Basic |
| FR-EXP-03 | Expense summary per project | P0 | ✅ Done |

---

## Module 9: Reports & Analytics

| FR ID | Requirement | Priority | Status |
|---|---|---|---|
| FR-RPT-01 | Project progress summary report | P0 | ✅ Done |
| FR-RPT-02 | Project P&L report (budget vs. actual vs. invoiced vs. paid) | P0 | ✅ Done |
| FR-RPT-03 | Procurement summary (MRs, POs, inventory) | P1 | ✅ Done |
| FR-RPT-04 | Cash flow statement (receivables vs. payables by month) | P1 | ✅ Done |
| FR-RPT-05 | Quality & safety summary report | P1 | ✅ Done |
| FR-RPT-06 | AR aging report | P1 | ✅ Done |
| FR-RPT-07 | Vendor payment ledger | P1 | ✅ Done |
| FR-RPT-08 | Export any report to Excel or PDF | P1 | ✅ Done |
| FR-RPT-09 | Financial variance analysis (EVM) | P2 | ✅ Done |

---

## Module 10: System & Administration

| FR ID | Requirement | Priority | Status |
|---|---|---|---|
| FR-SYS-01 | Company settings (name, GST, PAN, address, bank, logo) | P0 | ✅ Done |
| FR-SYS-02 | Audit log of all critical system actions | P0 | ✅ Done |
| FR-SYS-03 | In-app notification system | P1 | ✅ Done |
| FR-SYS-04 | Email notification on workflow events | P1 | ✅ Done |
| FR-SYS-05 | Task templates for standard project types | P1 | ✅ Done |
| FR-SYS-06 | Multi-organization support | P2 | ⚠️ Schema only |

---

*FRD v1.0 — Baseline frozen. All new feature requests must be added here with PR ID, priority, and status.*
