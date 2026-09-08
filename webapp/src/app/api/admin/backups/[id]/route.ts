import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSysAdmin } from "@/lib/session";
import { readStoredFile } from "@/lib/storage";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireSysAdmin();
  const backup = await prisma.backupRecord.findUnique({ where: { id } });
  if (!backup) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const buffer = await readStoredFile(backup.storageKey);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/x-sqlite3",
      "Content-Disposition": `attachment; filename="${backup.fileName}"`,
    },
  });
}
