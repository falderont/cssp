"use client";

import { useActionState, useRef, useEffect } from "react";
import { publishIncident, type PublishIncidentState } from "./actions";

export function PublishIncidentForm({ facilities }: { facilities: { id: string; name: string }[] }) {
  const [state, formAction, pending] = useActionState<PublishIncidentState, FormData>(publishIncident, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!pending && !state?.error && formRef.current) formRef.current.reset();
  }, [pending, state]);

  return (
    <form ref={formRef} action={formAction} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-700">Facility</label>
        <select name="facilityId" required className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500">
          {facilities.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-700">Type</label>
        <select name="type" required defaultValue="MAINTENANCE" className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500">
          <option value="MAINTENANCE">Maintenance</option>
          <option value="INCIDENT">Incident</option>
        </select>
      </div>
      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <label className="text-sm font-medium text-slate-700">Title</label>
        <input name="title" required className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500" />
      </div>
      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <label className="text-sm font-medium text-slate-700">Description</label>
        <textarea name="description" required rows={3} className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500" />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-700">Start</label>
        <input type="datetime-local" name="startAt" required className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500" />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-700">End (optional)</label>
        <input type="datetime-local" name="endAt" className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500" />
      </div>
      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <label className="text-sm font-medium text-slate-700">Initial status</label>
        <select name="status" required defaultValue="SCHEDULED" className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500">
          <option value="SCHEDULED">Scheduled</option>
          <option value="IN_PROGRESS">In progress</option>
          <option value="MONITORING">Monitoring</option>
          <option value="RESOLVED">Resolved</option>
        </select>
      </div>

      {state?.error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-2">{state.error}</p>}

      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-60"
        >
          {pending ? "Publishing…" : "Publish"}
        </button>
      </div>
    </form>
  );
}
