import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { Table, THead, TH, TBody, TR, TD, EmptyRow } from "@/components/ui/table";
import { Field, Input } from "@/components/ui/form";
import { Button, LinkButton } from "@/components/ui/button";
import { requireSysAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { createRegion } from "@/actions/admin";

export default async function RegionsPage() {
  await requireSysAdmin();
  const regions = await prisma.region.findMany({
    include: { countries: { include: { facilities: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <PageHeader
        title="Regions"
        description="Top-level geography — a multi-country grouping. Countries and facilities roll up into the region they belong to."
        actions={
          <LinkButton href="/ops/admin/countries" variant="secondary">
            Manage countries
          </LinkButton>
        }
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Table>
            <THead>
              <tr>
                <TH>Name</TH>
                <TH>Code</TH>
                <TH>Countries</TH>
                <TH>Facilities</TH>
              </tr>
            </THead>
            <TBody>
              {regions.length === 0 && <EmptyRow colSpan={4} message="No regions yet." />}
              {regions.map((r) => {
                const facilityCount = r.countries.reduce((sum, c) => sum + c.facilities.length, 0);
                return (
                  <TR key={r.id}>
                    <TD className="font-medium text-slate-900">{r.name}</TD>
                    <TD>{r.code}</TD>
                    <TD>
                      {r.countries.length === 0
                        ? "—"
                        : r.countries.map((c) => c.name).join(", ")}
                    </TD>
                    <TD>{facilityCount}</TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>
        </div>
        <Card>
          <CardBody>
            <p className="mb-3 text-sm font-medium text-slate-700">Add region</p>
            <p className="mb-3 text-xs text-slate-500">
              Master data — a region can be defined here ahead of any country or site being added to it.
            </p>
            <form action={createRegion} className="space-y-3">
              <Field label="Name" htmlFor="name" required>
                <Input id="name" name="name" required placeholder="e.g. Southeast Asia" />
              </Field>
              <Field label="Code" htmlFor="code" required hint="Short unique code, e.g. APAC">
                <Input id="code" name="code" required placeholder="APAC" />
              </Field>
              <Button type="submit" className="w-full">
                Add region
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
