import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { readStoredFile } from "@/lib/storage";
import { isInternalRole } from "@/lib/constants";
import { canViewDocument, getCustomerFacilityIds } from "@/lib/scope";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await requireUser();
  const doc = await prisma.document.findUnique({ where: { id: params.id } });
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!isInternalRole(user.role)) {
    if (!user.enterpriseAccountId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const facilityIds = await getCustomerFacilityIds(user);
    if (!canViewDocument(doc, user.enterpriseAccountId, facilityIds)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const buffer = await readStoredFile(doc.storageKey);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": doc.mimeType,
      "Content-Disposition": `attachment; filename="${doc.fileName}"`,
    },
  });
}
