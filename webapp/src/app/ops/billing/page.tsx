import { Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { LinkButton } from "@/components/ui/button";
import { OpsInvoicesTable } from "@/components/billing/ops-invoices-table";
import { requireInternalUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

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
      <OpsInvoicesTable invoices={invoices} />
    </div>
  );
}
