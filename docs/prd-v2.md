> **Superseded by `claude/prd-v3.md`.** v3 adds an explicit multi-tenancy architecture, enterprise accounts enrolled across multiple sites of the same provider, and a new CS Engagement & Performance (KPI tracking) module now in MVP scope. Kept here for history only.

# CSSP — Product Requirements Document (v2)
## Consolidated Customer Interface over DCIM / CMMS / BMS — MVP

**What changed from v1:** the MVP scope below replaces v1's service-request-only scope with the five modules confirmed directly from the author's own colocation CS experience: Visitor Management, Incident Management, Download Center, Request Ticketing, and (optional/stretch) BMS Telemetry. This version also corrects the product's positioning: CSSP is **not** a replacement for the provider's DCIM (asset/capacity management) or CMMS (maintenance/work-order management) systems. It is the consolidated, customer-facing interface **on top of** those internal systems — the front end most colocation providers don't have, not a competitor to the back-end systems they already run. Where v1 is silent or contradicts this, this version supersedes it.

## 1. Goal

Give a colocation provider's enterprise customers one consolidated place to do the things they currently chase by email or phone across several disconnected internal systems: register a visitor, see incident/maintenance status, download a report, and raise a ticket. Give the provider's CS/NOC/security teams a single interface to publish that information out, instead of each team fielding one-off requests through whatever channel a customer happens to use. Success for the MVP is behavioral: pilot customers actually using the portal for these four things instead of their current channels (email, phone, WhatsApp, walk-up).

## 2. Positioning: Integration Layer, Not a System of Record

This is the load-bearing correction from v1. CSSP does not do internal capacity planning, internal asset/rack inventory, or internal maintenance dispatch — that is what the provider's existing DCIM and CMMS already do, and CSSP has no ambition to replace them. For each module, the honest question is "where does this data actually live today," and the answer decides the architecture:

- **Incident Management** and **BMS Telemetry** are naturally *read-through*: the source of truth is the provider's DCIM/CMMS (incidents, maintenance tickets, asset status) and BMS (environmental/power telemetry). CSSP's job is to consolidate and re-present that data to the right customer, not to own it.
- **Visitor Management**, **Download Center**, and **Ticketing** are more likely *net-new* capabilities for most mid-market providers — in this plan's experience, most providers don't have a proper digital system for any of these today (visitor logs are often a paper book or a spreadsheet; reports get emailed one-off; complaints/RFIs go through whoever picks up the phone). For these, CSSP is likely the first real system of record, not an integration — worth confirming per-provider during design-partner conversations rather than assuming, since a provider that already runs a badge/access-control system or a document portal would need CSSP to integrate with that instead of duplicating it.

This distinction matters for sequencing: read-through modules depend on the provider having something to connect to (which may not exist or may not have an API), while net-new modules can ship regardless of what the provider already has. See Section 8.

## 3. Users & Personas

On the customer side, the primary user is still an **IT/Infrastructure Manager**, now joined by two more: a **Front-desk/Admin contact** who schedules visitors and doesn't otherwise touch the portal, and a **Compliance/Facilities contact** who downloads reports for audits. On the provider side: **CS/Account Managers** (ticket triage, document publishing), **Security/Front-desk staff** (visitor approval and check-in), and **NOC/Ops staff** (incident and maintenance entries, and BMS integration once it exists).

## 4. MVP Scope

| Module | Customer side | Provider side | Data source (Section 2) |
|---|---|---|---|
| Visitor Management | Register an upcoming visitor (name, company, purpose, host, facility, date/time); see visit history and status | See/approve upcoming visitors per facility; check in/out; deny with reason | Net-new (or integrates with an existing access-control system, if one exists) |
| Incident Management | See active/past incidents and scheduled maintenance per facility, in plain language | Publish an incident or maintenance window once; visible to every affected customer | Read-through from DCIM/CMMS (manual entry as the MVP fallback — see Section 8) |
| Download Center | Browse and download documents scoped to their account/facility (SLA reports, compliance certificates, invoices) | Upload/publish a document to one account or all accounts at a facility | Net-new (CSSP is the customer-facing document library) |
| Request Ticketing | Raise a ticket — Complaint, RFI, or Service Request (remote hands/cross-connect/capacity change) — and track status | Triage queue across all accounts and ticket types; assign, update status, resolve | Net-new (CSSP is the system of record for the customer-facing conversation, even where the underlying work gets dispatched into CMMS) |
| BMS Telemetry (optional/stretch) | View near-real-time environmental/power readings for their rack or facility (temperature, humidity, power draw) | — | Read-through from BMS (see Section 8 — this is the module most likely to slip if the integration proves hard) |

Explicitly **out of scope for the MVP**: CRM/contract/renewal management (still deferred per the business plan), SLA/uptime reporting *generation* (Download Center distributes reports; it doesn't calculate them), a native mobile app (responsive web is enough), and multi-language support. BMS Telemetry is marked optional deliberately — see Section 8 for why it's the module most likely to be cut from the first release without changing the pilot's value proposition.

## 5. Core User Flows

**Customer registers a visitor:** picks a facility, enters visitor details and a visit window, submits — request appears as "Pending" until security/front-desk approves; on the visit date, front-desk checks the visitor in/out from the same record, and the customer can see visit history without calling ahead each time.

**Provider publishes an incident or maintenance window:** ops staff create one entry (manually in the MVP, or pulled from DCIM/CMMS once integrated), tag the affected facility, and every customer at that facility sees it immediately in plain language instead of a mass email.

**Customer downloads a report:** opens Download Center, sees only documents published to their account, downloads an SLA report or compliance certificate without emailing their account manager to ask for it (or re-ask, because the last email got lost).

**Customer raises a ticket:** picks a category (Complaint / RFI / Service Request), fills a short form, submits — tracks status in one place regardless of which internal team ends up handling it; provider triages every category from one shared queue rather than three different inboxes.

**Customer checks BMS telemetry (if built):** views a simple chart of temperature/humidity/power draw for their rack or facility, sourced live from the provider's BMS — this is read-only, no customer action, and depends entirely on the provider's BMS actually being reachable (Section 8).

## 6. Data Model (MVP)

| Entity | Key fields | Notes |
|---|---|---|
| Organization | name, tier | The colocation provider — the paying customer of CSSP |
| Account | name, organization_id | A customer of the provider |
| Facility | name, address, organization_id | A data center site |
| User | name, email, role (customer / provider-cs / provider-ops / provider-security), account_id | Role drives visibility — RBAC starts here |
| Visitor | account_id, facility_id, visitor_name, visitor_company, host_user_id, visit_start, visit_end, status (Pending/Approved/Denied/CheckedIn/CheckedOut) | See Section 9 on ID-document handling |
| IncidentOrMaintenance | facility_id, type, status, start/end time, description, source (manual \| dcim \| cmms) | `source` exists so a manual MVP entry and a future integrated one share one schema |
| Document | account_id (nullable = all accounts at facility), facility_id, title, category (SLA report/compliance/invoice/other), file_ref, published_by, published_at | The Download Center's system of record |
| Ticket | account_id, facility_id, category (Complaint/RFI/ServiceRequest), subtype, status, created_by, assigned_to, created_at, resolved_at | Generalizes v1's `ServiceRequest` to cover all three ticket categories |
| BMSReading (optional) | facility_id, rack_id (nullable), metric_type (temp/humidity/power), value, unit, timestamp, source_system | Only needed if BMS Telemetry ships in v1 |

## 7. Non-Functional Requirements

Multi-tenant data isolation remains the one requirement that can't be retrofitted later, and it now matters even more with Documents and Visitor records in scope — a customer seeing another customer's compliance certificate or visitor list is a worse failure than a mixed-up ticket. Role-based access needs a fourth role (provider-security) alongside customer/provider-cs/provider-ops. Because Visitor Management touches personal data (visitor names, ID references) and the provider operates in Indonesia, data handling should be checked against Indonesia's Personal Data Protection Law (UU PDP) before launch — at minimum, avoid storing full government ID numbers if a reference/verification-only approach will do (see Section 9). An audit log (who approved a visitor, who published a document, who changed a ticket's status) is worth building from day one for the same compliance-minded-customer reason as v1.

## 8. Integration Approach — the central architectural question

This is the part v1 got wrong by deferring it to "Phase 3." Because CSSP's whole value proposition is consolidating data that already lives in DCIM/CMMS/BMS, integration isn't a later add-on — it's the product, for two of the five modules. The practical approach for the MVP:

**Build an adapter pattern from day one**, even though the first adapter is a human. `IncidentOrMaintenance.source` and `BMSReading.source_system` exist in the data model specifically so a "Manual Adapter" (an ops staff member typing an entry into a form) and a future "DCIM Adapter" or "BMS Adapter" (pulling the same shape of data automatically from the provider's real systems) are interchangeable behind one customer-facing schema. This avoids the trap of building the MVP's data model around manual entry and having to redesign it later when a real integration arrives.

**BMS integration is genuinely harder than DCIM/CMMS integration**, which is the real reason it's marked optional rather than core. Most DCIM/CMMS platforms expose a REST API (that's the easy case). Most BMS systems speak building-automation protocols — BACnet or Modbus, sometimes SNMP — not REST, which typically means an on-premise gateway or middleware device at each facility to translate, plus per-vendor mapping work (the metrics and point-naming conventions differ by BMS vendor). This is a real, non-trivial integration project on its own, which is exactly why it should not gate the rest of the MVP: ship Visitor Management, Incident Management (manual-adapter), Download Center, and Ticketing first, and treat BMS Telemetry as a fast-follow once there's a specific pilot customer and BMS vendor to integrate against (rather than building a generic BMS connector speculatively).

**DCIM/CMMS integration for Incident Management** should be scoped per design partner rather than assumed: ask each pilot what system they actually run (Section 8 of the business plan already names the likely candidates — Device42, Sunbird, Nlyte for DCIM; the CMMS landscape is more fragmented) and what API or export it offers, before committing to build a specific connector. Until then, the Manual Adapter is not a placeholder to be embarrassed about — it's a legitimate MVP approach that many customers will find dramatically better than what they have today (a portal with manually-entered incidents beats no portal at all).

## 9. Open Questions to Resolve with Design Partners

A few decisions in this PRD are working assumptions, not settled answers, and should be checked against real pilot conversations rather than guessed further in a document: whether any target provider already runs a digital visitor/access-control system CSSP would need to integrate with instead of replacing; what, if anything, needs to be captured about a visitor's identity for security/compliance purposes versus what should deliberately be left out given Indonesia's data protection law; whether "Download Center" documents are provider-uploaded (the working assumption here) or need to be pulled from an existing document management system; and which DCIM/CMMS/BMS systems the actual first pilots run, which determines whether Section 8's adapters are worth building in Phase 1 or should wait for Phase 3 as v1 assumed.

## 10. MVP Success Metrics

Adoption per module, not a single blended number: percentage of visitors registered through the portal vs. called/emailed in; percentage of documents downloaded vs. requested by email; percentage of tickets (across all three categories) raised through the portal vs. other channels; and, qualitatively, whether CS/security/ops staff report less manual status-chasing. If BMS Telemetry ships, its metric is simply whether customers look at it at all — a feature no one checks isn't worth its integration cost.

## 11. Roadmap Linkage

This PRD still covers Business Plan Phase 1, but the MVP is now four core modules plus one optional one rather than v1's single service-request flow — worth flagging back to the business plan's Month 3–6 milestone ("build MVP"), since this is a larger build than v1 assumed and may need more runway than originally planned. Phase 2/3 (CRM, DCIM/BMS integrations beyond the first pilot's system, geographic expansion) are unchanged in shape, just later in sequence for the integration pieces that used to be "Phase 3 only" and are now partially pulled into Phase 1 for Incident Management specifically.
