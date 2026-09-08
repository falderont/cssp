import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { TelemetryChart } from "@/components/telemetry/telemetry-chart";
import { requireCustomerUser } from "@/lib/session";
import { getCustomerSiteEnrollments } from "@/lib/scope";
import { prisma } from "@/lib/prisma";
import { getTelemetrySeries } from "@/lib/telemetry-query";
import { TELEMETRY_METRICS, TELEMETRY_METRIC_LABELS } from "@/lib/constants";
import { formatDateTime } from "@/lib/utils";
import { Info } from "lucide-react";

export default async function PortalTelemetryPage({ searchParams }: { searchParams: Promise<{ site?: string }> }) {
  const { site } = await searchParams;
  const user = await requireCustomerUser();
  const enrollments = await getCustomerSiteEnrollments(user);
  const selected = enrollments.find((e) => e.facilityId === site) ?? enrollments[0];

  const source = selected
    ? await prisma.telemetrySource.findUnique({ where: { facilityId: selected.facilityId } })
    : null;
  const series = source?.status === "Connected" && selected ? await getTelemetrySeries(selected.facilityId) : null;

  return (
    <div>
      <PageHeader
        title="BMS Telemetry"
        description="An optional, read-only window into your building management system — CSSP integrates with your BMS, it does not replace it."
      />
      <div className="mb-4 flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-700">
        <Info className="h-4 w-4 shrink-0" />
        Metrics below mirror your facility&apos;s BMS/DCIM feed. Enabling this integration is optional and configured by your provider per site.
      </div>

      {!selected && (
        <Card>
          <CardBody className="text-center text-sm text-slate-400">No enrolled sites.</CardBody>
        </Card>
      )}

      {selected && (
        <Card className="mb-6">
          <CardBody className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-800">{selected.facility.name}</p>
              <p className="text-xs text-slate-500">
                {source?.vendor ? `Source: ${source.vendor}` : "No BMS source configured"}
                {source?.lastSyncAt ? ` · Last sync ${formatDateTime(source.lastSyncAt)}` : ""}
              </p>
            </div>
            <StatusBadge status={source?.status ?? "NotConfigured"} />
          </CardBody>
        </Card>
      )}

      {selected && series && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {TELEMETRY_METRICS.map((metric) => (
            <Card key={metric}>
              <CardHeader>
                <CardTitle>{TELEMETRY_METRIC_LABELS[metric]}</CardTitle>
              </CardHeader>
              <CardBody>
                <TelemetryChart data={series[metric]} label={TELEMETRY_METRIC_LABELS[metric]} />
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {selected && !series && (
        <Card>
          <CardBody className="text-center text-sm text-slate-400">
            <Badge tone="slate">Not connected</Badge>
            <p className="mt-2">
              Telemetry isn&apos;t enabled for this site yet. Ask your provider to connect it to your BMS/DCIM.
            </p>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
