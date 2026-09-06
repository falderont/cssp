import type { IncidentSource, IncidentStatus, IncidentType } from "@/lib/generated/prisma/client";

/**
 * The normalized shape any incident/maintenance record takes regardless of
 * where it came from — a human publishing manually (the MVP default, per
 * docs/prd-v2.md Section 8) or a future DCIM/CMMS webhook. `source` records
 * which; both write into the same `incidents_and_maintenance` table, so the
 * provider console and customer timeline never fork into per-source views.
 * See docs/prd-v5.md Section 3.
 */
export type NormalizedIncidentInput = {
  facilityId: string;
  type: IncidentType;
  status: IncidentStatus;
  title: string;
  description: string;
  source: IncidentSource;
  startAt: Date;
  endAt?: Date | null;
};

export interface IncidentSourceAdapter {
  normalize(input: NormalizedIncidentInput): NormalizedIncidentInput;
}

/** The only implementation in the MVP — provider staff publish directly; see app/console/incidents. */
export class ManualIncidentSourceAdapter implements IncidentSourceAdapter {
  normalize(input: NormalizedIncidentInput): NormalizedIncidentInput {
    return { ...input, source: "MANUAL" as IncidentSource };
  }
}

export const incidentSourceAdapter: IncidentSourceAdapter = new ManualIncidentSourceAdapter();
