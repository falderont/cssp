import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { LinkButton } from "@/components/ui/button";
import { Table, THead, TH, TBody, TR, TD, EmptyRow } from "@/components/ui/table";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { requireCustomerUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getCustomerFacilityIds } from "@/lib/scope";
import { formatDate, humanize } from "@/lib/utils";

export default async function PortalTicketsPage({ searchParams }: { searchParams: { site?: string } }) {
  const user = await requireCustomerUser();
  const facilityIds = await getCustomerFacilityIds(user);
  const siteFilter = searchParams.site && facilityIds.includes(searchParams.site) ? searchParams.site : undefined;

  const tickets = await prisma.ticket.findMany({
    where: {
      siteEnrollment: {
        enterpriseAccountId: user.enterpriseAccountId,
        facilityId: siteFilter ? siteFilter : { in: facilityIds },
      },
    },
    include: { siteEnrollment: { include: { facility: true } }, assignedToUser: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Tickets"
        description="Complaints, requests for information, and service requests."
        actions={
          <LinkButton href="/portal/tickets/new">
            <Plus className="h-4 w-4" /> New ticket
          </LinkButton>
        }
      />
      <Table>
        <THead>
          <tr>
            <TH>Subject</TH>
            <TH>Category</TH>
            <TH>Site</TH>
            <TH>Priority</TH>
            <TH>Assigned to</TH>
            <TH>Status</TH>
            <TH>Submitted</TH>
          </tr>
        </THead>
        <TBody>
          {tickets.length === 0 && <EmptyRow colSpan={7} message="No tickets yet." />}
          {tickets.map((t) => (
            <TR key={t.id}>
              <TD>
                <Link href={`/portal/tickets/${t.id}`} className="font-medium text-brand hover:underline">
                  {t.subject}
                </Link>
              </TD>
              <TD>
                <Badge>{humanize(t.category)}</Badge>
              </TD>
              <TD>{t.siteEnrollment.facility.name}</TD>
              <TD>{t.priority}</TD>
              <TD>{t.assignedToUser?.name ?? "Unassigned"}</TD>
              <TD>
                <StatusBadge status={t.status} />
              </TD>
              <TD>{formatDate(t.createdAt)}</TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </div>
  );
}
