import Link from "next/link";
import { Building2, Map, Users, Palette, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { requireSuperAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export default async function AdminIndexPage() {
  await requireSuperAdmin();
  const [regions, facilities, accounts, users] = await Promise.all([
    prisma.region.count(),
    prisma.facility.count(),
    prisma.enterpriseAccount.count(),
    prisma.user.count(),
  ]);

  const sections = [
    { href: "/ops/admin/branding", icon: Palette, title: "Branding", description: "Company name, logo, colors and support details shown across both portals." },
    { href: "/ops/admin/regions", icon: Map, title: "Regions", description: `${regions} region(s) configured.` },
    { href: "/ops/admin/facilities", icon: Building2, title: "Facilities & buildings", description: `${facilities} facility(ies) across all regions.` },
    { href: "/ops/admin/accounts", icon: Users, title: "Tenant accounts & site enrollments", description: `${accounts} enterprise account(s).` },
    { href: "/ops/admin/users", icon: Users, title: "Users", description: `${users} user(s), internal and tenant.` },
  ];

  return (
    <div>
      <PageHeader title="Admin settings" description="Multi-region, multi-site, multi-tenant setup and platform branding." />
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
