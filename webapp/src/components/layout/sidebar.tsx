"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  LayoutDashboard,
  Users,
  UsersRound,
  Siren,
  CalendarClock,
  Wrench,
  Gauge,
  FolderDown,
  Receipt,
  Trophy,
  Settings,
  Truck,
  IdCard,
  ShieldAlert,
  FileBarChart,
  Palette,
  Globe2,
  Map,
  Briefcase,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { IconKey, NavItem } from "./nav-config";

const ICONS: Record<IconKey, LucideIcon> = {
  LayoutDashboard,
  Users,
  UsersRound,
  Siren,
  CalendarClock,
  Wrench,
  Gauge,
  FolderDown,
  Receipt,
  Trophy,
  Settings,
  Truck,
  IdCard,
  ShieldAlert,
  FileBarChart,
  Palette,
  Globe2,
  Map,
  Building2,
  Briefcase,
};

export function Sidebar({
  navItems,
  companyName,
  logoUrl,
  portalLabel,
  tenantBrand,
}: {
  navItems: NavItem[];
  companyName: string;
  logoUrl?: string | null;
  portalLabel: string;
  tenantBrand?: { name: string; logoUrl?: string | null } | null;
}) {
  const pathname = usePathname();

  // Group consecutive items sharing a section under one header. Sections are
  // kept contiguous in nav-config.ts, so filtering by role never interleaves
  // them out of order.
  const sections: { name: string; items: NavItem[] }[] = [];
  for (const item of navItems) {
    const last = sections[sections.length - 1];
    if (last && last.name === item.section) last.items.push(item);
    else sections.push({ name: item.section, items: [item] });
  }

  // Several admin routes now nest under a shared "/ops/admin" prefix (Global
  // Overview, Regions, Facilities, Teams, ...), so a simple "is this href a
  // prefix of the pathname" check would light up more than one item at once.
  // Pick the longest matching href instead — the most specific route wins.
  const activeHref = navItems
    .map((item) => item.href)
    .filter((href) => pathname === href || pathname.startsWith(`${href}/`))
    .sort((a, b) => b.length - a.length)[0];

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
      <div className="flex h-16 items-center gap-2 border-b border-slate-100 px-5">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt={companyName} className="h-7 w-7 rounded" />
        ) : (
          <Building2 className="h-6 w-6 text-brand" />
        )}
        <div className="min-w-0">
          <p className="truncate font-display text-sm font-semibold text-slate-900">{companyName}</p>
          <p className="text-[11px] uppercase tracking-wide text-slate-400">{portalLabel}</p>
        </div>
      </div>
      {tenantBrand && (
        <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/60 px-5 py-2.5">
          {tenantBrand.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={tenantBrand.logoUrl} alt={tenantBrand.name} className="h-5 w-5 rounded object-cover" />
          ) : (
            <span className="flex h-5 w-5 items-center justify-center rounded bg-brand/10 text-[10px] font-semibold text-brand">
              {tenantBrand.name.charAt(0)}
            </span>
          )}
          <p className="truncate text-xs font-medium text-slate-600">{tenantBrand.name}</p>
        </div>
      )}
      <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-4">
        {sections.map((section) => (
          <div key={section.name}>
            <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{section.name}</p>
            <div className="space-y-1">
              {section.items.map((item) => {
                const active = item.href === activeHref;
                const Icon = ICONS[item.icon];
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                      active ? "bg-brand/10 text-brand" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
