import { ROLES } from "./constants";

// Which tabs a role can see on a site's own management page
// (/ops/admin/facilities/[id]/...) — shared by the tab layout (to build the
// tab bar) and by every individual tab page (to gate/redirect itself, since
// each tab is its own route a role could still navigate to directly).
export function getFacilityTabAccess(role: string) {
  const isMasterDataAdmin = ([ROLES.SYS_ADMIN, ROLES.SERVICE_DESK] as string[]).includes(role);
  const canManageDocks = ([ROLES.SYS_ADMIN, ROLES.OPS_BUILDING_MANAGER] as string[]).includes(role);
  const canViewAal = ([ROLES.SYS_ADMIN, ROLES.OPS_SITE_MANAGER, ROLES.OPS_FRONT_OFFICE_SECURITY] as string[]).includes(role);
  const canDecideAal = ([ROLES.SYS_ADMIN, ROLES.OPS_SITE_MANAGER] as string[]).includes(role);
  // Same role set as the old "Front line" nav group (Visitor Approvals /
  // Front Desk / Deliveries).
  const canViewFrontLine = canViewAal;
  // Same role set as the old "Service delivery" nav group (Incidents /
  // Maintenance / Service Requests).
  const canViewServiceDelivery = ([ROLES.SYS_ADMIN, ROLES.SERVICE_DESK, ROLES.OPS_SITE_MANAGER, ROLES.OPS_SITE_LEAD] as string[]).includes(
    role
  );
  // Telemetry specifically excludes Service Desk — BMS config isn't a
  // triage/intake concern the way Incidents/Maintenance/Service Requests are.
  const canViewTelemetry = ([ROLES.SYS_ADMIN, ROLES.OPS_SITE_MANAGER, ROLES.OPS_SITE_LEAD] as string[]).includes(role);
  const canViewIntegrations = ([ROLES.SYS_ADMIN, ROLES.OPS_SITE_MANAGER] as string[]).includes(role);
  const canViewDocuments = ([ROLES.SYS_ADMIN, ROLES.OPS_SITE_MANAGER] as string[]).includes(role);

  return {
    isMasterDataAdmin,
    canManageDocks,
    canViewAal,
    canDecideAal,
    canViewFrontLine,
    canViewServiceDelivery,
    canViewTelemetry,
    canViewIntegrations,
    canViewDocuments,
  };
}

// The first tab (in tab-bar order) this role can actually use — where a
// role with no Overview access should land instead of a redirect loop.
export function firstFacilityTabPath(facilityId: string, role: string): string {
  const access = getFacilityTabAccess(role);
  const base = `/ops/admin/facilities/${facilityId}`;
  if (access.isMasterDataAdmin) return base;
  if (access.canViewFrontLine) return `${base}/front-line`;
  if (access.canViewServiceDelivery) return `${base}/service-delivery`;
  if (access.canViewAal) return `${base}/aal`;
  if (access.canManageDocks) return `${base}/loading-docks`;
  if (access.canViewIntegrations) return `${base}/integrations`;
  if (access.canViewDocuments) return `${base}/documents`;
  return "/ops";
}
