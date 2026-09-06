import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { requireMasterDataAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { createFacility } from "@/actions/admin";

export default async function NewFacilityPage() {
  await requireMasterDataAdmin();
  const regions = await prisma.region.findMany({
    include: { countries: { include: { cities: true } } },
    orderBy: { name: "asc" },
  });
  const cityCount = regions.reduce((sum, r) => sum + r.countries.reduce((s, c) => s + c.cities.length, 0), 0);

  return (
    <div>
      <PageHeader title="Add facility" description="Leave the ACS endpoint blank to use the built-in mock adapter for demos." />
      <Card className="max-w-2xl">
        <CardBody>
          {cityCount === 0 ? (
            <p className="text-sm text-slate-500">
              Add a region, country and city under <a href="/ops/admin/areas" className="text-brand hover:underline">Areas</a> before adding a facility.
            </p>
          ) : (
            <form action={createFacility} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Name" htmlFor="name" required>
                  <Input id="name" name="name" required placeholder="e.g. NDP — Batam" />
                </Field>
                <Field label="Code" htmlFor="code" required>
                  <Input id="code" name="code" required placeholder="NDP" />
                </Field>
                <Field label="City" htmlFor="cityId" required>
                  <Select id="cityId" name="cityId" required>
                    {regions.map((r) =>
                      r.countries.every((c) => c.cities.length === 0) ? null : (
                        <optgroup key={r.id} label={r.name}>
                          {r.countries.flatMap((c) =>
                            c.cities.map((city) => (
                              <option key={city.id} value={city.id}>
                                {city.name} — {c.name}
                              </option>
                            ))
                          )}
                        </optgroup>
                      )
                    )}
                  </Select>
                </Field>
                <Field label="Timezone" htmlFor="timezone" required>
                  <Input id="timezone" name="timezone" required defaultValue="Asia/Jakarta" />
                </Field>
              </div>
              <Field label="Address" htmlFor="address">
                <Input id="address" name="address" placeholder="Street address" />
              </Field>
              <Field
                label="Campus access control (ACS) endpoint"
                htmlFor="acsEndpointUrl"
                hint="Optional — leave blank to use the built-in mock adapter"
              >
                <Input id="acsEndpointUrl" name="acsEndpointUrl" placeholder="https://acs.example.com/api/badges" />
              </Field>
              <Button type="submit">Add facility</Button>
            </form>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
