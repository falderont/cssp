import Link from "next/link";
import { Users, Siren, CalendarClock, Wrench, Receipt, IdCard, FileBarChart, Truck, FolderDown, Gauge } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { StatTile } from "@/components/ui/stat-tile";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { DonutChart } from "@/components/charts/donut-chart";
import { requireCustomerUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getCustomerFacilityIds } from "@/lib/scope";
import { navForRole, PORTAL_NAV } from "@/components/layout/nav-config";
import { formatDateTime, formatMoney } from "@/lib/utils";
import { ROLES } from "@/lib/constants";

export default async function PortalDashboardPage() {
  const user = await requireCustomerUser();
  const facilityIds = await getCustomerFacilityIds(user);
  const accountId = user.enterpriseAccountId;
  const allowedHrefs = new Set(navForRole(PORTAL_NAV, user.role).map((i) => i.href));
  const isBillingOnly = user.role === ROLES.TENANT_BILLING;

  const [openServiceRequests, pendingVisitors, activeIncidents, upcomingMaintenance, invoices, recentNotifications, pendingAal, srByStatus] =
    await Promise.all([
      allowedHrefs.has("/portal/service-requests")
        ? prisma.serviceRequest.count({
            where: { siteEnrollment: { enterpriseAccountId: accountId }, status: { notIn: ["Done", "Cancelled"] } },
          })
        : 0,
      allowedHrefs.has("/portal/visitors")
        ? prisma.visitor.count({
            where: { status: "Pending", visitorRequest: { siteEnrollment: { enterpriseAccountId: accountId } } },
          })
        : 0,
      allowedHrefs.has("/portal/incidents")
        ? prisma.incident.count({ where: { facilityId: { in: facilityIds }, isCustomerVisible: true, status: { not: "Resolved" } } })
        : 0,
      allowedHrefs.has("/portal/maintenance")
        ? prisma.maintenanceEvent.count({ where: { facilityId: { in: facilityIds }, status: { in: ["Scheduled", "InProgress"] } } })
        : 0,
      prisma.invoice.findMany({ where: { enterpriseAccountId: accountId, status: { in: ["Sent", "Overdue"] } } }),
      prisma.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 5 }),
      allowedHrefs.has("/portal/aal") ? prisma.authorizedAccessEntry.count({ where: { enterpriseAccountId: accountId, status: "PendingApproval" } }) : 0,
      allowedHrefs.has("/portal/service-requests")
        ? prisma.serviceRequest.groupBy({
            by: ["status"],
            _count: { _all: true },
            where: { siteEnrollment: { enterpriseAccountId: accountId } },
          })
        : [],
    ]);

  const outstandingTotal = invoices.reduce((s, i) => s + i.total, 0);
  const srDonut = srByStatus.map((r) => ({ name: r.status, value: r._count._all }));

  const quickActions = [
    { href: "/portal/visitors/new", label: "Register a visitor", icon: Users },
    { href: "/portal/deliveries/new", label: "Expect a delivery", icon: Truck },
    { href: "/portal/aal", label: "Request permanent access", icon: IdCard },
    { href: "/portal/service-requests/new", label: "New service request", icon: Wrench },
    { href: "/portal/documents", label: "Download Center", icon: FolderDown },
    { href: "/portal/billing", label: "View invoices", icon: Receipt },
    { href: "/portal/reports", label: "Generate a report", icon: FileBarChart },
    { href: "/portal/telemetry", label: "BMS telemetry", icon: Gauge },
  ].filter((a) => allowedHrefs.has(a.href.replace(/\/new$/, "")));

  return (
    <div>
      <PageHeader title="Dashboard" description="Everything across your sites, in one place." />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {allowedHrefs.has("/portal/service-requests") && (
          <StatTile label="Open service requests" value={openServiceRequests} icon={Wrench} tone="blue" />
        )}
        {allowedHrefs.has("/portal/visitors") && <StatTile label="Pending visitors" value={pendingVisitors} icon={Users} tone="amber" />}
        {allowedHrefs.has("/portal/incidents") && (
          <StatTile label="Active incidents" value={activeIncidents} icon={Siren} tone={activeIncidents ? "red" : "slate"} />
        )}
        {allowedHrefs.has("/portal/maintenance") && (
          <StatTile label="Upcoming maintenance" value={upcomingMaintenance} icon={CalendarClock} tone="slate" />
        )}
        {allowedHrefs.has("/portal/aal") && (
          <StatTile label="AAL pending approval" value={pendingAal} icon={IdCard} tone={pendingAal ? "amber" : "slate"} />
        )}
        <StatTile
          label="Outstanding balance"
          value={formatMoney(outstandingTotal)}
          icon={Receipt}
          tone={outstandingTotal ? "amber" : "slate"}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className={isBillingOnly ? "lg:col-span-3" : "lg:col-span-2"}>
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
          </CardHeader>
          <CardBody className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {quickActions.map((a) => (
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

        {!isBillingOnly && (
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
        )}
      </div>

      {srDonut.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Service requests by status</CardTitle>
          </CardHeader>
          <CardBody>
            <DonutChart data={srDonut} />
          </CardBody>
        </Card>
      )}
    </div>
  );
}
