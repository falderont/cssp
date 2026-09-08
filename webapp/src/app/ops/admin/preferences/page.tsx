import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { Field, Select, Input } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { requireSysAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { updateGlobalPreferences } from "@/actions/system";
import { CURRENCIES, TIMEZONES } from "@/lib/constants";
import { ActionForm } from "@/components/errors/action-form";

export default async function GlobalPreferencesPage() {
  await requireSysAdmin();
  const settings = await prisma.providerSettings.findUnique({ where: { id: "singleton" } });

  return (
    <div>
      <PageHeader title="Global preferences" description="Platform-wide defaults applied across every tenant and site." />
      <Card className="max-w-lg">
        <CardBody>
          <ActionForm action={updateGlobalPreferences} className="space-y-4">
            <Field label="Default currency" htmlFor="defaultCurrency" required>
              <Select id="defaultCurrency" name="defaultCurrency" defaultValue={settings?.defaultCurrency ?? "USD"} required>
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Default timezone" htmlFor="defaultTimezone" required>
              <Select id="defaultTimezone" name="defaultTimezone" defaultValue={settings?.defaultTimezone ?? "UTC"} required>
                {TIMEZONES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Session timeout (minutes)" htmlFor="sessionTimeoutMinutes" required hint="5–1440 minutes">
              <Input
                id="sessionTimeoutMinutes"
                name="sessionTimeoutMinutes"
                type="number"
                min={5}
                max={1440}
                defaultValue={settings?.sessionTimeoutMinutes ?? 60}
                required
              />
            </Field>
            <Button type="submit" className="w-full">
              Save preferences
            </Button>
          </ActionForm>
        </CardBody>
      </Card>
    </div>
  );
}
