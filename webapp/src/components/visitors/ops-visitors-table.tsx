"use client";

import Link from "next/link";
import type { Building, EnterpriseAccount, Facility, SiteEnrollment, Visitor, VisitorRequest } from "@prisma/client";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/badge";
import { summarizeVisitorStatuses } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

type RequestRow = VisitorRequest & {
  visitors: Visitor[];
  building: Building | null;
  siteEnrollment: SiteEnrollment & { facility: Facility; enterpriseAccount: EnterpriseAccount };
};

function uniqueOptions(values: string[]) {
  return Array.from(new Set(values))
    .sort()
    .map((v) => ({ label: v, value: v }));
}

export function OpsVisitorsTable({ requests }: { requests: RequestRow[] }) {
  const columns: DataTableColumn<RequestRow>[] = [
    {
      key: "request",
      header: "Request",
      cell: (r) => (
        <Link href={`/ops/visitors/${r.id}`} className="font-medium text-brand hover:underline">
          {r.purpose}
        </Link>
      ),
      sortValue: (r) => r.purpose,
      searchValue: (r) => r.purpose,
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
    { key: "visitDate", header: "Visit date", cell: (r) => formatDate(r.visitDate), sortValue: (r) => r.visitDate },
    { key: "visitors", header: "Visitors", cell: (r) => r.visitors.length, sortValue: (r) => r.visitors.length },
    {
      key: "status",
      header: "Status",
      cell: (r) => <StatusBadge status={summarizeVisitorStatuses(r.visitors.map((v) => v.status))} />,
      sortValue: (r) => summarizeVisitorStatuses(r.visitors.map((v) => v.status)),
      filterOptions: ["Pending", "Approved", "CheckedIn", "CheckedOut", "Denied", "Mixed"].map((s) => ({ label: s, value: s })),
      filterValue: (r) => summarizeVisitorStatuses(r.visitors.map((v) => v.status)),
    },
    {
      key: "acsSync",
      header: "ACS sync",
      cell: (r) => <StatusBadge status={r.acsSyncStatus} />,
      sortValue: (r) => r.acsSyncStatus,
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={requests}
      getRowKey={(r) => r.id}
      searchPlaceholder="Search by purpose, tenant, site…"
      emptyMessage="No visitor requests match this filter."
    />
  );
}
