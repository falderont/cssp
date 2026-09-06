import { prisma } from "./prisma";
import { ROLES } from "./constants";

type NotifyData = { title: string; body: string; category: string; linkUrl?: string };

export async function notifyUsers(userIds: string[], data: NotifyData) {
  const unique = Array.from(new Set(userIds));
  if (unique.length === 0) return;
  await prisma.notification.createMany({
    data: unique.map((userId) => ({ userId, ...data })),
  });
}

// Notifies every active tenant user enrolled at this facility (unless a
// "site contact" user is restricted to a different facility).
export async function notifyFacilityTenantUsers(facilityId: string, data: NotifyData) {
  const enrollments = await prisma.siteEnrollment.findMany({
    where: { facilityId, status: "Active" },
    select: { enterpriseAccountId: true },
  });
  const accountIds = Array.from(new Set(enrollments.map((e) => e.enterpriseAccountId)));
  if (accountIds.length === 0) return;
  const users = await prisma.user.findMany({
    where: {
      enterpriseAccountId: { in: accountIds },
      isActive: true,
      OR: [{ restrictedFacilityId: null }, { restrictedFacilityId: facilityId }],
    },
    select: { id: true },
  });
  await notifyUsers(
    users.map((u) => u.id),
    data
  );
}

export async function notifyEnterpriseAccountAdmins(enterpriseAccountId: string, data: NotifyData) {
  const users = await prisma.user.findMany({
    where: { enterpriseAccountId, isActive: true, role: ROLES.TENANT_GLOBAL_ADMIN },
    select: { id: true },
  });
  await notifyUsers(
    users.map((u) => u.id),
    data
  );
}
