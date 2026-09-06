import { prisma } from "./prisma";
import { TELEMETRY_METRICS } from "./constants";

export async function getTelemetrySeries(facilityId: string, take = 48) {
  const series: Record<string, { time: string; value: number }[]> = {};
  for (const metric of TELEMETRY_METRICS) {
    const points = await prisma.telemetryPoint.findMany({
      where: { facilityId, metric },
      orderBy: { recordedAt: "desc" },
      take,
    });
    series[metric] = points
      .reverse()
      .map((p) => ({
        time: new Date(p.recordedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        value: Math.round(p.value * 100) / 100,
      }));
  }
  return series;
}
