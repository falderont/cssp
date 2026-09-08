import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { MaintenanceCalendar } from "@/components/maintenance/calendar";
import { requireCustomerUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getCustomerFacilityIds } from "@/lib/scope";
import { parseMonthParam } from "@/lib/calendar";
import { formatDateTime } from "@/lib/utils";

export default async function PortalMaintenancePage({ searchParams }: { searchParams: Promise<{ site?: string; month?: string }> }) {
  const { site, month: monthParam } = await searchParams;
  const user = await requireCustomerUser();
  const facilityIds = await getCustomerFacilityIds(user);
  const siteFilter = site && facilityIds.includes(site) ? site : undefined;
  const { year, month } = parseMonthParam(monthParam);

  const events = await prisma.maintenanceEvent.findMany({
    where: { facilityId: siteFilter ? siteFilter : { in: facilityIds } },
    include: { facility: true, building: true },
    orderBy: { startAt: "desc" },
  });

  const upcoming = events.filter((e) => e.status !== "Completed" && e.status !== "Cancelled").slice(0, 8);

  return (
    <div>
      <PageHeader title="Maintenance" description="Scheduled and emergency maintenance windows affecting your sites." />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <MaintenanceCalendar
            year={year}
            month={month}
            events={events}
            basePath="/portal/maintenance"
            detailBasePath="/portal/maintenance"
          />
        </div>
        <div className="space-y-3">
          <h3 className="font-display text-sm font-semibold text-slate-700">Upcoming / active</h3>
          {upcoming.length === 0 && (
            <Card>
              <CardBody className="text-center text-sm text-slate-400">Nothing scheduled.</CardBody>
            </Card>
          )}
          {upcoming.map((e) => (
            <Link key={e.id} href={`/portal/maintenance/${e.id}`}>
              <Card className="transition hover:border-brand/40">
                <CardBody>
                  <div className="flex items-center justify-between gap-2">
                    <Badge tone={e.maintType === "Emergency" ? "red" : "blue"}>{e.maintType}</Badge>
                    <StatusBadge status={e.status} />
                  </div>
                  <p className="mt-2 text-sm font-medium text-slate-900">{e.title}</p>
                  <p className="text-xs text-slate-500">
                    {e.facility.name} · {formatDateTime(e.startAt)}
                  </p>
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
