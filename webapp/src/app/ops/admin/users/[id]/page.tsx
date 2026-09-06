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

export default async function EditUserPage({ params }: { params: { id: string } }) {
  await requireSysAdmin();
  const [target, accounts, facilities, regions] = await Promise.all([
    prisma.user.findUnique({ where: { id: params.id } }),
    prisma.enterpriseAccount.findMany({ orderBy: { name: "asc" } }),
    prisma.facility.findMany({ orderBy: { name: "asc" } }),
    prisma.region.findMany({ orderBy: { name: "asc" } }),
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
              existingUser={{
                id: target.id,
                name: target.name,
                email: target.email,
                role: target.role as Role,
                enterpriseAccountId: target.enterpriseAccountId,
                restrictedFacilityId: target.restrictedFacilityId,
                restrictedRegionId: target.restrictedRegionId,
                csScope: target.csScope,
              }}
            />
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Reset password</CardTitle>
          </CardHeader>
          <CardBody>
            <form action={resetBound} className="space-y-3">
              <Field label="New password" htmlFor="password" required hint="At least 8 characters">
                <Input id="password" name="password" defaultValue="password123" required minLength={8} />
              </Field>
              <Button type="submit" variant="secondary" className="w-full">
                Reset password
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
