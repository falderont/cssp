import { NextRequest, NextResponse } from "next/server";

// Stand-in for a campus access control system's badge-provisioning API.
// A real deployment points Facility.acsEndpointUrl at the vendor's actual
// endpoint (e.g. Lenel OnGuard, Genetec, Gallagher) instead of this route —
// CSSP integrates with the ACS, it does not replace it.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || !Array.isArray(body.visitors)) {
    return NextResponse.json({ error: "Invalid payload: expected { visitors: [...] }" }, { status: 400 });
  }

  await new Promise((resolve) => setTimeout(resolve, 150));

  const results = body.visitors.map((v: { visitorId?: string }, i: number) => ({
    visitorId: v.visitorId,
    badgeCode: `ACS-${Date.now().toString(36).toUpperCase()}-${i}`,
    accessZones: ["Visitor Lobby", "Loading Dock", body.building ? `${body.building} Corridor` : "Shared Corridor"],
  }));

  return NextResponse.json({
    status: "GRANTED",
    facilityCode: body.facilityCode,
    processedAt: new Date().toISOString(),
    results,
  });
}
