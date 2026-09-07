> **Superseded by `docs/prd-v7.md`.** v7 reverses this version's Section 4 decision to administer Region/Country/City/Site each on their own page: they're consolidated back into one staged screen, based on direct product feedback that the multi-page navigation cost more clicks than it saved for how infrequently this master data actually changes. Everything else in this document — Room, ControlledArea, AreaChangeRequest, the Global Sys Admin/Service Desk delegation model — is unchanged. Kept here for history only.

# CSSP — Product Requirements Document (v6)
## Redefining Area: A Six-Level Location Hierarchy, Multi-Location Tenants, and Governed Master Data

**What changed from v5:** the facility hierarchy — flat at three levels (`Region → Facility → Building`) since v5 — is redefined into a full six-level **area** hierarchy: **Region → Country → City → Site → Building → Room**. This isn't a bigger version of the same idea; it fixes a real gap the v5 model papered over. v5's `Region` was doing double duty as both a continent-scale grouping (for CS Team scope, reporting) *and* a country-scale grouping (the seed data literally created `Region { name: "Indonesia" }`), because there was nowhere else in the model to put "country." Splitting Region and Country apart, and adding City as the level that actually owns a Site, matches how a real multi-country colocation provider organizes its footprint — and matches the terminology this project's own UI already used informally ("site" appears throughout the tenant portal despite the model being named `Facility`). Three more things come with it: **Room** as an explicit sixth level (a data hall, a mechanical room, a meeting room — the granularity ops staff actually mean when they say "where"), **controlled areas** so a tenant's footprint at a site can be scoped to a specific building or room rather than only "the whole facility," and a **governance model** for who can change this master data and how everyone else requests a change.

## 1. Goal (extended from v5)

Unchanged core goal (v5 Section 1): one consolidated portal for a colocation provider's enterprise customers, with a matching internal console for the provider's own staff. Extended for v6: the "where" that every other module (visitors, incidents, maintenance, telemetry, billing, AAL) hangs off of is now modeled at the granularity a real global provider needs — able to represent a footprint from "APAC" down to "Data Hall 001" — instead of the three flat levels that got the MVP through its first build.

## 2. The Area Hierarchy (new)

| Level | Entity | Example | Notes |
|---|---|---|---|
| 1 | Region | APAC, ANZ, EMEA, LATAM | Broad geography grouping. Used for reporting and delegated scope (a CS Team member or Service Desk agent can be scoped to one Region). Not tied to a single continent's political boundaries — it's the provider's own commercial grouping. |
| 2 | Country | Indonesia (ID), Malaysia (MY), Singapore (SG), Thailand (TH), Japan (JP), Hong Kong (HK), Finland (FI), Spain (ES) | ISO 3166-1 alpha-2 codes. Belongs to one Region. |
| 3 | City | Batam, Jakarta, Johor Bahru, Lahti, … | Belongs to one Country. A City can exist as master data with no Site yet — see Section 5's Madrid example. |
| 4 | Site | NDP, KTP, CTP, NTP, KVTP | Modeled as `Facility` in the schema for historical reasons — this is the same entity `SiteEnrollment`, ACS integration, telemetry, incidents and maintenance already scope to. "Site" is the term this project's UI and PRDs already used informally; v6 makes City→Site the formal parent link instead of Region→Facility. |
| 5 | Building | NDP-A, KTP-J, CTP-B | Unchanged from v5 — belongs to one Site. |
| 6 | Room | DH001, DH103, MMR, Visitor Center Meeting Room | New. Belongs to one Building — a data hall, a mechanical/meter room, a meeting room. |

**Why City sits between Country and Site, not folded into either:** a provider with several sites in the same metro area (not true yet in this build, but a one-Region, several-Country, several-City-per-Country footprint is exactly what a provider expanding from "one country" to "one region" looks like) needs city-level rollup for reporting and delegated scope independent of which specific site a visitor, incident or invoice belongs to. Collapsing City into Site would mean re-deriving "how many sites do we have in Southeast Asia" from a facility list every time instead of reading it off the hierarchy directly.

**Why Region and Country are now distinct** (the actual bug this version fixes): the v5 model's `Region` held country-level rows (`{ name: "Indonesia", code: "ID" }`) because there was no country level to put them in. That meant "Region" couldn't be used for its intended purpose — continent-scale delegated scope (a CS Team member scoped to "all of APAC") — without it silently meaning "all of Indonesia" instead. v6's CS Team `Region` scope (`csScope: "Region"`) now correctly means the top level of the hierarchy.

## 3. Tenants, Multiple Locations, and Controlled Areas (new)

An `EnterpriseAccount` (tenant) already could enroll at more than one `Facility`/Site via `SiteEnrollment` — v6 doesn't change that. What's new is **`ControlledArea`**: a tenant's leased/controlled footprint *within* one site enrollment, scoped to a specific Building and, optionally, a specific Room. Before v6, a `SiteEnrollment` only had a free-text `spaceRef` ("Cage 7, Racks C10–C20") with no structured link into the Building/Room hierarchy — fine for a human reading a table, useless for anything that needs to reason about it (which rooms does this tenant actually have access to, across which of their sites). `ControlledArea` is additive, not a replacement: `spaceRef` stays as the free-text summary; a `SiteEnrollment` can have zero, one, or several `ControlledArea` rows when the contractual footprint needs that precision.

This build's demo data gives Nusantara Cloud a second country (they were Indonesia-only in v5): a new enrollment at NDP in Johor Bahru, Malaysia, with a `ControlledArea` scoped to Building A / Data Hall 001 — one tenant, two countries, one of the enrollments narrowed to room granularity.

## 4. Master Data Ownership & Delegation (new)

Area master data (every level in Section 2) is owned by the **Global Sys Admin** and may be **delegated to Service Desk** — both roles already existed (v5's RBAC redefinition), but Area management was Sys-Admin-only through v5. v6 adds `requireMasterDataAdmin()` (Sys Admin OR Service Desk) as the gate on every Area page and action, replacing the stricter Sys-Admin-only check the old Regions/Facilities pages used. This is a real permission change, not a relabeling: a Service Desk agent can now create a Region/Country/City directly, add a Site, add a Building, add a Room — the same actions a Sys Admin can take — without needing a Sys Admin's login.

**Each level is administered on its own page, deliberately not consolidated.** Regions, Countries, Cities and Facilities (Sites, with their Buildings and Rooms) are four separate pages under Global Administration, each independently manageable — a Region rename doesn't require opening a "everything geography" screen, and neither does adding a Room. The one deliberate exception is **site onboarding**: creating a Facility is how a Global Admin (or delegated Service Desk agent) acts on a signed contract, and a new contract often means a new country or city the platform hasn't seen yet. The "Onboard a new site" form (`/ops/admin/facilities/new`) lets the admin add that Country and/or City inline, right there, instead of requiring a detour through the standalone Countries/Cities pages first — a convenience layered on top of the independent pages, not a replacement for them. This mirrors the real process: Global Admin acts on the contract and stands up the site; Customer Success only engages the tenant later, once the site is nearing RFS (Ready for Service) and there's an actual onboarding session to run — Area/Site master data and the tenant relationship are two different jobs on two different clocks, which is exactly why `CS_TEAM` has no access to any of this (see `requireMasterDataAdmin()` — CS Team isn't in the allowed list, same as every role below).

**Everyone else raises a ticket.** Any other internal role (Ops Site Manager, Ops Site Lead, Front Office & Security, CS Team, an external Ops Vendor) doesn't get edit access to Area master data — they submit an `AreaChangeRequest`: level (Region/Country/City/Site/Building/Room), action (Add/Update/Deactivate), free-text context and justification, and an optional proposed name/code. It lands in a queue Sys Admin/Service Desk triage (Submitted → InReview → Approved/Rejected → Applied). This isn't a new communication channel bolted on for its own sake — it's the same "raise a ticket to Service Desk" pattern this project already uses for Service Requests, applied to the one category of change (master data) that shouldn't be self-service for most internal roles: getting a Site's Region/Country/City wrong, or losing track of which Building a Room belongs to, corrupts every report and every delegated-scope filter built on top of it.

The demo data seeds this end-to-end: Madrid exists as a City with no Site yet, and a Submitted `AreaChangeRequest` from the CS Manager asks for one (`MDP — Madrid`) — exactly the request this flow is for. A second, Approved request (a new Data Hall room at NDP) shows the triage side of the lifecycle.

## 5. MVP Scope (updated from v5 Section 8)

| Module | Customer side | Provider side | Notes |
|---|---|---|---|
| Regions | — (internal only) | Global Sys Admin or Service Desk manage | **New in v6** — split out of the old flat, Sys-Admin-only "Regions" |
| Countries | — (internal only) | Global Sys Admin or Service Desk manage; also addable inline while onboarding a site | **New in v6** |
| Cities | — (internal only) | Global Sys Admin or Service Desk manage; also addable inline while onboarding a site | **New in v6** |
| Sites, Buildings, Rooms | Global Admin sees roll-up across enrolled sites; Site Contact sees their one site | Global Sys Admin or Service Desk onboard sites (contract-driven) and manage Buildings/Rooms; Room is new | Room level new in v6; site creation is the contract-onboarding entry point |
| Controlled Areas | Tenant's structured footprint (building/room) within an enrolled site, alongside the existing free-text `spaceRef` | Defined per site enrollment from the tenant's account page | **New in v6** |
| Area Change Requests | — (internal only) | Any internal role submits; Sys Admin/Service Desk triage and apply | **New in v6** — the ticket-to-Service-Desk flow for master data |
| *(All other v5 modules — Visitor Management, Incidents, Maintenance, Ticketing, Remote/Smart Hands, BMS Telemetry, Download Center, Billing, CS Engagement & Performance, Branding)* | Unchanged | Unchanged | Still scope to Site/Building exactly as in v5 — Country/City/Room don't change how those modules filter, they only make the location data those filters read from more precise. |

## 6. Data Model (v6 changes — extends v5 Section 9)

| Entity | Key fields | Notes |
|---|---|---|
| Region | name, code | Unchanged shape; meaning corrected — continent-scale only, no longer holds country-level rows. |
| Country | name, code (ISO 3166-1 alpha-2), region_id | **New.** |
| City | name, country_id | **New.** |
| Facility ("Site") | name, code, city_id, address, timezone, acs_endpoint_url | `region_id` replaced with `city_id` — region is now derived via City → Country → Region. |
| Room | name, code, building_id | **New** — sixth hierarchy level. |
| ControlledArea | site_enrollment_id, building_id (optional), room_id (optional), label, access_notes | **New** — a tenant's structured footprint within one site enrollment. |
| AreaChangeRequest | level, action, context, proposed_name, proposed_code, notes, status, requested_by_id, assigned_to_id, decided_by_id, decision_notes, decided_at | **New** — the internal ticket-to-Service-Desk flow for master data changes. |

## 7. Core User Flows (new for v6)

**Contract-driven site onboarding:** a contract closes for a new site in a country the platform hasn't opened yet. A Service Desk agent (delegated, no Sys Admin needed) opens "Onboard a new site," picks the existing Region, and — since the country and city are new — adds both inline in the same form instead of visiting the standalone Countries/Cities pages first, then fills in the site itself. The Country and City now exist as independent master data too, reachable and editable from their own pages afterward, and Buildings/Rooms are added from the new site's own detail page.

**Standalone master-data upkeep:** separately, a Sys Admin notices a Region's display name needs fixing, or wants to pre-create a Country ahead of a contract that hasn't closed yet. They go straight to Regions or Countries — no site involved, no detour through onboarding.

**Internal change request:** an Ops Site Lead notices NDP's Building A needs a second data hall room ahead of a capacity increase. They don't have Area edit access, so they submit an AreaChangeRequest (level: Room, context: the NDP/Building A path, proposed name/code, justification). Service Desk sees it in their triage queue, marks it Approved with a decision note, and applies the room once the physical fit-out is confirmed.

**Multi-location tenant with a controlled area:** Sys Admin enrolls Nusantara Cloud (previously Indonesia-only) at NDP in Malaysia, then defines a ControlledArea scoped to Building A / Data Hall 001 with an access note — the tenant's second-country footprint is now structured data, not just a free-text space reference.

## 8. Open Questions (extends v5 Section 12)

New for this version: whether CS Team scope should eventually gain a "Country" option between "Region" (now genuinely continent-scale) and "Site" — not needed yet with one active Region (APAC) fully populated, but likely once EMEA (Finland, Spain) goes from master data to live sites; whether `AreaChangeRequest` needs its own notification (today it's visible only by visiting the queue, unlike Incidents/Maintenance which push notifications) once ticket volume justifies it; and whether `ControlledArea` should eventually support multiple buildings per row (today one row = one building-or-room) once a tenant's footprint spans more than one building at a single site.
