"use client";

import type { AuthorizedAccessEntry, EnterpriseAccount, SiteEnrollment } from "@prisma/client";
import { Plus } from "lucide-react";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { ActionForm } from "@/components/errors/action-form";
import { decideAalEntry, revokeAalEntry, createAalEntryOps } from "@/actions/aal";
import { AAL_ACCESS_LEVELS, AAL_ACCESS_LEVEL_LABELS, isAalExpired } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

type Entry = AuthorizedAccessEntry & { enterpriseAccount: EnterpriseAccount };
type Enrollment = SiteEnrollment & { enterpriseAccount: EnterpriseAccount };

function uniqueOptions(values: string[]) {
  return Array.from(new Set(values))
    .sort()
    .map((v) => ({ label: v, value: v }));
}

export function FacilityAalTable({ entries, canDecide, enrollments }: { entries: Entry[]; canDecide: boolean; enrollments: Enrollment[] }) {
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
      key: "tenant",
      header: "Tenant",
      cell: (e) => e.enterpriseAccount.name,
      sortValue: (e) => e.enterpriseAccount.name,
      searchValue: (e) => e.enterpriseAccount.name,
      filterOptions: uniqueOptions(entries.map((e) => e.enterpriseAccount.name)),
      filterValue: (e) => e.enterpriseAccount.name,
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

  if (canDecide) {
    columns.push({
      key: "actions",
      header: "Actions",
      cell: (e) => {
        const expired = isAalExpired(e);
        return (
          <div className="flex flex-wrap items-center gap-1.5">
            {e.status === "PendingApproval" && (
              <>
                <ActionForm action={decideAalEntry.bind(null, e.id, "Active")}>
                  <Button type="submit" size="sm" variant="secondary">
                    Approve
                  </Button>
                </ActionForm>
                <ActionForm action={decideAalEntry.bind(null, e.id, "Rejected")}>
                  <Button type="submit" size="sm" variant="danger">
                    Reject
                  </Button>
                </ActionForm>
              </>
            )}
            {e.status === "Active" && !expired && (
              <ActionForm action={revokeAalEntry.bind(null, e.id)}>
                <Button type="submit" size="sm" variant="danger">
                  Revoke
                </Button>
              </ActionForm>
            )}
          </div>
        );
      },
    });
  }

  return (
    <DataTable
      columns={columns}
      rows={entries}
      getRowKey={(e) => e.id}
      searchPlaceholder="Search by name, company, tenant…"
      emptyMessage="No AAL requests for this site yet."
      actions={
        canDecide && enrollments.length > 0 ? (
          <Dialog
            trigger={
              <Button size="sm">
                <Plus className="h-4 w-4" /> Add entry
              </Button>
            }
            title="Add authorized access entry"
            description="Grants permanent access immediately — you're the decision-maker, so this skips the approval queue."
          >
            {(close) => (
              <ActionForm action={createAalEntryOps} onSuccess={close} successMessage="Access entry added." className="space-y-3">
                <Field label="Tenant" htmlFor="siteEnrollmentId" required>
                  <Select id="siteEnrollmentId" name="siteEnrollmentId" required>
                    {enrollments.map((en) => (
                      <option key={en.id} value={en.id}>
                        {en.enterpriseAccount.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Full name" htmlFor="fullName" required>
                  <Input id="fullName" name="fullName" required />
                </Field>
                <Field label="Company (optional)" htmlFor="company">
                  <Input id="company" name="company" />
                </Field>
                <Field label="ID type (optional)" htmlFor="idType">
                  <Input id="idType" name="idType" placeholder="Passport, national ID…" />
                </Field>
                <Field label="ID number (optional)" htmlFor="idNumber">
                  <Input id="idNumber" name="idNumber" />
                </Field>
                <Field label="Access level" htmlFor="accessLevel" required>
                  <Select id="accessLevel" name="accessLevel" required defaultValue="Standard">
                    {AAL_ACCESS_LEVELS.map((level) => (
                      <option key={level} value={level}>
                        {AAL_ACCESS_LEVEL_LABELS[level]}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Valid until (optional)" htmlFor="validUntil" hint="Leave blank for no fixed expiry">
                  <Input id="validUntil" name="validUntil" type="date" />
                </Field>
                <Field label="Reason" htmlFor="reason" required>
                  <Textarea id="reason" name="reason" required placeholder="Why does this person need permanent access?" />
                </Field>
                <Button type="submit" className="w-full">
                  Add entry
                </Button>
              </ActionForm>
            )}
          </Dialog>
        ) : undefined
      }
    />
  );
}
