import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { requireCustomerUser } from "@/lib/session";
import { getCustomerSiteEnrollments } from "@/lib/scope";
import { prisma } from "@/lib/prisma";
import { createExpectedDelivery } from "@/actions/deliveries";
import { ActionForm } from "@/components/errors/action-form";

export default async function NewDeliveryPage() {
  const user = await requireCustomerUser();
  const enrollments = await getCustomerSiteEnrollments(user);
  const facilityIds = Array.from(new Set(enrollments.map((e) => e.facilityId)));
  const loadingDocks = await prisma.loadingDock.findMany({
    where: { facilityId: { in: facilityIds }, isActive: true },
    include: { facility: true, building: true },
    orderBy: [{ facility: { name: "asc" } }, { name: "asc" }],
  });

  return (
    <div>
      <PageHeader title="Submit a delivery ticket" description="Tell front desk about an incoming courier or logistics delivery so they can process it on arrival." />
      <Card className="max-w-2xl">
        <CardBody>
          <ActionForm action={createExpectedDelivery} className="space-y-4">
            <Field label="Site" htmlFor="siteEnrollmentId" required>
              <Select id="siteEnrollmentId" name="siteEnrollmentId" required>
                {enrollments.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.facility.name}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Courier / carrier" htmlFor="courierName" required>
                <Input id="courierName" name="courierName" required placeholder="e.g. DHL, JNE, internal vendor" />
              </Field>
              <Field label="Tracking number (optional)" htmlFor="trackingNumber">
                <Input id="trackingNumber" name="trackingNumber" />
              </Field>
              <Field label="Expected date (optional)" htmlFor="expectedAt">
                <Input id="expectedAt" name="expectedAt" type="date" />
              </Field>
              <Field label="Recipient (optional)" htmlFor="recipientName">
                <Input id="recipientName" name="recipientName" placeholder="Who should receive it?" />
              </Field>
            </div>
            <Field
              label="Arrival location (optional)"
              htmlFor="loadingDockId"
              hint="Where the courier should be directed on-site — set up by your provider's building manager."
            >
              <Select id="loadingDockId" name="loadingDockId" defaultValue="">
                <option value="">No specific location</option>
                {loadingDocks.map((dock) => (
                  <option key={dock.id} value={dock.id}>
                    {dock.facility.name} — {dock.building ? `${dock.building.name}: ` : ""}
                    {dock.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Description" htmlFor="description" required>
              <Textarea id="description" name="description" required placeholder="What's being delivered?" />
            </Field>
            <Button type="submit">Submit ticket</Button>
          </ActionForm>
        </CardBody>
      </Card>
    </div>
  );
}
