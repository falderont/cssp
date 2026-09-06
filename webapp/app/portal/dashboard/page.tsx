import Link from "next/link";
import { requireSession } from "@/lib/auth/dal";
import { withTenant } from "@/lib/tenant";
import { resolvePortalScope } from "@/lib/portal-scope";
import { PageHeader } from "@/components/ui/page-header";
import { StatTile, Card, EmptyState } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { format } from "date-fns";

export default async function CustomerDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ site?: string }>;
}) {
  const session = await requireSession();
  const { site } = await searchParams;

  const data = await withTenant(session.organizationId, async (tx) => {
    const scope = await resolvePortalScope(tx, session, site);

    // Sequential, not Promise.all: these share one transaction/connection (tx),
    // and node-postgres doesn't support concurrent queries on one connection.
    const pendingVisitors = await tx.visitor.count({
      where: { siteEnrollmentId: { in: scope.siteEnrollmentIds }, status: "PENDING" },
    });
    const openTickets = await tx.ticket.count({
      where: { siteEnrollmentId: { in: scope.siteEnrollmentIds }, status: { in: ["OPEN", "IN_PROGRESS", "WAITING_ON_CUSTOMER"] } },
    });
    const activeRemoteHands = await tx.remoteHandsTask.count({
      where: { siteEnrollmentId: { in: scope.siteEnrollmentIds }, status: { in: ["SUBMITTED", "ACCEPTED", "IN_PROGRESS"] } },
    });
    const upcomingIncidents = await tx.incidentOrMaintenance.findMany({
      where: { facilityId: { in: scope.facilityIds }, status: { in: ["SCHEDULED", "IN_PROGRESS", "MONITORING"] } },
      include: { facility: true },
      orderBy: { startAt: "asc" },
      take: 5,
    });
    const recentDocuments = await tx.document.count({ where: { enterpriseAccountId: session.enterpriseAccountId! } });

    return { scope, pendingVisitors, openTickets, activeRemoteHands, upcomingIncidents, recentDocuments };
  });

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description={
          data.scope.selected === "all"
            ? "Roll-up across every site you're enrolled at."
            : `Scoped to ${data.scope.enrollments.find((e) => e.id === data.scope.selected)?.facility.name}.`
        }
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatTile label="Pending Visitors" value={data.pendingVisitors} />
        <StatTile label="Open Tickets" value={data.openTickets} />
        <StatTile label="Active Remote Hands" value={data.activeRemoteHands} />
        <StatTile label="Active Incidents / Maint." value={data.upcomingIncidents.length} />
        <StatTile label="Documents Available" value={data.recentDocuments} />
      </div>

      <div className="mt-8">
        <h2 className="mb-3 font-display text-lg font-semibold text-ink-900">Incidents & Maintenance</h2>
        {data.upcomingIncidents.length === 0 ? (
          <EmptyState title="Nothing active right now" description="Scheduled maintenance and open incidents will show up here." />
        ) : (
          <Card>
            <ul className="divide-y divide-slate-100">
              {data.upcomingIncidents.map((i) => (
                <li key={i.id} className="flex items-center justify-between px-5 py-4">
                  <div>
                    <p className="text-sm font-medium text-ink-900">{i.title}</p>
                    <p className="text-xs text-slate-400">
                      {i.facility.name} · {format(i.startAt, "MMM d, yyyy")}
                    </p>
                  </div>
                  <StatusBadge status={i.status} />
                </li>
              ))}
            </ul>
          </Card>
        )}
        <Link href="/portal/incidents" className="mt-3 inline-block text-sm font-medium text-brand-600 hover:underline">
          View all incidents & maintenance →
        </Link>
      </div>
    </div>
  );
}
