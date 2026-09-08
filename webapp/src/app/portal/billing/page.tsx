import { PageHeader } from "@/components/ui/page-header";
import { StatTile } from "@/components/ui/stat-tile";
import { PortalInvoicesTable } from "@/components/billing/portal-invoices-table";
import { requireTenantBillingViewer } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/utils";
import { Receipt, AlertTriangle, CheckCircle2 } from "lucide-react";

export default async function PortalBillingPage() {
  const user = await requireTenantBillingViewer();
  const invoices = await prisma.invoice.findMany({
    where: { enterpriseAccountId: user.enterpriseAccountId },
    orderBy: { issueDate: "desc" },
  });

  const outstanding = invoices.filter((i) => i.status === "Sent" || i.status === "Overdue");
  const overdue = invoices.filter((i) => i.status === "Overdue");
  const outstandingTotal = outstanding.reduce((s, i) => s + i.total, 0);

  return (
    <div>
      <PageHeader title="Billing" description="Invoices for your account across every site." />
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile label="Outstanding balance" value={formatMoney(outstandingTotal)} icon={Receipt} tone="blue" />
        <StatTile label="Overdue invoices" value={overdue.length} icon={AlertTriangle} tone={overdue.length ? "red" : "slate"} />
        <StatTile label="Total invoices" value={invoices.length} icon={CheckCircle2} tone="slate" />
      </div>
      <PortalInvoicesTable invoices={invoices} />
    </div>
  );
}
