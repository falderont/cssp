"use client";

import type { AuthorizedAccessEntry, Facility } from "@prisma/client";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/badge";
import { AAL_ACCESS_LEVELS, AAL_ACCESS_LEVEL_LABELS, isAalExpired } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

type Entry = AuthorizedAccessEntry & { facility: Facility };

export function PortalAalTable({ entries }: { entries: Entry[] }) {
  const columns: DataTableColumn<Entry>[] = [
    {
      key: "name",
      header: "Name",
      cell: (e) => (
        <>
          <span className="font-medium text-slate-900">{e.fullName}</span>
          {e.company && <p className="text-xs text-slate-400">{e.company}</p>}
        </>
      ),
      sortValue: (e) => e.fullName,
      searchValue: (e) => `${e.fullName} ${e.company ?? ""}`,
    },
    {
      key: "site",
      header: "Site",
      cell: (e) => e.facility.name,
      sortValue: (e) => e.facility.name,
      filterOptions: Array.from(new Set(entries.map((e) => e.facility.name))).map((v) => ({ label: v, value: v })),
      filterValue: (e) => e.facility.name,
    },
    {
      key: "accessLevel",
      header: "Access level",
      cell: (e) => AAL_ACCESS_LEVEL_LABELS[e.accessLevel] ?? e.accessLevel,
      sortValue: (e) => e.accessLevel,
      filterOptions: AAL_ACCESS_LEVELS.map((l) => ({ label: AAL_ACCESS_LEVEL_LABELS[l], value: l })),
      filterValue: (e) => e.accessLevel,
    },
    { key: "validUntil", header: "Valid until", cell: (e) => (e.validUntil ? formatDate(e.validUntil) : "No expiry"), sortValue: (e) => e.validUntil ?? null },
    {
      key: "status",
      header: "Status",
      cell: (e) => <StatusBadge status={isAalExpired(e) ? "Expired" : e.status} />,
      sortValue: (e) => (isAalExpired(e) ? "Expired" : e.status),
      filterOptions: [
        { label: "Pending approval", value: "PendingApproval" },
        { label: "Active", value: "Active" },
        { label: "Rejected", value: "Rejected" },
        { label: "Revoked", value: "Revoked" },
        { label: "Expired", value: "Expired" },
      ],
      filterValue: (e) => (isAalExpired(e) ? "Expired" : e.status),
    },
  ];

  return (
    <DataTable columns={columns} rows={entries} getRowKey={(e) => e.id} searchPlaceholder="Search by name, company, site…" emptyMessage="No authorized access entries yet." />
  );
}
