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
  | "ShieldAlert";

export type NavItem = {
  href: string;
  label: string;
  icon: IconKey;
  roles: Role[];
};

export const PORTAL_NAV: NavItem[] = [
  { href: "/portal", label: "Dashboard", icon: "LayoutDashboard", roles: [ROLES.CUSTOMER_ADMIN, ROLES.CUSTOMER_USER] },
  { href: "/portal/visitors", label: "Visitors", icon: "Users", roles: [ROLES.CUSTOMER_ADMIN, ROLES.CUSTOMER_USER] },
  { href: "/portal/deliveries", label: "Deliveries", icon: "Truck", roles: [ROLES.CUSTOMER_ADMIN, ROLES.CUSTOMER_USER] },
  { href: "/portal/incidents", label: "Incidents", icon: "Siren", roles: [ROLES.CUSTOMER_ADMIN, ROLES.CUSTOMER_USER] },
  {
    href: "/portal/maintenance",
    label: "Maintenance",
    icon: "CalendarClock",
    roles: [ROLES.CUSTOMER_ADMIN, ROLES.CUSTOMER_USER],
  },
  {
    href: "/portal/service-requests",
    label: "Service Requests",
    icon: "Wrench",
    roles: [ROLES.CUSTOMER_ADMIN, ROLES.CUSTOMER_USER],
  },
  { href: "/portal/telemetry", label: "Telemetry (BMS)", icon: "Gauge", roles: [ROLES.CUSTOMER_ADMIN, ROLES.CUSTOMER_USER] },
  {
    href: "/portal/documents",
    label: "Download Center",
    icon: "FolderDown",
    roles: [ROLES.CUSTOMER_ADMIN, ROLES.CUSTOMER_USER],
  },
  { href: "/portal/billing", label: "Billing", icon: "Receipt", roles: [ROLES.CUSTOMER_ADMIN, ROLES.CUSTOMER_USER] },
  { href: "/portal/settings", label: "Settings", icon: "Settings", roles: [ROLES.CUSTOMER_ADMIN] },
];

export const OPS_NAV: NavItem[] = [
  {
    href: "/ops",
    label: "Dashboard",
    icon: "LayoutDashboard",
    roles: [
      ROLES.SUPER_ADMIN,
      ROLES.PROVIDER_OPS,
      ROLES.PROVIDER_SECURITY,
      ROLES.PROVIDER_TECHNICIAN,
      ROLES.PROVIDER_CS,
      ROLES.PROVIDER_CS_MANAGER,
      ROLES.PROVIDER_FINANCE,
    ],
  },
  { href: "/ops/visitors", label: "Visitor Approvals", icon: "Users", roles: [ROLES.SUPER_ADMIN, ROLES.PROVIDER_OPS, ROLES.PROVIDER_SECURITY] },
  {
    href: "/ops/front-desk",
    label: "Front Desk",
    icon: "IdCard",
    roles: [ROLES.SUPER_ADMIN, ROLES.PROVIDER_SECURITY],
  },
  { href: "/ops/deliveries", label: "Deliveries", icon: "Truck", roles: [ROLES.SUPER_ADMIN, ROLES.PROVIDER_OPS, ROLES.PROVIDER_SECURITY] },
  {
    href: "/ops/admin/blacklist",
    label: "Blacklist",
    icon: "ShieldAlert",
    roles: [ROLES.SUPER_ADMIN, ROLES.PROVIDER_OPS, ROLES.PROVIDER_SECURITY],
  },
  { href: "/ops/incidents", label: "Incidents", icon: "Siren", roles: [ROLES.SUPER_ADMIN, ROLES.PROVIDER_OPS] },
  { href: "/ops/maintenance", label: "Maintenance", icon: "CalendarClock", roles: [ROLES.SUPER_ADMIN, ROLES.PROVIDER_OPS] },
  {
    href: "/ops/service-requests",
    label: "Service Requests",
    icon: "Wrench",
    roles: [ROLES.SUPER_ADMIN, ROLES.PROVIDER_OPS, ROLES.PROVIDER_CS, ROLES.PROVIDER_CS_MANAGER, ROLES.PROVIDER_TECHNICIAN],
  },
  { href: "/ops/telemetry", label: "Telemetry (BMS)", icon: "Gauge", roles: [ROLES.SUPER_ADMIN, ROLES.PROVIDER_OPS] },
  {
    href: "/ops/documents",
    label: "Download Center",
    icon: "FolderDown",
    roles: [ROLES.SUPER_ADMIN, ROLES.PROVIDER_OPS, ROLES.PROVIDER_CS, ROLES.PROVIDER_CS_MANAGER, ROLES.PROVIDER_FINANCE],
  },
  { href: "/ops/billing", label: "Billing", icon: "Receipt", roles: [ROLES.SUPER_ADMIN, ROLES.PROVIDER_FINANCE] },
  {
    href: "/ops/cs-performance",
    label: "CS Performance",
    icon: "Trophy",
    roles: [ROLES.SUPER_ADMIN, ROLES.PROVIDER_CS, ROLES.PROVIDER_CS_MANAGER],
  },
  { href: "/ops/admin", label: "Admin Settings", icon: "Settings", roles: [ROLES.SUPER_ADMIN] },
];

export function navForRole(nav: NavItem[], role: string): NavItem[] {
  return nav.filter((item) => (item.roles as string[]).includes(role));
}
