"use client";

import { useRouter } from "next/navigation";
import { Check, Bell, BellOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { ACCENT_COLOR_PRESETS, NOTIFICATION_CATEGORIES, NOTIFICATION_CATEGORY_LABELS, type Density } from "@/lib/constants";
import { updateAccentColor, updateDensity, toggleMutedCategory } from "@/actions/profile";

export function PreferencesPanel({
  accentColor,
  density,
  mutedCategories,
}: {
  accentColor: string | null;
  density: Density;
  mutedCategories: string[];
}) {
  const router = useRouter();

  async function setAccent(color: string | null) {
    await updateAccentColor(color);
    router.refresh();
  }

  async function setDensity(value: Density) {
    await updateDensity(value);
    router.refresh();
  }

  async function toggleCategory(category: string) {
    await toggleMutedCategory(category);
    router.refresh();
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <section className="rounded-xl border border-slate-200/80 bg-white shadow-card">
        <header className="border-b border-slate-100 px-5 py-4">
          <h3 className="font-display text-base font-semibold text-slate-900">Appearance</h3>
          <p className="mt-0.5 text-sm text-slate-500">Personal to your account — nobody else sees these changes.</p>
        </header>
        <div className="space-y-5 px-5 py-5">
          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">Accent color</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setAccent(null)}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full border border-dashed border-slate-300 text-xs font-semibold text-slate-400 transition hover:border-slate-400",
                  !accentColor && "ring-2 ring-slate-900 ring-offset-2"
                )}
                title="Provider default"
              >
                ×
              </button>
              {ACCENT_COLOR_PRESETS.map((c) => {
                const active = accentColor === c.value;
                return (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => setAccent(c.value)}
                    title={c.key}
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-full ring-1 ring-inset ring-black/10 transition hover:scale-105",
                      active && "ring-2 ring-slate-900 ring-offset-2"
                    )}
                    style={{ backgroundColor: c.value }}
                  >
                    {active && <Check className="h-4 w-4 text-white" />}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">Density</p>
            <div className="inline-flex rounded-lg border border-slate-200 p-1">
              {(["comfortable", "compact"] as Density[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setDensity(option)}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm font-medium capitalize transition",
                    density === option ? "bg-brand text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-slate-500">Tightens table rows and card padding across the app.</p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200/80 bg-white shadow-card">
        <header className="border-b border-slate-100 px-5 py-4">
          <h3 className="font-display text-base font-semibold text-slate-900">Notification categories</h3>
          <p className="mt-0.5 text-sm text-slate-500">Choose what shows up in your badge, balloon and unread count.</p>
        </header>
        <ul className="divide-y divide-slate-100">
          {NOTIFICATION_CATEGORIES.map((category) => {
            const muted = mutedCategories.includes(category);
            return (
              <li key={category} className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="flex items-center gap-2.5">
                  <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg", muted ? "bg-slate-100 text-slate-400" : "bg-brand/10 text-brand")}>
                    {muted ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
                  </span>
                  <span className="text-sm font-medium text-slate-800">{NOTIFICATION_CATEGORY_LABELS[category] ?? category}</span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={!muted}
                  onClick={() => toggleCategory(category)}
                  className={cn("relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition", !muted ? "bg-brand" : "bg-slate-300")}
                >
                  <span className={cn("inline-block h-4 w-4 transform rounded-full bg-white shadow transition", !muted ? "translate-x-[18px]" : "translate-x-0.5")} />
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
