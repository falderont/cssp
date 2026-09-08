"use client";

import type { AuditLog, User } from "@prisma/client";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";

type LogRow = AuditLog & { actor: User | null };

const ACTION_TONES: Record<string, "blue" | "green" | "amber" | "red" | "slate"> = {
  user: "blue",
  tenant: "green",
  facility: "green",
  region: "green",
  country: "green",
  city: "green",
  team: "blue",
  area_change_request: "amber",
  branding: "amber",
  preferences: "amber",
  maintenance: "red",
  backup: "slate",
  integration: "blue",
  changelog: "blue",
};

const CATEGORIES = [
  "user",
  "tenant",
  "facility",
  "region",
  "country",
  "city",
  "team",
  "area_change_request",
  "branding",
  "preferences",
  "maintenance",
  "backup",
  "integration",
  "changelog",
];

export function SystemLogsTable({ logs }: { logs: LogRow[] }) {
  const columns: DataTableColumn<LogRow>[] = [
    { key: "when", header: "When", cell: (l) => <span className="whitespace-nowrap text-xs text-slate-400">{formatDateTime(l.createdAt)}</span>, sortValue: (l) => l.createdAt },
    { key: "actor", header: "Actor", cell: (l) => l.actor?.name ?? "System", sortValue: (l) => l.actor?.name ?? "", searchValue: (l) => l.actor?.name },
    {
      key: "action",
      header: "Action",
      cell: (l) => {
        const category = l.action.split(".")[0];
        return <Badge tone={ACTION_TONES[category] ?? "slate"}>{l.action}</Badge>;
      },
      sortValue: (l) => l.action,
      searchValue: (l) => l.action,
      filterOptions: CATEGORIES.map((c) => ({ label: c, value: c })),
      filterValue: (l) => l.action.split(".")[0],
    },
    { key: "summary", header: "Summary", cell: (l) => <span className="text-sm text-slate-700">{l.summary}</span>, searchValue: (l) => l.summary },
  ];

  return (
    <DataTable
      columns={columns}
      rows={logs}
      getRowKey={(l) => l.id}
      searchPlaceholder="Search actor, action, summary…"
      emptyMessage="No audit events recorded yet."
    />
  );
}
