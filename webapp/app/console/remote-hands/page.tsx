import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/dal";
import { withTenant } from "@/lib/tenant";
import { canAssignRemoteHands, canFulfillRemoteHands, canEditBillableMinutes } from "@/lib/rbac";
import { Role } from "@/lib/generated/prisma/client";
import { PageHeader } from "@/components/ui/page-header";
import { Card, EmptyState } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { format } from "date-fns";
import { acceptAndAssign, startTask, editBillableMinutes } from "./actions";
import { CompleteTaskForm } from "./complete-form";

const TASK_TYPE_LABEL: Record<string, string> = {
  POWER_CYCLE: "Power Cycle",
  VISUAL_INSPECTION: "Visual Inspection",
  CABLE_PATCH: "Cable Patch",
  MOUNT_UNMOUNT: "Mount / Unmount Hardware",
  KVM_ACCESS: "KVM Console Access",
  OTHER: "Other",
};

export default async function ConsoleRemoteHandsPage() {
  const session = await requireSession();
  const canAssign = canAssignRemoteHands(session.role);
  const canFulfill = canFulfillRemoteHands(session.role);
  if (!canAssign && !canFulfill) redirect("/console/dashboard");

  const { tasks, technicians } = await withTenant(session.organizationId, async (tx) => {
    const tasks = await tx.remoteHandsTask.findMany({
      include: {
        siteEnrollment: { include: { facility: true, enterpriseAccount: true } },
        createdBy: true,
        technician: true,
      },
      orderBy: { createdAt: "desc" },
    });
    const technicians = await tx.user.findMany({
      where: { role: { in: [Role.PROVIDER_TECHNICIAN, Role.PROVIDER_OPS, Role.PROVIDER_ADMIN] } },
      orderBy: { name: "asc" },
    });
    return { tasks, technicians };
  });

  return (
    <div>
      <PageHeader title="Remote Hands Queue" description="Accept and assign requests, then track them through to completion." />

      {tasks.length === 0 ? (
        <EmptyState title="No requests" />
      ) : (
        <div className="space-y-4">
          {tasks.map((t) => {
            const mayActOnThis = t.assignedTechnicianId === session.userId || session.role === "PROVIDER_ADMIN" || session.role === "PROVIDER_OPS";
            return (
              <Card key={t.id} className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        {TASK_TYPE_LABEL[t.taskType]}
                      </span>
                      <p className="font-medium text-ink-900">{t.assetOrRackRef}</p>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">{t.description}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {t.siteEnrollment.enterpriseAccount.name} · {t.siteEnrollment.facility.name} · {t.createdBy.name} ·{" "}
                      {format(t.createdAt, "MMM d, yyyy")}
                      {t.technician ? ` · Technician: ${t.technician.name}` : ""}
                    </p>
                  </div>
                  <StatusBadge status={t.status} />
                </div>

                {t.status === "SUBMITTED" && canAssign && (
                  <form action={acceptAndAssign} className="mt-3 flex items-center gap-2">
                    <input type="hidden" name="taskId" value={t.id} />
                    <select
                      name="technicianId"
                      required
                      className="rounded-md border border-slate-300 px-2 py-1.5 text-xs outline-none focus:border-brand-500"
                    >
                      <option value="">Assign technician…</option>
                      {technicians.map((tech) => (
                        <option key={tech.id} value={tech.id}>
                          {tech.name}
                        </option>
                      ))}
                    </select>
                    <button className="rounded-md bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-600">
                      Accept & assign
                    </button>
                  </form>
                )}

                {t.status === "ACCEPTED" && canFulfill && mayActOnThis && (
                  <form action={startTask} className="mt-3">
                    <input type="hidden" name="taskId" value={t.id} />
                    <button className="rounded-md bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-600">
                      Start task
                    </button>
                  </form>
                )}

                {t.status === "IN_PROGRESS" && canFulfill && mayActOnThis && <CompleteTaskForm taskId={t.id} />}

                {t.status === "COMPLETED" && (
                  <div className="mt-3 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                    <p>{t.completionNotes}</p>
                    <div className="mt-2 flex items-center gap-3">
                      {canEditBillableMinutes(session.role) ? (
                        <form action={editBillableMinutes} className="flex items-center gap-1.5">
                          <input type="hidden" name="taskId" value={t.id} />
                          <span>Billable minutes:</span>
                          <input
                            type="number"
                            name="billableMinutes"
                            defaultValue={t.billableMinutes ?? 0}
                            min={0}
                            className="w-16 rounded border border-slate-300 px-1.5 py-0.5"
                          />
                          <button className="font-medium text-brand-600 hover:underline">Save</button>
                        </form>
                      ) : (
                        <span>{t.billableMinutes} billable minutes</span>
                      )}
                      {t.completionPhotoRef && (
                        <a href={`/api/remote-hands/${t.id}/photo`} target="_blank" className="text-brand-600 hover:underline">
                          View photo
                        </a>
                      )}
                      {t.csatRating && <span>CSAT: {t.csatRating}/5</span>}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
