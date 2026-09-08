import { PageHeader } from "@/components/ui/page-header";
import { NotificationsList } from "@/components/notifications-list";
import { requireCustomerUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export default async function PortalNotificationsPage() {
  const user = await requireCustomerUser();
  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return (
    <div>
      <PageHeader title="Notifications" description="Incident, maintenance, ticket and billing alerts for your account." />
      <NotificationsList notifications={notifications} basePath="/portal/notifications" />
    </div>
  );
}
