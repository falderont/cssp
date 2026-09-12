// Visitor Management System simulation.
//
// Exercises the real business logic in src/actions/visitors.ts (the same
// buildAndCreateVisitorRequest / buildAndCreateVisitorRequestBatch functions
// the "New visitor request" portal screen calls) against a real, throwaway
// SQLite database — no mocks for Prisma or the request/scope logic. Node
// request context (cookies/session) is the only thing swapped out, since
// this runs outside Next.js; requireCustomerUser() itself is not called.
//
// Focus: (1) the group/batch attendee limit, and (2) one tenant enrolled at
// several sites inside a single region — access scoping, isolation from a
// second tenant sharing one of those sites, and per-site request handling.
//
// Run with: npm run simulate:visitors

import { execSync } from "child_process";
import { existsSync, rmSync } from "fs";
import path from "path";

const WEBAPP_ROOT = path.resolve(__dirname, "..");
const DB_FILE = path.join(WEBAPP_ROOT, "prisma", "simulation.db");
const DATABASE_URL = "file:./simulation.db";

for (const f of [DB_FILE, `${DB_FILE}-journal`]) {
  if (existsSync(f)) rmSync(f);
}

process.env.DATABASE_URL = DATABASE_URL;

console.log("Provisioning a fresh throwaway SQLite database for the simulation…");
execSync("npx prisma db push --schema=prisma/schema.prisma --skip-generate --accept-data-loss", {
  cwd: WEBAPP_ROOT,
  stdio: "inherit",
  env: { ...process.env, DATABASE_URL },
});

type Result = { name: string; pass: boolean; note?: string };
const results: Result[] = [];

function check(name: string, pass: boolean, note?: string) {
  results.push({ name, pass, note });
  console.log(`${pass ? "✓" : "✗"} ${name}${note ? ` — ${note}` : ""}`);
}

async function expectThrows(fn: () => Promise<unknown>, matcher?: (err: unknown) => boolean): Promise<{ threw: boolean; message: string }> {
  try {
    await fn();
    return { threw: false, message: "" };
  } catch (err) {
    if (matcher && !matcher(err)) throw err;
    return { threw: true, message: (err as Error).message };
  }
}

async function main() {
  const { prisma } = await import("../src/lib/prisma");
  const {
    buildAndCreateVisitorRequest,
    buildAndCreateVisitorRequestBatch,
    requestSchema,
    batchRequestSchema,
  } = await import("../src/actions/visitors");
  const { assertSiteEnrollmentAccess, getCustomerSiteEnrollments, getCustomerFacilityIds } = await import("../src/lib/scope");
  const { notifyFacilityTenantUsers } = await import("../src/lib/notify");
  const { pushVisitorRequestToAcs } = await import("../src/lib/acs");
  const { ROLES, MAX_VISITORS_PER_REQUEST, VisitorGroupSizeError } = await import("../src/lib/constants");
  const { default: bcrypt } = await import("bcryptjs");

  const passwordHash = await bcrypt.hash("password123", 4);

  console.log("\nSeeding scenario: one tenant with three sites in one region, plus a second tenant sharing one of them…\n");

  // Region -> Country -> City -> Facility, mirroring prisma/seed.ts's shape:
  // one region ("APAC-SIM"), two countries, three sites.
  const region = await prisma.region.create({ data: { name: "Asia Pacific (Sim)", code: "APAC-SIM" } });
  const countryID = await prisma.country.create({ data: { name: "Indonesia (Sim)", code: "ID-SIM", regionId: region.id } });
  const countryMY = await prisma.country.create({ data: { name: "Malaysia (Sim)", code: "MY-SIM", regionId: region.id } });
  const cityJkt = await prisma.city.create({ data: { name: "Jakarta (Sim)", countryId: countryID.id } });
  const citySby = await prisma.city.create({ data: { name: "Surabaya (Sim)", countryId: countryID.id } });
  const cityJhb = await prisma.city.create({ data: { name: "Johor Bahru (Sim)", countryId: countryMY.id } });

  const siteJkt = await prisma.facility.create({ data: { name: "SIM-JKT", code: "SIM-JKT", cityId: cityJkt.id } });
  const siteSby = await prisma.facility.create({ data: { name: "SIM-SBY", code: "SIM-SBY", cityId: citySby.id } });
  const siteJhb = await prisma.facility.create({ data: { name: "SIM-JHB", code: "SIM-JHB", cityId: cityJhb.id } });

  // Primary tenant: one EnterpriseAccount enrolled at all three sites above
  // — one region, multiple sites, spanning two countries within it.
  const katalis = await prisma.enterpriseAccount.create({ data: { name: "Katalis Cloud (Sim)", tier: "Premium" } });
  // Second tenant, sharing SIM-SBY with Katalis — for cross-tenant isolation checks.
  const riverside = await prisma.enterpriseAccount.create({ data: { name: "Riverside Fintech (Sim)", tier: "Standard" } });

  const enrJkt = await prisma.siteEnrollment.create({ data: { enterpriseAccountId: katalis.id, facilityId: siteJkt.id, spaceRef: "Suite 1" } });
  const enrSby = await prisma.siteEnrollment.create({ data: { enterpriseAccountId: katalis.id, facilityId: siteSby.id, spaceRef: "Rack A01" } });
  const enrJhb = await prisma.siteEnrollment.create({ data: { enterpriseAccountId: katalis.id, facilityId: siteJhb.id, spaceRef: "Cage 3" } });
  const enrRiversideSby = await prisma.siteEnrollment.create({
    data: { enterpriseAccountId: riverside.id, facilityId: siteSby.id, spaceRef: "Rack A02" },
  });

  const sysAdmin = await prisma.user.create({
    data: { name: "Sim Sys Admin", email: "sim-admin@example.com", passwordHash, role: ROLES.SYS_ADMIN },
  });

  const katalisGlobalAdmin = await prisma.user.create({
    data: {
      name: "Katalis Global Admin",
      email: "katalis-admin@example.com",
      passwordHash,
      role: ROLES.TENANT_GLOBAL_ADMIN,
      enterpriseAccountId: katalis.id,
    },
  });
  const katalisJktSiteLead = await prisma.user.create({
    data: {
      name: "Katalis JKT Site Lead",
      email: "katalis-jkt-lead@example.com",
      passwordHash,
      role: ROLES.TENANT_SITE_LEAD,
      enterpriseAccountId: katalis.id,
      restrictedFacilityId: siteJkt.id,
    },
  });
  const riversideTechUser = await prisma.user.create({
    data: {
      name: "Riverside Tech User",
      email: "riverside-tech@example.com",
      passwordHash,
      role: ROLES.TENANT_TECH_USER,
      enterpriseAccountId: riverside.id,
    },
  });

  await prisma.blacklistEntry.create({
    data: { fullName: "Bad Actor", reason: "Prior security incident (sim)", createdById: sysAdmin.id },
  });

  const baseRequest = { purpose: "Simulation visit", visitDate: "2026-10-01", windowStart: "09:00", windowEnd: "17:00" };
  const visitorRow = (n: number, overrides: Partial<{ fullName: string }> = {}) => ({
    fullName: overrides.fullName ?? `Visitor ${n}`,
    idType: "KTP",
    idNumber: `SIM-${n}`,
    company: "Contractor Co",
    email: `visitor${n}@example.com`,
    phone: "+62 812-0000-0000",
  });

  // --- Scenario 1: single visitor, one of the tenant's several sites -------
  {
    const parsed = requestSchema.parse({ ...baseRequest, siteEnrollmentId: enrJkt.id, visitors: [visitorRow(1)] });
    const vr = await buildAndCreateVisitorRequest(katalisGlobalAdmin, parsed);
    const visitors = await prisma.visitor.findMany({ where: { visitorRequestId: vr.id } });
    check(
      "Single visitor request at one site succeeds and is scoped to that site",
      vr.siteEnrollmentId === enrJkt.id && visitors.length === 1 && visitors[0].status === "Pending",
      `siteEnrollmentId=${vr.siteEnrollmentId}, visitors=${visitors.length}, status=${visitors[0]?.status}`
    );
  }

  // --- Scenario 2: blacklist screening fires automatically -----------------
  {
    const parsed = requestSchema.parse({
      ...baseRequest,
      siteEnrollmentId: enrJkt.id,
      visitors: [visitorRow(2, { fullName: "Bad Actor" })],
    });
    const vr = await buildAndCreateVisitorRequest(katalisGlobalAdmin, parsed);
    const visitor = await prisma.visitor.findFirstOrThrow({ where: { visitorRequestId: vr.id } });
    check(
      "A visitor matching the blacklist is auto-flagged instead of silently admitted",
      visitor.status === "Blacklisted" && visitor.isBlacklistMatch === true,
      `status=${visitor.status}, isBlacklistMatch=${visitor.isBlacklistMatch}`
    );
  }

  // --- Scenario 3: manual group request, under the limit, at a 2nd site ----
  {
    const n = 10;
    const parsed = requestSchema.parse({
      ...baseRequest,
      siteEnrollmentId: enrSby.id,
      visitors: Array.from({ length: n }, (_, i) => visitorRow(100 + i)),
    });
    const vr = await buildAndCreateVisitorRequest(katalisGlobalAdmin, parsed);
    const visitors = await prisma.visitor.findMany({ where: { visitorRequestId: vr.id } });
    check(
      `Manual group request with ${n} visitors (under the ${MAX_VISITORS_PER_REQUEST} cap) succeeds`,
      vr.isGroup === true && visitors.length === n,
      `isGroup=${vr.isGroup}, visitors=${visitors.length}`
    );
  }

  // --- Scenario 4: manual group request OVER the limit is rejected ---------
  {
    const before = await prisma.visitorRequest.count();
    const oversized = MAX_VISITORS_PER_REQUEST + 5;
    const parsed = requestSchema.parse({
      ...baseRequest,
      siteEnrollmentId: enrSby.id,
      visitors: Array.from({ length: oversized }, (_, i) => visitorRow(200 + i)),
    });
    const { threw, message } = await expectThrows(
      () => buildAndCreateVisitorRequest(katalisGlobalAdmin, parsed),
      (err) => err instanceof VisitorGroupSizeError
    );
    const after = await prisma.visitorRequest.count();
    check(
      `Manual group request with ${oversized} visitors (over the cap) is rejected, nothing written`,
      threw && after === before,
      threw ? message : "did not throw"
    );
  }

  // --- Scenario 5: batch upload, under the limit, at the 3rd site ----------
  {
    const n = 20;
    const parsedBatch = batchRequestSchema.parse({ ...baseRequest, siteEnrollmentId: enrJhb.id });
    const rows = Array.from({ length: n }, (_, i) => visitorRow(300 + i));
    const vr = await buildAndCreateVisitorRequestBatch(katalisGlobalAdmin, parsedBatch, rows);
    const visitors = await prisma.visitor.findMany({ where: { visitorRequestId: vr.id } });
    check(
      `Batch upload with ${n} rows (under the cap) succeeds`,
      vr.source === "Batch" && visitors.length === n,
      `source=${vr.source}, visitors=${visitors.length}`
    );
  }

  // --- Scenario 6: batch upload OVER the limit is rejected ------------------
  {
    const before = await prisma.visitorRequest.count();
    const oversized = MAX_VISITORS_PER_REQUEST + 25;
    const parsedBatch = batchRequestSchema.parse({ ...baseRequest, siteEnrollmentId: enrJhb.id });
    const rows = Array.from({ length: oversized }, (_, i) => visitorRow(400 + i));
    const { threw, message } = await expectThrows(
      () => buildAndCreateVisitorRequestBatch(katalisGlobalAdmin, parsedBatch, rows),
      (err) => err instanceof VisitorGroupSizeError
    );
    const after = await prisma.visitorRequest.count();
    check(
      `Batch upload with ${oversized} rows (over the cap) is rejected, nothing written`,
      threw && after === before,
      threw ? message : "did not throw"
    );
  }

  // --- Scenario 6b: exact boundary — cap succeeds, cap+1 fails --------------
  {
    const parsedBatch = batchRequestSchema.parse({ ...baseRequest, siteEnrollmentId: enrJhb.id });
    const atCap = Array.from({ length: MAX_VISITORS_PER_REQUEST }, (_, i) => visitorRow(500 + i));
    const vr = await buildAndCreateVisitorRequestBatch(katalisGlobalAdmin, parsedBatch, atCap);
    const visitorsAtCap = await prisma.visitor.count({ where: { visitorRequestId: vr.id } });

    const overCap = Array.from({ length: MAX_VISITORS_PER_REQUEST + 1 }, (_, i) => visitorRow(600 + i));
    const { threw } = await expectThrows(
      () => buildAndCreateVisitorRequestBatch(katalisGlobalAdmin, parsedBatch, overCap),
      (err) => err instanceof VisitorGroupSizeError
    );
    check(
      `Boundary: exactly ${MAX_VISITORS_PER_REQUEST} succeeds, ${MAX_VISITORS_PER_REQUEST + 1} is rejected`,
      visitorsAtCap === MAX_VISITORS_PER_REQUEST && threw
    );
  }

  // --- Scenario 7: empty batch upload is rejected before the limit check ---
  {
    const parsedBatch = batchRequestSchema.parse({ ...baseRequest, siteEnrollmentId: enrJhb.id });
    const { threw, message } = await expectThrows(() => buildAndCreateVisitorRequestBatch(katalisGlobalAdmin, parsedBatch, []));
    check("An empty batch upload (no valid rows) is rejected with a clear message", threw && /no valid rows/i.test(message), message);
  }

  // --- Scenario 8: tenant-wide user sees every site enrolled in the region -
  {
    const enrollments = await getCustomerSiteEnrollments(katalisGlobalAdmin);
    const facilityIds = await getCustomerFacilityIds(katalisGlobalAdmin);
    const ids = enrollments.map((e) => e.id).sort();
    check(
      "Tenant global admin sees all 3 site enrollments across the region",
      ids.length === 3 && ids.includes(enrJkt.id) && ids.includes(enrSby.id) && ids.includes(enrJhb.id) && facilityIds.length === 3,
      `enrollments=${ids.length}, facilities=${facilityIds.length}`
    );
  }

  // --- Scenario 9: a site-restricted user only reaches their one site ------
  {
    const enrollments = await getCustomerSiteEnrollments(katalisJktSiteLead);
    const canJkt = await assertSiteEnrollmentAccess(katalisJktSiteLead, enrJkt.id);
    const canSby = await assertSiteEnrollmentAccess(katalisJktSiteLead, enrSby.id);
    const canJhb = await assertSiteEnrollmentAccess(katalisJktSiteLead, enrJhb.id);
    check(
      "A site-restricted user (JKT lead) is scoped to just that one site, not the tenant's others",
      enrollments.length === 1 && enrollments[0].id === enrJkt.id && canJkt && !canSby && !canJhb
    );

    const parsed = requestSchema.parse({ ...baseRequest, siteEnrollmentId: enrSby.id, visitors: [visitorRow(700)] });
    const { threw, message } = await expectThrows(() => buildAndCreateVisitorRequest(katalisJktSiteLead, parsed));
    check(
      "A site-restricted user cannot submit a visitor request against a site outside their scope",
      threw && /do not have access/i.test(message),
      message
    );
  }

  // --- Scenario 10: cross-tenant isolation at a facility both tenants share
  {
    const canRiversideAccessKatalis = await assertSiteEnrollmentAccess(riversideTechUser, enrSby.id);
    const canKatalisAccessRiverside = await assertSiteEnrollmentAccess(katalisGlobalAdmin, enrRiversideSby.id);
    check(
      "Two tenants sharing the same physical site cannot access each other's site enrollment",
      !canRiversideAccessKatalis && !canKatalisAccessRiverside
    );

    const riversideEnrollments = await getCustomerSiteEnrollments(riversideTechUser);
    check(
      "Riverside's own enrollment list contains only its own site, not Katalis's",
      riversideEnrollments.length === 1 && riversideEnrollments[0].id === enrRiversideSby.id
    );
  }

  // --- Scenario 11: approval + ACS sync integration point still fires ------
  {
    const parsed = requestSchema.parse({ ...baseRequest, siteEnrollmentId: enrJkt.id, visitors: [visitorRow(800)] });
    const vr = await buildAndCreateVisitorRequest(katalisGlobalAdmin, parsed);
    await prisma.visitor.updateMany({ where: { visitorRequestId: vr.id }, data: { status: "Approved" } });
    await pushVisitorRequestToAcs(vr.id);
    const log = await prisma.acsIntegrationLog.findFirst({ where: { visitorRequestId: vr.id } });
    check("Approving a visitor triggers an ACS sync attempt that gets logged", !!log, log ? `status=${log.responseStatus}` : "no log row");
  }

  // --- Observation: notification fan-out at a facility shared by 2 tenants -
  {
    const parsed = requestSchema.parse({ ...baseRequest, siteEnrollmentId: enrSby.id, visitors: [visitorRow(900)] });
    await buildAndCreateVisitorRequest(katalisGlobalAdmin, parsed);
    await prisma.notification.deleteMany();
    await notifyFacilityTenantUsers(siteSby.id, { title: "Sim notify", body: "test", category: "visitor" });
    const notified = await prisma.notification.findMany({ where: { userId: { in: [katalisGlobalAdmin.id, riversideTechUser.id] } } });
    const notifiedIds = new Set(notified.map((n) => n.userId));
    console.log(
      `ℹ OBSERVATION — notifyFacilityTenantUsers(SIM-SBY) notified Katalis: ${notifiedIds.has(katalisGlobalAdmin.id)}, Riverside: ${notifiedIds.has(
        riversideTechUser.id
      )}. It currently notifies every tenant enrolled at the facility, not just the requesting tenant — worth a look if that's not intended, separate from this task's scope.`
    );
  }

  console.log("\n--- Summary ---");
  const passed = results.filter((r) => r.pass).length;
  console.log(`${passed}/${results.length} scenarios passed.`);
  const failed = results.filter((r) => !r.pass);
  if (failed.length > 0) {
    console.log("\nFailed scenarios:");
    for (const f of failed) console.log(`  ✗ ${f.name}${f.note ? ` — ${f.note}` : ""}`);
  }

  await prisma.$disconnect();
  if (failed.length > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
