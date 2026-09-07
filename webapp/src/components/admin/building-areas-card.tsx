"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown, Plus, MapPin } from "lucide-react";
import { Input } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { createArea } from "@/actions/admin";

type Area = { id: string; name: string; code: string | null; description: string | null };
type Building = { id: string; name: string; code: string; areas: Area[] };

export function BuildingAreasCard({ facilityId, building }: { facilityId: string; building: Building }) {
  const [open, setOpen] = useState(true);
  const [adding, setAdding] = useState(false);
  const addAreaBound = createArea.bind(null, facilityId, building.id);

  return (
    <div className="rounded-lg border border-slate-200">
      <div className="flex flex-wrap items-center gap-2 px-3 py-2.5">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          aria-label={open ? "Collapse" : "Expand"}
        >
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
        <span className="font-medium text-slate-900">{building.name}</span>
        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-500">{building.code}</span>
        <span className="text-xs text-slate-400">
          {building.areas.length} area{building.areas.length === 1 ? "" : "s"}
        </span>
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            setAdding((a) => !a);
          }}
          className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-brand hover:bg-brand/10"
        >
          <Plus className="h-3.5 w-3.5" /> Add area
        </button>
      </div>
      {open && (
        <div className="space-y-2 border-t border-slate-100 px-3 py-2.5 pl-9">
          {adding && (
            <form
              action={addAreaBound}
              onSubmit={() => setAdding(false)}
              className="grid grid-cols-2 gap-2 rounded-lg border border-dashed border-brand/30 bg-brand/5 p-2.5 sm:grid-cols-4"
            >
              <div className="col-span-2 sm:col-span-1">
                <Input name="name" placeholder="Area name (e.g. Server Hall B)" required className="text-xs" />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <Input name="code" placeholder="Code (optional)" className="text-xs" />
              </div>
              <div className="col-span-2 sm:col-span-2">
                <Input name="description" placeholder="Description (optional)" className="text-xs" />
              </div>
              <div className="col-span-2 flex gap-2 sm:col-span-4">
                <Button type="submit" size="sm">
                  Save
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setAdding(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          )}
          {building.areas.length === 0 && !adding && (
            <p className="py-1 text-xs text-slate-400">No areas yet — floors, zones or rooms within this building.</p>
          )}
          {building.areas.map((a) => (
            <div key={a.id} className="flex flex-wrap items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <span className="font-medium text-slate-700">{a.name}</span>
              {a.code && (
                <span className="rounded-md bg-white px-1.5 py-0.5 text-[11px] font-medium text-slate-500 ring-1 ring-slate-200">{a.code}</span>
              )}
              {a.description && <span className="truncate text-xs text-slate-400">{a.description}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
