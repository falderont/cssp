import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { requireMasterDataAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { createFacility } from "@/actions/admin";

export default async function NewFacilityPage() {
  await requireMasterDataAdmin();
  const cities = await prisma.city.findMany({
    include: { country: { include: { region: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <PageHeader title="Add facility" description="Leave the ACS endpoint blank to use the built-in mock adapter for demos." />
      <Card className="max-w-2xl">
        <CardBody>
          {cities.length === 0 ? (
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
                    {cities.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} — {c.country.name} ({c.country.region.name})
                      </option>
                    ))}
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
