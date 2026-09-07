import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { requireInternalUser } from "@/lib/session";
import { AREA_CHANGE_ACTIONS, AREA_LEVELS } from "@/lib/constants";
import { submitAreaChangeRequest } from "@/actions/area";
import { ActionForm } from "@/components/errors/action-form";

export default async function NewAreaChangeRequestPage() {
  await requireInternalUser();

  return (
    <div>
      <PageHeader
        title="Request an area change"
        description="Submit a ticket to Service Desk / Global Admin — they'll triage and apply it to master data."
      />
      <Card className="max-w-2xl">
        <CardBody>
          <ActionForm action={submitAreaChangeRequest} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Level" htmlFor="level" required>
                <Select id="level" name="level" required defaultValue="Site">
                  {AREA_LEVELS.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Action" htmlFor="action" required>
                <Select id="action" name="action" required defaultValue="Add">
                  {AREA_CHANGE_ACTIONS.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <Field label="Context" htmlFor="context" required hint="Where in the hierarchy — e.g. &quot;APAC &gt; Indonesia &gt; Batam&quot;">
              <Input id="context" name="context" required placeholder="APAC > Indonesia > Batam" />
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Proposed name" htmlFor="proposedName">
                <Input id="proposedName" name="proposedName" placeholder="e.g. NTP — Batam" />
              </Field>
              <Field label="Proposed code" htmlFor="proposedCode">
                <Input id="proposedCode" name="proposedCode" placeholder="e.g. NTP" />
              </Field>
            </div>
            <Field label="Notes" htmlFor="notes" required hint="Why this change is needed">
              <Textarea id="notes" name="notes" required placeholder="New site coming online next quarter, needs to exist before site enrollment can be created." />
            </Field>
            <Button type="submit">Submit request</Button>
          </ActionForm>
        </CardBody>
      </Card>
    </div>
  );
}
