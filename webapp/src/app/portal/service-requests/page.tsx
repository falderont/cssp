import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { LinkButton } from "@/components/ui/button";
import { Table, THead, TH, TBody, TR, TD, EmptyRow } from "@/components/ui/table";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import { ServiceRequestCalendar } from "@/components/service-requests/calendar";
import { requireCustomerUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getCustomerFacilityIds } from "@/lib/scope";
import { parseMonthParam } from "@/lib/calendar";
import { formatDate, formatDateTime } from "@/lib/utils";
import { SERVICE_REQUEST_CATEGORY_LABELS } from "@/lib/constants";

export default async function PortalServiceRequestsPage({
  searchParams,
}: {
  searchParams: { site?: string; month?: string };
}) {
  const user = await requireCustomerUser();
  const facilityIds = await getCustomerFacilityIds(user);
  const siteFilter = searchParams.site && facilityIds.includes(searchParams.site) ? searchParams.site : undefined;
  const { year, month } = parseMonthParam(searchParams.month);

  const requests = await prisma.serviceRequest.findMany({
    where: {
      siteEnrollment: {
        enterpriseAccountId: user.enterpriseAccountId,
        facilityId: siteFilter ? siteFilter : { in: facilityIds },
      },
    },
    include: { siteEnrollment: { include: { facility: true } }, assignedToUser: true },
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

      <Table>
        <THead>
          <tr>
            <TH>Subject</TH>
            <TH>Type</TH>
            <TH>Site</TH>
            <TH>Priority</TH>
            <TH>Assigned to</TH>
            <TH>Status</TH>
            <TH>Submitted</TH>
          </tr>
        </THead>
        <TBody>
          {requests.length === 0 && <EmptyRow colSpan={7} message="No service requests yet." />}
          {requests.map((r) => (
            <TR key={r.id}>
              <TD>
                <Link href={`/portal/service-requests/${r.id}`} className="font-medium text-brand hover:underline">
                  {r.subject}
                </Link>
              </TD>
              <TD>
                <Badge>{SERVICE_REQUEST_CATEGORY_LABELS[r.category] ?? r.category}</Badge>
              </TD>
              <TD>{r.siteEnrollment.facility.name}</TD>
              <TD>{r.priority}</TD>
              <TD>{r.assignedToUser?.name ?? "Unassigned"}</TD>
              <TD>
                <StatusBadge status={r.status} />
              </TD>
              <TD>{formatDate(r.createdAt)}</TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </div>
  );
}
