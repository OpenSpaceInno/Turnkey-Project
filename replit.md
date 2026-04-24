# Kanak Turnkey Projects

A comprehensive Turnkey Project Management System for an Indian construction/EPC company. Covers the full operations lifecycle: sales pipeline (leads, BOQ, drawings, site visits, negotiations), project execution (projects, tasks, budgets, RA bills), finance (expenses, client invoices, vendor invoices with 3-way match, EMD/BG/Retention instruments), procurement (vendors, MR, RFQ with quotation comparison, PO, inventory), stakeholders, communications, meetings, documents, dashboard, role-based access, notifications, and audit logs.

## Architecture

- **Monorepo** managed with pnpm
- **API server** (Express 5 + Drizzle ORM + PostgreSQL) at `artifacts/api-server`
- **Web app** (React + Vite + wouter + tanstack-query + shadcn/ui + framer-motion + recharts) at `artifacts/kanak-turnkey`
- **OpenAPI contract** at `lib/api-spec/openapi.yaml`; codegen produces `@workspace/api-client-react` (React Query hooks) and `@workspace/api-zod` (zod schemas)
- **DB schema** lives in a single barrel file `lib/db/src/schema/index.ts`

## Auth model

Simple cached single-user session via `getCurrentUser()` in `artifacts/api-server/src/lib/session.ts`. Roles are seeded on the user and the active role can be switched via the topbar. No external auth provider.

## Theme

"Industrial Slate & Amber" with Plus Jakarta Sans + Spline Sans Mono. CSS variables defined in `artifacts/kanak-turnkey/src/index.css`.

## Conventions

- Numeric DB columns return strings from Drizzle — coerced to numbers in routes via `numKeys()` in `artifacts/api-server/src/lib/transforms.ts`
- Lead numbering: `LD-YYYYMMDD-XXXX` (count-based seq generated in `routes/leads.ts`)
- BOQ totals (subtotal, taxTotal, marginTotal, grandTotal) recomputed on item add/delete via `recomputeBoq()`
- Seed data is loaded automatically on first server start via `seedIfEmpty()` — only runs when the users table is empty

## Codegen workflow

```bash
pnpm --filter @workspace/api-spec run codegen   # regenerates client + zod
pnpm --filter @workspace/db run push            # pushes schema to PG
pnpm -w exec tsc -b lib/db                      # rebuild types after schema changes
```

## Create dialogs

CRUD entry points are split across:

- `artifacts/kanak-turnkey/src/components/dialogs/create-dialogs.tsx` — Lead, Project, Task
- `artifacts/kanak-turnkey/src/components/dialogs/finance-dialogs.tsx` — Expense, Invoice, VendorInvoice, FinancialInstrument
- `artifacts/kanak-turnkey/src/components/dialogs/procurement-dialogs.tsx` — Vendor, PurchaseOrder, RFQ, Material
- `artifacts/kanak-turnkey/src/components/dialogs/communication-dialogs.tsx` — Communication, Meeting, Document

All dialogs accept a `trigger` ReactNode prop, use TanStack Query to invalidate the relevant `getList*QueryKey` (and dashboard summary where applicable), and rely on the API server to auto-generate human-readable numbers (`INV-`, `VINV-`, `FI-`, `PO-`) via `artifacts/api-server/src/lib/numbers.ts`.
