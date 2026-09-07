import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { UserForm } from "@/components/admin/user-form";
import { requireSysAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export default async function NewUserPage() {
  await requireSysAdmin();
  const [accounts, facilities, regions, countries, teams] = await Promise.all([
    prisma.enterpriseAccount.findMany({ orderBy: { name: "asc" } }),
    prisma.facility.findMany({ orderBy: { name: "asc" } }),
    prisma.region.findMany({ orderBy: { name: "asc" } }),
    prisma.country.findMany({ orderBy: { name: "asc" } }),
    prisma.team.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader title="Add user" description="Internal staff or a tenant user, across any persona." />
      <Card className="max-w-2xl">
        <CardBody>
          <UserForm accounts={accounts} facilities={facilities} regions={regions} countries={countries} teams={teams} />
        </CardBody>
      </Card>
    </div>
  );
}
