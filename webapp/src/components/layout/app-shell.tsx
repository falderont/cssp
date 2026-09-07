import Link from "next/link";
import { Sidebar } from "./sidebar";
import { Topbar, type NotificationPreview } from "./topbar";
import { MobileNavProvider } from "./mobile-nav-context";
import type { NavItem } from "./nav-config";

export function AppShell({
  navItems,
  groupOrder,
  companyName,
  logoUrl,
  portalLabel,
  userName,
  userEmail,
  role,
  avatarUrl,
  contextLabel,
  unreadCount,
  recentNotifications,
  notificationsHref,
  preferencesHref,
  changelogHref,
  topbarSlot,
  tenantBrand,
  themeColor,
  accentColor,
  density,
  children,
}: {
  navItems: NavItem[];
  groupOrder: readonly string[];
  companyName: string;
  logoUrl?: string | null;
  portalLabel: string;
  userName: string;
  userEmail?: string | null;
  role: string;
  avatarUrl?: string | null;
  contextLabel?: string;
  unreadCount?: number;
  recentNotifications?: NotificationPreview[];
  notificationsHref: string;
  preferencesHref: string;
  changelogHref: string;
  topbarSlot?: React.ReactNode;
  tenantBrand?: { name: string; logoUrl?: string | null } | null;
  themeColor?: string | null;
  accentColor?: string | null;
  density?: "comfortable" | "compact";
  children: React.ReactNode;
}) {
  return (
    <MobileNavProvider>
      <div
        className="flex min-h-screen bg-slate-50"
        data-density={density === "compact" ? "compact" : undefined}
        style={themeColor ? ({ "--brand-primary": themeColor } as React.CSSProperties) : undefined}
      >
        <div className="no-print contents">
          <Sidebar
            navItems={navItems}
            groupOrder={groupOrder}
            companyName={companyName}
            logoUrl={logoUrl}
            portalLabel={portalLabel}
            tenantBrand={tenantBrand}
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="no-print contents">
            <Topbar
              name={userName}
              email={userEmail}
              role={role}
              avatarUrl={avatarUrl}
              contextLabel={contextLabel}
              unreadCount={unreadCount}
              recentNotifications={recentNotifications}
              notificationsHref={notificationsHref}
              preferencesHref={preferencesHref}
              currentAccentColor={accentColor}
              currentDensity={density}
            >
              {topbarSlot}
            </Topbar>
          </div>
          <main className="flex-1 p-4 lg:p-8">{children}</main>
          <footer className="no-print border-t border-slate-200 bg-white px-4 py-3 text-center text-xs text-slate-400 lg:px-8">
            <Link href={changelogHref} className="hover:text-brand hover:underline">
              Changelog
            </Link>
          </footer>
        </div>
      </div>
    </MobileNavProvider>
  );
}
