/**
 * Proves the thing docs/prd-v3.md Section 3 calls the one architectural
 * decision that can't be retrofitted: Postgres row-level security (see
 * prisma/rls.sql), not application code, is what actually stops one tenant
 * from seeing another's data. Every assertion here runs through the real
 * `cssp_app` role (lib/db.ts) and the real `withTenant` helper (lib/tenant.ts)
 * — the same code path the app uses — not a mock.
 *
 * Requires the dev database seeded via `npm run db:seed` (prisma/seed.ts),
 * which creates exactly the two tenants this file assumes: "Meridian Data
 * Centers" and "Apex Colocation".
 */
import { describe, it, expect, beforeAll } from "vitest";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/lib/generated/prisma/client";
import { prisma as appPrisma } from "@/lib/db";
import { withTenant } from "@/lib/tenant";

// Owner-role connection used ONLY to look up known seed IDs by name — this is
// test infrastructure, not the thing under test. The actual assertions below
// all go through `appPrisma`/`withTenant`, i.e. the `cssp_app` role.
const ownerPrisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

let meridianOrgId: string;
let apexOrgId: string;
let apexTicketId: string;

beforeAll(async () => {
  const meridian = await ownerPrisma.organization.findFirstOrThrow({ where: { name: "Meridian Data Centers" } });
  const apex = await ownerPrisma.organization.findFirstOrThrow({ where: { name: "Apex Colocation" } });
  meridianOrgId = meridian.id;
  apexOrgId = apex.id;

  const apexTicket = await ownerPrisma.ticket.findFirstOrThrow({ where: { organizationId: apexOrgId } });
  apexTicketId = apexTicket.id;
});

describe("tenant isolation (Postgres RLS via cssp_app)", () => {
  it("scopes reads to the tenant set by withTenant", async () => {
    const meridianTickets = await withTenant(meridianOrgId, (tx) => tx.ticket.findMany());
    expect(meridianTickets.length).toBeGreaterThan(0);
    expect(meridianTickets.every((t) => t.organizationId === meridianOrgId)).toBe(true);

    const apexTickets = await withTenant(apexOrgId, (tx) => tx.ticket.findMany());
    expect(apexTickets.length).toBeGreaterThan(0);
    expect(apexTickets.every((t) => t.organizationId === apexOrgId)).toBe(true);
  });

  it("hides another tenant's row even if the app code forgets a WHERE clause", async () => {
    // This is the scenario RLS exists for: a query that, by itself, contains
    // no organization filter at all. If a developer ever ships this bug, RLS
    // is the backstop — the row still shouldn't come back for the wrong tenant.
    const found = await withTenant(meridianOrgId, (tx) => tx.ticket.findUnique({ where: { id: apexTicketId } }));
    expect(found).toBeNull();
  });

  it("fails closed when no tenant context is set at all", async () => {
    // Calling the app-role client directly (no withTenant) mirrors what
    // happens if a future code path forgets to scope — current_setting(...)
    // returns NULL, and every policy in prisma/rls.sql denies all rows.
    const orgs = await appPrisma.organization.findMany();
    const tickets = await appPrisma.ticket.findMany();
    const users = await appPrisma.user.findMany();
    expect(orgs).toHaveLength(0);
    expect(tickets).toHaveLength(0);
    expect(users).toHaveLength(0);
  });

  it("rejects inserting a row stamped with a different tenant's organizationId", async () => {
    await expect(
      withTenant(meridianOrgId, (tx) =>
        tx.region.create({ data: { organizationId: apexOrgId, name: "Sneaky Region" } }),
      ),
    ).rejects.toThrow();
  });

  it("the auth lookup function returns a row without tenant context (by design) but a direct SELECT still does not", async () => {
    const rows = await appPrisma.$queryRaw<{ id: string }[]>`SELECT id FROM auth_lookup_user('admin@meridian-dc.example.com')`;
    expect(rows.length).toBe(1);

    const direct = await appPrisma.user.findMany({ where: { email: "admin@meridian-dc.example.com" } });
    expect(direct).toHaveLength(0);
  });
});
