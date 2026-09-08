import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { PreferencesPanel } from "@/components/profile/preferences-panel";
import { requireCustomerUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { initials } from "@/lib/utils";
import { ROLE_LABELS, type Role } from "@/lib/constants";

export default async function PortalProfilePage() {
  const sessionUser = await requireCustomerUser();
  const user = await prisma.user.findUniqueOrThrow({ where: { id: sessionUser.id } });

  return (
    <div>
      <PageHeader title="Profile & preferences" description="Your personal account details and how the portal looks for you." />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="flex items-center gap-3">
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatarUrl} alt={user.name} className="h-14 w-14 rounded-full object-cover" />
              ) : (
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand/10 text-lg font-semibold text-brand">
                  {initials(user.name)}
                </span>
              )}
              <div className="min-w-0">
                <p className="truncate font-display text-base font-semibold text-slate-900">{user.name}</p>
                <p className="truncate text-sm text-slate-500">{user.email}</p>
              </div>
            </div>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Role</dt>
                <dd className="font-medium text-slate-800">{ROLE_LABELS[user.role as Role] ?? user.role}</dd>
              </div>
              {user.title && (
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">Title</dt>
                  <dd className="font-medium text-slate-800">{user.title}</dd>
                </div>
              )}
              {user.phone && (
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">Phone</dt>
                  <dd className="font-medium text-slate-800">{user.phone}</dd>
                </div>
              )}
            </dl>
            <p className="text-xs text-slate-400">To change your name, email or role, contact your account admin.</p>
          </CardBody>
        </Card>

        <div className="lg:col-span-2">
          <PreferencesPanel accentColor={user.accentColor} density={user.density === "compact" ? "compact" : "comfortable"} mutedCategories={user.mutedNotificationCategories ? user.mutedNotificationCategories.split(",").filter(Boolean) : []} />
        </div>
      </div>
    </div>
  );
}
