import Link from "next/link";
import { Users, Siren, CalendarClock, Wrench, Receipt } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { StatTile } from "@/components/ui/stat-tile";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { requireCustomerUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getCustomerFacilityIds } from "@/lib/scope";
import { formatDateTime, formatMoney } from "@/lib/utils";

export default async function PortalDashboardPage() {
  const user = await requireCustomerUser();
  const facilityIds = await getCustomerFacilityIds(user);
  const accountId = user.enterpriseAccountId;

  const [openServiceRequests, pendingVisitors, activeIncidents, upcomingMaintenance, invoices, recentNotifications] =
    await Promise.all([
      prisma.serviceRequest.count({
        where: { siteEnrollment: { enterpriseAccountId: accountId }, status: { notIn: ["Done", "Cancelled"] } },
      }),
      prisma.visitor.count({
        where: { status: "Pending", visitorRequest: { siteEnrollment: { enterpriseAccountId: accountId } } },
      }),
      prisma.incident.count({ where: { facilityId: { in: facilityIds }, isCustomerVisible: true, status: { not: "Resolved" } } }),
      prisma.maintenanceEvent.count({
        where: { facilityId: { in: facilityIds }, status: { in: ["Scheduled", "InProgress"] } },
      }),
      prisma.invoice.findMany({ where: { enterpriseAccountId: accountId, status: { in: ["Sent", "Overdue"] } } }),
      prisma.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 5 }),
    ]);

  const outstandingTotal = invoices.reduce((s, i) => s + i.total, 0);

  return (
    <div>
      <PageHeader title="Dashboard" description="Everything across your sites, in one place." />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatTile label="Open service requests" value={openServiceRequests} icon={Wrench} tone="blue" />
        <StatTile label="Pending visitors" value={pendingVisitors} icon={Users} tone="amber" />
        <StatTile label="Active incidents" value={activeIncidents} icon={Siren} tone={activeIncidents ? "red" : "slate"} />
        <StatTile label="Upcoming maintenance" value={upcomingMaintenance} icon={CalendarClock} tone="slate" />
        <StatTile label="Outstanding balance" value={formatMoney(outstandingTotal)} icon={Receipt} tone={outstandingTotal ? "amber" : "slate"} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
          </CardHeader>
          <CardBody className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              { href: "/portal/visitors/new", label: "Register a visitor" },
              { href: "/portal/deliveries/new", label: "Expect a delivery" },
              { href: "/portal/service-requests/new", label: "New service request" },
              { href: "/portal/documents", label: "Download Center" },
              { href: "/portal/billing", label: "View invoices" },
              { href: "/portal/telemetry", label: "BMS telemetry" },
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

        <Card>
          <CardHeader>
            <CardTitle>Recent notifications</CardTitle>
          </CardHeader>
          <CardBody>
            {recentNotifications.length === 0 ? (
              <p className="text-sm text-slate-400">Nothing yet.</p>
            ) : (
              <ul className="space-y-3">
                {recentNotifications.map((n) => (
                  <li key={n.id}>
                    <p className="text-sm font-medium text-slate-800">{n.title}</p>
                    <p className="text-xs text-slate-400">{formatDateTime(n.createdAt)}</p>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/portal/notifications" className="mt-3 inline-block text-sm text-brand hover:underline">
              View all
            </Link>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
