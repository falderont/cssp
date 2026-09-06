import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/dal";
import { withTenant } from "@/lib/tenant";
import { isProvider } from "@/lib/rbac";
import { Sidebar } from "@/components/shell/sidebar";
import { TopBar } from "@/components/shell/top-bar";
import { CONSOLE_NAV } from "@/lib/nav";

export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  if (!isProvider(session.role)) redirect("/portal/dashboard");

  const organization = await withTenant(session.organizationId, (tx) =>
    tx.organization.findUniqueOrThrow({ where: { id: session.organizationId } }),
  );

  const items = CONSOLE_NAV.filter((item) => !item.show || item.show(session.role)).map(({ href, label }) => ({
    href,
    label,
  }));

  return (
    <div className="flex h-screen">
      <Sidebar items={items} brandLabel="Provider Console" />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar name={session.name} role={session.role} contextLabel={organization.name} />
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  );
}
