"use client";

import Link from "next/link";
import type { City, Country, Facility, Region, TelemetrySource } from "@prisma/client";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";

type FacilityRow = Facility & {
  telemetrySource: TelemetrySource | null;
  city: City & { country: Country & { region: Region } };
};

export function TelemetryTable({ facilities }: { facilities: FacilityRow[] }) {
  const columns: DataTableColumn<FacilityRow>[] = [
    {
      key: "facility",
      header: "Facility",
      cell: (f) => (
        <Link href={`/ops/admin/facilities/${f.id}/service-delivery/telemetry`} className="font-medium text-brand hover:underline">
          {f.name}
        </Link>
      ),
      sortValue: (f) => f.name,
      searchValue: (f) => f.name,
    },
    {
      key: "region",
      header: "Region",
      cell: (f) => f.city.country.region.name,
      sortValue: (f) => f.city.country.region.name,
      filterOptions: uniqueOptions(facilities.map((f) => f.city.country.region.name)),
      filterValue: (f) => f.city.country.region.name,
    },
    { key: "vendor", header: "Vendor", cell: (f) => f.telemetrySource?.vendor ?? "—", sortValue: (f) => f.telemetrySource?.vendor ?? "" },
    {
      key: "status",
      header: "Status",
      cell: (f) => <StatusBadge status={f.telemetrySource?.status ?? "NotConfigured"} />,
      sortValue: (f) => f.telemetrySource?.status ?? "NotConfigured",
      filterOptions: [
        { label: "Not configured", value: "NotConfigured" },
        { label: "Connected", value: "Connected" },
        { label: "Error", value: "Error" },
      ],
      filterValue: (f) => f.telemetrySource?.status ?? "NotConfigured",
    },
    {
      key: "lastSync",
      header: "Last sync",
      cell: (f) => (f.telemetrySource?.lastSyncAt ? formatDateTime(f.telemetrySource.lastSyncAt) : "—"),
      sortValue: (f) => f.telemetrySource?.lastSyncAt ?? null,
    },
  ];

  return (
    <DataTable columns={columns} rows={facilities} getRowKey={(f) => f.id} searchPlaceholder="Search facilities…" emptyMessage="No facilities configured." />
  );
}

function uniqueOptions(values: string[]) {
  return Array.from(new Set(values))
    .sort()
    .map((v) => ({ label: v, value: v }));
}
