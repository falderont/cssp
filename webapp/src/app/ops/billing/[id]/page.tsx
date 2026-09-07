import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Select } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { InvoiceView } from "@/components/billing/invoice-view";
import { requireInternalUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { updateInvoiceStatus } from "@/actions/billing";
import { INVOICE_STATUSES } from "@/lib/constants";
import { ActionForm } from "@/components/errors/action-form";

export default async function OpsInvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireInternalUser();
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { lineItems: true, enterpriseAccount: true },
  });
  if (!invoice) notFound();

  const returnPath = `/ops/billing/${invoice.id}`;
  const statusBound = updateInvoiceStatus.bind(null, invoice.id, returnPath);

  return (
    <div>
      <PageHeader title={invoice.invoiceNumber} description={invoice.enterpriseAccount.name} />
      <InvoiceView
        invoice={invoice}
        printHref={`/ops/billing/${invoice.id}/print`}
        actions={
          <Card>
            <CardHeader>
              <CardTitle>Update status</CardTitle>
            </CardHeader>
            <CardBody>
              <ActionForm action={statusBound} className="flex items-end gap-3">
                <div className="flex-1">
                  <Field label="Status" htmlFor="status">
                    <Select id="status" name="status" defaultValue={invoice.status}>
                      {INVOICE_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>
                <Button type="submit">Save</Button>
              </ActionForm>
            </CardBody>
          </Card>
        }
      />
    </div>
  );
}
