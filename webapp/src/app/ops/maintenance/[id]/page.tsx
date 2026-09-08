import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Field, Select } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { requireInternalUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";
import { updateMaintenanceStatus } from "@/actions/maintenance";
import { MAINTENANCE_STATUSES } from "@/lib/constants";
import { ActionForm } from "@/components/errors/action-form";

export default async function OpsMaintenanceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireInternalUser();
  const event = await prisma.maintenanceEvent.findUnique({
    where: { id },
    include: { facility: true, building: true, notifications: { orderBy: { sentAt: "asc" } } },
  });
  if (!event) notFound();

  const returnPath = `/ops/maintenance/${event.id}`;
  const updateStatusBound = updateMaintenanceStatus.bind(null, event.id, returnPath);

  return (
    <div>
      <PageHeader title={event.title} description={`${event.facility.name}${event.building ? " · " + event.building.name : ""}`} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
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

        <Card>
          <CardHeader>
            <CardTitle>Update status</CardTitle>
          </CardHeader>
          <CardBody>
            <ActionForm action={updateStatusBound} className="space-y-3">
              <Field label="Status" htmlFor="status">
                <Select id="status" name="status" defaultValue={event.status}>
                  {MAINTENANCE_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              </Field>
              <Button type="submit" className="w-full">
                Update &amp; notify tenants
              </Button>
            </ActionForm>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
