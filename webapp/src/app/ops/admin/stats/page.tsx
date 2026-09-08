import { Building2, Users, Wrench, Siren, Receipt, MapPin } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { StatTile } from "@/components/ui/stat-tile";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { DonutChart } from "@/components/charts/donut-chart";
import { SimpleBarChart } from "@/components/charts/bar-chart";
import { AreaTrendChart } from "@/components/charts/area-trend-chart";
import { requireSysAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { isInternalRole, ROLE_LABELS, type Role } from "@/lib/constants";
import { formatMoney } from "@/lib/utils";

export default async function SystemStatsPage() {
  await requireSysAdmin();

  const [tenantCount, facilityCount, userCount, users, serviceRequestsByStatus, incidentsBySeverity, invoices, visitorRequests] =
    await Promise.all([
      prisma.enterpriseAccount.count(),
      prisma.facility.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.findMany({ where: { isActive: true }, select: { role: true } }),
      prisma.serviceRequest.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.incident.groupBy({ by: ["severity"], _count: { _all: true } }),
      prisma.invoice.findMany({ select: { status: true, total: true } }),
      prisma.visitorRequest.findMany({ select: { createdAt: true }, orderBy: { createdAt: "desc" }, take: 500 }),
    ]);

  const roleCounts = new Map<string, number>();
  for (const u of users) roleCounts.set(u.role, (roleCounts.get(u.role) ?? 0) + 1);
  const personaData = Array.from(roleCounts.entries())
    .map(([role, value]) => ({ name: ROLE_LABELS[role as Role] ?? role, value }))
    .sort((a, b) => b.value - a.value);
  const internalCount = users.filter((u) => isInternalRole(u.role)).length;
  const tenantUserCount = users.length - internalCount;

  const srData = serviceRequestsByStatus.map((r) => ({ name: r.status, value: r._count._all }));
  const incidentData = incidentsBySeverity.map((r) => ({ name: r.severity, value: r._count._all })).sort((a, b) => a.name.localeCompare(b.name));

  const invoiceTotal = invoices.reduce((s, i) => s + i.total, 0);
  const invoiceOutstanding = invoices.filter((i) => i.status === "Sent" || i.status === "Overdue").reduce((s, i) => s + i.total, 0);
  const invoiceStatusData = Object.entries(
    invoices.reduce<Record<string, number>>((acc, i) => {
      acc[i.status] = (acc[i.status] ?? 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  const last14Days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    return d.toISOString().slice(0, 10);
  });
  const visitorsByDay = new Map(last14Days.map((d) => [d, 0]));
  for (const vr of visitorRequests) {
    const key = vr.createdAt.toISOString().slice(0, 10);
    if (visitorsByDay.has(key)) visitorsByDay.set(key, (visitorsByDay.get(key) ?? 0) + 1);
  }
  const visitorTrend = Array.from(visitorsByDay.entries()).map(([d, value]) => ({
    name: d.slice(5),
    value,
  }));

  return (
    <div>
      <PageHeader title="System statistics" description="A platform-wide, at-a-glance view across every tenant and site." />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatTile label="Tenants" value={tenantCount} icon={Building2} tone="blue" />
        <StatTile label="Facilities" value={facilityCount} icon={MapPin} tone="slate" />
        <StatTile label="Active users" value={userCount} icon={Users} tone="slate" sub={`${internalCount} internal · ${tenantUserCount} tenant`} />
        <StatTile
          label="Open service requests"
          value={serviceRequestsByStatus.filter((r) => r.status !== "Done" && r.status !== "Cancelled").reduce((s, r) => s + r._count._all, 0)}
          icon={Wrench}
          tone="amber"
        />
        <StatTile label="Ongoing incidents" value={incidentsBySeverity.reduce((s, r) => s + r._count._all, 0)} icon={Siren} tone="red" />
        <StatTile label="Invoiced (lifetime)" value={formatMoney(invoiceTotal)} icon={Receipt} tone="green" sub={`${formatMoney(invoiceOutstanding)} outstanding`} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Visitor requests — last 14 days</CardTitle>
          </CardHeader>
          <CardBody>
            <AreaTrendChart data={visitorTrend} color="#2563eb" />
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Users by persona</CardTitle>
          </CardHeader>
          <CardBody>
            <DonutChart data={personaData} />
          </CardBody>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Service requests by status</CardTitle>
          </CardHeader>
          <CardBody>
            <SimpleBarChart data={srData} color="#2563eb" />
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Incidents by severity</CardTitle>
          </CardHeader>
          <CardBody>
            <SimpleBarChart data={incidentData} color="#ef4444" />
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Invoices by status</CardTitle>
          </CardHeader>
          <CardBody>
            <DonutChart data={invoiceStatusData} />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
