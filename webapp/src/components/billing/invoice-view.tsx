import Link from "next/link";
import { Printer } from "lucide-react";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Table, THead, TH, TBody, TR, TD } from "@/components/ui/table";
import { formatDate, formatMoney, humanize } from "@/lib/utils";
import type { EnterpriseAccount, Invoice, InvoiceLineItem } from "@prisma/client";

type FullInvoice = Invoice & { lineItems: InvoiceLineItem[]; enterpriseAccount: EnterpriseAccount };

export function InvoiceView({
  invoice,
  printHref,
  actions,
}: {
  invoice: FullInvoice;
  printHref: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex items-center justify-between">
          <div>
            <CardTitle>{invoice.invoiceNumber}</CardTitle>
            <p className="text-xs text-slate-500">{invoice.enterpriseAccount.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={invoice.status} />
            <Link href={printHref} className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50" title="Print / save as PDF">
              <Printer className="h-4 w-4" />
            </Link>
          </div>
        </CardHeader>
        <CardBody className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <Info label="Billing period" value={`${formatDate(invoice.periodStart)} – ${formatDate(invoice.periodEnd)}`} />
          <Info label="Issue date" value={formatDate(invoice.issueDate)} />
          <Info label="Due date" value={formatDate(invoice.dueDate)} />
          <Info label="Currency" value={invoice.currency} />
        </CardBody>
      </Card>

      <Card>
        <Table>
          <THead>
            <tr>
              <TH>Description</TH>
              <TH>Category</TH>
              <TH>Qty</TH>
              <TH>Unit price</TH>
              <TH>Amount</TH>
            </tr>
          </THead>
          <TBody>
            {invoice.lineItems.map((li) => (
              <TR key={li.id}>
                <TD>{li.description}</TD>
                <TD>{humanize(li.category)}</TD>
                <TD>{li.quantity}</TD>
                <TD>{formatMoney(li.unitPrice, invoice.currency)}</TD>
                <TD>{formatMoney(li.amount, invoice.currency)}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
        <CardBody className="ml-auto max-w-xs space-y-1 text-sm">
          <div className="flex justify-between text-slate-500">
            <span>Subtotal</span>
            <span>{formatMoney(invoice.subtotal, invoice.currency)}</span>
          </div>
          <div className="flex justify-between text-slate-500">
            <span>Tax</span>
            <span>{formatMoney(invoice.tax, invoice.currency)}</span>
          </div>
          <div className="flex justify-between border-t border-slate-100 pt-1 font-semibold text-slate-900">
            <span>Total</span>
            <span>{formatMoney(invoice.total, invoice.currency)}</span>
          </div>
        </CardBody>
        {invoice.notes && (
          <CardBody className="border-t border-slate-100 text-sm text-slate-600">{invoice.notes}</CardBody>
        )}
      </Card>

      {actions}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 font-medium text-slate-800">{value}</p>
    </div>
  );
}
