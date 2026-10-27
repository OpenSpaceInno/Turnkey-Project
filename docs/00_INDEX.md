# Kanak TurnKey — Product Documentation Hub

> Version: 1.0 | Last Updated: October 2026 | Status: Active

---

## Document Index

| # | Document | Audience | Description |
|---|---|---|---|
| 01 | [Business Requirements (BRD)](./01_BRD.md) | Leadership, Product Head | Why we build this; business goals; stakeholder needs |
| 02 | [Functional Requirements (FRD)](./02_FRD.md) | Product, QA, Dev | What the system does; feature-level requirements |
| 03 | [Technical Architecture (TAD)](./03_TAD.md) | Solution Architect, Dev Lead | How the system is built; stack, patterns, deployment |
| 04 | [Database & ER Documentation](./04_DATA_MODEL.md) | Backend Dev, DBA | Schema, entity relationships, design rationale |
| 05 | [API Reference](./05_API_REFERENCE.md) | Backend Dev, Frontend Dev | All REST endpoints, request/response shapes |
| 06 | [Module Documentation](./06_MODULES.md) | Full team | Module-by-module feature, workflow, and gap docs |
| 07 | [Progress Tracker](./07_PROGRESS_TRACKER.md) | Engineering Lead, PM | Implementation status per feature/module |
| 08 | [Phased Roadmap](./08_ROADMAP.md) | Leadership, Product | Phase-wise delivery plan with effort estimates |

---

## How to Use This Documentation

- **New team member?** Start with `01_BRD.md` then `06_MODULES.md`
- **Building a new feature?** Start with `02_FRD.md` and `07_PROGRESS_TRACKER.md`
- **Adding a new industry vertical?** See `06_MODULES.md` → Industry Extensibility section
- **API integration?** Go directly to `05_API_REFERENCE.md`
- **Database change?** Read `04_DATA_MODEL.md` first

---

## Document Status Legend

| Symbol | Meaning |
|---|---|
| ✅ | Complete and implemented |
| ⚠️ | Partially implemented or needs improvement |
| ❌ | Not yet implemented |
| 🔵 | In progress |
| 🟡 | Planned — next phase |
| 🔴 | Critical gap |

---

## Product Identity

```
Product Name : Kanak TurnKey
Version      : 1.0 (Frozen Baseline)
Domain       : Turnkey Project Management (Construction / MEP)
Organisation : Kanak
Stack        : React + Express + MySQL + Drizzle ORM
Languages    : TypeScript (full-stack)
```

---

*All documents in this folder are living documents — update them when features are added, changed, or removed.*
