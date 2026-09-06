import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Table, THead, TH, TBody, TR, TD, EmptyRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/badge";
import { requireInternalUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";

export default async function OpsTelemetryPage() {
  await requireInternalUser();
  const facilities = await prisma.facility.findMany({
    include: { telemetrySource: true, region: true },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <PageHeader
        title="BMS Telemetry"
        description="Optional per-facility integration into your building management system — this mirrors your BMS/DCIM, it doesn't replace it."
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
                <Link href={`/ops/telemetry/${f.id}`} className="font-medium text-brand hover:underline">
                  {f.name}
                </Link>
              </TD>
              <TD>{f.region.name}</TD>
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
