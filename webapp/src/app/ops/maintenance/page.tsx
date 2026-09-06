import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { LinkButton } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { MaintenanceCalendar } from "@/components/maintenance/calendar";
import { requireInternalUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getOpsFacilityIds } from "@/lib/scope";
import { parseMonthParam } from "@/lib/calendar";
import { formatDateTime } from "@/lib/utils";

export default async function OpsMaintenancePage({ searchParams }: { searchParams: { month?: string } }) {
  const user = await requireInternalUser();
  const scopedFacilityIds = await getOpsFacilityIds(user);
  const { year, month } = parseMonthParam(searchParams.month);

  const events = await prisma.maintenanceEvent.findMany({
    where: scopedFacilityIds ? { facilityId: { in: scopedFacilityIds } } : undefined,
    include: { facility: true, building: true },
    orderBy: { startAt: "desc" },
  });
  const upcoming = events.filter((e) => e.status !== "Completed" && e.status !== "Cancelled").slice(0, 8);

  return (
    <div>
      <PageHeader
        title="Maintenance"
        description="Schedule maintenance windows and notify affected tenants automatically."
        actions={
          <LinkButton href="/ops/maintenance/new">
            <Plus className="h-4 w-4" /> Schedule maintenance
          </LinkButton>
        }
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <MaintenanceCalendar year={year} month={month} events={events} basePath="/ops/maintenance" detailBasePath="/ops/maintenance" />
        </div>
        <div className="space-y-3">
          <h3 className="font-display text-sm font-semibold text-slate-700">Upcoming / active</h3>
          {upcoming.length === 0 && (
            <Card>
              <CardBody className="text-center text-sm text-slate-400">Nothing scheduled.</CardBody>
            </Card>
          )}
          {upcoming.map((e) => (
            <Link key={e.id} href={`/ops/maintenance/${e.id}`}>
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
