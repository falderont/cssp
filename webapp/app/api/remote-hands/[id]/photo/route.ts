import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/dal";
import { withTenant } from "@/lib/tenant";
import { readStoredFile } from "@/lib/storage";
import { isProvider } from "@/lib/rbac";

const CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const task = await withTenant(session.organizationId, (tx) =>
    tx.remoteHandsTask.findUnique({ where: { id }, include: { siteEnrollment: true } }),
  );
  if (!task || !task.completionPhotoRef) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!isProvider(session.role)) {
    const scoped = await withTenant(session.organizationId, (tx) =>
      tx.siteEnrollment.findFirst({
        where: { id: task.siteEnrollmentId, enterpriseAccountId: session.enterpriseAccountId! },
      }),
    );
    if (!scoped) return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let bytes: Buffer;
  try {
    bytes = await readStoredFile(task.completionPhotoRef);
  } catch {
    return NextResponse.json({ error: "File is unavailable." }, { status: 404 });
  }

  const ext = task.completionPhotoRef.split(".").pop()?.toLowerCase() ?? "";
  return new NextResponse(new Uint8Array(bytes), {
    headers: { "Content-Type": CONTENT_TYPES[ext] ?? "application/octet-stream" },
  });
}
