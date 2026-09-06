import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/dal";
import { isCustomer } from "@/lib/rbac";

export default async function RootPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  redirect(isCustomer(session.role) ? "/portal/dashboard" : "/console/dashboard");
}
