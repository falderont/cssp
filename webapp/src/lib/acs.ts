import { prisma } from "./prisma";

// Simulates pushing an approved visitor batch to the campus access control
// system. In production this hits the real ACS API configured per facility
// (Facility.acsEndpointUrl); with nothing configured it falls back to the
// built-in mock adapter so the integration point is demoable end-to-end.
export async function pushVisitorRequestToAcs(visitorRequestId: string): Promise<boolean> {
  const vr = await prisma.visitorRequest.findUniqueOrThrow({
    where: { id: visitorRequestId },
    include: {
      visitors: true,
      siteEnrollment: { include: { facility: true, enterpriseAccount: true } },
      building: true,
    },
  });

  const approvedVisitors = vr.visitors.filter((v) =>
    ["Approved", "CheckedIn", "CheckedOut"].includes(v.status)
  );

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const endpoint = vr.siteEnrollment.facility.acsEndpointUrl || `${baseUrl}/api/integrations/acs/mock`;

  const payload = {
    facilityCode: vr.siteEnrollment.facility.code,
    tenant: vr.siteEnrollment.enterpriseAccount.name,
    building: vr.building?.name ?? null,
    purpose: vr.purpose,
    visitDate: vr.visitDate,
    window: `${vr.windowStart}-${vr.windowEnd}`,
    visitors: approvedVisitors.map((v) => ({
      visitorId: v.id,
      fullName: v.fullName,
      company: v.company,
      idNumber: v.idNumber,
    })),
  };

  let status = 0;
  let responseBody = "";
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    status = res.status;
    responseBody = await res.text();
  } catch (err) {
    responseBody = `Request failed: ${(err as Error).message}`;
  }

  await prisma.acsIntegrationLog.create({
    data: {
      visitorRequestId,
      endpointUrl: endpoint,
      requestPayload: JSON.stringify(payload, null, 2),
      responseStatus: status,
      responseBody,
    },
  });

  const success = status >= 200 && status < 300;
  await prisma.visitorRequest.update({
    where: { id: visitorRequestId },
    data: { acsSyncStatus: success ? "Synced" : "Failed" },
  });

  if (success) {
    try {
      const parsed = JSON.parse(responseBody);
      if (Array.isArray(parsed.results)) {
        for (const r of parsed.results) {
          if (r.visitorId && r.badgeCode) {
            await prisma.visitor.update({ where: { id: r.visitorId }, data: { badgeCode: r.badgeCode } }).catch(() => {});
          }
        }
      }
    } catch {
      // Non-JSON or unexpected shape from a custom facility ACS endpoint — the raw log entry above still captures it.
    }
  }

  return success;
}
