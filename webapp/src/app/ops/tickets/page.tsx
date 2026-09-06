import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Table, THead, TH, TBody, TR, TD, EmptyRow } from "@/components/ui/table";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { requireInternalUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatDate, humanize } from "@/lib/utils";

export default async function OpsTicketsPage({ searchParams }: { searchParams: { status?: string } }) {
  await requireInternalUser();
  const tickets = await prisma.ticket.findMany({
    where: searchParams.status ? { status: searchParams.status } : undefined,
    include: { siteEnrollment: { include: { facility: true, enterpriseAccount: true } }, assignedToUser: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div>
      <PageHeader title="Ticket queue" description="Every complaint, RFI and service request, across all accounts and sites." />
      <form className="mb-4 flex gap-2" method="get">
        <select name="status" defaultValue={searchParams.status ?? ""} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm">
          <option value="">Any status</option>
          <option value="Submitted">Submitted</option>
          <option value="InProgress">In Progress</option>
          <option value="Done">Done</option>
        </select>
        <button type="submit" className="rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-white">
          Filter
        </button>
      </form>
      <Table>
        <THead>
          <tr>
            <TH>Subject</TH>
            <TH>Tenant</TH>
            <TH>Site</TH>
            <TH>Category</TH>
            <TH>Assigned to</TH>
            <TH>Status</TH>
            <TH>Submitted</TH>
          </tr>
        </THead>
        <TBody>
          {tickets.length === 0 && <EmptyRow colSpan={7} message="No tickets match this filter." />}
          {tickets.map((t) => (
            <TR key={t.id}>
              <TD>
                <Link href={`/ops/tickets/${t.id}`} className="font-medium text-brand hover:underline">
                  {t.subject}
                </Link>
              </TD>
              <TD>{t.siteEnrollment.enterpriseAccount.name}</TD>
              <TD>{t.siteEnrollment.facility.name}</TD>
              <TD>
                <Badge>{humanize(t.category)}</Badge>
              </TD>
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
