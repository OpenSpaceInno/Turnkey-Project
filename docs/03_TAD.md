# Technical Architecture Document (TAD)
## Kanak TurnKey — v1.0

> Document Type: Technical Architecture Document
> Audience: Solution Architect, Engineering Team
> Last Updated: October 2026

---

## 1. System Overview

Kanak TurnKey is a **full-stack TypeScript monorepo** built as a single-page React application (SPA) communicating with a REST API backed by MySQL.

```
┌───────────────────────────────────────────────────────────────────┐
│                       CLIENT BROWSER                              │
│                                                                   │
│  React 18 SPA (Vite 7)                    Port: 5173             │
│  ┌─────────────┐  ┌──────────────────┐  ┌───────────────────┐   │
│  │  Wouter     │  │  TanStack Query  │  │  shadcn/ui        │   │
│  │  (Routing)  │  │  (Data Cache)    │  │  + Tailwind CSS   │   │
│  └──────┬──────┘  └────────┬─────────┘  └───────────────────┘   │
│         └──────────────────┴────────────────────┐               │
│              api-client-react (auto-generated)   │               │
└──────────────────────────────────────────────────┼───────────────┘
                                                   │ HTTP/REST
                                          (Vite proxy in dev)
                                                   │
┌──────────────────────────────────────────────────┼───────────────┐
│                     API SERVER                   │               │
│                                                               │
│  Express 5 + TypeScript (ESM)             Port: 3000          │
│  ┌────────────────────────────────────────────────────────┐   │
│  │  Middleware Stack:                                     │   │
│  │  pino-http → cors → express.json → cookieSession       │   │
│  │  → multer (uploads) → /api router                     │   │
│  └─────────────────────────────────┬──────────────────────┘   │
│                                    │                           │
│  Route Modules (30+):              │                           │
│  auth, dashboard, leads, projects, │                           │
│  procurement-*, finance, ra-bill,  │                           │
│  ar-workflow, ap-workflow,         │                           │
│  site-execution, ...               │                           │
│                                    │ Drizzle ORM               │
└────────────────────────────────────┼───────────────────────────┘
                                     │
┌────────────────────────────────────┴───────────────────────────┐
│                        MYSQL 8                                  │
│                                              Port: 3306        │
│  Database: turnkey_db                                          │
│  ~50 tables | Managed via Drizzle Migrate                      │
└────────────────────────────────────────────────────────────────┘
```

---

## 2. Monorepo Structure

```
TurnKey Project/
├── package.json               # Root workspace config
├── pnpm-workspace.yaml        # Workspace package definitions
├── tsconfig.base.json         # Shared TS config
├── .env                       # Environment variables
│
├── artifacts/
│   ├── api-server/            # Express REST API
│   │   ├── src/
│   │   │   ├── index.ts       # Entry point (port binding, seed)
│   │   │   ├── app.ts         # Express app (middleware setup)
│   │   │   ├── routes/        # 30+ route modules
│   │   │   ├── lib/           # Helpers: session, permissions, transforms
│   │   │   ├── middlewares/   # Custom middleware
│   │   │   └── seed.ts        # Database seeding (66KB)
│   │   ├── build.mjs          # esbuild bundler config
│   │   └── package.json
│   │
│   └── kanak-turnkey/         # React SPA Frontend
│       ├── src/
│       │   ├── App.tsx        # Root component + routing
│       │   ├── pages/         # Page-level components (17+ directories)
│       │   ├── components/    # Shared components (ui, layout, auth, dialogs)
│       │   ├── hooks/         # Custom React hooks
│       │   ├── lib/           # Frontend utilities
│       │   └── index.css      # Global styles
│       ├── vite.config.ts     # Vite + Tailwind + proxy config
│       └── package.json
│
└── lib/
    ├── db/                    # Database package
    │   └── src/
    │       ├── schema/        # Drizzle table definitions (~50 tables)
    │       └── index.ts       # DB connection + schema exports
    │
    ├── api-spec/              # OpenAPI-style spec
    ├── api-zod/               # Zod validation schemas
    └── api-client-react/      # Auto-generated React Query hooks
```

---

## 3. Technology Stack

### 3.1 Frontend

| Technology | Version | Purpose |
|---|---|---|
| React | 18 | UI framework |
| TypeScript | ~5.9 | Type safety |
| Vite | 7 | Build tool and dev server |
| Wouter | 3.3 | Client-side routing |
| TanStack Query | Catalog | Server state management, caching |
| shadcn/ui | Latest | UI component library (Radix + CVA) |
| Tailwind CSS | 4 | Utility-first styling |
| Recharts | 2.x | Charts and data visualization |
| Framer Motion | Catalog | Animations |
| React Hook Form | 7.x | Form management |
| Zod | Catalog | Client-side validation |
| date-fns | 3.x | Date utilities |
| Lucide React | Catalog | Icon library |

### 3.2 Backend

| Technology | Version | Purpose |
|---|---|---|
| Node.js | 22.x | Runtime |
| Express | 5 | HTTP framework |
| TypeScript | ~5.9 | Type safety |
| Drizzle ORM | Latest | Database ORM and query builder |
| mysql2 | 3.x | MySQL driver |
| cookie-session | 2.x | Session management |
| bcryptjs | 3.x | Password hashing |
| Multer | 2.x | File upload handling |
| Pino | 9.x | Structured JSON logging |
| pino-http | 10.x | HTTP request logging |
| Zod | Catalog | Server-side validation |
| esbuild | 0.28 | Build/bundle TypeScript |

### 3.3 Database

| Technology | Version | Purpose |
|---|---|---|
| MySQL | 8.x | Primary data store |
| Drizzle ORM | Latest | Schema management, migrations |

### 3.4 Infrastructure (Current)

| Component | Current | Target (Phase 1) |
|---|---|---|
| Hosting | Local development | Docker on DigitalOcean |
| File Storage | Local disk /uploads/ | Cloudflare R2 (S3-compatible) |
| Sessions | In-memory cookies | Redis-backed sessions |
| Email | None | Resend / SMTP |
| Monitoring | Pino logs (console) | Structured log aggregation |

---

## 4. Request Flow (Detailed)

```
1. User clicks a button in React component
2. Component calls a hook from @workspace/api-client-react
   e.g., useMutation(() => fetch('/api/procurement/material-requests', { method: 'POST', body }))
3. TanStack Query executes the fetch
4. In dev: Vite proxy forwards /api/* to localhost:3000
5. Express receives the request
6. Middleware chain executes:
   a. pino-http logs the request
   b. cors validates origin
   c. express.json parses body
   d. cookieSession reads session cookie
7. Route handler executes:
   a. getCurrentUser(req) validates session → throws 401 if not logged in
   b. Permission check (role/permission gate)
   c. Input validation (Zod schema)
   d. Drizzle query to MySQL
   e. Response serialized with numeric field coercion (numKeys())
8. Response returns through proxy to React
9. TanStack Query updates cache
10. React component re-renders with new data
```

---

## 5. Authentication & Authorization

### 5.1 Authentication Flow

```
Login:
  POST /api/auth/login
  Body: { email: string }
  → Find user in DB
  → Set req.session.userId = user.id
  → Return user object

Session Check (every protected request):
  getCurrentUser(req):
    → Read req.session.userId
    → Query user + roles + permission overrides from DB
    → Throw 401 if not found

Logout:
  POST /api/auth/logout
  → Clear req.session
```

> **Security Note**: Password validation is not currently enforced. Any user can log in by email alone. This must be fixed before production deployment.

### 5.2 Permission System

```typescript
// Roles (stored in users.roles JSON array)
type Role = 'admin' | 'project_manager' | 'engineer' | 'accountant' | 'procurement_officer' | 'viewer'

// Permission constants (lib/permissions.ts)
PERMISSIONS = {
  BILLING_VIEW: 'billing:view',
  BILLING_CREATE: 'billing:create',
  PAYMENT_VIEW: 'payment:view',
  PROCUREMENT_APPROVE: 'procurement:approve',
  PROCUREMENT_CREATE: 'procurement:create',
  ADMIN_ACCESS: 'admin:access',
  AUDIT_LOG_VIEW: 'audit:view',
  FINANCIALS_VIEW: 'financials:view',
  COMMERCIAL_VIEW: 'commercial:view',
}

// Role-to-permission mapping (server-side)
canViewFinancials(user):  roles: admin, project_manager, accountant
canViewCommercial(user):  roles: admin, project_manager

// Frontend permission gate
<PermissionGate permission="billing:view" fallback={<AccessDeniedView />}>
  <BillingComponent />
</PermissionGate>
```

---

## 6. API Design Conventions

### 6.1 URL Structure

```
/api/{module}/{resource}
/api/{module}/{resource}/:id
/api/{module}/{resource}/:id/{sub-resource}

Examples:
  GET    /api/procurement/material-requests
  POST   /api/procurement/material-requests
  GET    /api/procurement/material-requests/:id
  PATCH  /api/procurement/material-requests/:id
  DELETE /api/procurement/material-requests/:id
  POST   /api/procurement/material-requests/:id/approve
  POST   /api/procurement/rfqs/:id/vendors
```

### 6.2 Response Conventions

```json
// Success (single resource)
{ "id": 1, "title": "...", "status": "draft", ... }

// Success (list)
[{ "id": 1 }, { "id": 2 }]

// Error
{ "error": "Descriptive error message" }
```

### 6.3 HTTP Status Codes

| Code | Usage |
|---|---|
| 200 | Successful GET, PATCH, action |
| 201 | Successful POST (resource created) |
| 400 | Bad request (validation failed, missing fields) |
| 401 | Unauthenticated (no session) |
| 403 | Unauthorized (logged in but no permission) |
| 404 | Resource not found |
| 500 | Unexpected server error |

---

## 7. File Upload System

### 7.1 Current Implementation

```
POST /api/[resource] (multipart/form-data)
→ Multer middleware saves file to /uploads/[filename]
→ File URL stored in DB as /uploads/[filename]
→ Express serves /uploads/* as static files

File naming: [timestamp]-[originalname]
Max size: Not enforced (risk)
File types: Not validated (risk)
```

### 7.2 Issues with Current Approach

- Files stored on local disk — lost on server restart or VM replacement
- No authentication check on file serving — any URL is publicly accessible
- No file size limit enforced
- No file type validation

### 7.3 Target Architecture (Phase 1)

```
POST /api/[resource]
→ Multer receives file in memory buffer
→ Upload to Cloudflare R2 (S3-compatible)
→ Store signed URL or public CDN URL in DB
→ Serve files via R2 CDN with signed tokens
```

---

## 8. Database Architecture

### 8.1 Connection

```typescript
// lib/db/src/index.ts
import mysql2 from 'mysql2/promise'
import { drizzle } from 'drizzle-orm/mysql2'

const pool = mysql2.createPool({
  host: 'localhost',
  port: 3306,
  database: 'turnkey_db',
  user: 'root',
  password: process.env.DB_PASSWORD,
  connectionLimit: 10,
})

export const db = drizzle(pool, { schema, mode: 'default' })
```

### 8.2 Schema Management

- Schema defined via Drizzle table definitions in `lib/db/src/schema/index.ts`
- Migrations generated with `drizzle-kit generate`
- Applied with `drizzle-kit migrate` or `drizzle-kit push` (for dev)

### 8.3 Numeric Field Handling

All monetary and decimal fields in MySQL return as `string` from Drizzle. The `numKeys()` utility converts them to JavaScript `number` before sending to the frontend:

```typescript
// lib/transforms.ts
export const numKeys = <T extends Record<string, unknown>>(
  obj: T,
  keys: readonly string[]
): T => {
  const result = { ...obj }
  for (const key of keys) {
    if (result[key] !== null && result[key] !== undefined) {
      result[key] = Number(result[key])
    }
  }
  return result
}
```

---

## 9. Build & Deployment

### 9.1 API Server Build

```bash
# Build (esbuild bundles TypeScript to ESM)
pnpm --filter @workspace/api-server run build

# Output
dist/index.mjs          # Main bundle
dist/pino-worker.mjs    # Pino logger workers

# Run
node --enable-source-maps ./dist/index.mjs
```

### 9.2 Frontend Build

```bash
# Dev server
pnpm --filter @workspace/kanak-turnkey run dev

# Production build
pnpm --filter @workspace/kanak-turnkey run build

# Output: artifacts/kanak-turnkey/dist/public/
```

### 9.3 Environment Variables

```env
# Required
DATABASE_URL=mysql://root:password@localhost:3306/turnkey_db
PORT=3000

# Optional
SESSION_SECRET=<random-32-char-string>   # Defaults to hardcoded key (insecure)
NODE_ENV=development                      # or production
FRONTEND_URL=http://localhost:5173        # For CORS
```

### 9.4 Target Deployment (Phase 1 — Docker)

```yaml
# docker-compose.yml (target)
services:
  api:
    build: ./artifacts/api-server
    ports: ["3000:3000"]
    environment:
      - DATABASE_URL
      - SESSION_SECRET
      - PORT=3000
    depends_on: [db, redis]

  frontend:
    build: ./artifacts/kanak-turnkey
    ports: ["80:80"]

  db:
    image: mysql:8
    volumes: [db_data:/var/lib/mysql]

  redis:
    image: redis:7-alpine
```

---

## 10. Logging

```
Library: Pino (structured JSON logging)
Transport: pino-pretty (human-readable in dev)

Log levels:
  error  - Exceptions, server errors
  warn   - Unexpected but recoverable
  info   - Server start, key events
  debug  - Verbose (dev only)

HTTP logging via pino-http:
  Every request logged with: method, URL (without query), statusCode
```

---

## 11. Security Considerations

| Item | Current | Action Required |
|---|---|---|
| Session secret | Hardcoded fallback | Move to env-only, no fallback |
| Password validation | Not enforced | Implement bcrypt verify on login |
| File serving | All /uploads/ public | Add auth token check |
| SQL injection | Protected by Drizzle ORM | No raw SQL except aggregates |
| XSS | React JSX escaping | Generally safe |
| CORS | Allows localhost:5173 | Configure per environment |
| Rate limiting | None | Add express-rate-limit before launch |
| HTTPS | Not configured | Reverse proxy (Nginx/Caddy) + SSL |
| Input validation | Partial (Zod) | Add Zod to all POST/PATCH routes |
| organizationId isolation | Not enforced | Add org filter to all queries |

---

## 12. Performance Benchmarks (Target)

| Metric | Target | Notes |
|---|---|---|
| Dashboard API response | < 300ms | Currently: ~150ms with seed data |
| List endpoint (50 items) | < 200ms | Add pagination for large datasets |
| File upload (5MB) | < 3s | Cloud storage in Phase 1 |
| Frontend first paint | < 1.5s | Vite code splitting helps |
| Concurrent users | 50 | Single-server Phase 1 |

---

*TAD v1.0 — Review when infrastructure or major architectural decisions change.*
