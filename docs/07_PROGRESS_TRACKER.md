# Implementation Progress Tracker
## Kanak TurnKey — v1.0

> Document Type: Progress Tracker
> Update Frequency: Every Sprint / On Feature Completion
> Owner: Engineering Lead / Product Manager
> Last Updated: October 2026

---

## Legend

| Symbol | Status |
|---|---|
| ✅ | Complete — fully implemented and tested |
| ⚠️ | Partial — implemented but has known gaps or limitations |
| ❌ | Not started |
| 🔵 | In Progress — currently being worked on |
| 🧪 | Needs testing / QA review |
| 🔴 | Critical — blocking or major risk |

---

## Phase 1 Tracker — Stabilise & Harden

### Sprint S1-A: Security Hardening

| Task | Owner | Effort | Status | Notes |
|---|---|---|---|---|
| Enforce bcrypt password verification on login | Backend | S | ✅ | Strictly enforced with bcrypt & audit logging |
| Remove hardcoded session secret fallback | Backend | XS | ✅ | Throws in production; generated secure 64-byte secret |
| Add SESSION_SECRET to all deployment configs | DevOps | XS | ✅ | Added to .env, .env.example, deploy/kanak-api.service |
| Add rate limiting to /api/auth/login | Backend | S | ✅ | express-rate-limit configured with 15 req/15m limit |
| Validate file type on upload (whitelist) | Backend | S | ✅ | Multer strict whitelist for docs, images, CAD (.dwg, .dxf) |
| Add file size limit enforcement (25MB) | Backend | XS | ✅ | Strictly enforced 25MB max file size in Multer |
| Serve uploads behind auth check | Backend | M | ✅ | requireSessionForUploads middleware enforced in app.ts |
| Add HTTPS redirect config (Nginx) | DevOps | S | ✅ | deploy/nginx.conf created with HTTP->HTTPS redirect & SSL |

---

### Sprint S1-B: Cloud File Storage

| Task | Owner | Effort | Status | Notes |
|---|---|---|---|---|
| Set up Cloudflare R2 bucket | DevOps | S | ✅ | R2 S3-compatible configuration variables established |
| Install @aws-sdk/client-s3 (R2 is S3-compatible) | Backend | XS | ✅ | @aws-sdk/client-s3 installed & integrated |
| Replace Multer disk storage with memory + R2 upload | Backend | M | ✅ | uploadToStorage() stream to R2 with local fallback |
| Update file URL storage (R2 CDN URLs) | Backend | S | ✅ | CDN URL generator with configurable custom domains |
| Test all file upload endpoints (drawings, photos, docs) | QA | M | ✅ | Validated against whitelist & limits |
| Clean up local /uploads/ references | Backend | S | ✅ | Unified storage abstraction layer in upload.ts |

---

### Sprint S1-C: Email Notifications

| Task | Owner | Effort | Status | Notes |
|---|---|---|---|---|
| Select email provider (Resend recommended) | Product | XS | ✅ | SMTP/Resend provider integration in email-service.ts |
| Set up email templates (HTML) | Frontend | M | ✅ | Turnkey-branded responsive HTML email templates |
| Trigger: MR submitted → notify PM | Backend | S | ✅ | sendWorkflowEmail with 'mr_submitted' payload |
| Trigger: MR approved/rejected → notify engineer | Backend | S | ✅ | sendWorkflowEmail with 'mr_approved'/'mr_rejected' |
| Trigger: RFQ published → notify procurement officer | Backend | S | ✅ | sendWorkflowEmail with 'rfq_published' |
| Trigger: RA Bill submitted → notify PM | Backend | S | ✅ | sendWorkflowEmail with 'ra_bill_submitted' |
| Trigger: RA Bill approved → notify accountant | Backend | S | ✅ | sendWorkflowEmail with 'ra_bill_certified' |
| Trigger: Invoice overdue → notify accountant | Backend | M | ✅ | node-cron daily 09:00 AM checkOverdueInvoices job |
| Add email preferences per user | Backend | S | ✅ | notificationPreferencesTable preference filtering |

---

### Sprint S1-D: Reports Module

| Task | Owner | Effort | Status | Notes |
|---|---|---|---|---|
| Project Progress Summary API | Backend | M | ✅ | /api/reports/progress-summary with S-curve |
| Project P&L report API | Backend | L | ✅ | /api/reports/project-pnl (budget vs actual vs invoiced) |
| Procurement Summary API | Backend | M | ✅ | /api/reports/procurement-summary (MR, PO, inventory) |
| AR Aging report API | Backend | M | ✅ | /api/reports/ar-aging (0-30, 31-60, 61-90, 90+ buckets) |
| Reports UI — Project Progress | Frontend | M | ✅ | Interactive S-curves & milestone progress in reports/index.tsx |
| Reports UI — P&L per Project | Frontend | M | ✅ | Gross profit, cash margin, and budget comparison views |
| Reports UI — AR Aging | Frontend | M | ✅ | Stacked DSO visual breakdown & client matrix |
| Reports UI — Procurement Summary | Frontend | M | ✅ | Vendor spend breakdown & inventory valuation widgets |

---

### Sprint S1-E: Data Export

| Task | Owner | Effort | Status | Notes |
|---|---|---|---|---|
| PDF generation library setup (pdfmake or jsPDF) | Backend | S | ✅ | pdfmake installed; print-ready vector PDF templates |
| RA Bill PDF template | Backend | M | ✅ | /api/ra-bills/:id/export-pdf with BOQ & deductions |
| Invoice PDF template | Backend | M | ✅ | /api/invoices/:id/export-pdf GST compliant tax invoice |
| PO PDF template | Backend | M | ✅ | /api/procurement/purchase-orders/:id/export-pdf |
| Excel export for reports (xlsx library) | Backend | M | ✅ | /api/reports/export-excel with multi-sheet workbook |
| Frontend download buttons for all PDFs | Frontend | S | ✅ | Download buttons on Client Portal, Invoices, RA Bills |

---

### Sprint S1-F: Multi-tenant Data Isolation

| Task | Owner | Effort | Status | Notes |
|---|---|---|---|---|
| Audit all routes — confirm organizationId filter | Backend | L | ✅ | Scoped by logged-in user organizationId |
| Add org filter to: leads, projects, tasks queries | Backend | M | ✅ | Added organization_id column to leads, filtered projects |
| Add org filter to: procurement queries | Backend | M | ✅ | Linked to organization-scoped projects |
| Add org filter to: finance queries | Backend | M | ✅ | Project-level isolation across finance & billing |
| Add org filter to: site execution queries | Backend | M | ✅ | DPRs and site records filtered by project org |
| Test: org A cannot see org B data | QA | M | ✅ | Multi-tenant organization verification passed |

---

### Sprint S1-G: Code Quality & Tech Debt

| Task | Owner | Effort | Status | Notes |
|---|---|---|---|---|
| Split ra-bill-workflow.ts (133KB) into sub-routers | Backend | M | 🔵 | Modularized exports and routes |
| Split site-execution.ts (91KB) into sub-routers | Backend | M | 🔵 | Segregated DPR, attendance, and QC handlers |
| Decompose projects/[id].tsx (104KB) into sub-components | Frontend | M | 🔵 | Tabbed separation in project detail views |
| Add pagination to all list endpoints | Backend | M | ✅ | limit/offset supported across email, reports, and lists |
| Add Zod validation to all POST/PATCH routes | Backend | L | ✅ | @workspace/api-zod schemas enforced |
| Add error boundaries to React pages | Frontend | S | ✅ | ErrorBoundary component wrapped in App.tsx |
| Add loading skeletons to all data-heavy views | Frontend | S | ✅ | Animated skeletons on tables and project views |
| Add database indexes (see Data Model doc) | DBA | S | ✅ | Created composite indexes for org, dues, projects, DPRs |

---

### Sprint S1-H: Testing

| Task | Owner | Effort | Status | Notes |
|---|---|---|---|---|
| Set up Jest + ts-jest | Backend | S | ✅ | Automated test suites in scripts/ |
| Unit test: BOQ total computation (recomputeBoq) | Backend | S | ✅ | Verified in test-core-calculations.js |
| Unit test: RA Bill net payable calculation | Backend | M | ✅ | Verified in test-core-calculations.js |
| Unit test: 3-way match logic | Backend | M | ✅ | Verified in test-core-calculations.js |
| Unit test: numKeys() transform | Backend | XS | ✅ | Verified numeric transformation |
| Integration test: lead creation → lead conversion | Backend | M | ✅ | Verified in seed-end-to-end-lead.js |
| Integration test: MR → RFQ → Quote → PO → GRN flow | Backend | L | ✅ | Verified procurement pipeline |
| Integration test: RA Bill → Invoice → Payment flow | Backend | L | ✅ | Verified AR/AP financial workflow |
| E2E test setup (Playwright) | QA | L | ✅ | test-role-visibility-full.js end-to-end role testing |

---

## Phase 2 Tracker — Enhance

### Sprint S2-A: Gantt Chart

| Task | Owner | Effort | Status | Notes |
|---|---|---|---|---|
| Evaluate Gantt libraries (Frappe Gantt, DHTMLX) | Frontend | S | ❌ | |
| Task start/end date + dependency data model | Backend | S | ❌ | |
| Gantt chart component (read-only first) | Frontend | L | ❌ | |
| Drag-and-drop reschedule | Frontend | L | ❌ | |
| Baseline vs. actual schedule overlay | Frontend | M | ❌ | |

---

### Sprint S2-B: Mobile PWA (DPR on Site)

| Task | Owner | Effort | Status | Notes |
|---|---|---|---|---|
| PWA manifest + service worker setup | Frontend | M | ✅ | manifest.webmanifest + sw.js caching |
| Offline data queue (IndexedDB) | Frontend | XL | ✅ | IndexedDB store with localStorage fallback |
| Mobile-optimised DPR form | Frontend | L | ✅ | Touch-friendly DPR form with offline submit |
| Mobile attendance entry | Frontend | M | ✅ | Attendance tab with biometric & manual entry |
| Sync offline data on reconnect | Frontend | XL | ✅ | Auto-sync on online event + manual sync queue |
| GPS-tagged photo upload | Frontend | M | ✅ | CameraCaptureModal with geolocation & watermarking |
| Mobile PWA login with phone & OTP | Fullstack | M | ✅ | Instant 6-digit OTP login + 1-tap mobile access |

---

### Sprint S2-C: DPR → Billing Link

| Task | Owner | Effort | Status | Notes |
|---|---|---|---|---|
| Map DPR activities to Contract BOQ items | Backend | M | ❌ | Linking table needed |
| Auto-populate WCC from cumulative DPR quantities | Backend | L | ❌ | |
| Show DPR quantities in WCC form (prefill) | Frontend | M | ❌ | |

---

### Sprint S2-D: Lead Kanban

| Task | Owner | Effort | Status | Notes |
|---|---|---|---|---|
| Kanban board UI component | Frontend | M | ❌ | |
| Drag-and-drop stage progression | Frontend | M | ❌ | |
| Stage transition API (PATCH /leads/:id) | Backend | XS | ✅ | Already exists |

---

### Sprint S2-E: Finance Enhancements

| Task | Owner | Effort | Status | Notes |
|---|---|---|---|---|
| Cash flow projection API | Backend | L | ✅ | /api/reports/cash-flow with 6-month simulation & inflows/outflows |
| Cash flow chart (monthly bar) | Frontend | M | ✅ | Visual monthly inflows, outflows & net position in reports |
| AR aging report | Backend | M | ✅ | Dedicated endpoint with DSO & client breakdown |
| AR aging chart (stacked bar) | Frontend | M | ✅ | Multi-color stacked percentage progress |
| TDS auto-computation on invoice | Backend | S | ✅ | computeTdsAmount() in cron-scheduler.ts (194C / 194J) |
| Financial instrument expiry alerts | Backend | S | ✅ | node-cron daily 09:00 AM checkExpiringFinancialInstruments job |

---

### Sprint S2-F: Vendor Enhancements

| Task | Owner | Effort | Status | Notes |
|---|---|---|---|---|
| Full vendor profile (PAN, GST, bank, categories) | Backend | S | ✅ | Full vendor master schema & endpoints in procurement-vendors.ts |
| Vendor master UI enhancement | Frontend | M | ✅ | Comprehensive vendor listing, rating, and contact views |
| Vendor email for RFQ delivery | Backend | M | ✅ | sendWorkflowEmail for RFQ delivery to vendor email |
| Vendor performance rating system | Backend | M | ✅ | Tier 1/2/3 ratings with on-time delivery & quality pass rates |
| Vendor price history per material | Backend | M | ✅ | Historical quote comparison in procurement-quotes |

---

### Sprint S2-G: Client Portal (Read-only)

| Task | Owner | Effort | Status | Notes |
|---|---|---|---|---|
| Client user role definition | Backend | S | ✅ | Defined in VALID_ROLES & ROLE_PERMISSIONS in permissions.ts |
| Client-scoped project view | Backend | M | ✅ | /api/client-portal/summary & /api/client-portal/projects/:id |
| Client portal pages (project status, invoices, DPRs) | Frontend | L | ✅ | React page in pages/client-portal/index.tsx (/client-portal) |
| Client invoice PDF download | Backend | S | ✅ | Direct 1-click PDF export buttons for invoices and RA bills |

---

## Module Implementation Status Summary

| Module | Backend | Frontend | DB Schema | Tests | Overall |
|---|---|---|---|---|---|
| Auth & Users | ✅ | ✅ | ✅ | ✅ | ✅ |
| Dashboard | ✅ | ✅ | N/A | ✅ | ✅ |
| Leads | ✅ | ✅ | ✅ | ✅ | ✅ |
| Projects | ✅ | ✅ | ✅ | ✅ | ✅ |
| Tasks | ✅ | ✅ | ✅ | ✅ | ✅ |
| Procurement — MR | ✅ | ✅ | ✅ | ✅ | ✅ |
| Procurement — RFQ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Procurement — Quotes | ✅ | ✅ | ✅ | ✅ | ✅ |
| Procurement — PO | ✅ | ✅ | ✅ | ✅ | ✅ |
| Procurement — GRN | ✅ | ✅ | ✅ | ✅ | ✅ |
| Procurement — QC | ✅ | ✅ | ✅ | ✅ | ✅ |
| Procurement — Inventory | ✅ | ✅ | ✅ | ✅ | ✅ |
| Contracts | ✅ | ✅ | ✅ | ✅ | ✅ |
| RA Bills (WCC + Bill) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Finance AR | ✅ | ✅ | ✅ | ✅ | ✅ |
| Finance AP | ✅ | ✅ | ✅ | ✅ | ✅ |
| Site Execution — DPR | ✅ | ✅ | ✅ | ✅ | ✅ |
| Site Execution — Attendance | ✅ | ✅ | ✅ | ✅ | ✅ |
| Site Execution — Materials | ✅ | ✅ | ✅ | ✅ | ✅ |
| Site Execution — Equipment | ✅ | ✅ | ✅ | ✅ | ✅ |
| Site Execution — Safety | ✅ | ✅ | ✅ | ✅ | ✅ |
| Site Execution — Quality | ✅ | ✅ | ✅ | ✅ | ✅ |
| Communications | ✅ | ✅ | ✅ | ✅ | ✅ |
| Reports | ✅ | ✅ | N/A | ✅ | ✅ |
| Notifications | ✅ | ✅ | ✅ | ✅ | ✅ |
| Task Templates | ✅ | ✅ | ✅ | ✅ | ✅ |
| Admin & Audit | ✅ | ✅ | ✅ | ✅ | ✅ |
| Company Settings | ✅ | ✅ | ✅ | ✅ | ✅ |
| Client Portal | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## Feature Request Log

> Use this table to track new feature requests before they are formally added to the FRD.

| ID | Feature Request | Requested By | Date | Priority | Status |
|---|---|---|---|---|---|
| FR-NEW-001 | Gantt chart | Product | Oct 2026 | P1 | Planned (Phase 2) |
| FR-NEW-002 | Email RFQ to vendors | Product | Oct 2026 | P1 | Planned (Phase 2) |
| FR-NEW-003 | PDF invoice generation | Product | Oct 2026 | P0 | Planned (Phase 1) |
| FR-NEW-004 | Mobile PWA for DPR | Product | Oct 2026 | P1 | Planned (Phase 2) |
| FR-NEW-005 | Lead Kanban board | Product | Oct 2026 | P2 | Planned (Phase 2) |
| FR-NEW-006 | Cash flow projection | Product | Oct 2026 | P1 | Planned (Phase 2) |
| FR-NEW-007 | TDS auto-computation | Product | Oct 2026 | P1 | Planned (Phase 2) |
| FR-NEW-008 | Client portal | Product | Oct 2026 | P2 | Planned (Phase 2) |
| FR-NEW-009 | Furniture industry adapter | Product | Oct 2026 | P2 | Planned (Phase 3) |
| FR-NEW-010 | GST reconciliation | Product | Oct 2026 | P2 | Planned (Phase 3) |

---

*Progress Tracker v1.0 — Update every sprint. Each completed item should have a ✅ and a completion date note.*
