> **Superseded by `claude/prd-v4.md`.** v4 adds Remote/Smart Hands as a first-class MVP module (structured task requests, technician assignment, completion proof, billable time tracking) rather than a generic Service Request ticket subtype. Kept here for history only.

# CSSP — Product Requirements Document (v3)
## Consolidated Customer Interface over DCIM / CMMS / BMS, with Enterprise Multi-Site Accounts and CS Performance Tracking — MVP

**What changed from v2:** three additions, all confirmed directly rather than assumed. (1) Multi-tenancy is promoted from a background NFR to an explicit architecture section, because it's the one thing in this system that truly cannot be retrofitted. (2) The customer-side account model now supports an **enterprise account enrolled at multiple facilities of the same provider**, not just one facility — a global or regional customer needs one login and one roll-up view across every site they occupy. (3) A new internal-facing module, **CS Engagement & Performance**, is added to the MVP scope: the provider's CS team logs customer interactions through the portal, and that same activity rolls up into KPI tracking for the team. This is a genuine scope expansion on top of v2, not a reframing — flagged honestly in Section 12.

## 1. Goal (unchanged from v2, extended)

Give a colocation provider's enterprise customers one consolidated place to register visitors, see incident/maintenance status, download reports, and raise tickets — across every facility they occupy with that provider, not just one. Give the provider's CS/NOC/security teams a single interface to publish that information out and manage the relationship, with their own engagement activity and performance visible to their managers. Success is still behavioral: pilot customers using the portal instead of their current channels, and CS managers actually using the KPI view instead of a separate spreadsheet.

## 2. Positioning (unchanged from v2)

CSSP remains a consolidated, customer-facing integration layer over the provider's DCIM/CMMS/BMS — not a replacement for them (see v2 Section 2 for the full reasoning, still valid). The CS Engagement & Performance module added in this version is the one piece of CSSP that is *not* about consolidating an external system — it's a native, internal-only capability, because in this plan's experience providers rarely have a proper system for this either (CS activity typically lives in scattered notes, a generic CRM's activity log, or nowhere at all).

## 3. Multi-Tenancy Architecture (new — promoted from NFR)

**Tenant = colocation provider (Organization).** Every other entity in the system — Facility, EnterpriseAccount, User, Ticket, Visitor, Document, Incident, EngagementLog — is scoped to exactly one Organization, with no exceptions and no cross-tenant visibility, ever. This is the one architectural decision that must be right from the first line of backend code, because retrofitting tenant isolation into a system that wasn't built for it (versus enforcing it at the database layer from day one) is a rewrite, not a patch.

Practical implementation guidance for whoever builds this: enforce isolation at the database layer, not just in application code — Postgres row-level security (RLS) policies keyed on `organization_id`, so a bug in one API endpoint can't leak another tenant's data even if someone forgets a `WHERE` clause. Every table carries `organization_id` (directly or via a scoped foreign key), every query is tenant-scoped by default, and tenant scoping is enforced in one shared place (middleware or an RLS policy), not re-implemented per endpoint. This is worth the up-front discipline even though the MVP will likely run its first 1-2 pilots as the only tenants in the system — the second pilot customer is exactly when a shortcut taken here becomes expensive.

**What multi-tenancy does *not* mean here**, per the confirmed scope: no customer needs a single login spanning two different colocation providers (two different tenants). An enterprise customer that colocates with two unrelated providers would have two separate CSSP logins, one per provider, same as they'd have two separate accounts with any other SaaS vendor's customers. Cross-tenant aggregation was considered and explicitly ruled out — it's a materially different (and much harder) architecture that nothing in the confirmed requirements actually needs.

**Tenant-level configuration** worth planning for even if not built in the first release: white-labeling (the provider's own logo/colors on the portal — MCIM offers this and it's a reasonable customer expectation), and per-tenant feature flags (a smaller Starter-tier provider might not want the CS Performance module cluttering their console at all — see Section 7's tiering).

## 4. Enterprise Accounts & Multi-Site Enrollment (new)

**The core change:** what v2 called `Account` — a flat, one-facility-at-a-time customer record — becomes `EnterpriseAccount`, which can be enrolled at *any number* of the provider's facilities through a join entity, `SiteEnrollment`. A customer like "Meridian Logistics" might have one enterprise account with three site enrollments: a cage at BTM-02, a suite at JKT-01, and (once the provider expands, per the business plan's Phase 3 geographic expansion) a rack at a new facility in another country — all visible from one login, one dashboard, one set of tickets and documents, rolled up.

This changes the customer-side user model too. A **Global Admin** (the enterprise account's HQ contact — think a regional IT director) sees everything across every site enrollment. A **Site Contact** (a local facility manager) is scoped to just their own site enrollment and doesn't see other sites' tickets, visitors, or documents unless promoted to Global Admin. This mirrors how the provider's own staff are already scoped by facility, just on the customer side.

**What stays site-scoped vs. what rolls up:** Visitors, Tickets, and Incidents/Maintenance remain tied to a specific site enrollment (a visitor is physically at one facility; an incident affects one facility) — a Global Admin sees all of them across sites in one combined view, while a Site Contact sees only their own. Documents can be published at either the site level (an SLA report for one facility) or the enterprise level (a compliance certificate that covers the whole account, or applies to the provider's business overall) — the Download Center's `account_id`/`facility_id` fields from v2 already support this with `facility_id` nullable, no change needed there.

## 5. CS Engagement & Performance (new module, in MVP)

**What it does:** every interaction a CS rep has with an account — a call, an email thread, a site visit, a ticket they personally resolved — gets logged (manually for calls/emails/visits; automatically for ticket activity) against that account. That log is the raw material for two things: a relationship history the whole CS team can see when they pick up someone else's account (solving the classic "the one person who knows this customer is on leave" problem), and a set of team KPIs a CS manager can actually see instead of asking each rep how their week went.

**Customer side:** none. This module is entirely internal — customers never see engagement logs or KPI data. The one customer-visible touchpoint is optional and small: a one-tap satisfaction rating (thumbs up/down, or 1-5) offered when a ticket is marked Done, which feeds the CSAT metric below without adding a customer-facing screen of its own.

**Provider side, two views:**
- **My Engagement** (every CS rep): a log of their own touchpoints per account — add a new entry (type: call/email/meeting/site visit, account, notes, outcome), see history. Tickets they're assigned automatically appear in the same timeline so the log isn't double-entry.
- **Team Performance** (CS managers only — a new permission, not a new role from scratch): a KPI table across the team — tickets handled and resolved per rep, average first-response time, average resolution time, engagement touchpoints logged per account per month, and CSAT average where customers have rated. This is deliberately simple for the MVP: a table and a few aggregate numbers, not a full analytics suite.

**Data model implication worth naming up front:** engagement logs and KPI data are about the provider's own employees' performance, not about the customer relationship in the way a ticket is. That makes it sensitive in a different way — see Section 8's access-control note — and it's the kind of internal HR-adjacent data that should never be visible to another rep (only to the rep themselves and their manager), let alone to any customer.

## 6. MVP Scope (updated)

| Module | Customer side | Provider side | Notes |
|---|---|---|---|
| Enterprise Accounts & Sites | Global Admins see roll-up across sites; Site Contacts see their own site | Manage site enrollments per enterprise account | Cross-cutting — affects every other module's scoping, not a screen of its own |
| Visitor Management | Register/track visitors per site | Approve/deny, check in/out | Unchanged from v2, now explicitly site-scoped |
| Incident Management | See incidents/maintenance per site (roll-up for Global Admins) | Publish incidents (manual adapter, per v2 Section 8) | Unchanged from v2 |
| Download Center | Browse/download site- or enterprise-level documents | Publish documents at site or enterprise level | Unchanged from v2 |
| Request Ticketing | Raise Complaint/RFI/Service Request per site | Triage queue across all accounts/sites | Unchanged from v2 |
| CS Engagement & Performance | — (internal only; optional CSAT prompt) | Log engagement (all CS staff); Team Performance KPI view (managers) | New in v3 |
| BMS Telemetry | — | — | Still optional/stretch, still deferred (v2 Section 8's integration-difficulty reasoning is unchanged) |

Still explicitly **out of scope**: CRM in the contract/renewal/sales-pipeline sense (engagement tracking is not the same thing as contract management — that distinction matters, see Section 12), a native mobile app, multi-language support, and any cross-tenant functionality (Section 3).

## 7. Business Model Implication (for the business plan)

Enterprise multi-site accounts and CS performance tracking both strengthen the case for the business plan's Enterprise pricing tier (Section 7 of the business plan): multi-site rollup is exactly the kind of capability a larger, multi-facility provider's biggest customers would pay a premium for, and CS performance tracking is a legitimate additional differentiator against MCIM (whose public materials describe customer-facing features, not internal team performance tooling) worth adding to the competitive section.

## 8. Data Model (v3)

| Entity | Key fields | Notes |
|---|---|---|
| Organization | name, tier | The tenant — a colocation provider |
| Facility | name, address, organization_id | A data center site |
| EnterpriseAccount | name, organization_id | Was `Account` in v2 — the customer, now decoupled from any single facility |
| SiteEnrollment | enterprise_account_id, facility_id, status | Join entity — one enterprise account can have many site enrollments, one per facility |
| User | name, email, role (customer-global / customer-site / provider-cs / provider-cs-manager / provider-ops / provider-security), enterprise_account_id, site_enrollment_id (nullable — null means Global Admin) | Role and scope together drive visibility |
| Visitor | site_enrollment_id, visitor_name, visitor_company, host_user_id, visit_start, visit_end, status | `facility_id`/`account_id` from v2 replaced by one `site_enrollment_id` reference |
| IncidentOrMaintenance | facility_id, type, status, start/end, description, source | Unchanged from v2 |
| Document | enterprise_account_id, facility_id (nullable = enterprise-wide), title, category, file_ref, published_by, published_at | `account_id` renamed to `enterprise_account_id`; nullable `facility_id` now does double duty as v2 intended |
| Ticket | site_enrollment_id, category, subtype, status, created_by, assigned_to, created_at, resolved_at, csat_rating (nullable) | Adds `csat_rating` for the optional post-resolution rating |
| EngagementLog | organization_id, enterprise_account_id, site_enrollment_id (nullable), logged_by_user_id, type (call/email/meeting/visit/ticket), notes, occurred_at, linked_ticket_id (nullable) | New in v3 |

## 9. Non-Functional Requirements (updated)

Multi-tenant isolation (Section 3) is now the top NFR, stated as an architecture requirement rather than a bullet point. Within a tenant, the Global-Admin-vs-Site-Contact distinction (Section 4) is a second layer of scoping that needs the same discipline — a Site Contact at one facility must never see another site's tickets or visitors through a missing scope check, the same class of bug as a cross-tenant leak, just one level down. Engagement logs and KPI data need their own access rule distinct from customer data: visible to the logging rep and their manager only, never to peer reps, and never to any customer role, regardless of Global Admin status (this is provider-internal data about the provider's own staff, not customer data). The Indonesia PDP compliance note from v2 (Section 7) still applies to visitor data and now also to CSAT ratings, which are personal opinion data tied to an identifiable customer contact.

## 10. Integration Approach

Unchanged from v2 Section 8 (the Manual Adapter / DCIM Adapter / BMS Adapter pattern, and the reasoning for why BMS is genuinely harder to integrate than DCIM/CMMS). Nothing about multi-tenancy, enterprise accounts, or CS performance tracking changes that reasoning — worth noting explicitly since it would be easy to assume "more scope" means "revisit integration strategy too." It doesn't; that part was already right.

## 11. Open Questions (extends v2 Section 9)

Two new questions join v2's list (still unresolved, still worth checking with real design partners rather than guessing further): whether providers actually want CSAT ratings shown to individual reps (some CS cultures find this motivating, others find it demoralizing if done wrong — worth asking rather than assuming), and whether "Team Performance" needs any historical trend view for the MVP or whether current-period snapshot numbers are enough to prove the concept (leaning toward snapshot-only for MVP, per the same instinct that kept BMS Telemetry out — build the simplest version that proves the module is worth using before investing in trend charts).

## 12. Honest Flag on Scope (new section)

This is the third round of scope changes to what started as a narrow, single-flow MVP (v1: service requests only). Each addition has been a legitimate correction from real domain knowledge, not scope creep for its own sake — but it's worth naming plainly that "MVP" now covers five customer-facing modules, an enterprise account hierarchy, and an internal team-performance system, which is a meaningfully larger build than the original 3-6 month estimate in the business plan. Two things worth deciding before this goes to a contract developer for a quote: whether all of this needs to exist before the *first* design-partner conversation (a case could be made that Visitors + Tickets + Incidents + Documents is enough to test the core "replace email" hypothesis, with Enterprise Accounts and CS Performance built once that hypothesis is validated rather than before), and whether the milestone table in the business plan (Section 12) needs another honest timeline revision now that the scope has grown twice since it was written. This isn't a recommendation to cut anything — it's a flag that the build-sequencing conversation (what ships to the very first pilot vs. what ships to the second) is now worth having explicitly, since "build everything, then find a pilot" is a slower and riskier path than "build enough to test the core loop, then expand with a real pilot's feedback in hand."
