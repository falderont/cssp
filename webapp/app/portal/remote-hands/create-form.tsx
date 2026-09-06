"use client";

import { useActionState, useRef, useEffect } from "react";
import { createRemoteHandsRequest, type CreateRemoteHandsState } from "./actions";

const TASK_TYPES = [
  { value: "POWER_CYCLE", label: "Power Cycle" },
  { value: "VISUAL_INSPECTION", label: "Visual Inspection" },
  { value: "CABLE_PATCH", label: "Cable Patch" },
  { value: "MOUNT_UNMOUNT", label: "Mount / Unmount Hardware" },
  { value: "KVM_ACCESS", label: "KVM Console Access" },
  { value: "OTHER", label: "Other" },
];

export function CreateRemoteHandsForm({ sites }: { sites: { id: string; label: string }[] }) {
  const [state, formAction, pending] = useActionState<CreateRemoteHandsState, FormData>(
    createRemoteHandsRequest,
    undefined,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!pending && !state?.error && formRef.current) formRef.current.reset();
  }, [pending, state]);

  return (
    <form ref={formRef} action={formAction} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {sites.length > 1 && (
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700">Site</label>
          <select name="siteEnrollmentId" required className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500">
            {sites.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      )}
      {sites.length === 1 && <input type="hidden" name="siteEnrollmentId" value={sites[0].id} />}

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-700">Task type</label>
        <select name="taskType" required className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500">
          {TASK_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <label className="text-sm font-medium text-slate-700">Asset / rack reference</label>
        <input name="assetOrRackRef" required placeholder="e.g. Rack B12, U22" className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500" />
      </div>
      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <label className="text-sm font-medium text-slate-700">Description</label>
        <textarea name="description" required rows={3} className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500" />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-700">Requested window start (optional)</label>
        <input type="datetime-local" name="requestedWindowStart" className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500" />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-700">Requested window end (optional)</label>
        <input type="datetime-local" name="requestedWindowEnd" className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500" />
      </div>

      {state?.error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-2">{state.error}</p>}

      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-60"
        >
          {pending ? "Submitting…" : "Submit request"}
        </button>
      </div>
    </form>
  );
}
