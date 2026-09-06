import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { requireMasterDataAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { FacilityForm } from "@/components/admin/facility-form";

export default async function NewFacilityPage() {
  await requireMasterDataAdmin();
  const regions = await prisma.region.findMany({
    include: { countries: { include: { cities: true }, orderBy: { name: "asc" } } },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <PageHeader
        title="Onboard a new site"
        description="Contract signed and ready to onboard — add the country and city here if this is a new location, then set up the site. Leave the ACS endpoint blank to use the built-in mock adapter for demos."
      />
      <Card className="max-w-2xl">
        <CardBody>
          {regions.length === 0 ? (
            <p className="text-sm text-slate-500">
              Add a region first under <a href="/ops/admin/regions" className="text-brand hover:underline">Regions</a> before onboarding a site.
            </p>
          ) : (
            <FacilityForm regions={regions} />
          )}
        </CardBody>
      </Card>
    </div>
  );
}
