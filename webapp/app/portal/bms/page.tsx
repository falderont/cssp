import { requireSession } from "@/lib/auth/dal";
import { withTenant } from "@/lib/tenant";
import { resolvePortalScope } from "@/lib/portal-scope";
import { PageHeader } from "@/components/ui/page-header";
import { Card, EmptyState } from "@/components/ui/card";
import { Sparkline } from "@/components/ui/sparkline";
import { format } from "date-fns";

const METRIC_LABEL: Record<string, string> = {
  power_kw: "Power",
  temperature_c: "Temperature",
  humidity_pct: "Humidity",
};

export default async function PortalBmsPage({ searchParams }: { searchParams: Promise<{ site?: string }> }) {
  const session = await requireSession();
  const { site } = await searchParams;

  const { facilities, readings } = await withTenant(session.organizationId, async (tx) => {
    const scope = await resolvePortalScope(tx, session, site);
    const facilities = await tx.facility.findMany({ where: { id: { in: scope.facilityIds } } });
    const readings = await tx.bmsTelemetryReading.findMany({
      where: { facilityId: { in: scope.facilityIds } },
      orderBy: { recordedAt: "asc" },
    });
    return { facilities, readings };
  });

  const byFacility = new Map<string, typeof readings>();
  for (const r of readings) {
    if (!byFacility.has(r.facilityId)) byFacility.set(r.facilityId, []);
    byFacility.get(r.facilityId)!.push(r);
  }

  return (
    <div>
      <PageHeader
        title="BMS Telemetry"
        description="Optional module — normalized readings from your provider's building management system. Not every facility has this connected yet."
      />

      {facilities.length === 0 || readings.length === 0 ? (
        <EmptyState title="No telemetry connected" description="Ask your provider whether BMS Telemetry is enabled for this site." />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {facilities.map((f) => {
            const facilityReadings = byFacility.get(f.id) ?? [];
            if (facilityReadings.length === 0) return null;
            const metrics = [...new Set(facilityReadings.map((r) => r.metric))];
            return (
              <Card key={f.id} className="p-5">
                <h3 className="font-display text-base font-semibold text-ink-900">{f.name}</h3>
                <div className="mt-3 space-y-4">
                  {metrics.map((metric) => {
                    const series = facilityReadings.filter((r) => r.metric === metric);
                    const latest = series[series.length - 1];
                    return (
                      <div key={metric}>
                        <div className="flex items-baseline justify-between">
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                            {METRIC_LABEL[metric] ?? metric}
                          </p>
                          <p className="text-sm font-semibold text-ink-900">
                            {latest.value} {latest.unit}
                          </p>
                        </div>
                        <Sparkline metric={metric} values={series.map((r) => r.value)} />
                        <p className="text-[10px] text-slate-300">Last 24h · updated {format(latest.recordedAt, "HH:mm")}</p>
                      </div>
                    );
                  })}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
