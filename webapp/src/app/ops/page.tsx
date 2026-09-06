import Link from "next/link";
import { Users, Siren, CalendarClock, Wrench, Receipt, Building2, MapPin, ShieldAlert, Truck, IdCard, Trophy } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { StatTile } from "@/components/ui/stat-tile";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { DonutChart } from "@/components/charts/donut-chart";
import { requireInternalUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getOpsFacilityIds } from "@/lib/scope";
import { navForRole, OPS_NAV } from "@/components/layout/nav-config";
import { formatDateTime, formatMoney } from "@/lib/utils";
import { ROLES } from "@/lib/constants";

export default async function OpsDashboardPage() {
  const user = await requireInternalUser();
  const scopedFacilityIds = await getOpsFacilityIds(user);
  const facilityWhere = scopedFacilityIds ? { in: scopedFacilityIds } : undefined;
  const allowedHrefs = new Set(navForRole(OPS_NAV, user.role).map((i) => i.href));
  const isVendor = user.role === ROLES.OPS_VENDOR;

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
    serviceRequestsByStatus,
  ] = await Promise.all([
    prisma.enterpriseAccount.count(),
    scopedFacilityIds ? scopedFacilityIds.length : prisma.facility.count(),
    prisma.serviceRequest.count({
      where: {
        status: { notIn: ["Done", "Cancelled"] },
        ...(facilityWhere ? { siteEnrollment: { facilityId: facilityWhere } } : {}),
        ...(isVendor ? { assignedToId: user.id } : {}),
      },
    }),
    prisma.visitor.count({
      where: { status: "Pending", ...(facilityWhere ? { visitorRequest: { siteEnrollment: { facilityId: facilityWhere } } } : {}) },
    }),
    prisma.visitor.count({
      where: { status: "Blacklisted", ...(facilityWhere ? { visitorRequest: { siteEnrollment: { facilityId: facilityWhere } } } : {}) },
    }),
    prisma.delivery.count({ where: { status: { in: ["Expected", "Arrived"] }, ...(facilityWhere ? { facilityId: facilityWhere } : {}) } }),
    prisma.incident.findMany({
      where: { status: { not: "Resolved" }, ...(facilityWhere ? { facilityId: facilityWhere } : {}) },
      include: { facility: true },
      orderBy: { startedAt: "desc" },
    }),
    prisma.maintenanceEvent.count({
      where: { status: { in: ["Scheduled", "InProgress"] }, ...(facilityWhere ? { facilityId: facilityWhere } : {}) },
    }),
    prisma.invoice.findMany({ where: { status: { in: ["Sent", "Overdue"] } } }),
    prisma.serviceRequest.groupBy({
      by: ["status"],
      _count: { _all: true },
      where: {
        ...(facilityWhere ? { siteEnrollment: { facilityId: facilityWhere } } : {}),
        ...(isVendor ? { assignedToId: user.id } : {}),
      },
    }),
  ]);

  const outstandingTotal = outstandingInvoices.reduce((s, i) => s + i.total, 0);
  const srDonut = serviceRequestsByStatus.map((r) => ({ name: r.status, value: r._count._all }));

  const queues = [
    { href: "/ops/visitors", label: "Visitor approvals", icon: Users },
    { href: "/ops/front-desk", label: "Front desk", icon: IdCard },
    { href: "/ops/deliveries", label: "Deliveries", icon: Truck },
    { href: "/ops/incidents", label: "Incidents", icon: Siren },
    { href: "/ops/maintenance", label: "Maintenance", icon: CalendarClock },
    { href: "/ops/service-requests", label: "Service requests", icon: Wrench },
    { href: "/ops/documents", label: "Download Center", icon: Building2 },
    { href: "/ops/billing", label: "Billing", icon: Receipt },
    { href: "/ops/cs-performance", label: "CS performance", icon: Trophy },
  ].filter((q) => allowedHrefs.has(q.href));

  return (
    <div>
      <PageHeader
        title="Operations dashboard"
        description={scopedFacilityIds ? "Everything happening at your site(s)." : "Everything happening across every tenant and site."}
      />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {!isVendor && <StatTile label="Tenant accounts" value={tenantCount} icon={Building2} tone="slate" />}
        <StatTile label="Facilities" value={facilityCount} icon={MapPin} tone="slate" />
        <StatTile label={isVendor ? "My open tasks" : "Open service requests"} value={openServiceRequests} icon={Wrench} tone="blue" />
        {allowedHrefs.has("/ops/visitors") && (
          <StatTile label="Pending visitor approvals" value={pendingVisitors} icon={Users} tone={pendingVisitors ? "amber" : "slate"} />
        )}
        {allowedHrefs.has("/ops/admin/blacklist") && (
          <StatTile label="Blacklist flags" value={blacklistedVisitors} icon={ShieldAlert} tone={blacklistedVisitors ? "red" : "slate"} />
        )}
        {allowedHrefs.has("/ops/deliveries") && <StatTile label="Pending deliveries" value={pendingDeliveries} icon={Truck} tone="slate" />}
        {allowedHrefs.has("/ops/maintenance") && (
          <StatTile label="Upcoming maintenance" value={upcomingMaintenance} icon={CalendarClock} tone="slate" />
        )}
        {allowedHrefs.has("/ops/billing") && (
          <StatTile label="Outstanding invoices" value={formatMoney(outstandingTotal)} icon={Receipt} tone={outstandingTotal ? "amber" : "slate"} />
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {ongoingIncidents.length > 0 && allowedHrefs.has("/ops/incidents") && (
          <Card className="border-red-200 lg:col-span-2">
            <CardHeader className="flex items-center gap-2">
              <Siren className="h-4 w-4 text-red-500" />
              <CardTitle>Ongoing incidents ({ongoingIncidents.length})</CardTitle>
            </CardHeader>
            <CardBody className="space-y-2">
              {ongoingIncidents.slice(0, 6).map((inc) => (
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

        {srDonut.length > 0 && allowedHrefs.has("/ops/service-requests") && (
          <Card>
            <CardHeader>
              <CardTitle>{isVendor ? "My tasks by status" : "Service requests by status"}</CardTitle>
            </CardHeader>
            <CardBody>
              <DonutChart data={srDonut} />
            </CardBody>
          </Card>
        )}
      </div>

      {queues.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Queues</CardTitle>
          </CardHeader>
          <CardBody className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {queues.map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className="flex flex-col items-center gap-2 rounded-lg border border-slate-200 px-3 py-4 text-center text-sm font-medium text-slate-700 transition hover:-translate-y-0.5 hover:border-brand/40 hover:bg-brand/5 hover:shadow-sm"
              >
                <a.icon className="h-5 w-5 text-brand" />
                {a.label}
              </Link>
            ))}
          </CardBody>
        </Card>
      )}
    </div>
  );
}
