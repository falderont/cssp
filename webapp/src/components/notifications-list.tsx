import Link from "next/link";
import { Bell } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDateTime, cn } from "@/lib/utils";
import { markAllNotificationsRead, markNotificationRead } from "@/actions/notifications";
import { ActionForm } from "@/components/errors/action-form";

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  category: string;
  linkUrl: string | null;
  isRead: boolean;
  createdAt: Date;
};

export function NotificationsList({ notifications, basePath }: { notifications: NotificationItem[]; basePath: string }) {
  const markAllBound = markAllNotificationsRead.bind(null, basePath);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <ActionForm action={markAllBound}>
          <Button type="submit" variant="secondary" size="sm">
            Mark all as read
          </Button>
        </ActionForm>
      </div>
      <Card>
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-5 py-16 text-center text-slate-400">
            <Bell className="h-8 w-8" />
            <p className="text-sm">No notifications yet.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {notifications.map((n) => {
              const markBound = markNotificationRead.bind(null, n.id, basePath);
              const body = (
                <div>
                  <p className={cn("text-sm font-medium", n.isRead ? "text-slate-600" : "text-slate-900")}>{n.title}</p>
                  <p className="mt-0.5 text-sm text-slate-500">{n.body}</p>
                  <p className="mt-1 text-xs text-slate-400">{formatDateTime(n.createdAt)}</p>
                </div>
              );
              return (
                <li key={n.id} className="flex items-start justify-between gap-4 px-5 py-4 hover:bg-slate-50/60">
                  {n.linkUrl ? (
                    <Link href={n.linkUrl} className="min-w-0 flex-1">
                      {body}
                    </Link>
                  ) : (
                    <div className="min-w-0 flex-1">{body}</div>
                  )}
                  {!n.isRead && (
                    <ActionForm action={markBound}>
                      <button
                        type="submit"
                        title="Mark as read"
                        className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-brand hover:ring-2 hover:ring-brand/30"
                      />
                    </ActionForm>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
