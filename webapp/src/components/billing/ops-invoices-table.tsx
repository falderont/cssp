"use client";

import Link from "next/link";
import type { EnterpriseAccount, Invoice } from "@prisma/client";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/badge";
import { INVOICE_STATUSES } from "@/lib/constants";
import { formatDate, formatMoney } from "@/lib/utils";

type InvoiceRow = Invoice & { enterpriseAccount: EnterpriseAccount };

function uniqueOptions(values: string[]) {
  return Array.from(new Set(values))
    .sort()
    .map((v) => ({ label: v, value: v }));
}

export function OpsInvoicesTable({ invoices }: { invoices: InvoiceRow[] }) {
  const columns: DataTableColumn<InvoiceRow>[] = [
    {
      key: "invoice",
      header: "Invoice",
      cell: (inv) => (
        <Link href={`/ops/billing/${inv.id}`} className="font-medium text-brand hover:underline">
          {inv.invoiceNumber}
        </Link>
      ),
      sortValue: (inv) => inv.invoiceNumber,
      searchValue: (inv) => `${inv.invoiceNumber} ${inv.enterpriseAccount.name}`,
    },
    {
      key: "tenant",
      header: "Tenant",
      cell: (inv) => inv.enterpriseAccount.name,
      sortValue: (inv) => inv.enterpriseAccount.name,
      filterOptions: uniqueOptions(invoices.map((inv) => inv.enterpriseAccount.name)),
      filterValue: (inv) => inv.enterpriseAccount.name,
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
    <DataTable columns={columns} rows={invoices} getRowKey={(inv) => inv.id} searchPlaceholder="Search by invoice # or tenant…" emptyMessage="No invoices yet." />
  );
}
