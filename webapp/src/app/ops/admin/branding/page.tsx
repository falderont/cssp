import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { requireSuperAdmin } from "@/lib/session";
import { getProviderBranding } from "@/lib/branding";
import { updateBranding } from "@/actions/admin";

export default async function BrandingPage() {
  await requireSuperAdmin();
  const branding = await getProviderBranding();

  return (
    <div>
      <PageHeader title="Branding" description="Shown across the internal console, the tenant portal, invoices, and the login screen." />
      <Card className="max-w-2xl">
        <CardBody>
          <form action={updateBranding} className="space-y-4">
            <div className="flex items-center gap-4">
              {branding.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={branding.logoUrl} alt={branding.companyName} className="h-14 w-14 rounded-lg border border-slate-200 object-contain" />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-dashed border-slate-300 text-xs text-slate-400">
                  Logo
                </div>
              )}
              <Field label="Replace logo" htmlFor="logo" hint="PNG or SVG, square works best">
                <input
                  id="logo"
                  name="logo"
                  type="file"
                  accept="image/*"
                  className="block text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand/10 file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand hover:file:bg-brand/20"
                />
              </Field>
            </div>
            <Field label="Company name" htmlFor="companyName" required>
              <Input id="companyName" name="companyName" required defaultValue={branding.companyName} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Primary color" htmlFor="primaryColor" required>
                <Input id="primaryColor" name="primaryColor" type="color" required defaultValue={branding.primaryColor} className="h-10 p-1" />
              </Field>
              <Field label="Secondary color" htmlFor="secondaryColor" required>
                <Input id="secondaryColor" name="secondaryColor" type="color" required defaultValue={branding.secondaryColor} className="h-10 p-1" />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Support email" htmlFor="supportEmail" required>
                <Input id="supportEmail" name="supportEmail" type="email" required defaultValue={branding.supportEmail} />
              </Field>
              <Field label="Support phone" htmlFor="supportPhone" required>
                <Input id="supportPhone" name="supportPhone" required defaultValue={branding.supportPhone} />
              </Field>
            </div>
            <Field label="Address" htmlFor="address">
              <Textarea id="address" name="address" defaultValue={branding.address ?? ""} />
            </Field>
            <Button type="submit">Save branding</Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
