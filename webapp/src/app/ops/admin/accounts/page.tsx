import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { LinkButton } from "@/components/ui/button";
import { Table, THead, TH, TBody, TR, TD, EmptyRow } from "@/components/ui/table";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { requireSysAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export default async function AccountsPage() {
  await requireSysAdmin();
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
          <LinkButton href="/ops/admin/accounts/new">
            <Plus className="h-4 w-4" /> Add tenant account
          </LinkButton>
        }
      />
      <Table>
        <THead>
          <tr>
            <TH>Name</TH>
            <TH>Tier</TH>
            <TH>Sites enrolled</TH>
            <TH>Users</TH>
            <TH>Status</TH>
          </tr>
        </THead>
        <TBody>
          {accounts.length === 0 && <EmptyRow colSpan={5} message="No tenant accounts yet." />}
          {accounts.map((a) => (
            <TR key={a.id}>
              <TD>
                <Link href={`/ops/admin/accounts/${a.id}`} className="font-medium text-brand hover:underline">
                  {a.name}
                </Link>
              </TD>
              <TD>
                <Badge>{a.tier}</Badge>
              </TD>
              <TD>{a.siteEnrollments.length}</TD>
              <TD>{a.users.length}</TD>
              <TD>
                <StatusBadge status={a.status} />
              </TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </div>
  );
}
