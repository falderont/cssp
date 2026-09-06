import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { Table, THead, TH, TBody, TR, TD, EmptyRow } from "@/components/ui/table";
import { Field, Input, Select } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { requireMasterDataAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { createCity } from "@/actions/admin";

export default async function CitiesPage() {
  await requireMasterDataAdmin();
  const [cities, countries] = await Promise.all([
    prisma.city.findMany({ include: { country: { include: { region: true } }, facilities: true }, orderBy: { name: "asc" } }),
    prisma.country.findMany({ include: { region: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader
        title="Cities"
        description="Master data — a city can exist here before any site is added to it. Managed independently; a new site's city is also addable inline while onboarding it under Facilities."
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Table>
            <THead>
              <tr>
                <TH>Name</TH>
                <TH>Country</TH>
                <TH>Region</TH>
                <TH>Sites</TH>
              </tr>
            </THead>
            <TBody>
              {cities.length === 0 && <EmptyRow colSpan={4} message="No cities yet." />}
              {cities.map((c) => (
                <TR key={c.id}>
                  <TD className="font-medium text-slate-900">{c.name}</TD>
                  <TD>{c.country.name}</TD>
                  <TD>{c.country.region.name}</TD>
                  <TD>{c.facilities.length}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </div>
        <Card>
          <CardBody>
            <p className="mb-3 text-sm font-medium text-slate-700">Add city</p>
            {countries.length === 0 ? (
              <p className="text-sm text-slate-500">Create a country first before adding a city.</p>
            ) : (
              <form action={createCity} className="space-y-3">
                <Field label="Country" htmlFor="countryId" required>
                  <Select id="countryId" name="countryId" required>
                    {countries.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.region.name})
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Name" htmlFor="name" required>
                  <Input id="name" name="name" required placeholder="e.g. Batam" />
                </Field>
                <Button type="submit" className="w-full">
                  Add city
                </Button>
              </form>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
