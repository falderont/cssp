import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { InvoiceForm } from "@/components/billing/invoice-form";
import { requireInternalUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export default async function NewInvoicePage() {
  await requireInternalUser();
  const accounts = await prisma.enterpriseAccount.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <PageHeader title="New invoice" description="Line items support space, power, cross-connects, remote hands and ad-hoc charges." />
      <Card className="max-w-3xl">
        <CardBody>
          <InvoiceForm accounts={accounts} />
        </CardBody>
      </Card>
    </div>
  );
}
