import { AppShell } from "@/components/layout/app-shell";
import { navForRole, PORTAL_NAV, PORTAL_GROUP_ORDER } from "@/components/layout/nav-config";
import { requireCustomerUser } from "@/lib/session";
import { getProviderBranding } from "@/lib/branding";
import { prisma } from "@/lib/prisma";
import { getCustomerSiteEnrollments } from "@/lib/scope";
import { getUserPreferences } from "@/lib/preferences";
import { SiteSwitcher } from "@/components/layout/site-switcher";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await requireCustomerUser();
  const preferences = await getUserPreferences(user.id);
  const notificationWhere = {
    userId: user.id,
    ...(preferences.mutedCategories.length ? { category: { notIn: preferences.mutedCategories } } : {}),
  };
  const [branding, account, unreadCount, recentNotifications, enrollments] = await Promise.all([
    getProviderBranding(),
    prisma.enterpriseAccount.findUnique({ where: { id: user.enterpriseAccountId } }),
    prisma.notification.count({ where: { ...notificationWhere, isRead: false } }),
    prisma.notification.findMany({ where: notificationWhere, orderBy: { createdAt: "desc" }, take: 8 }),
    getCustomerSiteEnrollments(user),
  ]);
  const facilities = enrollments.map((e) => ({ id: e.facilityId, name: e.facility.name }));

  return (
    <AppShell
      navItems={navForRole(PORTAL_NAV, user.role)}
      groupOrder={PORTAL_GROUP_ORDER}
      companyName={branding.companyName}
      logoUrl={branding.logoUrl}
      portalLabel="Tenant Portal"
      userName={user.name ?? user.email ?? "User"}
      userEmail={user.email}
      role={user.role}
      avatarUrl={preferences.avatarUrl}
      contextLabel={account?.name ?? undefined}
      unreadCount={unreadCount}
      recentNotifications={recentNotifications}
      notificationsHref="/portal/notifications"
      preferencesHref="/portal/profile"
      changelogHref="/portal/changelog"
      topbarSlot={<SiteSwitcher facilities={facilities} />}
      tenantBrand={account ? { name: account.name, logoUrl: account.logoUrl } : null}
      themeColor={preferences.accentColor ?? account?.primaryColor}
      accentColor={preferences.accentColor}
      density={preferences.density}
    >
      {children}
    </AppShell>
  );
}
