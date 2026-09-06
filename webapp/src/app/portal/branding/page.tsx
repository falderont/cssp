import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { requireTenantGlobalAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { updateTenantBranding } from "@/actions/tenant";

export default async function TenantBrandingPage() {
  const user = await requireTenantGlobalAdmin();
  const account = await prisma.enterpriseAccount.findUnique({ where: { id: user.enterpriseAccountId } });

  return (
    <div>
      <PageHeader title="Branding" description="Your company logo and accent color, shown throughout your portal." />
      <Card className="max-w-lg">
        <CardBody className="space-y-6">
          <div className="flex items-center gap-4">
            {account?.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={account.logoUrl} alt={account.name} className="h-16 w-16 rounded-lg border border-slate-200 object-cover" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-slate-100 text-lg font-semibold text-slate-400">
                {account?.name.charAt(0)}
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-slate-900">{account?.name}</p>
              <p className="text-xs text-slate-400">Current logo</p>
            </div>
          </div>

          <form action={updateTenantBranding} className="space-y-4" encType="multipart/form-data">
            <Field label="Company logo" htmlFor="logo" hint="PNG or SVG, square works best">
              <input
                id="logo"
                name="logo"
                type="file"
                accept="image/*"
                className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand/10 file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand hover:file:bg-brand/20"
              />
            </Field>
            <Field label="Accent color (optional)" htmlFor="primaryColor" hint="Used for buttons and highlights in your portal">
              <Input id="primaryColor" name="primaryColor" type="color" defaultValue={account?.primaryColor ?? "#2563eb"} className="h-10 w-24 p-1" />
            </Field>
            <Button type="submit" className="w-full">
              Save branding
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
