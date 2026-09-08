import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { readStoredFile } from "@/lib/storage";
import { isInternalRole } from "@/lib/constants";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const sr = await prisma.serviceRequest.findUnique({
    where: { id },
    include: { siteEnrollment: true },
  });
  if (!sr || !sr.signOffPdfStorageKey) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!isInternalRole(user.role) && sr.siteEnrollment.enterpriseAccountId !== user.enterpriseAccountId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const buffer = await readStoredFile(sr.signOffPdfStorageKey);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="signoff-${sr.id}.pdf"`,
    },
  });
}
