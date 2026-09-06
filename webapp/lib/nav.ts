import { Role } from "@/lib/generated/prisma/client";
import {
  canAssignRemoteHands,
  canFulfillRemoteHands,
  canLogEngagement,
  canManageProviderSetup,
  canManageVisitors,
  canTriageTickets,
  canViewTeamPerformance,
} from "@/lib/rbac";

export type NavItem = { href: string; label: string; show?: (role: Role) => boolean };

export const PORTAL_NAV: NavItem[] = [
  { href: "/portal/dashboard", label: "Dashboard" },
  { href: "/portal/visitors", label: "Visitors" },
  { href: "/portal/incidents", label: "Incidents & Maintenance" },
  { href: "/portal/documents", label: "Download Center" },
  { href: "/portal/tickets", label: "Tickets" },
  { href: "/portal/remote-hands", label: "Remote / Smart Hands" },
  { href: "/portal/billing", label: "Billing" },
  { href: "/portal/bms", label: "BMS Telemetry" },
];

export const CONSOLE_NAV: NavItem[] = [
  { href: "/console/dashboard", label: "Dashboard" },
  { href: "/console/visitors", label: "Visitor Approvals", show: canManageVisitors },
  { href: "/console/incidents", label: "Incidents & Maintenance" },
  { href: "/console/documents", label: "Download Center" },
  { href: "/console/tickets", label: "Ticket Queue", show: canTriageTickets },
  {
    href: "/console/remote-hands",
    label: "Remote Hands Queue",
    show: (role) => canAssignRemoteHands(role) || canFulfillRemoteHands(role),
  },
  { href: "/console/engagement", label: "My Engagement", show: canLogEngagement },
  { href: "/console/performance", label: "Team Performance", show: canViewTeamPerformance },
  { href: "/console/admin", label: "Provider Setup", show: canManageProviderSetup },
];

export function ROLE_LABEL(role: Role): string {
  return {
    CUSTOMER_GLOBAL: "Global Admin",
    CUSTOMER_SITE: "Site Contact",
    PROVIDER_ADMIN: "Provider Admin",
    PROVIDER_CS: "Customer Success",
    PROVIDER_CS_MANAGER: "CS Manager",
    PROVIDER_OPS: "Ops / NOC",
    PROVIDER_SECURITY: "Security",
    PROVIDER_TECHNICIAN: "Technician",
  }[role];
}
