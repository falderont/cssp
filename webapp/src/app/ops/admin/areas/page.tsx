import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { requireMasterDataAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { createCity, createCountry, createRegion } from "@/actions/admin";

export default async function AreasPage() {
  await requireMasterDataAdmin();
  const regions = await prisma.region.findMany({
    include: { countries: { include: { cities: { include: { facilities: true } } } } },
    orderBy: { name: "asc" },
  });
  const countries = regions.flatMap((r) => r.countries);

  return (
    <div>
      <PageHeader
        title="Areas"
        description="Region → Country → City → Site → Building → Room. Owned by Global Sys Admin, delegable to Service Desk."
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {regions.length === 0 && (
            <Card>
              <CardBody className="text-sm text-slate-500">No regions yet — add one to get started.</CardBody>
            </Card>
          )}
          {regions.map((region) => (
            <Card key={region.id}>
              <CardHeader>
                <CardTitle>
                  {region.name} <span className="font-normal text-slate-400">({region.code})</span>
                </CardTitle>
              </CardHeader>
              <CardBody className="space-y-3">
                {region.countries.length === 0 && <p className="text-sm text-slate-500">No countries yet.</p>}
                {region.countries.map((country) => (
                  <div key={country.id} className="rounded-lg border border-slate-100 p-3">
                    <p className="font-medium text-slate-900">
                      {country.name} <span className="font-normal text-slate-400">({country.code})</span>
                    </p>
                    {country.cities.length === 0 ? (
                      <p className="mt-1 text-sm text-slate-500">No cities yet.</p>
                    ) : (
                      <ul className="mt-1.5 flex flex-wrap gap-2">
                        {country.cities.map((city) => (
                          <li key={city.id} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                            {city.name} · {city.facilities.length} site{city.facilities.length === 1 ? "" : "s"}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </CardBody>
            </Card>
          ))}
        </div>

        <div className="space-y-6">
          <Card>
            <CardBody>
              <p className="mb-3 text-sm font-medium text-slate-700">Add region</p>
              <form action={createRegion} className="space-y-3">
                <Field label="Name" htmlFor="regionName" required>
                  <Input id="regionName" name="name" required placeholder="e.g. APAC" />
                </Field>
                <Field label="Code" htmlFor="regionCode" required hint="Short unique code, e.g. APAC">
                  <Input id="regionCode" name="code" required placeholder="APAC" />
                </Field>
                <Button type="submit" className="w-full">
                  Add region
                </Button>
              </form>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <p className="mb-3 text-sm font-medium text-slate-700">Add country</p>
              {regions.length === 0 ? (
                <p className="text-sm text-slate-500">Add a region first.</p>
              ) : (
                <form action={createCountry} className="space-y-3">
                  <Field label="Region" htmlFor="countryRegionId" required>
                    <Select id="countryRegionId" name="regionId" required>
                      {regions.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Name" htmlFor="countryName" required>
                    <Input id="countryName" name="name" required placeholder="e.g. Indonesia" />
                  </Field>
                  <Field label="Code" htmlFor="countryCode" required hint="ISO 3166-1 alpha-2, e.g. ID">
                    <Input id="countryCode" name="code" required maxLength={2} placeholder="ID" />
                  </Field>
                  <Button type="submit" className="w-full">
                    Add country
                  </Button>
                </form>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <p className="mb-3 text-sm font-medium text-slate-700">Add city</p>
              {countries.length === 0 ? (
                <p className="text-sm text-slate-500">Add a country first.</p>
              ) : (
                <form action={createCity} className="space-y-3">
                  <Field label="Country" htmlFor="cityCountryId" required>
                    <Select id="cityCountryId" name="countryId" required>
                      {countries.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.code})
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Name" htmlFor="cityName" required>
                    <Input id="cityName" name="name" required placeholder="e.g. Batam" />
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
    </div>
  );
}
