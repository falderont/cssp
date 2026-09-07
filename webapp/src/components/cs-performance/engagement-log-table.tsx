"use client";

import type { EngagementLog, EnterpriseAccount } from "@prisma/client";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { formatDate, humanize } from "@/lib/utils";

type LogRow = EngagementLog & { enterpriseAccount: EnterpriseAccount };

export function EngagementLogTable({ logs }: { logs: LogRow[] }) {
  const columns: DataTableColumn<LogRow>[] = [
    {
      key: "account",
      header: "Account",
      cell: (l) => l.enterpriseAccount.name,
      sortValue: (l) => l.enterpriseAccount.name,
      searchValue: (l) => l.enterpriseAccount.name,
    },
    {
      key: "type",
      header: "Type",
      cell: (l) => <Badge>{humanize(l.type)}</Badge>,
      sortValue: (l) => l.type,
      filterOptions: Array.from(new Set(logs.map((l) => l.type))).map((t) => ({ label: humanize(t), value: t })),
      filterValue: (l) => l.type,
    },
    { key: "notes", header: "Notes", cell: (l) => <span className="block max-w-sm truncate">{l.notes}</span>, searchValue: (l) => l.notes },
    { key: "date", header: "Date", cell: (l) => formatDate(l.occurredAt), sortValue: (l) => l.occurredAt },
  ];

  return (
    <DataTable columns={columns} rows={logs} getRowKey={(l) => l.id} searchPlaceholder="Search touchpoints…" emptyMessage="No touchpoints logged yet." />
  );
}
