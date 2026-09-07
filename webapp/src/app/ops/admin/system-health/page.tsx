import { Activity, Clock, Cpu, Database, HardDrive } from "lucide-react";
import { stat } from "fs/promises";
import path from "path";
import { PageHeader } from "@/components/ui/page-header";
import { StatTile } from "@/components/ui/stat-tile";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { requireSysAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";

function formatUptime(totalSeconds: number): string {
  const seconds = Math.floor(totalSeconds);
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return [days ? `${days}d` : null, days || hours ? `${hours}h` : null, `${minutes}m`].filter(Boolean).join(" ");
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1024;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i++;
  }
  return `${value.toFixed(1)} ${units[i]}`;
}

export default async function SystemHealthPage() {
  await requireSysAdmin();

  const [userCount, activeUserCount, enterpriseAccountCount, facilityCount, incidentCount, serviceRequestCount, notificationCount, auditLogCount, dbStat, settings] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.enterpriseAccount.count(),
      prisma.facility.count(),
      prisma.incident.count(),
      prisma.serviceRequest.count(),
      prisma.notification.count(),
      prisma.auditLog.count(),
      stat(path.join(process.cwd(), "prisma", "dev.db")).catch(() => null),
      prisma.providerSettings.findUnique({ where: { id: "singleton" } }),
    ]);

  const memory = process.memoryUsage();

  const dataRows: { label: string; value: number; sub?: string }[] = [
    { label: "Users", value: userCount, sub: `${activeUserCount} active` },
    { label: "Tenant accounts", value: enterpriseAccountCount },
    { label: "Facilities", value: facilityCount },
    { label: "Incidents", value: incidentCount },
    { label: "Service requests", value: serviceRequestCount },
    { label: "Notifications sent", value: notificationCount },
    { label: "Audit log entries", value: auditLogCount },
  ];

  return (
    <div>
      <PageHeader
        title="System performance"
        description="Runtime health for this server process — a demo-scale view, not a substitute for a real APM."
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatTile label="Uptime" value={formatUptime(process.uptime())} icon={Clock} tone="blue" />
        <StatTile label="Memory (RSS)" value={formatBytes(memory.rss)} icon={Cpu} tone="slate" sub={`${formatBytes(memory.heapUsed)} heap used`} />
        <StatTile label="Database size" value={dbStat ? formatBytes(dbStat.size) : "—"} icon={HardDrive} tone="slate" />
        <StatTile label="Node runtime" value={process.version} icon={Activity} tone="slate" />
        <StatTile
          label="Maintenance mode"
          value={settings?.maintenanceMode ? "ON" : "Off"}
          icon={Database}
          tone={settings?.maintenanceMode ? "amber" : "green"}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Data volume</CardTitle>
          </CardHeader>
          <CardBody className="space-y-2">
            {dataRows.map((row) => (
              <div key={row.label} className="flex items-center justify-between border-b border-slate-100 py-1.5 text-sm last:border-0">
                <span className="text-slate-600">{row.label}</span>
                <span className="font-medium text-slate-900">
                  {row.value}
                  {row.sub && <span className="ml-1.5 text-xs font-normal text-slate-400">({row.sub})</span>}
                </span>
              </div>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Maintenance &amp; backups</CardTitle>
          </CardHeader>
          <CardBody className="space-y-3 text-sm text-slate-600">
            <p>
              Maintenance mode:{" "}
              <Badge tone={settings?.maintenanceMode ? "amber" : "green"}>{settings?.maintenanceMode ? "Showing banner" : "Off"}</Badge>
            </p>
            <p>Database snapshots, the maintenance banner and its message are managed on the Backup &amp; Maintenance page.</p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
