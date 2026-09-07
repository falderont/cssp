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
  | "Briefcase";

export type NavItem = {
  href: string;
  label: string;
  icon: IconKey;
  roles: Role[];
  // Sidebar groups consecutive items sharing a section under one header —
  // keep items for the same section contiguous in the arrays below.
  section: string;
};

const { TENANT_GLOBAL_ADMIN, TENANT_SITE_LEAD, TENANT_BILLING, TENANT_TECH_USER } = ROLES;
const { SYS_ADMIN, SERVICE_DESK, OPS_SITE_MANAGER, OPS_SITE_LEAD, OPS_FRONT_OFFICE_SECURITY, CS_TEAM, OPS_VENDOR } = ROLES;

export const PORTAL_NAV: NavItem[] = [
  {
    href: "/portal",
    label: "Dashboard",
    icon: "LayoutDashboard",
    section: "Overview",
    roles: [TENANT_GLOBAL_ADMIN, TENANT_SITE_LEAD, TENANT_BILLING, TENANT_TECH_USER],
  },
  { href: "/portal/visitors", label: "Visitors", icon: "Users", section: "Day-to-day", roles: [TENANT_GLOBAL_ADMIN, TENANT_SITE_LEAD, TENANT_TECH_USER] },
  { href: "/portal/deliveries", label: "Deliveries", icon: "Truck", section: "Day-to-day", roles: [TENANT_GLOBAL_ADMIN, TENANT_SITE_LEAD, TENANT_TECH_USER] },
  { href: "/portal/aal", label: "Authorized Access List", icon: "IdCard", section: "Day-to-day", roles: [TENANT_GLOBAL_ADMIN, TENANT_SITE_LEAD] },
  { href: "/portal/incidents", label: "Incidents", icon: "Siren", section: "Day-to-day", roles: [TENANT_GLOBAL_ADMIN, TENANT_SITE_LEAD, TENANT_TECH_USER] },
  {
    href: "/portal/maintenance",
    label: "Maintenance",
    icon: "CalendarClock",
    section: "Day-to-day",
    roles: [TENANT_GLOBAL_ADMIN, TENANT_SITE_LEAD, TENANT_TECH_USER],
  },
  {
    href: "/portal/service-requests",
    label: "Service Requests",
    icon: "Wrench",
    section: "Day-to-day",
    roles: [TENANT_GLOBAL_ADMIN, TENANT_SITE_LEAD, TENANT_TECH_USER],
  },
  {
    href: "/portal/telemetry",
    label: "Telemetry (BMS)",
    icon: "Gauge",
    section: "Day-to-day",
    roles: [TENANT_GLOBAL_ADMIN, TENANT_SITE_LEAD, TENANT_TECH_USER],
  },
  {
    href: "/portal/documents",
    label: "Download Center",
    icon: "FolderDown",
    section: "Reporting",
    roles: [TENANT_GLOBAL_ADMIN, TENANT_SITE_LEAD, TENANT_BILLING, TENANT_TECH_USER],
  },
  { href: "/portal/reports", label: "Reports", icon: "FileBarChart", section: "Reporting", roles: [TENANT_GLOBAL_ADMIN] },
  { href: "/portal/billing", label: "Billing", icon: "Receipt", section: "Reporting", roles: [TENANT_GLOBAL_ADMIN, TENANT_BILLING] },
  { href: "/portal/branding", label: "Branding", icon: "Palette", section: "Account administration", roles: [TENANT_GLOBAL_ADMIN] },
  { href: "/portal/settings", label: "Team & Settings", icon: "Settings", section: "Account administration", roles: [TENANT_GLOBAL_ADMIN] },
];

export const OPS_NAV: NavItem[] = [
  {
    href: "/ops",
    label: "Dashboard",
    icon: "LayoutDashboard",
    section: "Overview",
    roles: [SYS_ADMIN, SERVICE_DESK, OPS_SITE_MANAGER, OPS_SITE_LEAD, OPS_FRONT_OFFICE_SECURITY, CS_TEAM, OPS_VENDOR],
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
  { href: "/ops/admin", label: "Global Overview", icon: "Globe2", section: "Global administration", roles: [SYS_ADMIN] },
  { href: "/ops/admin/facilities", label: "Site Management", icon: "Building2", section: "Global administration", roles: [SYS_ADMIN, SERVICE_DESK] },
  {
    href: "/ops/admin/area-change-requests",
    label: "Area Change Requests",
    icon: "Ticket",
    section: "Global administration",
    roles: [SYS_ADMIN, SERVICE_DESK, OPS_SITE_MANAGER, OPS_SITE_LEAD, OPS_FRONT_OFFICE_SECURITY, CS_TEAM, OPS_VENDOR],
  },
  { href: "/ops/admin/accounts", label: "Tenant Accounts", icon: "Briefcase", section: "Global administration", roles: [SYS_ADMIN] },
  { href: "/ops/admin/teams", label: "Teams", icon: "UsersRound", section: "Global administration", roles: [SYS_ADMIN] },
  { href: "/ops/admin/users", label: "Users", icon: "Users", section: "Global administration", roles: [SYS_ADMIN] },

  {
    href: "/ops/visitors",
    label: "Visitor Approvals",
    icon: "Users",
    section: "Front line",
    roles: [SYS_ADMIN, OPS_SITE_MANAGER, OPS_FRONT_OFFICE_SECURITY],
  },
  { href: "/ops/front-desk", label: "Front Desk", icon: "IdCard", section: "Front line", roles: [SYS_ADMIN, OPS_SITE_MANAGER, OPS_FRONT_OFFICE_SECURITY] },
  {
    href: "/ops/deliveries",
    label: "Deliveries",
    icon: "Truck",
    section: "Front line",
    roles: [SYS_ADMIN, OPS_SITE_MANAGER, OPS_FRONT_OFFICE_SECURITY],
  },
  {
    href: "/ops/aal",
    label: "Authorized Access List",
    icon: "IdCard",
    section: "Front line",
    roles: [SYS_ADMIN, OPS_SITE_MANAGER, OPS_FRONT_OFFICE_SECURITY],
  },
  {
    href: "/ops/admin/blacklist",
    label: "Blacklist",
    icon: "ShieldAlert",
    section: "Front line",
    roles: [SYS_ADMIN, OPS_SITE_MANAGER, OPS_FRONT_OFFICE_SECURITY],
  },

  { href: "/ops/incidents", label: "Incidents", icon: "Siren", section: "Service delivery", roles: [SYS_ADMIN, SERVICE_DESK, OPS_SITE_MANAGER, OPS_SITE_LEAD] },
  {
    href: "/ops/maintenance",
    label: "Maintenance",
    icon: "CalendarClock",
    section: "Service delivery",
    roles: [SYS_ADMIN, SERVICE_DESK, OPS_SITE_MANAGER, OPS_SITE_LEAD],
  },
  {
    href: "/ops/service-requests",
    label: "Service Requests",
    icon: "Wrench",
    section: "Service delivery",
    roles: [SYS_ADMIN, SERVICE_DESK, OPS_SITE_MANAGER, OPS_SITE_LEAD, CS_TEAM, OPS_VENDOR],
  },
  { href: "/ops/telemetry", label: "Telemetry (BMS)", icon: "Gauge", section: "Service delivery", roles: [SYS_ADMIN, OPS_SITE_MANAGER, OPS_SITE_LEAD] },

  {
    href: "/ops/documents",
    label: "Download Center",
    icon: "FolderDown",
    section: "Reporting & accounts",
    roles: [SYS_ADMIN, OPS_SITE_MANAGER, CS_TEAM],
  },
  { href: "/ops/billing", label: "Billing", icon: "Receipt", section: "Reporting & accounts", roles: [SYS_ADMIN, CS_TEAM] },
  {
    href: "/ops/cs-performance",
    label: "CS Performance",
    icon: "Trophy",
    section: "Reporting & accounts",
    roles: [SYS_ADMIN, CS_TEAM, OPS_SITE_MANAGER],
  },
];

export function navForRole(nav: NavItem[], role: string): NavItem[] {
  return nav.filter((item) => (item.roles as string[]).includes(role));
}
