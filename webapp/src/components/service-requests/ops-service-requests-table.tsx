"use client";

import Link from "next/link";
import type { Building, EnterpriseAccount, Facility, ServiceRequest, SiteEnrollment, User } from "@prisma/client";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { SERVICE_REQUEST_CATEGORIES, SERVICE_REQUEST_CATEGORY_LABELS, SERVICE_REQUEST_STATUSES } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

type RequestRow = ServiceRequest & {
  siteEnrollment: SiteEnrollment & { facility: Facility; enterpriseAccount: EnterpriseAccount };
  building: Building | null;
  assignedToUser: User | null;
};

function uniqueOptions(values: string[]) {
  return Array.from(new Set(values))
    .sort()
    .map((v) => ({ label: v, value: v }));
}

export function OpsServiceRequestsTable({ requests }: { requests: RequestRow[] }) {
  const columns: DataTableColumn<RequestRow>[] = [
    {
      key: "subject",
      header: "Subject",
      cell: (r) => (
        <Link href={`/ops/service-requests/${r.id}`} className="font-medium text-brand hover:underline">
          {r.subject}
        </Link>
      ),
      sortValue: (r) => r.subject,
      searchValue: (r) => r.subject,
    },
    {
      key: "type",
      header: "Type",
      cell: (r) => <Badge>{SERVICE_REQUEST_CATEGORY_LABELS[r.category] ?? r.category}</Badge>,
      sortValue: (r) => r.category,
      filterOptions: SERVICE_REQUEST_CATEGORIES.map((c) => ({ label: SERVICE_REQUEST_CATEGORY_LABELS[c], value: c })),
      filterValue: (r) => r.category,
    },
    {
      key: "tenant",
      header: "Tenant",
      cell: (r) => r.siteEnrollment.enterpriseAccount.name,
      sortValue: (r) => r.siteEnrollment.enterpriseAccount.name,
      searchValue: (r) => r.siteEnrollment.enterpriseAccount.name,
      filterOptions: uniqueOptions(requests.map((r) => r.siteEnrollment.enterpriseAccount.name)),
      filterValue: (r) => r.siteEnrollment.enterpriseAccount.name,
    },
    {
      key: "site",
      header: "Site",
      cell: (r) => r.siteEnrollment.facility.name,
      sortValue: (r) => r.siteEnrollment.facility.name,
      searchValue: (r) => r.siteEnrollment.facility.name,
      filterOptions: uniqueOptions(requests.map((r) => r.siteEnrollment.facility.name)),
      filterValue: (r) => r.siteEnrollment.facility.name,
    },
    {
      key: "building",
      header: "Room / area",
      cell: (r) => r.building?.name ?? "—",
      sortValue: (r) => r.building?.name ?? "",
      searchValue: (r) => r.building?.name,
    },
    {
      key: "assignedTo",
      header: "Assigned to",
      cell: (r) => r.assignedToUser?.name ?? "Unassigned",
      sortValue: (r) => r.assignedToUser?.name ?? "",
      searchValue: (r) => r.assignedToUser?.name,
    },
    {
      key: "status",
      header: "Status",
      cell: (r) => <StatusBadge status={r.status} />,
      sortValue: (r) => r.status,
      filterOptions: SERVICE_REQUEST_STATUSES.map((s) => ({ label: s, value: s })),
      filterValue: (r) => r.status,
    },
    { key: "submitted", header: "Submitted", cell: (r) => formatDate(r.createdAt), sortValue: (r) => r.createdAt },
  ];

  return (
    <DataTable
      columns={columns}
      rows={requests}
      getRowKey={(r) => r.id}
      searchPlaceholder="Search by subject, tenant, site, assignee…"
      emptyMessage="No service requests yet."
    />
  );
}
