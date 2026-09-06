"use client";

import { useActionState, useRef, useEffect } from "react";
import { createTicket, type CreateTicketState } from "./actions";

export function CreateTicketForm({ sites }: { sites: { id: string; label: string }[] }) {
  const [state, formAction, pending] = useActionState<CreateTicketState, FormData>(createTicket, undefined);
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
        <label className="text-sm font-medium text-slate-700">Category</label>
        <select name="category" required className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500">
          <option value="SERVICE_REQUEST">Service Request</option>
          <option value="COMPLAINT">Complaint</option>
          <option value="RFI">RFI</option>
        </select>
      </div>
      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <label className="text-sm font-medium text-slate-700">Subject</label>
        <input name="subject" required className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500" />
      </div>
      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <label className="text-sm font-medium text-slate-700">Description</label>
        <textarea name="description" required rows={3} className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500" />
      </div>

      {state?.error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-2">{state.error}</p>}

      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-60"
        >
          {pending ? "Submitting…" : "Raise ticket"}
        </button>
      </div>
    </form>
  );
}
