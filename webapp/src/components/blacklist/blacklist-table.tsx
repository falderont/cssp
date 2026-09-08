"use client";

import type { BlacklistEntry, User } from "@prisma/client";
import { Plus } from "lucide-react";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/form";
import { ActionForm } from "@/components/errors/action-form";
import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";
import { createBlacklistEntry, deleteBlacklistEntry } from "@/actions/blacklist";
import { formatDate } from "@/lib/utils";

type Entry = BlacklistEntry & { createdBy: User };

export function BlacklistTable({ entries }: { entries: Entry[] }) {
  const columns: DataTableColumn<Entry>[] = [
    {
      key: "name",
      header: "Name",
      cell: (e) => <span className="font-medium text-slate-900">{e.fullName}</span>,
      sortValue: (e) => e.fullName,
      searchValue: (e) => e.fullName,
    },
    {
      key: "idNumber",
      header: "ID number",
      cell: (e) => e.idNumber ?? "—",
      searchValue: (e) => e.idNumber,
    },
    {
      key: "company",
      header: "Company",
      cell: (e) => e.company ?? "—",
      sortValue: (e) => e.company ?? "",
      searchValue: (e) => e.company,
    },
    {
      key: "reason",
      header: "Reason",
      cell: (e) => <span className="block max-w-xs truncate">{e.reason}</span>,
      searchValue: (e) => e.reason,
    },
    {
      key: "addedBy",
      header: "Added by",
      cell: (e) => (
        <>
          {e.createdBy.name}
          <p className="text-xs text-slate-400">{formatDate(e.createdAt)}</p>
        </>
      ),
      sortValue: (e) => e.createdAt,
      searchValue: (e) => e.createdBy.name,
    },
    {
      key: "actions",
      header: "Actions",
      cell: (e) => (
        <ConfirmDeleteButton
          action={deleteBlacklistEntry.bind(null, e.id)}
          confirmMessage={`Remove ${e.fullName} from the blacklist? This can't be undone.`}
          label="Remove"
        />
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={entries}
      getRowKey={(e) => e.id}
      searchPlaceholder="Search by name, ID, company, reason…"
      emptyMessage="No blacklist entries yet."
      actions={
        <Dialog
          trigger={
            <Button size="sm">
              <Plus className="h-4 w-4" /> Add entry
            </Button>
          }
          title="Add blacklist entry"
          description="Checked automatically against every incoming visitor by name or ID number."
        >
          {(close) => (
            <ActionForm action={createBlacklistEntry} onSuccess={close} successMessage="Added to blacklist." className="space-y-3">
              <Field label="Full name" htmlFor="fullName" required>
                <Input id="fullName" name="fullName" required />
              </Field>
              <Field label="ID number (optional)" htmlFor="idNumber">
                <Input id="idNumber" name="idNumber" />
              </Field>
              <Field label="Company (optional)" htmlFor="company">
                <Input id="company" name="company" />
              </Field>
              <Field label="Reason" htmlFor="reason" required>
                <Textarea id="reason" name="reason" required placeholder="Why is this person/entity blacklisted?" />
              </Field>
              <Button type="submit" className="w-full">
                Add to blacklist
              </Button>
            </ActionForm>
          )}
        </Dialog>
      }
    />
  );
}
