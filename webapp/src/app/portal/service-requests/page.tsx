import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { LinkButton } from "@/components/ui/button";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import { ServiceRequestCalendar } from "@/components/service-requests/calendar";
import { PortalServiceRequestsTable } from "@/components/service-requests/portal-service-requests-table";
import { requireCustomerUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getCustomerFacilityIds } from "@/lib/scope";
import { parseMonthParam } from "@/lib/calendar";
import { formatDateTime } from "@/lib/utils";
import { SERVICE_REQUEST_CATEGORY_LABELS } from "@/lib/constants";

export default async function PortalServiceRequestsPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const { month: monthParam } = await searchParams;
  const user = await requireCustomerUser();
  const facilityIds = await getCustomerFacilityIds(user);
  const { year, month } = parseMonthParam(monthParam);

  const requests = await prisma.serviceRequest.findMany({
    where: {
      siteEnrollment: {
        enterpriseAccountId: user.enterpriseAccountId,
        facilityId: { in: facilityIds },
      },
    },
    include: { siteEnrollment: { include: { facility: true } }, building: true, assignedToUser: true },
    orderBy: { createdAt: "desc" },
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
      <PageHeader
        title="Service Requests"
        description="Complaints, RFIs, site walks, meetings, and remote/smart hands — all in one queue."
        actions={
          <LinkButton href="/portal/service-requests/new">
            <Plus className="h-4 w-4" /> New request
          </LinkButton>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ServiceRequestCalendar
            year={year}
            month={month}
            events={calendarEvents}
            basePath="/portal/service-requests"
            detailBasePath="/portal/service-requests"
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
            <Link key={r.id} href={`/portal/service-requests/${r.id}`}>
              <Card className="transition hover:border-brand/40">
                <CardBody>
                  <div className="flex items-center justify-between gap-2">
                    <Badge>{SERVICE_REQUEST_CATEGORY_LABELS[r.category] ?? r.category}</Badge>
                    <StatusBadge status={r.status} />
                  </div>
                  <p className="mt-2 text-sm font-medium text-slate-900">{r.subject}</p>
                  <p className="text-xs text-slate-500">{formatDateTime(r.scheduledStart)}</p>
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      <PortalServiceRequestsTable requests={requests} />
    </div>
  );
}
