import Link from "next/link";
import {
  Building2,
  Map,
  Users,
  Palette,
  ArrowRight,
  ShieldAlert,
  Plug,
  BarChart3,
  ScrollText,
  SlidersHorizontal,
  DatabaseBackup,
  IdCard,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { requireSysAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export default async function AdminIndexPage() {
  await requireSysAdmin();
  const [regions, facilities, accounts, users, blacklistCount, pendingAal] = await Promise.all([
    prisma.region.count(),
    prisma.facility.count(),
    prisma.enterpriseAccount.count(),
    prisma.user.count(),
    prisma.blacklistEntry.count(),
    prisma.authorizedAccessEntry.count({ where: { status: "PendingApproval" } }),
  ]);

  const sections = [
    { href: "/ops/admin/users", icon: Users, title: "User management", description: `${users} user(s) — every persona, internal and tenant.` },
    { href: "/ops/admin/accounts", icon: Building2, title: "Tenant management", description: `${accounts} tenant account(s) — master data & site enrollments.` },
    { href: "/ops/admin/regions", icon: Map, title: "Site management — regions", description: `${regions} region(s) configured.` },
    { href: "/ops/admin/facilities", icon: Building2, title: "Site management — facilities", description: `${facilities} facility(ies) across all regions.` },
    { href: "/ops/admin/integrations", icon: Plug, title: "System integrations", description: "ACS, DCIM, BMS, SSO and email connections." },
    { href: "/ops/admin/stats", icon: BarChart3, title: "System statistics & infographics", description: "Platform-wide charts and KPIs." },
    { href: "/ops/admin/logs", icon: ScrollText, title: "System logs", description: "Audit trail of administrative actions." },
    { href: "/ops/admin/preferences", icon: SlidersHorizontal, title: "Global preferences", description: "Currency, timezone and session defaults." },
    { href: "/ops/admin/backup", icon: DatabaseBackup, title: "Backup & app maintenance", description: "Database snapshots and the maintenance banner." },
    { href: "/ops/admin/branding", icon: Palette, title: "Branding", description: "Company name, logo, colors and support details shown across both portals." },
    { href: "/ops/aal", icon: IdCard, title: "Authorized Access List", description: `${pendingAal} pending approval.` },
    { href: "/ops/admin/blacklist", icon: ShieldAlert, title: "Visitor blacklist", description: `${blacklistCount} entry(ies) — checked automatically before visitor approval.` },
  ];

  return (
    <div>
      <PageHeader title="Admin settings" description="Full platform control — users, tenants, sites, integrations and system health." />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {sections.map((s) => (
          <Link key={s.href} href={s.href}>
            <Card className="h-full transition hover:border-brand/40">
              <CardBody className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                    <s.icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-medium text-slate-900">{s.title}</p>
                    <p className="mt-0.5 text-sm text-slate-500">{s.description}</p>
                  </div>
                </div>
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-slate-300" />
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
