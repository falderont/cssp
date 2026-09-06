// Central place for the string "enums" the SQLite schema stores as plain
// strings (see prisma/schema.prisma header note).

export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  PROVIDER_OPS: "PROVIDER_OPS",
  PROVIDER_SECURITY: "PROVIDER_SECURITY",
  PROVIDER_TECHNICIAN: "PROVIDER_TECHNICIAN",
  PROVIDER_CS: "PROVIDER_CS",
  PROVIDER_CS_MANAGER: "PROVIDER_CS_MANAGER",
  PROVIDER_FINANCE: "PROVIDER_FINANCE",
  CUSTOMER_ADMIN: "CUSTOMER_ADMIN",
  CUSTOMER_USER: "CUSTOMER_USER",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const INTERNAL_ROLES: Role[] = [
  ROLES.SUPER_ADMIN,
  ROLES.PROVIDER_OPS,
  ROLES.PROVIDER_SECURITY,
  ROLES.PROVIDER_TECHNICIAN,
  ROLES.PROVIDER_CS,
  ROLES.PROVIDER_CS_MANAGER,
  ROLES.PROVIDER_FINANCE,
];

export const CUSTOMER_ROLES: Role[] = [ROLES.CUSTOMER_ADMIN, ROLES.CUSTOMER_USER];

export function isInternalRole(role: string): boolean {
  return (INTERNAL_ROLES as string[]).includes(role);
}

export function isCustomerRole(role: string): boolean {
  return (CUSTOMER_ROLES as string[]).includes(role);
}

export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: "Super Admin",
  PROVIDER_OPS: "NOC / Operations (Building Service Manager)",
  PROVIDER_SECURITY: "Security / Front Desk",
  PROVIDER_TECHNICIAN: "Field Technician",
  PROVIDER_CS: "Customer Success",
  PROVIDER_CS_MANAGER: "CS Manager",
  PROVIDER_FINANCE: "Finance / Billing",
  CUSTOMER_ADMIN: "Tenant Global Admin",
  CUSTOMER_USER: "Tenant Site Contact",
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
  ];
  const negative = ["Denied", "Cancelled", "Overdue", "Error", "Failed", "Suspended", "Blacklisted", "Rejected"];
  if (positive.includes(status)) return "green";
  if (warning.includes(status)) return "amber";
  if (negative.includes(status)) return "red";
  return "slate";
}
