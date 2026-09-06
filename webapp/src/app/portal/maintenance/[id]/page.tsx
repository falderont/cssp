import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { requireCustomerUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getCustomerFacilityIds } from "@/lib/scope";
import { formatDateTime } from "@/lib/utils";

export default async function PortalMaintenanceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireCustomerUser();
  const facilityIds = await getCustomerFacilityIds(user);
  const event = await prisma.maintenanceEvent.findFirst({
    where: { id, facilityId: { in: facilityIds } },
    include: { facility: true, building: true, notifications: { orderBy: { sentAt: "asc" } } },
  });
  if (!event) notFound();

  return (
    <div>
      <PageHeader title={event.title} description={`${event.facility.name}${event.building ? " · " + event.building.name : ""}`} />
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge tone={event.maintType === "Emergency" ? "red" : "blue"}>{event.maintType}</Badge>
              <StatusBadge status={event.status} />
              <Badge tone={event.impact === "FullOutage" ? "red" : event.impact === "RedundancyReduced" ? "amber" : "slate"}>
                {event.impact}
              </Badge>
            </div>
            <span className="text-xs text-slate-400">
              {formatDateTime(event.startAt)} → {formatDateTime(event.endAt)}
            </span>
          </CardHeader>
          <CardBody>
            <p className="text-sm text-slate-700">{event.description}</p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notification history</CardTitle>
          </CardHeader>
          <CardBody>
            {event.notifications.length === 0 ? (
              <p className="text-sm text-slate-400">No notifications sent yet.</p>
            ) : (
              <ul className="space-y-3">
                {event.notifications.map((n) => (
                  <li key={n.id} className="text-sm">
                    <p className="text-xs text-slate-400">
                      {formatDateTime(n.sentAt)} · {n.channel} · {n.audience}
                    </p>
                    <p className="text-slate-700">{n.message}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
