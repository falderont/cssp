import Image from "next/image";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Field, Select, Textarea, Input } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { requireInternalUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";
import { REMOTE_HANDS_TASK_LABELS, ROLES } from "@/lib/constants";
import { acceptAndAssignTask, completeTask, startTask } from "@/actions/remote-hands";

export default async function OpsRemoteHandsDetailPage({ params }: { params: { id: string } }) {
  await requireInternalUser();
  const task = await prisma.remoteHandsTask.findUnique({
    where: { id: params.id },
    include: {
      siteEnrollment: { include: { facility: true, enterpriseAccount: true } },
      assignedTechnician: true,
      createdByUser: true,
    },
  });
  if (!task) notFound();

  const technicians = await prisma.user.findMany({
    where: { role: { in: [ROLES.PROVIDER_TECHNICIAN, ROLES.PROVIDER_OPS] } },
    orderBy: { name: "asc" },
  });

  const returnPath = `/ops/remote-hands/${task.id}`;
  const acceptBound = acceptAndAssignTask.bind(null, task.id, returnPath);
  const startBound = startTask.bind(null, task.id, returnPath);
  const completeBound = completeTask.bind(null, task.id, returnPath);

  return (
    <div>
      <PageHeader
        title={REMOTE_HANDS_TASK_LABELS[task.taskType] ?? task.taskType}
        description={`${task.siteEnrollment.enterpriseAccount.name} · ${task.siteEnrollment.facility.name} · ${task.assetRef}`}
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader className="flex items-center justify-between">
              <StatusBadge status={task.status} />
              <span className="text-xs text-slate-400">Requested {formatDateTime(task.createdAt)}</span>
            </CardHeader>
            <CardBody className="space-y-3 text-sm">
              <p className="text-slate-700">{task.description}</p>
              <p className="text-xs text-slate-400">Requested by {task.createdByUser.name}</p>
              {task.requestedWindowStart && (
                <p className="text-xs text-slate-400">
                  Preferred window: {formatDateTime(task.requestedWindowStart)} – {formatDateTime(task.requestedWindowEnd)}
                </p>
              )}
            </CardBody>
          </Card>

          {task.status === "Completed" && (
            <Card>
              <CardHeader>
                <CardTitle>Completion record</CardTitle>
              </CardHeader>
              <CardBody className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <Info label="Started" value={formatDateTime(task.startedAt)} />
                  <Info label="Completed" value={formatDateTime(task.completedAt)} />
                  <Info label="Billable minutes" value={String(task.billableMinutes ?? "—")} />
                  <Info label="CSAT" value={task.csatRating ? (task.csatRating === "up" ? "👍" : "👎") : "Not rated"} />
                </div>
                <p className="text-sm text-slate-700">{task.completionNotes}</p>
                {task.completionPhotoUrl && (
                  <div className="relative h-64 w-full max-w-md overflow-hidden rounded-lg border border-slate-200">
                    <Image src={`/api/remote-hands/${task.id}/photo`} alt="Completion proof" fill className="object-cover" unoptimized />
                  </div>
                )}
              </CardBody>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          {task.status === "Submitted" && (
            <Card>
              <CardHeader>
                <CardTitle>Accept &amp; assign</CardTitle>
              </CardHeader>
              <CardBody>
                <form action={acceptBound} className="space-y-3">
                  <Field label="Technician" htmlFor="assignedTechnicianId" required>
                    <Select id="assignedTechnicianId" name="assignedTechnicianId" required>
                      <option value="">Choose…</option>
                      {technicians.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Button type="submit" className="w-full">
                    Accept &amp; assign
                  </Button>
                </form>
              </CardBody>
            </Card>
          )}

          {task.status === "Accepted" && (
            <Card>
              <CardHeader>
                <CardTitle>{task.assignedTechnician?.name}</CardTitle>
              </CardHeader>
              <CardBody>
                <form action={startBound}>
                  <Button type="submit" className="w-full">
                    Start task
                  </Button>
                </form>
              </CardBody>
            </Card>
          )}

          {task.status === "InProgress" && (
            <Card>
              <CardHeader>
                <CardTitle>Complete task</CardTitle>
              </CardHeader>
              <CardBody>
                <form action={completeBound} className="space-y-3">
                  <Field label="Completion notes" htmlFor="completionNotes" required>
                    <Textarea id="completionNotes" name="completionNotes" required placeholder="What was done…" />
                  </Field>
                  <Field label="Completion photo" htmlFor="completionPhoto" hint="Optional proof-of-work photo">
                    <input
                      id="completionPhoto"
                      name="completionPhoto"
                      type="file"
                      accept="image/*"
                      className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand/10 file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand hover:file:bg-brand/20"
                    />
                  </Field>
                  <Field
                    label="Billable minutes override"
                    htmlFor="billableMinutesOverride"
                    hint="Leave blank to auto-compute from start/complete timestamps"
                  >
                    <Input id="billableMinutesOverride" name="billableMinutesOverride" type="number" min={1} placeholder="Auto" />
                  </Field>
                  <Button type="submit" className="w-full">
                    Complete task
                  </Button>
                </form>
              </CardBody>
            </Card>
          )}
        </div>
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
