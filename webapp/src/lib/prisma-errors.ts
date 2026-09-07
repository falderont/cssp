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
