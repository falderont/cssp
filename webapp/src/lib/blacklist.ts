import { prisma } from "./prisma";

// A simple, transparent "first layer" check — exact match (case/whitespace
// insensitive) on full name or ID number. Small demo-scale dataset, so a
// full scan is fine; a production deployment would normalize + index a
// lookup key instead.
export async function checkBlacklist(fullName: string, idNumber?: string | null) {
  const entries = await prisma.blacklistEntry.findMany();
  const normalizedName = fullName.trim().toLowerCase();
  const normalizedId = idNumber?.trim().toLowerCase();
  return (
    entries.find((e) => {
      const nameMatch = e.fullName.trim().toLowerCase() === normalizedName;
      const idMatch = !!normalizedId && !!e.idNumber && e.idNumber.trim().toLowerCase() === normalizedId;
      return nameMatch || idMatch;
    }) ?? null
  );
}
