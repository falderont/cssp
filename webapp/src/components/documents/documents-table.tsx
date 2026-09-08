"use client";

import type { Document, EnterpriseAccount, Facility, User } from "@prisma/client";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";
import { deleteDocument } from "@/actions/documents";
import { DOCUMENT_CATEGORY_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

type DocRow = Document & { enterpriseAccount: EnterpriseAccount | null; facility: Facility | null; publishedByUser: User };

function uniqueOptions(values: string[]) {
  return Array.from(new Set(values))
    .sort()
    .map((v) => ({ label: v, value: v }));
}

export function DocumentsTable({ documents }: { documents: DocRow[] }) {
  const columns: DataTableColumn<DocRow>[] = [
    {
      key: "title",
      header: "Title",
      cell: (d) => <span className="font-medium text-slate-900">{d.title}</span>,
      sortValue: (d) => d.title,
      searchValue: (d) => d.title,
    },
    {
      key: "category",
      header: "Category",
      cell: (d) => <Badge>{DOCUMENT_CATEGORY_LABELS[d.category] ?? d.category}</Badge>,
      sortValue: (d) => d.category,
      filterOptions: uniqueOptions(documents.map((d) => d.category)).map((o) => ({
        label: DOCUMENT_CATEGORY_LABELS[o.value] ?? o.value,
        value: o.value,
      })),
      filterValue: (d) => d.category,
    },
    {
      key: "scope",
      header: "Scope",
      cell: (d) => (
        <>
          {d.enterpriseAccount?.name ?? "All tenants"}
          {d.facility ? ` · ${d.facility.name}` : ""}
        </>
      ),
      searchValue: (d) => `${d.enterpriseAccount?.name ?? ""} ${d.facility?.name ?? ""}`,
    },
    {
      key: "publishedBy",
      header: "Published by",
      cell: (d) => d.publishedByUser.name,
      sortValue: (d) => d.publishedByUser.name,
      searchValue: (d) => d.publishedByUser.name,
    },
    { key: "published", header: "Published", cell: (d) => formatDate(d.publishedAt), sortValue: (d) => d.publishedAt },
    {
      key: "actions",
      header: "Actions",
      cell: (d) => (
        <div className="flex items-center gap-3">
          <a href={`/api/documents/${d.id}`} className="text-sm text-brand hover:underline">
            Download
          </a>
          <ConfirmDeleteButton
            action={deleteDocument.bind(null, d.id, "/ops/documents")}
            confirmMessage={`Delete "${d.title}"? This can't be undone.`}
            label="Delete"
          />
        </div>
      ),
    },
  ];

  return (
    <DataTable columns={columns} rows={documents} getRowKey={(d) => d.id} searchPlaceholder="Search documents…" emptyMessage="No documents published yet." />
  );
}
