import { PageHeader } from "@/components/ui/page-header";
import { requireSysAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { FacilityHierarchyExplorer, type RegionNode } from "@/components/admin/facility-hierarchy-explorer";

function StatPill({ label, value }: { label: string; value: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-500">
      <span className="font-semibold text-slate-900">{value}</span> {label}
    </span>
  );
}

export default async function FacilitiesPage() {
  await requireSysAdmin();
  const regions = await prisma.region.findMany({
    orderBy: { name: "asc" },
    include: {
      countries: {
        orderBy: { name: "asc" },
        include: {
          cities: {
            orderBy: { name: "asc" },
            include: {
              facilities: {
                orderBy: { name: "asc" },
                include: { _count: { select: { buildings: true, siteEnrollments: true } } },
              },
            },
          },
        },
      },
    },
  });

  const tree: RegionNode[] = regions.map((r) => ({
    id: r.id,
    name: r.name,
    code: r.code,
    countries: r.countries.map((c) => ({
      id: c.id,
      name: c.name,
      code: c.code,
      cities: c.cities.map((ci) => ({
        id: ci.id,
        name: ci.name,
        facilities: ci.facilities.map((f) => ({
          id: f.id,
          name: f.name,
          code: f.code,
          timezone: f.timezone,
          buildingCount: f._count.buildings,
          tenantCount: f._count.siteEnrollments,
        })),
      })),
    })),
  }));

  const countryCount = regions.reduce((n, r) => n + r.countries.length, 0);
  const cityCount = regions.reduce((n, r) => n + r.countries.reduce((m, c) => m + c.cities.length, 0), 0);
  const facilityCount = regions.reduce(
    (n, r) => n + r.countries.reduce((m, c) => m + c.cities.reduce((k, ci) => k + ci.facilities.length, 0), 0),
    0
  );

  return (
    <div>
      <PageHeader
        title="Site management"
        description="The full facility hierarchy on one screen — Region → Country → City → Site. Add a level inline as you drill in, then open a site to manage its buildings and areas."
      />
      <div className="mb-4 flex flex-wrap gap-2">
        <StatPill label="regions" value={regions.length} />
        <StatPill label="countries" value={countryCount} />
        <StatPill label="cities" value={cityCount} />
        <StatPill label="sites" value={facilityCount} />
      </div>
      <FacilityHierarchyExplorer regions={tree} />
    </div>
  );
}
