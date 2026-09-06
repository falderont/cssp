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

export type NavItem = {
  href: string;
  label: string;
  icon: IconKey;
  roles: Role[];
};

const { TENANT_GLOBAL_ADMIN, TENANT_SITE_LEAD, TENANT_BILLING, TENANT_TECH_USER } = ROLES;
const { SYS_ADMIN, SERVICE_DESK, OPS_SITE_MANAGER, OPS_SITE_LEAD, OPS_FRONT_OFFICE_SECURITY, CS_TEAM, OPS_VENDOR } = ROLES;

export const PORTAL_NAV: NavItem[] = [
  {
    href: "/portal",
    label: "Dashboard",
    icon: "LayoutDashboard",
    roles: [TENANT_GLOBAL_ADMIN, TENANT_SITE_LEAD, TENANT_BILLING, TENANT_TECH_USER],
  },
  { href: "/portal/visitors", label: "Visitors", icon: "Users", roles: [TENANT_GLOBAL_ADMIN, TENANT_SITE_LEAD, TENANT_TECH_USER] },
  { href: "/portal/deliveries", label: "Deliveries", icon: "Truck", roles: [TENANT_GLOBAL_ADMIN, TENANT_SITE_LEAD, TENANT_TECH_USER] },
  { href: "/portal/aal", label: "Authorized Access List", icon: "IdCard", roles: [TENANT_GLOBAL_ADMIN, TENANT_SITE_LEAD] },
  { href: "/portal/incidents", label: "Incidents", icon: "Siren", roles: [TENANT_GLOBAL_ADMIN, TENANT_SITE_LEAD, TENANT_TECH_USER] },
  {
    href: "/portal/maintenance",
    label: "Maintenance",
    icon: "CalendarClock",
    roles: [TENANT_GLOBAL_ADMIN, TENANT_SITE_LEAD, TENANT_TECH_USER],
  },
  {
    href: "/portal/service-requests",
    label: "Service Requests",
    icon: "Wrench",
    roles: [TENANT_GLOBAL_ADMIN, TENANT_SITE_LEAD, TENANT_TECH_USER],
  },
  {
    href: "/portal/telemetry",
    label: "Telemetry (BMS)",
    icon: "Gauge",
    roles: [TENANT_GLOBAL_ADMIN, TENANT_SITE_LEAD, TENANT_TECH_USER],
  },
  {
    href: "/portal/documents",
    label: "Download Center",
    icon: "FolderDown",
    roles: [TENANT_GLOBAL_ADMIN, TENANT_SITE_LEAD, TENANT_BILLING, TENANT_TECH_USER],
  },
  { href: "/portal/reports", label: "Reports", icon: "FileBarChart", roles: [TENANT_GLOBAL_ADMIN] },
  { href: "/portal/billing", label: "Billing", icon: "Receipt", roles: [TENANT_GLOBAL_ADMIN, TENANT_BILLING] },
  { href: "/portal/branding", label: "Branding", icon: "Palette", roles: [TENANT_GLOBAL_ADMIN] },
  { href: "/portal/settings", label: "Team & Settings", icon: "Settings", roles: [TENANT_GLOBAL_ADMIN] },
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
  },
  { href: "/ops/front-desk", label: "Front Desk", icon: "IdCard", roles: [SYS_ADMIN, OPS_SITE_MANAGER, OPS_FRONT_OFFICE_SECURITY] },
  {
    href: "/ops/deliveries",
    label: "Deliveries",
    icon: "Truck",
    roles: [SYS_ADMIN, OPS_SITE_MANAGER, OPS_FRONT_OFFICE_SECURITY],
  },
  {
    href: "/ops/aal",
    label: "Authorized Access List",
    icon: "IdCard",
    roles: [SYS_ADMIN, OPS_SITE_MANAGER, OPS_FRONT_OFFICE_SECURITY],
  },
  {
    href: "/ops/admin/blacklist",
    label: "Blacklist",
    icon: "ShieldAlert",
    roles: [SYS_ADMIN, OPS_SITE_MANAGER, OPS_FRONT_OFFICE_SECURITY],
  },
  { href: "/ops/incidents", label: "Incidents", icon: "Siren", roles: [SYS_ADMIN, SERVICE_DESK, OPS_SITE_MANAGER, OPS_SITE_LEAD] },
  {
    href: "/ops/maintenance",
    label: "Maintenance",
    icon: "CalendarClock",
    roles: [SYS_ADMIN, SERVICE_DESK, OPS_SITE_MANAGER, OPS_SITE_LEAD],
  },
  {
    href: "/ops/service-requests",
    label: "Service Requests",
    icon: "Wrench",
    roles: [SYS_ADMIN, SERVICE_DESK, OPS_SITE_MANAGER, OPS_SITE_LEAD, CS_TEAM, OPS_VENDOR],
  },
  { href: "/ops/telemetry", label: "Telemetry (BMS)", icon: "Gauge", roles: [SYS_ADMIN, OPS_SITE_MANAGER, OPS_SITE_LEAD] },
  {
    href: "/ops/documents",
    label: "Download Center",
    icon: "FolderDown",
    roles: [SYS_ADMIN, OPS_SITE_MANAGER, CS_TEAM],
  },
  { href: "/ops/billing", label: "Billing", icon: "Receipt", roles: [SYS_ADMIN, CS_TEAM] },
  {
    href: "/ops/cs-performance",
    label: "CS Performance",
    icon: "Trophy",
    roles: [SYS_ADMIN, CS_TEAM, OPS_SITE_MANAGER],
  },
  { href: "/ops/admin", label: "Admin Settings", icon: "Settings", roles: [SYS_ADMIN] },
];

export function navForRole(nav: NavItem[], role: string): NavItem[] {
  return nav.filter((item) => (item.roles as string[]).includes(role));
}
