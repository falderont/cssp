"use client";

import type { Country, EnterpriseAccount, Facility, Region, Team, User } from "@prisma/client";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { LinkButton, Button } from "@/components/ui/button";
import { ActionForm } from "@/components/errors/action-form";
import { toggleUserActive } from "@/actions/admin";
import { CS_SCOPE_LABELS, ROLE_LABELS, isInternalRole, type Role } from "@/lib/constants";

type UserRow = User & {
  enterpriseAccount: EnterpriseAccount | null;
  restrictedFacility: Facility | null;
  restrictedRegion: Region | null;
  restrictedCountry: Country | null;
  team: Team | null;
};

function uniqueOptions(values: string[]) {
  return Array.from(new Set(values))
    .sort()
    .map((v) => ({ label: v, value: v }));
}

export function UsersTable({ users }: { users: UserRow[] }) {
  const columns: DataTableColumn<UserRow>[] = [
    {
      key: "name",
      header: "Name",
      cell: (u) => <span className="font-medium text-slate-900">{u.name}</span>,
      sortValue: (u) => u.name,
      searchValue: (u) => `${u.name} ${u.email}`,
    },
    { key: "email", header: "Email", cell: (u) => u.email, sortValue: (u) => u.email, searchValue: (u) => u.email },
    {
      key: "role",
      header: "Role",
      cell: (u) => <Badge tone={isInternalRole(u.role) ? "blue" : "slate"}>{ROLE_LABELS[u.role as Role] ?? u.role}</Badge>,
      sortValue: (u) => ROLE_LABELS[u.role as Role] ?? u.role,
      filterOptions: uniqueOptions(users.map((u) => u.role)).map((o) => ({ label: ROLE_LABELS[o.value as Role] ?? o.value, value: o.value })),
      filterValue: (u) => u.role,
    },
    {
      key: "scope",
      header: "Scope",
      cell: (u) =>
        [
          u.enterpriseAccount?.name,
          u.csScope ? (CS_SCOPE_LABELS[u.csScope as keyof typeof CS_SCOPE_LABELS] ?? u.csScope) : null,
          u.restrictedRegion ? `Region: ${u.restrictedRegion.name}` : null,
          u.restrictedCountry ? `Country: ${u.restrictedCountry.name}` : null,
          u.restrictedFacility ? `${u.restrictedFacility.name} only` : null,
          u.team ? `Team: ${u.team.name}` : null,
        ]
          .filter(Boolean)
          .join(" · ") || "—",
      searchValue: (u) =>
        `${u.enterpriseAccount?.name ?? ""} ${u.restrictedFacility?.name ?? ""} ${u.restrictedRegion?.name ?? ""} ${u.restrictedCountry?.name ?? ""} ${u.team?.name ?? ""}`,
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
    {
      key: "actions",
      header: "Actions",
      cell: (u) => {
        const toggleBound = toggleUserActive.bind(null, u.id, "/ops/admin/users");
        return (
          <div className="flex items-center gap-1.5">
            <LinkButton href={`/ops/admin/users/${u.id}`} size="sm" variant="ghost">
              Edit
            </LinkButton>
            <ActionForm action={toggleBound} silent>
              <Button type="submit" size="sm" variant="ghost">
                {u.isActive ? "Disable" : "Enable"}
              </Button>
            </ActionForm>
          </div>
        );
      },
    },
  ];

  return <DataTable columns={columns} rows={users} getRowKey={(u) => u.id} searchPlaceholder="Search by name or email…" emptyMessage="No users yet." />;
}
