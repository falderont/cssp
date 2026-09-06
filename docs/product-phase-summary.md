# CSSP — Product Phase v5 (Real Application)

Supersedes the v4 phase (mockups + a mock-data prototype). Full rationale in `docs/prd-v5.md`; `docs/prd-v1.md` through `docs/prd-v4.md` are kept for history only.

## What changed

Three things, all covered in PRD v5: (1) the facility model gained a `Region → Facility → Building` hierarchy, (2) a customer-facing, read-only Billing/Invoice module joined the MVP scope, and (3) — the big one — this phase built the actual application instead of another round of mockups or a mock-data prototype: `webapp/` is a real Next.js + PostgreSQL app with Postgres row-level security enforcing tenant isolation for a genuinely restricted database role, real authentication, real file upload/download, and all nine MVP capabilities working against real data.

## What's running

`webapp/` — see `webapp/README.md` for setup, demo credentials, and an honest list of what's deliberately thin (every external-system boundary is a `Mock*` adapter behind a real interface; local-disk file storage; create-only admin screens). Verified end-to-end with a headless browser across every module and every role: visitor registration → provider approval → access-credential issuance (mock adapter) → check-in/check-out; ticket creation → assignment → resolution → auto-logged into CS Engagement → customer CSAT rating; a Remote Hands request → accept & assign → start → complete with a real uploaded photo → billable minutes computed automatically → rolled into a customer-visible invoice line item; document upload → download with correct headers → verified account-level isolation (an upload to one enterprise account is invisible to a different account in the same tenant); a brand-new user created through the Provider Setup screen logging in immediately and seeing exactly their own scope. `prisma/tests/tenant-isolation.test.ts` (run via `npm test` in `webapp/`) automates the tenant-isolation half of that against the real `cssp_app` Postgres role — not a mock.

`mockups/` and `prototype/` are unchanged from the v4 phase and are no longer grown in place, per both their own READMEs.

## Status / Next Steps

The build-sequencing question flagged in PRD v3 Section 12 and carried through v4 Section 13 — what ships to the very first design-partner pilot versus what's held for a fast-follow — is now moot in one sense (all nine capabilities exist and work) but still real in another: before a pilot, decide whether to demo the full breadth or lead with the four modules PRD v4 flagged as testing the core hypothesis (Visitors + Tickets + Incidents + Documents), holding Remote Hands/CS Engagement/Billing/BMS as "also already built, ask if you want to see it." The open questions carried since PRD v2 Section 9 are unchanged and still open: which design partners to approach, visitor ID data under Indonesia's PDP law, and which DCIM/CMMS/BMS/PACS/billing systems a real pilot actually runs — that last one now has a concrete answer waiting behind each adapter interface (`webapp/lib/adapters/`) the moment it's known.
