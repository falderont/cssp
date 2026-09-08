# Onboarding & Offboarding Guide — Enrolling and Removing a Site, Tenant & Team

This walks through the full lifecycle of a customer relationship in CSSP:
standing up a brand-new site from an empty system, creating a brand-new
tenant company, enrolling that tenant's team — and, the mirror image,
cleanly winding one down when a contract ends or a site closes.

It assumes the app is already installed and running (see
[`installation-guide-ubuntu.md`](installation-guide-ubuntu.md)). Every step
below names the exact screen, and who's allowed to use it: most of this is
**Global Sys Admin** territory, but a fair amount is deliberately delegable
to **Service Desk** — see the role notes on each step.

## The five things you're wiring together

| Concept | What it is | Where it lives | Who can manage it |
|---|---|---|---|
| **Region → Country → City → Site → Building → Room** | Your own infrastructure, six levels deep. "Site" is modeled as `Facility` in the schema for historical reasons. | One consolidated tree screen: `Site Management` (`/ops/admin/facilities`) | Global Sys Admin or Service Desk |
| **Tenant (`EnterpriseAccount`)** | A customer company — Meridian Logistics, Nusantara Cloud, etc. Exists independently of any site. | `Tenant Accounts` (`/ops/admin/accounts`) | Global Sys Admin or Service Desk |
| **Site enrollment + controlled area** | The link between one tenant and one site, plus (optionally) a structured building/room footprint within it. | Inside a tenant account's own detail page | Global Sys Admin or Service Desk |
| **Team** | An internal staff roster (Ops/NOC/Security/CustomerSuccess/ServiceDesk/Facilities/Executive), scoped to a region, country, site, or the whole company. Distinct from a tenant's own users. | `Teams` (`/ops/admin/teams`) | Global Sys Admin only |
| **Users** | The people who log in — a tenant's own staff (added right from their account page) or your internal staff (`/ops/admin/users`). | Both | Global Sys Admin (all); Service Desk (tenant users only) |

A new customer touches the first three, in that order, plus internal Users
and (if this site needs its own coverage roster) a Team. Removing one
touches them in reverse.

---

## Part 1 — Enrolling a new site, tenant and team from scratch

### Step 1: Stand up the site on the hierarchy tree

Go to **Site Management** (`/ops/admin/facilities`) — a Global Sys Admin or
delegated Service Desk agent's screen. It's one expandable tree, Region →
Country → City → Site, with an inline **"+ Add …"** control at every level
you drill into:

1. Expand or **Add region** if the geography isn't there yet (e.g. "APAC").
2. Inside it, **Add country** if needed (ISO 3166-1 alpha-2 code, e.g. `ID`
   for Indonesia).
3. Inside that, **Add city** if needed (e.g. "Batam").
4. Inside that city, **Add site** — fill in **Name**, **Code** (must be
   unique across the whole platform), **Address**, **Timezone**, and
   optionally an **ACS endpoint** (leave blank to use the built-in mock
   access-control adapter until you have a real campus badge-system
   webhook to point at).

Everything is added inline, without leaving the tree — a contract for a
site in a country/city the platform has never seen is just three "+ Add"
clicks in a row, not a detour through separate Regions/Countries/Cities
pages.

### Step 2: Open the site's own page and build out Buildings/Rooms

Click the new site's row to land on its dedicated admin page
(`/ops/admin/facilities/[id]`). From the **Overview** tab:

- Add one or more **Buildings** (Name + Code).
- Inside a building, add **Rooms** (Name, Code, and a **Room type** — data
  hall, mechanical room, meeting room, etc.).
- If this site leases numbered colo racks rather than whole rooms, toggle
  **"Offers colo racks"** in the site's space-model setting, then add
  **Racks** under the relevant Data Hall room.

Renaming the site itself (name/code/timezone/address) is Global Sys
Admin-only, even though the rest of this page is delegable — it's
referenced across tenant branding, invoices and reports, so changing it is
kept to the one role with full platform control.

### Step 3: Configure the site's day-to-day tabs (as needed)

The same per-site page has tabs for everything else that's scoped to this
one location — visible only to the roles that use them day to day:

- **Front Line** (Visitor Approvals, Front Desk, Deliveries)
- **Service Delivery** (Incidents, Maintenance, Service Requests)
- **Authorized Access List**
- **Loading Docks** — an Ops Building Manager defines dock locations here
  before tenants can book deliveries against them.
- **Integrations** — this site's ACS/telemetry hookups.
- **Documents**

None of these need touching before a tenant enrolls — they're where
day-to-day operations happen once the site is live.

### Step 4: Create the tenant account

Go to **Tenant Accounts → Add tenant account** (`/ops/admin/accounts/new`).
Fill in:

- **Display name** and, optionally, **Legal name** (for contracts/invoices).
- **Tier** — Standard / Premium / Enterprise.
- **Billing email** — where invoice notifications go.

This creates the account with **Status: Active** and no sites yet — a
tenant can exist before it's enrolled anywhere.

### Step 5: Enroll the tenant at the site

On the new account's own detail page, the **Site enrollments** card lets
you pick the **Facility** from Step 1 and, optionally, a free-text **Space
reference** (e.g. "Cage 7, Rack C14–18") — then **Enroll site**. Repeat for
additional sites if this tenant occupies more than one.

### Step 6: Define controlled areas (optional, for precision)

If the contract needs more structure than a free-text space reference, use
the **Controlled areas** card on the same page: give it a **Label** (e.g.
"Suite 4B") and pick a **Building** or a specific **Room** within one of the
tenant's enrolled sites. A single site enrollment can have zero, one, or
several controlled areas.

### Step 7: Build the tenant's team

Still on the account's detail page, the **Users** card's **Add user** form
creates the tenant's own people — no separate screen needed:

- **Full name**, **Work email**, a **Temporary password** (share it out of
  band — there's no self-signup flow), and a **Role**:
  - **Global Admin** (`TENANT_GLOBAL_ADMIN`) — create this one first. Full
    control of the account across every enrolled site.
  - **Site Lead** (`TENANT_SITE_LEAD`) — operational lead for one site;
    use **Restrict to one site** if they shouldn't see the tenant's other
    locations.
  - **Billing** (`TENANT_BILLING`) — invoices/contracts only.
  - **Tech User** (`TENANT_TECH_USER`) — day-to-day requester (visitors,
    service requests, deliveries), optionally site-restricted the same way.

Each user can be edited, password-reset, or disabled inline from the same
table later.

### Step 8: Stand up an internal Team for the site, if it needs its own roster

Separately (this is your own staffing, not the tenant's), go to **Teams**
(`/ops/admin/teams` — Global Sys Admin only) and add a named roster scoped
to this site, its country, its region, or left global — pick a **Function**
(Ops, NOC, Security, Customer Success, Service Desk, Facilities,
Executive) and add members. This is separate from an individual user's own
facility/region restriction: a Team is the reporting/coverage unit you
define up front, not an ad hoc grouping.

### Step 9: Optional but recommended finishing touches

- **Publish onboarding documents** — from a site's **Documents** tab or the
  ops Documents screen, category **Site Introduction**, **Terms &
  Conditions**, or **Contract**, scoped to the new account and/or site so
  it shows up in their Download Center immediately.
- **Seed Authorized Access List entries** for any long-term contractor or
  staff who need standing (undated) site access.
- **Configure a telemetry source**, from the site's **Integrations** tab,
  if it has a BMS to mirror.
- **Tenant branding** — an optional accent color/logo for their portal.

### Step 10: Verify

Log out and sign in as the Global Admin user from Step 7. Confirm they land
on `/portal`, see the enrolled site, and can submit a test visitor request
or service request. Then check **System Logs** as the Sys Admin — you
should see `facility.create` (and `region.create`/`country.create`/
`city.create` if applicable), `tenant.create`, and `user.create` entries
recording every step above.

---

## Part 2 — Removing a tenant, a site enrollment, or a whole site

**Guiding principle:** nothing in this flow casually deletes history.
Ending a tenant relationship is a **status change** (a site enrollment or
the whole account flips to `Suspended`); deleting *infrastructure* (a
Region/Country/City/Site/Building/Room) is a real delete, but it's
**guarded** — the platform refuses it outright, and tells you exactly what's
still attached, if any dependent records exist. You can't delete your way
into an inconsistent audit trail by accident.

### A. Offboarding a tenant (they're leaving one site, or leaving entirely)

Do this in order — it's the reverse of Part 1, and each step exists
specifically so nothing is deleted out from under still-open work.

**1. Close out open operational work first.** Before touching any status
flag, clear anything still in flight for this tenant at this site: resolve
or cancel open **Service Requests**, deny/cancel any still-pending future
**visitor requests**, **Revoke** each `Active` **Authorized Access List**
entry for this account at this site, and issue any outstanding **invoice**
now, while the account is still `Active` and can still be billed against
normally.

**2. End the specific site enrollment.** On the tenant's account page, the
**Site enrollments** table has a **Change status** control per row — set it
to `Suspended` for the site being vacated. This is scoped to *that one
facility*; if the tenant keeps other sites, they're untouched. The
enrollment record itself is never deleted — historical visitor/service
request/billing records stay attached to it.

**3. Disable the affected team members**, or reassign them. In the same
account page's **Users** table, click **Disable** for anyone who's leaving
(or edit their record to move them to a *different* tenant account instead,
if that's what's actually happening). A disabled user can no longer sign
in, but their name still shows correctly on historical incidents, service
requests, and audit log entries.

**4. If this was their only (or last remaining) site, suspend the whole
account.** In the account's **Account details** card, set **Status** to
`Suspended`. This blocks login for **every** user on the account, at every
site, the moment they try — even if one was missed in Step 3 (login is
gated on the account's status, not just each user's own active flag). If
the tenant is only leaving one of several sites, skip this — leave the
account `Active` so their remaining enrollments keep working normally.

**5. Know what's deliberately not touched.** Documents, Invoices, and
Engagement Logs for this tenant stay visible in Admin for as long as you
need them for audit or legal purposes — the tenant simply can't reach them
once logged out.

**6. Verify.** Try signing in as one of the disabled users, or as any user
of a now-suspended account — it should fail silently and stay on the login
screen. Then check **System Logs**, filtered to `tenant` or
`site_enrollment`, to confirm the status changes were recorded with your
name as the actor.

**To reinstate:** flip the account status back to `Active`, flip the
relevant site enrollment(s) back to `Active`, and re-enable the specific
users who should regain access. No data was lost, so the tenant picks back
up with their full history intact.

### B. Decommissioning infrastructure (a Region/Country/City/Site/Building/Room)

This is a different, much rarer decision — you're removing your own
infrastructure, not just ending a customer relationship. Every level from
Country down to Room has a **Delete** action on its own row in **Site
Management**, protected by a dependents check: it counts everything still
attached and refuses with a plain-language error (*"Can't delete this
site — it still has related records. Remove those first."*) naming what's
in the way, rather than silently cascading. For a Site, that check alone
covers buildings, tenant enrollments, incidents, maintenance events,
telemetry integrations/readings, documents, deliveries, loading docks,
restricted users, AAL entries, and teams scoped to it — delete/reassign
each of those first, working bottom-up (Rooms → Buildings, then the Site
itself, then City/Country if they're now empty and truly unwanted).

**In practice, this means a site that has ever hosted a tenant can't be
deleted at all** — the historical `SiteEnrollment` row is permanent (see
Part A: it's suspended, never deleted), so it will always block a site
delete. That's intentional: decommissioning a site with real history is a
deliberate data-retention/export decision, not a routine offboarding step,
and the platform won't let you do it by accident. Regions don't delete at
all — they're near-static reference data, so instead a Region has a single
**Active/Inactive** toggle; an inactive region stays visible with its
existing countries/cities/sites but should no longer be offered when
picking a region for new coverage assignments going forward.

### C. If you're not a Master Data Admin

Only **Global Sys Admin** and **Service Desk** can directly edit or delete
Area master data. Every other internal role (Ops Site Manager, Ops Site
Lead, Front Office & Security, CS Team, an external Ops Vendor) raises an
**Area Change Request** instead: go to **Area Change Requests → New
request** (`/ops/admin/area-change-requests/new`), pick the **Level**
(Region/Country/City/Site/Building/Room), set **Action** to `Deactivate`,
describe **Context** (where in the hierarchy) and **Notes** (why), and
submit. It lands in the Sys Admin/Service Desk triage queue
(`Submitted → InReview → Approved/Rejected`); once approved, an admin still
performs the actual change through the screens in this guide and marks the
ticket `Applied`. This is the same "raise a ticket" pattern this project
already uses for Service Requests, applied to the one category of change
that shouldn't be self-service for most roles — getting a site's
Region/Country/City wrong corrupts every report and delegated-scope filter
built on top of it.

### D. Removing a Team

A **Team** (the internal roster from Part 1, Step 8) is deleted from
**Teams** — Global Sys Admin only, and also guarded: it refuses if the team
still has members, so clear or reassign its roster first.
