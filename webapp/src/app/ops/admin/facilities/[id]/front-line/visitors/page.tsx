import Link from "next/link";
import { redirect } from "next/navigation";
import { Table, THead, TH, TBody, TR, TD, EmptyRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/badge";
import { Select } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { requireFacilityPageAccess } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { summarizeVisitorStatuses } from "@/lib/constants";
import { getFacilityTabAccess } from "@/lib/facility-tabs";

export default async function FacilityVisitorsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { id } = await params;
  const { status } = await searchParams;
  const user = await requireFacilityPageAccess();
  const { canViewFrontLine } = getFacilityTabAccess(user.role);
  if (!canViewFrontLine) redirect(`/ops/admin/facilities/${id}`);

  const requests = await prisma.visitorRequest.findMany({
    where: { siteEnrollment: { facilityId: id } },
    include: { visitors: true, siteEnrollment: { include: { enterpriseAccount: true } }, building: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  const filtered = status ? requests.filter((r) => summarizeVisitorStatuses(r.visitors.map((v) => v.status)) === status) : requests;

  return (
    <div>
      <form className="mb-4 flex flex-wrap gap-2" method="get">
        <Select name="status" defaultValue={status ?? ""} className="w-auto">
          <option value="">Any status</option>
          {["Pending", "Approved", "CheckedIn", "CheckedOut", "Denied", "Mixed"].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
        <Button type="submit">Filter</Button>
      </form>
      <Table>
        <THead>
          <tr>
            <TH>Request</TH>
            <TH>Tenant</TH>
            <TH>Visit date</TH>
            <TH>Visitors</TH>
            <TH>Status</TH>
            <TH>ACS sync</TH>
          </tr>
        </THead>
        <TBody>
          {filtered.length === 0 && <EmptyRow colSpan={6} message="No visitor requests match this filter." />}
          {filtered.map((r) => (
            <TR key={r.id}>
              <TD>
                <Link href={`/ops/visitors/${r.id}`} className="font-medium text-brand hover:underline">
                  {r.purpose}
                </Link>
              </TD>
              <TD>{r.siteEnrollment.enterpriseAccount.name}</TD>
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
