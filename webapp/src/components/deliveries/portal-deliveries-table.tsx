"use client";

import Link from "next/link";
import type { Delivery, Facility } from "@prisma/client";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/badge";
import { isDeliveryEditable } from "@/lib/deliveries";
import { DELIVERY_STATUSES } from "@/lib/constants";
import { formatDate, formatDateTime } from "@/lib/utils";

type DeliveryRow = Delivery & { facility: Facility };

export function PortalDeliveriesTable({ deliveries }: { deliveries: DeliveryRow[] }) {
  const columns: DataTableColumn<DeliveryRow>[] = [
    {
      key: "courier",
      header: "Courier",
      cell: (d) => <span className="font-medium text-slate-900">{d.courierName}</span>,
      sortValue: (d) => d.courierName,
      searchValue: (d) => d.courierName,
    },
    { key: "description", header: "Description", cell: (d) => d.description, searchValue: (d) => d.description },
    {
      key: "site",
      header: "Site",
      cell: (d) => d.facility.name,
      sortValue: (d) => d.facility.name,
      filterOptions: Array.from(new Set(deliveries.map((d) => d.facility.name))).map((v) => ({ label: v, value: v })),
      filterValue: (d) => d.facility.name,
    },
    {
      key: "expected",
      header: "Expected",
      cell: (d) => (d.expectedAt ? formatDate(d.expectedAt) : d.arrivedAt ? formatDateTime(d.arrivedAt) : "—"),
      sortValue: (d) => d.expectedAt ?? d.arrivedAt ?? null,
    },
    {
      key: "status",
      header: "Status",
      cell: (d) => <StatusBadge status={d.status} />,
      sortValue: (d) => d.status,
      filterOptions: DELIVERY_STATUSES.map((s) => ({ label: s, value: s })),
      filterValue: (d) => d.status,
    },
    {
      key: "actions",
      header: "",
      cell: (d) => (
        <Link href={`/portal/deliveries/${d.id}`} className="text-sm font-medium text-brand hover:underline">
          {isDeliveryEditable(d) ? "Edit" : "View"}
        </Link>
      ),
    },
  ];

  return (
    <DataTable columns={columns} rows={deliveries} getRowKey={(d) => d.id} searchPlaceholder="Search deliveries…" emptyMessage="No deliveries logged yet." />
  );
}
