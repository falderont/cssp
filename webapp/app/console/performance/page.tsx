import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/dal";
import { withTenant } from "@/lib/tenant";
import { canViewTeamPerformance } from "@/lib/rbac";
import { Role } from "@/lib/generated/prisma/client";
import { PageHeader } from "@/components/ui/page-header";
import { Card, EmptyState } from "@/components/ui/card";

const KPI_ROLES: Role[] = [Role.PROVIDER_ADMIN, Role.PROVIDER_CS, Role.PROVIDER_CS_MANAGER, Role.PROVIDER_OPS];

export default async function TeamPerformancePage() {
  const session = await requireSession();
  if (!canViewTeamPerformance(session.role)) redirect("/console/dashboard");

  const rows = await withTenant(session.organizationId, async (tx) => {
    const staff = await tx.user.findMany({ where: { role: { in: KPI_ROLES } }, orderBy: { name: "asc" } });
    const tickets = await tx.ticket.findMany();
    const remoteHandsTasks = await tx.remoteHandsTask.findMany();
    const engagementLogs = await tx.engagementLog.findMany();

    return staff.map((rep) => {
      const repTickets = tickets.filter((t) => t.assignedToUserId === rep.id);
      const resolvedTickets = repTickets.filter((t) => t.resolvedAt);
      const avgResolutionHours = resolvedTickets.length
        ? resolvedTickets.reduce((sum, t) => sum + (t.resolvedAt!.getTime() - t.createdAt.getTime()), 0) /
          resolvedTickets.length /
          (1000 * 60 * 60)
        : null;

      const csatValues = [
        ...repTickets.map((t) => t.csatRating).filter((r): r is number => r != null),
        ...remoteHandsTasks
          .filter((r) => r.assignedTechnicianId === rep.id)
          .map((r) => r.csatRating)
          .filter((r): r is number => r != null),
      ];
      const avgCsat = csatValues.length ? csatValues.reduce((a, b) => a + b, 0) / csatValues.length : null;

      const touchpoints = engagementLogs.filter((l) => l.loggedByUserId === rep.id).length;

      return {
        rep,
        ticketsResolved: resolvedTickets.length,
        avgResolutionHours,
        touchpoints,
        avgCsat,
      };
    });
  });

  return (
    <div>
      <PageHeader
        title="Team Performance"
        description="A simple KPI table across the CS/ops team — average first-response time isn't tracked yet, so it's left out rather than approximated."
      />

      {rows.length === 0 ? (
        <EmptyState title="No staff to show" />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-5 py-3 font-medium">Rep</th>
                  <th className="px-5 py-3 font-medium">Tickets resolved</th>
                  <th className="px-5 py-3 font-medium">Avg. resolution time</th>
                  <th className="px-5 py-3 font-medium">Touchpoints logged</th>
                  <th className="px-5 py-3 font-medium">Avg. CSAT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => (
                  <tr key={r.rep.id}>
                    <td className="px-5 py-3">
                      <p className="font-medium text-ink-900">{r.rep.name}</p>
                      <p className="text-xs text-slate-400">{r.rep.email}</p>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{r.ticketsResolved}</td>
                    <td className="px-5 py-3 text-slate-600">
                      {r.avgResolutionHours != null ? `${r.avgResolutionHours.toFixed(1)}h` : "—"}
                    </td>
                    <td className="px-5 py-3 text-slate-600">{r.touchpoints}</td>
                    <td className="px-5 py-3 text-slate-600">{r.avgCsat != null ? `${r.avgCsat.toFixed(1)}/5` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
