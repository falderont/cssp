import { Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { LinkButton } from "@/components/ui/button";
import { UsersTable } from "@/components/admin/users-table";
import { requireSysAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export default async function UsersPage() {
  await requireSysAdmin();
  const users = await prisma.user.findMany({
    include: { enterpriseAccount: true, restrictedFacility: true, restrictedRegion: true, restrictedCountry: true, team: true },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <PageHeader
        title="Users"
        description="Everyone who can sign in — every internal persona and every tenant persona."
        actions={
          <LinkButton href="/ops/admin/users/new">
            <Plus className="h-4 w-4" /> Add user
          </LinkButton>
        }
      />
      <UsersTable users={users} />
    </div>
  );
}
