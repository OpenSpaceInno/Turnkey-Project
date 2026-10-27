# Phased Roadmap
## Kanak TurnKey — v1.0

> Document Type: Product Roadmap
> Audience: Leadership, Product, Engineering
> Last Updated: October 2026
> Review Cycle: Quarterly

---

## Vision Statement

> **"Kanak TurnKey will be the definitive operating system for turnkey contracting businesses — tracking every rupee, every brick, and every day from first enquiry to final handover."**

---

## Strategic Pillars

| Pillar | Description |
|---|---|
| **Lifecycle Coverage** | One platform for the complete project lifecycle — no parallel spreadsheets |
| **Financial Precision** | Every payment, deduction, and reconciliation tracked and auditable |
| **Site Intelligence** | Real-time visibility of on-ground progress from any device |
| **Extensibility** | The platform adapts to any project-based industry |

---

## Effort Legend

| Symbol | Size | Engineering Effort |
|---|---|---|
| XS | Extra Small | < 1 day |
| S | Small | 1-3 days |
| M | Medium | 3-7 days |
| L | Large | 1-3 weeks |
| XL | Extra Large | 1-2 months |

---

## Phase 1: Stabilise & Harden
**Timeline:** Q4 2026 — Q1 2027 (3 months)
**Goal:** Production-ready for Kanak's internal use.

> **Scope freeze in effect.** No new features until Phase 1 is complete.

### 1.1 Security & Auth

| Item | Effort | Priority | Sprint |
|---|---|---|---|
| Enforce password auth (bcrypt verify) | S | 🔴 Critical | S1-A |
| Remove hardcoded session secret | XS | 🔴 Critical | S1-A |
| Rate limiting on login endpoint | S | P0 | S1-A |
| File type validation on upload | S | P0 | S1-A |
| File size limit enforcement | XS | P0 | S1-A |
| Authenticated file serving | M | P0 | S1-A |

### 1.2 Cloud Infrastructure

| Item | Effort | Priority | Sprint |
|---|---|---|---|
| Cloudflare R2 bucket setup | S | 🔴 Critical | S1-B |
| Replace local disk with R2 for all uploads | M | 🔴 Critical | S1-B |
| Docker Compose setup (api + frontend + db) | M | P0 | S1-B |
| Environment variable hardening (.env → secrets) | S | P0 | S1-B |
| Redis-backed sessions (replace cookie-session) | M | P1 | S1-B |

### 1.3 Email Notifications

| Item | Effort | Priority | Sprint |
|---|---|---|---|
| Resend (or SMTP) integration | S | P0 | S1-C |
| Email templates (HTML branded) | M | P0 | S1-C |
| Workflow triggers: MR, RA Bill, Invoice events | M | P0 | S1-C |
| Overdue invoice daily digest | M | P1 | S1-C |

### 1.4 Reports Module

| Item | Effort | Priority | Sprint |
|---|---|---|---|
| Project Progress Summary | M | P0 | S1-D |
| Project P&L Report | L | P0 | S1-D |
| AR Aging Report | M | P1 | S1-D |
| Procurement Summary | M | P1 | S1-D |

### 1.5 Data Export

| Item | Effort | Priority | Sprint |
|---|---|---|---|
| PDF: RA Bill and Invoice | M | P0 | S1-E |
| PDF: Purchase Order | M | P1 | S1-E |
| Excel: Report exports | M | P1 | S1-E |
| Snag list PDF | S | P2 | S1-E |

### 1.6 Multi-tenant Data Isolation

| Item | Effort | Priority | Sprint |
|---|---|---|---|
| Add organizationId filter to all DB queries | L | 🔴 Critical | S1-F |
| Test org isolation (org A cannot see org B) | M | P0 | S1-F |

### 1.7 Code Quality

| Item | Effort | Priority | Sprint |
|---|---|---|---|
| Split large route files (ra-bill, site-execution) | M | P1 | S1-G |
| Decompose large React pages (projects, finance) | M | P1 | S1-G |
| Add pagination to all list endpoints | M | P1 | S1-G |
| Add Zod validation to all routes | L | P1 | S1-G |
| Add database indexes | S | P1 | S1-G |

### 1.8 Testing

| Item | Effort | Priority | Sprint |
|---|---|---|---|
| Unit tests: financial computations | M | P0 | S1-H |
| Integration tests: core workflows | L | P0 | S1-H |
| E2E tests: critical paths | L | P1 | S1-H |

### Phase 1 Success Criteria

- All active projects managed in system (no spreadsheets)
- RA Bill to Invoice cycle fully functional with PDF output
- No unauthorised data access (org isolation enforced)
- Uptime: 99.5% on a hosted server
- All files stored in cloud storage (not local disk)
- Core workflows covered by automated tests

---

## Phase 2: Enhance
**Timeline:** Q2 2027 — Q3 2027 (6 months)
**Goal:** Add high-value capabilities that site teams and management need daily.

### 2.1 Gantt Chart

| Item | Effort | Description |
|---|---|---|
| Gantt library integration | L | Frappe Gantt or DHTMLX |
| Read-only Gantt with task data | M | Based on task start/end dates |
| Drag-and-drop rescheduling | L | Update task dates on drag |
| Baseline vs. revised overlay | M | Show original vs. current plan |
| Critical path highlighting | L | Longest path calculation |

### 2.2 Mobile PWA (DPR on Site)

| Item | Effort | Description |
|---|---|---|
| PWA manifest + service worker | M | Install on Android/iOS |
| Offline DPR form (IndexedDB queue) | XL | Submit DPR without internet |
| Mobile-optimised UI | L | Touch-friendly forms |
| GPS-tagged photo upload | M | Coordinates attached to photos |
| Offline sync on reconnect | XL | Merge offline queue with server |

### 2.3 DPR → Billing Bridge

| Item | Effort | Description |
|---|---|---|
| Map DPR activities to BOQ items | M | Linking configuration |
| Auto-populate WCC from DPR quantities | L | Cumulative DPR → WCC prefill |
| S-Curve: planned vs. actual chart | M | Per-project progress over time |

### 2.4 Lead Kanban

| Item | Effort | Description |
|---|---|---|
| Kanban board component | M | Drag-drop leads across stages |
| Stage change validation | S | Business rules on stage jump |
| Lead activity quick-log from board | S | Log activity without opening lead |

### 2.5 Finance Enhancements

| Item | Effort | Description |
|---|---|---|
| Cash flow projection | L | Month-wise projected receipts vs. payments |
| Financial instrument expiry alerts | S | 30-day expiry warning |
| TDS auto-computation | S | Based on applicable TDS section |
| AR aging report + chart | M | 0-30, 31-60, 61-90, 90+ buckets |
| Project P&L drill-down | M | Category-wise cost breakdown |

### 2.6 Vendor Enhancements

| Item | Effort | Description |
|---|---|---|
| Full vendor profile (PAN, GST, bank) | S | Enriched vendor master |
| Vendor email RFQ delivery | M | Auto-email RFQ PDF to vendor |
| Vendor performance rating | M | Rate vendors after each PO cycle |
| Vendor price history | M | Track rates over time per material |

### 2.7 Client Portal

| Item | Effort | Description |
|---|---|---|
| Client user role | S | Read-only restricted role |
| Project status view for client | M | Progress, milestones, key dates |
| Invoice history for client | M | Download invoices |
| DPR summary for client | M | Weekly summary view |

### 2.8 Advanced Site Execution

| Item | Effort | Description |
|---|---|---|
| QR code attendance scan | M | Workers scan QR on site entry |
| Subcontractor daily measurement sheets (JMR) | L | Separate sub-con tracking |
| Safety toolbox talk templates | S | Standard toolbox talk records |
| QA checklist templates per work category | M | Civil, MEP, Finishing checklists |

### Phase 2 Success Criteria

- Site engineers submit DPRs from mobile on-site
- PMs can view and adjust project schedule on Gantt
- All vendor RFQs delivered by email from the system
- Cash flow projection available for next 3 months
- Client portal live for at least 2 active projects

---

## Phase 3: Scale & Generalise
**Timeline:** Q4 2027 — 2028
**Goal:** Multi-tenant SaaS platform with industry adapters.

### 3.1 Multi-tenancy

| Item | Effort | Description |
|---|---|---|
| Full org isolation at DB level | XL | Row-level security per org |
| Custom subdomain per org | L | org.kanak-turnkey.com |
| Org onboarding flow | L | Self-service setup |
| Billing per org (subscription) | L | Stripe integration |
| Org admin role | M | Org-level admin vs. system admin |

### 3.2 Industry Adapters

| Item | Effort | Description |
|---|---|---|
| Industry configuration model | XL | Project type, stages, BOQ categories, billing model |
| Furniture Manufacturing adapter | XL | BoM-based workflow, production log |
| Interiors Fit-out adapter | L | Drawing revisions, snag workflow |
| Landscaping adapter | L | Plant schedule, irrigation tracking |
| Custom industry builder | XL | Admin can configure any industry |

### 3.3 Analytics Platform

| Item | Effort | Description |
|---|---|---|
| Cross-project KPI dashboard | XL | Portfolio-level analytics |
| Project benchmarking | L | Compare against historical projects |
| Predictive delay detection | XL | ML model: S-curve pattern analysis |
| Cost anomaly detection | XL | Flag unusual expense patterns |
| Embedded BI (Metabase or Superset) | XL | Advanced ad-hoc analysis |

### 3.4 AI Capabilities

| Item | Effort | Description |
|---|---|---|
| BOQ estimation from drawings (AI) | XL | OCR drawing → extract dimensions → suggest BOQ |
| Invoice anomaly detection | XL | Flag vendor invoices with unusual patterns |
| Schedule risk prediction | XL | Predict delays from DPR patterns |
| Smart next actions | M | AI-suggested next step per project stage |

### 3.5 Integrations

| Item | Effort | Description |
|---|---|---|
| Tally ERP sync | L | Export payment vouchers to Tally |
| QuickBooks / Zoho Books sync | L | Two-way financial sync |
| GSTN portal integration | L | Auto-fetch GSTR-2A for reconciliation |
| WhatsApp notifications | M | WhatsApp Business API alerts |
| Native mobile app (React Native) | XL | iOS + Android native app |
| AutoCAD / BIM integration | XL | Drawing import → BOQ extraction |

---

## Backlog (Unscheduled)

| Item | Priority | Description |
|---|---|---|
| Drawing version compare (visual diff) | P2 | Side-by-side drawing version comparison |
| Risk register per project | P2 | Log, track, and mitigate project risks |
| EVM metrics (SPI, CPI, EAC) | P2 | Earned Value Management calculations |
| BIM integration | P3 | Link 3D model elements to tasks/BOQ |
| Supply chain analytics | P3 | Supplier performance, price trends |
| Carbon footprint tracker | P3 | Track material carbon intensity |
| Drone integration | P3 | Drone survey images → progress estimation |

---

## Roadmap Timeline Visual

```
2026 Q4          2027 Q1          2027 Q2          2027 Q3          2027 Q4          2028
|                |                |                |                |                |
|═══════════════════════════════|                                                   |
|   PHASE 1: Stabilise                                                              |
|   Security | Cloud | Email | Reports | Export | Tests                            |
|                                |═══════════════════════════════|                 |
|                                |   PHASE 2: Enhance            |                 |
|                                |   Gantt | PWA | Finance | Vendor | Client Portal  |
|                                                                |══════════════════|
|                                                                | PHASE 3: Scale  |
|                                                                | Multi-tenant    |
|                                                                | Industry Adapters|
|                                                                | AI / Analytics  |
```

---

## Quarterly Review Template

At the end of each quarter, review:

1. **Completed features** — What shipped vs. what was planned?
2. **Slippage** — What was delayed and why?
3. **New requests** — What came from users during the quarter?
4. **Priority adjustments** — Anything to pull forward or push back?
5. **Roadmap update** — Update this document with revised timeline.

---

*Roadmap v1.0 — Phase 1 scope is frozen. Phase 2+ items subject to quarterly review.*
