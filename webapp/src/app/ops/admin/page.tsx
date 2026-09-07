import Link from "next/link";
import { Fragment } from "react";
import {
  Building2,
  Map,
  Globe2,
  Briefcase,
  Users,
  UsersRound,
  Palette,
  ArrowRight,
  ShieldAlert,
  Plug,
  BarChart3,
  ScrollText,
  SlidersHorizontal,
  DatabaseBackup,
  IdCard,
  Ticket,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { StatTile } from "@/components/ui/stat-tile";
import { Table, THead, TH, TBody, TR, TD, EmptyRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { requireSysAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { TEAM_FUNCTION_LABELS, type TeamFunction } from "@/lib/constants";

export default async function AdminIndexPage() {
  await requireSysAdmin();

  const [regions, teams, accounts, userCount, blacklistCount, pendingAal, pendingAreaChanges] = await Promise.all([
    prisma.region.findMany({
      include: {
        countries: {
          include: {
            cities: {
              include: {
                facilities: { include: { buildings: { include: { rooms: true } }, siteEnrollments: true } },
              },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.team.findMany({
      include: { region: true, country: { include: { region: true } }, facility: true, members: true },
      orderBy: { name: "asc" },
    }),
    prisma.enterpriseAccount.findMany({
      include: {
        siteEnrollments: { include: { facility: { include: { city: { include: { country: { include: { region: true } } } } } } } },
      },
    }),
    prisma.user.count(),
    prisma.blacklistEntry.count(),
    prisma.authorizedAccessEntry.count({ where: { status: "PendingApproval" } }),
    prisma.areaChangeRequest.count({ where: { status: { in: ["Submitted", "InReview"] } } }),
  ]);

  const countryCount = regions.reduce((sum, r) => sum + r.countries.length, 0);
  const cityCount = regions.reduce((sum, r) => sum + r.countries.reduce((s, c) => s + c.cities.length, 0), 0);
  const facilityCount = regions.reduce(
    (sum, r) => sum + r.countries.reduce((s, c) => s + c.cities.reduce((s2, ci) => s2 + ci.facilities.length, 0), 0),
    0
  );
  const buildingCount = regions.reduce(
    (sum, r) =>
      sum +
      r.countries.reduce(
        (s, c) => s + c.cities.reduce((s2, ci) => s2 + ci.facilities.reduce((s3, f) => s3 + f.buildings.length, 0), 0),
        0
      ),
    0
  );
  const roomCount = regions.reduce(
    (sum, r) =>
      sum +
      r.countries.reduce(
        (s, c) =>
          s +
          c.cities.reduce(
            (s2, ci) => s2 + ci.facilities.reduce((s3, f) => s3 + f.buildings.reduce((s4, b) => s4 + b.rooms.length, 0), 0),
            0
          ),
        0
      ),
    0
  );

  // Tenant footprint — how many distinct facilities/countries/regions each
  // account spans, so a truly global (multi-region) tenant stands out from
  // one that only ever enrolled at a single site.
  const footprint = accounts
    .map((a) => {
      const facilities = new Set(a.siteEnrollments.map((e) => e.facilityId));
      const countries = new Set(a.siteEnrollments.map((e) => e.facility.city.countryId));
      const regionIds = new Set(a.siteEnrollments.map((e) => e.facility.city.country.regionId));
      return { id: a.id, name: a.name, tier: a.tier, facilities: facilities.size, countries: countries.size, regions: regionIds.size };
    })
    .filter((a) => a.facilities > 0)
    .sort((a, b) => b.regions - a.regions || b.countries - a.countries || b.facilities - a.facilities)
    .slice(0, 6);

  const globalTeams = teams.filter((t) => !t.regionId && !t.countryId && !t.facilityId);

  const quickLinks = [
    {
      section: "People & organization",
      items: [
        { href: "/ops/admin/users", icon: Users, title: "User management", description: `${userCount} user(s) — every persona, internal and tenant.` },
        { href: "/ops/admin/teams", icon: UsersRound, title: "Teams", description: `${teams.length} team(s) covering regions, countries and sites.` },
      ],
    },
    {
      // Region/Country/City/Site are staged on one consolidated screen
      // (Site management, below) — delegable to Service Desk — instead of
      // four separate pages; each level is added inline as you drill in.
      section: "Global geography & tenants",
      items: [
        {
          href: "/ops/admin/facilities",
          icon: Building2,
          title: "Site management",
          description: `${facilityCount} site(s) across ${regions.length} region(s), ${countryCount} countr${countryCount === 1 ? "y" : "ies"}, ${cityCount} cit${cityCount === 1 ? "y" : "ies"}, ${buildingCount} building(s), ${roomCount} room(s) — delegable to Service Desk.`,
        },
        {
          href: "/ops/admin/area-change-requests",
          icon: Ticket,
          title: "Area change requests",
          description: `${pendingAreaChanges} pending — internal requests for master data changes.`,
        },
        { href: "/ops/admin/accounts", icon: Briefcase, title: "Tenant management", description: `${accounts.length} tenant account(s) — master data & site enrollments.` },
      ],
    },
    {
      section: "Platform",
      items: [
        { href: "/ops/admin/integrations", icon: Plug, title: "System integrations", description: "ACS, DCIM, BMS, SSO and email connections." },
        { href: "/ops/admin/stats", icon: BarChart3, title: "System statistics & infographics", description: "Platform-wide charts and KPIs." },
        { href: "/ops/admin/logs", icon: ScrollText, title: "System logs", description: "Audit trail of administrative actions." },
        { href: "/ops/admin/preferences", icon: SlidersHorizontal, title: "Global preferences", description: "Currency, timezone and session defaults." },
        { href: "/ops/admin/backup", icon: DatabaseBackup, title: "Backup & app maintenance", description: "Database snapshots and the maintenance banner." },
        { href: "/ops/admin/branding", icon: Palette, title: "Branding", description: "Company name, logo, colors and support details shown across both portals." },
      ],
    },
    {
      section: "Access & safety",
      items: [
        { href: "/ops/aal", icon: IdCard, title: "Authorized Access List", description: `${pendingAal} pending approval.` },
        { href: "/ops/admin/blacklist", icon: ShieldAlert, title: "Visitor blacklist", description: `${blacklistCount} entry(ies) — checked automatically before visitor approval.` },
      ],
    },
  ];

  return (
    <div>
      <PageHeader
        title="Global overview"
        description="The Global Sys Admin's control tower — every region, country, city, site, tenant and team, at a glance. Master data lives here first; sites and tenants are provisioned against it."
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
        <StatTile label="Regions" value={regions.length} icon={Map} tone="blue" />
        <StatTile label="Countries" value={countryCount} icon={Globe2} tone="blue" />
        <StatTile label="Cities" value={cityCount} icon={Globe2} tone="blue" />
        <StatTile label="Facilities" value={facilityCount} icon={Building2} tone="slate" />
        <StatTile label="Buildings" value={buildingCount} icon={Building2} tone="slate" />
        <StatTile label="Rooms" value={roomCount} icon={Building2} tone="slate" />
        <StatTile label="Tenants (global)" value={accounts.length} icon={Users} tone="green" />
        <StatTile label="Teams" value={teams.length} icon={UsersRound} tone="amber" sub={`${globalTeams.length} company-wide`} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Geography rollup</CardTitle>
          </CardHeader>
          <Table>
            <THead>
              <tr>
                <TH>Region / country</TH>
                <TH>Facilities</TH>
                <TH>Buildings</TH>
                <TH>Tenants enrolled</TH>
              </tr>
            </THead>
            <TBody>
              {regions.length === 0 && <EmptyRow colSpan={4} message="No regions defined yet." />}
              {regions.map((r) => {
                const regionFacilities = r.countries.reduce((s, c) => s + c.cities.reduce((s2, ci) => s2 + ci.facilities.length, 0), 0);
                const regionBuildings = r.countries.reduce(
                  (s, c) => s + c.cities.reduce((s2, ci) => s2 + ci.facilities.reduce((s3, f) => s3 + f.buildings.length, 0), 0),
                  0
                );
                const regionTenants = new Set(
                  r.countries.flatMap((c) => c.cities.flatMap((ci) => ci.facilities.flatMap((f) => f.siteEnrollments.map((e) => e.enterpriseAccountId))))
                );
                return (
                  <Fragment key={r.id}>
                    <TR className="bg-slate-50/60">
                      <TD className="font-medium text-slate-900">{r.name}</TD>
                      <TD className="font-medium">{regionFacilities}</TD>
                      <TD className="font-medium">{regionBuildings}</TD>
                      <TD className="font-medium">{regionTenants.size}</TD>
                    </TR>
                    {r.countries.map((c) => {
                      const facilities = c.cities.reduce((s, ci) => s + ci.facilities.length, 0);
                      const buildings = c.cities.reduce((s, ci) => s + ci.facilities.reduce((s2, f) => s2 + f.buildings.length, 0), 0);
                      const tenants = new Set(c.cities.flatMap((ci) => ci.facilities.flatMap((f) => f.siteEnrollments.map((e) => e.enterpriseAccountId))));
                      return (
                        <TR key={c.id}>
                          <TD className="pl-6 text-slate-600">{c.name}</TD>
                          <TD>{facilities}</TD>
                          <TD>{buildings}</TD>
                          <TD>{tenants.size}</TD>
                        </TR>
                      );
                    })}
                  </Fragment>
                );
              })}
            </TBody>
          </Table>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Global tenant footprint</CardTitle>
          </CardHeader>
          <Table>
            <THead>
              <tr>
                <TH>Tenant</TH>
                <TH>Regions</TH>
                <TH>Countries</TH>
                <TH>Sites</TH>
              </tr>
            </THead>
            <TBody>
              {footprint.length === 0 && <EmptyRow colSpan={4} message="No tenants enrolled at any site yet." />}
              {footprint.map((a) => (
                <TR key={a.id}>
                  <TD>
                    <Link href={`/ops/admin/accounts/${a.id}`} className="font-medium text-brand hover:underline">
                      {a.name}
                    </Link>
                    {a.regions > 1 && (
                      <Badge tone="blue" className="ml-2">
                        Multi-region
                      </Badge>
                    )}
                  </TD>
                  <TD>{a.regions}</TD>
                  <TD>{a.countries}</TD>
                  <TD>{a.facilities}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Teams by coverage</CardTitle>
        </CardHeader>
        <Table>
          <THead>
            <tr>
              <TH>Team</TH>
              <TH>Function</TH>
              <TH>Coverage</TH>
              <TH>Members</TH>
            </tr>
          </THead>
          <TBody>
            {teams.length === 0 && <EmptyRow colSpan={4} message="No teams defined yet — add one under Teams." />}
            {teams.map((t) => (
              <TR key={t.id}>
                <TD className="font-medium text-slate-900">{t.name}</TD>
                <TD>
                  <Badge tone="blue">{TEAM_FUNCTION_LABELS[t.function as TeamFunction] ?? t.function}</Badge>
                </TD>
                <TD>
                  {t.facility ? `Site: ${t.facility.name}` : t.country ? `Country: ${t.country.name} (${t.country.region.name})` : t.region ? `Region: ${t.region.name}` : "Global (company-wide)"}
                </TD>
                <TD>{t.members.length}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Card>

      <div className="mt-8 space-y-6">
        {quickLinks.map((section) => (
          <div key={section.section}>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">{section.section}</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {section.items.map((s) => (
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
        ))}
      </div>
    </div>
  );
}
