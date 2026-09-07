"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, ChevronDown, Globe2, Flag, MapPin, Building2, Plus, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { createRegion, createCountry, createCity, createFacility } from "@/actions/admin";

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
export type RegionNode = { id: string; name: string; code: string; countries: CountryNode[] };

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
      className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-brand hover:bg-brand/10"
    >
      <Plus className="h-3.5 w-3.5" /> {label}
    </button>
  );
}

type FieldSpec = { name: string; label: string; required?: boolean; wide?: boolean };

function InlineCreateForm({
  action,
  fields,
  submitLabel = "Save",
  onDone,
}: {
  action: (formData: FormData) => void;
  fields: FieldSpec[];
  submitLabel?: string;
  onDone: () => void;
}) {
  return (
    <form
      action={action}
      onSubmit={onDone}
      className="grid grid-cols-2 gap-2 rounded-lg border border-dashed border-brand/30 bg-brand/5 p-3 sm:grid-cols-4"
    >
      {fields.map((f) => (
        <div key={f.name} className={f.wide ? "col-span-2 sm:col-span-4" : "col-span-2 sm:col-span-1"}>
          <Input name={f.name} placeholder={f.label} required={f.required} className="text-xs" />
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

export function FacilityHierarchyExplorer({ regions }: { regions: RegionNode[] }) {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(allBranchIds(regions)));
  // Which parent's inline "add child" form is currently open — "root" for the
  // top-level "Add region" form, otherwise a Region/Country/City id.
  const [addingIn, setAddingIn] = useState<string | null>(null);

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
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm">
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
        <div key={region.id} className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center gap-2 px-4 py-3">
            <Toggle open={expanded.has(region.id)} onClick={() => toggle(region.id)} />
            <Globe2 className="h-4 w-4 shrink-0 text-brand" />
            <span className="font-medium text-slate-900">{region.name}</span>
            <CodeBadge>{region.code}</CodeBadge>
            <span className="text-xs text-slate-400">
              {region.countries.length} countr{region.countries.length === 1 ? "y" : "ies"}
            </span>
            <div className="ml-auto">
              <AddButton label="Add country" onClick={() => toggleAdding(region.id)} />
            </div>
          </div>

          {expanded.has(region.id) && (
            <div className="space-y-2 border-t border-slate-100 py-3 pl-10 pr-4">
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
                <p className="py-1 text-xs text-slate-400">No countries yet in this region.</p>
              )}
              {region.countries.map((country) => (
                <div key={country.id} className="rounded-lg border border-slate-200">
                  <div className="flex flex-wrap items-center gap-2 px-3 py-2.5">
                    <Toggle open={expanded.has(country.id)} onClick={() => toggle(country.id)} />
                    <Flag className="h-4 w-4 shrink-0 text-slate-400" />
                    <span className="font-medium text-slate-800">{country.name}</span>
                    <CodeBadge>{country.code}</CodeBadge>
                    <span className="text-xs text-slate-400">
                      {country.cities.length} cit{country.cities.length === 1 ? "y" : "ies"}
                    </span>
                    <div className="ml-auto">
                      <AddButton label="Add city" onClick={() => toggleAdding(country.id)} />
                    </div>
                  </div>

                  {expanded.has(country.id) && (
                    <div className="space-y-2 border-t border-slate-100 py-2.5 pl-9 pr-3">
                      {addingIn === country.id && (
                        <InlineCreateForm
                          action={createCity.bind(null, country.id)}
                          fields={[{ name: "name", label: "City name", required: true }]}
                          onDone={() => setAddingIn(null)}
                        />
                      )}
                      {country.cities.length === 0 && addingIn !== country.id && (
                        <p className="py-1 text-xs text-slate-400">No cities yet in this country.</p>
                      )}
                      {country.cities.map((city) => (
                        <div key={city.id} className="rounded-lg border border-slate-200 bg-slate-50/60">
                          <div className="flex flex-wrap items-center gap-2 px-3 py-2.5">
                            <Toggle open={expanded.has(city.id)} onClick={() => toggle(city.id)} />
                            <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
                            <span className="font-medium text-slate-800">{city.name}</span>
                            <span className="text-xs text-slate-400">
                              {city.facilities.length} site{city.facilities.length === 1 ? "" : "s"}
                            </span>
                            <div className="ml-auto">
                              <AddButton label="Add site" onClick={() => toggleAdding(city.id)} />
                            </div>
                          </div>

                          {expanded.has(city.id) && (
                            <div className="space-y-2 border-t border-slate-100 bg-white py-2.5 pl-8 pr-3">
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
                                <p className="py-1 text-xs text-slate-400">No sites yet in this city.</p>
                              )}
                              {city.facilities.map((facility) => (
                                <Link
                                  key={facility.id}
                                  href={`/ops/admin/facilities/${facility.id}`}
                                  className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-slate-200 bg-white px-3 py-2.5 transition hover:border-brand/40 hover:shadow-sm"
                                >
                                  <Building2 className="h-4 w-4 shrink-0 text-brand" />
                                  <span className="font-medium text-slate-900">{facility.name}</span>
                                  <CodeBadge>{facility.code}</CodeBadge>
                                  <span className="text-xs text-slate-400">{facility.timezone}</span>
                                  <span className="text-xs text-slate-400">
                                    {facility.buildingCount} building{facility.buildingCount === 1 ? "" : "s"}
                                  </span>
                                  <span className="text-xs text-slate-400">
                                    {facility.tenantCount} tenant{facility.tenantCount === 1 ? "" : "s"}
                                  </span>
                                  <span className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-brand">
                                    Manage site <ArrowRight className="h-3.5 w-3.5" />
                                  </span>
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
