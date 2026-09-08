# Onboarding & Offboarding Guide — Enrolling and Removing a Site, Tenant & Team

This walks a **Global Sys Admin** through the full lifecycle of a customer
relationship in CSSP: standing up a brand-new site and a brand-new tenant
company from an empty system, enrolling that tenant's team, and — the
mirror image — cleanly winding one down when the contract ends.

It assumes the app is already installed and running (see
[`installation-guide-ubuntu.md`](installation-guide-ubuntu.md)) and that
you're signed in as a **Global Sys Admin** — the only role with access to
**Admin Settings** in the left nav. Every step below names the exact screen
and fields; nothing here requires touching the database directly.

## The four things you're wiring together

| Concept | What it is | Where it lives |
|---|---|---|
| **Region → Facility → Building** | Your own infrastructure: a geography, a physical data center, and (optionally) a building within it. | `Admin Settings → Regions` / `Facilities` |
| **Tenant (`EnterpriseAccount`)** | A customer company — Meridian Logistics, Nusantara Cloud, etc. Exists independently of any site. | `Admin Settings → Accounts` |
| **Site enrollment** | The link between one tenant and one facility (their cage/rack, "Suite 2", etc). A tenant can be enrolled at several facilities; a facility can host several tenants. | Inside a tenant account's detail page |
| **Team (users)** | The people who log in — either the tenant's own staff (Global Admin, Site Lead, Billing, Tech User) or your internal staff. | `Admin Settings → Users` |

A new customer touches all four, in that order. Removing one touches them
in reverse.

---

## Part 1 — Enrolling a new site, tenant and team from scratch

### Step 1: Create the region (skip if it already exists)

Go to **Admin Settings → Regions**. If the geography your new facility sits
in isn't listed yet, add it: a display **Name** (e.g. "Southeast Asia") and
a short unique **Code** (e.g. `APAC`). This is just a grouping — it doesn't
need updating again once it exists.

### Step 2: Create the facility (the physical site)

Go to **Admin Settings → Facilities → Add facility**. Fill in:

- **Name** and **Code** (the code must be globally unique — it shows up in
  reports and is used to key the seeded demo data too, e.g. `JKT-01`).
- **Region** — the one from Step 1.
- **Address** and **Timezone** — used on customer-facing documents and to
  localize incident/maintenance timestamps.
- **ACS endpoint** (optional) — leave blank for now; the platform falls
  back to a built-in mock access-control adapter. Only fill this in once
  you have a real campus badge-system webhook to point at.

Saving takes you to the facility's detail page.

### Step 3: Add building(s) (optional, but recommended for multi-building sites)

Still on the facility detail page, use the **Buildings** card to add one or
more buildings (**Name** + short **Code**, e.g. "Building B" / `B`).
Incidents, maintenance windows and telemetry can all be scoped to a
specific building later — worth doing now if the site has more than one.

### Step 4: Create the tenant account

Go to **Admin Settings → Accounts → Add tenant account**. Fill in:

- **Display name** (what shows everywhere in the UI) and, optionally,
  **Legal name** (for contracts/invoices).
- **Tier** — Standard / Premium / Enterprise.
- **Billing email** (optional) — where invoice notifications go.

This creates the account with **Status: Active** and no sites yet — a
tenant can exist before it's enrolled anywhere.

### Step 5: Enroll the tenant at the facility

You land on the new account's detail page after Step 4 (or navigate back
to it from the Accounts list). In the **Site enrollments** card, pick the
**Facility** from Step 2 and, optionally, a **Space reference** (e.g.
"Cage 7, Rack C14–18") — then **Enroll site**. Repeat for additional
facilities if this tenant occupies more than one site.

### Step 6: Build the tenant's team

Go to **Admin Settings → Users → Add user**, once per person, and pick a
**role**:

- **Global Admin** (`TENANT_GLOBAL_ADMIN`) — create this one first. Full
  control of the account across every enrolled site: users, AAL, reports,
  billing, branding.
- **Site Lead** (`TENANT_SITE_LEAD`) — operational lead for one enrolled
  site; set **Restrict to facility** to the site from Step 2 if this
  person shouldn't see the tenant's other sites.
- **Billing** (`TENANT_BILLING`) — invoices/contracts only.
- **Tech User** (`TENANT_TECH_USER`) — day-to-day requester (visitors,
  service requests, deliveries), optionally facility-restricted the same
  way.

Every new user must be tied to the **Enterprise account** from Step 4 and
given a temporary password (share it out of band — there's no self-signup
flow yet).

### Step 7: Optional but recommended finishing touches

- **Publish onboarding documents** — `Documents → Publish` (from the ops
  console), category **Site Introduction**, **Terms & Conditions**, or
  **Contract**, scoped to the new account and/or facility so it shows up
  in their Download Center immediately.
- **Seed Authorized Access List entries** for any long-term contractor or
  staff who need standing (undated) site access, from **Ops → Authorized
  Access List**.
- **Configure a telemetry source** for the facility, if it has a BMS
  integration to mirror — `Ops → Telemetry`.
- **Tenant branding** — an optional accent color/logo for their portal,
  settable from the account record.

### Step 8: Verify

Log out and sign in as the Global Admin user you created in Step 6. Confirm
they land on `/portal`, see the enrolled site, and can submit a test
visitor request or service request. Then check **Admin Settings → System
Logs** as the Sys Admin — you should see `region.create` (if applicable),
`facility.create`, `tenant.create`, and `user.create` entries recording
every step above.

---

## Part 2 — Removing a tenant, site enrollment and team (offboarding)

Do this in the order below — it's the reverse of onboarding, and each step
exists specifically so nothing is deleted out from under still-open work or
historical records.

**Guiding principle:** nothing in this flow ever hard-deletes a tenant,
site enrollment, facility, or user. Everything is a **status change**
(`Active → Suspended/Terminated`, or a user's Active/Disabled toggle).
Incidents, invoices, documents and the audit trail all stay intact for
compliance and dispute resolution — only the ability to log in or create
*new* activity is cut off.

### Step 1: Close out open operational work first

Before touching any status flag, clear anything still in flight for this
tenant at this site:

- **Service Requests / Remote Hands** (`Ops → Service Requests`) — resolve
  or cancel anything still `Submitted`/`Accepted`/`InProgress`.
- **Visitor requests** (`Ops → Visitor Approvals`) — nothing to do for past
  visits; deny/cancel any still-pending future ones.
- **Authorized Access List** (`Ops → Authorized Access List`) — **Revoke**
  each `Active` entry for this account at this facility; standing access
  should not survive the relationship ending.
- **Final invoice** (`Ops → Billing → New invoice`) — issue any
  outstanding invoice now, while the account is still `Active` and can
  still be billed against normally.

### Step 2: Terminate the site enrollment

Go to the tenant's account page (**Admin Settings → Accounts → [tenant]**).
In the **Site enrollments** table, use the **Change status** dropdown on
the row for the site being vacated and set it to **Terminated** (or
**Suspended** for a temporary hold, e.g. a payment dispute you expect to
resolve), then **Update**.

This is scoped to *that one facility* — if the tenant keeps other sites,
their access there is untouched.

### Step 3: Disable the team members

Still don't need to delete anyone. Go to **Admin Settings → Users**, find
each of this tenant's people, and click **Disable** next to their row (or
open their record if you also need to reassign them to a *different*
tenant instead of removing them entirely — edit their account and role
rather than disabling). A disabled user can no longer sign in, but their
name still shows correctly on historical incidents, service requests, and
audit log entries.

### Step 4: If this was their only (or last remaining) site — suspend the account

Once every site enrollment for this tenant is `Terminated`, go to the
account detail page's **Account status** card and set the account itself
to **Suspended** (recoverable) or **Terminated** (final). This is a
belt-and-suspenders control: it blocks login for *every* user on the
account, at login time, even if one was missed in Step 3.

If the tenant is only leaving one of several sites, skip this step — leave
the account `Active` so their still-enrolled sites keep working normally.

### Step 5: What you're deliberately **not** doing

- **Don't delete the Facility or Building.** They're your infrastructure,
  not the tenant's — decommissioning a physical site is a separate,
  much rarer operational decision (and isn't exposed as a one-click action
  in the console on purpose, since it would orphan every historical
  incident/invoice/document tied to it). If a site is truly being closed,
  handle that as a deliberate data-retention/export decision, not part of
  a routine offboarding.
- **Don't delete the tenant's Documents, Invoices, or Engagement Logs.**
  They remain visible in **Admin Settings** for as long as you need them
  for audit or legal purposes; the tenant simply can no longer reach them
  once logged out.

### Step 6: Verify

Try signing in as one of the disabled users — it should silently fail and
stay on the login screen (whether blocked by their own account being
disabled, or by the tenant account being suspended/terminated). Then check
**Admin Settings → System Logs**, filtered to `tenant` or `site_enrollment`,
to confirm the status changes were recorded with your name as the actor.

---

## Quick reference: reversing either process

Both status changes are two-way. To reinstate a tenant (a lapsed contract
renewed, a suspension resolved):

1. Set the **Account status** back to `Active`.
2. Set the relevant **Site enrollment(s)** back to `Active`.
3. Re-**Enable** the specific users who should regain access (not
   necessarily everyone — some may have genuinely left).

No data was lost in between, so the tenant picks back up with their full
history intact.
