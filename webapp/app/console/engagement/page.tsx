import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/dal";
import { withTenant } from "@/lib/tenant";
import { canLogEngagement } from "@/lib/rbac";
import { PageHeader } from "@/components/ui/page-header";
import { Card, EmptyState } from "@/components/ui/card";
import { format } from "date-fns";
import { LogEngagementForm } from "./log-form";

const TYPE_LABEL: Record<string, string> = {
  CALL: "Call",
  EMAIL: "Email",
  MEETING: "Meeting",
  SITE_VISIT: "Site visit",
  TICKET: "Ticket resolved",
  REMOTE_HANDS: "Remote hands completed",
};

export default async function EngagementPage() {
  const session = await requireSession();
  if (!canLogEngagement(session.role)) redirect("/console/dashboard");

  const { logs, accounts } = await withTenant(session.organizationId, async (tx) => {
    const logs = await tx.engagementLog.findMany({
      where: { loggedByUserId: session.userId },
      include: { enterpriseAccount: true },
      orderBy: { occurredAt: "desc" },
    });
    const accounts = await tx.enterpriseAccount.findMany({ orderBy: { name: "asc" } });
    return { logs, accounts };
  });

  return (
    <div>
      <PageHeader title="My Engagement" description="Your touchpoints with every account — tickets and remote hands you complete log here automatically." />

      <Card className="mb-8 p-5">
        <h2 className="mb-4 font-display text-base font-semibold text-ink-900">Log a touchpoint</h2>
        <LogEngagementForm accounts={accounts.map((a) => ({ id: a.id, name: a.name }))} />
      </Card>

      {logs.length === 0 ? (
        <EmptyState title="Nothing logged yet" />
      ) : (
        <Card>
          <ul className="divide-y divide-slate-100">
            {logs.map((l) => (
              <li key={l.id} className="px-5 py-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-ink-900">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{TYPE_LABEL[l.type]}</span>{" "}
                    · {l.enterpriseAccount.name}
                  </p>
                  <span className="text-xs text-slate-400">{format(l.occurredAt, "MMM d, yyyy HH:mm")}</span>
                </div>
                <p className="mt-1 text-sm text-slate-500">{l.notes}</p>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
