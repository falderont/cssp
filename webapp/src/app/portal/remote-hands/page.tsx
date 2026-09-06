import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { LinkButton } from "@/components/ui/button";
import { Table, THead, TH, TBody, TR, TD, EmptyRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/badge";
import { requireCustomerUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getCustomerFacilityIds } from "@/lib/scope";
import { formatDate } from "@/lib/utils";
import { REMOTE_HANDS_TASK_LABELS } from "@/lib/constants";

export default async function PortalRemoteHandsPage({ searchParams }: { searchParams: { site?: string } }) {
  const user = await requireCustomerUser();
  const facilityIds = await getCustomerFacilityIds(user);
  const siteFilter = searchParams.site && facilityIds.includes(searchParams.site) ? searchParams.site : undefined;

  const tasks = await prisma.remoteHandsTask.findMany({
    where: {
      siteEnrollment: {
        enterpriseAccountId: user.enterpriseAccountId,
        facilityId: siteFilter ? siteFilter : { in: facilityIds },
      },
    },
    include: { siteEnrollment: { include: { facility: true } }, assignedTechnician: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Remote / Smart Hands"
        description="Ask our on-site staff to physically do something in the data center on your behalf."
        actions={
          <LinkButton href="/portal/remote-hands/new">
            <Plus className="h-4 w-4" /> New request
          </LinkButton>
        }
      />
      <Table>
        <THead>
          <tr>
            <TH>Task</TH>
            <TH>Asset / Rack</TH>
            <TH>Site</TH>
            <TH>Technician</TH>
            <TH>Status</TH>
            <TH>Requested</TH>
          </tr>
        </THead>
        <TBody>
          {tasks.length === 0 && <EmptyRow colSpan={6} message="No remote hands requests yet." />}
          {tasks.map((t) => (
            <TR key={t.id}>
              <TD>
                <Link href={`/portal/remote-hands/${t.id}`} className="font-medium text-brand hover:underline">
                  {REMOTE_HANDS_TASK_LABELS[t.taskType] ?? t.taskType}
                </Link>
              </TD>
              <TD>{t.assetRef}</TD>
              <TD>{t.siteEnrollment.facility.name}</TD>
              <TD>{t.assignedTechnician?.name ?? "—"}</TD>
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
