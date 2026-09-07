"use client";

import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { ROLE_LABELS, type Role } from "@/lib/constants";
import type { RepPerformance } from "@/lib/cs-performance";

export function TeamPerformanceTable({ team }: { team: RepPerformance[] }) {
  const columns: DataTableColumn<RepPerformance>[] = [
    { key: "rep", header: "Rep", cell: (t) => <span className="font-medium text-slate-900">{t.name}</span>, sortValue: (t) => t.name, searchValue: (t) => t.name },
    { key: "role", header: "Role", cell: (t) => ROLE_LABELS[t.role as Role] ?? t.role, sortValue: (t) => t.role },
    { key: "resolved", header: "Resolved", cell: (t) => t.resolvedCount, sortValue: (t) => t.resolvedCount },
    {
      key: "avgResolution",
      header: "Avg resolution time",
      cell: (t) => (t.avgResolutionHrs != null ? `${t.avgResolutionHrs.toFixed(1)} hrs` : "—"),
      sortValue: (t) => t.avgResolutionHrs ?? Infinity,
    },
    { key: "touchpoints", header: "Touchpoints", cell: (t) => t.touchpoints, sortValue: (t) => t.touchpoints },
    {
      key: "csat",
      header: "Avg CSAT",
      cell: (t) => (t.avgCsat != null ? `${t.avgCsat.toFixed(1)} / 5` : "—"),
      sortValue: (t) => t.avgCsat ?? -1,
    },
  ];

  return <DataTable columns={columns} rows={team} getRowKey={(t) => t.userId} searchPlaceholder="Search reps…" emptyMessage="No team data yet." />;
}
