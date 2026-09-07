"use client";

import { useEffect, useState } from "react";
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
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  X,
  Globe2,
  Map,
  MapPin,
  Ticket,
  Briefcase,
  Warehouse,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { groupNavItems, type IconKey, type NavItem } from "./nav-config";
import { useMobileNav } from "./mobile-nav-context";

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
  MapPin,
  Ticket,
  Building2,
  Briefcase,
  Warehouse,
};

// Several admin routes nest under a shared "/ops/admin" prefix (Global
// Overview, Site Management, Blacklist, ...), so a simple "is this href a
// prefix of the pathname" check would light up more than one item at once.
// Pick the longest matching href instead — the most specific route wins.
function activeHrefFor(navItems: NavItem[], pathname: string): string | undefined {
  return navItems
    .map((item) => item.href)
    .filter((href) => pathname === href || pathname.startsWith(`${href}/`))
    .sort((a, b) => b.length - a.length)[0];
}

const RAIL_KEY = "cssp.sidebar.rail";

type SidebarProps = {
  navItems: NavItem[];
  groupOrder: readonly string[];
  companyName: string;
  logoUrl?: string | null;
  portalLabel: string;
  tenantBrand?: { name: string; logoUrl?: string | null } | null;
};

export function Sidebar(props: SidebarProps) {
  const { open: mobileOpen, setOpen: setMobileOpen } = useMobileNav();

  return (
    <>
      <SidebarBody {...props} variant="desktop" />
      {mobileOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden" onClick={() => setMobileOpen(false)} aria-hidden />
          <div className="fixed inset-y-0 left-0 z-50 w-72 shadow-2xl lg:hidden">
            <SidebarBody {...props} variant="mobile" onNavigate={() => setMobileOpen(false)} />
          </div>
        </>
      )}
    </>
  );
}

function SidebarBody({
  navItems,
  groupOrder,
  companyName,
  logoUrl,
  portalLabel,
  tenantBrand,
  variant,
  onNavigate,
}: SidebarProps & { variant: "desktop" | "mobile"; onNavigate?: () => void }) {
  const pathname = usePathname();
  const { top, groups } = groupNavItems(navItems, groupOrder);
  const groupsKey = `cssp.sidebar.groups.${portalLabel}`;
  const isDesktop = variant === "desktop";

  const [rail, setRail] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(groups.map((g) => [g.name, true]))
  );

  useEffect(() => {
    try {
      if (isDesktop) {
        const railStored = localStorage.getItem(RAIL_KEY);
        if (railStored) setRail(railStored === "1");
      }
      const groupsStored = localStorage.getItem(groupsKey);
      if (groupsStored) setOpenGroups((prev) => ({ ...prev, ...JSON.parse(groupsStored) }));
      // eslint-disable-next-line no-empty
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const effectiveRail = isDesktop && rail;
  const activeHref = activeHrefFor(navItems, pathname);
  const activeGroup = groups.find((g) => g.items.some((i) => i.href === activeHref))?.name;

  function toggleGroup(name: string) {
    setOpenGroups((prev) => {
      const next = { ...prev, [name]: !prev[name] };
      try {
        localStorage.setItem(groupsKey, JSON.stringify(next));
      } catch {}
      return next;
    });
  }

  function toggleRail() {
    setRail((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(RAIL_KEY, next ? "1" : "0");
      } catch {}
      return next;
    });
  }

  const linkClasses = (active: boolean, extra?: string) =>
    cn(
      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
      active ? "bg-brand/10 text-brand" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
      extra
    );

  return (
    <aside
      className={cn(
        "flex h-full shrink-0 flex-col border-r border-slate-200 bg-white",
        isDesktop ? cn("hidden transition-[width] duration-150 lg:flex", effectiveRail ? "w-[68px]" : "w-64") : "w-72"
      )}
    >
      <div className={cn("flex h-16 items-center gap-2 border-b border-slate-100", effectiveRail ? "justify-center px-2" : "px-5")}>
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt={companyName} className="h-7 w-7 shrink-0 rounded" />
        ) : (
          <Building2 className="h-6 w-6 shrink-0 text-brand" />
        )}
        {!effectiveRail && (
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-sm font-semibold text-slate-900">{companyName}</p>
            <p className="text-[11px] uppercase tracking-wide text-slate-400">{portalLabel}</p>
          </div>
        )}
        {!isDesktop && (
          <button type="button" onClick={onNavigate} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {tenantBrand && !effectiveRail && (
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

      <nav className="scroll-thin flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {top.map((item) => {
          const active = item.href === activeHref;
          const Icon = ICONS[item.icon];
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              title={effectiveRail ? item.label : undefined}
              className={linkClasses(active, effectiveRail ? "justify-center px-0" : undefined)}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!effectiveRail && item.label}
            </Link>
          );
        })}

        {groups.map((group) => {
          const open = effectiveRail ? true : (openGroups[group.name] ?? true) || group.name === activeGroup;
          return (
            <div key={group.name} className={cn(!effectiveRail && "pt-2")}>
              {!effectiveRail && (
                <button
                  type="button"
                  onClick={() => toggleGroup(group.name)}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400 transition hover:text-slate-600"
                >
                  {group.name}
                  <ChevronDown className={cn("h-3.5 w-3.5 shrink-0 transition-transform", open ? "rotate-0" : "-rotate-90")} />
                </button>
              )}
              {open && (
                <div className={cn("space-y-1", !effectiveRail && "animate-collapse-fade relative ml-3 border-l border-slate-100 pl-2")}>
                  {group.items.map((item) => {
                    const active = item.href === activeHref;
                    const Icon = ICONS[item.icon];
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onNavigate}
                        title={effectiveRail ? item.label : undefined}
                        className={linkClasses(active, effectiveRail ? "justify-center px-0" : undefined)}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {!effectiveRail && <span className="truncate">{item.label}</span>}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {isDesktop && (
        <div className="border-t border-slate-100 p-2">
          <button
            type="button"
            onClick={toggleRail}
            title={rail ? "Expand sidebar" : "Collapse sidebar"}
            className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            {rail ? (
              <ChevronsRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronsLeft className="h-4 w-4" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      )}
    </aside>
  );
}
