import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { Field, Select, Textarea, Input } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { requireCustomerUser } from "@/lib/session";
import { getCustomerSiteEnrollments } from "@/lib/scope";
import { createRemoteHandsTask } from "@/actions/remote-hands";
import { REMOTE_HANDS_TASK_LABELS, REMOTE_HANDS_TASK_TYPES } from "@/lib/constants";

export default async function NewRemoteHandsPage() {
  const user = await requireCustomerUser();
  const enrollments = await getCustomerSiteEnrollments(user);

  return (
    <div>
      <PageHeader title="New remote hands request" description="Power-cycle a device, a visual inspection, a cable patch, mounting hardware, KVM access, or something else." />
      <Card className="max-w-2xl">
        <CardBody>
          <form action={createRemoteHandsTask} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Site" htmlFor="siteEnrollmentId" required>
                <Select id="siteEnrollmentId" name="siteEnrollmentId" required>
                  {enrollments.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.facility.name} {e.spaceRef ? `(${e.spaceRef})` : ""}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Task type" htmlFor="taskType" required>
                <Select id="taskType" name="taskType" required defaultValue="PowerCycle">
                  {REMOTE_HANDS_TASK_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {REMOTE_HANDS_TASK_LABELS[t]}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <Field label="Asset / rack reference" htmlFor="assetRef" required>
              <Input id="assetRef" name="assetRef" required placeholder="e.g. Rack C14 — Switch SW-C14-02" />
            </Field>
            <Field label="Description" htmlFor="description" required>
              <Textarea id="description" name="description" required placeholder="What should the technician do?" />
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Preferred window start (optional)" htmlFor="requestedWindowStart">
                <Input id="requestedWindowStart" name="requestedWindowStart" type="datetime-local" />
              </Field>
              <Field label="Preferred window end (optional)" htmlFor="requestedWindowEnd">
                <Input id="requestedWindowEnd" name="requestedWindowEnd" type="datetime-local" />
              </Field>
            </div>
            <Button type="submit">Submit request</Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
