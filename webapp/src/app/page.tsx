import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { defaultLandingPath } from "@/lib/auth";

export default async function RootPage() {
  const session = await getSession();
  if (!session?.user) redirect("/login");
  redirect(defaultLandingPath(session.user.role));
}
