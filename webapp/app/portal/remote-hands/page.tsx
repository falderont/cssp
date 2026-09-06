import { requireSession } from "@/lib/auth/dal";
import { withTenant } from "@/lib/tenant";
import { resolvePortalScope } from "@/lib/portal-scope";
import { PageHeader } from "@/components/ui/page-header";
import { Card, EmptyState } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { format } from "date-fns";
import { CreateRemoteHandsForm } from "./create-form";
import { rateRemoteHandsTask } from "./actions";

const TASK_TYPE_LABEL: Record<string, string> = {
  POWER_CYCLE: "Power Cycle",
  VISUAL_INSPECTION: "Visual Inspection",
  CABLE_PATCH: "Cable Patch",
  MOUNT_UNMOUNT: "Mount / Unmount Hardware",
  KVM_ACCESS: "KVM Console Access",
  OTHER: "Other",
};

export default async function PortalRemoteHandsPage({ searchParams }: { searchParams: Promise<{ site?: string }> }) {
  const session = await requireSession();
  const { site } = await searchParams;

  const { scope, tasks } = await withTenant(session.organizationId, async (tx) => {
    const scope = await resolvePortalScope(tx, session, site);
    const tasks = await tx.remoteHandsTask.findMany({
      where: { siteEnrollmentId: { in: scope.siteEnrollmentIds } },
      include: { siteEnrollment: { include: { facility: true } }, technician: true },
      orderBy: { createdAt: "desc" },
    });
    return { scope, tasks };
  });

  return (
    <div>
      <PageHeader title="Remote / Smart Hands" description="Request on-site staff to physically do something in the data center on your behalf." />

      <Card className="mb-8 p-5">
        <h2 className="mb-4 font-display text-base font-semibold text-ink-900">Submit a request</h2>
        <CreateRemoteHandsForm sites={scope.enrollments.map((e) => ({ id: e.id, label: e.facility.name }))} />
      </Card>

      {tasks.length === 0 ? (
        <EmptyState title="No requests yet" />
      ) : (
        <div className="space-y-4">
          {tasks.map((t) => (
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
                    {t.siteEnrollment.facility.name} · Submitted {format(t.createdAt, "MMM d, yyyy")}
                    {t.technician ? ` · Technician: ${t.technician.name}` : ""}
                  </p>
                </div>
                <StatusBadge status={t.status} />
              </div>

              {t.status === "COMPLETED" && (
                <div className="mt-4 rounded-lg bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Completion proof</p>
                  {t.completionNotes && <p className="mt-1 text-sm text-slate-700">{t.completionNotes}</p>}
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      {t.billableMinutes != null && <span>{t.billableMinutes} billable minutes</span>}
                      {t.completionPhotoRef && (
                        <a href={`/api/remote-hands/${t.id}/photo`} target="_blank" className="text-brand-600 hover:underline">
                          View completion photo
                        </a>
                      )}
                    </div>
                    {t.csatRating ? (
                      <p className="text-xs text-slate-400">Rated {t.csatRating}/5</p>
                    ) : (
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <form key={n} action={rateRemoteHandsTask}>
                            <input type="hidden" name="taskId" value={t.id} />
                            <input type="hidden" name="rating" value={n} />
                            <button className="h-6 w-6 rounded border border-slate-200 text-xs text-slate-500 hover:border-brand-500 hover:text-brand-600">
                              {n}
                            </button>
                          </form>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
