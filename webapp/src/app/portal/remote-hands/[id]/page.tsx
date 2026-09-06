import Image from "next/image";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireCustomerUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";
import { REMOTE_HANDS_STATUSES, REMOTE_HANDS_TASK_LABELS } from "@/lib/constants";
import { submitRemoteHandsCsat } from "@/actions/remote-hands";
import { cn } from "@/lib/utils";

export default async function PortalRemoteHandsDetailPage({ params }: { params: { id: string } }) {
  const user = await requireCustomerUser();
  const task = await prisma.remoteHandsTask.findFirst({
    where: { id: params.id, siteEnrollment: { enterpriseAccountId: user.enterpriseAccountId } },
    include: { siteEnrollment: { include: { facility: true } }, assignedTechnician: true },
  });
  if (!task) notFound();

  const returnPath = `/portal/remote-hands/${task.id}`;
  const csatUpBound = submitRemoteHandsCsat.bind(null, task.id, "up", returnPath);
  const csatDownBound = submitRemoteHandsCsat.bind(null, task.id, "down", returnPath);
  const steps = REMOTE_HANDS_STATUSES.filter((s) => s !== "Cancelled");
  const currentIndex = steps.indexOf(task.status as (typeof steps)[number]);

  return (
    <div>
      <PageHeader title={REMOTE_HANDS_TASK_LABELS[task.taskType] ?? task.taskType} description={`${task.siteEnrollment.facility.name} · ${task.assetRef}`} />
      <div className="space-y-6">
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

        <Card>
          <CardHeader>
            <p className="font-display text-sm font-semibold text-slate-900">Request details</p>
          </CardHeader>
          <CardBody className="space-y-3 text-sm">
            <p className="text-slate-700">{task.description}</p>
            <div className="grid grid-cols-2 gap-4">
              <Info label="Assigned technician" value={task.assignedTechnician?.name ?? "Not yet assigned"} />
              <Info label="Requested" value={formatDateTime(task.createdAt)} />
              {task.startedAt && <Info label="Started" value={formatDateTime(task.startedAt)} />}
              {task.completedAt && <Info label="Completed" value={formatDateTime(task.completedAt)} />}
              {task.billableMinutes != null && <Info label="Billable time" value={`${task.billableMinutes} min`} />}
            </div>
          </CardBody>
        </Card>

        {task.status === "Completed" && (
          <Card>
            <CardHeader>
              <p className="font-display text-sm font-semibold text-slate-900">Completion proof</p>
            </CardHeader>
            <CardBody className="space-y-3">
              <p className="text-sm text-slate-700">{task.completionNotes}</p>
              {task.completionPhotoUrl && (
                <div className="relative h-64 w-full max-w-md overflow-hidden rounded-lg border border-slate-200">
                  <Image src={`/api/remote-hands/${task.id}/photo`} alt="Completion proof" fill className="object-cover" unoptimized />
                </div>
              )}
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="mb-2 text-sm font-medium text-slate-700">How did we do?</p>
                {task.csatRating ? (
                  <p className="text-sm text-slate-500">Thanks for your feedback ({task.csatRating === "up" ? "👍" : "👎"}).</p>
                ) : (
                  <div className="flex gap-2">
                    <form action={csatUpBound}>
                      <Button type="submit" size="sm" variant="secondary">
                        👍 Good
                      </Button>
                    </form>
                    <form action={csatDownBound}>
                      <Button type="submit" size="sm" variant="secondary">
                        👎 Not great
                      </Button>
                    </form>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        )}
      </div>
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
