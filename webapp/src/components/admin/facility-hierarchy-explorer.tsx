"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, ChevronDown, Globe2, Flag, MapPin, Building2, Plus, Pencil, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { createRegion, updateRegion, createCountry, updateCountry, createCity, updateCity, createFacility, toggleRegionActive } from "@/actions/admin";

export type FacilityNode = {
  id: string;
  name: string;
  code: string;
  timezone: string;
  buildingCount: number;
  tenantCount: number;
};
export type CityNode = { id: string; name: string; facilities: FacilityNode[] };
export type CountryNode = { id: string; name: string; code: string; cities: CityNode[] };
export type RegionNode = { id: string; name: string; code: string; isActive: boolean; countries: CountryNode[] };

function allBranchIds(regions: RegionNode[]): string[] {
  const ids: string[] = [];
  for (const r of regions) {
    ids.push(r.id);
    for (const c of r.countries) {
      ids.push(c.id);
      for (const ci of c.cities) ids.push(ci.id);
    }
  }
  return ids;
}

// One consistent indent-and-guideline step per hierarchy level, instead of
// each level hand-tuning its own padding/border/background — this is what
// actually reads as a tree rather than boxes nested in boxes.
function TreeChildren({ children }: { children: React.ReactNode }) {
  return <div className="ml-[15px] space-y-0.5 border-l border-slate-200 py-1 pl-4">{children}</div>;
}

function Toggle({ open, onClick }: { open: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
      aria-label={open ? "Collapse" : "Expand"}
    >
      {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
    </button>
  );
}

function CodeBadge({ children }: { children: React.ReactNode }) {
  return <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-500">{children}</span>;
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-brand opacity-0 transition group-hover/row:opacity-100 hover:bg-brand/10 focus-visible:opacity-100"
    >
      <Plus className="h-3.5 w-3.5" /> {label}
    </button>
  );
}

// Renaming/fixing an existing record — distinct from AddButton, which adds a
// new child underneath it. Only rendered for personas who can already reach
// this page (requireMasterDataAdmin gates every update action too).
function EditButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title="Edit"
      className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-slate-500 opacity-0 transition group-hover/row:opacity-100 hover:bg-slate-100 hover:text-slate-700 focus-visible:opacity-100"
    >
      <Pencil className="h-3.5 w-3.5" />
    </button>
  );
}

// A single row at any level of the tree — region/country/city header rows
// and the leaf facility row all share this shape so depth is legible purely
// from indentation, not from a different box style per level.
function TreeRow({
  toggle,
  icon,
  iconTone = "slate",
  title,
  badge,
  meta,
  actions,
  href,
}: {
  toggle?: { open: boolean; onClick: () => void };
  icon: React.ReactNode;
  iconTone?: "brand" | "slate";
  title: React.ReactNode;
  badge?: React.ReactNode;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
  href?: string;
}) {
  const resolvedActions =
    actions ??
    (href ? (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-brand">
        Manage site <ArrowRight className="h-3.5 w-3.5" />
      </span>
    ) : null);

  const content = (
    <>
      {toggle ? <Toggle open={toggle.open} onClick={toggle.onClick} /> : <span className="w-4 shrink-0" />}
      <span className={cn("shrink-0", iconTone === "brand" ? "text-brand" : "text-slate-400")}>{icon}</span>
      <span className="truncate font-medium text-slate-900">{title}</span>
      {badge}
      {meta && <span className="truncate text-xs text-slate-400">{meta}</span>}
      <div className="ml-auto flex shrink-0 items-center gap-1">{resolvedActions}</div>
    </>
  );

  const rowClass = "group/row flex flex-wrap items-center gap-2 rounded-lg px-2 py-2 transition";

  if (href) {
    return (
      <Link href={href} className={cn(rowClass, "hover:bg-brand/5")}>
        {content}
      </Link>
    );
  }
  return <div className={cn(rowClass, "hover:bg-slate-50")}>{content}</div>;
}

type FieldSpec = { name: string; label: string; required?: boolean; wide?: boolean; defaultValue?: string };

// Doubles as the "add a child" form and the "edit this record" form — the
// only difference is whether fields carry a defaultValue and which action
// they post to. A dashed brand-tinted box for adding something new; a plain
// bordered box for editing what's already there, so the two read distinctly.
function InlineCreateForm({
  action,
  fields,
  submitLabel = "Save",
  onDone,
  variant = "add",
}: {
  action: (formData: FormData) => void;
  fields: FieldSpec[];
  submitLabel?: string;
  onDone: () => void;
  variant?: "add" | "edit";
}) {
  return (
    <form
      action={action}
      onSubmit={onDone}
      className={cn(
        "grid grid-cols-2 gap-2 rounded-lg border p-3 sm:grid-cols-4",
        variant === "add" ? "border-dashed border-brand/30 bg-brand/5" : "border-slate-200 bg-slate-50/60"
      )}
    >
      {fields.map((f) => (
        <div key={f.name} className={f.wide ? "col-span-2 sm:col-span-4" : "col-span-2 sm:col-span-1"}>
          <Input name={f.name} placeholder={f.label} defaultValue={f.defaultValue} required={f.required} className="text-xs" />
        </div>
      ))}
      <div className="col-span-2 flex gap-2 sm:col-span-4">
        <Button type="submit" size="sm">
          {submitLabel}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function RegionStatusToggle({ regionId, isActive }: { regionId: string; isActive: boolean }) {
  return (
    <form action={toggleRegionActive.bind(null, regionId)}>
      <button
        type="submit"
        title={isActive ? "Mark this region inactive" : "Mark this region active"}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset transition",
          isActive
            ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20 hover:bg-emerald-100"
            : "bg-slate-100 text-slate-500 ring-slate-500/20 hover:bg-slate-200"
        )}
      >
        <span className={cn("h-1.5 w-1.5 rounded-full", isActive ? "bg-emerald-500" : "bg-slate-400")} />
        {isActive ? "Active" : "Inactive"}
      </button>
    </form>
  );
}

export function FacilityHierarchyExplorer({ regions }: { regions: RegionNode[] }) {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(allBranchIds(regions)));
  // Which parent's inline "add child" form is currently open — "root" for the
  // top-level "Add region" form, otherwise a Region/Country/City id.
  const [addingIn, setAddingIn] = useState<string | null>(null);
  // Which record's own inline "edit" form is currently open.
  const [editingId, setEditingId] = useState<string | null>(null);

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAdding(id: string) {
    setAddingIn((prev) => (prev === id ? null : id));
    setEditingId(null);
  }

  function toggleEditing(id: string) {
    setEditingId((prev) => (prev === id ? null : id));
    setAddingIn(null);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-card">
        <p className="text-sm font-medium text-slate-700">Regions</p>
        <AddButton label="Add region" onClick={() => toggleAdding("root")} />
      </div>
      {addingIn === "root" && (
        <InlineCreateForm
          action={createRegion}
          fields={[
            { name: "name", label: "Region name (e.g. Southeast Asia)", required: true },
            { name: "code", label: "Code (e.g. APAC)", required: true },
          ]}
          onDone={() => setAddingIn(null)}
        />
      )}

      {regions.length === 0 && (
        <p className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-400">
          No regions yet — add one to start building out your site hierarchy.
        </p>
      )}

      {regions.map((region) => (
        <div
          key={region.id}
          className={cn("rounded-xl border border-slate-200 bg-white p-2 shadow-card", !region.isActive && "opacity-60")}
        >
          <TreeRow
            toggle={{ open: expanded.has(region.id), onClick: () => toggle(region.id) }}
            icon={<Globe2 className="h-4 w-4" />}
            iconTone="brand"
            title={region.name}
            badge={<CodeBadge>{region.code}</CodeBadge>}
            meta={`${region.countries.length} countr${region.countries.length === 1 ? "y" : "ies"}`}
            actions={
              <>
                <RegionStatusToggle regionId={region.id} isActive={region.isActive} />
                <EditButton onClick={() => toggleEditing(region.id)} />
                <AddButton label="Add country" onClick={() => toggleAdding(region.id)} />
              </>
            }
          />
          {editingId === region.id && (
            <div className="px-2 pb-2">
              <InlineCreateForm
                variant="edit"
                action={updateRegion.bind(null, region.id)}
                fields={[
                  { name: "name", label: "Region name", required: true, defaultValue: region.name },
                  { name: "code", label: "Code", required: true, defaultValue: region.code },
                ]}
                onDone={() => setEditingId(null)}
              />
            </div>
          )}

          {expanded.has(region.id) && (
            <TreeChildren>
              {addingIn === region.id && (
                <InlineCreateForm
                  action={createCountry.bind(null, region.id)}
                  fields={[
                    { name: "name", label: "Country name", required: true },
                    { name: "code", label: "Code (e.g. ID)", required: true },
                  ]}
                  onDone={() => setAddingIn(null)}
                />
              )}
              {region.countries.length === 0 && addingIn !== region.id && (
                <p className="px-2 py-1 text-xs text-slate-400">No countries yet in this region.</p>
              )}
              {region.countries.map((country) => (
                <div key={country.id}>
                  <TreeRow
                    toggle={{ open: expanded.has(country.id), onClick: () => toggle(country.id) }}
                    icon={<Flag className="h-4 w-4" />}
                    title={country.name}
                    badge={<CodeBadge>{country.code}</CodeBadge>}
                    meta={`${country.cities.length} cit${country.cities.length === 1 ? "y" : "ies"}`}
                    actions={
                      <>
                        <EditButton onClick={() => toggleEditing(country.id)} />
                        <AddButton label="Add city" onClick={() => toggleAdding(country.id)} />
                      </>
                    }
                  />
                  {editingId === country.id && (
                    <div className="px-2 pb-2">
                      <InlineCreateForm
                        variant="edit"
                        action={updateCountry.bind(null, country.id)}
                        fields={[
                          { name: "name", label: "Country name", required: true, defaultValue: country.name },
                          { name: "code", label: "Code", required: true, defaultValue: country.code },
                        ]}
                        onDone={() => setEditingId(null)}
                      />
                    </div>
                  )}

                  {expanded.has(country.id) && (
                    <TreeChildren>
                      {addingIn === country.id && (
                        <InlineCreateForm
                          action={createCity.bind(null, country.id)}
                          fields={[{ name: "name", label: "City name", required: true }]}
                          onDone={() => setAddingIn(null)}
                        />
                      )}
                      {country.cities.length === 0 && addingIn !== country.id && (
                        <p className="px-2 py-1 text-xs text-slate-400">No cities yet in this country.</p>
                      )}
                      {country.cities.map((city) => (
                        <div key={city.id}>
                          <TreeRow
                            toggle={{ open: expanded.has(city.id), onClick: () => toggle(city.id) }}
                            icon={<MapPin className="h-4 w-4" />}
                            title={city.name}
                            meta={`${city.facilities.length} site${city.facilities.length === 1 ? "" : "s"}`}
                            actions={
                              <>
                                <EditButton onClick={() => toggleEditing(city.id)} />
                                <AddButton label="Add site" onClick={() => toggleAdding(city.id)} />
                              </>
                            }
                          />
                          {editingId === city.id && (
                            <div className="px-2 pb-2">
                              <InlineCreateForm
                                variant="edit"
                                action={updateCity.bind(null, city.id)}
                                fields={[{ name: "name", label: "City name", required: true, defaultValue: city.name }]}
                                onDone={() => setEditingId(null)}
                              />
                            </div>
                          )}

                          {expanded.has(city.id) && (
                            <TreeChildren>
                              {addingIn === city.id && (
                                <InlineCreateForm
                                  action={createFacility.bind(null, city.id)}
                                  submitLabel="Add site"
                                  fields={[
                                    { name: "name", label: "Site name (e.g. NDP — Batam)", required: true },
                                    { name: "code", label: "Code (e.g. NDP)", required: true },
                                    { name: "timezone", label: "Timezone (e.g. Asia/Jakarta)", required: true },
                                    { name: "address", label: "Address (optional)", wide: true },
                                    {
                                      name: "acsEndpointUrl",
                                      label: "ACS endpoint URL (optional — blank uses the built-in mock adapter)",
                                      wide: true,
                                    },
                                  ]}
                                  onDone={() => setAddingIn(null)}
                                />
                              )}
                              {city.facilities.length === 0 && addingIn !== city.id && (
                                <p className="px-2 py-1 text-xs text-slate-400">No sites yet in this city.</p>
                              )}
                              {city.facilities.map((facility) => (
                                <TreeRow
                                  key={facility.id}
                                  href={`/ops/admin/facilities/${facility.id}`}
                                  icon={<Building2 className="h-4 w-4" />}
                                  iconTone="brand"
                                  title={facility.name}
                                  badge={<CodeBadge>{facility.code}</CodeBadge>}
                                  meta={`${facility.timezone} · ${facility.buildingCount} building${facility.buildingCount === 1 ? "" : "s"} · ${facility.tenantCount} tenant${facility.tenantCount === 1 ? "" : "s"}`}
                                />
                              ))}
                            </TreeChildren>
                          )}
                        </div>
                      ))}
                    </TreeChildren>
                  )}
                </div>
              ))}
            </TreeChildren>
          )}
        </div>
      ))}
    </div>
  );
}
