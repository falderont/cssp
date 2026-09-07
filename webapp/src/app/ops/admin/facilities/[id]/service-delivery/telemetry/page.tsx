import { notFound, redirect } from "next/navigation";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { TelemetryChart } from "@/components/telemetry/telemetry-chart";
import { requireFacilityPageAccess } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getTelemetrySeries } from "@/lib/telemetry-query";
import { TELEMETRY_METRICS, TELEMETRY_METRIC_LABELS } from "@/lib/constants";
import { getFacilityTabAccess } from "@/lib/facility-tabs";

export default async function FacilityTelemetryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireFacilityPageAccess();
  const { canViewTelemetry } = getFacilityTabAccess(user.role);
  if (!canViewTelemetry) redirect(`/ops/admin/facilities/${id}/service-delivery`);

  const facility = await prisma.facility.findUnique({ where: { id }, include: { telemetrySource: true } });
  if (!facility) notFound();

  const series = facility.telemetrySource?.status === "Connected" ? await getTelemetrySeries(facility.id) : null;

  if (!series) {
    return (
      <Card>
        <CardBody className="text-center text-sm text-slate-400">
          Not connected. Configure a BMS source on the Site Integration tab and mark it Connected to mirror telemetry here (and in the
          tenant portal).
        </CardBody>
      </Card>
    );
  }

  return (
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
  );
}
