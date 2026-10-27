# Business Requirements Document (BRD)
## Kanak TurnKey — v1.0

> Document Type: Business Requirements Document (BRD)
> Audience: Leadership, Product Head, Investors
> Last Updated: October 2026

---

## 1. Executive Summary

Kanak is a turnkey contracting company that manages projects end-to-end — from the first client enquiry through procurement, site execution, billing, and final handover. Historically, operations are tracked across disconnected spreadsheets, WhatsApp messages, and manual registers, causing:

- Delayed billing due to lost measurement records
- Material waste from poor inventory tracking
- Cash flow blindspots from unreconciled vendor payments
- No single source of truth for project health

**Kanak TurnKey** is the internal ERP/PLM system built to unify all these workflows onto a single platform, giving leadership, site engineers, procurement officers, and finance teams a shared, real-time view of every project.

---

## 2. Business Context

### 2.1 What Is a Turnkey Project?

A turnkey contract means Kanak takes **full ownership** of the project from design to handover. The client pays a fixed or milestone-based price and Kanak manages:
- Procurement of all materials
- Engagement and management of subcontractors
- Site execution and quality control
- Billing and financial instruments
- Final handover with a defect liability commitment

### 2.2 Current Pain Points

| Pain Point | Business Impact |
|---|---|
| Billing delays (measurement disputes) | Cash flow squeeze; delayed revenue recognition |
| No real-time procurement visibility | Material delays; project timeline slippage |
| Vendor payment disputes | Vendor relationship damage; legal risk |
| Manual BOQ and estimation | Errors in pricing; margin leakage |
| No lead pipeline tracking | Lost business; no sales forecast |
| Fragmented document management | Regulatory/audit risk; rework |
| No project P&L visibility | Cannot identify loss-making projects early |

---

## 3. Business Goals

| Goal ID | Goal | KPI / Measure of Success |
|---|---|---|
| BG-01 | Reduce billing cycle time | Invoice raised within 3 days of WCC approval (vs. 10+ days today) |
| BG-02 | Eliminate material shortages | Zero site stoppages due to material non-availability |
| BG-03 | Full AR/AP visibility | Outstanding balance per project available in real-time |
| BG-04 | Lead-to-project traceability | Every project linked to its originating lead with commercial terms |
| BG-05 | Single source of truth | All project data in one system; no parallel spreadsheets |
| BG-06 | Reduce vendor payment disputes | 3-way matching catches all discrepancies before payment |
| BG-07 | Executive dashboard | MD/leadership can see live portfolio health on one screen |

---

## 4. Stakeholders

| Stakeholder | Role | Primary Interest |
|---|---|---|
| MD / Owner | Executive | Portfolio health, cash flow, profitability |
| Project Manager (PM) | Operational | Project delivery, team management, billing |
| Site Engineer | Execution | DPR, task tracking, measurement records |
| Accountant | Finance | AR/AP, invoice reconciliation, payments |
| Procurement Officer | Supply Chain | MR approval, RFQ, PO, GRN, inventory |
| Vendor | External | PO acknowledgment, invoice submission |
| Client | External (future) | Project status, invoice receipt |
| Auditor | Compliance | Audit trail, financial records |

---

## 5. Scope

### 5.1 In Scope (v1.0)

- Lead pipeline management (CRM)
- Project lifecycle management
- Full procurement cycle (MR → RFQ → Quote → PO → GRN → QC → Inventory)
- Site execution (DPR, attendance, materials, equipment, safety, quality)
- Accounts Receivable (client billing via RA Bills and invoices)
- Accounts Payable (vendor billing, 3-way matching, payments)
- Role-based access control
- Audit logging
- Document management
- Internal notifications

### 5.2 Out of Scope (v1.0 — Future Phases)

- Client-facing portal
- Email delivery of invoices/RFQs
- Mobile app (PWA)
- GST return filing integration
- Accounting software integration (Tally/QuickBooks)
- Multi-company / multi-tenant support
- AI-powered BOQ estimation

---

## 6. Business Rules

| Rule ID | Rule |
|---|---|
| BR-01 | A project can only be created after a lead reaches the "won" status |
| BR-02 | All material requests above a defined threshold require PM approval |
| BR-03 | A Purchase Order cannot be issued without at least one valid vendor quote |
| BR-04 | An RA Bill cannot be invoiced without PM approval |
| BR-05 | A vendor invoice can only be paid after 3-way matching (PO + GRN + Invoice) |
| BR-06 | Financial data (budgets, invoices, payments) is visible only to Admin, PM, and Accountant roles |
| BR-07 | A user cannot approve their own RA Bill (self-approval prevention) |
| BR-08 | Retention and ABG are tracked against each contract and released only at project closure |
| BR-09 | All DLP (Defect Liability Period) tracking begins from handover date |
| BR-10 | All audit-sensitive actions (approve, reject, pay) must be logged with user and timestamp |

---

## 7. Success Criteria

The system is considered successfully deployed when:

1. All active projects are tracked in the system (not in spreadsheets)
2. RA bill preparation time reduces by 60%
3. Zero unbilled work completions older than 7 days
4. Procurement officer can generate a PO from an MR without leaving the system
5. MD can view portfolio health on the dashboard within 30 seconds of login

---

## 8. Future Business Vision

### Phase 2 — Enhanced Operations (2027)
- Site team uses the system daily on mobile devices (PWA)
- All vendor RFQs sent and responded to within the system
- Cash flow projected weekly based on billing milestones

### Phase 3 — Platform Business (2028)
- Multiple companies (tenants) using the platform
- Industry adapters for Furniture, Interiors, Landscaping
- Kanak becomes the platform provider — not just the user

---

*BRD v1.0 — Approved for implementation. Review at Phase 1 completion.*
