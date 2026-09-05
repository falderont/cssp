# CSSP — Product Requirements Document (v4)
## Consolidated Customer Interface over DCIM / CMMS / BMS, with Enterprise Multi-Site Accounts, CS Performance Tracking, and Remote/Smart Hands — MVP

**What changed from v3:** one addition, confirmed directly: **Remote Hands / Smart Hands** — a colocation provider's staff performing physical tasks in the data center on a customer's behalf (power-cycling a device, a visual inspection, a cable patch, mounting/unmounting hardware, KVM console access) — is promoted from a loose example under v2's generic "Service Request" ticket subtype into its own first-class MVP module, with structured request fields, technician assignment, completion proof, and billable time tracking. This is the fourth round of scope growth on what began as a single-flow MVP; see the updated Section 13.

## 1. Goal (unchanged from v3)

Give a colocation provider's enterprise customers one consolidated place to register visitors, see incident/maintenance status, download reports, raise tickets, and now request physical remote-hands work — across every facility they occupy with that provider. Give the provider's CS/NOC/security/ops teams a single interface to publish information, manage the relationship, fulfill physical task requests, and track their own performance. Success remains behavioral: pilot customers using the portal instead of their current channels, CS managers using the KPI view, and — new for this version — remote hands requests being submitted and tracked through the portal instead of an ad hoc phone call or email to whoever's on shift.

## 2. Positioning (unchanged from v3)

CSSP remains a consolidated, customer-facing integration layer over the provider's DCIM/CMMS/BMS (v2 Section 2). Remote Hands, like CS Engagement & Performance, is **not** a read-through integration over an existing system — in this plan's experience, most mid-market providers fulfill remote-hands requests today through exactly the channels CSSP exists to replace (a phone call to the NOC, a WhatsApp message to an account manager, an email with no tracking), so CSSP is likely the first real system of record for this workflow too, same as Visitor Management, Download Center, and Ticketing were in v2.

## 3. Multi-Tenancy Architecture (unchanged from v3)

See v3 Section 3 — tenant isolation via `organization_id` and Postgres RLS, no cross-tenant visibility, no change from Remote Hands. `RemoteHandsTask` (Section 8) is tenant-scoped like every other entity, with no exceptions.

## 4. Enterprise Accounts & Multi-Site Enrollment (unchanged from v3)

See v3 Section 4. Remote Hands requests are site-scoped like Visitors, Incidents, and (site-level) Tickets — a task happens at one facility, in one rack or cage — so a Global Admin sees remote-hands activity roll up across every site enrollment, while a Site Contact sees only their own site's requests.

## 5. CS Engagement & Performance (unchanged from v3)

See v3 Section 5. One addition: a completed Remote Hands task, like a resolved ticket, automatically appears in the assigned rep's or technician's "My Engagement" timeline (if the fulfilling technician is also a CS/ops user tracked by the module) so remote-hands work isn't invisible to relationship history or double-logged by hand.

## 6. Remote / Smart Hands (new module, in MVP)

**What it does:** a customer submits a structured request for the provider's on-site staff to physically do something in the data center — power-cycle a device, do a visual/physical inspection, patch or re-route a cable, mount or unmount hardware, provide temporary KVM console access, or something else described in free text. The provider assigns a technician, tracks the task from acceptance through completion, and — because this is typically a billable service distinct from ordinary support — records the time spent for invoicing.

**Why it's a distinct module rather than a Ticket subtype (the v2/v3 approach):** a generic Service Request ticket captures a category and free text; Remote Hands needs more structure to actually be fulfillable and billable — which asset/rack the work is on, what specifically to do, who's doing it, when it started and finished, and proof it was done. Folding that into a generic ticket form would either bloat every ticket with fields only Remote Hands needs, or leave Remote Hands under-specified the way it was in v2. It still shares the same underlying queue and site/tenant scoping as Tickets, so the provider console doesn't fragment into a fifth disconnected inbox — see Section 8's data model, which deliberately mirrors `Ticket`'s shape.

**Customer side:** submit a request — select facility/site, task type (Power Cycle / Visual Inspection / Cable Patch / Mount-Unmount Hardware / KVM Console Access / Other), asset or rack reference, description, and optionally a requested time window (some tasks are urgent, some can be scheduled); track status (Submitted → Accepted → In Progress → Completed) with the assigned technician's name visible once accepted; view completion notes and a completion photo once done — this is the customer's proof the work happened, in place of a re-explaining phone call after the fact; optionally rate the completed task (reuses the same one-tap CSAT prompt from Section 5, so this doesn't need its own rating UI).

**Provider side:** a Remote Hands queue (filterable by facility/status/task type, same pattern as the Ticket Queue), where ops/NOC staff accept a request and assign a technician (who may or may not be the same person accepting it); a technician-facing flow to Start Task (begins time tracking) and Complete Task (stops time tracking, prompts for completion notes and an optional completion-photo upload); billable minutes are computed automatically from start/complete timestamps but are editable by a manager before invoicing (real-world tasks get interrupted, and the raw timer shouldn't be the only source of truth for what gets billed).

**Billing implication worth naming for the business plan:** most colocation providers already sell remote hands as a distinct line item (often with a monthly included-hours allowance per contract tier, then hourly overage). CSSP tracking billable minutes per task doesn't need to *do* billing in the MVP — no invoicing engine — but the data (`billable_minutes` per task, per enterprise account, per period) is exactly what a provider's existing billing process needs and currently has to reconstruct manually from memory or a NOC log. This is worth a line in the business plan's pricing section as a concrete example of CSSP paying for itself beyond the subscription fee (see Section 12).

## 7. MVP Scope (updated)

| Module | Customer side | Provider side | Notes |
|---|---|---|---|
| Enterprise Accounts & Sites | Global Admins see roll-up across sites; Site Contacts see their own site | Manage site enrollments per enterprise account | Cross-cutting, unchanged from v3 |
| Visitor Management | Register/track visitors per site | Approve/deny, check in/out | Unchanged from v2 |
| Incident Management | See incidents/maintenance per site (roll-up for Global Admins) | Publish incidents (manual adapter) | Unchanged from v2 |
| Download Center | Browse/download site- or enterprise-level documents | Publish documents at site or enterprise level | Unchanged from v2 |
| Request Ticketing | Raise Complaint/RFI/Service Request per site | Triage queue across all accounts/sites | Unchanged from v2; Remote Hands split out (below), no longer a Service Request subtype |
| Remote / Smart Hands | Submit structured task request, track status, view completion proof, optional CSAT | Accept/assign, Start/Complete Task with time tracking, editable billable minutes | New in v4 |
| CS Engagement & Performance | — (internal only; optional CSAT prompt, now also from Remote Hands) | Log engagement (all CS staff); Team Performance KPI view (managers) | Unchanged from v3 |
| BMS Telemetry | — | — | Still optional/stretch, still deferred |

Still explicitly **out of scope**: CRM in the contract/renewal/sales-pipeline sense, a native mobile app, multi-language support, cross-tenant functionality, and — new for this version — any actual invoicing/billing engine (Remote Hands tracks billable minutes; it does not generate invoices).

## 8. Data Model (v4)

| Entity | Key fields | Notes |
|---|---|---|
| Organization | name, tier | The tenant — a colocation provider |
| Facility | name, address, organization_id | A data center site |
| EnterpriseAccount | name, organization_id | Unchanged from v3 |
| SiteEnrollment | enterprise_account_id, facility_id, status | Unchanged from v3 |
| User | name, email, role (customer-global / customer-site / provider-cs / provider-cs-manager / provider-ops / provider-security / provider-technician), enterprise_account_id, site_enrollment_id (nullable) | Adds `provider-technician` role for Remote Hands assignment; a technician may also hold provider-ops or provider-cs |
| Visitor | site_enrollment_id, visitor_name, visitor_company, host_user_id, visit_start, visit_end, status | Unchanged from v3 |
| IncidentOrMaintenance | facility_id, type, status, start/end, description, source | Unchanged from v2 |
| Document | enterprise_account_id, facility_id (nullable), title, category, file_ref, published_by, published_at | Unchanged from v3 |
| Ticket | site_enrollment_id, category (Complaint/RFI/ServiceRequest), subtype, status, created_by, assigned_to, created_at, resolved_at, csat_rating (nullable) | `RemoteHands` removed as a category value — now its own entity below |
| RemoteHandsTask | site_enrollment_id, task_type (PowerCycle/VisualInspection/CablePatch/MountUnmount/KVMAccess/Other), asset_or_rack_ref, description, requested_window_start (nullable), requested_window_end (nullable), status (Submitted/Accepted/InProgress/Completed), created_by, assigned_technician_id, started_at, completed_at, billable_minutes, completion_notes, completion_photo_ref, csat_rating (nullable) | New in v4 — deliberately mirrors `Ticket`'s shape (site-scoped, created_by/assigned_to, status lifecycle) plus the fields fulfillment and billing actually need |
| EngagementLog | organization_id, enterprise_account_id, site_enrollment_id (nullable), logged_by_user_id, type (call/email/meeting/visit/ticket/remote_hands), notes, occurred_at, linked_ticket_id (nullable), linked_remote_hands_task_id (nullable) | Extends v3 to link a completed Remote Hands task, same as a ticket |

## 9. Non-Functional Requirements (updated)

Unchanged from v3 (Section 9) with one addition: `billable_minutes` and `completion_photo_ref` on `RemoteHandsTask` are billing-adjacent data, so the same discipline as CSAT/engagement data applies — visible to the requesting enterprise account (their own tasks only, per site scoping) and to provider ops/CS-manager roles, not to peer customers, ever. Completion photos are the first binary-file-upload requirement in the system (v2's Download Center is provider-to-customer distribution of pre-made documents; this is customer-visible proof generated by provider staff in the field) — worth flagging to whoever scopes file storage, since it implies mobile-friendly photo capture/upload for technicians, not just desktop file picking.

## 10. Integration Approach (unchanged from v3)

Unchanged — the Manual/DCIM/BMS Adapter pattern from v2 Section 8 doesn't apply to Remote Hands, which has no external system of record to integrate with (same reasoning as Visitor Management, Download Center, and Ticketing: CSSP is likely the first real system for this at most target providers).

## 11. Core User Flow (new)

**Customer requests remote hands:** picks a site, task type, and asset/rack reference, describes the work, optionally requests a time window, submits — status shows "Submitted." **Provider accepts and assigns:** an ops/NOC staffer sees it in the Remote Hands queue, accepts it, and assigns a technician (possibly themselves) — status moves to "Accepted," visible to the customer with the technician's name. **Technician executes:** taps Start Task on-site (status → "In Progress," timer starts), does the work, taps Complete Task (timer stops, billable minutes computed), adds completion notes and a photo. **Customer sees proof:** status shows "Completed" with the technician's notes and photo, and can optionally rate it — the same loop as a resolved ticket, but with physical proof of work attached.

## 12. Open Questions (extends v3 Section 11)

Two new questions join the list: whether "requested time window" needs real scheduling/calendar conflict-checking for the MVP or whether a simple requested-window field the provider manually honors is enough to prove the concept (leaning toward the latter, consistent with the same "simplest version first" instinct applied to Team Performance in v3); and whether completion-photo upload needs to support multiple photos per task or one is enough for the MVP (leaning toward one, revisit once a design partner's actual remote-hands volume and task complexity is known).

## 13. Honest Flag on Scope (updated from v3 Section 12)

This is now the **fourth** round of scope changes to what started as a single-flow MVP (v1: service requests only) — v2 added four more modules and the integration-layer positioning, v3 added multi-tenancy/enterprise accounts/CS performance, and this version adds Remote Hands as its own module rather than a ticket subtype. Each addition has been a legitimate, directly-confirmed correction from real domain knowledge, not scope creep for its own sake — but the pattern itself is now worth naming plainly rather than re-flagging identically each time: "MVP" has grown from one flow to six customer-facing modules plus an enterprise account hierarchy and an internal team-performance system, and the build-sequencing question raised in v3 Section 12 (what ships to the very first design-partner pilot vs. what ships to the second) has gotten more pressing, not less, with each round. This document is not recommending a cut — the author knows this domain better than any outside advisor would, and each addition has been correct — but before this goes to a contract developer for a quote or a timeline commitment, it's worth deliberately deciding a v1-pilot subset (a reasonable candidate: Visitors + Tickets + Incidents + Documents, the four modules that test the core "replace email/phone with a portal" hypothesis with the least build effort) versus what's held for a fast-follow once that hypothesis is validated with a real pilot's feedback — rather than let a fifth round of confirmed-correct scope arrive before that sequencing conversation happens.
