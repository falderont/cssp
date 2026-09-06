import Link from "next/link";
import { Users, Siren, CalendarClock, Wrench, Receipt, Ticket, Building2, MapPin } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { StatTile } from "@/components/ui/stat-tile";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { requireInternalUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/utils";

export default async function OpsDashboardPage() {
  await requireInternalUser();

  const [
    tenantCount,
    facilityCount,
    openTickets,
    pendingVisitors,
    activeIncidents,
    upcomingMaintenance,
    openRemoteHands,
    outstandingInvoices,
  ] = await Promise.all([
    prisma.enterpriseAccount.count(),
    prisma.facility.count(),
    prisma.ticket.count({ where: { status: { not: "Done" } } }),
    prisma.visitor.count({ where: { status: "Pending" } }),
    prisma.incident.count({ where: { status: { not: "Resolved" } } }),
    prisma.maintenanceEvent.count({ where: { status: { in: ["Scheduled", "InProgress"] } } }),
    prisma.remoteHandsTask.count({ where: { status: { notIn: ["Completed", "Cancelled"] } } }),
    prisma.invoice.findMany({ where: { status: { in: ["Sent", "Overdue"] } } }),
  ]);

  const outstandingTotal = outstandingInvoices.reduce((s, i) => s + i.total, 0);

  return (
    <div>
      <PageHeader title="Operations dashboard" description="Everything happening across every tenant and site." />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile label="Tenant accounts" value={tenantCount} icon={Building2} tone="slate" />
        <StatTile label="Facilities" value={facilityCount} icon={MapPin} tone="slate" />
        <StatTile label="Open tickets" value={openTickets} icon={Ticket} tone="blue" />
        <StatTile label="Pending visitor approvals" value={pendingVisitors} icon={Users} tone={pendingVisitors ? "amber" : "slate"} />
        <StatTile label="Active incidents" value={activeIncidents} icon={Siren} tone={activeIncidents ? "red" : "slate"} />
        <StatTile label="Upcoming maintenance" value={upcomingMaintenance} icon={CalendarClock} tone="slate" />
        <StatTile label="Open remote hands" value={openRemoteHands} icon={Wrench} tone="blue" />
        <StatTile label="Outstanding invoices" value={formatMoney(outstandingTotal)} icon={Receipt} tone={outstandingTotal ? "amber" : "slate"} />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Queues</CardTitle>
        </CardHeader>
        <CardBody className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {[
            { href: "/ops/visitors", label: "Visitor approvals" },
            { href: "/ops/incidents", label: "Incidents" },
            { href: "/ops/maintenance", label: "Maintenance" },
            { href: "/ops/tickets", label: "Ticket queue" },
            { href: "/ops/remote-hands", label: "Remote hands" },
            { href: "/ops/documents", label: "Download Center" },
            { href: "/ops/billing", label: "Billing" },
            { href: "/ops/cs-performance", label: "CS performance" },
          ].map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="rounded-lg border border-slate-200 px-3 py-3 text-center text-sm font-medium text-slate-700 hover:border-brand/40 hover:bg-brand/5"
            >
              {a.label}
            </Link>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
