import { PageHeader } from "@/components/ui/page-header";
import { Table, THead, TH, TBody, TR, TD, EmptyRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { requireSysAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";

const ACTION_TONES: Record<string, "blue" | "green" | "amber" | "red" | "slate"> = {
  user: "blue",
  tenant: "green",
  facility: "green",
  region: "green",
  country: "green",
  city: "green",
  team: "blue",
  area_change_request: "amber",
  branding: "amber",
  preferences: "amber",
  maintenance: "red",
  backup: "slate",
  integration: "blue",
};

export default async function SystemLogsPage({ searchParams }: { searchParams: Promise<{ action?: string }> }) {
  const { action } = await searchParams;
  await requireSysAdmin();
  const logs = await prisma.auditLog.findMany({
    where: action ? { action: { startsWith: action } } : undefined,
    include: { actor: true },
    orderBy: { createdAt: "desc" },
    take: 300,
  });

  const categories = [
    "user",
    "tenant",
    "facility",
    "region",
    "country",
    "city",
    "team",
    "area_change_request",
    "branding",
    "preferences",
    "maintenance",
    "backup",
    "integration",
  ];

  return (
    <div>
      <PageHeader title="System logs" description="An audit trail of administrative actions across the platform." />
      <form className="mb-4 flex flex-wrap gap-2" method="get">
        <select name="action" defaultValue={action ?? ""} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm">
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
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
            <TH>When</TH>
            <TH>Actor</TH>
            <TH>Action</TH>
            <TH>Summary</TH>
          </tr>
        </THead>
        <TBody>
          {logs.length === 0 && <EmptyRow colSpan={4} message="No audit events recorded yet." />}
          {logs.map((log) => {
            const category = log.action.split(".")[0];
            return (
              <TR key={log.id}>
                <TD className="whitespace-nowrap text-xs text-slate-400">{formatDateTime(log.createdAt)}</TD>
                <TD>{log.actor?.name ?? "System"}</TD>
                <TD>
                  <Badge tone={ACTION_TONES[category] ?? "slate"}>{log.action}</Badge>
                </TD>
                <TD className="text-sm text-slate-700">{log.summary}</TD>
              </TR>
            );
          })}
        </TBody>
      </Table>
    </div>
  );
}
