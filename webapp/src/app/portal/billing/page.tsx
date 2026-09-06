import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Table, THead, TH, TBody, TR, TD, EmptyRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/badge";
import { StatTile } from "@/components/ui/stat-tile";
import { requireCustomerUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatDate, formatMoney } from "@/lib/utils";
import { Receipt, AlertTriangle, CheckCircle2 } from "lucide-react";

export default async function PortalBillingPage() {
  const user = await requireCustomerUser();
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
      <Table>
        <THead>
          <tr>
            <TH>Invoice</TH>
            <TH>Period</TH>
            <TH>Issue date</TH>
            <TH>Due date</TH>
            <TH>Total</TH>
            <TH>Status</TH>
          </tr>
        </THead>
        <TBody>
          {invoices.length === 0 && <EmptyRow colSpan={6} message="No invoices yet." />}
          {invoices.map((inv) => (
            <TR key={inv.id}>
              <TD>
                <Link href={`/portal/billing/${inv.id}`} className="font-medium text-brand hover:underline">
                  {inv.invoiceNumber}
                </Link>
              </TD>
              <TD>
                {formatDate(inv.periodStart)} – {formatDate(inv.periodEnd)}
              </TD>
              <TD>{formatDate(inv.issueDate)}</TD>
              <TD>{formatDate(inv.dueDate)}</TD>
              <TD>{formatMoney(inv.total, inv.currency)}</TD>
              <TD>
                <StatusBadge status={inv.status} />
              </TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </div>
  );
}
