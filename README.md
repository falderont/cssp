# CSSP — Colocation Customer Self-Service Portal

A CRM + ITSM layer for data center colocation providers: a consolidated, customer-facing interface over a provider's existing DCIM, CMMS and BMS — not a replacement for them.

## Repo layout

- **`webapp/`** — **the real, working full-stack build.** Next.js + Prisma + a real database, real authentication, file uploads, PDF invoices, and a seeded multi-region/multi-tenant demo. This is what to run for a live demo or a customer pitch. See `webapp/README.md` for the technical reference, or [`docs/installation-guide-ubuntu.md`](docs/installation-guide-ubuntu.md) for a from-scratch, no-experience-assumed setup walkthrough on Ubuntu.
- **`docs/`** — the product requirements documents and business plan, in order. `prd-v5.md` is current; v1–v4 are kept for history, each with a pointer to what superseded it. `product-phase-summary.md` is the running status snapshot. `installation-guide-ubuntu.md` is the newbie install walkthrough for `webapp/`.
- **`mockups/`** — the UI mockup source, authored as [Claude Design canvas](https://claude.ai/code) artboards (`.dc.html` files + `canvas.json` layout manifest). Eight screens: Dashboard, Visitors, Incidents & Maintenance, Download Center, Tickets, Remote/Smart Hands, Provider Console, CS Engagement & Performance.
- **`prototype/`** — the original React + Vite front-end prototype with in-memory mock data (no backend). Superseded by `webapp/` for anything beyond quick visual mockup review; kept for history. See `prototype/README.md`.
- **`showcase/index.html`** — a single self-contained HTML page: personas across both sides of the platform and a storyboarded workflow for each MVP module. Open it directly in a browser, or host it anywhere static.

## Current scope (per PRD v5)

Ten modules, all implemented in `webapp/`: Visitor Management (single + batch/group, with a campus access-control integration point), Incident Management, Maintenance (calendar + tracker), Ticketing (Complaint / RFI / Service Request), Remote / Smart Hands, BMS Telemetry (optional, per-facility), a Download/Reporting Center, Billing & Invoicing, and an internal-only CS Engagement & Performance module — on top of a `Region → Country → City → Facility (Site) → Building → Area` hierarchy, multi-tenant `EnterpriseAccount`s with multi-site enrollment, and provider branding/white-labeling. See `docs/prd-v5.md` for what changed from v4 (the Country/City/Area levels were added after v5, to consolidate facility hierarchy management into one admin screen).

## Working here

For the real application:

```bash
cd webapp
npm install && npx prisma migrate dev && npm run seed
npm run dev
```

Then open http://localhost:3000 — the login screen has one-click demo
accounts. Full walkthrough: [`docs/installation-guide-ubuntu.md`](docs/installation-guide-ubuntu.md).

For the earlier throwaway prototype:

```bash
cd prototype
npm install
npm run dev
```

Then open the printed local URL (typically http://localhost:5173).

The mockups are `.dc.html` source files meant to be edited through the Claude Design canvas editor, not run directly — see `docs/product-phase-summary.md` for the published canvas link.
