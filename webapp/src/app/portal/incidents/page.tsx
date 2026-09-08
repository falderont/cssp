import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { StatusBadge, Badge } from "@/components/ui/badge";
import { requireCustomerUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getCustomerFacilityIds } from "@/lib/scope";
import { formatDateTime } from "@/lib/utils";

export default async function PortalIncidentsPage({ searchParams }: { searchParams: Promise<{ site?: string }> }) {
  const { site } = await searchParams;
  const user = await requireCustomerUser();
  const facilityIds = await getCustomerFacilityIds(user);
  const siteFilter = site && facilityIds.includes(site) ? site : undefined;

  const incidents = await prisma.incident.findMany({
    where: {
      isCustomerVisible: true,
      facilityId: siteFilter ? siteFilter : { in: facilityIds },
    },
    include: { facility: true, building: true },
    orderBy: { startedAt: "desc" },
  });

  return (
    <div>
      <PageHeader title="Incidents" description="Live status for incidents affecting your sites." />
      <div className="space-y-3">
        {incidents.length === 0 && (
          <Card>
            <CardBody className="text-center text-sm text-slate-400">No incidents reported for your sites.</CardBody>
          </Card>
        )}
        {incidents.map((inc) => (
          <Link key={inc.id} href={`/portal/incidents/${inc.id}`} className="block">
            <Card className="transition hover:border-brand/40">
              <CardBody>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge tone={inc.severity === "P1" || inc.severity === "P2" ? "red" : "amber"}>{inc.severity}</Badge>
                      <Badge tone="slate">{inc.category}</Badge>
                      <p className="font-medium text-slate-900">{inc.title}</p>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {inc.facility.name}
                      {inc.building ? ` · ${inc.building.name}` : ""} · {formatDateTime(inc.startedAt)}
                    </p>
                  </div>
                  <StatusBadge status={inc.status} />
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-slate-600">{inc.description}</p>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
