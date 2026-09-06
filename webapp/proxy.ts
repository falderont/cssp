import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decryptSession, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { isCustomer } from "@/lib/rbac";

/**
 * Optimistic-only per the Next.js auth guide: decrypts the session cookie (no
 * DB round trip) to redirect unauthenticated/wrong-portal requests early.
 * Every page and Server Action still calls requireSession()/lib/rbac.ts
 * checks itself — this is a UX shortcut, not the security boundary.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await decryptSession(request.cookies.get(SESSION_COOKIE_NAME)?.value);

  const isPortal = pathname.startsWith("/portal");
  const isConsole = pathname.startsWith("/console");
  const isLoginPage = pathname === "/login";

  if ((isPortal || isConsole) && !session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (isPortal && session && !isCustomer(session.role)) {
    return NextResponse.redirect(new URL("/console/dashboard", request.url));
  }
  if (isConsole && session && isCustomer(session.role)) {
    return NextResponse.redirect(new URL("/portal/dashboard", request.url));
  }
  if (isLoginPage && session) {
    const home = isCustomer(session.role) ? "/portal/dashboard" : "/console/dashboard";
    return NextResponse.redirect(new URL(home, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/portal/:path*", "/console/:path*", "/login"],
};
