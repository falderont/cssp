import { AppShell } from "@/components/layout/app-shell";
import { navForRole, OPS_NAV, OPS_GROUP_ORDER } from "@/components/layout/nav-config";
import { requireInternalUser } from "@/lib/session";
import { getProviderBranding } from "@/lib/branding";
import { prisma } from "@/lib/prisma";
import { getUserPreferences } from "@/lib/preferences";

export default async function OpsLayout({ children }: { children: React.ReactNode }) {
  const user = await requireInternalUser();
  const preferences = await getUserPreferences(user.id);
  const notificationWhere = {
    userId: user.id,
    ...(preferences.mutedCategories.length ? { category: { notIn: preferences.mutedCategories } } : {}),
  };
  const [branding, unreadCount, recentNotifications] = await Promise.all([
    getProviderBranding(),
    prisma.notification.count({ where: { ...notificationWhere, isRead: false } }),
    prisma.notification.findMany({ where: notificationWhere, orderBy: { createdAt: "desc" }, take: 8 }),
  ]);

  return (
    <AppShell
      navItems={navForRole(OPS_NAV, user.role)}
      groupOrder={OPS_GROUP_ORDER}
      companyName={branding.companyName}
      logoUrl={branding.logoUrl}
      portalLabel="Provider Console"
      userName={user.name ?? user.email ?? "User"}
      userEmail={user.email}
      role={user.role}
      avatarUrl={preferences.avatarUrl}
      contextLabel="Internal"
      unreadCount={unreadCount}
      recentNotifications={recentNotifications}
      notificationsHref="/ops/notifications"
      preferencesHref="/ops/profile"
      changelogHref="/ops/changelog"
      accentColor={preferences.accentColor}
      themeColor={preferences.accentColor}
      density={preferences.density}
    >
      {children}
    </AppShell>
  );
}
