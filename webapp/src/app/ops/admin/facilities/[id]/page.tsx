import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TH, TBody, TR, TD, EmptyRow } from "@/components/ui/table";
import { Field, Input } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { requireSysAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { createBuilding, updateFacilityAcs } from "@/actions/admin";

export default async function FacilityDetailPage({ params }: { params: { id: string } }) {
  await requireSysAdmin();
  const facility = await prisma.facility.findUnique({
    where: { id: params.id },
    include: { region: true, buildings: true, siteEnrollments: { include: { enterpriseAccount: true } } },
  });
  if (!facility) notFound();

  const addBuildingBound = createBuilding.bind(null, facility.id);
  const updateAcsBound = updateFacilityAcs.bind(null, facility.id);

  return (
    <div>
      <PageHeader title={facility.name} description={`${facility.region.name} · ${facility.code}`} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Buildings</CardTitle>
            </CardHeader>
            <Table>
              <THead>
                <tr>
                  <TH>Name</TH>
                  <TH>Code</TH>
                </tr>
              </THead>
              <TBody>
                {facility.buildings.length === 0 && <EmptyRow colSpan={2} message="No buildings added yet." />}
                {facility.buildings.map((b) => (
                  <TR key={b.id}>
                    <TD>{b.name}</TD>
                    <TD>{b.code}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
            <CardBody className="border-t border-slate-100">
              <form action={addBuildingBound} className="flex flex-wrap items-end gap-3">
                <div className="flex-1">
                  <Field label="Building name" htmlFor="name" required>
                    <Input id="name" name="name" required placeholder="e.g. Building B" />
                  </Field>
                </div>
                <div className="flex-1">
                  <Field label="Code" htmlFor="code" required>
                    <Input id="code" name="code" required placeholder="B" />
                  </Field>
                </div>
                <Button type="submit">Add building</Button>
              </form>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Enrolled tenants</CardTitle>
            </CardHeader>
            <Table>
              <THead>
                <tr>
                  <TH>Tenant</TH>
                  <TH>Space</TH>
                  <TH>Status</TH>
                </tr>
              </THead>
              <TBody>
                {facility.siteEnrollments.length === 0 && <EmptyRow colSpan={3} message="No tenants enrolled at this facility yet." />}
                {facility.siteEnrollments.map((e) => (
                  <TR key={e.id}>
                    <TD>{e.enterpriseAccount.name}</TD>
                    <TD>{e.spaceRef ?? "—"}</TD>
                    <TD>{e.status}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Access control integration</CardTitle>
          </CardHeader>
          <CardBody>
            <form action={updateAcsBound} className="space-y-3">
              <Field
                label="ACS endpoint"
                htmlFor="acsEndpointUrl"
                hint="Leave blank to use the built-in mock adapter for demos"
              >
                <Input id="acsEndpointUrl" name="acsEndpointUrl" defaultValue={facility.acsEndpointUrl ?? ""} placeholder="https://acs.example.com/api/badges" />
              </Field>
              <Button type="submit" className="w-full" variant="secondary">
                Save
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
