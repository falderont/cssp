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

export async function getCurrentUserRecord() {
  const user = await requireUser();
  return prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    include: { enterpriseAccount: true, restrictedFacility: true },
  });
}
