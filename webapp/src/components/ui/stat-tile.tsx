import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

const TONE_STYLES: Record<string, { icon: string; bar: string }> = {
  slate: { icon: "bg-slate-100 text-slate-600", bar: "bg-slate-300" },
  blue: { icon: "bg-blue-50 text-blue-600", bar: "bg-blue-500" },
  amber: { icon: "bg-amber-50 text-amber-600", bar: "bg-amber-500" },
  green: { icon: "bg-emerald-50 text-emerald-600", bar: "bg-emerald-500" },
  red: { icon: "bg-red-50 text-red-600", bar: "bg-red-500" },
  purple: { icon: "bg-violet-50 text-violet-600", bar: "bg-violet-500" },
};

export function StatTile({
  label,
  value,
  icon: Icon,
  tone = "slate",
  sub,
}: {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  tone?: "slate" | "blue" | "amber" | "green" | "red" | "purple";
  sub?: string;
}) {
  const styles = TONE_STYLES[tone] ?? TONE_STYLES.slate;
  return (
    <div className="group relative overflow-hidden rounded-xl border border-slate-200/80 bg-white p-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-card-hover">
      <span className={cn("absolute inset-y-0 left-0 w-1", styles.bar)} />
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        {Icon && (
          <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition group-hover:scale-105", styles.icon)}>
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>
      <p className="mt-2 font-display text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}
