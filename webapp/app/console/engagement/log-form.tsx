"use client";

import { useActionState, useRef, useEffect } from "react";
import { logEngagement, type LogEngagementState } from "./actions";

export function LogEngagementForm({ accounts }: { accounts: { id: string; name: string }[] }) {
  const [state, formAction, pending] = useActionState<LogEngagementState, FormData>(logEngagement, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!pending && !state?.error && formRef.current) formRef.current.reset();
  }, [pending, state]);

  return (
    <form ref={formRef} action={formAction} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-700">Enterprise account</label>
        <select name="enterpriseAccountId" required className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500">
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-700">Type</label>
        <select name="type" required className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500">
          <option value="CALL">Call</option>
          <option value="EMAIL">Email</option>
          <option value="MEETING">Meeting</option>
          <option value="SITE_VISIT">Site visit</option>
        </select>
      </div>
      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <label className="text-sm font-medium text-slate-700">Notes</label>
        <textarea name="notes" required rows={3} className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500" />
      </div>
      {state?.error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-2">{state.error}</p>}
      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-60"
        >
          {pending ? "Logging…" : "Log touchpoint"}
        </button>
      </div>
    </form>
  );
}
