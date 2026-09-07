import { Prisma } from "@prisma/client";

// A duplicate on a @unique (or @@unique) field throws a raw
// PrismaClientKnownRequestError (code P2002) — left uncaught, that crashes
// the request with a generic 500 instead of telling the user which value
// collided. Wrap any create/update that writes a user-typed unique field
// with this so the form gets an actionable message instead.
export async function withUniqueConstraintMessage<T>(operation: () => Promise<T>, message: string): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new Error(message);
    }
    throw error;
  }
}

// Deleting a row that other rows still point to (no onDelete: Cascade/SetNull
// is declared anywhere in this schema) throws a raw PrismaClientKnownRequestError
// (code P2003) instead of failing gracefully. Callers should still check for
// and name the specific dependents up front (a much better message than this
// can produce alone) — this is the fallback for whatever that check missed.
export async function withForeignKeyConstraintMessage<T>(operation: () => Promise<T>, message: string): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      throw new Error(message);
    }
    throw error;
  }
}

// Runs a set of dependent-row counts and, if any are non-zero, throws a
// message naming exactly what still references this record — e.g. "This
// site still has 2 buildings, 1 tenant enrollment. Remove those first."
export async function assertNoDependents(entityLabel: string, checks: Promise<{ label: string; count: number }>[]): Promise<void> {
  const results = await Promise.all(checks);
  const blocking = results.filter((c) => c.count > 0);
  if (blocking.length === 0) return;
  const list = blocking.map((c) => `${c.count} ${c.label}`).join(", ");
  throw new Error(`Can't delete this ${entityLabel} — it still has ${list}. Remove those first.`);
}
