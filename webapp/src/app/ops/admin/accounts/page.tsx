import { Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { LinkButton } from "@/components/ui/button";
import { AccountsTable } from "@/components/admin/accounts-table";
import { requireAccountManager } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { ROLES } from "@/lib/constants";

export default async function AccountsPage() {
  const user = await requireAccountManager();
  const accounts = await prisma.enterpriseAccount.findMany({
    include: { siteEnrollments: true, users: true },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <PageHeader
        title="Tenant accounts"
        description="Enterprise customers, enrolled across one or more of your facilities."
        actions={
          user.role === ROLES.SYS_ADMIN ? (
            <LinkButton href="/ops/admin/accounts/new">
              <Plus className="h-4 w-4" /> Add tenant account
            </LinkButton>
          ) : undefined
        }
      />
      <AccountsTable accounts={accounts} />
    </div>
  );
}
