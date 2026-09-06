import Image from "next/image";
import Link from "next/link";
import { CalendarPlus } from "lucide-react";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";
import {
  REMOTE_HANDS_TASK_LABELS,
  SERVICE_REQUEST_CATEGORY_LABELS,
  SERVICE_REQUEST_STATUSES,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { ServiceRequest, SiteEnrollment, Facility, User } from "@prisma/client";

type FullServiceRequest = ServiceRequest & {
  siteEnrollment: SiteEnrollment & { facility: Facility };
  assignedToUser: User | null;
  createdByUser: User;
};

export function ServiceRequestSummary({ request }: { request: FullServiceRequest }) {
  const isRemoteHands = request.category === "RemoteHands";
  const steps = isRemoteHands ? SERVICE_REQUEST_STATUSES.filter((s) => s !== "Cancelled") : null;
  const currentIndex = steps ? steps.indexOf(request.status as (typeof steps)[number]) : -1;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Badge>{SERVICE_REQUEST_CATEGORY_LABELS[request.category] ?? request.category}</Badge>
            <StatusBadge status={request.status} />
            <Badge tone="slate">{request.priority}</Badge>
          </div>
          <span className="text-xs text-slate-400">{request.siteEnrollment.facility.name}</span>
        </CardHeader>
        <CardBody className="space-y-3">
          <p className="text-sm text-slate-700">{request.description}</p>
          <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            <Info label="Requested by" value={request.createdByUser.name} />
            <Info label="Assigned to" value={request.assignedToUser?.name ?? "Unassigned"} />
            <Info label="Submitted" value={formatDateTime(request.createdAt)} />
            {isRemoteHands && <Info label="Asset / rack" value={request.assetRef ?? "—"} />}
            {isRemoteHands && (
              <Info label="Task type" value={(request.taskType && REMOTE_HANDS_TASK_LABELS[request.taskType]) || "—"} />
            )}
            {request.startedAt && <Info label="Started" value={formatDateTime(request.startedAt)} />}
            {request.completedAt && <Info label="Completed" value={formatDateTime(request.completedAt)} />}
            {request.billableMinutes != null && <Info label="Billable time" value={`${request.billableMinutes} min`} />}
          </div>
        </CardBody>
      </Card>

      {isRemoteHands && steps && (
        <Card>
          <CardBody>
            <ol className="flex items-center">
              {steps.map((s, i) => (
                <li key={s} className="flex flex-1 items-center last:flex-none">
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold",
                        i <= currentIndex ? "bg-brand text-white" : "bg-slate-100 text-slate-400"
                      )}
                    >
                      {i + 1}
                    </div>
                    <span className={cn("text-xs", i <= currentIndex ? "text-slate-700" : "text-slate-400")}>{s}</span>
                  </div>
                  {i < steps.length - 1 && <div className={cn("mx-2 h-0.5 flex-1", i < currentIndex ? "bg-brand" : "bg-slate-100")} />}
                </li>
              ))}
            </ol>
          </CardBody>
        </Card>
      )}

      {request.scheduledStart && (
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Scheduled</CardTitle>
            <Link
              href={`/api/service-requests/${request.id}/ics`}
              className="inline-flex items-center gap-1 text-sm text-brand hover:underline"
            >
              <CalendarPlus className="h-4 w-4" /> Add to Outlook / Calendar
            </Link>
          </CardHeader>
          <CardBody>
            <p className="text-sm text-slate-700">
              {formatDateTime(request.scheduledStart)}
              {request.scheduledEnd ? ` – ${formatDateTime(request.scheduledEnd)}` : ""}
            </p>
          </CardBody>
        </Card>
      )}

      {request.status === "Done" && isRemoteHands && (
        <Card>
          <CardHeader>
            <CardTitle>Completion proof</CardTitle>
          </CardHeader>
          <CardBody className="space-y-3">
            <p className="text-sm text-slate-700">{request.completionNotes}</p>
            {request.completionPhotoUrl && (
              <div className="relative h-64 w-full max-w-md overflow-hidden rounded-lg border border-slate-200">
                <Image src={`/api/service-requests/${request.id}/photo`} alt="Completion proof" fill className="object-cover" unoptimized />
              </div>
            )}
          </CardBody>
        </Card>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 font-medium text-slate-800">{value}</p>
    </div>
  );
}
