import { requireSession } from "@/lib/auth/dal";
import { withTenant } from "@/lib/tenant";
import { PageHeader } from "@/components/ui/page-header";
import { Card, EmptyState } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { format } from "date-fns";

function formatMoney(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
}

export default async function PortalBillingPage() {
  const session = await requireSession();

  const invoices = await withTenant(session.organizationId, (tx) =>
    tx.invoice.findMany({
      where: { enterpriseAccountId: session.enterpriseAccountId! },
      include: { lineItems: true, facility: true },
      orderBy: { periodStart: "desc" },
    }),
  );

  return (
    <div>
      <PageHeader
        title="Billing"
        description="Invoices from your provider's billing system, surfaced here read-only — this doesn't replace their invoicing/payment process."
      />

      {invoices.length === 0 ? (
        <EmptyState title="No invoices yet" />
      ) : (
        <div className="space-y-4">
          {invoices.map((inv) => (
            <Card key={inv.id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-ink-900">
                    {format(inv.periodStart, "MMM yyyy")} {inv.facility ? `· ${inv.facility.name}` : "· Consolidated"}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {format(inv.periodStart, "MMM d")} – {format(inv.periodEnd, "MMM d, yyyy")}
                    {inv.dueAt ? ` · Due ${format(inv.dueAt, "MMM d, yyyy")}` : ""}
                    {inv.externalRef ? ` · Ref ${inv.externalRef}` : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-display text-lg font-semibold text-ink-900">{formatMoney(inv.totalAmount, inv.currency)}</p>
                  <StatusBadge status={inv.status} />
                </div>
              </div>
              <table className="mt-4 w-full text-left text-xs">
                <tbody className="divide-y divide-slate-100">
                  {inv.lineItems.map((li) => (
                    <tr key={li.id}>
                      <td className="py-1.5 text-slate-600">
                        {li.description}
                        {li.category === "REMOTE_HANDS" && (
                          <span className="ml-1.5 rounded bg-violet-50 px-1.5 py-0.5 text-[10px] font-medium text-violet-700">
                            Remote Hands
                          </span>
                        )}
                      </td>
                      <td className="py-1.5 text-right text-slate-500">{li.quantity > 1 ? `×${li.quantity} ` : ""}</td>
                      <td className="py-1.5 text-right font-medium text-slate-700">{formatMoney(li.amount, inv.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
