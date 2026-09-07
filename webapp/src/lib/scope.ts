import { prisma } from "./prisma";
import { ROLES } from "./constants";

type ScopedUser = {
  enterpriseAccountId: string | null;
  restrictedFacilityId: string | null;
};

type OpsScopedUser = {
  role: string;
  restrictedFacilityId: string | null;
  restrictedRegionId: string | null;
  restrictedCountryId: string | null;
  csScope?: string | null;
};

// Facility IDs an internal/ops user's list views should be filtered to.
// Returns undefined for roles with account-wide visibility (Sys Admin,
// Service Desk, CS Team scoped Corporate/Billing) — meaning "no filter".
// CS Team's scope mirrors the Region -> Country -> City -> Facility geography.
export async function getOpsFacilityIds(user: OpsScopedUser): Promise<string[] | undefined> {
  if (user.role === ROLES.CS_TEAM) {
    if (user.csScope === "Site" && user.restrictedFacilityId) return [user.restrictedFacilityId];
    if (user.csScope === "Country" && user.restrictedCountryId) {
      const facilities = await prisma.facility.findMany({ where: { city: { countryId: user.restrictedCountryId } }, select: { id: true } });
      return facilities.map((f) => f.id);
    }
    if (user.csScope === "Region" && user.restrictedRegionId) {
      const facilities = await prisma.facility.findMany({
        where: { city: { country: { regionId: user.restrictedRegionId } } },
        select: { id: true },
      });
      return facilities.map((f) => f.id);
    }
    return undefined;
  }
  if (user.restrictedFacilityId) return [user.restrictedFacilityId];
  return undefined;
}

// A customer user sees every SiteEnrollment for their account, unless they're
// a site-restricted "site contact" (PRD's customer-site role), in which case
// they're pinned to one facility.
export async function getCustomerSiteEnrollments(user: ScopedUser) {
  if (!user.enterpriseAccountId) return [];
  return prisma.siteEnrollment.findMany({
    where: {
      enterpriseAccountId: user.enterpriseAccountId,
      ...(user.restrictedFacilityId ? { facilityId: user.restrictedFacilityId } : {}),
    },
    include: { facility: { include: { city: { include: { country: { include: { region: true } } } }, buildings: true } } },
    orderBy: { createdAt: "asc" },
  });
}

export async function getCustomerFacilityIds(user: ScopedUser): Promise<string[]> {
  const enrollments = await getCustomerSiteEnrollments(user);
  return Array.from(new Set(enrollments.map((e) => e.facilityId)));
}

export async function assertSiteEnrollmentAccess(user: ScopedUser, siteEnrollmentId: string) {
  const enrollments = await getCustomerSiteEnrollments(user);
  return enrollments.some((e) => e.id === siteEnrollmentId);
}

// A document is visible to a tenant if it's global (no account) or theirs,
// AND either facility-agnostic or scoped to one of their enrolled facilities.
export function documentVisibilityWhere(enterpriseAccountId: string, facilityIds: string[]) {
  return {
    AND: [
      { OR: [{ enterpriseAccountId: null }, { enterpriseAccountId }] },
      { OR: [{ facilityId: null }, { facilityId: { in: facilityIds } }] },
    ],
  };
}

export function canViewDocument(
  doc: { enterpriseAccountId: string | null; facilityId: string | null },
  enterpriseAccountId: string,
  facilityIds: string[]
) {
  const accountOk = doc.enterpriseAccountId === null || doc.enterpriseAccountId === enterpriseAccountId;
  const facilityOk = doc.facilityId === null || facilityIds.includes(doc.facilityId);
  return accountOk && facilityOk;
}
