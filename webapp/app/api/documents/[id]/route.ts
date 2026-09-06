import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/dal";
import { withTenant } from "@/lib/tenant";
import { readStoredFile } from "@/lib/storage";
import { isProvider } from "@/lib/rbac";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const doc = await withTenant(session.organizationId, (tx) => tx.document.findUnique({ where: { id } }));
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // RLS already confines this to the caller's organization; a customer additionally
  // may only fetch their own enterprise account's documents (provider staff can
  // fetch any document within their organization, for support purposes).
  if (!isProvider(session.role) && doc.enterpriseAccountId !== session.enterpriseAccountId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let bytes: Buffer;
  try {
    bytes = await readStoredFile(doc.fileRef);
  } catch {
    return NextResponse.json({ error: "File is unavailable." }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${doc.fileName.replace(/"/g, "")}"`,
      "Content-Length": String(bytes.length),
    },
  });
}
