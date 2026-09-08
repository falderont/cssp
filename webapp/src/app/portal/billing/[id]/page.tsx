import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InvoiceView } from "@/components/billing/invoice-view";
import { requireTenantBillingViewer } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { payInvoice } from "@/actions/billing";
import { ActionForm } from "@/components/errors/action-form";

export default async function PortalInvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireTenantBillingViewer();
  const invoice = await prisma.invoice.findFirst({
    where: { id, enterpriseAccountId: user.enterpriseAccountId },
    include: { lineItems: true, enterpriseAccount: true },
  });
  if (!invoice) notFound();

  const returnPath = `/portal/billing/${invoice.id}`;
  const payBound = payInvoice.bind(null, invoice.id, returnPath);
  const canPay = invoice.status === "Sent" || invoice.status === "Overdue";

  return (
    <div>
      <PageHeader title={invoice.invoiceNumber} />
      <InvoiceView
        invoice={invoice}
        printHref={`/portal/billing/${invoice.id}/print`}
        actions={
          canPay ? (
            <Card>
              <CardBody className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-800">Ready to pay?</p>
                  <p className="text-xs text-slate-500">Demo payment — instantly marks this invoice as paid.</p>
                </div>
                <ActionForm action={payBound}>
                  <Button type="submit">Pay now</Button>
                </ActionForm>
              </CardBody>
            </Card>
          ) : undefined
        }
      />
    </div>
  );
}
