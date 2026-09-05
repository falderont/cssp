# CSSP — Product Phase v4 (Mockups + MVP Prototype)

Supersedes the v3 scope. v4 adds Remote/Smart Hands as a first-class MVP module — structured task requests (task type, asset/rack reference, requested window), technician assignment, completion proof, and billable time tracking — rather than a generic Service Request ticket subtype. Full detail in `claude/prd-v4.md`; `claude/prd-v1.md`, `claude/prd-v2.md` and `claude/prd-v3.md` are kept for history only.

The MVP is now six customer-facing modules (Visitor Management, Incident Management, Download Center, Ticketing, Remote/Smart Hands, and optional/stretch BMS Telemetry), an enterprise account hierarchy (multi-site enrollment, Global Admin vs. Site Contact), and an internal-only CS Engagement & Performance module. See PRD v4 Section 13 for the honest scope-growth flag — this is now the fourth round of confirmed expansion since the original single-flow MVP.

## UI/UX Mockups

Published as a design canvas (same URL, updated in place): https://claude.ai/code/artifact/d882a8b8-f472-44f1-80ab-779c9ad6029f

Eight screens, "Clean enterprise SaaS" direction (light, slate/blue, Space Grotesk + IBM Plex Sans):
- Customer Dashboard — cross-module overview (visitors, tickets, remote hands, incidents, documents), enterprise/site switcher in the sidebar
- Visitor Management — visit list + registration form
- Incidents & Maintenance — timeline view
- Download Center — document library with category filters
- Tickets — Complaint/RFI/Service Request list + submission form
- **Remote / Smart Hands** (new) — customer request form + status tracker (Submitted → Accepted → In Progress → Completed) with completion proof
- Provider Console — tabbed queue (Ticket Queue / Remote Hands / Visitor Approvals / Documents)
- **CS Engagement & Performance** (new) — internal-only: My Engagement log and a CS-manager Team Performance KPI table

BMS Telemetry remains deliberately left out per the PRD's phasing (fast-follow once there's a specific pilot + BMS vendor to design against).

## Working MVP Prototype

A functional React + Vite prototype (mock in-memory data, no backend), delivered to the user as a zip file. Verified end-to-end with a headless browser: a customer registers a visitor → the provider approves it → the status reflects back; a customer submits a ticket → appears in the provider's queue → status update reflects back; a provider publishes a document → appears in the customer's Download Center; a provider posts an incident → appears in the customer's Incidents & Maintenance timeline; a customer switches the sidebar's site selector and every module scopes to that facility; a customer submits a Remote Hands request → the provider accepts and assigns a technician → starts the task → completes it (billable minutes computed automatically, and the completion auto-logs into CS Engagement); a CS manager's Team Performance table renders KPI rows per rep, and a rep logs a touchpoint under My Engagement. Incidents/maintenance are posted manually in the prototype, standing in for the "Manual Adapter" the PRD describes — the real build would pull this from the provider's DCIM/CMMS instead.

## Status / Next Steps

Both deliverables are meant for design-partner conversations (Business Plan Phase 1). Next decisions: which design partners to approach (pending the employment/non-compete review flagged in the business plan); the open questions carried forward from PRD v2 section 9 through v4 section 12 (existing visitor/access-control systems, visitor ID data under Indonesia's PDP law, Download Center document sourcing, which DCIM/CMMS/BMS systems real pilots run); and — flagged explicitly in PRD v4 Section 13 — the build-sequencing question of what ships to the very first pilot (a reasonable candidate: Visitors + Tickets + Incidents + Documents) versus what's held for a fast-follow once that core hypothesis is validated, given how much the "MVP" has grown across four rounds of confirmed scope changes.
