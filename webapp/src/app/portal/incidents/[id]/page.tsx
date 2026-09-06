import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { requireCustomerUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getCustomerFacilityIds } from "@/lib/scope";
import { formatDateTime } from "@/lib/utils";

export default async function PortalIncidentDetailPage({ params }: { params: { id: string } }) {
  const user = await requireCustomerUser();
  const facilityIds = await getCustomerFacilityIds(user);
  const incident = await prisma.incident.findFirst({
    where: { id: params.id, isCustomerVisible: true, facilityId: { in: facilityIds } },
    include: { facility: true, building: true, updates: { orderBy: { createdAt: "asc" }, include: { createdByUser: true } } },
  });
  if (!incident) notFound();

  return (
    <div>
      <PageHeader title={incident.title} description={`${incident.facility.name}${incident.building ? " · " + incident.building.name : ""}`} />
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge tone={incident.severity === "P1" || incident.severity === "P2" ? "red" : "amber"}>{incident.severity}</Badge>
              <StatusBadge status={incident.status} />
            </div>
            <span className="text-xs text-slate-400">Started {formatDateTime(incident.startedAt)}</span>
          </CardHeader>
          <CardBody>
            <p className="text-sm text-slate-700">{incident.description}</p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
          </CardHeader>
          <CardBody>
            {incident.updates.length === 0 ? (
              <p className="text-sm text-slate-400">No updates posted yet.</p>
            ) : (
              <ol className="space-y-4 border-l border-slate-200 pl-4">
                {incident.updates.map((u) => (
                  <li key={u.id}>
                    <p className="text-xs text-slate-400">{formatDateTime(u.createdAt)}</p>
                    <p className="mt-0.5 text-sm text-slate-700">{u.message}</p>
                  </li>
                ))}
              </ol>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
