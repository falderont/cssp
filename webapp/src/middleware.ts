import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { isCustomerRole, isInternalRole } from "./lib/constants";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = String(token.role ?? "");
  if (pathname.startsWith("/ops") && !isInternalRole(role)) {
    return NextResponse.redirect(new URL("/portal", req.url));
  }
  if (pathname.startsWith("/portal") && !isCustomerRole(role)) {
    return NextResponse.redirect(new URL("/ops", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/portal/:path*", "/ops/:path*"],
};
