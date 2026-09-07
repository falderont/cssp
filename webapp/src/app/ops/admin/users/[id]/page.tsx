import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { UserForm } from "@/components/admin/user-form";
import { requireSysAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { resetUserPassword } from "@/actions/admin";
import type { Role } from "@/lib/constants";
import { ActionForm } from "@/components/errors/action-form";

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireSysAdmin();
  const [target, accounts, facilities, regions, countries, teams] = await Promise.all([
    prisma.user.findUnique({ where: { id } }),
    prisma.enterpriseAccount.findMany({ orderBy: { name: "asc" } }),
    prisma.facility.findMany({ orderBy: { name: "asc" } }),
    prisma.region.findMany({ orderBy: { name: "asc" } }),
    prisma.country.findMany({ orderBy: { name: "asc" } }),
    prisma.team.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (!target) notFound();

  const resetBound = resetUserPassword.bind(null, target.id);

  return (
    <div>
      <PageHeader title={target.name} description={target.email} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardBody>
            <UserForm
              accounts={accounts}
              facilities={facilities}
              regions={regions}
              countries={countries}
              teams={teams}
              existingUser={{
                id: target.id,
                name: target.name,
                email: target.email,
                role: target.role as Role,
                enterpriseAccountId: target.enterpriseAccountId,
                restrictedFacilityId: target.restrictedFacilityId,
                restrictedRegionId: target.restrictedRegionId,
                restrictedCountryId: target.restrictedCountryId,
                csScope: target.csScope,
                teamId: target.teamId,
              }}
            />
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Reset password</CardTitle>
          </CardHeader>
          <CardBody>
            <ActionForm action={resetBound} className="space-y-3">
              <Field label="New password" htmlFor="password" required hint="At least 8 characters">
                <Input id="password" name="password" defaultValue="password123" required minLength={8} />
              </Field>
              <Button type="submit" variant="secondary" className="w-full">
                Reset password
              </Button>
            </ActionForm>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
