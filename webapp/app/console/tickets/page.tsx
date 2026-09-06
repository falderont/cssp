import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/dal";
import { withTenant } from "@/lib/tenant";
import { canTriageTickets } from "@/lib/rbac";
import { Role } from "@/lib/generated/prisma/client";

const ASSIGNABLE_ROLES: Role[] = [Role.PROVIDER_ADMIN, Role.PROVIDER_CS, Role.PROVIDER_CS_MANAGER, Role.PROVIDER_OPS];
import { PageHeader } from "@/components/ui/page-header";
import { Card, EmptyState } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { format } from "date-fns";
import { updateTicketStatus, assignTicket } from "./actions";

const STATUSES = ["OPEN", "IN_PROGRESS", "WAITING_ON_CUSTOMER", "RESOLVED", "CLOSED"];

export default async function ConsoleTicketsPage() {
  const session = await requireSession();
  if (!canTriageTickets(session.role)) redirect("/console/dashboard");

  const { tickets, staff } = await withTenant(session.organizationId, async (tx) => {
    const tickets = await tx.ticket.findMany({
      include: {
        siteEnrollment: { include: { facility: true, enterpriseAccount: true } },
        createdBy: true,
        assignedTo: true,
      },
      orderBy: { createdAt: "desc" },
    });
    const staff = await tx.user.findMany({
      where: { role: { in: ASSIGNABLE_ROLES } },
      orderBy: { name: "asc" },
    });
    return { tickets, staff };
  });

  return (
    <div>
      <PageHeader title="Ticket Queue" description="Triage complaints, RFIs, and service requests across every account." />

      {tickets.length === 0 ? (
        <EmptyState title="No tickets" />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-5 py-3 font-medium">Ticket</th>
                  <th className="px-5 py-3 font-medium">Account / Site</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Assignee</th>
                  <th className="px-5 py-3 font-medium">CSAT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tickets.map((t) => (
                  <tr key={t.id}>
                    <td className="px-5 py-3">
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        {t.category.replace(/_/g, " ")}
                      </span>
                      <p className="font-medium text-ink-900">{t.subject}</p>
                      <p className="text-xs text-slate-400">
                        {t.createdBy.name} · {format(t.createdAt, "MMM d, yyyy")}
                      </p>
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {t.siteEnrollment.enterpriseAccount.name}
                      <span className="text-slate-400"> · {t.siteEnrollment.facility.name}</span>
                    </td>
                    <td className="px-5 py-3">
                      <form action={updateTicketStatus} className="flex items-center gap-1.5">
                        <input type="hidden" name="ticketId" value={t.id} />
                        <select
                          name="status"
                          defaultValue={t.status}
                          className="rounded-md border border-slate-200 px-1.5 py-1 text-xs outline-none focus:border-brand-500"
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s.replace(/_/g, " ")}
                            </option>
                          ))}
                        </select>
                        <button className="text-xs font-medium text-brand-600 hover:underline">Update</button>
                      </form>
                    </td>
                    <td className="px-5 py-3">
                      <form action={assignTicket} className="flex items-center gap-1.5">
                        <input type="hidden" name="ticketId" value={t.id} />
                        <select
                          name="assignedToUserId"
                          defaultValue={t.assignedToUserId ?? ""}
                          className="rounded-md border border-slate-200 px-1.5 py-1 text-xs outline-none focus:border-brand-500"
                        >
                          <option value="">Unassigned</option>
                          {staff.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                        <button className="text-xs font-medium text-brand-600 hover:underline">Assign</button>
                      </form>
                    </td>
                    <td className="px-5 py-3">
                      {t.csatRating ? <StatusBadge status={`${t.csatRating}/5`} tone="teal" /> : <span className="text-xs text-slate-300">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
