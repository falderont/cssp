import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { isInternalRole, SERVICE_REQUEST_CATEGORY_LABELS } from "@/lib/constants";
import { makeIcsEvent } from "@/lib/ics";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const sr = await prisma.serviceRequest.findUnique({
    where: { id },
    include: { siteEnrollment: { include: { facility: true } } },
  });
  if (!sr || !sr.scheduledStart) {
    return NextResponse.json({ error: "No scheduled date on this request" }, { status: 404 });
  }
  if (!isInternalRole(user.role) && sr.siteEnrollment.enterpriseAccountId !== user.enterpriseAccountId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const ics = makeIcsEvent({
    uid: sr.id,
    start: sr.scheduledStart,
    end: sr.scheduledEnd ?? new Date(sr.scheduledStart.getTime() + 60 * 60 * 1000),
    summary: `${SERVICE_REQUEST_CATEGORY_LABELS[sr.category] ?? sr.category}: ${sr.subject}`,
    description: sr.description,
    location: sr.siteEnrollment.facility.name,
  });

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="service-request-${sr.id}.ics"`,
    },
  });
}
