import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { readSessionCookie, type SessionPayload } from "@/lib/auth/session";

/**
 * Memoized per-request (React's cache()) so every Server Component / layout
 * that calls this during one render pass shares a single cookie read+verify —
 * see the Next.js auth guide's Data Access Layer pattern.
 */
export const getSession = cache(async (): Promise<SessionPayload | null> => {
  return readSessionCookie();
});

export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}
