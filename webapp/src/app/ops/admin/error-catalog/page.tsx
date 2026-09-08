import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { requireSysAdmin } from "@/lib/session";
import { ERROR_CODES, ERROR_CODE_LABELS, DEFAULT_ERROR_CATALOG } from "@/lib/errors";
import { getErrorCatalog } from "@/lib/error-catalog";
import { updateErrorDefinition, resetErrorDefinition } from "@/actions/system";
import { prisma } from "@/lib/prisma";
import { ActionForm } from "@/components/errors/action-form";

export default async function ErrorCatalogPage() {
  await requireSysAdmin();
  const [catalog, rows] = await Promise.all([getErrorCatalog(), prisma.systemErrorDefinition.findMany()]);
  const customizedCodes = new Set(rows.map((r) => r.code));

  return (
    <div>
      <PageHeader
        title="Error handling"
        description="What every exception in the app shows the user — a pop-up dialog for anything a form action throws, and this same copy on the full error page for anything else. Customize the wording per error type below; codes themselves come from the app's error classification and can't be added or removed here."
      />
      <div className="space-y-4">
        {ERROR_CODES.map((code) => {
          const entry = catalog[code];
          const isCustomized = customizedCodes.has(code);
          const updateBound = updateErrorDefinition.bind(null, code);
          const resetBound = resetErrorDefinition.bind(null, code);
          return (
            <Card key={code}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardTitle>{ERROR_CODE_LABELS[code]}</CardTitle>
                  <Badge tone="slate">{code}</Badge>
                  {isCustomized && <Badge tone="blue">Customized</Badge>}
                </div>
                {isCustomized && (
                  <ActionForm action={resetBound}>
                    <Button type="submit" size="sm" variant="ghost">
                      Reset to default
                    </Button>
                  </ActionForm>
                )}
              </CardHeader>
              <CardBody>
                <ActionForm action={updateBound} className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <Field label="Dialog title" htmlFor={`title-${code}`} required hint="Shown as the pop-up/page heading.">
                    <Input id={`title-${code}`} name="title" defaultValue={entry.title} required />
                  </Field>
                  <Field
                    label="User-facing fallback message"
                    htmlFor={`fallback-${code}`}
                    required
                    hint={
                      code === "UNKNOWN"
                        ? "Always shown for this code — its real error message is never surfaced, since it could contain internal details."
                        : "Only shown when the specific error itself carries no message of its own."
                    }
                  >
                    <Input id={`fallback-${code}`} name="fallbackMessage" defaultValue={entry.fallbackMessage} required />
                  </Field>
                  <div className="md:col-span-2">
                    <Field label="When this fires (admin-only note)" htmlFor={`desc-${code}`} required>
                      <Textarea id={`desc-${code}`} name="description" defaultValue={entry.description} required className="min-h-[60px]" />
                    </Field>
                  </div>
                  <div className="md:col-span-2">
                    <Button type="submit" size="sm">
                      Save
                    </Button>
                  </div>
                </ActionForm>
              </CardBody>
            </Card>
          );
        })}
      </div>
      <p className="mt-4 text-xs text-slate-400">
        Defaults ship in code (src/lib/errors.ts) — this screen only stores what's been changed, so &quot;Reset to default&quot; always has
        something to fall back to. E.g. the built-in copy for Unexpected error: &quot;{DEFAULT_ERROR_CATALOG.UNKNOWN.fallbackMessage}&quot;
      </p>
    </div>
  );
}
