import clsx from "clsx";

type Tone = "slate" | "blue" | "amber" | "green" | "red" | "purple" | "teal";

const TONE_CLASSES: Record<Tone, string> = {
  slate: "bg-slate-100 text-slate-700",
  blue: "bg-brand-100 text-brand-700",
  amber: "bg-amber-100 text-amber-800",
  green: "bg-emerald-100 text-emerald-700",
  red: "bg-red-100 text-red-700",
  purple: "bg-violet-100 text-violet-700",
  teal: "bg-teal-100 text-teal-700",
};

const STATUS_TONE: Record<string, Tone> = {
  // Visitor
  PENDING: "amber",
  APPROVED: "green",
  DENIED: "red",
  CHECKED_IN: "blue",
  CHECKED_OUT: "slate",
  // Incident / maintenance
  SCHEDULED: "slate",
  IN_PROGRESS: "blue",
  MONITORING: "amber",
  RESOLVED: "green",
  // Ticket
  OPEN: "amber",
  WAITING_ON_CUSTOMER: "purple",
  CLOSED: "slate",
  // Remote hands
  SUBMITTED: "amber",
  ACCEPTED: "blue",
  COMPLETED: "green",
  // Invoice
  DRAFT: "slate",
  ISSUED: "blue",
  PAID: "green",
  OVERDUE: "red",
};

function humanize(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((w) => w[0]?.toUpperCase() + w.slice(1))
    .join(" ");
}

export function StatusBadge({ status, tone }: { status: string; tone?: Tone }) {
  const resolvedTone = tone ?? STATUS_TONE[status] ?? "slate";
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        TONE_CLASSES[resolvedTone],
      )}
    >
      {humanize(status)}
    </span>
  );
}
