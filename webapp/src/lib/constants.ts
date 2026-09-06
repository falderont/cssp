// Central place for the string "enums" the SQLite schema stores as plain
// strings (see prisma/schema.prisma header note).

// Persona model — two sides of the house:
//  - Tenant/customer personas: scoped to one EnterpriseAccount.
//  - Internal/provider personas: staff of the colocation provider.
export const ROLES = {
  // --- Tenant / customer personas ---------------------------------------
  TENANT_GLOBAL_ADMIN: "TENANT_GLOBAL_ADMIN", // full control of the account, every site
  TENANT_SITE_LEAD: "TENANT_SITE_LEAD", // operational lead for one enrolled site
  TENANT_BILLING: "TENANT_BILLING", // billing/invoices + contract documents only
  TENANT_TECH_USER: "TENANT_TECH_USER", // day-to-day: visitors, service requests, deliveries

  // --- Internal / provider personas -------------------------------------
  SYS_ADMIN: "SYS_ADMIN", // global system administrator — full platform control
  SERVICE_DESK: "SERVICE_DESK", // first point of contact, intake & triage across all sites
  OPS_SITE_MANAGER: "OPS_SITE_MANAGER", // manages one facility end-to-end
  OPS_SITE_LEAD: "OPS_SITE_LEAD", // hands-on site supervisor, executes assigned work
  OPS_FRONT_OFFICE_SECURITY: "OPS_FRONT_OFFICE_SECURITY", // reception/guard house/badge desk
  CS_TEAM: "CS_TEAM", // customer success — scoped via csScope (Corporate/Region/Site/Billing)
  OPS_VENDOR: "OPS_VENDOR", // external contractor, scoped to assigned tasks only
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const TENANT_ROLES: Role[] = [
  ROLES.TENANT_GLOBAL_ADMIN,
  ROLES.TENANT_SITE_LEAD,
  ROLES.TENANT_BILLING,
  ROLES.TENANT_TECH_USER,
];

export const INTERNAL_ROLES: Role[] = [
  ROLES.SYS_ADMIN,
  ROLES.SERVICE_DESK,
  ROLES.OPS_SITE_MANAGER,
  ROLES.OPS_SITE_LEAD,
  ROLES.OPS_FRONT_OFFICE_SECURITY,
  ROLES.CS_TEAM,
  ROLES.OPS_VENDOR,
];

// Kept as an alias — most of the codebase refers to tenant/customer roles as
// "customer roles" (customer-facing portal, requireCustomerUser(), etc.).
export const CUSTOMER_ROLES: Role[] = TENANT_ROLES;

export function isInternalRole(role: string): boolean {
  return (INTERNAL_ROLES as string[]).includes(role);
}

export function isCustomerRole(role: string): boolean {
  return (CUSTOMER_ROLES as string[]).includes(role);
}

// Roles whose day-to-day work is naturally pinned to one facility — the
// admin "restrict to one site" control is meaningful (and, for these ops
// roles, expected) for them. Global/account-wide roles ignore it even if set.
export const SITE_SCOPABLE_ROLES: Role[] = [
  ROLES.TENANT_SITE_LEAD,
  ROLES.TENANT_TECH_USER,
  ROLES.OPS_SITE_MANAGER,
  ROLES.OPS_SITE_LEAD,
  ROLES.OPS_FRONT_OFFICE_SECURITY,
  ROLES.OPS_VENDOR,
];

export function isSiteScopableRole(role: string): boolean {
  return (SITE_SCOPABLE_ROLES as string[]).includes(role);
}

export const ROLE_LABELS: Record<Role, string> = {
  TENANT_GLOBAL_ADMIN: "Global Admin",
  TENANT_SITE_LEAD: "Site Lead",
  TENANT_BILLING: "Billing",
  TENANT_TECH_USER: "Tech User",
  SYS_ADMIN: "Global Sys Admin",
  SERVICE_DESK: "Service Desk",
  OPS_SITE_MANAGER: "Ops — Site Manager",
  OPS_SITE_LEAD: "Ops — Site Lead",
  OPS_FRONT_OFFICE_SECURITY: "Ops — Front Office & Security",
  CS_TEAM: "Customer Success Team",
  OPS_VENDOR: "Ops — External Vendor",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  TENANT_GLOBAL_ADMIN: "Full control of the account across every enrolled site — users, AAL, reports, billing, branding.",
  TENANT_SITE_LEAD: "Operational lead for one enrolled site — approvals and day-to-day requests at that site.",
  TENANT_BILLING: "Invoices, contracts and billing documents only.",
  TENANT_TECH_USER: "Day-to-day requester — visitors, service requests, deliveries.",
  SYS_ADMIN: "Full platform control — users, tenants, sites, integrations, system health.",
  SERVICE_DESK: "First point of contact — intake and triage across every site.",
  OPS_SITE_MANAGER: "Manages one facility end-to-end — approvals, assignment, overrides.",
  OPS_SITE_LEAD: "Hands-on site supervisor — executes and completes assigned work.",
  OPS_FRONT_OFFICE_SECURITY: "Reception, guard house and badge desk — visitor & delivery front line.",
  CS_TEAM: "Customer success — scope determines account coverage (corporate/region/site/billing).",
  OPS_VENDOR: "External contractor — sees only the tasks assigned to them.",
};

// --- Customer Success Team scope ---------------------------------------------
// Only meaningful when role === ROLES.CS_TEAM (see User.csScope). Mirrors the
// Region -> Country -> Facility geography master data (see schema.prisma).
export const CS_SCOPES = ["Corporate", "Region", "Country", "Site", "Billing"] as const;
export type CsScope = (typeof CS_SCOPES)[number];
export const CS_SCOPE_LABELS: Record<CsScope, string> = {
  Corporate: "Corporate (all accounts, global)",
  Region: "Region (every country within it)",
  Country: "Country (every site within it)",
  Site: "Site",
  Billing: "Billing",
};

// --- Teams --------------------------------------------------------------------
// Global Sys Admin master data — a named roster of internal staff scoped to
// a region, a country, a single facility, or left global/company-wide.
export const TEAM_FUNCTIONS = ["Executive", "Ops", "NOC", "Security", "CustomerSuccess", "ServiceDesk", "Facilities"] as const;
export type TeamFunction = (typeof TEAM_FUNCTIONS)[number];
export const TEAM_FUNCTION_LABELS: Record<TeamFunction, string> = {
  Executive: "Executive",
  Ops: "Operations",
  NOC: "NOC / Engineering",
  Security: "Front Office & Security",
  CustomerSuccess: "Customer Success",
  ServiceDesk: "Service Desk",
  Facilities: "Facilities & Maintenance",
};

// --- Visitor management ------------------------------------------------------

export const VISITOR_STATUSES = ["Pending", "Blacklisted", "Approved", "Denied", "CheckedIn", "CheckedOut"] as const;

export const DELIVERY_STATUSES = ["Expected", "Arrived", "Received", "Rejected"] as const;

// --- Incidents ---------------------------------------------------------------

export const INCIDENT_SEVERITIES = ["P1", "P2", "P3", "P4"] as const;
export const INCIDENT_STATUSES = ["Investigating", "Identified", "Monitoring", "Resolved"] as const;
export const INCIDENT_CATEGORIES = ["Electrical", "Mechanical", "Building", "Fire", "Security", "Network", "Other"] as const;
export const INCIDENT_IMPACTED_SERVICES = [
  "Power",
  "Cooling",
  "Network",
  "Physical Security",
  "Fire Suppression",
  "Access Control",
  "BMS/DCIM",
] as const;

export function parseImpactedServices(json: string): string[] {
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

// --- Maintenance ---------------------------------------------------------------

export const MAINTENANCE_TYPES = ["Planned", "Emergency"] as const;
export const MAINTENANCE_IMPACTS = ["NoImpact", "RedundancyReduced", "FullOutage"] as const;
export const MAINTENANCE_STATUSES = ["Scheduled", "InProgress", "Completed", "Cancelled"] as const;

// --- Service Requests (Complaint/RFI/general requests + Remote/Smart Hands) --
// Remote/Smart Hands is a category here, not a separate module — see
// prisma/schema.prisma's ServiceRequest model comment.

export const SERVICE_REQUEST_CATEGORIES = [
  "RemoteHands",
  "SiteWalkEscort",
  "GeneralMeeting",
  "RFI",
  "Complaint",
  "Other",
] as const;
export const SERVICE_REQUEST_CATEGORY_LABELS: Record<string, string> = {
  RemoteHands: "Remote / Smart Hands",
  SiteWalkEscort: "Site Walk / Escort Request",
  GeneralMeeting: "General Meeting",
  RFI: "Request for Information (RFI)",
  Complaint: "Complaint",
  Other: "Other",
};
// Categories whose main value is a scheduled date/time (shown on the
// calendar, exportable to Outlook) rather than a submit-and-track ticket.
export const SCHEDULABLE_SERVICE_REQUEST_CATEGORIES = ["SiteWalkEscort", "GeneralMeeting", "RemoteHands"];

export const SERVICE_REQUEST_STATUSES = ["Submitted", "Accepted", "InProgress", "Done", "Cancelled"] as const;
export const SERVICE_REQUEST_PRIORITIES = ["Low", "Normal", "High", "Urgent"] as const;

export const REMOTE_HANDS_TASK_TYPES = [
  "PowerCycle",
  "VisualInspection",
  "CablePatch",
  "MountUnmountHardware",
  "KVMConsoleAccess",
  "Other",
] as const;
export const REMOTE_HANDS_TASK_LABELS: Record<string, string> = {
  PowerCycle: "Power Cycle",
  VisualInspection: "Visual Inspection",
  CablePatch: "Cable Patch",
  MountUnmountHardware: "Mount / Unmount Hardware",
  KVMConsoleAccess: "KVM Console Access",
  Other: "Other",
};

// --- Download center -----------------------------------------------------------

export const DOCUMENT_CATEGORIES = [
  "SiteIntroduction",
  "TermsConditions",
  "Contract",
  "SLAReport",
  "Invoice",
  "Compliance",
  "Other",
] as const;
export const DOCUMENT_CATEGORY_LABELS: Record<string, string> = {
  SiteIntroduction: "Site Introduction",
  TermsConditions: "Terms & Conditions",
  Contract: "Contract / MSA",
  SLAReport: "SLA Report",
  Invoice: "Invoice",
  Compliance: "Compliance",
  Other: "Other",
};

// --- Billing --------------------------------------------------------------------

export const INVOICE_STATUSES = ["Draft", "Sent", "Paid", "Overdue"] as const;
export const INVOICE_LINE_CATEGORIES = ["Space", "Power", "CrossConnect", "RemoteHands", "Other"] as const;

// --- CS engagement ---------------------------------------------------------------

export const ENGAGEMENT_TYPES = ["call", "email", "meeting", "site_visit", "service_request"] as const;

// --- Telemetry ---------------------------------------------------------------------

export const TELEMETRY_METRICS = ["TEMP_C", "HUMIDITY_PCT", "POWER_KW", "PUE"] as const;
export const TELEMETRY_METRIC_LABELS: Record<string, string> = {
  TEMP_C: "Temperature (°C)",
  HUMIDITY_PCT: "Humidity (%)",
  POWER_KW: "Power Draw (kW)",
  PUE: "PUE",
};

export function summarizeVisitorStatuses(statuses: string[]): string {
  if (statuses.length === 0) return "Pending";
  if (statuses.some((s) => s === "Blacklisted")) return "Blacklisted";
  if (statuses.every((s) => s === "CheckedOut")) return "CheckedOut";
  if (statuses.some((s) => s === "CheckedIn")) return "CheckedIn";
  if (statuses.every((s) => s === "Denied")) return "Denied";
  if (statuses.every((s) => s === "Approved" || s === "CheckedIn" || s === "CheckedOut")) return "Approved";
  if (statuses.some((s) => s === "Pending")) return "Pending";
  return "Mixed";
}

export function statusBadgeTone(status: string): "green" | "amber" | "red" | "slate" | "blue" {
  const positive = [
    "Approved",
    "CheckedIn",
    "CheckedOut",
    "Resolved",
    "Completed",
    "Done",
    "Paid",
    "Active",
    "Connected",
    "Synced",
    "GRANTED",
    "Received",
  ];
  const warning = [
    "Pending",
    "Investigating",
    "Identified",
    "Monitoring",
    "Scheduled",
    "InProgress",
    "Submitted",
    "Sent",
    "Accepted",
    "Expected",
    "Arrived",
    "PendingApproval",
    "NotConfigured",
  ];
  const negative = ["Denied", "Cancelled", "Overdue", "Error", "Failed", "Suspended", "Blacklisted", "Rejected", "Revoked", "Expired", "Disabled"];
  if (positive.includes(status)) return "green";
  if (warning.includes(status)) return "amber";
  if (negative.includes(status)) return "red";
  return "slate";
}

// --- Authorized Access List (AAL) — permanent site access, distinct from a
// one-off dated visitor request. Requested by the tenant, approved by ops. --

export const AAL_ACCESS_LEVELS = ["Standard", "Escorted", "FullAccess"] as const;
export const AAL_ACCESS_LEVEL_LABELS: Record<string, string> = {
  Standard: "Standard (business hours)",
  Escorted: "Escorted only",
  FullAccess: "Full access (24/7)",
};

export const AAL_STATUSES = ["PendingApproval", "Active", "Rejected", "Revoked"] as const;

export function isAalExpired(entry: { status: string; validUntil: Date | string | null }): boolean {
  if (entry.status !== "Active" || !entry.validUntil) return false;
  return new Date(entry.validUntil).getTime() < Date.now();
}

// --- System integrations (Global Sys Admin) ----------------------------------

export const SYSTEM_INTEGRATION_STATUSES = ["NotConfigured", "Connected", "Error", "Disabled"] as const;

export const SYSTEM_INTEGRATION_CATALOG: { key: string; name: string; description: string }[] = [
  { key: "ACS", name: "Access Control System (ACS)", description: "Campus badge/door access sync for visitor management." },
  { key: "DCIM", name: "DCIM", description: "Data Center Infrastructure Management — incident reports, asset data." },
  { key: "BMS", name: "Building Management System (BMS)", description: "Telemetry mirror — temperature, humidity, power, PUE." },
  { key: "SSO", name: "Single Sign-On (SSO)", description: "Enterprise identity provider for staff and tenant login." },
  { key: "EMAIL", name: "Email / SMTP", description: "Outbound notification and invitation email delivery." },
];

// --- Reports (Tenant Global Admin) -------------------------------------------

export const REPORT_TYPES = ["VisitorActivity", "IncidentSummary", "ServiceRequestSummary", "BillingSummary", "MaintenanceSummary"] as const;
export const REPORT_TYPE_LABELS: Record<string, string> = {
  VisitorActivity: "Visitor Activity",
  IncidentSummary: "Incident Summary",
  ServiceRequestSummary: "Service Request Summary",
  BillingSummary: "Billing Summary",
  MaintenanceSummary: "Maintenance Summary",
};

// --- Global preferences -------------------------------------------------------

export const CURRENCIES = ["USD", "EUR", "SGD", "IDR", "GBP"] as const;
export const TIMEZONES = ["UTC", "Asia/Jakarta", "Asia/Singapore", "America/New_York", "Europe/London"] as const;
