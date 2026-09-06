import Link from "next/link";
import { Users, Siren, CalendarClock, Wrench, Receipt, Building2, MapPin, ShieldAlert, Truck } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { StatTile } from "@/components/ui/stat-tile";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { requireInternalUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatDateTime, formatMoney } from "@/lib/utils";

export default async function OpsDashboardPage() {
  await requireInternalUser();

  const [
    tenantCount,
    facilityCount,
    openServiceRequests,
    pendingVisitors,
    blacklistedVisitors,
    pendingDeliveries,
    ongoingIncidents,
    upcomingMaintenance,
    outstandingInvoices,
  ] = await Promise.all([
    prisma.enterpriseAccount.count(),
    prisma.facility.count(),
    prisma.serviceRequest.count({ where: { status: { notIn: ["Done", "Cancelled"] } } }),
    prisma.visitor.count({ where: { status: "Pending" } }),
    prisma.visitor.count({ where: { status: "Blacklisted" } }),
    prisma.delivery.count({ where: { status: { in: ["Expected", "Arrived"] } } }),
    prisma.incident.findMany({
      where: { status: { not: "Resolved" } },
      include: { facility: true },
      orderBy: { startedAt: "desc" },
    }),
    prisma.maintenanceEvent.count({ where: { status: { in: ["Scheduled", "InProgress"] } } }),
    prisma.invoice.findMany({ where: { status: { in: ["Sent", "Overdue"] } } }),
  ]);

  const outstandingTotal = outstandingInvoices.reduce((s, i) => s + i.total, 0);

  return (
    <div>
      <PageHeader title="Operations dashboard" description="Everything happening across every tenant and site." />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile label="Tenant accounts" value={tenantCount} icon={Building2} tone="slate" />
        <StatTile label="Facilities" value={facilityCount} icon={MapPin} tone="slate" />
        <StatTile label="Open service requests" value={openServiceRequests} icon={Wrench} tone="blue" />
        <StatTile label="Pending visitor approvals" value={pendingVisitors} icon={Users} tone={pendingVisitors ? "amber" : "slate"} />
        <StatTile label="Blacklist flags" value={blacklistedVisitors} icon={ShieldAlert} tone={blacklistedVisitors ? "red" : "slate"} />
        <StatTile label="Pending deliveries" value={pendingDeliveries} icon={Truck} tone="slate" />
        <StatTile label="Upcoming maintenance" value={upcomingMaintenance} icon={CalendarClock} tone="slate" />
        <StatTile label="Outstanding invoices" value={formatMoney(outstandingTotal)} icon={Receipt} tone={outstandingTotal ? "amber" : "slate"} />
      </div>

      {ongoingIncidents.length > 0 && (
        <Card className="mt-6 border-red-200">
          <CardHeader className="flex items-center gap-2">
            <Siren className="h-4 w-4 text-red-500" />
            <CardTitle>Ongoing incidents ({ongoingIncidents.length})</CardTitle>
          </CardHeader>
          <CardBody className="space-y-2">
            {ongoingIncidents.map((inc) => (
              <Link
                key={inc.id}
                href={`/ops/incidents/${inc.id}`}
                className="flex items-center justify-between rounded-lg border border-red-100 bg-red-50/50 px-3 py-2 hover:bg-red-50"
              >
                <div className="flex items-center gap-2">
                  <Badge tone={inc.severity === "P1" || inc.severity === "P2" ? "red" : "amber"}>{inc.severity}</Badge>
                  <Badge tone="slate">{inc.category}</Badge>
                  <span className="text-sm font-medium text-slate-800">{inc.title}</span>
                  <span className="text-xs text-slate-500">{inc.facility.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">{formatDateTime(inc.startedAt)}</span>
                  <StatusBadge status={inc.status} />
                </div>
              </Link>
            ))}
          </CardBody>
        </Card>
      )}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Queues</CardTitle>
        </CardHeader>
        <CardBody className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {[
            { href: "/ops/visitors", label: "Visitor approvals" },
            { href: "/ops/front-desk", label: "Front desk" },
            { href: "/ops/deliveries", label: "Deliveries" },
            { href: "/ops/incidents", label: "Incidents" },
            { href: "/ops/maintenance", label: "Maintenance" },
            { href: "/ops/service-requests", label: "Service requests" },
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
