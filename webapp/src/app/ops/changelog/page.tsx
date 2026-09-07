import { PageHeader } from "@/components/ui/page-header";
import { ChangelogList } from "@/components/changelog/changelog-list";
import { requireInternalUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { ROLES } from "@/lib/constants";

export default async function OpsChangelogPage() {
  const user = await requireInternalUser();
  const entries = await prisma.changelogEntry.findMany({ orderBy: { publishedAt: "desc" } });

  return (
    <div>
      <PageHeader title="Changelog" description="What's new and what changed across the platform." />
      <ChangelogList entries={entries} canManage={user.role === ROLES.SYS_ADMIN} />
    </div>
  );
}
