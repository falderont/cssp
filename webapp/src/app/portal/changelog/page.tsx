import { PageHeader } from "@/components/ui/page-header";
import { ChangelogList } from "@/components/changelog/changelog-list";
import { requireCustomerUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export default async function PortalChangelogPage() {
  await requireCustomerUser();
  const entries = await prisma.changelogEntry.findMany({ orderBy: { publishedAt: "desc" } });

  return (
    <div>
      <PageHeader title="Changelog" description="What's new and what changed across the platform." />
      <ChangelogList entries={entries} canManage={false} />
    </div>
  );
}
