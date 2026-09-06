import { logout } from "@/lib/auth/actions";
import { ROLE_LABEL } from "@/lib/nav";
import type { Role } from "@/lib/generated/prisma/client";

export function TopBar({
  name,
  role,
  contextLabel,
  switcher,
}: {
  name: string;
  role: Role;
  contextLabel: string;
  switcher?: React.ReactNode;
}) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-slate-700">{contextLabel}</span>
        {switcher}
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium text-ink-900">{name}</p>
          <p className="text-xs text-slate-400">{ROLE_LABEL(role)}</p>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
          >
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}
