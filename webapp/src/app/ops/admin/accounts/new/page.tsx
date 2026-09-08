import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { requireSysAdmin } from "@/lib/session";
import { createEnterpriseAccount } from "@/actions/admin";
import { ActionForm } from "@/components/errors/action-form";

export default async function NewAccountPage() {
  await requireSysAdmin();

  return (
    <div>
      <PageHeader title="Add tenant account" description="You can enroll it at one or more facilities right after." />
      <Card className="max-w-2xl">
        <CardBody>
          <ActionForm action={createEnterpriseAccount} className="space-y-4">
            <Field label="Display name" htmlFor="name" required>
              <Input id="name" name="name" required placeholder="e.g. Meridian Logistics" />
            </Field>
            <Field label="Legal name (optional)" htmlFor="legalName">
              <Input id="legalName" name="legalName" placeholder="e.g. PT Meridian Logistik Indonesia" />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Tier" htmlFor="tier" required>
                <Select id="tier" name="tier" required defaultValue="Standard">
                  <option value="Standard">Standard</option>
                  <option value="Premium">Premium</option>
                  <option value="Enterprise">Enterprise</option>
                </Select>
              </Field>
              <Field label="Billing email" htmlFor="billingEmail">
                <Input id="billingEmail" name="billingEmail" type="email" placeholder="billing@tenant.com" />
              </Field>
            </div>
            <Button type="submit">Create account</Button>
          </ActionForm>
        </CardBody>
      </Card>
    </div>
  );
}
