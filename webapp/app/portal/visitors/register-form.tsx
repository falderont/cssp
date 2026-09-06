"use client";

import { useActionState, useRef, useEffect } from "react";
import { registerVisitor, type RegisterVisitorState } from "./actions";

export function RegisterVisitorForm({ sites }: { sites: { id: string; label: string }[] }) {
  const [state, formAction, pending] = useActionState<RegisterVisitorState, FormData>(registerVisitor, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!pending && !state?.error && formRef.current) {
      formRef.current.reset();
    }
  }, [pending, state]);

  return (
    <form ref={formRef} action={formAction} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {sites.length > 1 && (
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label className="text-sm font-medium text-slate-700">Site</label>
          <select
            name="siteEnrollmentId"
            required
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
          >
            {sites.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      )}
      {sites.length === 1 && <input type="hidden" name="siteEnrollmentId" value={sites[0].id} />}
      {sites.length === 0 && (
        <p className="text-sm text-red-600 sm:col-span-2">You have no active site enrollments yet.</p>
      )}

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-700">Visitor name</label>
        <input name="visitorName" required className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500" />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-700">Company (optional)</label>
        <input name="visitorCompany" className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500" />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-700">Visit start</label>
        <input type="datetime-local" name="visitStart" required className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500" />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-700">Visit end</label>
        <input type="datetime-local" name="visitEnd" required className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500" />
      </div>

      {state?.error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-2">{state.error}</p>}

      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={pending || sites.length === 0}
          className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-60"
        >
          {pending ? "Submitting…" : "Register visitor"}
        </button>
      </div>
    </form>
  );
}
