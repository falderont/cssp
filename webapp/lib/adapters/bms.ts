
/**
 * Normalized shape a BACnet/Modbus/SNMP/MQTT protocol gateway would produce
 * upstream of CSSP — see docs/prd-v5.md Section 3. Optional/stretch per
 * docs/prd-v3.md and v4: this exists so the interface and a demoable UI are
 * real, not as a claim of live BMS connectivity.
 */
export type BmsReadingInput = {
  facilityId: string;
  buildingId?: string | null;
  metric: "power_kw" | "temperature_c" | "humidity_pct";
  value: number;
  unit: string;
  recordedAt: Date;
};

export interface BmsAdapter {
  generateReadings(facilityId: string, buildingId: string | null, hours: number): BmsReadingInput[];
}

const METRIC_BASELINES: Record<BmsReadingInput["metric"], { base: number; jitter: number; unit: string }> = {
  power_kw: { base: 340, jitter: 40, unit: "kW" },
  temperature_c: { base: 22, jitter: 2, unit: "°C" },
  humidity_pct: { base: 45, jitter: 8, unit: "%" },
};

/** Generates a plausible-looking hourly time series — seed data, not a live feed. */
export class MockBmsAdapter implements BmsAdapter {
  generateReadings(facilityId: string, buildingId: string | null, hours: number): BmsReadingInput[] {
    const readings: BmsReadingInput[] = [];
    const now = Date.now();
    (Object.keys(METRIC_BASELINES) as BmsReadingInput["metric"][]).forEach((metric) => {
      const { base, jitter, unit } = METRIC_BASELINES[metric];
      for (let h = hours - 1; h >= 0; h--) {
        const recordedAt = new Date(now - h * 60 * 60 * 1000);
        const value = Math.round((base + (Math.random() * 2 - 1) * jitter) * 10) / 10;
        readings.push({ facilityId, buildingId, metric, value, unit, recordedAt });
      }
    });
    return readings;
  }
}

export const bmsAdapter: BmsAdapter = new MockBmsAdapter();
