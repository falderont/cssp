import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { requireInternalUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { createMaintenanceEvent } from "@/actions/maintenance";
import { MAINTENANCE_IMPACTS, MAINTENANCE_TYPES } from "@/lib/constants";
import { humanize } from "@/lib/utils";
import { ActionForm } from "@/components/errors/action-form";

export default async function NewMaintenancePage() {
  await requireInternalUser();
  const facilities = await prisma.facility.findMany({ include: { buildings: true }, orderBy: { name: "asc" } });

  return (
    <div>
      <PageHeader title="Schedule maintenance" description="Tenants at this facility are notified automatically once scheduled." />
      <Card className="max-w-2xl">
        <CardBody>
          <ActionForm action={createMaintenanceEvent} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Facility" htmlFor="facilityId" required>
                <Select id="facilityId" name="facilityId" required>
                  {facilities.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Building (optional)" htmlFor="buildingId">
                <Select id="buildingId" name="buildingId" defaultValue="">
                  <option value="">Facility-wide</option>
                  {facilities.flatMap((f) => f.buildings).map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Type" htmlFor="maintType" required>
                <Select id="maintType" name="maintType" defaultValue="Planned" required>
                  {MAINTENANCE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Customer impact" htmlFor="impact" required>
                <Select id="impact" name="impact" defaultValue="NoImpact" required>
                  {MAINTENANCE_IMPACTS.map((i) => (
                    <option key={i} value={i}>
                      {humanize(i)}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Start" htmlFor="startAt" required>
                <Input id="startAt" name="startAt" type="datetime-local" required />
              </Field>
              <Field label="End" htmlFor="endAt" required>
                <Input id="endAt" name="endAt" type="datetime-local" required />
              </Field>
            </div>
            <Field label="Title" htmlFor="title" required>
              <Input id="title" name="title" required placeholder="e.g. Quarterly CRAC unit servicing" />
            </Field>
            <Field label="Description" htmlFor="description" required>
              <Textarea id="description" name="description" required placeholder="Scope of work and any redundancy notes…" />
            </Field>
            <Button type="submit">Schedule &amp; notify tenants</Button>
          </ActionForm>
        </CardBody>
      </Card>
    </div>
  );
}
