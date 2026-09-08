import { PageHeader } from "@/components/ui/page-header";
import { BlacklistTable } from "@/components/blacklist/blacklist-table";
import { requireBlacklistManager } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export default async function BlacklistPage() {
  await requireBlacklistManager();
  const entries = await prisma.blacklistEntry.findMany({ include: { createdBy: true }, orderBy: { createdAt: "desc" } });

  return (
    <div>
      <PageHeader
        title="Visitor blacklist"
        description="Checked automatically against every incoming visitor — by name or ID number — before it reaches the ops approval queue."
      />
      <BlacklistTable entries={entries} />
    </div>
  );
}
