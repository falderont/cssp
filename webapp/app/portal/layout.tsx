import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/dal";
import { withTenant } from "@/lib/tenant";
import { isCustomer } from "@/lib/rbac";
import { Sidebar } from "@/components/shell/sidebar";
import { TopBar } from "@/components/shell/top-bar";
import { SiteSwitcher } from "@/components/shell/site-switcher";
import { PORTAL_NAV } from "@/lib/nav";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  if (!isCustomer(session.role)) redirect("/console/dashboard");

  const { enterpriseAccount, enrollments } = await withTenant(session.organizationId, async (tx) => {
    const enterpriseAccount = await tx.enterpriseAccount.findUniqueOrThrow({
      where: { id: session.enterpriseAccountId! },
    });
    const enrollments = await tx.siteEnrollment.findMany({
      where:
        session.role === "CUSTOMER_SITE"
          ? { id: session.siteEnrollmentId! }
          : { enterpriseAccountId: session.enterpriseAccountId! },
      include: { facility: true },
      orderBy: { facility: { name: "asc" } },
    });
    return { enterpriseAccount, enrollments };
  });

  return (
    <div className="flex h-screen">
      <Sidebar items={PORTAL_NAV} brandLabel="Customer Portal" />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar
          name={session.name}
          role={session.role}
          contextLabel={enterpriseAccount.name}
          switcher={
            session.role === "CUSTOMER_GLOBAL" && enrollments.length > 1 ? (
              <SiteSwitcher options={enrollments.map((e) => ({ id: e.id, label: e.facility.name }))} />
            ) : undefined
          }
        />
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  );
}
