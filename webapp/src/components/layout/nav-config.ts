import { ROLES, type Role } from "@/lib/constants";

// Icons are resolved to actual components client-side (see sidebar.tsx) —
// a NavItem must stay plain data (string icon key) because it's computed in
// a Server Component and passed as a prop into the client Sidebar, and React
// Server Components cannot serialize function/component references across
// that boundary.
export type IconKey =
  | "LayoutDashboard"
  | "Users"
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
  | "Palette";

// A NavItem with no `group` renders as a top-level link (e.g. Dashboard).
// Grouped items render nested under a collapsible section header, forming
// a two-level tree so related modules read together at a glance.
export type NavItem = {
  href: string;
  label: string;
  icon: IconKey;
  roles: Role[];
  group?: string;
};

export const PORTAL_GROUP_ORDER = ["Site Operations", "Resources", "Account"] as const;
export const OPS_GROUP_ORDER = ["Front Line", "Operations", "Business", "Administration"] as const;

const { TENANT_GLOBAL_ADMIN, TENANT_SITE_LEAD, TENANT_BILLING, TENANT_TECH_USER } = ROLES;
const { SYS_ADMIN, SERVICE_DESK, OPS_SITE_MANAGER, OPS_SITE_LEAD, OPS_FRONT_OFFICE_SECURITY, CS_TEAM, OPS_VENDOR } = ROLES;

export const PORTAL_NAV: NavItem[] = [
  {
    href: "/portal",
    label: "Dashboard",
    icon: "LayoutDashboard",
    roles: [TENANT_GLOBAL_ADMIN, TENANT_SITE_LEAD, TENANT_BILLING, TENANT_TECH_USER],
  },
  {
    href: "/portal/visitors",
    label: "Visitors",
    icon: "Users",
    roles: [TENANT_GLOBAL_ADMIN, TENANT_SITE_LEAD, TENANT_TECH_USER],
    group: "Site Operations",
  },
  {
    href: "/portal/deliveries",
    label: "Deliveries",
    icon: "Truck",
    roles: [TENANT_GLOBAL_ADMIN, TENANT_SITE_LEAD, TENANT_TECH_USER],
    group: "Site Operations",
  },
  {
    href: "/portal/aal",
    label: "Authorized Access List",
    icon: "IdCard",
    roles: [TENANT_GLOBAL_ADMIN, TENANT_SITE_LEAD],
    group: "Site Operations",
  },
  {
    href: "/portal/incidents",
    label: "Incidents",
    icon: "Siren",
    roles: [TENANT_GLOBAL_ADMIN, TENANT_SITE_LEAD, TENANT_TECH_USER],
    group: "Site Operations",
  },
  {
    href: "/portal/maintenance",
    label: "Maintenance",
    icon: "CalendarClock",
    roles: [TENANT_GLOBAL_ADMIN, TENANT_SITE_LEAD, TENANT_TECH_USER],
    group: "Site Operations",
  },
  {
    href: "/portal/service-requests",
    label: "Service Requests",
    icon: "Wrench",
    roles: [TENANT_GLOBAL_ADMIN, TENANT_SITE_LEAD, TENANT_TECH_USER],
    group: "Site Operations",
  },
  {
    href: "/portal/telemetry",
    label: "Telemetry (BMS)",
    icon: "Gauge",
    roles: [TENANT_GLOBAL_ADMIN, TENANT_SITE_LEAD, TENANT_TECH_USER],
    group: "Site Operations",
  },
  {
    href: "/portal/documents",
    label: "Download Center",
    icon: "FolderDown",
    roles: [TENANT_GLOBAL_ADMIN, TENANT_SITE_LEAD, TENANT_BILLING, TENANT_TECH_USER],
    group: "Resources",
  },
  { href: "/portal/reports", label: "Reports", icon: "FileBarChart", roles: [TENANT_GLOBAL_ADMIN], group: "Resources" },
  { href: "/portal/billing", label: "Billing", icon: "Receipt", roles: [TENANT_GLOBAL_ADMIN, TENANT_BILLING], group: "Account" },
  { href: "/portal/branding", label: "Branding", icon: "Palette", roles: [TENANT_GLOBAL_ADMIN], group: "Account" },
  { href: "/portal/settings", label: "Team & Settings", icon: "Settings", roles: [TENANT_GLOBAL_ADMIN], group: "Account" },
];

export const OPS_NAV: NavItem[] = [
  {
    href: "/ops",
    label: "Dashboard",
    icon: "LayoutDashboard",
    roles: [SYS_ADMIN, SERVICE_DESK, OPS_SITE_MANAGER, OPS_SITE_LEAD, OPS_FRONT_OFFICE_SECURITY, CS_TEAM, OPS_VENDOR],
  },
  {
    href: "/ops/visitors",
    label: "Visitor Approvals",
    icon: "Users",
    roles: [SYS_ADMIN, OPS_SITE_MANAGER, OPS_FRONT_OFFICE_SECURITY],
    group: "Front Line",
  },
  {
    href: "/ops/front-desk",
    label: "Front Desk",
    icon: "IdCard",
    roles: [SYS_ADMIN, OPS_SITE_MANAGER, OPS_FRONT_OFFICE_SECURITY],
    group: "Front Line",
  },
  {
    href: "/ops/deliveries",
    label: "Deliveries",
    icon: "Truck",
    roles: [SYS_ADMIN, OPS_SITE_MANAGER, OPS_FRONT_OFFICE_SECURITY],
    group: "Front Line",
  },
  {
    href: "/ops/aal",
    label: "Authorized Access List",
    icon: "IdCard",
    roles: [SYS_ADMIN, OPS_SITE_MANAGER, OPS_FRONT_OFFICE_SECURITY],
    group: "Front Line",
  },
  {
    href: "/ops/admin/blacklist",
    label: "Blacklist",
    icon: "ShieldAlert",
    roles: [SYS_ADMIN, OPS_SITE_MANAGER, OPS_FRONT_OFFICE_SECURITY],
    group: "Front Line",
  },
  {
    href: "/ops/incidents",
    label: "Incidents",
    icon: "Siren",
    roles: [SYS_ADMIN, SERVICE_DESK, OPS_SITE_MANAGER, OPS_SITE_LEAD],
    group: "Operations",
  },
  {
    href: "/ops/maintenance",
    label: "Maintenance",
    icon: "CalendarClock",
    roles: [SYS_ADMIN, SERVICE_DESK, OPS_SITE_MANAGER, OPS_SITE_LEAD],
    group: "Operations",
  },
  {
    href: "/ops/service-requests",
    label: "Service Requests",
    icon: "Wrench",
    roles: [SYS_ADMIN, SERVICE_DESK, OPS_SITE_MANAGER, OPS_SITE_LEAD, CS_TEAM, OPS_VENDOR],
    group: "Operations",
  },
  {
    href: "/ops/telemetry",
    label: "Telemetry (BMS)",
    icon: "Gauge",
    roles: [SYS_ADMIN, OPS_SITE_MANAGER, OPS_SITE_LEAD],
    group: "Operations",
  },
  {
    href: "/ops/documents",
    label: "Download Center",
    icon: "FolderDown",
    roles: [SYS_ADMIN, OPS_SITE_MANAGER, CS_TEAM],
    group: "Business",
  },
  { href: "/ops/billing", label: "Billing", icon: "Receipt", roles: [SYS_ADMIN, CS_TEAM], group: "Business" },
  {
    href: "/ops/cs-performance",
    label: "CS Performance",
    icon: "Trophy",
    roles: [SYS_ADMIN, CS_TEAM, OPS_SITE_MANAGER],
    group: "Business",
  },
  { href: "/ops/admin", label: "Admin Settings", icon: "Settings", roles: [SYS_ADMIN], group: "Administration" },
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
