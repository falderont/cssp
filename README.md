# CSSP — Colocation Customer Self-Service Portal

A CRM + ITSM layer for data center colocation providers: a consolidated, customer-facing interface over a provider's existing DCIM, CMMS and BMS — not a replacement for them.

## Repo layout

- **`webapp/`** — **the real, working application.** Next.js + PostgreSQL (Prisma, with row-level-security tenant isolation actually enforced) + real auth. This is what to run to see CSSP working end to end. See `webapp/README.md`.
- **`docs/`** — the product requirements documents and business plan, in order. `prd-v5.md` is current; v1–v4 are kept for history, each with a pointer to what superseded it. `product-phase-summary.md` is the running status snapshot.
- **`mockups/`** — the UI mockup source, authored as [Claude Design canvas](https://claude.ai/code) artboards (`.dc.html` files + `canvas.json` layout manifest). Eight screens: Dashboard, Visitors, Incidents & Maintenance, Download Center, Tickets, Remote/Smart Hands, Provider Console, CS Engagement & Performance. Kept for design history — not grown in place now that `webapp/` exists.
- **`prototype/`** — the earlier disposable React + Vite front-end prototype with in-memory mock data (no backend). Superseded by `webapp/`; kept for history. See `prototype/README.md`.
- **`showcase/index.html`** — a single self-contained HTML page: personas across both sides of the platform and a storyboarded workflow for each MVP module. Open it directly in a browser, or host it anywhere static.

## Current MVP scope (per PRD v5)

Nine capabilities, all implemented in `webapp/`: Visitor Management (behind a pluggable access-control adapter), Incident & Maintenance, Download Center (real file upload/download), Ticketing (Complaint/RFI/Service Request), Remote/Smart Hands (technician assignment, time tracking, completion photos, billable minutes), BMS Telemetry (optional, clearly labeled), an internal-only CS Engagement & Performance module, multi-tenancy with a Region → Facility → Building hierarchy and enterprise multi-site accounts, and a customer-facing Billing/Invoice interface (read-only, over a mock billing adapter).

## Working here

```bash
cd webapp
# see webapp/README.md for the one-time Postgres role setup
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Then open http://localhost:3000 and sign in with one of the seeded demo accounts (see `webapp/README.md`).

The mockups are `.dc.html` source files meant to be edited through the Claude Design canvas editor, not run directly — see `docs/product-phase-summary.md` for the published canvas link.
