"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Bell, LogOut, Settings, ChevronDown, Check, Menu } from "lucide-react";
import { ROLE_LABELS, ACCENT_COLOR_PRESETS, type Role } from "@/lib/constants";
import { initials, formatDateTime, cn } from "@/lib/utils";
import { Popover } from "@/components/ui/popover";
import { Switch } from "@/components/ui/form";
import { EmptyState } from "@/components/ui/empty-state";
import { markNotificationReadInline, markAllNotificationsReadInline } from "@/actions/notifications";
import { updateAccentColor, updateDensity } from "@/actions/profile";
import { useMobileNav } from "./mobile-nav-context";

export type NotificationPreview = {
  id: string;
  title: string;
  body: string;
  category: string;
  linkUrl: string | null;
  isRead: boolean;
  createdAt: Date;
};

export function Topbar({
  name,
  email,
  role,
  avatarUrl,
  contextLabel,
  unreadCount,
  recentNotifications,
  notificationsHref,
  preferencesHref,
  changelogHref,
  currentAccentColor,
  currentDensity,
  children,
}: {
  name: string;
  email?: string | null;
  role: string;
  avatarUrl?: string | null;
  contextLabel?: string;
  unreadCount?: number;
  recentNotifications?: NotificationPreview[];
  notificationsHref: string;
  preferencesHref: string;
  changelogHref: string;
  currentAccentColor?: string | null;
  currentDensity?: "comfortable" | "compact";
  children?: React.ReactNode;
}) {
  const router = useRouter();
  const { setOpen: setMobileNavOpen } = useMobileNav();
  const notifications = recentNotifications ?? [];

  async function markOne(id: string) {
    await markNotificationReadInline(id);
    router.refresh();
  }

  async function markAll() {
    await markAllNotificationsReadInline();
    router.refresh();
  }

  async function setAccent(color: string | null) {
    await updateAccentColor(color);
    router.refresh();
  }

  async function setDensity(value: "comfortable" | "compact") {
    await updateDensity(value);
    router.refresh();
  }

  return (
    <header className="flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 lg:px-8">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setMobileNavOpen(true)}
          className="-ml-1.5 rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        {contextLabel && (
          <div className="hidden sm:block">
            <p className="text-xs text-slate-400">Account</p>
            <p className="text-sm font-medium text-slate-800">{contextLabel}</p>
          </div>
        )}
        {children}
      </div>
      <div className="flex items-center gap-2">
        <Popover
          align="right"
          panelClassName="w-96"
          trigger={({ toggle }) => (
            <button
              type="button"
              onClick={toggle}
              className="relative rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              {!!unreadCount && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
          )}
        >
          {(close) => (
            <div className="flex flex-col">
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
                <p className="font-display text-sm font-semibold text-slate-900">Notifications</p>
                {!!unreadCount && (
                  <button type="button" onClick={markAll} className="text-xs font-medium text-brand hover:underline">
                    Mark all as read
                  </button>
                )}
              </div>
              {notifications.length === 0 ? (
                <EmptyState icon={Bell} title="Nothing yet" description="You're all caught up." className="py-10" />
              ) : (
                <ul className="max-h-96 divide-y divide-slate-100 overflow-y-auto scroll-thin">
                  {notifications.map((n) => {
                    const body = (
                      <div className="min-w-0 flex-1">
                        <p className={cn("truncate text-sm font-medium", n.isRead ? "text-slate-600" : "text-slate-900")}>{n.title}</p>
                        <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{n.body}</p>
                        <p className="mt-1 text-[11px] text-slate-400">{formatDateTime(n.createdAt)}</p>
                      </div>
                    );
                    return (
                      <li key={n.id} className="flex items-start gap-2 px-4 py-3 hover:bg-slate-50/80">
                        {n.linkUrl ? (
                          <Link href={n.linkUrl} onClick={close} className="flex min-w-0 flex-1 items-start gap-2">
                            {body}
                          </Link>
                        ) : (
                          body
                        )}
                        {!n.isRead && (
                          <button
                            type="button"
                            onClick={() => markOne(n.id)}
                            title="Mark as read"
                            className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-brand hover:ring-2 hover:ring-brand/30"
                          />
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
              <div className="flex items-center border-t border-slate-100 text-sm font-medium text-brand">
                <Link href={notificationsHref} onClick={close} className="flex-1 px-4 py-2.5 text-center hover:bg-slate-50">
                  View all notifications
                </Link>
                <Link
                  href={changelogHref}
                  onClick={close}
                  className="flex-1 border-l border-slate-100 px-4 py-2.5 text-center hover:bg-slate-50"
                >
                  Changelog
                </Link>
              </div>
            </div>
          )}
        </Popover>

        <Popover
          align="right"
          panelClassName="w-72"
          trigger={({ toggle }) => (
            <button
              type="button"
              onClick={toggle}
              className="flex items-center gap-2 rounded-lg py-1.5 pl-1.5 pr-2 transition hover:bg-slate-100"
            >
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt={name} className="h-8 w-8 rounded-full object-cover" />
              ) : (
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/10 text-xs font-semibold text-brand">
                  {initials(name)}
                </span>
              )}
              <div className="hidden text-left sm:block">
                <p className="text-sm font-medium leading-tight text-slate-800">{name}</p>
                <p className="text-xs leading-tight text-slate-400">{ROLE_LABELS[role as Role] ?? role}</p>
              </div>
              <ChevronDown className="hidden h-3.5 w-3.5 text-slate-400 sm:block" />
            </button>
          )}
        >
          {(close) => (
            <div className="flex flex-col">
              <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt={name} className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/10 text-sm font-semibold text-brand">
                    {initials(name)}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{name}</p>
                  {email && <p className="truncate text-xs text-slate-400">{email}</p>}
                </div>
              </div>

              <div className="space-y-3 border-b border-slate-100 px-4 py-3">
                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">Accent color</p>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setAccent(null)}
                      title="Default"
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-full border border-dashed border-slate-300 text-[9px] font-semibold text-slate-400 hover:border-slate-400",
                        !currentAccentColor && "ring-2 ring-slate-900 ring-offset-2"
                      )}
                    >
                      ×
                    </button>
                    {ACCENT_COLOR_PRESETS.map((c) => {
                      const active = currentAccentColor === c.value;
                      return (
                        <button
                          key={c.key}
                          type="button"
                          onClick={() => setAccent(c.value)}
                          title={c.key}
                          className={cn(
                            "flex h-6 w-6 items-center justify-center rounded-full ring-1 ring-inset ring-black/10 transition hover:scale-110",
                            active && "ring-2 ring-slate-900 ring-offset-2"
                          )}
                          style={{ backgroundColor: c.value }}
                        >
                          {active && <Check className="h-3 w-3 text-white" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <Switch
                  key={currentDensity}
                  label="Compact density"
                  hint="Tighter rows and padding"
                  defaultChecked={currentDensity === "compact"}
                  onChange={(e) => setDensity(e.target.checked ? "compact" : "comfortable")}
                />
              </div>

              <div className="flex flex-col p-1.5">
                <Link
                  href={preferencesHref}
                  onClick={close}
                  className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-slate-700 hover:bg-slate-100"
                >
                  <Settings className="h-4 w-4 text-slate-400" />
                  Profile &amp; preferences
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
                >
                  <LogOut className="h-4 w-4 text-slate-400" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </Popover>
      </div>
    </header>
  );
}
