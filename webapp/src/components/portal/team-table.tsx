"use client";

import Link from "next/link";
import type { Facility, User } from "@prisma/client";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ActionForm } from "@/components/errors/action-form";
import { toggleTenantUserActive } from "@/actions/tenant";
import { ROLE_LABELS, TENANT_ROLES, type Role } from "@/lib/constants";

type UserRow = User & { restrictedFacility: Facility | null };

export function TeamTable({ users, isGlobalAdmin, currentUserId }: { users: UserRow[]; isGlobalAdmin: boolean; currentUserId: string }) {
  const columns: DataTableColumn<UserRow>[] = [
    {
      key: "name",
      header: "Name",
      cell: (u) => <span className="font-medium text-slate-900">{u.name}</span>,
      sortValue: (u) => u.name,
      searchValue: (u) => `${u.name} ${u.email}`,
    },
    { key: "email", header: "Email", cell: (u) => u.email, searchValue: (u) => u.email },
    {
      key: "role",
      header: "Role",
      cell: (u) => (
        <>
          <Badge>{ROLE_LABELS[u.role as Role] ?? u.role}</Badge>
          {u.restrictedFacility && <p className="mt-0.5 text-xs text-slate-400">{u.restrictedFacility.name} only</p>}
        </>
      ),
      sortValue: (u) => ROLE_LABELS[u.role as Role] ?? u.role,
      filterOptions: TENANT_ROLES.map((r) => ({ label: ROLE_LABELS[r], value: r })),
      filterValue: (u) => u.role,
    },
    {
      key: "status",
      header: "Status",
      cell: (u) => <Badge tone={u.isActive ? "green" : "red"}>{u.isActive ? "Active" : "Disabled"}</Badge>,
      sortValue: (u) => (u.isActive ? 1 : 0),
      filterOptions: [
        { label: "Active", value: "active" },
        { label: "Disabled", value: "disabled" },
      ],
      filterValue: (u) => (u.isActive ? "active" : "disabled"),
    },
  ];

  if (isGlobalAdmin) {
    columns.push({
      key: "actions",
      header: "Actions",
      cell: (u) => {
        const toggleBound = toggleTenantUserActive.bind(null, u.id);
        return (
          <div className="flex items-center gap-1.5">
            <Link href={`/portal/settings/users/${u.id}`} className="text-sm text-brand hover:underline">
              Edit
            </Link>
            {u.id !== currentUserId && (
              <ActionForm action={toggleBound} silent>
                <Button type="submit" size="sm" variant="ghost">
                  {u.isActive ? "Disable" : "Enable"}
                </Button>
              </ActionForm>
            )}
          </div>
        );
      },
    });
  }

  return <DataTable columns={columns} rows={users} getRowKey={(u) => u.id} searchPlaceholder="Search by name or email…" emptyMessage="No users yet." />;
}
