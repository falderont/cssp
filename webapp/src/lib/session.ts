import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "./auth";
import { prisma } from "./prisma";
import { isCustomerRole, isInternalRole, ROLES } from "./constants";

export async function getSession() {
  return getServerSession(authOptions);
}

export async function requireUser() {
  const session = await getSession();
  if (!session?.user) redirect("/login");
  if (session.user.role !== ROLES.SYS_ADMIN) {
    const settings = await prisma.providerSettings.findUnique({ where: { id: "singleton" } });
    if (settings?.maintenanceMode) redirect("/maintenance");
  }
  return session.user;
}

export async function requireInternalUser() {
  const user = await requireUser();
  if (!isInternalRole(user.role)) redirect("/portal");
  return user;
}

export async function requireCustomerUser() {
  const user = await requireUser();
  if (!isCustomerRole(user.role)) redirect("/ops");
  if (!user.enterpriseAccountId) redirect("/login");
  return user as typeof user & { enterpriseAccountId: string };
}

export async function requireSysAdmin() {
  const user = await requireInternalUser();
  if (user.role !== ROLES.SYS_ADMIN) redirect("/ops");
  return user;
}

// Area (location) master data — Region/Country/City/Site/Building/Room — is
// owned by the Global Sys Admin and delegable to Service Desk. Every other
// internal role raises an AreaChangeRequest ticket instead (see
// actions/area.ts) rather than getting this access.
export async function requireMasterDataAdmin() {
  const user = await requireInternalUser();
  const allowed: string[] = [ROLES.SYS_ADMIN, ROLES.SERVICE_DESK];
  if (!allowed.includes(user.role)) redirect("/ops");
  return user;
}

// Blacklist management is delegated to front-line ops day-to-day, not
// restricted to the Sys Admin like the rest of /ops/admin — must match
// the role check in actions/blacklist.ts.
export async function requireBlacklistManager() {
  const user = await requireInternalUser();
  const allowed: string[] = [ROLES.SYS_ADMIN, ROLES.OPS_FRONT_OFFICE_SECURITY, ROLES.OPS_SITE_MANAGER];
  if (!allowed.includes(user.role)) redirect("/ops");
  return user;
}

// Owns building-level logistics — defines the loading dock locations tenants
// pick from when submitting a delivery ticket for that site.
export async function requireBuildingManager() {
  const user = await requireInternalUser();
  const allowed: string[] = [ROLES.SYS_ADMIN, ROLES.OPS_BUILDING_MANAGER];
  if (!allowed.includes(user.role)) redirect("/ops");
  return user;
}

// Runs a facility, coordinates approvals/assignment day-to-day.
export async function requireOpsManager() {
  const user = await requireInternalUser();
  const allowed: string[] = [ROLES.SYS_ADMIN, ROLES.OPS_SITE_MANAGER];
  if (!allowed.includes(user.role)) redirect("/ops");
  return user;
}

export async function requireTenantGlobalAdmin() {
  const user = await requireCustomerUser();
  if (user.role !== ROLES.TENANT_GLOBAL_ADMIN) redirect("/portal");
  return user;
}

// A tenant user who can act for their whole account, or is the operational
// lead for the one site they're restricted to.
export async function requireTenantAdminOrSiteLead() {
  const user = await requireCustomerUser();
  const allowed: string[] = [ROLES.TENANT_GLOBAL_ADMIN, ROLES.TENANT_SITE_LEAD];
  if (!allowed.includes(user.role)) redirect("/portal");
  return user;
}

export async function getCurrentUserRecord() {
  const user = await requireUser();
  return prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    include: { enterpriseAccount: true, restrictedFacility: true },
  });
}
