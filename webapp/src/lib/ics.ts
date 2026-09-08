// Minimal .ics (RFC 5545) generator — enough for a single VEVENT that
// Outlook/Google Calendar/Apple Calendar can all import directly.

function formatIcsDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function escapeIcsText(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

export function makeIcsEvent(opts: {
  uid: string;
  start: Date;
  end: Date;
  summary: string;
  description?: string;
  location?: string;
}): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//CSSP//Service Requests//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${opts.uid}@cssp`,
    `DTSTAMP:${formatIcsDate(new Date())}`,
    `DTSTART:${formatIcsDate(opts.start)}`,
    `DTEND:${formatIcsDate(opts.end)}`,
    `SUMMARY:${escapeIcsText(opts.summary)}`,
  ];
  if (opts.description) lines.push(`DESCRIPTION:${escapeIcsText(opts.description)}`);
  if (opts.location) lines.push(`LOCATION:${escapeIcsText(opts.location)}`);
  lines.push("END:VEVENT", "END:VCALENDAR");
  return lines.join("\r\n");
}
