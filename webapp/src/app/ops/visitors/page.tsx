import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Table, THead, TH, TBody, TR, TD, EmptyRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/badge";
import { requireInternalUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getOpsFacilityIds } from "@/lib/scope";
import { formatDate } from "@/lib/utils";
import { summarizeVisitorStatuses } from "@/lib/constants";

export default async function OpsVisitorsPage({ searchParams }: { searchParams: Promise<{ facility?: string; status?: string }> }) {
  const { facility, status } = await searchParams;
  const user = await requireInternalUser();
  const scopedFacilityIds = await getOpsFacilityIds(user);
  const facilities = await prisma.facility.findMany({
    where: scopedFacilityIds ? { id: { in: scopedFacilityIds } } : undefined,
    orderBy: { name: "asc" },
  });
  const allowedFacilityIds = scopedFacilityIds
    ? facility && scopedFacilityIds.includes(facility)
      ? [facility]
      : scopedFacilityIds
    : facility
      ? [facility]
      : undefined;

  const requests = await prisma.visitorRequest.findMany({
    where: allowedFacilityIds ? { siteEnrollment: { facilityId: { in: allowedFacilityIds } } } : undefined,
    include: {
      visitors: true,
      siteEnrollment: { include: { facility: true, enterpriseAccount: true } },
      building: true,
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const filtered = status
    ? requests.filter((r) => summarizeVisitorStatuses(r.visitors.map((v) => v.status)) === status)
    : requests;

  return (
    <div>
      <PageHeader title="Visitor approvals" description="Approve, deny, check in/out, and monitor access-control sync across every site and tenant." />
      <form className="mb-4 flex flex-wrap gap-2" method="get">
        <select name="facility" defaultValue={facility ?? ""} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm">
          <option value="">All facilities</option>
          {facilities.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
        <select name="status" defaultValue={status ?? ""} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm">
          <option value="">Any status</option>
          {["Pending", "Approved", "CheckedIn", "CheckedOut", "Denied", "Mixed"].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-white">
          Filter
        </button>
      </form>
      <Table>
        <THead>
          <tr>
            <TH>Request</TH>
            <TH>Tenant</TH>
            <TH>Site</TH>
            <TH>Visit date</TH>
            <TH>Visitors</TH>
            <TH>Status</TH>
            <TH>ACS sync</TH>
          </tr>
        </THead>
        <TBody>
          {filtered.length === 0 && <EmptyRow colSpan={7} message="No visitor requests match this filter." />}
          {filtered.map((r) => (
            <TR key={r.id}>
              <TD>
                <Link href={`/ops/visitors/${r.id}`} className="font-medium text-brand hover:underline">
                  {r.purpose}
                </Link>
              </TD>
              <TD>{r.siteEnrollment.enterpriseAccount.name}</TD>
              <TD>{r.siteEnrollment.facility.name}</TD>
              <TD>{formatDate(r.visitDate)}</TD>
              <TD>{r.visitors.length}</TD>
              <TD>
                <StatusBadge status={summarizeVisitorStatuses(r.visitors.map((v) => v.status))} />
              </TD>
              <TD>
                <StatusBadge status={r.acsSyncStatus} />
              </TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </div>
  );
}
