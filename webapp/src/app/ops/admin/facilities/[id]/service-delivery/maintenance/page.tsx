import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { LinkButton } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { MaintenanceCalendar } from "@/components/maintenance/calendar";
import { requireFacilityPageAccess } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { parseMonthParam } from "@/lib/calendar";
import { formatDateTime } from "@/lib/utils";
import { getFacilityTabAccess } from "@/lib/facility-tabs";

export default async function FacilityMaintenancePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ month?: string }>;
}) {
  const { id } = await params;
  const { month: monthParam } = await searchParams;
  const user = await requireFacilityPageAccess();
  const { canViewServiceDelivery } = getFacilityTabAccess(user.role);
  if (!canViewServiceDelivery) redirect(`/ops/admin/facilities/${id}`);
  const { year, month } = parseMonthParam(monthParam);

  const basePath = `/ops/admin/facilities/${id}/service-delivery/maintenance`;
  const events = await prisma.maintenanceEvent.findMany({
    where: { facilityId: id },
    include: { facility: true, building: true },
    orderBy: { startAt: "desc" },
  });
  const upcoming = events.filter((e) => e.status !== "Completed" && e.status !== "Cancelled").slice(0, 8);

  return (
    <div>
      <PageHeader
        title="Maintenance"
        actions={
          <LinkButton href={`/ops/maintenance/new?facilityId=${id}`}>
            <Plus className="h-4 w-4" /> Schedule maintenance
          </LinkButton>
        }
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <MaintenanceCalendar year={year} month={month} events={events} basePath={basePath} detailBasePath="/ops/maintenance" />
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
                  <p className="text-xs text-slate-500">{formatDateTime(e.startAt)}</p>
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
