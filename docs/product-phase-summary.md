# CSSP — Product Phase v5 (Working Web App)

Supersedes the v4 scope. v5 promotes Maintenance to a first-class module
(calendar + tracker + notifications, split out of the combined
"Incidents & Maintenance" feed), un-defers BMS Telemetry as an explicitly
optional per-facility integration, adds Billing/Invoicing (previously out of
scope) and provider branding/white-labeling, and adds an explicit Building
level under Region → Facility. Full detail in `claude/prd-v5.md`;
`claude/prd-v1.md` through `claude/prd-v4.md` are kept for history only.

The most significant change in this phase isn't a scope addition, though —
it's that CSSP now has a **first real, working, database-backed
application** (`webapp/`), not just mockups and a mock-data prototype.

## Working Web Application

`webapp/` is a Next.js + Prisma app with real authentication, a real
database (SQLite locally, Postgres-ready for production), file uploads, and
role-based access control across nine internal/tenant roles. It implements
every module from PRD v5 Section 8: Visitor Management (single + batch
upload, with a campus access-control integration point and sync log),
Incident Management, Maintenance (calendar view), Ticketing, Remote/Smart
Hands (full lifecycle including completion-photo upload and billable-minute
tracking), BMS Telemetry (optional, per-facility), a Download/Reporting
Center, Billing/Invoicing (including a print-to-PDF invoice layout), CS
Engagement & Performance, and provider branding — on top of a
Region → Facility → Building hierarchy and multi-tenant `EnterpriseAccount`s
with multi-site enrollment.

It ships seeded with a realistic demo: 2 regions, 4 facilities, 4 tenant
companies, and roughly 15 users spanning every role, plus populated visitors,
incidents, maintenance windows, tickets, remote-hands requests, telemetry
time series, documents, and invoices — ready to demo without any manual data
entry. See `webapp/README.md` for the technical reference and
`docs/installation-guide-ubuntu.md` for a from-scratch setup walkthrough.

Verified before handoff: a full production build, a fresh migrate + seed
cycle, and scripted browser walkthroughs (Playwright) of both portals'
navigation plus the core write flows — creating a visitor request (single
and via CSV batch upload), approving a visitor and confirming the
access-control sync log records it, posting an incident, completing a
remote-hands task with a photo upload and confirming the stored photo is
served back correctly, creating an invoice with line items, and updating
provider branding — including confirming that a non-Super-Admin role is
correctly blocked from admin-only settings.

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
questions carried forward through PRD v5 Section 12 (a real payment gateway
vs. manual reconciliation for the first pilot, whether to expose
account-level branding now that the data model supports it, and — still
unresolved since v2 — which real DCIM/CMMS/BMS/ACS vendors a design
partner's facilities actually run, which determines what the built-in mock
adapters need to become); and, now that a working build exists, which
modules to disable or de-emphasize for a specific first pilot rather than
the earlier framing of what to build at all.
