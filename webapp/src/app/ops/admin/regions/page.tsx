import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { Table, THead, TH, TBody, TR, TD, EmptyRow } from "@/components/ui/table";
import { Field, Input } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { requireSuperAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { createRegion } from "@/actions/admin";

export default async function RegionsPage() {
  await requireSuperAdmin();
  const regions = await prisma.region.findMany({ include: { facilities: true }, orderBy: { name: "asc" } });

  return (
    <div>
      <PageHeader title="Regions" description="Top-level geography grouping for your facilities." />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Table>
            <THead>
              <tr>
                <TH>Name</TH>
                <TH>Code</TH>
                <TH>Facilities</TH>
              </tr>
            </THead>
            <TBody>
              {regions.length === 0 && <EmptyRow colSpan={3} message="No regions yet." />}
              {regions.map((r) => (
                <TR key={r.id}>
                  <TD className="font-medium text-slate-900">{r.name}</TD>
                  <TD>{r.code}</TD>
                  <TD>{r.facilities.length}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </div>
        <Card>
          <CardBody>
            <p className="mb-3 text-sm font-medium text-slate-700">Add region</p>
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
