import { requireSession } from "@/lib/auth/dal";
import { withTenant } from "@/lib/tenant";
import { resolvePortalScope } from "@/lib/portal-scope";
import { PageHeader } from "@/components/ui/page-header";
import { Card, EmptyState } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { format } from "date-fns";

export default async function PortalIncidentsPage({ searchParams }: { searchParams: Promise<{ site?: string }> }) {
  const session = await requireSession();
  const { site } = await searchParams;

  const incidents = await withTenant(session.organizationId, async (tx) => {
    const scope = await resolvePortalScope(tx, session, site);
    return tx.incidentOrMaintenance.findMany({
      where: { facilityId: { in: scope.facilityIds } },
      include: { facility: true },
      orderBy: { startAt: "desc" },
    });
  });

  return (
    <div>
      <PageHeader title="Incidents & Maintenance" description="A timeline of incidents and scheduled maintenance at your sites." />

      {incidents.length === 0 ? (
        <EmptyState title="Nothing to report" description="Incidents and maintenance windows for your sites will appear here." />
      ) : (
        <ol className="relative space-y-6 border-l border-slate-200 pl-6">
          {incidents.map((i) => (
            <li key={i.id} className="relative">
              <span className="absolute -left-[29px] top-1 h-3 w-3 rounded-full border-2 border-white bg-brand-500" />
              <Card className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{i.type}</span>
                      <p className="font-medium text-ink-900">{i.title}</p>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">{i.description}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {i.facility.name} · {format(i.startAt, "MMM d, yyyy HH:mm")}
                      {i.endAt ? ` – ${format(i.endAt, "MMM d, yyyy HH:mm")}` : ""}
                    </p>
                  </div>
                  <StatusBadge status={i.status} />
                </div>
              </Card>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
