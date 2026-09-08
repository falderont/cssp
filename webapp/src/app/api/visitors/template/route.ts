import { NextResponse } from "next/server";
import { requireCustomerUser } from "@/lib/session";
import { generateVisitorTemplateXlsx } from "@/lib/visitor-import";

export async function GET() {
  await requireCustomerUser();
  const buffer = await generateVisitorTemplateXlsx();
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="visitor-upload-template.xlsx"',
    },
  });
}
