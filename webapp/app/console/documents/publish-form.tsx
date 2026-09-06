"use client";

import { useActionState, useRef, useEffect } from "react";
import { publishDocument, type PublishDocumentState } from "./actions";

const CATEGORIES = [
  { value: "SLA_REPORT", label: "SLA Report" },
  { value: "COMPLIANCE_CERTIFICATE", label: "Compliance Certificate" },
  { value: "INVOICE_BACKUP", label: "Invoice Backup" },
  { value: "RUNBOOK", label: "Runbook" },
  { value: "OTHER", label: "Other" },
];

export function PublishDocumentForm({
  accounts,
  facilities,
}: {
  accounts: { id: string; name: string }[];
  facilities: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState<PublishDocumentState, FormData>(publishDocument, undefined);
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
        <label className="text-sm font-medium text-slate-700">Facility (optional — blank = whole account)</label>
        <select name="facilityId" className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500">
          <option value="">All sites</option>
          {facilities.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-700">Title</label>
        <input name="title" required className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500" />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-700">Category</label>
        <select name="category" required className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500">
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <label className="text-sm font-medium text-slate-700">File</label>
        <input type="file" name="file" required className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500" />
      </div>

      {state?.error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-2">{state.error}</p>}

      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-60"
        >
          {pending ? "Publishing…" : "Publish document"}
        </button>
      </div>
    </form>
  );
}
