import { AppShell } from "@/components/layout/app-shell";
import { navForRole, OPS_NAV } from "@/components/layout/nav-config";
import { requireInternalUser } from "@/lib/session";
import { getProviderBranding } from "@/lib/branding";
import { prisma } from "@/lib/prisma";

export default async function OpsLayout({ children }: { children: React.ReactNode }) {
  const user = await requireInternalUser();
  const [branding, unreadCount] = await Promise.all([
    getProviderBranding(),
    prisma.notification.count({ where: { userId: user.id, isRead: false } }),
  ]);

  return (
    <AppShell
      navItems={navForRole(OPS_NAV, user.role)}
      companyName={branding.companyName}
      logoUrl={branding.logoUrl}
      portalLabel="Provider Console"
      userName={user.name ?? user.email ?? "User"}
      role={user.role}
      contextLabel="Internal"
      unreadCount={unreadCount}
      notificationsHref="/ops/notifications"
    >
      {children}
    </AppShell>
  );
}
