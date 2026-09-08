"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export type SiteTab = { href: string; label: string; badge?: number };

// Longest-prefix match, same rule the main sidebar uses — a tab whose href
// is itself a prefix of a sibling tab's href (e.g. a section's index route)
// never falsely lights up both at once.
function activeHrefFor(tabs: SiteTab[], pathname: string): string | undefined {
  return tabs
    .map((t) => t.href)
    .filter((href) => pathname === href || pathname.startsWith(`${href}/`))
    .sort((a, b) => b.length - a.length)[0];
}

// Primary: underlined row directly under the site's page header. Secondary:
// a smaller pill row used inside the Front Line / Service Delivery sections
// to switch between the modules they bundle.
export function SiteTabs({ tabs, variant = "primary" }: { tabs: SiteTab[]; variant?: "primary" | "secondary" }) {
  const pathname = usePathname();
  const activeHref = activeHrefFor(tabs, pathname);

  if (variant === "secondary") {
    return (
      <div className="mb-4 flex flex-wrap gap-1.5 border-b border-slate-200 pb-4">
        {tabs.map((tab) => {
          const active = tab.href === activeHref;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition",
                active ? "bg-brand text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              {tab.label}
              {!!tab.badge && (
                <span
                  className={cn(
                    "flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold",
                    active ? "bg-white/25 text-white" : "bg-slate-300 text-slate-700"
                  )}
                >
                  {tab.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <div className="mb-[var(--gap-section)] flex flex-wrap gap-1 overflow-x-auto border-b border-slate-200/70">
      {tabs.map((tab) => {
        const active = tab.href === activeHref;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "shrink-0 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition",
              active ? "border-brand text-brand" : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800"
            )}
          >
            {tab.label}
            {!!tab.badge && (
              <span
                className={cn(
                  "ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                  active ? "bg-brand/10 text-brand" : "bg-slate-100 text-slate-500"
                )}
              >
                {tab.badge}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
