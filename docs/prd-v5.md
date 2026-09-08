> **Superseded by `docs/prd-v6.md`.** v6 redefines the area/location master data model: the facility hierarchy grows from `Region → Facility → Building` to a full six-level `Region → Country → City → Site → Building → Room`, tenants can hold multiple locations and controlled (sub-site) areas, and area master data ownership is formalized (Global Sys Admin, delegable to Service Desk) with an internal ticket-based change-request flow for everyone else. Kept here for history only.

# CSSP — Product Requirements Document (v5)
## From Plan to Build: Maintenance, Billing, Branding and BMS Telemetry Join the MVP, and the First Working Application Ships

**What changed from v4:** four additions, all made in the course of actually building the first working version of CSSP (`webapp/`) rather than as speculative scope growth. (1) **Maintenance** is split out from the combined "Incidents & Maintenance" read-only timeline (v2) into its own first-class module with a real calendar view, its own status lifecycle, and its own notification log — the same treatment Remote Hands got in v4, for the same reason: maintenance windows have their own workflow (scheduled → in progress → completed, planned vs. emergency, impact level) that a generic incident feed doesn't capture well. (2) **BMS Telemetry**, deferred in every prior version, is un-deferred and shipped — but deliberately scoped as *optional* and *per-facility*, framed explicitly as a read-only mirror of the provider's own BMS/DCIM rather than a control plane, consistent with this project's integration-layer positioning (Section 2). (3) **Billing/Invoicing**, explicitly out of scope through v4 ("Remote Hands tracks billable minutes; it does not generate invoices"), is added as a full module — invoices, line items, a status lifecycle, and a customer-facing "pay" action — because a self-service portal without a bill a tenant can actually look at turned out to be a harder sell than the v4 author anticipated. (4) **Provider branding** (logo, colors, support contact) is added as a Super-Admin-configurable setting applied across both portals and printed invoices, since a white-label-capable portal is a materially different pitch to a colocation provider than a fixed-branding one.

This version is also the first to describe a **shipped, working application** rather than a plan for one — see Section 13.

## 1. Goal (extended from v4)

Unchanged core goal (v4 Section 1): one consolidated place for a colocation provider's enterprise customers to register visitors, track incidents/maintenance, download reports, raise tickets, and request remote hands — across every facility they occupy — with a matching internal console for the provider's own staff. Extended for v5: that same portal is now also where a tenant reviews and pays their bill, and where the provider's brand (not a generic CSSP-branded shell) is what both sides see.

## 2. Positioning (unchanged from v2)

CSSP remains a consolidated, customer-facing integration layer over the provider's DCIM/CMMS/BMS. BMS Telemetry — now shipped — is the clearest test of this positioning: it reads a mirror of live facility metrics but the source of truth, and any control action, stays with the provider's real BMS. The implementation makes this concrete: `TelemetrySource.status` is `NotConfigured` by default per facility (an explicit provider opt-in, not an assumed default), and both portals frame the module as "connects to your BMS, does not replace it" wherever it appears.

## 3. Multi-Tenancy & Facility Architecture (extends v3 Section 3)

Unchanged tenant isolation model (`organization`-scoped access, enforced at the query layer — see `src/lib/scope.ts` in the build). New in v5: the facility hierarchy gains an explicit **Building** level (`Region → Facility → Building`), because a real campus is rarely one undifferentiated hall — visitors, incidents, maintenance windows and telemetry readings can now optionally scope to a specific building within a facility, while still rolling up to the facility level for anything that doesn't need that granularity (a tenant's `SiteEnrollment` is still facility-level, not building-level, since a tenant's contractual footprint is with the facility).

## 4. Maintenance (promoted to first-class module)

**What it does:** the provider schedules a maintenance window — planned or emergency, with a stated customer-impact level (no impact / redundancy reduced / full outage) — against a facility (optionally a specific building). Every tenant enrolled there is notified when it's scheduled and again on every status change, the same notification pattern Incidents already used. Customers see it on a real month calendar, not just a flat list, so "what's happening this week across my sites" is a glance rather than a scroll.

**Why it needed to split from Incidents:** an incident is reactive and unplanned; maintenance is scheduled and has a customer-impact rating that needs to be set at creation time, a type distinction (planned vs. emergency) that changes how urgently it should be communicated, and a calendar-shaped consumption pattern that a chronological incident feed doesn't serve well. Folding both into one generic "IncidentOrMaintenance" feed (the v2 approach) works for a read-only demo; it stops working once a CS manager needs to answer "what's on the calendar for BTM-02 next month" in one glance.

**Core flow:** provider ops schedules a window (facility, building, type, impact, start/end, description) → every enrolled tenant is notified and sees it appear on their calendar → provider updates status through Scheduled → In Progress → Completed (or Cancelled) → each update generates a fresh notification, mirroring the Incident update pattern.

## 5. BMS Telemetry (un-deferred, shipped as optional)

**What it does:** per facility, the provider can mark a BMS/DCIM integration as Connected (naming a vendor) or leave it Not Configured. When connected, both the provider console and the tenant portal show the same four metrics — temperature, humidity, power draw, and PUE — as time-series charts. When not connected, the tenant sees a plain, honest "not connected yet, optional, ask your provider" state rather than an error or a fake chart.

**Why now, and why still "optional":** the v2–v4 hesitation was the lack of a specific pilot customer's BMS vendor to design an adapter against. That's still true — this build doesn't integrate with a real BMS. What it does instead is ship the *shape* of that integration (a `TelemetrySource` per facility, a metrics table, both UIs) so a real vendor-specific adapter is a data-ingestion problem to solve later, not an architecture to invent later. Keeping it explicitly optional and facility-scoped (rather than assumed-on) matches how real providers will roll this out: site by site, as each facility's BMS vendor is integrated.

## 6. Billing / Invoicing (newly in scope)

**What it does:** the provider (Finance role) creates an invoice against a tenant account — billing period, line items (space, power, cross-connects, remote hands, ad-hoc), tax rate, currency — and moves it through Draft → Sent → Paid/Overdue. The tenant sees their invoices, the outstanding balance surfaces on their dashboard, and a "Pay now" action lets them mark a Sent/Overdue invoice Paid (a stand-in for a real payment gateway — see Section 12). Every invoice has a print-friendly view (browser print → Save as PDF) usable as an actual PDF invoice.

**Why this changed from "explicitly out of scope" in every prior version:** v4 argued Remote Hands should track billable minutes without generating invoices, reasoning that "no invoicing engine" kept the MVP smaller. Building the actual portal surfaced the obvious gap this left: a self-service portal whose Download Center can show you last month's invoice as a static PDF, but has no live billing status, isn't meaningfully more self-service than email. The line items model deliberately mirrors the categories Remote Hands and Space/Power already produce, so the billing data isn't a parallel system to reconcile by hand — it's the natural next consumer of data the rest of the app was already producing.

## 7. Provider Branding (new)

**What it does:** a Super Admin sets the company name, logo, two accent colors, and support contact details once; it applies to both portals' headers, the login screen, and every printed invoice. Tenant accounts can additionally carry their own display name/logo, in preparation for account-level white-labeling (not fully exposed in tenant-facing UI yet — see Section 12).

**Why:** a portal that's visibly "CSSP-branded" rather than the provider's own brand is a materially harder pitch to a colocation provider evaluating this as something to put in front of *their* customers. This is a small module in data-model terms (`ProviderSettings` is effectively a singleton row) but disproportionately important to the sales narrative.

## 8. MVP Scope (updated)

| Module | Customer side | Provider side | Notes |
|---|---|---|---|
| Regions, Facilities, Buildings, Accounts | Global Admin sees roll-up across enrolled sites; Site Contact sees their one facility | Manage the full hierarchy + site enrollments | Building level new in v5 |
| Visitor Management | Register single or batch/group visitors per site | Approve/deny, check in/out, ACS sync log | Batch/CSV upload new in v5 |
| Incident Management | See incidents per site, with update timeline | Publish + update incidents | Unchanged from v2/v4 |
| Maintenance | Calendar + list, per site | Schedule, update status, notify | **New first-class module in v5** — was folded into Incidents through v4 |
| Ticketing | Raise Complaint/RFI/Service Request | Triage queue, assign, resolve | Unchanged from v2 |
| Remote / Smart Hands | Submit, track, view completion proof, CSAT | Accept/assign, start/complete, billable minutes | Unchanged from v4 |
| BMS Telemetry | View charts if connected; else "not connected, optional" | Connect/disconnect per facility | **Un-deferred in v5** — optional, per-facility |
| Download Center | Browse/download scoped documents | Publish, scoped globally/tenant/facility | Unchanged from v2 |
| Billing | View invoices, outstanding balance, pay | Create/manage invoices, line items | **New in v5** — explicitly out of scope through v4 |
| CS Engagement & Performance | — (internal only) | Log engagement; team KPI view | Unchanged from v3 |
| Branding | Sees provider's own brand throughout | Configure logo/colors/contact | **New in v5** |

Still explicitly out of scope: a real payment gateway (billing status changes are simulated), a native mobile app, multi-language support, cross-tenant functionality, and any real DCIM/CMMS/BMS/ACS vendor integration (all four have a defined integration point and a mock/manual adapter standing in for one).

## 9. Data Model (v5 additions — extends v4 Section 8)

| Entity | Key fields | Notes |
|---|---|---|
| Building | facility_id, name, code | New level under Facility |
| MaintenanceEvent | facility_id, building_id, type (Planned/Emergency), impact, start/end, status | Split out from the v2 `IncidentOrMaintenance` entity |
| MaintenanceNotification | maintenance_event_id, channel, audience, message, sent_at | Mirrors the incident-update notification pattern |
| TelemetrySource | facility_id, vendor, status (NotConfigured/Connected/Error) | Per-facility opt-in |
| TelemetryPoint | facility_id, building_id, metric, value, recorded_at | Time-series readings |
| Invoice | enterprise_account_id, invoice_number, period, status, subtotal/tax/total, currency | |
| InvoiceLineItem | invoice_id, description, category, quantity, unit_price, amount | |
| ProviderSettings | company_name, logo_url, colors, support contact | Effectively a singleton |
| AcsIntegrationLog | visitor_request_id, endpoint_url, request/response, status | New — logs every push to the (real or mock) campus access-control system |

## 10. Integration Approach (extends v2 Section 8)

Four integration points now exist, each with the same shape: a configurable
endpoint/flag on the provider's own data (facility ACS endpoint, telemetry
source per facility), a built-in mock/manual adapter that makes the workflow
fully demoable without a real vendor connection, and a clear seam where a
real integration replaces the mock. None of the four (ACS, BMS, and — still
— DCIM/CMMS for incidents) are meant to be the system of record; CSSP reads
from and writes to them, per the project's original positioning.

## 11. Core User Flows (new for v5 modules)

**Maintenance:** provider schedules a window on a facility → tenants notified + see it on their calendar → provider moves it through its lifecycle, each transition re-notifying tenants → tenant sees it drop off the "upcoming" list once Completed.

**Telemetry:** provider marks a facility's BMS source Connected → tenant portal's Telemetry page for that site switches from "not connected" to four live charts, matching what the provider console shows for the same facility.

**Billing:** provider creates an invoice with line items → moves it to Sent (tenant is notified, sees it on their Billing page and dashboard balance) → tenant reviews it, optionally pays it (demo action) → provider sees status update to Paid.

## 12. Open Questions (extends v4 Section 12)

New for this version: whether "Pay now" needs a real payment gateway (Stripe/Xendit/etc.) before the first real pilot, or whether a manually-reconciled "mark as paid" on the provider side is enough to validate the billing-visibility hypothesis first; whether account-level branding (a tenant's own logo shown inside their own view of the portal) is worth exposing in the UI now that the data model supports it, or whether provider-level branding alone is sufficient for the first pilot; and — carried forward unresolved from every prior version — the underlying question of which real DCIM/CMMS/BMS/ACS vendors a design partner actually runs, which determines what the four mock adapters need to become.

## 13. Status: First Working Build (new section)

Every module in Section 8 is implemented as a real, database-backed
application in `webapp/` — not a mockup or a mock-data prototype (that's
`prototype/`, kept for history). It has its own seeded demo data (multiple
regions, facilities, tenant accounts, and users across every role), real
authentication and role-based access control, and passed an end-to-end
verification pass (build, migrate, seed, and scripted browser walkthroughs of
every module's core read and write flows) before being handed over. See
`webapp/README.md` for the technical reference and
`docs/installation-guide-ubuntu.md` for how to run it. The honest
scope-growth flag from v4 Section 13 still applies in spirit — this is now
the fifth round of confirmed scope change on top of the original v1 MVP —
but with a working build in hand, the sequencing question v3/v4 raised (what
ships to the first pilot vs. what's a fast-follow) is now a question of what
to *disable or de-emphasize* for a given pilot rather than what to build.
