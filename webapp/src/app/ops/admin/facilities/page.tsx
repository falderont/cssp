import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { LinkButton } from "@/components/ui/button";
import { Table, THead, TH, TBody, TR, TD, EmptyRow } from "@/components/ui/table";
import { requireMasterDataAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export default async function FacilitiesPage() {
  await requireMasterDataAdmin();
  const facilities = await prisma.facility.findMany({
    include: { city: { include: { country: { include: { region: true } } } }, buildings: true, siteEnrollments: true },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <PageHeader
        title="Facilities (Sites)"
        description="Data center sites — each belongs to a city and can have multiple buildings."
        actions={
          <LinkButton href="/ops/admin/facilities/new">
            <Plus className="h-4 w-4" /> Add facility
          </LinkButton>
        }
      />
      <Table>
        <THead>
          <tr>
            <TH>Name</TH>
            <TH>Code</TH>
            <TH>City</TH>
            <TH>Country</TH>
            <TH>Region</TH>
            <TH>Buildings</TH>
            <TH>Enrolled tenants</TH>
            <TH>ACS integration</TH>
          </tr>
        </THead>
        <TBody>
          {facilities.length === 0 && <EmptyRow colSpan={8} message="No facilities yet." />}
          {facilities.map((f) => (
            <TR key={f.id}>
              <TD>
                <Link href={`/ops/admin/facilities/${f.id}`} className="font-medium text-brand hover:underline">
                  {f.name}
                </Link>
              </TD>
              <TD>{f.code}</TD>
              <TD>{f.city.name}</TD>
              <TD>{f.city.country.name}</TD>
              <TD>{f.city.country.region.name}</TD>
              <TD>{f.buildings.length}</TD>
              <TD>{f.siteEnrollments.length}</TD>
              <TD>{f.acsEndpointUrl ? "Custom endpoint" : "Built-in mock"}</TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </div>
  );
}
