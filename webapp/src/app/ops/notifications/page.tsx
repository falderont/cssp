import { PageHeader } from "@/components/ui/page-header";
import { NotificationsList } from "@/components/notifications-list";
import { requireInternalUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export default async function OpsNotificationsPage() {
  const user = await requireInternalUser();
  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return (
    <div>
      <PageHeader title="Notifications" description="Assignment and queue alerts." />
      <NotificationsList notifications={notifications} basePath="/ops/notifications" />
    </div>
  );
}
