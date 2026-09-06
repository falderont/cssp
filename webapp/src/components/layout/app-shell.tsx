import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import type { NavItem } from "./nav-config";

export function AppShell({
  navItems,
  companyName,
  logoUrl,
  portalLabel,
  userName,
  role,
  contextLabel,
  unreadCount,
  notificationsHref,
  topbarSlot,
  children,
}: {
  navItems: NavItem[];
  companyName: string;
  logoUrl?: string | null;
  portalLabel: string;
  userName: string;
  role: string;
  contextLabel?: string;
  unreadCount?: number;
  notificationsHref: string;
  topbarSlot?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <div className="no-print contents">
        <Sidebar navItems={navItems} companyName={companyName} logoUrl={logoUrl} portalLabel={portalLabel} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="no-print contents">
          <Topbar
            name={userName}
            role={role}
            contextLabel={contextLabel}
            unreadCount={unreadCount}
            notificationsHref={notificationsHref}
          >
            {topbarSlot}
          </Topbar>
        </div>
        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
