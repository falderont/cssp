// Mock data standing in for the MVP data model in PRD v4 (Organization,
// EnterpriseAccount, SiteEnrollment, Facility, User, Visitor,
// IncidentOrMaintenance, Document, Ticket, RemoteHandsTask, EngagementLog).
// In the real build this would come from the API/database, scoped by
// organization (tenant) and enterprise account, with IncidentOrMaintenance
// sourced from the provider's DCIM/CMMS via an adapter (see PRD v2 section 8)
// rather than entered here directly.

export const facilities = [
  { id: 'btm-02', name: 'BTM-02 — Batam' },
  { id: 'jkt-01', name: 'JKT-01 — Jakarta' },
  { id: 'sby-01', name: 'SBY-01 — Surabaya' },
];

export const ticketCategories = ['Complaint', 'RFI', 'Service Request'];
export const ticketStatuses = ['Submitted', 'In Progress', 'Done'];
export const documentCategories = ['SLA Report', 'Compliance', 'Invoice'];
export const visitorStatuses = ['Pending', 'Approved', 'Denied', 'Checked In', 'Checked Out'];
export const remoteHandsTaskTypes = [
  'Power Cycle',
  'Visual Inspection',
  'Cable Patch',
  'Mount/Unmount Hardware',
  'KVM Console Access',
  'Other',
];
export const remoteHandsStatuses = ['Submitted', 'Accepted', 'In Progress', 'Completed'];
export const engagementTypes = ['call', 'email', 'meeting', 'site visit'];

// The enterprise account CSSP is being demoed as, enrolled at all three
// facilities (PRD v4 section 4 — SiteEnrollment). "All sites" in the site
// switcher is the Global Admin roll-up view; picking one site is what a
// Site Contact would see by default.
export const enterpriseAccount = {
  name: 'Meridian Logistics',
  siteIds: ['btm-02', 'jkt-01', 'sby-01'],
};

export const initialVisitors = [
  {
    id: 'VIS-201',
    name: 'Andi Prasetyo',
    company: 'PT Kabel Nusantara',
    purpose: 'Cross-connect installation',
    facilityId: 'btm-02',
    account: 'Meridian Logistics',
    host: 'Dita Ayu',
    date: '2026-09-06',
    window: '10:00–11:00',
    status: 'Approved',
  },
  {
    id: 'VIS-202',
    name: 'Lina Wijaya',
    company: 'Server upgrade vendor',
    purpose: 'Hardware upgrade',
    facilityId: 'btm-02',
    account: 'Meridian Logistics',
    host: 'Dita Ayu',
    date: '2026-09-09',
    window: '14:00–16:00',
    status: 'Pending',
  },
  {
    id: 'VIS-198',
    name: 'Rudi Hartono',
    company: 'Cabling contractor',
    purpose: 'Cabling works',
    facilityId: 'jkt-01',
    account: 'Meridian Logistics',
    host: 'Dita Ayu',
    date: '2026-08-28',
    window: '09:00–12:00',
    status: 'Checked Out',
  },
  {
    id: 'VIS-205',
    name: 'Budi Santoso',
    company: 'Nusantara Cloud',
    purpose: 'Rack audit',
    facilityId: 'jkt-01',
    account: 'Nusantara Cloud',
    host: 'Rina S.',
    date: '2026-09-07',
    window: '13:00–14:00',
    status: 'Pending',
  },
];

export const initialTickets = [
  {
    id: 'TCK-3301',
    title: 'AC noise near Rack C14',
    category: 'Complaint',
    facilityId: 'btm-02',
    account: 'Meridian Logistics',
    status: 'In Progress',
    assignedTo: 'Made Wirawan',
    submitted: '2026-09-03',
    description: 'Noticeable rattling noise from the CRAC unit near C14 since this morning.',
  },
  {
    id: 'TCK-3300',
    title: 'Available rack space BTM-02 Q4',
    category: 'RFI',
    facilityId: 'btm-02',
    account: 'Meridian Logistics',
    status: 'Submitted',
    assignedTo: null,
    submitted: '2026-09-02',
    description: 'Could you confirm current available rack space and power headroom at BTM-02 for a possible Q4 expansion?',
  },
  {
    id: 'TCK-3290',
    title: 'New cross-connect to ISP carrier room',
    category: 'Service Request',
    facilityId: 'btm-02',
    account: 'Meridian Logistics',
    status: 'Done',
    assignedTo: 'Made Wirawan',
    submitted: '2026-08-29',
    description: '',
  },
  {
    id: 'TCK-3288',
    title: 'Power draw report request',
    category: 'Service Request',
    facilityId: 'jkt-01',
    account: 'Nusantara Cloud',
    status: 'In Progress',
    assignedTo: 'Rina S.',
    submitted: '2026-09-04',
    description: '',
  },
  {
    id: 'TCK-3286',
    title: 'Escalating billing discrepancy',
    category: 'Complaint',
    facilityId: 'sby-01',
    account: 'Trisula Fintech',
    status: 'Submitted',
    assignedTo: null,
    submitted: '2026-09-04',
    description: '',
  },
];

export const initialDocuments = [
  {
    id: 'DOC-501',
    title: 'August 2026 SLA & Uptime Report',
    category: 'SLA Report',
    facilityId: 'btm-02',
    account: 'Meridian Logistics',
    published: '2026-09-01',
  },
  {
    id: 'DOC-500',
    title: 'Invoice — August 2026',
    category: 'Invoice',
    facilityId: 'btm-02',
    account: 'Meridian Logistics',
    published: '2026-09-01',
  },
  {
    id: 'DOC-490',
    title: 'ISO 27001 Certificate 2026',
    category: 'Compliance',
    facilityId: null,
    account: null,
    published: '2026-01-15',
  },
  {
    id: 'DOC-475',
    title: 'TIA-942 Compliance Summary',
    category: 'Compliance',
    facilityId: 'btm-02',
    account: 'Meridian Logistics',
    published: '2026-06-10',
  },
];

export const initialIncidents = [
  {
    id: 'INC-88',
    title: 'Power distribution event',
    type: 'incident',
    facilityId: 'btm-02',
    status: 'Investigating',
    start: '2026-09-04 21:10 WIB',
    description:
      'A PDU on the B-side power feed tripped during routine load balancing. Facility is running normally on the A-side feed; no customer impact expected.',
  },
  {
    id: 'MNT-51',
    title: 'Scheduled cooling maintenance',
    type: 'maintenance',
    facilityId: 'btm-02',
    status: 'Upcoming',
    start: '2026-09-12 22:00–02:00 WIB',
    description: 'Quarterly CRAC unit servicing on Floor 2. Redundant cooling stays online throughout.',
  },
  {
    id: 'MNT-49',
    title: 'Network switch firmware update',
    type: 'maintenance',
    facilityId: 'jkt-01',
    status: 'Resolved',
    start: '2026-08-30 01:00–01:40 WIB',
    description: 'No downtime.',
  },
  {
    id: 'INC-84',
    title: 'Fire suppression system inspection',
    type: 'maintenance',
    facilityId: 'sby-01',
    status: 'Resolved',
    start: '2026-08-22 09:00–11:00 WIB',
    description: 'No downtime.',
  },
];

// New in v4 — PRD v4 section 6. task_type/asset_or_rack_ref/billable_minutes/
// completion_notes/started_at/completed_at mirror the RemoteHandsTask entity.
export const initialRemoteHandsTasks = [
  {
    id: 'RH-118',
    taskType: 'Power Cycle',
    facilityId: 'btm-02',
    assetRef: 'Rack C14 — Switch SW-C14-02',
    description: "Please power-cycle the top-of-rack switch — it's unresponsive to ping but shows link lights.",
    account: 'Meridian Logistics',
    requestedDate: '2026-09-06',
    requestedWindow: '09:00–10:00',
    status: 'In Progress',
    assignedTechnician: 'Yoga Pratama',
    startedAt: '2026-09-06 09:14',
    completedAt: null,
    billableMinutes: null,
    completionNotes: '',
    csatRating: null,
  },
  {
    id: 'RH-112',
    taskType: 'Visual Inspection',
    facilityId: 'btm-02',
    assetRef: 'Cage 7 — patch cabling',
    description: 'Routine visual check on patch cable dressing in Cage 7 ahead of next week\'s audit.',
    account: 'Meridian Logistics',
    requestedDate: '2026-08-30',
    requestedWindow: '11:00–12:00',
    status: 'Completed',
    assignedTechnician: 'Yoga Pratama',
    startedAt: '2026-08-30 11:05',
    completedAt: '2026-08-30 11:23',
    billableMinutes: 18,
    completionNotes: 'All patch cables secure, no visible wear. No action needed.',
    csatRating: null,
  },
  {
    id: 'RH-105',
    taskType: 'Mount/Unmount Hardware',
    facilityId: 'jkt-01',
    assetRef: 'Rack B08',
    description: 'Mount replacement 1U server in Rack B08, decommission the old unit.',
    account: 'Meridian Logistics',
    requestedDate: '2026-08-22',
    requestedWindow: '14:00–15:30',
    status: 'Completed',
    assignedTechnician: 'Made Wirawan',
    startedAt: '2026-08-22 14:10',
    completedAt: '2026-08-22 14:52',
    billableMinutes: 42,
    completionNotes: 'New unit racked and cabled per diagram; old unit staged for pickup.',
    csatRating: 'up',
  },
];

// New in v4 — PRD v4 section 5 (CS Engagement & Performance). Internal only;
// customers never see this. Ticket-linked entries would be auto-logged in the
// real build; here they're seeded alongside manual entries for the demo.
export const initialEngagementLogs = [
  {
    id: 'ENG-501',
    repName: 'Made Wirawan',
    type: 'call',
    account: 'Meridian Logistics',
    notes: 'Quarterly capacity review with Dita Ayu. Discussed Q4 rack expansion at BTM-02, no blockers.',
    occurredAt: '2026-09-03',
    linkedTicketId: null,
  },
  {
    id: 'ENG-500',
    repName: 'Rina Setiawan',
    type: 'ticket',
    account: 'Meridian Logistics',
    notes: 'Auto-logged from resolved ticket "AC noise near Rack C14" (Complaint).',
    occurredAt: '2026-09-03',
    linkedTicketId: 'TCK-3301',
  },
  {
    id: 'ENG-498',
    repName: 'Made Wirawan',
    type: 'email',
    account: 'Nusantara Cloud',
    notes: 'Sent August SLA report ahead of their internal audit deadline.',
    occurredAt: '2026-09-01',
    linkedTicketId: null,
  },
];

// The provider's CS team — used by Team Performance and Remote Hands
// technician assignment. isManager gates the Team Performance tab.
export const csTeam = [
  { id: 'mw', name: 'Made Wirawan', initials: 'MW', isManager: true, ticketsResolved: 18, avgFirstResponseHrs: 1.4, avgResolutionHrs: 7.5, touchpoints: 34, avgCsat: 4.8 },
  { id: 'rs', name: 'Rina Setiawan', initials: 'RS', isManager: false, ticketsResolved: 15, avgFirstResponseHrs: 2.1, avgResolutionHrs: 10.8, touchpoints: 29, avgCsat: 4.6 },
  { id: 'af', name: 'Agus Firmansyah', initials: 'AF', isManager: false, ticketsResolved: 9, avgFirstResponseHrs: 1.9, avgResolutionHrs: 8.9, touchpoints: 31, avgCsat: 4.4 },
  { id: 'yp', name: 'Yoga Pratama', initials: 'YP', isManager: false, ticketsResolved: 5, avgFirstResponseHrs: 2.6, avgResolutionHrs: 11.3, touchpoints: 18, avgCsat: 4.1 },
];

export const currentCustomerUser = {
  name: 'Dita Ayu',
  role: 'IT Infrastructure Manager',
  account: 'Meridian Logistics',
  initials: 'DA',
  // Global Admin sees the roll-up across every site enrollment (PRD v4
  // section 4); a Site Contact would default to their one site instead.
  scope: 'global-admin',
};

export const currentProviderUser = {
  name: 'Made Wirawan',
  role: 'CS Manager',
  initials: 'MW',
  isManager: true,
};
