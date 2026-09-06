import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { readStoredFile } from "@/lib/storage";
import { isInternalRole } from "@/lib/constants";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireUser();
  const task = await prisma.remoteHandsTask.findUnique({
    where: { id: params.id },
    include: { siteEnrollment: true },
  });
  if (!task || !task.completionPhotoUrl) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!isInternalRole(user.role) && task.siteEnrollment.enterpriseAccountId !== user.enterpriseAccountId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const buffer = await readStoredFile(task.completionPhotoUrl);
  const ext = task.completionPhotoUrl.split(".").pop()?.toLowerCase();
  const contentType = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
  return new NextResponse(new Uint8Array(buffer), { headers: { "Content-Type": contentType } });
}
