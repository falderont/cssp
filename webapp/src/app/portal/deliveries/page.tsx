import { Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { LinkButton } from "@/components/ui/button";
import { Table, THead, TH, TBody, TR, TD, EmptyRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/badge";
import { requireCustomerUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
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
        description="Incoming logistics and courier deliveries for your account."
        actions={
          <LinkButton href="/portal/deliveries/new">
            <Plus className="h-4 w-4" /> Expect a delivery
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
          </tr>
        </THead>
        <TBody>
          {deliveries.length === 0 && <EmptyRow colSpan={5} message="No deliveries logged yet." />}
          {deliveries.map((d) => (
            <TR key={d.id}>
              <TD className="font-medium text-slate-900">{d.courierName}</TD>
              <TD>{d.description}</TD>
              <TD>{d.facility.name}</TD>
              <TD>{d.expectedAt ? formatDate(d.expectedAt) : d.arrivedAt ? formatDateTime(d.arrivedAt) : "—"}</TD>
              <TD>
                <StatusBadge status={d.status} />
              </TD>
            </TR>
          ))}
        </TBody>
      </Table>
      <p className="mt-3 text-xs text-slate-400">
        Front desk logs deliveries as they physically arrive — pre-notifying an expected delivery here just gives them a
        heads up.
      </p>
    </div>
  );
}
