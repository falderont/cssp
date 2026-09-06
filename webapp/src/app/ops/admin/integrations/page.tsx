import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Field, Select, Textarea } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { requireSysAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { updateSystemIntegration } from "@/actions/system";
import { SYSTEM_INTEGRATION_CATALOG, SYSTEM_INTEGRATION_STATUSES } from "@/lib/constants";
import { formatDateTime } from "@/lib/utils";

export default async function SystemIntegrationsPage() {
  await requireSysAdmin();
  const rows = await prisma.systemIntegration.findMany();
  const byKey = new Map(rows.map((r) => [r.key, r]));

  return (
    <div>
      <PageHeader
        title="System integrations"
        description="External systems this portal mirrors or syncs with — ACS, DCIM, BMS, SSO and outbound email."
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {SYSTEM_INTEGRATION_CATALOG.map((def) => {
          const row = byKey.get(def.key);
          const updateBound = updateSystemIntegration.bind(null, def.key);
          return (
            <Card key={def.key}>
              <CardHeader className="flex items-center justify-between">
                <CardTitle>{def.name}</CardTitle>
                <StatusBadge status={row?.status ?? "NotConfigured"} />
              </CardHeader>
              <CardBody className="space-y-3">
                <p className="text-sm text-slate-500">{def.description}</p>
                <form action={updateBound} className="space-y-2">
                  <Field label="Status" htmlFor={`status-${def.key}`}>
                    <Select id={`status-${def.key}`} name="status" defaultValue={row?.status ?? "NotConfigured"}>
                      {SYSTEM_INTEGRATION_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Config (free-form, e.g. endpoint URL)" htmlFor={`config-${def.key}`}>
                    <Textarea id={`config-${def.key}`} name="configJson" defaultValue={row?.configJson ?? ""} rows={2} />
                  </Field>
                  <div className="flex items-center justify-between pt-1">
                    <p className="text-xs text-slate-400">
                      {row?.lastSyncAt ? `Last synced ${formatDateTime(row.lastSyncAt)}` : "Never synced"}
                    </p>
                    <Button type="submit" size="sm">
                      Save
                    </Button>
                  </div>
                </form>
              </CardBody>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
