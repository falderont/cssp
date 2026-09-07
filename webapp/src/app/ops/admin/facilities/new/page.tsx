import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { requireSysAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { createFacility } from "@/actions/admin";

export default async function NewFacilityPage() {
  await requireSysAdmin();
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
              <label className="flex items-start gap-2 text-sm text-slate-700">
                <input type="checkbox" name="offersColoRacks" defaultChecked className="mt-0.5 h-4 w-4 rounded border-slate-300" />
                <span>
                  This facility offers numbered colo racks
                  <span className="mt-0.5 block text-xs text-slate-500">
                    Uncheck if it leases whole rooms only (data halls, offices, storage). Either way, rooms and racks
                    can be added once the facility is created.
                  </span>
                </span>
              </label>
              <Button type="submit">Add facility</Button>
            </form>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
