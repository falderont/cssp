import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { readStoredFile } from "@/lib/storage";
import { isInternalRole } from "@/lib/constants";

export async function GET(_req: Request, { params }: { params: Promise<{ photoId: string }> }) {
  const { photoId } = await params;
  const user = await requireUser();
  const photo = await prisma.deliveryPhoto.findUnique({
    where: { id: photoId },
    include: { delivery: true },
  });
  if (!photo) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!isInternalRole(user.role) && photo.delivery.enterpriseAccountId !== user.enterpriseAccountId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const buffer = await readStoredFile(photo.storageKey);
  const ext = photo.storageKey.split(".").pop()?.toLowerCase();
  const contentType = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
  return new NextResponse(new Uint8Array(buffer), { headers: { "Content-Type": contentType } });
}
