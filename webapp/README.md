# CSSP Web Application

The real, working build of the colocation Customer Self-Service Portal — a CRM + ITSM layer that
sits on top of a provider's existing DCIM/CMMS/BMS, not a replacement for them. This supersedes the
`prototype/` mock-data React app; see `docs/prd-v5.md` for why. `prototype/` and `mockups/` at the
repo root are kept for design history and are not grown in place.

## Stack

Next.js 16 (App Router, Turbopack) + TypeScript + Tailwind CSS v4, PostgreSQL 16 via Prisma 7
(`@prisma/adapter-pg`), custom cookie-session auth (`jose` + `bcryptjs`), Zod validation, Vitest for
tests. No ORM-agnostic abstraction layer, no auth-as-a-service — see docs/prd-v5.md Section 4 for why
this round builds the real thing instead of another prototype.

**This Next.js version and Prisma version are both newer than most training data.** Two concrete
breaking changes worth knowing before touching this code: Next's `middleware.ts` is now `proxy.ts`
(see `proxy.ts` at the project root), and Prisma 7's `PrismaClient` requires a driver adapter
(`@prisma/adapter-pg`) — there is no more `new PrismaClient({ datasources: { db: { url } } })`. If
something looks unfamiliar, check `node_modules/next/dist/docs/` and the installed package's own
`.d.ts` files before assuming the old API.

## Multi-tenancy: the one thing that isn't just app code

Every tenant-scoped table has `organizationId` and is protected by a Postgres row-level security
policy (`prisma/rls.sql`, applied as migrations) keyed on the session-local `app.organization_id`
setting. Two Postgres roles matter:

- **`cssp` (owner)** — used only by `prisma migrate` and `prisma db seed`. Bypasses RLS as table
  owner, same as `service_role` in Supabase's docs. Never used to serve a request.
- **`cssp_app` (runtime)** — what the actual app (`lib/db.ts`) connects as. No `BYPASSRLS`, not an
  owner, so every RLS policy applies to every query it makes, full stop.

`lib/tenant.ts`'s `withTenant(organizationId, fn)` is the one way application code talks to the
database: it opens a transaction, sets `app.organization_id` via a parameterized `set_config(...)`
call, and hands the transaction client to `fn`. If that's never called, `current_setting()` returns
null and every RLS policy denies all rows — fail-closed by default, verified in
`prisma/tests/tenant-isolation.test.ts` (run with `npm test`).

Login has a chicken-and-egg problem under this model — you don't know the tenant before you've found
the user record. `lib/auth/lookup.ts` and the `auth_lookup_user` SQL function
(`prisma/migrations/.../auth_lookup_function`) solve it with a narrow, parameterized
`SECURITY DEFINER` function instead of weakening the `users` table's RLS policy.

## Getting started

Requires PostgreSQL 16+ running locally (or point the env vars at any Postgres instance) and Node 20+.

```bash
# 1. Two Postgres roles: an owner for migrations/seeding, a restricted one for the app.
sudo -u postgres psql -c "CREATE USER cssp WITH PASSWORD 'cssp_dev_password' CREATEDB;"
sudo -u postgres psql -c "CREATE DATABASE cssp OWNER cssp;"
sudo -u postgres psql -c "CREATE USER cssp_app WITH PASSWORD 'cssp_app_password' NOSUPERUSER NOCREATEDB NOCREATEROLE;"
sudo -u postgres psql -d cssp -c "GRANT USAGE ON SCHEMA public TO cssp_app;"
sudo -u postgres psql -d cssp -c "ALTER DEFAULT PRIVILEGES FOR ROLE cssp IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO cssp_app;"
sudo -u postgres psql -d cssp -c "ALTER DEFAULT PRIVILEGES FOR ROLE cssp IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO cssp_app;"

# 2. Env vars — see .env.example. Copy it to .env and adjust if your Postgres setup differs.
cp .env.example .env

# 3. Install, migrate (applies prisma/rls.sql too), seed demo data.
npm install
npm run db:migrate
npm run db:seed

# 4. Run it.
npm run dev
```

Then open http://localhost:3000 — you'll land on `/login`.

If you ever see permission errors from `cssp_app` after a fresh `prisma migrate dev` that created new
tables outside of `ALTER DEFAULT PRIVILEGES`'s reach (e.g. you ran migrations before granting default
privileges), re-run: `GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO cssp_app;`
as the `postgres` superuser.

## Demo accounts

All seeded users share the password `demo-pass-1`. Two tenants exist: **Meridian Data Centers** (the
one to actually demo — three facilities, two enterprise customers, data in every module) and
**Apex Colocation** (deliberately sparse — exists only so the tenant-isolation tests have a second
tenant to try to leak into).

| Email | Role | Scope |
|---|---|---|
| `admin@meridian-dc.example.com` | Provider Admin | Full provider console incl. Provider Setup |
| `ops@meridian-dc.example.com` | Provider Ops/NOC | Visitors, Remote Hands, Tickets |
| `security@meridian-dc.example.com` | Provider Security | Visitor approvals |
| `cs@meridian-dc.example.com` | Provider CS | Tickets, Documents, My Engagement |
| `cs.manager@meridian-dc.example.com` | Provider CS Manager | Everything CS can, plus Team Performance |
| `tech@meridian-dc.example.com` | Provider Technician | Remote Hands fulfillment |
| `meridian.admin@example.com` | Customer Global Admin (Meridian Logistics) | Roll-up across JKT-01 + SIN-02 |
| `jkt.contact@meridian-logistics.example.com` | Customer Site Contact | JKT-01 only |
| `northwind.admin@example.com` | Customer Global Admin (Northwind Freight) | NYC-01 only |
| `apex.admin@apex-colo.example.com` / `vertex.admin@example.com` | Apex tenant | Isolation-test data only |

## What's implemented

All nine items from the MVP brief, each backed by real Postgres tables and RLS, not mock data:

1. **Visitor Management** — register/approve/check-in/check-out, behind `AccessControlAdapter`
   (`lib/adapters/access-control.ts`) — a mock today, a drop-in for Lenel/Genetec tomorrow.
2. **Incident & Maintenance** — provider-published, customer timeline, behind `IncidentSourceAdapter`
   (manual today; same normalized shape a DCIM/CMMS webhook would produce).
3. **Maintenance notifications** — same module as incidents (`type: MAINTENANCE`), per docs/prd-v2.md.
4. **Service requests incl. Remote/Smart Hands** — Tickets (Complaint/RFI/Service Request) and a
   first-class Remote Hands module with technician assignment, time tracking, completion photo
   upload, and editable billable minutes.
5. **BMS Telemetry (optional)** — `/portal/bms`, sparkline charts from seeded `BmsTelemetryReading`
   rows, behind `BmsAdapter`. Clearly labeled optional per the PRD; not a live feed.
6. **Download Center** — real file upload/download (`lib/storage.ts`, local disk for the MVP),
   site- or account-level documents.
7. **CS Engagement & Performance (internal only)** — My Engagement log, auto-populated by resolved
   tickets and completed Remote Hands tasks; Team Performance KPI table for CS managers.
8. **Multi-tenancy / multi-site / region / building** — `Organization` → `Region` → `Facility` →
   `Building`, enforced by RLS; enterprise accounts enrolled across any number of facilities
   (`SiteEnrollment`); a Provider Setup screen (`/console/admin`) to manage all of it plus users.
9. **Billing/Invoice interface** — customer-facing, read-only (`/portal/billing`), behind
   `BillingAdapter`. Never generates or reconciles invoices — see docs/prd-v5.md Section 2 for why.

## What's deliberately thin

- **Adapters are all `Mock*` implementations.** Every external-system boundary (access control, BMS,
  billing) is a real TypeScript interface with a documented contract (docs/prd-v5.md Section 3), but
  the implementation behind it is synthetic data, not a live integration — no pilot's actual PACS/
  DCIM/billing system is known yet.
- **File storage is local disk** (`storage/`, gitignored). Fine for a single instance or a demo;
  swap `lib/storage.ts` for S3/GCS behind the same two functions for a real deployment.
- **No edit/delete on Provider Setup screens** — create-only, since initial provisioning is the actual
  need; a real admin UI would add these.
- Out of scope per the PRD, unchanged: CRM in the contract/renewal/sales-pipeline sense, a native
  mobile app, multi-language support, cross-tenant functionality, an actual invoicing/payment engine.

## Commands

```bash
npm run dev          # start the dev server (Turbopack)
npm run build        # production build
npm run start        # run the production build
npm run lint         # ESLint
npm test             # vitest — tenant isolation tests (needs a seeded DB)
npm run db:migrate   # prisma migrate dev
npm run db:seed      # re-seed demo data (also wipes and recreates it)
npm run db:reset     # drop, recreate, migrate, and seed in one step
npm run db:studio    # Prisma Studio
```

## Known non-blocking issue

`npm audit` reports 4 high-severity advisories, all in `deepmerge-ts`/`mysql2` — transitive
dependencies of the `prisma` CLI's config loader and its (unused here) MySQL support. They're dev-time
only, not shipped to the app bundle, and not reachable since this project only ever talks to
PostgreSQL. Fixing them via `npm audit fix --force` downgrades to `prisma@6.19.3`, which is a real
regression (loses the Prisma 7 APIs this codebase is written against) for a non-issue. Left as-is
deliberately.
