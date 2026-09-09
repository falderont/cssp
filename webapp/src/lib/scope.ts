import { prisma } from "./prisma";
import { ROLES, OPS_TEAM_ROLES } from "./constants";

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

// Who a customer can request to meet with for a GeneralMeeting service
// request, for one facility: that site's escalation matrix (Ops team
// members explicitly flagged isEscalationContact and restricted to this
// facility) plus the CS Team rep(s) whose csScope covers it. CS Team
// "Billing" scope is excluded — they cover invoices, not meetings.
export type MeetingContact = {
  id: string;
  name: string;
  title: string | null;
  role: string;
  group: "Escalation" | "CSTeam";
};

export async function getMeetingRequestContacts(facilityId: string): Promise<MeetingContact[]> {
  const facility = await prisma.facility.findUnique({
    where: { id: facilityId },
    select: { city: { select: { countryId: true, country: { select: { regionId: true } } } } },
  });
  if (!facility) return [];
  const countryId = facility.city.countryId;
  const regionId = facility.city.country.regionId;

  const [escalationContacts, csTeam] = await Promise.all([
    prisma.user.findMany({
      where: { role: { in: OPS_TEAM_ROLES }, isEscalationContact: true, isActive: true, restrictedFacilityId: facilityId },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({ where: { role: ROLES.CS_TEAM, isActive: true }, orderBy: { name: "asc" } }),
  ]);

  const assignedCs = csTeam.filter((u) => {
    if (u.csScope === "Corporate") return true;
    if (u.csScope === "Region") return u.restrictedRegionId === regionId;
    if (u.csScope === "Country") return u.restrictedCountryId === countryId;
    if (u.csScope === "Site") return u.restrictedFacilityId === facilityId;
    return false;
  });

  return [
    ...escalationContacts.map((u) => ({ id: u.id, name: u.name, title: u.title, role: u.role, group: "Escalation" as const })),
    ...assignedCs.map((u) => ({ id: u.id, name: u.name, title: u.title, role: u.role, group: "CSTeam" as const })),
  ];
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
