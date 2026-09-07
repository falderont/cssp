import { PageHeader } from "@/components/ui/page-header";
import { Table, THead, TH, TBody, TR, TD, EmptyRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { requireInternalUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getOpsFacilityIds } from "@/lib/scope";
import { formatDate, formatDateTime } from "@/lib/utils";
import { markDeliveryArrived, markDeliveryReceived, rejectDelivery } from "@/actions/deliveries";

export default async function OpsDeliveriesPage() {
  const user = await requireInternalUser();
  const scopedFacilityIds = await getOpsFacilityIds(user);
  const deliveries = await prisma.delivery.findMany({
    where: scopedFacilityIds ? { facilityId: { in: scopedFacilityIds } } : undefined,
    include: { facility: true, enterpriseAccount: true, receivedBy: true },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 100,
  });

  return (
    <div>
      <PageHeader
        title="Deliveries"
        description="Delivery tickets submitted by tenants through the portal — process each through to arrival and hand-off, or reject it. Front desk doesn't log deliveries here; only the customer submits the request."
      />
      <Table>
        <THead>
          <tr>
            <TH>Courier</TH>
            <TH>Description</TH>
            <TH>Facility</TH>
            <TH>Tenant</TH>
            <TH>Status</TH>
            <TH>Actions</TH>
          </tr>
        </THead>
        <TBody>
          {deliveries.length === 0 && <EmptyRow colSpan={6} message="No delivery tickets submitted yet." />}
          {deliveries.map((d) => {
            const arrivedBound = markDeliveryArrived.bind(null, d.id, "/ops/deliveries");
            const receivedBound = markDeliveryReceived.bind(null, d.id, "/ops/deliveries");
            const rejectBound = rejectDelivery.bind(null, d.id, "/ops/deliveries");
            return (
              <TR key={d.id}>
                <TD className="font-medium text-slate-900">
                  {d.courierName}
                  {d.trackingNumber && <p className="text-xs text-slate-400">{d.trackingNumber}</p>}
                </TD>
                <TD className="max-w-xs truncate">{d.description}</TD>
                <TD>{d.facility.name}</TD>
                <TD>{d.enterpriseAccount.name}</TD>
                <TD>
                  <StatusBadge status={d.status} />
                  <p className="mt-0.5 text-xs text-slate-400">
                    {d.status === "Received" && d.receivedAt
                      ? `Received ${formatDateTime(d.receivedAt)}${d.receivedBy ? ` by ${d.receivedBy.name}` : ""}`
                      : d.arrivedAt
                        ? `Arrived ${formatDateTime(d.arrivedAt)}`
                        : d.expectedAt
                          ? `Expected ${formatDate(d.expectedAt)}`
                          : ""}
                  </p>
                </TD>
                <TD>
                  {(d.status === "Expected" || d.status === "Arrived") && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      {d.status === "Expected" && (
                        <form action={arrivedBound}>
                          <Button type="submit" size="sm" variant="secondary">
                            Mark arrived
                          </Button>
                        </form>
                      )}
                      <form action={receivedBound}>
                        <Button type="submit" size="sm" variant="secondary">
                          Mark received
                        </Button>
                      </form>
                      <form action={rejectBound}>
                        <Button type="submit" size="sm" variant="danger">
                          Reject
                        </Button>
                      </form>
                    </div>
                  )}
                </TD>
              </TR>
            );
          })}
        </TBody>
      </Table>
    </div>
  );
}
