import { requireSession } from "@/lib/auth/dal";
import { withTenant } from "@/lib/tenant";
import { resolvePortalScope } from "@/lib/portal-scope";
import { PageHeader } from "@/components/ui/page-header";
import { Card, EmptyState } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { RegisterVisitorForm } from "./register-form";
import { format } from "date-fns";

export default async function VisitorsPage({ searchParams }: { searchParams: Promise<{ site?: string }> }) {
  const session = await requireSession();
  const { site } = await searchParams;

  const { scope, visitors } = await withTenant(session.organizationId, async (tx) => {
    const scope = await resolvePortalScope(tx, session, site);
    const visitors = await tx.visitor.findMany({
      where: { siteEnrollmentId: { in: scope.siteEnrollmentIds } },
      include: { siteEnrollment: { include: { facility: true } }, host: true },
      orderBy: { visitStart: "desc" },
    });
    return { scope, visitors };
  });

  return (
    <div>
      <PageHeader title="Visitors" description="Register a visitor and track approval status per site." />

      <Card className="mb-8 p-5">
        <h2 className="mb-4 font-display text-base font-semibold text-ink-900">Register a visitor</h2>
        <RegisterVisitorForm
          sites={scope.enrollments.map((e) => ({ id: e.id, label: e.facility.name }))}
        />
      </Card>

      {visitors.length === 0 ? (
        <EmptyState title="No visitors yet" description="Visitors you register will show up here with their approval status." />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-5 py-3 font-medium">Visitor</th>
                  <th className="px-5 py-3 font-medium">Site</th>
                  <th className="px-5 py-3 font-medium">Host</th>
                  <th className="px-5 py-3 font-medium">Visit window</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visitors.map((v) => (
                  <tr key={v.id}>
                    <td className="px-5 py-3">
                      <p className="font-medium text-ink-900">{v.visitorName}</p>
                      {v.visitorCompany && <p className="text-xs text-slate-400">{v.visitorCompany}</p>}
                    </td>
                    <td className="px-5 py-3 text-slate-600">{v.siteEnrollment.facility.name}</td>
                    <td className="px-5 py-3 text-slate-600">{v.host.name}</td>
                    <td className="px-5 py-3 text-slate-600">
                      {format(v.visitStart, "MMM d, yyyy HH:mm")} – {format(v.visitEnd, "HH:mm")}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={v.status} />
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
