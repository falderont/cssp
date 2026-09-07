import { ROLES, type Role } from "@/lib/constants";

// Icons are resolved to actual components client-side (see sidebar.tsx) —
// a NavItem must stay plain data (string icon key) because it's computed in
// a Server Component and passed as a prop into the client Sidebar, and React
// Server Components cannot serialize function/component references across
// that boundary.
export type IconKey =
  | "LayoutDashboard"
  | "Users"
  | "UsersRound"
  | "Siren"
  | "CalendarClock"
  | "Wrench"
  | "Gauge"
  | "FolderDown"
  | "Receipt"
  | "Trophy"
  | "Settings"
  | "Truck"
  | "IdCard"
  | "ShieldAlert"
  | "FileBarChart"
  | "Palette"
  | "Globe2"
  | "Map"
  | "MapPin"
  | "Ticket"
  | "Building2"
  | "Briefcase"
  | "Warehouse"
  | "Activity"
  | "BarChart3"
  | "ScrollText"
  | "DatabaseBackup"
  | "AlertTriangle"
  | "Plug"
  | "SlidersHorizontal";

// A NavItem with no `group` renders as a top-level link (e.g. Dashboard).
// Grouped items render nested under a collapsible section header, forming
// a two-level tree so related modules read together at a glance — keep
// items for the same group contiguous in the arrays below.
export type NavItem = {
  href: string;
  label: string;
  icon: IconKey;
  roles: Role[];
  group?: string;
};

export const PORTAL_GROUP_ORDER = ["Day-to-day", "Reporting", "Account administration"] as const;
export const OPS_GROUP_ORDER = [
  "Global administration",
  "System administration",
  "Front line",
  "Service delivery",
  "Reporting & accounts",
] as const;

const { TENANT_GLOBAL_ADMIN, TENANT_SITE_LEAD, TENANT_BILLING, TENANT_TECH_USER } = ROLES;
const { SYS_ADMIN, SERVICE_DESK, OPS_SITE_MANAGER, OPS_SITE_LEAD, OPS_FRONT_OFFICE_SECURITY, OPS_BUILDING_MANAGER, CS_TEAM, OPS_VENDOR } = ROLES;

export const PORTAL_NAV: NavItem[] = [
  {
    href: "/portal",
    label: "Dashboard",
    icon: "LayoutDashboard",
    roles: [TENANT_GLOBAL_ADMIN, TENANT_SITE_LEAD, TENANT_BILLING, TENANT_TECH_USER],
  },
  { href: "/portal/visitors", label: "Visitors", icon: "Users", group: "Day-to-day", roles: [TENANT_GLOBAL_ADMIN, TENANT_SITE_LEAD, TENANT_TECH_USER] },
  { href: "/portal/deliveries", label: "Deliveries", icon: "Truck", group: "Day-to-day", roles: [TENANT_GLOBAL_ADMIN, TENANT_SITE_LEAD, TENANT_TECH_USER] },
  { href: "/portal/aal", label: "Authorized Access List", icon: "IdCard", group: "Day-to-day", roles: [TENANT_GLOBAL_ADMIN, TENANT_SITE_LEAD] },
  { href: "/portal/incidents", label: "Incidents", icon: "Siren", group: "Day-to-day", roles: [TENANT_GLOBAL_ADMIN, TENANT_SITE_LEAD, TENANT_TECH_USER] },
  {
    href: "/portal/maintenance",
    label: "Maintenance",
    icon: "CalendarClock",
    group: "Day-to-day",
    roles: [TENANT_GLOBAL_ADMIN, TENANT_SITE_LEAD, TENANT_TECH_USER],
  },
  {
    href: "/portal/service-requests",
    label: "Service Requests",
    icon: "Wrench",
    group: "Day-to-day",
    roles: [TENANT_GLOBAL_ADMIN, TENANT_SITE_LEAD, TENANT_TECH_USER],
  },
  {
    href: "/portal/telemetry",
    label: "Telemetry (BMS)",
    icon: "Gauge",
    group: "Day-to-day",
    roles: [TENANT_GLOBAL_ADMIN, TENANT_SITE_LEAD, TENANT_TECH_USER],
  },
  {
    href: "/portal/documents",
    label: "Download Center",
    icon: "FolderDown",
    group: "Reporting",
    roles: [TENANT_GLOBAL_ADMIN, TENANT_SITE_LEAD, TENANT_BILLING, TENANT_TECH_USER],
  },
  { href: "/portal/reports", label: "Reports", icon: "FileBarChart", group: "Reporting", roles: [TENANT_GLOBAL_ADMIN] },
  { href: "/portal/billing", label: "Billing", icon: "Receipt", group: "Reporting", roles: [TENANT_GLOBAL_ADMIN, TENANT_BILLING] },
  { href: "/portal/branding", label: "Branding", icon: "Palette", group: "Account administration", roles: [TENANT_GLOBAL_ADMIN] },
  { href: "/portal/settings", label: "Team & Settings", icon: "Settings", group: "Account administration", roles: [TENANT_GLOBAL_ADMIN] },
];

export const OPS_NAV: NavItem[] = [
  {
    href: "/ops",
    label: "Dashboard",
    icon: "LayoutDashboard",
    roles: [SYS_ADMIN, SERVICE_DESK, OPS_SITE_MANAGER, OPS_SITE_LEAD, OPS_FRONT_OFFICE_SECURITY, OPS_BUILDING_MANAGER, CS_TEAM, OPS_VENDOR],
  },

  // Global Sys Admin only — the master-data control plane (site hierarchy,
  // tenants, users, teams) lives here, ahead of the day-to-day front-line and
  // service-delivery tools every other ops persona shares. Site management
  // and Area Change Requests are the exception: their access is delegable
  // (see requireMasterDataAdmin() in lib/session.ts), so their roles list is
  // wider than the rest of this section. Region/Country/City/Site are staged
  // on that one consolidated screen rather than four separate pages — each
  // level is added inline as you drill in, then a site hands off to its own
  // dedicated admin page for buildings and rooms.
  { href: "/ops/admin", label: "Global Overview", icon: "Globe2", group: "Global administration", roles: [SYS_ADMIN] },
  { href: "/ops/admin/facilities", label: "Site Management", icon: "Building2", group: "Global administration", roles: [SYS_ADMIN, SERVICE_DESK] },
  {
    href: "/ops/aal",
    label: "Authorized Access List",
    icon: "IdCard",
    group: "Global administration",
    roles: [SYS_ADMIN, OPS_SITE_MANAGER, OPS_FRONT_OFFICE_SECURITY],
  },
  {
    href: "/ops/loading-docks",
    label: "Loading Docks",
    icon: "Warehouse",
    group: "Global administration",
    roles: [SYS_ADMIN, OPS_BUILDING_MANAGER],
  },
  {
    href: "/ops/admin/area-change-requests",
    label: "Area Change Requests",
    icon: "Ticket",
    group: "Global administration",
    roles: [SYS_ADMIN, SERVICE_DESK, OPS_SITE_MANAGER, OPS_SITE_LEAD, OPS_FRONT_OFFICE_SECURITY, CS_TEAM, OPS_VENDOR],
  },
  {
    href: "/ops/admin/accounts",
    label: "Tenant Accounts",
    icon: "Briefcase",
    group: "Global administration",
    roles: [SYS_ADMIN, SERVICE_DESK],
  },
  { href: "/ops/admin/teams", label: "Teams", icon: "UsersRound", group: "Global administration", roles: [SYS_ADMIN] },
  { href: "/ops/admin/users", label: "Users", icon: "Users", group: "Global administration", roles: [SYS_ADMIN] },
  {
    href: "/ops/admin/blacklist",
    label: "Blacklist",
    icon: "ShieldAlert",
    group: "Global administration",
    roles: [SYS_ADMIN, OPS_SITE_MANAGER, OPS_FRONT_OFFICE_SECURITY],
  },

  // Global Sys Admin's platform-health toolbox — previously only reachable
  // as quick-link cards from the Global Overview hub, promoted to its own
  // sidebar section so it doesn't get lost alongside master data.
  { href: "/ops/admin/stats", label: "Statistics", icon: "BarChart3", group: "System administration", roles: [SYS_ADMIN] },
  {
    href: "/ops/admin/system-health",
    label: "System Performance",
    icon: "Activity",
    group: "System administration",
    roles: [SYS_ADMIN],
  },
  { href: "/ops/admin/logs", label: "System Logs", icon: "ScrollText", group: "System administration", roles: [SYS_ADMIN] },
  {
    href: "/ops/admin/backup",
    label: "Backup & Maintenance",
    icon: "DatabaseBackup",
    group: "System administration",
    roles: [SYS_ADMIN],
  },
  {
    href: "/ops/admin/error-catalog",
    label: "Error Catalog",
    icon: "AlertTriangle",
    group: "System administration",
    roles: [SYS_ADMIN],
  },
  { href: "/ops/admin/integrations", label: "Integrations", icon: "Plug", group: "System administration", roles: [SYS_ADMIN] },
  {
    href: "/ops/admin/preferences",
    label: "Global Preferences",
    icon: "SlidersHorizontal",
    group: "System administration",
    roles: [SYS_ADMIN],
  },
  { href: "/ops/admin/branding", label: "Branding", icon: "Palette", group: "System administration", roles: [SYS_ADMIN] },

  {
    href: "/ops/visitors",
    label: "Visitor Approvals",
    icon: "Users",
    group: "Front line",
    roles: [SYS_ADMIN, OPS_SITE_MANAGER, OPS_FRONT_OFFICE_SECURITY],
  },
  { href: "/ops/front-desk", label: "Front Desk", icon: "IdCard", group: "Front line", roles: [SYS_ADMIN, OPS_SITE_MANAGER, OPS_FRONT_OFFICE_SECURITY] },
  {
    href: "/ops/deliveries",
    label: "Deliveries",
    icon: "Truck",
    group: "Front line",
    roles: [SYS_ADMIN, OPS_SITE_MANAGER, OPS_FRONT_OFFICE_SECURITY],
  },

  { href: "/ops/incidents", label: "Incidents", icon: "Siren", group: "Service delivery", roles: [SYS_ADMIN, SERVICE_DESK, OPS_SITE_MANAGER, OPS_SITE_LEAD] },
  {
    href: "/ops/maintenance",
    label: "Maintenance",
    icon: "CalendarClock",
    group: "Service delivery",
    roles: [SYS_ADMIN, SERVICE_DESK, OPS_SITE_MANAGER, OPS_SITE_LEAD],
  },
  {
    href: "/ops/service-requests",
    label: "Service Requests",
    icon: "Wrench",
    group: "Service delivery",
    roles: [SYS_ADMIN, SERVICE_DESK, OPS_SITE_MANAGER, OPS_SITE_LEAD, CS_TEAM, OPS_VENDOR],
  },
  { href: "/ops/telemetry", label: "Telemetry (BMS)", icon: "Gauge", group: "Service delivery", roles: [SYS_ADMIN, OPS_SITE_MANAGER, OPS_SITE_LEAD] },

  {
    href: "/ops/documents",
    label: "Download Center",
    icon: "FolderDown",
    group: "Reporting & accounts",
    roles: [SYS_ADMIN, OPS_SITE_MANAGER, CS_TEAM],
  },
  { href: "/ops/billing", label: "Billing", icon: "Receipt", group: "Reporting & accounts", roles: [SYS_ADMIN, CS_TEAM] },
  {
    href: "/ops/cs-performance",
    label: "CS Performance",
    icon: "Trophy",
    group: "Reporting & accounts",
    roles: [SYS_ADMIN, CS_TEAM, OPS_SITE_MANAGER],
  },
];

export function navForRole(nav: NavItem[], role: string): NavItem[] {
  return nav.filter((item) => (item.roles as string[]).includes(role));
}

export function groupNavItems(items: NavItem[], order: readonly string[]) {
  const top = items.filter((i) => !i.group);
  const groups = order
    .map((name) => ({ name, items: items.filter((i) => i.group === name) }))
    .filter((g) => g.items.length > 0);
  return { top, groups };
}
