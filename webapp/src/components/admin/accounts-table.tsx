"use client";

import Link from "next/link";
import type { EnterpriseAccount, SiteEnrollment, User } from "@prisma/client";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Badge, StatusBadge } from "@/components/ui/badge";

type Account = EnterpriseAccount & { siteEnrollments: SiteEnrollment[]; users: User[] };

export function AccountsTable({ accounts }: { accounts: Account[] }) {
  const columns: DataTableColumn<Account>[] = [
    {
      key: "name",
      header: "Name",
      cell: (a) => (
        <Link href={`/ops/admin/accounts/${a.id}`} className="font-medium text-brand hover:underline">
          {a.name}
        </Link>
      ),
      sortValue: (a) => a.name,
      searchValue: (a) => a.name,
    },
    {
      key: "tier",
      header: "Tier",
      cell: (a) => <Badge>{a.tier}</Badge>,
      sortValue: (a) => a.tier,
      filterOptions: uniqueOptions(accounts.map((a) => a.tier)),
      filterValue: (a) => a.tier,
    },
    { key: "sites", header: "Sites enrolled", cell: (a) => a.siteEnrollments.length, sortValue: (a) => a.siteEnrollments.length },
    { key: "users", header: "Users", cell: (a) => a.users.length, sortValue: (a) => a.users.length },
    {
      key: "status",
      header: "Status",
      cell: (a) => <StatusBadge status={a.status} />,
      sortValue: (a) => a.status,
      filterOptions: uniqueOptions(accounts.map((a) => a.status)),
      filterValue: (a) => a.status,
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={accounts}
      getRowKey={(a) => a.id}
      searchPlaceholder="Search tenant accounts…"
      emptyMessage="No tenant accounts yet."
    />
  );
}

function uniqueOptions(values: string[]) {
  return Array.from(new Set(values))
    .sort()
    .map((v) => ({ label: v, value: v }));
}
