import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Table, THead, TH, TBody, TR, TD, EmptyRow } from "@/components/ui/table";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import { Select } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { ServiceRequestCalendar } from "@/components/service-requests/calendar";
import { requireInternalUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getOpsFacilityIds } from "@/lib/scope";
import { parseMonthParam } from "@/lib/calendar";
import { formatDate, formatDateTime } from "@/lib/utils";
import { ROLES, SERVICE_REQUEST_CATEGORIES, SERVICE_REQUEST_CATEGORY_LABELS } from "@/lib/constants";

export default async function OpsServiceRequestsPage({
  searchParams,
}: {
  searchParams: { category?: string; status?: string; month?: string };
}) {
  const user = await requireInternalUser();
  const scopedFacilityIds = await getOpsFacilityIds(user);
  const isVendor = user.role === ROLES.OPS_VENDOR;
  const { year, month } = parseMonthParam(searchParams.month);

  const requests = await prisma.serviceRequest.findMany({
    where: {
      ...(searchParams.category ? { category: searchParams.category } : {}),
      ...(searchParams.status ? { status: searchParams.status } : {}),
      ...(scopedFacilityIds ? { siteEnrollment: { facilityId: { in: scopedFacilityIds } } } : {}),
      ...(isVendor ? { assignedToId: user.id } : {}),
    },
    include: { siteEnrollment: { include: { facility: true, enterpriseAccount: true } }, assignedToUser: true },
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

      <form className="mb-4 flex flex-wrap gap-2" method="get">
        <Select name="category" defaultValue={searchParams.category ?? ""} className="w-auto">
          <option value="">Any type</option>
          {SERVICE_REQUEST_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {SERVICE_REQUEST_CATEGORY_LABELS[c]}
            </option>
          ))}
        </Select>
        <Select name="status" defaultValue={searchParams.status ?? ""} className="w-auto">
          <option value="">Any status</option>
          <option value="Submitted">Submitted</option>
          <option value="Accepted">Accepted</option>
          <option value="InProgress">In Progress</option>
          <option value="Done">Done</option>
          <option value="Cancelled">Cancelled</option>
        </Select>
        <Button type="submit">Filter</Button>
      </form>

      <Table>
        <THead>
          <tr>
            <TH>Subject</TH>
            <TH>Type</TH>
            <TH>Tenant</TH>
            <TH>Site</TH>
            <TH>Assigned to</TH>
            <TH>Status</TH>
            <TH>Submitted</TH>
          </tr>
        </THead>
        <TBody>
          {requests.length === 0 && <EmptyRow colSpan={7} message="No requests match this filter." />}
          {requests.map((r) => (
            <TR key={r.id}>
              <TD>
                <Link href={`/ops/service-requests/${r.id}`} className="font-medium text-brand hover:underline">
                  {r.subject}
                </Link>
              </TD>
              <TD>
                <Badge>{SERVICE_REQUEST_CATEGORY_LABELS[r.category] ?? r.category}</Badge>
              </TD>
              <TD>{r.siteEnrollment.enterpriseAccount.name}</TD>
              <TD>{r.siteEnrollment.facility.name}</TD>
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
