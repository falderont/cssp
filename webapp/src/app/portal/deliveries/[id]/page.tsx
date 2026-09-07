import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { requireCustomerUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getCustomerFacilityIds } from "@/lib/scope";
import { isDeliveryEditable } from "@/lib/deliveries";
import { updateDelivery } from "@/actions/deliveries";
import { formatDate, formatDateTime } from "@/lib/utils";

export default async function PortalDeliveryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireCustomerUser();
  const facilityIds = await getCustomerFacilityIds(user);
  const delivery = await prisma.delivery.findFirst({
    where: { id, enterpriseAccountId: user.enterpriseAccountId, facilityId: { in: facilityIds } },
    include: { facility: true, receivedBy: true, photos: { orderBy: { createdAt: "asc" } } },
  });
  if (!delivery) notFound();

  const editable = isDeliveryEditable(delivery);
  const loadingDocks = await prisma.loadingDock.findMany({
    where: { facilityId: delivery.facilityId, isActive: true },
    include: { building: true },
    orderBy: { name: "asc" },
  });
  const updateBound = updateDelivery.bind(null, delivery.id);

  return (
    <div>
      <Link href="/portal/deliveries" className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-brand">
        <ChevronLeft className="h-3.5 w-3.5" /> Deliveries
      </Link>
      <PageHeader
        title={delivery.courierName}
        description={delivery.facility.name}
        actions={<StatusBadge status={delivery.status} />}
      />

      {editable ? (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Edit ticket</CardTitle>
          </CardHeader>
          <CardBody>
            <form action={updateBound} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Courier / carrier" htmlFor="courierName" required>
                  <Input id="courierName" name="courierName" defaultValue={delivery.courierName} required />
                </Field>
                <Field label="Tracking number (optional)" htmlFor="trackingNumber">
                  <Input id="trackingNumber" name="trackingNumber" defaultValue={delivery.trackingNumber ?? ""} />
                </Field>
                <Field label="Expected date (optional)" htmlFor="expectedAt">
                  <Input
                    id="expectedAt"
                    name="expectedAt"
                    type="date"
                    defaultValue={delivery.expectedAt ? delivery.expectedAt.toISOString().slice(0, 10) : ""}
                  />
                </Field>
                <Field label="Recipient (optional)" htmlFor="recipientName">
                  <Input id="recipientName" name="recipientName" defaultValue={delivery.recipientName ?? ""} />
                </Field>
              </div>
              <Field
                label="Arrival location (optional)"
                htmlFor="loadingDockId"
                hint="Where the courier should be directed on-site — set up by your provider's building manager."
              >
                <Select id="loadingDockId" name="loadingDockId" defaultValue={delivery.loadingDockId ?? ""}>
                  <option value="">No specific location</option>
                  {loadingDocks.map((dock) => (
                    <option key={dock.id} value={dock.id}>
                      {dock.building ? `${dock.building.name}: ` : ""}
                      {dock.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Description" htmlFor="description" required>
                <Textarea id="description" name="description" defaultValue={delivery.description} required />
              </Field>
              <Button type="submit">Save changes</Button>
            </form>
          </CardBody>
        </Card>
      ) : (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Ticket details</CardTitle>
          </CardHeader>
          <CardBody className="space-y-2 text-sm">
            <Row label="Tracking number" value={delivery.trackingNumber ?? "—"} />
            <Row label="Description" value={delivery.description} />
            <Row label="Recipient" value={delivery.recipientName ?? "—"} />
            <Row label="Expected" value={delivery.expectedAt ? formatDate(delivery.expectedAt) : "—"} />
            {delivery.arrivedAt && <Row label="Arrived" value={formatDateTime(delivery.arrivedAt)} />}
            {delivery.receivedAt && (
              <Row label="Received" value={`${formatDateTime(delivery.receivedAt)}${delivery.receivedBy ? ` by ${delivery.receivedBy.name}` : ""}`} />
            )}
            {delivery.notes && <Row label="Notes" value={delivery.notes} />}
            <p className="pt-2 text-xs text-slate-400">
              {delivery.status === "Expected"
                ? "This ticket's expected date has passed, so it can no longer be edited — contact front desk if anything needs to change."
                : "This ticket has already been processed and can no longer be edited."}
            </p>
          </CardBody>
        </Card>
      )}

      {delivery.photos.length > 0 && (
        <Card className="mt-6 max-w-2xl">
          <CardHeader>
            <CardTitle>Arrival photos</CardTitle>
          </CardHeader>
          <CardBody className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {delivery.photos.map((photo) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={photo.id}
                src={`/api/deliveries/photos/${photo.id}`}
                alt="Delivery arrival evidence"
                className="aspect-square w-full rounded-lg border border-slate-200 object-cover"
              />
            ))}
          </CardBody>
        </Card>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-100 pb-2 last:border-0 last:pb-0">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-medium text-slate-800">{value}</span>
    </div>
  );
}
