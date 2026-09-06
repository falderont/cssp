import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { LinkButton } from "@/components/ui/button";
import { Table, THead, TH, TBody, TR, TD, EmptyRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/badge";
import { requireInternalUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatDate, formatMoney } from "@/lib/utils";

export default async function OpsBillingPage() {
  await requireInternalUser();
  const invoices = await prisma.invoice.findMany({
    include: { enterpriseAccount: true },
    orderBy: { issueDate: "desc" },
    take: 200,
  });

  return (
    <div>
      <PageHeader
        title="Billing"
        description="Issue and track invoices per tenant — space, power, cross-connects, remote hands, and more."
        actions={
          <LinkButton href="/ops/billing/new">
            <Plus className="h-4 w-4" /> New invoice
          </LinkButton>
        }
      />
      <Table>
        <THead>
          <tr>
            <TH>Invoice</TH>
            <TH>Tenant</TH>
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
                <Link href={`/ops/billing/${inv.id}`} className="font-medium text-brand hover:underline">
                  {inv.invoiceNumber}
                </Link>
              </TD>
              <TD>{inv.enterpriseAccount.name}</TD>
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
