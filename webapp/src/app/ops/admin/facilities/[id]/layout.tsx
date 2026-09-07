import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { SiteTabs, type SiteTab } from "@/components/admin/site-tabs";
import { requireFacilityPageAccess } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getFacilityTabAccess } from "@/lib/facility-tabs";

// Everything about one site — previously scattered across a dozen global
// list pages (Loading Docks, AAL, Visitor Approvals, Front Desk,
// Deliveries, Incidents, Maintenance, Service Requests, Telemetry,
// Documents) plus this page's own long stack of cards — now lives under
// this one tabbed page. Each tab is its own route so it only fetches its
// own data; this layout fetches just the header + the counts shown as tab
// badges, and decides which tabs this viewer's role can even see.
export default async function FacilityLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireFacilityPageAccess();
  const access = getFacilityTabAccess(user.role);
  const { isMasterDataAdmin, canManageDocks, canViewAal, canViewFrontLine, canViewServiceDelivery, canViewIntegrations, canViewDocuments } =
    access;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [facility, aalPendingCount, frontLineOpenCount, serviceDeliveryOpenCount] = await Promise.all([
    prisma.facility.findUnique({
      where: { id },
      select: { id: true, name: true, code: true, city: { include: { country: { include: { region: true } } } } },
    }),
    canViewAal ? prisma.authorizedAccessEntry.count({ where: { facilityId: id, status: "PendingApproval" } }) : 0,
    canViewFrontLine
      ? Promise.all([
          prisma.visitor.count({ where: { status: "Pending", visitorRequest: { siteEnrollment: { facilityId: id } } } }),
          prisma.visitor.count({
            where: {
              status: { in: ["Approved", "CheckedIn"] },
              visitorRequest: { visitDate: { gte: startOfToday }, siteEnrollment: { facilityId: id } },
            },
          }),
          prisma.delivery.count({ where: { facilityId: id, status: { in: ["Expected", "Arrived"] } } }),
        ]).then(([a, b, c]) => a + b + c)
      : 0,
    canViewServiceDelivery
      ? Promise.all([
          prisma.incident.count({ where: { facilityId: id, status: { not: "Resolved" } } }),
          prisma.maintenanceEvent.count({ where: { facilityId: id, status: { in: ["Scheduled", "InProgress"] } } }),
          prisma.serviceRequest.count({
            where: { siteEnrollment: { facilityId: id }, status: { notIn: ["Done", "Cancelled"] } },
          }),
        ]).then(([a, b, c]) => a + b + c)
      : 0,
  ]);
  if (!facility) notFound();
  // Master-data admins can view any site; every other role stays pinned to
  // the one facility they're restricted to, when they're restricted at all.
  if (!isMasterDataAdmin && user.restrictedFacilityId && user.restrictedFacilityId !== facility.id) notFound();

  const base = `/ops/admin/facilities/${facility.id}`;
  const tabs: SiteTab[] = [
    ...(isMasterDataAdmin ? [{ href: base, label: "Overview" }] : []),
    ...(canViewFrontLine ? [{ href: `${base}/front-line`, label: "Front line", badge: frontLineOpenCount }] : []),
    ...(canViewServiceDelivery ? [{ href: `${base}/service-delivery`, label: "Service delivery", badge: serviceDeliveryOpenCount }] : []),
    ...(canViewAal ? [{ href: `${base}/aal`, label: "Authorized Access List", badge: aalPendingCount }] : []),
    ...(canManageDocks ? [{ href: `${base}/loading-docks`, label: "Loading docks" }] : []),
    ...(canViewIntegrations ? [{ href: `${base}/integrations`, label: "Site integration" }] : []),
    ...(canViewDocuments ? [{ href: `${base}/documents`, label: "Documents" }] : []),
  ];

  return (
    <div>
      <Link href="/ops/admin/facilities" className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-brand">
        <ChevronLeft className="h-3.5 w-3.5" /> Site management
      </Link>
      <PageHeader
        title={facility.name}
        description={`${facility.city.country.region.name} · ${facility.city.country.name} · ${facility.city.name} · ${facility.code}`}
      />
      <SiteTabs tabs={tabs} />
      {children}
    </div>
  );
}
