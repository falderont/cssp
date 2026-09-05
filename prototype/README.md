# CSSP MVP Prototype

A working front-end prototype of the CSSP colocation customer portal, built to match the MVP scope in the PRD (`claude/prd-v4.md` in the project): a consolidated customer-facing interface over the provider's existing DCIM/CMMS/BMS — not a replacement for them — with enterprise multi-site accounts, a Remote/Smart Hands module, and an internal CS Engagement & Performance module. All data is in-memory mock data (see `src/data/mockData.js`) — there is no backend yet; this is for demoing and validating the core flows, not for production use.

## What's implemented

- **Customer view**: Dashboard (cross-module overview across 5 stat tiles), Visitors (register a visitor, track approval status), Incidents & Maintenance (read-only timeline), Download Center (browse/filter documents by category), Tickets (raise a Complaint / RFI / Service Request and track status), **Remote Hands** (submit a structured request — task type, asset/rack reference, time window — and track it through Submitted → Accepted → In Progress → Completed, with technician name, completion notes and billed minutes once done).
- **Enterprise Accounts & Sites**: the sidebar's site switcher (above the Customer/Provider view toggle) simulates the Global-Admin-vs-Site-Contact scoping from PRD v4 section 4 — "All sites" is the roll-up across every site enrollment, and picking one site filters visitors, tickets, incidents, Remote Hands requests and site-scoped documents down to that facility (enterprise-wide documents stay visible regardless).
- **Provider view**: Console with four tabs — Ticket Queue (search/filter, change status), **Remote Hands** (accept & assign a technician, Start Task, Complete Task — billable minutes are computed automatically from start to complete), Visitor Approvals (approve/deny pending visitors), Documents (publish a new document to an account); a separate Incidents & Maintenance page to post a new incident or maintenance window; and **CS Engagement** — My Engagement (log a call/email/meeting/site-visit touchpoint against an account; completed Remote Hands tasks auto-log here too) and Team Performance (a CS manager's KPI table: tickets resolved, first-response/resolution time, touchpoints logged, average CSAT per rep).
- Use the **Customer view / Provider view** toggle at the top of the sidebar to see the same underlying data from each side: register a visitor as the customer, then switch to Provider view and approve it — the status change reflects back the next time you switch. Same for submitting a ticket, publishing a document, or requesting Remote Hands and walking it through the provider's queue.

## What's intentionally not here

Matches the PRD's explicit cuts and framing: no CRM/contract management, no real DCIM/CMMS/BMS integration (Incidents & Maintenance is manually posted here, standing in for the "Manual Adapter" described in PRD v2 section 8 — the real build would pull this from the provider's actual systems), no BMS telemetry (marked optional/stretch and deferred per the PRD), no real authentication or multi-tenant backend (the site switcher simulates scoping client-side; a real build enforces it with Postgres row-level security per PRD v4 section 3), no actual invoicing/billing engine (Remote Hands tracks billable minutes only), no real photo upload behind Remote Hands completion proof, no mobile app, and no real file storage behind the Download Center's "Download" button.

## Running it

```bash
npm install
npm run dev
```

Then open the printed local URL (typically http://localhost:5173).

## Tech stack

Vite + React, no backend. The PRD's recommended production stack (Next.js + PostgreSQL + Prisma + a managed auth provider, with an adapter layer for DCIM/CMMS/BMS integration) is a larger build than a prototype needs — this shares the same visual design system as the mockups for easy comparison, but shares no code with a production app; treat this as a disposable prototype to validate the flows with design partners, not a codebase to grow in place.
