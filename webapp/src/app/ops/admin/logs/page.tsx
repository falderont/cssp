import { PageHeader } from "@/components/ui/page-header";
import { SystemLogsTable } from "@/components/admin/logs-table";
import { requireSysAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export default async function SystemLogsPage() {
  await requireSysAdmin();
  const logs = await prisma.auditLog.findMany({
    include: { actor: true },
    orderBy: { createdAt: "desc" },
    take: 300,
  });

  return (
    <div>
      <PageHeader title="System logs" description="An audit trail of administrative actions across the platform." />
      <SystemLogsTable logs={logs} />
    </div>
  );
}
