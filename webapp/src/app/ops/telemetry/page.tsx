import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Table, THead, TH, TBody, TR, TD, EmptyRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/badge";
import { requireInternalUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getOpsFacilityIds } from "@/lib/scope";
import { formatDateTime } from "@/lib/utils";

// Telemetry (BMS) now lives entirely as a tab on each site's own management
// page — a viewer pinned to one facility goes straight there. This stays as
// a picker for anyone who can see more than one site.
export default async function OpsTelemetryPage() {
  const user = await requireInternalUser();
  if (user.restrictedFacilityId) redirect(`/ops/admin/facilities/${user.restrictedFacilityId}/service-delivery/telemetry`);
  const scopedFacilityIds = await getOpsFacilityIds(user);
  const facilities = await prisma.facility.findMany({
    where: scopedFacilityIds ? { id: { in: scopedFacilityIds } } : undefined,
    include: { telemetrySource: true, city: { include: { country: { include: { region: true } } } } },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <PageHeader
        title="BMS Telemetry"
        description="Optional per-facility integration into your building management system — pick a site to view its telemetry and integration settings."
      />
      <Table>
        <THead>
          <tr>
            <TH>Facility</TH>
            <TH>Region</TH>
            <TH>Vendor</TH>
            <TH>Status</TH>
            <TH>Last sync</TH>
          </tr>
        </THead>
        <TBody>
          {facilities.length === 0 && <EmptyRow colSpan={5} message="No facilities configured." />}
          {facilities.map((f) => (
            <TR key={f.id}>
              <TD>
                <Link href={`/ops/admin/facilities/${f.id}/service-delivery/telemetry`} className="font-medium text-brand hover:underline">
                  {f.name}
                </Link>
              </TD>
              <TD>{f.city.country.region.name}</TD>
              <TD>{f.telemetrySource?.vendor ?? "—"}</TD>
              <TD>
                <StatusBadge status={f.telemetrySource?.status ?? "NotConfigured"} />
              </TD>
              <TD>{f.telemetrySource?.lastSyncAt ? formatDateTime(f.telemetrySource.lastSyncAt) : "—"}</TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </div>
  );
}
