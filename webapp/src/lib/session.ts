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

export async function requireSuperAdmin() {
  const user = await requireInternalUser();
  if (user.role !== ROLES.SUPER_ADMIN) redirect("/ops");
  return user;
}

// Blacklist management is delegated to Security/Ops day-to-day, not
// restricted to the Super Admin like the rest of /ops/admin — must match
// the role check in actions/blacklist.ts.
export async function requireBlacklistManager() {
  const user = await requireInternalUser();
  const allowed: string[] = [ROLES.SUPER_ADMIN, ROLES.PROVIDER_SECURITY, ROLES.PROVIDER_OPS];
  if (!allowed.includes(user.role)) redirect("/ops");
  return user;
}

export async function getCurrentUserRecord() {
  const user = await requireUser();
  return prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    include: { enterpriseAccount: true, restrictedFacility: true },
  });
}
