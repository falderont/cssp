import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { requireCustomerUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getCustomerFacilityIds } from "@/lib/scope";
import { formatDateTime } from "@/lib/utils";
import { parseImpactedServices } from "@/lib/constants";

export default async function PortalIncidentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireCustomerUser();
  const facilityIds = await getCustomerFacilityIds(user);
  const incident = await prisma.incident.findFirst({
    where: { id, isCustomerVisible: true, facilityId: { in: facilityIds } },
    include: { facility: true, building: true, updates: { orderBy: { createdAt: "asc" }, include: { createdByUser: true } } },
  });
  if (!incident) notFound();
  const impactedServices = parseImpactedServices(incident.impactedServices);

  return (
    <div>
      <PageHeader title={incident.title} description={`${incident.facility.name}${incident.building ? " · " + incident.building.name : ""}`} />
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge tone={incident.severity === "P1" || incident.severity === "P2" ? "red" : "amber"}>{incident.severity}</Badge>
              <Badge tone="slate">{incident.category}</Badge>
              <StatusBadge status={incident.status} />
            </div>
            <span className="text-xs text-slate-400">Started {formatDateTime(incident.startedAt)}</span>
          </CardHeader>
          <CardBody className="space-y-3">
            <p className="text-sm text-slate-700">{incident.description}</p>
            {incident.locationDetail && (
              <p className="text-xs text-slate-500">
                <span className="font-medium text-slate-600">Location:</span> {incident.locationDetail}
              </p>
            )}
            {impactedServices.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {impactedServices.map((s) => (
                  <Badge key={s} tone="blue">
                    {s}
                  </Badge>
                ))}
              </div>
            )}
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

        {incident.reportStorageKey && (
          <Card>
            <CardHeader>
              <CardTitle>Closure report</CardTitle>
            </CardHeader>
            <CardBody>
              <a
                href={`/api/incidents/${incident.id}/report`}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-brand hover:underline"
              >
                Download {incident.reportFileName}
              </a>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}
