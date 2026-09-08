"use client";

import Link from "next/link";
import type { Invoice } from "@prisma/client";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/badge";
import { INVOICE_STATUSES } from "@/lib/constants";
import { formatDate, formatMoney } from "@/lib/utils";

export function PortalInvoicesTable({ invoices }: { invoices: Invoice[] }) {
  const columns: DataTableColumn<Invoice>[] = [
    {
      key: "invoice",
      header: "Invoice",
      cell: (inv) => (
        <Link href={`/portal/billing/${inv.id}`} className="font-medium text-brand hover:underline">
          {inv.invoiceNumber}
        </Link>
      ),
      sortValue: (inv) => inv.invoiceNumber,
      searchValue: (inv) => inv.invoiceNumber,
    },
    {
      key: "period",
      header: "Period",
      cell: (inv) => (
        <>
          {formatDate(inv.periodStart)} – {formatDate(inv.periodEnd)}
        </>
      ),
      sortValue: (inv) => inv.periodStart,
    },
    { key: "issueDate", header: "Issue date", cell: (inv) => formatDate(inv.issueDate), sortValue: (inv) => inv.issueDate },
    { key: "dueDate", header: "Due date", cell: (inv) => formatDate(inv.dueDate), sortValue: (inv) => inv.dueDate },
    { key: "total", header: "Total", cell: (inv) => formatMoney(inv.total, inv.currency), sortValue: (inv) => inv.total },
    {
      key: "status",
      header: "Status",
      cell: (inv) => <StatusBadge status={inv.status} />,
      sortValue: (inv) => inv.status,
      filterOptions: INVOICE_STATUSES.map((s) => ({ label: s, value: s })),
      filterValue: (inv) => inv.status,
    },
  ];

  return (
    <DataTable columns={columns} rows={invoices} getRowKey={(inv) => inv.id} searchPlaceholder="Search invoices…" emptyMessage="No invoices yet." />
  );
}
