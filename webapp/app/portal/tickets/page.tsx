import { requireSession } from "@/lib/auth/dal";
import { withTenant } from "@/lib/tenant";
import { resolvePortalScope } from "@/lib/portal-scope";
import { PageHeader } from "@/components/ui/page-header";
import { Card, EmptyState } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { format } from "date-fns";
import { CreateTicketForm } from "./create-form";
import { rateTicket } from "./actions";

export default async function PortalTicketsPage({ searchParams }: { searchParams: Promise<{ site?: string }> }) {
  const session = await requireSession();
  const { site } = await searchParams;

  const { scope, tickets } = await withTenant(session.organizationId, async (tx) => {
    const scope = await resolvePortalScope(tx, session, site);
    const tickets = await tx.ticket.findMany({
      where: { siteEnrollmentId: { in: scope.siteEnrollmentIds } },
      include: { siteEnrollment: { include: { facility: true } }, assignedTo: true },
      orderBy: { createdAt: "desc" },
    });
    return { scope, tickets };
  });

  return (
    <div>
      <PageHeader title="Tickets" description="Raise a complaint, request for information, or service request." />

      <Card className="mb-8 p-5">
        <h2 className="mb-4 font-display text-base font-semibold text-ink-900">Raise a ticket</h2>
        <CreateTicketForm sites={scope.enrollments.map((e) => ({ id: e.id, label: e.facility.name }))} />
      </Card>

      {tickets.length === 0 ? (
        <EmptyState title="No tickets yet" />
      ) : (
        <Card>
          <ul className="divide-y divide-slate-100">
            {tickets.map((t) => (
              <li key={t.id} className="flex items-start justify-between gap-4 px-5 py-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      {t.category.replace(/_/g, " ")}
                    </span>
                    <p className="font-medium text-ink-900">{t.subject}</p>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{t.description}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {t.siteEnrollment.facility.name} · Opened {format(t.createdAt, "MMM d, yyyy")}
                    {t.assignedTo ? ` · Assigned to ${t.assignedTo.name}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <StatusBadge status={t.status} />
                  {["RESOLVED", "CLOSED"].includes(t.status) &&
                    (t.csatRating ? (
                      <p className="text-xs text-slate-400">Rated {t.csatRating}/5</p>
                    ) : (
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <form key={n} action={rateTicket}>
                            <input type="hidden" name="ticketId" value={t.id} />
                            <input type="hidden" name="rating" value={n} />
                            <button className="h-6 w-6 rounded border border-slate-200 text-xs text-slate-500 hover:border-brand-500 hover:text-brand-600">
                              {n}
                            </button>
                          </form>
                        ))}
                      </div>
                    ))}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
