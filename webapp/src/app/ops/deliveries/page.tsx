import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { Table, THead, TH, TBody, TR, TD, EmptyRow } from "@/components/ui/table";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { requireInternalUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getOpsFacilityIds } from "@/lib/scope";
import { formatDate, formatDateTime } from "@/lib/utils";
import { logDeliveryArrival, updateDeliveryStatus } from "@/actions/deliveries";

export default async function OpsDeliveriesPage() {
  const user = await requireInternalUser();
  const scopedFacilityIds = await getOpsFacilityIds(user);
  const [deliveries, facilities, accounts] = await Promise.all([
    prisma.delivery.findMany({
      where: scopedFacilityIds ? { facilityId: { in: scopedFacilityIds } } : undefined,
      include: { facility: true, enterpriseAccount: true, receivedBy: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.facility.findMany({ where: scopedFacilityIds ? { id: { in: scopedFacilityIds } } : undefined, orderBy: { name: "asc" } }),
    prisma.enterpriseAccount.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader title="Deliveries" description="Incoming logistics traffic across every facility — log an arrival and track it through to hand-off." />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Table>
            <THead>
              <tr>
                <TH>Courier</TH>
                <TH>Description</TH>
                <TH>Facility</TH>
                <TH>For</TH>
                <TH>Status</TH>
                <TH>Actions</TH>
              </tr>
            </THead>
            <TBody>
              {deliveries.length === 0 && <EmptyRow colSpan={6} message="No deliveries logged yet." />}
              {deliveries.map((d) => {
                const receivedBound = updateDeliveryStatus.bind(null, d.id, "/ops/deliveries");
                return (
                  <TR key={d.id}>
                    <TD className="font-medium text-slate-900">{d.courierName}</TD>
                    <TD className="max-w-xs truncate">{d.description}</TD>
                    <TD>{d.facility.name}</TD>
                    <TD>{d.enterpriseAccount?.name ?? "—"}</TD>
                    <TD>
                      <StatusBadge status={d.status} />
                      <p className="mt-0.5 text-xs text-slate-400">
                        {d.expectedAt ? `Expected ${formatDate(d.expectedAt)}` : d.arrivedAt ? `Arrived ${formatDateTime(d.arrivedAt)}` : ""}
                      </p>
                    </TD>
                    <TD>
                      {(d.status === "Expected" || d.status === "Arrived") && (
                        <form action={receivedBound} className="flex items-center gap-1.5">
                          <input type="hidden" name="status" value="Received" />
                          <Button type="submit" size="sm" variant="secondary">
                            Mark received
                          </Button>
                        </form>
                      )}
                    </TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>
        </div>

        <Card>
          <CardBody>
            <p className="mb-3 text-sm font-medium text-slate-700">Log an arrival</p>
            <form action={logDeliveryArrival} className="space-y-3">
              <Field label="Facility" htmlFor="facilityId" required>
                <Select id="facilityId" name="facilityId" required>
                  {facilities.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="For tenant (optional)" htmlFor="enterpriseAccountId">
                <Select id="enterpriseAccountId" name="enterpriseAccountId" defaultValue="">
                  <option value="">General / provider</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Courier / carrier" htmlFor="courierName" required>
                <Input id="courierName" name="courierName" required />
              </Field>
              <Field label="Tracking number (optional)" htmlFor="trackingNumber">
                <Input id="trackingNumber" name="trackingNumber" />
              </Field>
              <Field label="Recipient (optional)" htmlFor="recipientName">
                <Input id="recipientName" name="recipientName" />
              </Field>
              <Field label="Description" htmlFor="description" required>
                <Textarea id="description" name="description" required placeholder="Packages, pallets, hardware…" />
              </Field>
              <Button type="submit" className="w-full">
                Log arrival
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
