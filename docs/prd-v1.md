> **Superseded by `claude/prd-v2.md`.** The MVP scope below (service requests + incident visibility only) was replaced after the author corrected the actual MVP feature set from direct colocation CS experience: Visitor Management, Incident Management, Download Center, Ticketing, and optional BMS Telemetry — framed as an integration/consolidation layer over the provider's existing DCIM/CMMS/BMS, not a replacement for them. Kept here for history only.

# CSSP — Product Requirements Document (v1)
## CRM + ITSM Customer Self-Service Portal — MVP

This PRD picks up where the business plan left off. It scopes the MVP to Phase 1 of that plan only — validate the problem with a handful of design partners on a narrow feature set — rather than the full CRM+ITSM vision, so the first build is small enough to actually ship and test.

## 1. Goal

Give a colocation provider's enterprise customers one place to submit service requests and see incident/maintenance status, replacing email and phone as the default channel — and give the provider's CS/NOC team a lighter-weight way to manage that inbound traffic than a generic helpdesk tool. Success for the MVP is behavioral, not feature-complete: pilot customers actually using the portal instead of emailing their account manager.

## 2. Users & Personas

On the customer side, the primary user is an **IT/Infrastructure Manager** — the person who actually needs remote hands, a cross-connect, or a capacity change, and who currently has no visibility into request status without asking. A secondary customer user is a **Compliance/Facilities contact** who periodically needs uptime and maintenance history for their own audits, but doesn't log in often. On the provider side, the primary user is the **Customer Success Manager / Account Manager**, who today fields most of this by email and needs a queue view across all their accounts; a secondary provider user is **NOC/Ops staff**, who log incidents and maintenance windows and need that to flow to customers without extra data entry.

## 3. MVP Scope

In scope for the MVP, matching Phase 1 of the business plan:

| Feature | Customer side | Provider side |
|---|---|---|
| Account dashboard | View facilities, active contracts, open requests at a glance | View all accounts, filter/search |
| Service request submission | Submit remote hands, cross-connect, or capacity-change requests; track status | Receive, triage, assign, update status, close |
| Incident & maintenance visibility | See active/past incidents and scheduled maintenance affecting their facilities | Log an incident or maintenance window once; it appears for every affected customer |
| Basic notifications | Email alert on status change or new maintenance post | — |

Explicitly **out of scope for the MVP** (deferred to later phases per the business plan): the CRM half (contract/renewal tracking, sales pipeline, account health scoring), SLA/uptime reporting exports, DCIM or monitoring-system integrations (incidents are entered manually by ops staff, not pulled from a monitoring feed), multi-language support, and a native mobile app. This is a deliberate cut, not an oversight — the point of the MVP is to test whether customers will use a portal at all before building the harder, higher-effort features.

## 4. Core User Flows

**Customer submits a service request:** logs in, selects a facility, picks a request type (remote hands / cross-connect / capacity change), fills a short form, submits — request appears in "My Requests" with status "Submitted," and the customer gets an email when status changes.

**Provider triages a request:** the CS/NOC queue shows new requests across all accounts; staff assign an owner, update status (Submitted → In Progress → Done), and optionally leave a note visible to the customer — the customer sees the update in real time without a follow-up email.

**Customer checks incident/maintenance status:** dashboard shows a timeline of active and past incidents and scheduled maintenance for their facilities, entered once by ops staff and visible to every customer at that facility — replacing the current one-off email blast.

**Provider logs an incident or maintenance window:** ops staff create one entry, tag the affected facility/facilities, and it's immediately visible to every customer at that facility, cutting out the manual "who do I need to email" step.

## 5. Data Model (MVP)

| Entity | Key fields | Notes |
|---|---|---|
| Organization | name, tier (Starter/Growth/Enterprise) | The colocation provider — the paying customer of CSSP |
| Account | name, organization_id | A customer of the provider (multi-tenant: one Account per customer company) |
| Facility | name, address, organization_id | A data center site belonging to the provider |
| Contract | account_id, facility_id, start/end date, rack count | Minimal for MVP — just enough to scope which facilities an account can see |
| User | name, email, role (customer / provider-CS / provider-ops), account_id (if customer) | Role drives what's visible — this is where RBAC starts |
| ServiceRequest | account_id, facility_id, type, status, created_by, assigned_to, notes | The request-tracking core of the ITSM half |
| IncidentOrMaintenance | facility_id, type (incident/maintenance), status, start/end time, description | One entry, many customers can see it via facility_id |

This is intentionally thin — no asset/rack-level inventory, no billing integration yet. Those are natural Phase 2 additions once the core loop (submit request → see status, see incidents → feel informed) is validated.

## 6. Non-Functional Requirements

Multi-tenant data isolation is the one requirement that can't be retrofitted cheaply later — every query needs to be scoped by organization/account from day one, even in the MVP, because a colocation customer seeing another customer's data is the kind of failure that ends a pilot immediately. Role-based access (customer vs. provider-CS vs. provider-ops) should exist from the first release, even in a simple form. An audit log of who changed what and when is worth building early, since compliance-minded customers will eventually ask for it and it's far cheaper to log from day one than to backfill. The portal needs to be usable on a phone — infrastructure and ops people frequently check status away from a desk — but a dedicated mobile app is not an MVP requirement, a responsive web app is enough.

## 7. Tech Stack Recommendation

Given the business plan assumes a solo founder plus a contracted developer (not an in-house engineering team), the priority is a stack that's easy to hire for, has strong ready-made building blocks for the parts that are easy to get wrong (auth, RBAC, multi-tenancy), and doesn't lock into a niche framework a future contractor would need to learn from scratch.

**Recommended:** Next.js (React) for the frontend and API layer, PostgreSQL as the database with row-level scoping by organization/account, Prisma as the ORM, and a managed auth provider (Clerk or Auth.js) rather than building login/RBAC from scratch. Hosting on Vercel (frontend/API) plus a managed Postgres provider (Neon, Supabase, or Railway) keeps infrastructure overhead near zero for a solo founder — no servers to patch. This combination is mainstream enough that contract developers are easy to find and replace, and it scales from a single-pilot MVP to a real multi-tenant SaaS without a rewrite.

**Faster, lower-commitment alternative for pre-code validation:** before committing developer budget, the same MVP flows (request submission, status tracking, incident timeline) can be roughed out in a no-code tool like Retool or Bubble in days rather than weeks, purely to test with 1-2 design partners whether the workflow itself is right before investing in the real build. This is optional — worth doing only if there's real uncertainty about whether design partners will engage with a portal at all.

## 8. Integrations (deferred)

The MVP deliberately has no live integrations. Incidents and maintenance windows are entered manually by provider ops staff rather than pulled from a monitoring system or DCIM tool, and there's no accounting/billing integration. This keeps the MVP buildable in weeks rather than months; integration with common monitoring tools and DCIM platforms (the vendors named in the business plan's competitive section — Device42, Sunbird, Nlyte) is explicitly a Phase 3 item, once there are enough paying customers to justify the engineering cost of building and maintaining those connectors.

## 9. MVP Success Metrics

The metric that matters most for the pilot is adoption, not feature count: the percentage of service requests submitted through the portal versus still coming in by email or phone, tracked weekly against each pilot customer. Secondary signals worth tracking: how often customers check the incident/maintenance timeline (proxy for whether it's actually replacing the email blast), and qualitative feedback from the pilot's CS/NOC staff on whether it reduced their own status-update workload. These, not a long feature list, are what should decide whether to move into Phase 2 CRM functionality.

## 10. Roadmap Linkage

This PRD covers Business Plan Phase 1 only (months 0–6: MVP + first 1-2 pilots). Phase 2 (CRM/account-management module, SLA reporting) and Phase 3 (DCIM/monitoring integrations, geographic expansion) each warrant their own PRD once Phase 1 adoption data exists to inform them, rather than speculatively scoping those now.
