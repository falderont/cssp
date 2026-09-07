import { Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { LinkButton } from "@/components/ui/button";
import { PortalDeliveriesTable } from "@/components/deliveries/portal-deliveries-table";
import { requireCustomerUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export default async function PortalDeliveriesPage() {
  const user = await requireCustomerUser();
  const deliveries = await prisma.delivery.findMany({
    where: { enterpriseAccountId: user.enterpriseAccountId },
    include: { facility: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Deliveries"
        description="Submit a delivery ticket for anything incoming to your site — front desk processes it from there through to hand-off."
        actions={
          <LinkButton href="/portal/deliveries/new">
            <Plus className="h-4 w-4" /> Submit a delivery ticket
          </LinkButton>
        }
      />
      <PortalDeliveriesTable deliveries={deliveries} />
      <p className="mt-3 text-xs text-slate-400">
        Only your company can submit a delivery ticket — front desk can't log one on your behalf. Once submitted, they'll
        mark it arrived and received (or reject it) as it moves through. You can edit a ticket's details until its expected
        date passes or front desk starts processing it.
      </p>
    </div>
  );
}
