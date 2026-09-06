import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { Table, THead, TH, TBody, TR, TD, EmptyRow } from "@/components/ui/table";
import { Field, Input, Select } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { requireMasterDataAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { createCountry } from "@/actions/admin";

export default async function CountriesPage() {
  await requireMasterDataAdmin();
  const [countries, regions] = await Promise.all([
    prisma.country.findMany({ include: { region: true, cities: true }, orderBy: { name: "asc" } }),
    prisma.region.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader
        title="Countries"
        description="Master data — a country can exist here before any city or site is added to it. Managed independently; a new site's country is also addable inline while onboarding it under Facilities."
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Table>
            <THead>
              <tr>
                <TH>Name</TH>
                <TH>Code</TH>
                <TH>Region</TH>
                <TH>Cities</TH>
              </tr>
            </THead>
            <TBody>
              {countries.length === 0 && <EmptyRow colSpan={4} message="No countries yet." />}
              {countries.map((c) => (
                <TR key={c.id}>
                  <TD className="font-medium text-slate-900">{c.name}</TD>
                  <TD>{c.code}</TD>
                  <TD>{c.region.name}</TD>
                  <TD>{c.cities.length}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </div>
        <Card>
          <CardBody>
            <p className="mb-3 text-sm font-medium text-slate-700">Add country</p>
            {regions.length === 0 ? (
              <p className="text-sm text-slate-500">Create a region first before adding a country.</p>
            ) : (
              <form action={createCountry} className="space-y-3">
                <Field label="Region" htmlFor="regionId" required>
                  <Select id="regionId" name="regionId" required>
                    {regions.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Name" htmlFor="name" required>
                  <Input id="name" name="name" required placeholder="e.g. Indonesia" />
                </Field>
                <Field label="Code" htmlFor="code" required hint="ISO 3166-1 alpha-2, e.g. ID">
                  <Input id="code" name="code" required maxLength={2} placeholder="ID" />
                </Field>
                <Button type="submit" className="w-full">
                  Add country
                </Button>
              </form>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
