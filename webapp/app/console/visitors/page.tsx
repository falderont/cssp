import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/dal";
import { withTenant } from "@/lib/tenant";
import { canManageVisitors } from "@/lib/rbac";
import { PageHeader } from "@/components/ui/page-header";
import { Card, EmptyState } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { format } from "date-fns";
import { approveVisitor, denyVisitor, checkInVisitor, checkOutVisitor } from "./actions";

const STATUS_ORDER = ["PENDING", "APPROVED", "CHECKED_IN", "CHECKED_OUT", "DENIED"];

export default async function ConsoleVisitorsPage() {
  const session = await requireSession();
  if (!canManageVisitors(session.role)) redirect("/console/dashboard");

  const visitors = await withTenant(session.organizationId, (tx) =>
    tx.visitor.findMany({
      include: { siteEnrollment: { include: { facility: true, enterpriseAccount: true } }, host: true },
      orderBy: { visitStart: "desc" },
    }),
  );

  const sorted = [...visitors].sort((a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status));

  return (
    <div>
      <PageHeader title="Visitor Approvals" description="Approve or deny visitor requests and track check-in/check-out." />

      {sorted.length === 0 ? (
        <EmptyState title="No visitor requests" />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-5 py-3 font-medium">Visitor</th>
                  <th className="px-5 py-3 font-medium">Account / Site</th>
                  <th className="px-5 py-3 font-medium">Host</th>
                  <th className="px-5 py-3 font-medium">Visit window</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sorted.map((v) => (
                  <tr key={v.id}>
                    <td className="px-5 py-3">
                      <p className="font-medium text-ink-900">{v.visitorName}</p>
                      {v.visitorCompany && <p className="text-xs text-slate-400">{v.visitorCompany}</p>}
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {v.siteEnrollment.enterpriseAccount.name}
                      <span className="text-slate-400"> · {v.siteEnrollment.facility.name}</span>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{v.host.name}</td>
                    <td className="px-5 py-3 text-slate-600">
                      {format(v.visitStart, "MMM d, yyyy HH:mm")} – {format(v.visitEnd, "HH:mm")}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={v.status} />
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex gap-2">
                        {v.status === "PENDING" && (
                          <>
                            <form action={approveVisitor}>
                              <input type="hidden" name="visitorId" value={v.id} />
                              <button className="rounded-md bg-emerald-500 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-600">
                                Approve
                              </button>
                            </form>
                            <form action={denyVisitor}>
                              <input type="hidden" name="visitorId" value={v.id} />
                              <button className="rounded-md bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-100">
                                Deny
                              </button>
                            </form>
                          </>
                        )}
                        {v.status === "APPROVED" && (
                          <form action={checkInVisitor}>
                            <input type="hidden" name="visitorId" value={v.id} />
                            <button className="rounded-md bg-brand-500 px-2.5 py-1 text-xs font-semibold text-white hover:bg-brand-600">
                              Check in
                            </button>
                          </form>
                        )}
                        {v.status === "CHECKED_IN" && (
                          <form action={checkOutVisitor}>
                            <input type="hidden" name="visitorId" value={v.id} />
                            <button className="rounded-md bg-slate-700 px-2.5 py-1 text-xs font-semibold text-white hover:bg-slate-800">
                              Check out
                            </button>
                          </form>
                        )}
                      </div>
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
