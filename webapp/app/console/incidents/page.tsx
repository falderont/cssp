import { requireSession } from "@/lib/auth/dal";
import { withTenant } from "@/lib/tenant";
import { canPublishIncidents } from "@/lib/rbac";
import { PageHeader } from "@/components/ui/page-header";
import { Card, EmptyState } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { PublishIncidentForm } from "./publish-form";
import { updateIncidentStatus } from "./actions";
import { format } from "date-fns";

const NEXT_STATUS: Record<string, string | null> = {
  SCHEDULED: "IN_PROGRESS",
  IN_PROGRESS: "MONITORING",
  MONITORING: "RESOLVED",
  RESOLVED: null,
};

export default async function ConsoleIncidentsPage() {
  const session = await requireSession();
  const canPublish = canPublishIncidents(session.role);

  const { incidents, facilities } = await withTenant(session.organizationId, async (tx) => {
    const incidents = await tx.incidentOrMaintenance.findMany({
      include: { facility: true },
      orderBy: { startAt: "desc" },
    });
    const facilities = await tx.facility.findMany({ orderBy: { name: "asc" } });
    return { incidents, facilities };
  });

  return (
    <div>
      <PageHeader title="Incidents & Maintenance" description="Publish incident and maintenance updates across your facilities." />

      {canPublish && (
        <Card className="mb-8 p-5">
          <h2 className="mb-4 font-display text-base font-semibold text-ink-900">Publish an update</h2>
          <PublishIncidentForm facilities={facilities.map((f) => ({ id: f.id, name: f.name }))} />
        </Card>
      )}

      {incidents.length === 0 ? (
        <EmptyState title="Nothing published yet" />
      ) : (
        <Card>
          <ul className="divide-y divide-slate-100">
            {incidents.map((i) => {
              const next = NEXT_STATUS[i.status];
              return (
                <li key={i.id} className="flex items-center justify-between gap-4 px-5 py-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{i.type}</span>
                      <p className="font-medium text-ink-900">{i.title}</p>
                    </div>
                    <p className="mt-0.5 text-sm text-slate-500">{i.description}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {i.facility.name} · {format(i.startAt, "MMM d, yyyy HH:mm")}
                      {i.endAt ? ` – ${format(i.endAt, "MMM d, yyyy HH:mm")}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <StatusBadge status={i.status} />
                    {canPublish && next && (
                      <form action={updateIncidentStatus}>
                        <input type="hidden" name="incidentId" value={i.id} />
                        <input type="hidden" name="status" value={next} />
                        <button className="text-xs font-medium text-brand-600 hover:underline">
                          Mark {next.replace("_", " ").toLowerCase()} →
                        </button>
                      </form>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}
