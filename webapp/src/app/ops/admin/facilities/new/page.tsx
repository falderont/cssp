import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { requireSysAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { createFacility } from "@/actions/admin";

export default async function NewFacilityPage() {
  await requireSysAdmin();
  const regions = await prisma.region.findMany({ include: { countries: true }, orderBy: { name: "asc" } });
  const countryCount = regions.reduce((sum, r) => sum + r.countries.length, 0);

  return (
    <div>
      <PageHeader title="Add facility" description="Leave the ACS endpoint blank to use the built-in mock adapter for demos." />
      <Card className="max-w-2xl">
        <CardBody>
          {countryCount === 0 ? (
            <p className="text-sm text-slate-500">Create a region and a country first before adding a facility.</p>
          ) : (
            <form action={createFacility} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Name" htmlFor="name" required>
                  <Input id="name" name="name" required placeholder="e.g. JKT-01 — Jakarta" />
                </Field>
                <Field label="Code" htmlFor="code" required>
                  <Input id="code" name="code" required placeholder="JKT-01" />
                </Field>
                <Field label="Country" htmlFor="countryId" required>
                  <Select id="countryId" name="countryId" required>
                    {regions.map((r) =>
                      r.countries.length === 0 ? null : (
                        <optgroup key={r.id} label={r.name}>
                          {r.countries.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
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
