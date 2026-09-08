# CSSP — Product Phase v7 (Working Web App)

Supersedes the v5 scope. v6 redefines the facility hierarchy from three flat
levels (Region → Facility → Building) into a full six-level area hierarchy —
Region → Country → City → Site → Building → Room — fixing a real gap where
v5's `Region` had been overloaded to hold country-level data. It also adds
per-site `ControlledArea`s (a tenant's footprint scoped to a specific
building/room, not just "the whole facility") and formalizes who owns area
master data: Global Sys Admin, delegable to Service Desk, with every other
internal role routed through a new `AreaChangeRequest` ticket instead of
direct edit access. v7 is a narrow follow-up, UI only: Region/Country/City/
Site administration is consolidated back into one staged screen instead of
four separate pages, on direct feedback that the split cost more clicks than
it saved. Full detail in `docs/prd-v7.md` and `docs/prd-v6.md`; `docs/prd-v1.md`
through `docs/prd-v5.md` are kept for history only.

The prior phase's most significant change was CSSP getting its **first real,
working, database-backed application** (`webapp/`); this phase deepens that
build's data model rather than adding new customer-facing modules.

## Working Web Application

`webapp/` is a Next.js + Prisma app with real authentication, a real
database (SQLite locally, Postgres-ready for production), file uploads, and
role-based access control across nine internal/tenant roles. It implements
every module from PRD v5 Section 8, now sitting on the v6 area hierarchy:
Visitor Management (single + batch upload, with a campus access-control
integration point and sync log), Incident Management, Maintenance (calendar
view), Ticketing, Remote/Smart Hands (full lifecycle including
completion-photo upload and billable-minute tracking), BMS Telemetry
(optional, per-facility), a Download/Reporting Center, Billing/Invoicing
(including a print-to-PDF invoice layout), CS Engagement & Performance, and
provider branding — on top of a Region → Country → City → Site → Building →
Room hierarchy and multi-tenant `EnterpriseAccount`s with multi-site
enrollment and per-site controlled areas.

It ships seeded with a realistic demo: 4 regions (APAC live with 8 countries
and 9 sites; ANZ/EMEA/LATAM present as master data, EMEA with two countries
and one live site in Finland plus a country/city awaiting its first site in
Spain), 4 tenant companies (one now spanning two countries), and roughly 15
users spanning every role, plus populated visitors, incidents, maintenance
windows, tickets, remote-hands requests, telemetry time series, documents,
invoices, and two `AreaChangeRequest` tickets (one open, one triaged) —
ready to demo without any manual data entry. See `webapp/README.md` for the
technical reference and `docs/installation-guide-ubuntu.md` for a
from-scratch setup walkthrough.

Verified before handoff: a full production build, a fresh migrate + seed
cycle, and scripted browser walkthroughs (Playwright) of both portals'
navigation plus the core write flows — creating a visitor request (single
and via CSV batch upload), approving a visitor and confirming the
access-control sync log records it, posting an incident, completing a
remote-hands task with a photo upload and confirming the stored photo is
served back correctly, creating an invoice with line items, updating
provider branding, building out a new Region/Country/City/Site/Building/Room
end to end, and submitting + triaging an `AreaChangeRequest` — including
confirming that a non-Super-Admin role is correctly blocked from admin-only
settings and that Service Desk's delegated area-management access works as
designed.

## UI/UX Mockups (unchanged from v4)

Published as a design canvas (same URL, updated in place):
https://claude.ai/code/artifact/d882a8b8-f472-44f1-80ab-779c9ad6029f

These predate Maintenance/Telemetry/Billing/Branding as first-class/new
modules and reflect the v4 module set; not updated for v5, since `webapp/`
is now the live reference for current screens.

## Earlier Prototype (superseded)

`prototype/` — the React + Vite, mock-data-only prototype described in prior
phase summaries — is kept for history but superseded by `webapp/` for
anything beyond a quick visual sanity check of the v4-era mockups.

## Status / Next Steps

Next decisions: which design partners to approach (pending the
employment/non-compete review flagged in the business plan); the open
questions carried forward through PRD v6 Section 8 (a real payment gateway
vs. manual reconciliation for the first pilot, whether to expose
account-level branding now that the data model supports it, whether CS Team
scope needs a "Country" option between Region and Site as EMEA goes live,
and — still unresolved since v2 — which real DCIM/CMMS/BMS/ACS vendors a
design partner's facilities actually run, which determines what the built-in
mock adapters need to become); and, now that a working build exists, which
modules to disable or de-emphasize for a specific first pilot rather than
the earlier framing of what to build at all.
