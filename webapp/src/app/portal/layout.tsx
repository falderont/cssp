import { AppShell } from "@/components/layout/app-shell";
import { navForRole, PORTAL_NAV } from "@/components/layout/nav-config";
import { requireCustomerUser } from "@/lib/session";
import { getProviderBranding } from "@/lib/branding";
import { prisma } from "@/lib/prisma";
import { getCustomerSiteEnrollments } from "@/lib/scope";
import { SiteSwitcher } from "@/components/layout/site-switcher";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await requireCustomerUser();
  const [branding, account, unreadCount, enrollments] = await Promise.all([
    getProviderBranding(),
    prisma.enterpriseAccount.findUnique({ where: { id: user.enterpriseAccountId } }),
    prisma.notification.count({ where: { userId: user.id, isRead: false } }),
    getCustomerSiteEnrollments(user),
  ]);
  const facilities = enrollments.map((e) => ({ id: e.facilityId, name: e.facility.name }));

  return (
    <AppShell
      navItems={navForRole(PORTAL_NAV, user.role)}
      companyName={branding.companyName}
      logoUrl={branding.logoUrl}
      portalLabel="Tenant Portal"
      userName={user.name ?? user.email ?? "User"}
      role={user.role}
      contextLabel={account?.name ?? undefined}
      unreadCount={unreadCount}
      notificationsHref="/portal/notifications"
      topbarSlot={<SiteSwitcher facilities={facilities} />}
      tenantBrand={account ? { name: account.name, logoUrl: account.logoUrl } : null}
      themeColor={account?.primaryColor}
    >
      {children}
    </AppShell>
  );
}
