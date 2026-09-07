import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Field, Input, Select } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { TelemetryChart } from "@/components/telemetry/telemetry-chart";
import { requireInternalUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getTelemetrySeries } from "@/lib/telemetry-query";
import { TELEMETRY_METRICS, TELEMETRY_METRIC_LABELS } from "@/lib/constants";
import { updateTelemetrySource } from "@/actions/telemetry";
import { ActionForm } from "@/components/errors/action-form";

export default async function OpsTelemetryFacilityPage({ params }: { params: Promise<{ facilityId: string }> }) {
  const { facilityId } = await params;
  await requireInternalUser();
  const facility = await prisma.facility.findUnique({
    where: { id: facilityId },
    include: { telemetrySource: true },
  });
  if (!facility) notFound();

  const series = facility.telemetrySource?.status === "Connected" ? await getTelemetrySeries(facility.id) : null;
  const returnPath = `/ops/telemetry/${facility.id}`;
  const updateBound = updateTelemetrySource.bind(null, facility.id, returnPath);

  return (
    <div>
      <PageHeader title={facility.name} description="BMS integration settings and live telemetry mirror." />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {series ? (
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
          ) : (
            <Card>
              <CardBody className="text-center text-sm text-slate-400">
                Not connected. Configure a source and mark it Connected to mirror telemetry here (and in the tenant portal).
              </CardBody>
            </Card>
          )}
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Integration settings</CardTitle>
          </CardHeader>
          <CardBody>
            <ActionForm action={updateBound} className="space-y-3">
              <div className="mb-2">
                <StatusBadge status={facility.telemetrySource?.status ?? "NotConfigured"} />
              </div>
              <Field label="BMS / DCIM vendor" htmlFor="vendor" hint="e.g. Schneider EcoStruxure, Generic BACnet Gateway">
                <Input id="vendor" name="vendor" defaultValue={facility.telemetrySource?.vendor ?? ""} />
              </Field>
              <Field label="Status" htmlFor="status">
                <Select id="status" name="status" defaultValue={facility.telemetrySource?.status ?? "NotConfigured"}>
                  <option value="NotConfigured">Not configured</option>
                  <option value="Connected">Connected</option>
                  <option value="Error">Error</option>
                </Select>
              </Field>
              <Button type="submit" className="w-full">
                Save
              </Button>
            </ActionForm>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
