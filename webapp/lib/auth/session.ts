import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { Role } from "@/lib/generated/prisma/client";

const COOKIE_NAME = "cssp_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7; // 7 days

const secret = process.env.AUTH_SECRET;
if (!secret) {
  throw new Error("AUTH_SECRET is not set — see .env.example");
}
const encodedSecret = new TextEncoder().encode(secret);

/**
 * The minimum claims every request needs to resolve tenant scoping and RBAC
 * without a database round trip — see lib/tenant.ts and lib/rbac.ts. Deliberately
 * excludes anything sensitive (no password hash, obviously, but also no CSAT/
 * engagement data) per the Next.js auth guide's session-payload guidance.
 */
export type SessionPayload = {
  userId: string;
  organizationId: string;
  role: Role;
  enterpriseAccountId: string | null;
  siteEnrollmentId: string | null;
  name: string;
  email: string;
};

export async function encryptSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(encodedSecret);
}

export async function decryptSession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, encodedSecret, { algorithms: ["HS256"] });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function createSessionCookie(payload: SessionPayload): Promise<void> {
  const token = await encryptSession(payload);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export async function readSessionCookie(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  return decryptSession(cookieStore.get(COOKIE_NAME)?.value);
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
