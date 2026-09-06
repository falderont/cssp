import { DatabaseBackup, Wrench } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TH, TBody, TR, TD, EmptyRow } from "@/components/ui/table";
import { Field, Textarea } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { requireSysAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { createBackup, updateMaintenanceMode } from "@/actions/system";
import { formatDateTime } from "@/lib/utils";

export default async function BackupMaintenancePage() {
  await requireSysAdmin();
  const [backups, settings] = await Promise.all([
    prisma.backupRecord.findMany({ include: { createdBy: true }, orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.providerSettings.findUnique({ where: { id: "singleton" } }),
  ]);

  return (
    <div>
      <PageHeader title="Backup & app maintenance" description="Snapshot the database and control the platform-wide maintenance banner." />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <DatabaseBackup className="h-4 w-4" /> Backups
              </CardTitle>
              <form action={createBackup}>
                <Button type="submit" size="sm">
                  Create backup now
                </Button>
              </form>
            </CardHeader>
            <Table>
              <THead>
                <tr>
                  <TH>File</TH>
                  <TH>Size</TH>
                  <TH>Created by</TH>
                  <TH>Created</TH>
                  <TH>Actions</TH>
                </tr>
              </THead>
              <TBody>
                {backups.length === 0 && <EmptyRow colSpan={5} message="No backups yet." />}
                {backups.map((b) => (
                  <TR key={b.id}>
                    <TD className="font-medium text-slate-900">{b.fileName}</TD>
                    <TD>{(b.fileSizeKb / 1024).toFixed(2)} MB</TD>
                    <TD>{b.createdBy.name}</TD>
                    <TD>{formatDateTime(b.createdAt)}</TD>
                    <TD>
                      <a href={`/api/admin/backups/${b.id}`} className="text-sm text-brand hover:underline">
                        Download
                      </a>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </Card>
        </div>

        <Card className={settings?.maintenanceMode ? "border-amber-300" : undefined}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-4 w-4" /> Maintenance mode
            </CardTitle>
          </CardHeader>
          <CardBody>
            <form action={updateMaintenanceMode} className="space-y-3">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" name="maintenanceMode" defaultChecked={settings?.maintenanceMode ?? false} className="h-4 w-4 rounded border-slate-300" />
                Show maintenance banner to everyone except Global Sys Admins
              </label>
              <Field label="Message" htmlFor="maintenanceMessage">
                <Textarea
                  id="maintenanceMessage"
                  name="maintenanceMessage"
                  rows={3}
                  defaultValue={settings?.maintenanceMessage ?? ""}
                  placeholder="e.g. Scheduled maintenance until 10pm SGT."
                />
              </Field>
              <Button type="submit" variant="secondary" className="w-full">
                Save
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
