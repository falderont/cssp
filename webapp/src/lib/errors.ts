// App-wide error classification — shared by the pop-up error dialog
// (components/errors/error-dialog-provider.tsx), the controlled error pages
// (app/**/error.tsx), and the admin-editable catalog they both read from
// (SystemErrorDefinition, managed at /ops/admin/error-catalog — see
// getErrorCatalog() in lib/error-catalog.ts for the DB-backed lookup).
//
// A thrown Error's `.message` is the only thing guaranteed to survive a
// Server Action or Server Component crossing back to the client — Next
// does not serialize custom Error subclasses or extra properties. So a
// code is attached with a plain string prefix ("CODE::rest of message")
// rather than a custom Error subclass, and stripped back off on the way in.
//
// Deliberately has no imports of its own (not even "@/lib/prisma") — this
// file needs to load from prisma/seed.ts, which runs via plain `tsx` with no
// path-alias resolution and only ever uses relative imports. Any DB-backed
// helper (see error-catalog.ts) belongs in its own file for exactly that
// reason.

export const ERROR_CODES = ["VALIDATION", "UNIQUE_CONSTRAINT", "FK_CONSTRAINT", "NOT_FOUND", "APPLICATION_ERROR", "UNKNOWN"] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

export function isErrorCode(value: string): value is ErrorCode {
  return (ERROR_CODES as readonly string[]).includes(value);
}

export const ERROR_CODE_LABELS: Record<ErrorCode, string> = {
  VALIDATION: "Validation",
  UNIQUE_CONSTRAINT: "Duplicate value",
  FK_CONSTRAINT: "Still in use",
  NOT_FOUND: "Not found",
  APPLICATION_ERROR: "Action rejected",
  UNKNOWN: "Unexpected error",
};

// Seed content and the fallback used if a code's DB row is ever missing —
// keep this in sync with prisma/seed.ts's SystemErrorDefinition rows.
export const DEFAULT_ERROR_CATALOG: Record<ErrorCode, { title: string; description: string; fallbackMessage: string }> = {
  VALIDATION: {
    title: "Check that field",
    description: "A form field failed a Zod schema check (missing, wrong type, or out of range) before it ever reached the database.",
    fallbackMessage: "Please check the highlighted field and try again.",
  },
  UNIQUE_CONSTRAINT: {
    title: "Duplicate value",
    description: "A create or update tried to write a value into a field that must be unique (a code, an email) and something else already has it.",
    fallbackMessage: "That value is already in use — choose a different one.",
  },
  FK_CONSTRAINT: {
    title: "Still in use",
    description: "A delete was refused because other records still reference this one (a site with buildings, a team with members, etc.).",
    fallbackMessage: "This record still has related data attached. Remove that first, then try deleting again.",
  },
  NOT_FOUND: {
    title: "Not found",
    description: "The record being viewed, edited, or deleted no longer exists — most often because someone else already removed it.",
    fallbackMessage: "That record no longer exists. It may have just been removed by someone else.",
  },
  APPLICATION_ERROR: {
    title: "Action rejected",
    description: "A deliberate, hand-written rejection from business logic — a permission check, a required field, a state the action refuses to run in.",
    fallbackMessage: "That action couldn't be completed.",
  },
  UNKNOWN: {
    title: "Unexpected error",
    description:
      "Anything that isn't one of the above — an unhandled exception, a bug. Its real message is never shown to end users (it could contain internal details), only this fallback.",
    fallbackMessage: "Something went wrong on our end. Please try again, and contact support if it keeps happening.",
  },
};

const CODE_PREFIX_SEPARATOR = "::";

// Server-side: tag a thrown Error with a machine-readable code.
export function appError(code: ErrorCode, message: string): Error {
  return new Error(`${code}${CODE_PREFIX_SEPARATOR}${message}`);
}

export type ClassifiedError = { code: ErrorCode; message: string };

// A Zod .parse() thrown straight through (most actions in this codebase
// don't wrap it) serializes its message as a JSON array of issues — pull
// the first issue's own message out rather than showing that raw JSON.
function tryExtractZodMessage(text: string): string | null {
  if (!text.trim().startsWith("[")) return null;
  try {
    const issues = JSON.parse(text);
    if (Array.isArray(issues) && issues.length > 0 && typeof issues[0]?.message === "string") {
      return issues[0].message;
    }
  } catch {
    // Not JSON, or not shaped like Zod issues — fall through to other checks.
  }
  return null;
}

// Prisma's findUniqueOrThrow/findFirstOrThrow (P2025) message shape.
const NOT_FOUND_PATTERN = /No '([A-Za-z]+)' record\(s\) found/;

export function classifyErrorMessage(rawMessage: string | null | undefined): ClassifiedError {
  const text = (rawMessage || "").trim();
  if (!text) return { code: "UNKNOWN", message: "" };

  const sepIndex = text.indexOf(CODE_PREFIX_SEPARATOR);
  if (sepIndex > 0) {
    const maybeCode = text.slice(0, sepIndex);
    if (isErrorCode(maybeCode)) {
      return { code: maybeCode, message: text.slice(sepIndex + CODE_PREFIX_SEPARATOR.length) };
    }
  }

  const zodMessage = tryExtractZodMessage(text);
  if (zodMessage) return { code: "VALIDATION", message: zodMessage };

  if (NOT_FOUND_PATTERN.test(text)) return { code: "NOT_FOUND", message: text };

  return { code: "APPLICATION_ERROR", message: text };
}

// Combine a classified error with the (possibly admin-edited) catalog row
// for its code to get what the dialog/error page should actually render.
// UNKNOWN never shows its real message — that's the one bucket that can
// contain arbitrary internal detail (a stray TypeError, a raw DB error).
export function resolveErrorDisplay(
  classified: ClassifiedError,
  catalog: Partial<Record<ErrorCode, { title: string; fallbackMessage: string }>>
): { code: ErrorCode; title: string; message: string } {
  const entry = catalog[classified.code] ?? DEFAULT_ERROR_CATALOG[classified.code];
  if (classified.code === "UNKNOWN" || !classified.message) {
    return { code: classified.code, title: entry.title, message: entry.fallbackMessage };
  }
  return { code: classified.code, title: entry.title, message: classified.message };
}
