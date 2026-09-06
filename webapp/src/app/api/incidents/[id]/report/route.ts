import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { readStoredFile } from "@/lib/storage";
import { isInternalRole } from "@/lib/constants";
import { getCustomerFacilityIds } from "@/lib/scope";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const incident = await prisma.incident.findUnique({ where: { id } });
  if (!incident || !incident.reportStorageKey) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!isInternalRole(user.role)) {
    if (!incident.isCustomerVisible) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const facilityIds = await getCustomerFacilityIds(user);
    if (!facilityIds.includes(incident.facilityId)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const buffer = await readStoredFile(incident.reportStorageKey);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${incident.reportFileName ?? "incident-report"}"`,
    },
  });
}
