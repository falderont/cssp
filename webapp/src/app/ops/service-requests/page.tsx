import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import { ServiceRequestCalendar } from "@/components/service-requests/calendar";
import { OpsServiceRequestsTable } from "@/components/service-requests/ops-service-requests-table";
import { requireInternalUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getOpsFacilityIds } from "@/lib/scope";
import { parseMonthParam } from "@/lib/calendar";
import { formatDateTime } from "@/lib/utils";
import { ROLES, SERVICE_REQUEST_CATEGORY_LABELS } from "@/lib/constants";
import { getFacilityTabAccess } from "@/lib/facility-tabs";

// Service Requests now also lives as a tab on each site's own management
// page — a viewer pinned to one facility goes straight there, but only if
// their role can actually reach the facility page at all: CS Team and
// vendors can also be facility-restricted, and neither has a Service
// Delivery tab there (a vendor's queue is their own assigned tasks, not one
// site's; CS Team stays on this cross-site page). Everyone else keeps this
// page exactly as before.
export default async function OpsServiceRequestsPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const { month: monthParam } = await searchParams;
  const user = await requireInternalUser();
  if (user.restrictedFacilityId && getFacilityTabAccess(user.role).canViewServiceDelivery) {
    redirect(`/ops/admin/facilities/${user.restrictedFacilityId}/service-delivery/service-requests`);
  }
  const scopedFacilityIds = await getOpsFacilityIds(user);
  const isVendor = user.role === ROLES.OPS_VENDOR;
  const { year, month } = parseMonthParam(monthParam);

  const requests = await prisma.serviceRequest.findMany({
    where: {
      ...(scopedFacilityIds ? { siteEnrollment: { facilityId: { in: scopedFacilityIds } } } : {}),
      ...(isVendor ? { assignedToId: user.id } : {}),
    },
    include: { siteEnrollment: { include: { facility: true, enterpriseAccount: true } }, building: true, assignedToUser: true },
    orderBy: { createdAt: "desc" },
    take: 300,
  });

  const scheduled = requests.filter((r) => r.scheduledStart);
  const calendarEvents = scheduled.map((r) => ({
    id: r.id,
    title: r.subject,
    start: r.scheduledStart!,
    end: r.scheduledEnd ?? r.scheduledStart!,
    category: r.category,
  }));
  const upcoming = scheduled
    .filter((r) => r.scheduledStart! >= new Date() && r.status !== "Cancelled" && r.status !== "Done")
    .sort((a, b) => a.scheduledStart!.getTime() - b.scheduledStart!.getTime())
    .slice(0, 6);

  return (
    <div>
      <PageHeader title="Service Requests" description="Every complaint, RFI, meeting/site-walk request and remote hands task, across all accounts and sites." />

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ServiceRequestCalendar
            year={year}
            month={month}
            events={calendarEvents}
            basePath="/ops/service-requests"
            detailBasePath="/ops/service-requests"
          />
        </div>
        <div className="space-y-3">
          <h3 className="font-display text-sm font-semibold text-slate-700">Upcoming</h3>
          {upcoming.length === 0 && (
            <Card>
              <CardBody className="text-center text-sm text-slate-400">Nothing scheduled.</CardBody>
            </Card>
          )}
          {upcoming.map((r) => (
            <Link key={r.id} href={`/ops/service-requests/${r.id}`}>
              <Card className="transition hover:border-brand/40">
                <CardBody>
                  <div className="flex items-center justify-between gap-2">
                    <Badge>{SERVICE_REQUEST_CATEGORY_LABELS[r.category] ?? r.category}</Badge>
                    <StatusBadge status={r.status} />
                  </div>
                  <p className="mt-2 text-sm font-medium text-slate-900">{r.subject}</p>
                  <p className="text-xs text-slate-500">
                    {r.siteEnrollment.enterpriseAccount.name} · {formatDateTime(r.scheduledStart)}
                  </p>
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      <OpsServiceRequestsTable requests={requests} />
    </div>
  );
}
