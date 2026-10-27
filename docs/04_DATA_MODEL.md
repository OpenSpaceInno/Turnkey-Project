# Database & Entity Relationship Documentation
## Kanak TurnKey — v1.0

> Document Type: Data Model & ER Documentation
> Audience: Backend Engineers, DBA, Solution Architect
> Last Updated: October 2026

---

## 1. Database Overview

| Property | Value |
|---|---|
| Engine | MySQL 8.0 |
| Database Name | turnkey_db |
| ORM | Drizzle ORM (TypeScript) |
| Schema File | `lib/db/src/schema/index.ts` |
| Total Tables | ~50 |
| Migration Tool | drizzle-kit |

---

## 2. Schema Design Conventions

| Convention | Pattern |
|---|---|
| Primary Key | `id INT AUTO_INCREMENT` |
| Foreign Keys | `{entity}_id INT` (enforced at application level) |
| Monetary Fields | `DECIMAL(14, 2)` |
| Rate / Percentage Fields | `DECIMAL(8, 4)` or `DECIMAL(6, 2)` |
| Status Fields | `VARCHAR(32)` with inline comment listing valid values |
| Timestamps | All tables include `created_at TIMESTAMP` and `updated_at TIMESTAMP` via shared `ts()` helper |
| Soft Delete | Entities use `status = 'cancelled'` or `'deleted'` instead of hard DELETE |
| JSON Columns | Used sparingly for arrays (photos, preferences, breakdown objects) |
| Numbers from DB | Always strings in Drizzle — use `numKeys()` transform before sending to frontend |

---

## 3. Entity Group Diagrams

### 3.1 Auth & User Management

```
┌──────────────────────────────────────────────────────────────┐
│ organizations                                                │
│  id, name, slug, settings_json, created_at                  │
└─────────────────────────────────┬────────────────────────────┘
                                  │ 1
                                  │ *
┌─────────────────────────────────┴────────────────────────────┐
│ users                                                        │
│  id, organization_id, name, email, password_hash             │
│  roles (JSON), active_role, status                           │
│  permissions (JSON), avatar_url                              │
└────┬──────────────────────────────────┬───────────────────────┘
     │ 1                                │ 1
     │ *                                │ *
┌────┴───────────────────┐    ┌─────────┴──────────────────────┐
│ user_permission_       │    │ role_switch_requests            │
│ overrides              │    │  id, user_id, requested_role   │
│  id, user_id           │    │  current_role, reason, status  │
│  permission, granted   │    │  reviewed_by_id, reviewed_at   │
└────────────────────────┘    └─────────────────────────────────┘
```

---

### 3.2 Lead Management

```
┌──────────────────────────────────────────────────────────────┐
│ leads                                                        │
│  id, lead_number, customer_name, company, phone, email       │
│  project_type, location, budget_estimate, status, stage      │
│  assigned_to_id, priority, expected_closure_date             │
│  advance_percent, retention_percent, abg_percent, abg_amount │
│  payment_terms_days, dlp_months                              │
│  won_project_id (FK → projects)                              │
│  created_by_id, created_at, updated_at                       │
└───┬────────────────┬────────────┬─────────────┬──────────────┘
    │                │            │             │
    │ 1              │ 1          │ 1           │ 1
    │ *              │ *          │ *           │ *
    ▼                ▼            ▼             ▼
lead_activities  site_visits   drawings      boqs
  id               id            id            id
  lead_id          lead_id       lead_id       lead_id
  activity_type    visit_date    title         version
  title            address       drawing_type  status
  description      engineer_id   file_url      subtotal
  created_by_id    observations  version       tax_total
                   status        status        grand_total
                                 review_status         │
                                               ┌───────┘
                                               │ 1
                                               │ *
                                          boq_items
                                            id, boq_id
                                            name, category
                                            quantity, unit
                                            unit_price
                                            tax_percent
                                            margin_percent
                                            total_price

┌──────────────────┐
│ negotiations     │
│  id, lead_id     │
│  round_number    │
│  revised_amount  │
│  discount_percent│
│  status          │
│  notes           │
└──────────────────┘
```

---

### 3.3 Project Management

```
┌──────────────────────────────────────────────────────────────┐
│ projects                                                     │
│  id, name, project_number, project_type, status             │
│  lifecycle_stage, client_name, client_contact               │
│  location, start_date, end_date, budget, progress           │
│  project_manager_id, created_by_id                          │
│  lead_id (FK → leads), setup_complete                       │
│  created_at, updated_at                                     │
└──┬──────────┬──────────┬──────────┬──────────┬──────────────┘
   │          │          │          │          │
   │1*        │1*        │1*        │1*        │1*
   ▼          ▼          ▼          ▼          ▼
project_    tasks     budget_   billing_   documents
assignments           items    milestones
  id           id        id        id          id
  project_id   project_id project_id project_id project_id
  user_id      title     category  milestone_  title
  role         assignee  code      name        file_url
               status    budgeted  milestone_  category
               priority  actual    percentage  version
               progress  committed amount
               parent_id          status

┌────────────────────┐  ┌──────────────────────┐
│ stakeholders       │  │ punch_list_items      │
│  id, project_id    │  │  id, project_id       │
│  name, role        │  │  title, category      │
│  email, phone      │  │  status, priority     │
│  company           │  │  assigned_to          │
└────────────────────┘  │  photos (JSON)        │
                        │  resolved_at          │
                        └──────────────────────┘
```

---

### 3.4 Contracts & Billing

```
┌───────────────────────────────────────────────────────────┐
│ contracts                                                 │
│  id, project_id, contract_type (client/vendor)           │
│  contract_number, title, value, status                   │
│  vendor_id (if vendor contract)                          │
│  advance_percent, retention_percent                      │
│  tds_percent, gst_percent, dlp_months                   │
│  start_date, end_date                                    │
└──────┬─────────────────────────────────────┬─────────────┘
       │ 1                                   │ 1
       │ *                                   │ *
contract_boq_items                     billing_milestones
  id, contract_id                        id, contract_id
  item_code, description                 project_id
  unit, quantity, rate                   name, percentage
  amount                                 expected_amount
                                         status
                                         billed_at

┌──────────────────────────────────────────────────────────┐
│ work_completions (WCC)                                   │
│  id, project_id, contract_id                            │
│  wcc_number, title, measurement_date                    │
│  status (draft/submitted/verified/correction_required)  │
│  submitted_by_id, verified_by_id                        │
└─────────────┬────────────────────────────────────────────┘
              │ 1                         │ 1
              │ *                         │ *
   work_completion_items         work_completion_documents
      id, wcc_id                   id, wcc_id
      contract_boq_item_id         title, file_url
      description, unit            document_type
      quantity, rate, amount

┌──────────────────────────────────────────────────────────┐
│ ra_bills                                                 │
│  id, project_id, contract_id, wcc_id                   │
│  ra_bill_number, bill_date, bill_period_from/to        │
│  gross_amount, retention_amount, advance_recovery       │
│  tds_amount, gst_amount, net_payable                   │
│  status (draft/submitted/approved/...)                 │
│  current_bill_amount, previous_cumulative_amount       │
└────┬───────────────────┬─────────────────────────────────┘
     │ 1                 │ 1
     │ *                 │ *
ra_bill_items      ra_bill_approval_history
  id, ra_bill_id     id, ra_bill_id
  description        action (submitted/approved/rejected)
  unit, quantity     actor_id, comments
  rate, amount       created_at

┌──────────────────────────────────────────────────────────┐
│ invoices (Client AR)                                     │
│  id, project_id, ra_bill_id                             │
│  invoice_number, amount                                 │
│  status (generated/sent/payment_pending/paid/reconciled)│
│  due_date, total_paid_amount                            │
└────┬──────────────────────────────────────────────────────┘
     │ 1
     │ *
invoice_payments
  id, invoice_id
  payment_date, amount
  payment_mode, bank_reference
  recorded_by_id
```

---

### 3.5 Procurement Chain

```
procurement_material_requests (MR)
  id, project_id, mr_number, title
  status (draft → pending_manager_approval → approved → rfq_generated → completed)
  required_date, priority
  submitted_by_id, approved_by_id
     │ 1
     │ *
procurement_material_request_items
  id, mr_id, item_name, category
  quantity, unit, specifications
  estimated_unit_cost

procurement_rfqs (RFQ)
  id, mr_id, project_id, rfq_number
  title, status, due_date, issue_date
  sent_to_vendor_count, quotes_received_count
  selected_quote_id
     │ 1        │ 1
     │ *        │ *
rfq_items      rfq_vendors
  id, rfq_id    id, rfq_id
  item_name     vendor_id
  quantity      status (invited/responded/declined)
  unit, specs   response_date

procurement_vendor_quotes
  id, rfq_id, vendor_id
  quote_number, total_amount
  delivery_days, payment_terms
  validity_date, status
     │ 1
     │ *
vendor_quote_items
  id, quote_id, rfq_item_id
  item_name, quantity, unit
  unit_price, total_price, tax_percent

procurement_purchase_orders (PO)
  id, rfq_id, quote_id, project_id
  po_number, vendor_id, total_amount
  status (draft→issued→acknowledged→in_transit→delivered→inspected→completed)
  issue_date, expected_delivery, actual_delivery
     │ 1
     │ *
po_items
  id, po_id, rfq_item_id
  item_name, quantity, unit, unit_price, total_price

procurement_material_receipts (GRN)
  id, po_id, project_id, vendor_id
  receipt_number, received_date
  delivery_note_number, vehicle_number
  photos (JSON), status
     │ 1
     │ *
receipt_items
  id, receipt_id, po_item_id
  item_name, ordered_qty, received_qty, unit
  condition (good/damaged/partial)

procurement_quality_inspections
  id, receipt_id, project_id
  inspection_number, inspection_date
  inspector_name, result (approved/rejected/partial)
  photos (JSON)
     │ 1
     │ *
inspection_items
  id, inspection_id, receipt_item_id
  item_name, quantity_checked
  quality_grade (A/B/C/Rejected)
  defect_description

procurement_inventory_items
  id, project_id, material_id
  item_name, category, unit
  quantity_on_hand, quantity_allocated, quantity_consumed
  quantity_on_order, minimum_stock, reorder_level
  average_cost, last_purchase_price
     │ 1
     │ *
inventory_transactions
  id, inventory_item_id
  transaction_type (goods_receipt/issue/return/adjustment)
  quantity, reference_id, reference_type
  notes, created_by_id
```

---

### 3.6 Vendor Finance (AP)

```
┌──────────────────────────────────────────────────────────────┐
│ vendor_invoices                                              │
│  id, project_id, vendor_id, po_id, vendor_ra_bill_id        │
│  invoice_number, vendor_invoice_number, invoice_date         │
│  gross_amount, tds_amount, gst_amount, net_payable           │
│  status (received→3way_match_pending→verified→pm_certified   │
│          →finance_verified→payment_approved→scheduled→paid)  │
│  matching_status (matched/discrepancy_found/resolved)        │
└──────────────────────────────────────────────────────────────┘
     │ 1                    │ 1
     │ *                    │ *
vendor_payments          ap_discrepancies
  id, vendor_invoice_id    id, vendor_invoice_id
  payment_number           discrepancy_type
  payment_date, amount     claimed_amount
  payment_mode             verified_amount
  bank_reference, utr      difference_amount
  from_bank_account        status, resolution_notes
```

---

### 3.7 Site Execution

```
daily_progress_reports (DPR)
  id, project_id, report_date
  weather, shift, work_summary
  work_location, status
  manpower_count, manpower_breakdown (JSON)
  materials_consumed (text), equipment (JSON), photos (JSON)
  site_issues (text)
  created_by_id

     ├─ site_attendance         (contractor/trade-wise headcount)
     │   id, project_id, dpr_id
     │   attendance_date, contractor_name, trade
     │   skilled_count, unskilled_count, supervisor_count
     │   total_labor_cost
     │
     ├─ site_material_logs       (consumption & stock)
     │   id, project_id, dpr_id
     │   material_name, category, unit
     │   opening_stock, received, consumed, closing_stock
     │   unit_cost, total_cost
     │
     ├─ site_equipment_logs      (plant & machinery)
     │   id, project_id, dpr_id
     │   equipment_name, status
     │   hours_operated, fuel_consumed_litres, daily_cost
     │
     ├─ site_work_progress       (activity vs. planned)
     │   id, project_id, dpr_id, task_id, milestone_id
     │   activity_name, unit
     │   planned_quantity, executed_today, cumulative_executed
     │   percent_completed
     │
     ├─ site_photos              (categorised image bank)
     │   id, project_id, dpr_id
     │   category (progress/quality/safety/defect/material/milestone)
     │   image_url, location, stage
     │
     └─ site_daily_costs         (petty cash, site overheads)
         id, project_id, dpr_id
         cost_type, description, amount
         vendor_or_payee, voucher_ref

site_workers                    (worker directory per project)
  id, project_id, name
  category (Skilled/Unskilled/Supervisor)
  trade, daily_wage_rate, status
     │ 1
     │ *
site_worker_attendance          (individual daily attendance)
  id, worker_id, project_id
  attendance_date
  status (present/half_day/absent)
  days_worked, payable_amount

site_quality_inspections        (QC checklists)
  id, project_id
  inspection_title, checklist_category
  status (passed/conditional_pass/failed)
  checkpoints_total, checkpoints_passed
  corrective_actions

site_safety_incidents           (HSSE records)
  id, project_id
  report_type (observation/near_miss/first_aid/toolbox_talk)
  severity (low/medium/high/critical)
  status (open/investigating/closed)

site_issues_delays              (delays & blockers)
  id, project_id
  category (material_shortage/weather_delay/drawing_design/...)
  days_impact, cost_impact
  status (open/in_progress/resolved/escalated)
```

---

### 3.8 Communications & System

```
notifications
  id, user_id, type, title, message
  is_read, action_url

communications
  id, project_id, lead_id
  type (email/phone/meeting/site_visit)
  subject, body
  created_by_id

meetings
  id, project_id, lead_id
  title, meeting_date, duration_minutes
  attendees (JSON), agenda, minutes
  created_by_id

audit_logs
  id, user_id, action
  entity_type, entity_id
  details (JSON), ip_address
  created_at

financial_audit_logs
  id, workflow_type (AR/AP)
  entity_type, entity_id
  action, previous_status, new_status
  user_id, comments, metadata (JSON)

company_settings
  id, organization_id
  company_name, gstin, pan
  address, city, state, pincode
  bank_name, account_number, ifsc
  logo_url, letterhead_url
  fiscal_year_start

task_templates
  id, name, project_type, description
     │ 1
     │ *
task_template_items
  id, template_id, title, description
  order, duration_days, priority
  category, dependencies (JSON)

vendors
  id, name, company_name
  contact_person, email, phone
  address, city, state
  gstin, pan, bank_details (JSON)
  categories (JSON), rating
  status (active/inactive/blacklisted)

materials (legacy master)
  id, name, category, unit
  quantity_on_hand, minimum_stock
  unit_cost, supplier
```

---

## 4. Status State Machines

### 4.1 Lead Status
```
new → active → won | lost | cancelled
```

### 4.2 Lead Stage
```
lead_creation → site_visit → drawings → boq → negotiation → finalization
```

### 4.3 Project Lifecycle Stage
```
setup → procurement → execution → billing → quality → handover → closed
```

### 4.4 Project Status
```
planning → active → on_hold | completed | cancelled
```

### 4.5 Material Request Status
```
draft → pending_manager_approval → approved → rfq_generated → completed
     → rejected (terminal)
```

### 4.6 RFQ Status
```
draft → sent → receiving_quotes → quotes_received → evaluated → completed
     → cancelled (terminal)
```

### 4.7 Purchase Order Status
```
draft → issued → acknowledged → in_transit → delivered → inspected → completed
     → cancelled (terminal)
```

### 4.8 RA Bill Status
```
draft → submitted → approved → payment_certified → invoice_generated → closed
     → revision_requested (back to draft)
```

### 4.9 Invoice Status
```
generated → sent → payment_pending → partially_paid → paid → reconciled → closed
         → overdue (parallel flag)
```

### 4.10 Vendor Invoice Status
```
received → 3way_match_pending → verified → pm_certified
        → finance_verified → payment_approved → scheduled → paid → reconciled
        → disputed (parallel state)
```

---

## 5. Index Recommendations

> The following indexes should be added for production performance:

```sql
-- Frequently filtered fields
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_stage ON leads(stage);
CREATE INDEX idx_leads_assigned_to ON leads(assigned_to_id);

CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_lifecycle_stage ON projects(lifecycle_stage);
CREATE INDEX idx_projects_pm ON projects(project_manager_id);

CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX idx_tasks_status ON tasks(status);

CREATE INDEX idx_mr_project ON procurement_material_requests(project_id);
CREATE INDEX idx_mr_status ON procurement_material_requests(status);

CREATE INDEX idx_po_project ON procurement_purchase_orders(project_id);
CREATE INDEX idx_po_vendor ON procurement_purchase_orders(vendor_id);
CREATE INDEX idx_po_status ON procurement_purchase_orders(status);

CREATE INDEX idx_ra_bills_project ON ra_bills(project_id);
CREATE INDEX idx_ra_bills_status ON ra_bills(status);

CREATE INDEX idx_invoices_project ON invoices(project_id);
CREATE INDEX idx_invoices_status ON invoices(status);

CREATE INDEX idx_dpr_project_date ON daily_progress_reports(project_id, report_date);
```

---

## 6. Migration Guide

```bash
# Generate migration from schema changes
pnpm --filter @workspace/db drizzle-kit generate

# Apply migrations
pnpm --filter @workspace/db drizzle-kit migrate

# Push schema directly (dev only)
pnpm --filter @workspace/db drizzle-kit push

# View migration history
ls lib/db/drizzle/
```

---

*Data Model v1.0 — Update this document whenever a table is added, modified, or deprecated.*
