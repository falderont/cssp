"use client";

import Link from "next/link";
import type { Building, Facility, Incident } from "@prisma/client";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";

type IncidentRow = Incident & { facility: Facility; building: Building | null };

function uniqueOptions(values: string[]) {
  return Array.from(new Set(values))
    .sort()
    .map((v) => ({ label: v, value: v }));
}

export function IncidentsTable({ incidents }: { incidents: IncidentRow[] }) {
  const columns: DataTableColumn<IncidentRow>[] = [
    {
      key: "title",
      header: "Title",
      cell: (i) => (
        <Link href={`/ops/incidents/${i.id}`} className="font-medium text-brand hover:underline">
          {i.title}
        </Link>
      ),
      sortValue: (i) => i.title,
      searchValue: (i) => i.title,
    },
    {
      key: "category",
      header: "Category",
      cell: (i) => <Badge tone="slate">{i.category}</Badge>,
      sortValue: (i) => i.category,
      filterOptions: uniqueOptions(incidents.map((i) => i.category)),
      filterValue: (i) => i.category,
    },
    {
      key: "location",
      header: "Facility / location",
      cell: (i) => (
        <>
          {i.facility.name}
          {i.building ? ` · ${i.building.name}` : ""}
          {i.locationDetail && <p className="text-xs text-slate-400">{i.locationDetail}</p>}
        </>
      ),
      sortValue: (i) => i.facility.name,
      searchValue: (i) => `${i.facility.name} ${i.building?.name ?? ""} ${i.locationDetail ?? ""}`,
      filterOptions: uniqueOptions(incidents.map((i) => i.facility.name)),
      filterValue: (i) => i.facility.name,
    },
    {
      key: "severity",
      header: "Severity",
      cell: (i) => <Badge tone={i.severity === "P1" || i.severity === "P2" ? "red" : "amber"}>{i.severity}</Badge>,
      sortValue: (i) => i.severity,
      filterOptions: uniqueOptions(incidents.map((i) => i.severity)),
      filterValue: (i) => i.severity,
    },
    {
      key: "status",
      header: "Status",
      cell: (i) => <StatusBadge status={i.status} />,
      sortValue: (i) => i.status,
      filterOptions: uniqueOptions(incidents.map((i) => i.status)),
      filterValue: (i) => i.status,
    },
    { key: "visible", header: "Visible to tenants", cell: (i) => (i.isCustomerVisible ? "Yes" : "No"), sortValue: (i) => (i.isCustomerVisible ? 1 : 0) },
    { key: "started", header: "Started", cell: (i) => formatDateTime(i.startedAt), sortValue: (i) => i.startedAt },
  ];

  return (
    <DataTable columns={columns} rows={incidents} getRowKey={(i) => i.id} searchPlaceholder="Search incidents…" emptyMessage="No incidents posted yet." />
  );
}
