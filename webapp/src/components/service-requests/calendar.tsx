import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { getMonthGrid, occursOnDay, monthParam, MONTH_NAMES } from "@/lib/calendar";
import { SERVICE_REQUEST_CATEGORY_LABELS } from "@/lib/constants";

export type ServiceRequestCalendarEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  category: string;
};

const CATEGORY_DOT: Record<string, string> = {
  RemoteHands: "bg-blue-500",
  SiteWalkEscort: "bg-emerald-500",
  GeneralMeeting: "bg-purple-500",
};

export function ServiceRequestCalendar({
  year,
  month,
  events,
  basePath,
  detailBasePath,
}: {
  year: number;
  month: number;
  events: ServiceRequestCalendarEvent[];
  basePath: string;
  detailBasePath: string;
}) {
  const weeks = getMonthGrid(year, month);
  const prev = monthParam(year, month - 1);
  const next = monthParam(year, month + 1);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-base font-semibold text-slate-900">
          {MONTH_NAMES[month]} {year}
        </h3>
        <div className="flex gap-1">
          <Link href={`${basePath}?month=${prev}`} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <Link href={`${basePath}?month=${next}`} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg bg-slate-100 text-xs">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="bg-slate-50 px-2 py-1.5 text-center font-medium text-slate-500">
            {d}
          </div>
        ))}
        {weeks.flatMap((week, wi) =>
          week.map((cell, di) => {
            const dayEvents = events.filter((e) => occursOnDay(cell.date, e.start, e.end));
            return (
              <div
                key={`${wi}-${di}`}
                className={cn("min-h-[92px] bg-white p-1.5", !cell.inMonth && "bg-slate-50/60 text-slate-300")}
              >
                <p className={cn("text-right text-xs", cell.inMonth ? "text-slate-500" : "text-slate-300")}>
                  {cell.date.getUTCDate()}
                </p>
                <div className="mt-1 space-y-1">
                  {dayEvents.slice(0, 2).map((e) => (
                    <Link
                      key={e.id}
                      href={`${detailBasePath}/${e.id}`}
                      className="flex items-center gap-1 truncate rounded bg-slate-100 px-1 py-0.5 text-[10px] text-slate-700 hover:bg-slate-200"
                      title={e.title}
                    >
                      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", CATEGORY_DOT[e.category] ?? "bg-slate-400")} />
                      <span className="truncate">{e.title}</span>
                    </Link>
                  ))}
                  {dayEvents.length > 2 && <p className="px-1 text-[10px] text-slate-400">+{dayEvents.length - 2} more</p>}
                </div>
              </div>
            );
          })
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
        {Object.entries(CATEGORY_DOT).map(([category, dot]) => (
          <span key={category} className="flex items-center gap-1">
            <span className={cn("h-2 w-2 rounded-full", dot)} /> {SERVICE_REQUEST_CATEGORY_LABELS[category] ?? category}
          </span>
        ))}
      </div>
    </div>
  );
}
