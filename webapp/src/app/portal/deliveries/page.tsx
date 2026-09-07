import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { LinkButton } from "@/components/ui/button";
import { Table, THead, TH, TBody, TR, TD, EmptyRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/badge";
import { requireCustomerUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { isDeliveryEditable } from "@/lib/deliveries";
import { formatDate, formatDateTime } from "@/lib/utils";

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
      <Table>
        <THead>
          <tr>
            <TH>Courier</TH>
            <TH>Description</TH>
            <TH>Site</TH>
            <TH>Expected</TH>
            <TH>Status</TH>
            <TH>{null}</TH>
          </tr>
        </THead>
        <TBody>
          {deliveries.length === 0 && <EmptyRow colSpan={6} message="No deliveries logged yet." />}
          {deliveries.map((d) => (
            <TR key={d.id}>
              <TD className="font-medium text-slate-900">{d.courierName}</TD>
              <TD>{d.description}</TD>
              <TD>{d.facility.name}</TD>
              <TD>{d.expectedAt ? formatDate(d.expectedAt) : d.arrivedAt ? formatDateTime(d.arrivedAt) : "—"}</TD>
              <TD>
                <StatusBadge status={d.status} />
              </TD>
              <TD>
                <Link href={`/portal/deliveries/${d.id}`} className="text-sm font-medium text-brand hover:underline">
                  {isDeliveryEditable(d) ? "Edit" : "View"}
                </Link>
              </TD>
            </TR>
          ))}
        </TBody>
      </Table>
      <p className="mt-3 text-xs text-slate-400">
        Only your company can submit a delivery ticket — front desk can't log one on your behalf. Once submitted, they'll
        mark it arrived and received (or reject it) as it moves through. You can edit a ticket's details until its expected
        date passes or front desk starts processing it.
      </p>
    </div>
  );
}
