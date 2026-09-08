"use client";

import { useMemo, useState } from "react";
import { ArrowUp, ArrowDown, ArrowUpDown, Search } from "lucide-react";
import { Table, THead, TH, TBody, TR, TD, EmptyRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export type DataTableColumn<T> = {
  key: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  /** Present => column header is clickable and sorts by this value. */
  sortValue?: (row: T) => string | number | Date | null | undefined;
  /** Present => column contributes to the free-text search box. */
  searchValue?: (row: T) => string | null | undefined;
  /** Present (with filterValue) => renders a dropdown filter for this column. */
  filterOptions?: { label: string; value: string }[];
  filterValue?: (row: T) => string;
  className?: string;
  headerClassName?: string;
};

function SortIcon({ active, dir }: { active: boolean; dir?: "asc" | "desc" }) {
  if (!active) return <ArrowUpDown className="h-3 w-3 text-slate-300" />;
  return dir === "asc" ? <ArrowUp className="h-3 w-3 text-slate-500" /> : <ArrowDown className="h-3 w-3 text-slate-500" />;
}

// Reusable list-view table: free-text search, click-to-sort headers, and
// optional per-column filter dropdowns — all client-side over the rows the
// server component already fetched. Row cells stay fully custom (badges,
// bound server-action forms, links, …) via the `cell` render function.
export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  searchPlaceholder = "Search…",
  emptyMessage = "Nothing here yet.",
  actions,
  defaultSort,
}: {
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  actions?: React.ReactNode;
  defaultSort?: { key: string; dir: "asc" | "desc" };
}) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(defaultSort ?? null);
  const [filters, setFilters] = useState<Record<string, string>>({});

  const searchableColumns = useMemo(() => columns.filter((c) => c.searchValue), [columns]);
  const filterableColumns = useMemo(() => columns.filter((c) => c.filterOptions && c.filterValue), [columns]);

  const processed = useMemo(() => {
    let out = rows;

    for (const col of filterableColumns) {
      const val = filters[col.key];
      if (val) out = out.filter((r) => col.filterValue!(r) === val);
    }

    const q = query.trim().toLowerCase();
    if (q && searchableColumns.length > 0) {
      out = out.filter((r) => searchableColumns.some((c) => (c.searchValue!(r) ?? "").toLowerCase().includes(q)));
    }

    if (sort) {
      const col = columns.find((c) => c.key === sort.key);
      if (col?.sortValue) {
        const dir = sort.dir === "asc" ? 1 : -1;
        out = [...out].sort((a, b) => {
          const av = col.sortValue!(a);
          const bv = col.sortValue!(b);
          if (av == null && bv == null) return 0;
          if (av == null) return 1;
          if (bv == null) return -1;
          if (av < bv) return -1 * dir;
          if (av > bv) return 1 * dir;
          return 0;
        });
      }
    }

    return out;
  }, [rows, query, sort, filters, columns, searchableColumns, filterableColumns]);

  function toggleSort(key: string) {
    setSort((prev) => {
      if (!prev || prev.key !== key) return { key, dir: "asc" };
      if (prev.dir === "asc") return { key, dir: "desc" };
      return null;
    });
  }

  const hasToolbar = searchableColumns.length > 0 || filterableColumns.length > 0 || actions;

  return (
    <div>
      {hasToolbar && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {searchableColumns.length > 0 && (
            <div className="relative min-w-[180px] max-w-xs flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full rounded-lg border border-slate-300 py-1.5 pl-8 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
            </div>
          )}
          {filterableColumns.map((col) => (
            <select
              key={col.key}
              value={filters[col.key] ?? ""}
              onChange={(e) => setFilters((f) => ({ ...f, [col.key]: e.target.value }))}
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-600 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            >
              <option value="">{col.header}: All</option>
              {col.filterOptions!.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ))}
          <div className="flex-1" />
          {actions}
        </div>
      )}
      <Table>
        <THead>
          <tr>
            {columns.map((col) => (
              <TH key={col.key} className={col.headerClassName}>
                {col.sortValue ? (
                  <button
                    type="button"
                    onClick={() => toggleSort(col.key)}
                    className={cn("inline-flex items-center gap-1 hover:text-slate-700", sort?.key === col.key && "text-slate-700")}
                  >
                    {col.header}
                    <SortIcon active={sort?.key === col.key} dir={sort?.key === col.key ? sort.dir : undefined} />
                  </button>
                ) : (
                  col.header
                )}
              </TH>
            ))}
          </tr>
        </THead>
        <TBody>
          {processed.length === 0 && (
            <EmptyRow colSpan={columns.length} message={rows.length === 0 ? emptyMessage : "No rows match your search/filters."} />
          )}
          {processed.map((row) => (
            <TR key={getRowKey(row)}>
              {columns.map((col) => (
                <TD key={col.key} className={col.className}>
                  {col.cell(row)}
                </TD>
              ))}
            </TR>
          ))}
        </TBody>
      </Table>
    </div>
  );
}
