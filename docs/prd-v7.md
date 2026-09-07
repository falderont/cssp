# CSSP — Product Requirements Document (v7)
## Consolidating Area Master Data Management Into One Screen

**What changed from v6:** v6 split Region/Country/City/Facility administration into four independent pages, deliberately not consolidated, reasoning that "a Region rename doesn't require opening a 'everything geography' screen." In practice that traded a rare edit (renaming a Region) for a common one (finding where a given Site actually sits in the hierarchy, or setting one up end to end) — a Global Admin or delegated Service Desk agent had to hop across four pages to see Region → Country → City → Site as one picture, or to build out a brand-new location. v7 reverses that one decision: Region, Country, City and Site are staged on a single screen (`/ops/admin/facilities`, still gated by `requireMasterDataAdmin()`) as an expandable tree, with each level added inline as you drill in — no page navigation, no detour through a separate "onboard a site" form. A Site row hands off to its own dedicated per-site admin page for Buildings and Rooms, unchanged from v6.

Nothing else about v6 changes. Room, ControlledArea and AreaChangeRequest keep their v6 shape and behavior; the Global Sys Admin/Service Desk delegation model is unchanged; every other module still scopes to Site/Building exactly as before.

## 1. What the consolidated screen replaces

| v6 | v7 |
|---|---|
| `/ops/admin/regions` — Regions, its own page | Folded into the tree on `/ops/admin/facilities` |
| `/ops/admin/countries` — Countries, its own page | Folded into the tree |
| `/ops/admin/cities` — Cities, its own page | Folded into the tree |
| `/ops/admin/facilities/new` — "Onboard a new site" form with `countryMode`/`cityMode` toggles for a brand-new location | Removed as a separate page. The same outcome (a Site in a country/city the platform hasn't seen yet) is reached by adding each level inline while drilling down the tree — Region → "+ Add country" → "+ Add city" → "+ Add site" — all without leaving the screen. |
| `/ops/admin/facilities` — Sites list (table) | Now the consolidated tree itself; a Site row still links to its unchanged per-site admin page. |

`createRegion`, `createCountry`, `createCity` and `createFacility` (`src/actions/admin.ts`) keep the same `requireMasterDataAdmin()` gate and audit logging; only their calling convention changed, from a form-selected parent id to a bound parent id supplied by whichever tree node the inline form appears under.

## 2. Why now

This is a UI-only reversal, not a new data-model decision — v6's six-level hierarchy, its governance model, and its ticket-based change-request flow for non-admin roles are all sound and stay as-is. The lesson is narrower: for master data that changes rarely but needs to be *found* often (which country is Site X in? has this metro been opened yet?), one screen that shows the whole shape beats four screens that each show a slice of it. The countryMode/cityMode "new vs. existing" toggle in the old onboarding form solved the same problem the tree now solves more directly — seeing and building the hierarchy in the same place — so it's retired rather than ported forward.

## 3. Non-goals

This version does not touch Room/ControlledArea/AreaChangeRequest, does not change who can administer this master data (still Global Sys Admin, delegable to Service Desk), and does not add editing or deletion of any hierarchy level — creation-only, matching the rest of this admin surface's existing convention.
