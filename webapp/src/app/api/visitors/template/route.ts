import { NextResponse } from "next/server";
import { requireCustomerUser } from "@/lib/session";

export async function GET() {
  await requireCustomerUser();
  const csv = [
    "fullName,company,idType,idNumber,email,phone",
    "Andi Prasetyo,PT Kabel Nusantara,KTP,3201xxxxxxxxxx01,andi@kabelnusantara.co.id,+62 812-0000-0001",
    "Lina Wijaya,Server Upgrade Vendor,Passport,A1234567,lina@vendor.com,+62 812-0000-0002",
  ].join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="visitor-upload-template.csv"',
    },
  });
}
