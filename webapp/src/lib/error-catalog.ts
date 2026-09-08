import { prisma } from "@/lib/prisma";
import { ERROR_CODES, DEFAULT_ERROR_CATALOG, type ErrorCode } from "@/lib/errors";

export type ErrorCatalogEntry = { title: string; description: string; fallbackMessage: string };

// The merged catalog (DB overrides atop the code defaults) for every
// ErrorCode — pass to <ErrorDialogProvider> from the root layout, or use
// directly in a Server Component (error.tsx pages, the admin screen).
// Split out of lib/errors.ts because that file has to load from
// prisma/seed.ts via a relative import with no path-alias resolution.
export async function getErrorCatalog(): Promise<Record<ErrorCode, ErrorCatalogEntry>> {
  const rows = await prisma.systemErrorDefinition.findMany();
  const byCode = new Map(rows.map((r) => [r.code, r]));
  const catalog = {} as Record<ErrorCode, ErrorCatalogEntry>;
  for (const code of ERROR_CODES) {
    const row = byCode.get(code);
    catalog[code] = row ? { title: row.title, description: row.description, fallbackMessage: row.fallbackMessage } : DEFAULT_ERROR_CATALOG[code];
  }
  return catalog;
}
