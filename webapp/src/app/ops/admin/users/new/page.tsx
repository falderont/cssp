import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { UserForm } from "@/components/admin/user-form";
import { requireSuperAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export default async function NewUserPage() {
  await requireSuperAdmin();
  const [accounts, facilities] = await Promise.all([
    prisma.enterpriseAccount.findMany({ orderBy: { name: "asc" } }),
    prisma.facility.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader title="Add user" description="Internal staff or a tenant user." />
      <Card className="max-w-2xl">
        <CardBody>
          <UserForm accounts={accounts} facilities={facilities} />
        </CardBody>
      </Card>
    </div>
  );
}
