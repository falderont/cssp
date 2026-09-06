"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { Bell, LogOut } from "lucide-react";
import { ROLE_LABELS, type Role } from "@/lib/constants";
import { initials } from "@/lib/utils";

export function Topbar({
  name,
  role,
  contextLabel,
  unreadCount,
  notificationsHref,
  children,
}: {
  name: string;
  role: string;
  contextLabel?: string;
  unreadCount?: number;
  notificationsHref: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 lg:px-8">
      <div className="flex items-center gap-3">
        {contextLabel && (
          <div className="hidden sm:block">
            <p className="text-xs text-slate-400">Account</p>
            <p className="text-sm font-medium text-slate-800">{contextLabel}</p>
          </div>
        )}
        {children}
      </div>
      <div className="flex items-center gap-4">
        <Link href={notificationsHref} className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100">
          <Bell className="h-5 w-5" />
          {!!unreadCount && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Link>
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/10 text-xs font-semibold text-brand">
            {initials(name)}
          </span>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-slate-800">{name}</p>
            <p className="text-xs text-slate-400">{ROLE_LABELS[role as Role] ?? role}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          title="Sign out"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
