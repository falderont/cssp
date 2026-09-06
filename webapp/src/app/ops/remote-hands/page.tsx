import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Table, THead, TH, TBody, TR, TD, EmptyRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/badge";
import { requireInternalUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { REMOTE_HANDS_TASK_LABELS } from "@/lib/constants";

export default async function OpsRemoteHandsPage({ searchParams }: { searchParams: { status?: string } }) {
  await requireInternalUser();
  const tasks = await prisma.remoteHandsTask.findMany({
    where: searchParams.status ? { status: searchParams.status } : undefined,
    include: { siteEnrollment: { include: { facility: true, enterpriseAccount: true } }, assignedTechnician: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div>
      <PageHeader title="Remote / Smart Hands queue" description="Accept requests, assign a technician, and track time to completion." />
      <form className="mb-4 flex gap-2" method="get">
        <select name="status" defaultValue={searchParams.status ?? ""} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm">
          <option value="">Any status</option>
          <option value="Submitted">Submitted</option>
          <option value="Accepted">Accepted</option>
          <option value="InProgress">In Progress</option>
          <option value="Completed">Completed</option>
        </select>
        <button type="submit" className="rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-white">
          Filter
        </button>
      </form>
      <Table>
        <THead>
          <tr>
            <TH>Task</TH>
            <TH>Tenant</TH>
            <TH>Site</TH>
            <TH>Technician</TH>
            <TH>Status</TH>
            <TH>Requested</TH>
          </tr>
        </THead>
        <TBody>
          {tasks.length === 0 && <EmptyRow colSpan={6} message="No requests match this filter." />}
          {tasks.map((t) => (
            <TR key={t.id}>
              <TD>
                <Link href={`/ops/remote-hands/${t.id}`} className="font-medium text-brand hover:underline">
                  {REMOTE_HANDS_TASK_LABELS[t.taskType] ?? t.taskType}
                </Link>
                <p className="text-xs text-slate-400">{t.assetRef}</p>
              </TD>
              <TD>{t.siteEnrollment.enterpriseAccount.name}</TD>
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
