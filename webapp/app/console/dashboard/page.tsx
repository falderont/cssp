import { requireSession } from "@/lib/auth/dal";
import { withTenant } from "@/lib/tenant";
import { PageHeader } from "@/components/ui/page-header";
import { StatTile } from "@/components/ui/card";

export default async function ConsoleDashboardPage() {
  const session = await requireSession();

  const stats = await withTenant(session.organizationId, async (tx) => {
    // Sequential, not Promise.all — see app/portal/dashboard/page.tsx's comment.
    const pendingVisitors = await tx.visitor.count({ where: { status: "PENDING" } });
    const openTickets = await tx.ticket.count({ where: { status: { in: ["OPEN", "IN_PROGRESS", "WAITING_ON_CUSTOMER"] } } });
    const activeRemoteHands = await tx.remoteHandsTask.count({ where: { status: { in: ["SUBMITTED", "ACCEPTED", "IN_PROGRESS"] } } });
    const activeIncidents = await tx.incidentOrMaintenance.count({ where: { status: { in: ["SCHEDULED", "IN_PROGRESS", "MONITORING"] } } });
    const enterpriseAccounts = await tx.enterpriseAccount.count();
    const facilities = await tx.facility.count();
    return { pendingVisitors, openTickets, activeRemoteHands, activeIncidents, enterpriseAccounts, facilities };
  });

  return (
    <div>
      <PageHeader title="Provider Console" description="Everything across every account and site you operate." />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatTile label="Pending Visitors" value={stats.pendingVisitors} />
        <StatTile label="Open Tickets" value={stats.openTickets} />
        <StatTile label="Active Remote Hands" value={stats.activeRemoteHands} />
        <StatTile label="Active Incidents / Maint." value={stats.activeIncidents} />
        <StatTile label="Enterprise Accounts" value={stats.enterpriseAccounts} />
        <StatTile label="Facilities" value={stats.facilities} />
      </div>
    </div>
  );
}
