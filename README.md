# CSSP — Colocation Customer Self-Service Portal

A CRM + ITSM layer for data center colocation providers: a consolidated, customer-facing interface over a provider's existing DCIM, CMMS and BMS — not a replacement for them. Side project, currently at the concept/design-partner stage.

## Repo layout

- **`docs/`** — the product requirements documents and business plan, in order. `prd-v4.md` is current; v1–v3 are kept for history, each with a pointer to what superseded it. `product-phase-summary.md` is the running status snapshot.
- **`mockups/`** — the UI mockup source, authored as [Claude Design canvas](https://claude.ai/code) artboards (`.dc.html` files + `canvas.json` layout manifest). Eight screens: Dashboard, Visitors, Incidents & Maintenance, Download Center, Tickets, Remote/Smart Hands, Provider Console, CS Engagement & Performance.
- **`prototype/`** — a working React + Vite front-end prototype with in-memory mock data (no backend). See `prototype/README.md` for what's implemented and how to run it.
- **`showcase/index.html`** — a single self-contained HTML page: personas across both sides of the platform and a storyboarded workflow for each MVP module. Open it directly in a browser, or host it anywhere static.

## Current MVP scope (per PRD v4)

Six modules: Visitor Management, Incident Management, Download Center, Ticketing (Complaint / RFI / Service Request), Remote / Smart Hands, and an internal-only CS Engagement & Performance module — plus an enterprise account model (one customer enrolled across multiple sites of the same provider) and multi-tenant isolation by provider. BMS Telemetry is scoped but deliberately deferred.

## Working here

```bash
cd prototype
npm install
npm run dev
```

Then open the printed local URL (typically http://localhost:5173).

The mockups are `.dc.html` source files meant to be edited through the Claude Design canvas editor, not run directly — see `docs/product-phase-summary.md` for the published canvas link.
