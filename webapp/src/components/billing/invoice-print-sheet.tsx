import { PrintButton } from "@/components/print-button";
import { formatDate, formatMoney, humanize } from "@/lib/utils";
import type { EnterpriseAccount, Invoice, InvoiceLineItem } from "@prisma/client";
import type { ProviderBranding } from "@/lib/branding";

type FullInvoice = Invoice & { lineItems: InvoiceLineItem[]; enterpriseAccount: EnterpriseAccount };

export function InvoicePrintSheet({ invoice, branding }: { invoice: FullInvoice; branding: ProviderBranding }) {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="no-print mb-4 flex justify-end">
        <PrintButton />
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm print:border-0 print:shadow-none">
        <div className="flex items-start justify-between border-b border-slate-100 pb-6">
          <div>
            <p className="font-display text-lg font-semibold text-slate-900">{branding.companyName}</p>
            <p className="text-sm text-slate-500">{branding.address}</p>
            <p className="text-sm text-slate-500">{branding.supportEmail}</p>
          </div>
          <div className="text-right">
            <p className="font-display text-xl font-semibold text-slate-900">INVOICE</p>
            <p className="text-sm text-slate-500">{invoice.invoiceNumber}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 py-6 text-sm">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Bill to</p>
            <p className="mt-1 font-medium text-slate-800">{invoice.enterpriseAccount.name}</p>
            <p className="text-slate-500">{invoice.enterpriseAccount.billingEmail}</p>
          </div>
          <div className="text-right">
            <p>
              <span className="text-slate-400">Issue date: </span>
              {formatDate(invoice.issueDate)}
            </p>
            <p>
              <span className="text-slate-400">Due date: </span>
              {formatDate(invoice.dueDate)}
            </p>
            <p>
              <span className="text-slate-400">Period: </span>
              {formatDate(invoice.periodStart)} – {formatDate(invoice.periodEnd)}
            </p>
          </div>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400">
              <th className="py-2">Description</th>
              <th className="py-2">Category</th>
              <th className="py-2 text-right">Qty</th>
              <th className="py-2 text-right">Unit price</th>
              <th className="py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lineItems.map((li) => (
              <tr key={li.id} className="border-b border-slate-100">
                <td className="py-2">{li.description}</td>
                <td className="py-2">{humanize(li.category)}</td>
                <td className="py-2 text-right">{li.quantity}</td>
                <td className="py-2 text-right">{formatMoney(li.unitPrice, invoice.currency)}</td>
                <td className="py-2 text-right">{formatMoney(li.amount, invoice.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="ml-auto mt-4 max-w-xs space-y-1 text-sm">
          <div className="flex justify-between text-slate-500">
            <span>Subtotal</span>
            <span>{formatMoney(invoice.subtotal, invoice.currency)}</span>
          </div>
          <div className="flex justify-between text-slate-500">
            <span>Tax</span>
            <span>{formatMoney(invoice.tax, invoice.currency)}</span>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-1 font-semibold text-slate-900">
            <span>Total due</span>
            <span>{formatMoney(invoice.total, invoice.currency)}</span>
          </div>
        </div>

        {invoice.notes && <p className="mt-6 text-sm text-slate-500">{invoice.notes}</p>}
      </div>
    </div>
  );
}
