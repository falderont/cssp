import { describe, expect, it, vi } from "vitest";

// One tenant ("Nusantara") enrolled at three sites that all sit in the same
// APAC region (mirrors prisma/seed.ts: jkt01 + sby01 in Indonesia, ndp in
// Malaysia — one region, two countries, three sites). A second tenant
// ("Trisula") shares one of those facilities, to exercise cross-tenant
// isolation on a site the first tenant also occupies.
type FakeEnrollment = { id: string; enterpriseAccountId: string; facilityId: string };

const ENROLLMENTS: FakeEnrollment[] = [
  { id: "enr-jkt", enterpriseAccountId: "nusantara", facilityId: "jkt01" },
  { id: "enr-sby", enterpriseAccountId: "nusantara", facilityId: "sby01" },
  { id: "enr-ndp", enterpriseAccountId: "nusantara", facilityId: "ndp" },
  { id: "enr-trisula-sby", enterpriseAccountId: "trisula", facilityId: "sby01" },
];

vi.mock("@/lib/prisma", () => ({
  prisma: {
    siteEnrollment: {
      findMany: vi.fn(async ({ where }: { where: { enterpriseAccountId: string; facilityId?: string } }) =>
        ENROLLMENTS.filter(
          (e) => e.enterpriseAccountId === where.enterpriseAccountId && (!where.facilityId || e.facilityId === where.facilityId)
        )
      ),
    },
  },
}));

const { getCustomerSiteEnrollments, getCustomerFacilityIds, assertSiteEnrollmentAccess } = await import("./scope");

describe("getCustomerSiteEnrollments — one tenant, multiple sites in one region", () => {
  it("returns every enrolled site for an unrestricted (global admin) tenant user", async () => {
    const enrollments = await getCustomerSiteEnrollments({ enterpriseAccountId: "nusantara", restrictedFacilityId: null });
    expect(enrollments.map((e) => e.id).sort()).toEqual(["enr-jkt", "enr-ndp", "enr-sby"]);
  });

  it("pins a site-restricted user to just their one facility among the tenant's several", async () => {
    const enrollments = await getCustomerSiteEnrollments({ enterpriseAccountId: "nusantara", restrictedFacilityId: "sby01" });
    expect(enrollments.map((e) => e.id)).toEqual(["enr-sby"]);
  });

  it("returns nothing for a user with no enterprise account", async () => {
    const enrollments = await getCustomerSiteEnrollments({ enterpriseAccountId: null, restrictedFacilityId: null });
    expect(enrollments).toEqual([]);
  });

  it("never leaks another tenant's enrollment at a shared facility", async () => {
    const enrollments = await getCustomerSiteEnrollments({ enterpriseAccountId: "nusantara", restrictedFacilityId: null });
    expect(enrollments.some((e) => e.id === "enr-trisula-sby")).toBe(false);
  });
});

describe("getCustomerFacilityIds", () => {
  it("returns the distinct facilities backing all of a tenant's site enrollments", async () => {
    const ids = await getCustomerFacilityIds({ enterpriseAccountId: "nusantara", restrictedFacilityId: null });
    expect(ids.sort()).toEqual(["jkt01", "ndp", "sby01"]);
  });
});

describe("assertSiteEnrollmentAccess", () => {
  it("grants access to each of the tenant's own site enrollments across the region", async () => {
    const user = { enterpriseAccountId: "nusantara", restrictedFacilityId: null };
    expect(await assertSiteEnrollmentAccess(user, "enr-jkt")).toBe(true);
    expect(await assertSiteEnrollmentAccess(user, "enr-sby")).toBe(true);
    expect(await assertSiteEnrollmentAccess(user, "enr-ndp")).toBe(true);
  });

  it("denies a request against a site the tenant is not enrolled at", async () => {
    const user = { enterpriseAccountId: "nusantara", restrictedFacilityId: null };
    expect(await assertSiteEnrollmentAccess(user, "enr-does-not-exist")).toBe(false);
  });

  it("denies a site-restricted user access to the tenant's other sites in the same region", async () => {
    const user = { enterpriseAccountId: "nusantara", restrictedFacilityId: "sby01" };
    expect(await assertSiteEnrollmentAccess(user, "enr-jkt")).toBe(false);
    expect(await assertSiteEnrollmentAccess(user, "enr-ndp")).toBe(false);
    expect(await assertSiteEnrollmentAccess(user, "enr-sby")).toBe(true);
  });

  it("denies cross-tenant access even at a facility both tenants share", async () => {
    const nusantaraUser = { enterpriseAccountId: "nusantara", restrictedFacilityId: null };
    const trisulaUser = { enterpriseAccountId: "trisula", restrictedFacilityId: null };
    expect(await assertSiteEnrollmentAccess(nusantaraUser, "enr-trisula-sby")).toBe(false);
    expect(await assertSiteEnrollmentAccess(trisulaUser, "enr-sby")).toBe(false);
  });
});
