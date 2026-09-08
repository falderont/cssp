"use client";

import type { BackupRecord, User } from "@prisma/client";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { formatDateTime } from "@/lib/utils";

type Backup = BackupRecord & { createdBy: User };

export function BackupsTable({ backups }: { backups: Backup[] }) {
  const columns: DataTableColumn<Backup>[] = [
    {
      key: "file",
      header: "File",
      cell: (b) => <span className="font-medium text-slate-900">{b.fileName}</span>,
      sortValue: (b) => b.fileName,
      searchValue: (b) => b.fileName,
    },
    { key: "size", header: "Size", cell: (b) => `${(b.fileSizeKb / 1024).toFixed(2)} MB`, sortValue: (b) => b.fileSizeKb },
    { key: "createdBy", header: "Created by", cell: (b) => b.createdBy.name, sortValue: (b) => b.createdBy.name, searchValue: (b) => b.createdBy.name },
    { key: "createdAt", header: "Created", cell: (b) => formatDateTime(b.createdAt), sortValue: (b) => b.createdAt },
    {
      key: "actions",
      header: "Actions",
      cell: (b) => (
        <a href={`/api/admin/backups/${b.id}`} className="text-sm text-brand hover:underline">
          Download
        </a>
      ),
    },
  ];

  return <DataTable columns={columns} rows={backups} getRowKey={(b) => b.id} searchPlaceholder="Search backups…" emptyMessage="No backups yet." />;
}
