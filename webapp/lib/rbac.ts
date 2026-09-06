import { Role } from "@/lib/generated/prisma/client";

/**
 * Role groups per docs/prd-v4.md Section 8, plus PROVIDER_ADMIN (docs/prd-v5.md
 * Section 1's open question, resolved in favor of a real role rather than
 * overloading provider-ops with org/site/user setup rights).
 */
export const CUSTOMER_ROLES = [Role.CUSTOMER_GLOBAL, Role.CUSTOMER_SITE] as const;
export const PROVIDER_ROLES = [
  Role.PROVIDER_ADMIN,
  Role.PROVIDER_CS,
  Role.PROVIDER_CS_MANAGER,
  Role.PROVIDER_OPS,
  Role.PROVIDER_SECURITY,
  Role.PROVIDER_TECHNICIAN,
] as const;

export function isCustomer(role: Role): boolean {
  return (CUSTOMER_ROLES as readonly Role[]).includes(role);
}

export function isProvider(role: Role): boolean {
  return (PROVIDER_ROLES as readonly Role[]).includes(role);
}

/** Sees a roll-up across every site enrollment on the enterprise account (v3 Section 4). */
export function isGlobalAdmin(role: Role): boolean {
  return role === Role.CUSTOMER_GLOBAL;
}

/** Provider-side setup: orgs/regions/facilities/buildings/site enrollments/users (v5 Section 1). */
export function canManageProviderSetup(role: Role): boolean {
  return role === Role.PROVIDER_ADMIN;
}

/** Approve/deny visitors, check in/out (v2). */
export function canManageVisitors(role: Role): boolean {
  return ([Role.PROVIDER_ADMIN, Role.PROVIDER_SECURITY, Role.PROVIDER_OPS] as Role[]).includes(role);
}

/** Publish incidents/maintenance windows (manual adapter, v2 Section 8). */
export function canPublishIncidents(role: Role): boolean {
  return ([Role.PROVIDER_ADMIN, Role.PROVIDER_OPS] as Role[]).includes(role);
}

/** Publish documents to the Download Center (v2). */
export function canPublishDocuments(role: Role): boolean {
  return ([Role.PROVIDER_ADMIN, Role.PROVIDER_CS, Role.PROVIDER_CS_MANAGER] as Role[]).includes(role);
}

/** Triage the ticket queue across accounts/sites (v2). */
export function canTriageTickets(role: Role): boolean {
  return ([Role.PROVIDER_ADMIN, Role.PROVIDER_CS, Role.PROVIDER_CS_MANAGER, Role.PROVIDER_OPS] as Role[]).includes(role);
}

/** Accept/assign Remote Hands requests (v4 Section 6). */
export function canAssignRemoteHands(role: Role): boolean {
  return ([Role.PROVIDER_ADMIN, Role.PROVIDER_OPS] as Role[]).includes(role);
}

/** Start/Complete a Remote Hands task — the assigned technician, checked per-task, not just by role. */
export function canFulfillRemoteHands(role: Role): boolean {
  return ([Role.PROVIDER_ADMIN, Role.PROVIDER_OPS, Role.PROVIDER_TECHNICIAN] as Role[]).includes(role);
}

/** Log engagement touchpoints (v3 Section 5 — "all CS staff"). */
export function canLogEngagement(role: Role): boolean {
  return ([Role.PROVIDER_ADMIN, Role.PROVIDER_CS, Role.PROVIDER_CS_MANAGER] as Role[]).includes(role);
}

/** Team Performance KPI view — managers only (v3 Section 5). */
export function canViewTeamPerformance(role: Role): boolean {
  return ([Role.PROVIDER_ADMIN, Role.PROVIDER_CS_MANAGER] as Role[]).includes(role);
}

/** Edit billable minutes before invoicing (v4 Section 6). */
export function canEditBillableMinutes(role: Role): boolean {
  return ([Role.PROVIDER_ADMIN, Role.PROVIDER_CS_MANAGER, Role.PROVIDER_OPS] as Role[]).includes(role);
}

export class ForbiddenError extends Error {
  constructor(message = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export function assert(condition: unknown, message = "Forbidden"): asserts condition {
  if (!condition) throw new ForbiddenError(message);
}
