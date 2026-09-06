import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { requireSuperAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { createFacility } from "@/actions/admin";

export default async function NewFacilityPage() {
  await requireSuperAdmin();
  const regions = await prisma.region.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <PageHeader title="Add facility" description="Leave the ACS endpoint blank to use the built-in mock adapter for demos." />
      <Card className="max-w-2xl">
        <CardBody>
          {regions.length === 0 ? (
            <p className="text-sm text-slate-500">Create a region first before adding a facility.</p>
          ) : (
            <form action={createFacility} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Name" htmlFor="name" required>
                  <Input id="name" name="name" required placeholder="e.g. JKT-01 — Jakarta" />
                </Field>
                <Field label="Code" htmlFor="code" required>
                  <Input id="code" name="code" required placeholder="JKT-01" />
                </Field>
                <Field label="Region" htmlFor="regionId" required>
                  <Select id="regionId" name="regionId" required>
                    {regions.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
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
