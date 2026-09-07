import Link from "next/link";
import { Plus, Upload } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { LinkButton } from "@/components/ui/button";
import { Table, THead, TH, TBody, TR, TD, EmptyRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/badge";
import { requireCustomerUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getCustomerFacilityIds } from "@/lib/scope";
import { formatDate } from "@/lib/utils";
import { summarizeVisitorStatuses } from "@/lib/constants";

export default async function PortalVisitorsPage({ searchParams }: { searchParams: { site?: string } }) {
  const user = await requireCustomerUser();
  const facilityIds = await getCustomerFacilityIds(user);
  const siteFilter = searchParams.site && facilityIds.includes(searchParams.site) ? searchParams.site : undefined;

  const requests = await prisma.visitorRequest.findMany({
    where: {
      siteEnrollment: {
        enterpriseAccountId: user.enterpriseAccountId,
        facilityId: siteFilter ? siteFilter : { in: facilityIds },
      },
    },
    include: { visitors: true, siteEnrollment: { include: { facility: true } }, building: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Visitors"
        description="Register visitors — one at a time or as a group — and track approval and access-control sync."
        actions={
          <>
            <LinkButton href="/portal/visitors/new?mode=batch" variant="secondary">
              <Upload className="h-4 w-4" /> Batch upload
            </LinkButton>
            <LinkButton href="/portal/visitors/new">
              <Plus className="h-4 w-4" /> New visitor request
            </LinkButton>
          </>
        }
      />
      <Table>
        <THead>
          <tr>
            <TH>Request</TH>
            <TH>Site</TH>
            <TH>Visit date</TH>
            <TH>Visitors</TH>
            <TH>Source</TH>
            <TH>Status</TH>
            <TH>ACS sync</TH>
          </tr>
        </THead>
        <TBody>
          {requests.length === 0 && <EmptyRow colSpan={7} message="No visitor requests yet." />}
          {requests.map((r) => (
            <TR key={r.id}>
              <TD>
                <Link href={`/portal/visitors/${r.id}`} className="font-medium text-brand hover:underline">
                  {r.purpose}
                </Link>
                {r.building && <p className="text-xs text-slate-400">{r.building.name}</p>}
              </TD>
              <TD>{r.siteEnrollment.facility.name}</TD>
              <TD>
                {formatDate(r.visitDate)}
                <p className="text-xs text-slate-400">
                  {r.windowStart}–{r.windowEnd}
                </p>
              </TD>
              <TD>{r.visitors.length}</TD>
              <TD>{r.source}</TD>
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
