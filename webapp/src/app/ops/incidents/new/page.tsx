import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { requireInternalUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { createIncident } from "@/actions/incidents";
import { INCIDENT_CATEGORIES, INCIDENT_IMPACTED_SERVICES, INCIDENT_SEVERITIES } from "@/lib/constants";

export default async function NewIncidentPage() {
  await requireInternalUser();
  const facilities = await prisma.facility.findMany({ include: { buildings: true }, orderBy: { name: "asc" } });

  return (
    <div>
      <PageHeader title="Post an incident" description="Customer-visible by default — every enrolled tenant at the facility is notified." />
      <Card className="max-w-2xl">
        <CardBody>
          <form action={createIncident} className="space-y-4">
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
              <Field label="Category" htmlFor="category" required>
                <Select id="category" name="category" defaultValue="Other" required>
                  {INCIDENT_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Severity" htmlFor="severity" required>
                <Select id="severity" name="severity" defaultValue="P3" required>
                  {INCIDENT_SEVERITIES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Started at" htmlFor="startedAt" required>
                <Input id="startedAt" name="startedAt" type="datetime-local" required />
              </Field>
              <Field label="Granular location (optional)" htmlFor="locationDetail" hint="e.g. Floor 2, Server Hall B, Row 12">
                <Input id="locationDetail" name="locationDetail" placeholder="Floor 2, Server Hall B, Row 12" />
              </Field>
            </div>
            <Field label="Title" htmlFor="title" required>
              <Input id="title" name="title" required placeholder="e.g. Power distribution event" />
            </Field>
            <Field label="Description" htmlFor="description" required>
              <Textarea id="description" name="description" required placeholder="What happened, impact, and current mitigation…" />
            </Field>
            <div>
              <p className="mb-2 text-sm font-medium text-slate-700">Impacted services</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {INCIDENT_IMPACTED_SERVICES.map((s) => (
                  <label key={s} className="flex items-center gap-2 text-sm text-slate-600">
                    <input type="checkbox" name="impactedServices" value={s} className="rounded border-slate-300" />
                    {s}
                  </label>
                ))}
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" name="isCustomerVisible" defaultChecked className="rounded border-slate-300" />
              Notify and show this to tenants at the facility
            </label>
            <Button type="submit">Post incident</Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
