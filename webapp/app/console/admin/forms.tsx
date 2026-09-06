"use client";

import { useActionState, useRef, useEffect } from "react";
import {
  createRegion,
  createFacility,
  createBuilding,
  createEnterpriseAccount,
  createSiteEnrollment,
  createUser,
} from "./actions";

type FormState = { error?: string } | undefined;

function Field({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-1.5">{children}</div>;
}

const inputClass = "rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500";
const labelClass = "text-sm font-medium text-slate-700";

function SubmitButton({ pending, label }: { pending: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-60"
    >
      {pending ? "Saving…" : label}
    </button>
  );
}

function ErrorText({ state }: { state: FormState }) {
  if (!state?.error) return null;
  return <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-2">{state.error}</p>;
}

export function CreateRegionForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(createRegion, undefined);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (!pending && !state?.error) ref.current?.reset();
  }, [pending, state]);
  return (
    <form ref={ref} action={formAction} className="flex flex-wrap items-end gap-3">
      <Field>
        <label className={labelClass}>Region name</label>
        <input name="name" required className={inputClass} placeholder="e.g. Southeast Asia" />
      </Field>
      <SubmitButton pending={pending} label="Add region" />
      <ErrorText state={state} />
    </form>
  );
}

export function CreateFacilityForm({ regions }: { regions: { id: string; name: string }[] }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(createFacility, undefined);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (!pending && !state?.error) ref.current?.reset();
  }, [pending, state]);
  return (
    <form ref={ref} action={formAction} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Field>
        <label className={labelClass}>Facility name</label>
        <input name="name" required className={inputClass} placeholder="e.g. JKT-01" />
      </Field>
      <Field>
        <label className={labelClass}>Region (optional)</label>
        <select name="regionId" className={inputClass}>
          <option value="">No region</option>
          {regions.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </Field>
      <Field>
        <label className={labelClass}>Address</label>
        <input name="address" required className={inputClass} />
      </Field>
      <Field>
        <label className={labelClass}>Timezone</label>
        <input name="timezone" required defaultValue="UTC" className={inputClass} />
      </Field>
      <div className="sm:col-span-2">
        <SubmitButton pending={pending} label="Add facility" />
      </div>
      <ErrorText state={state} />
    </form>
  );
}

export function CreateBuildingForm({ facilities }: { facilities: { id: string; name: string }[] }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(createBuilding, undefined);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (!pending && !state?.error) ref.current?.reset();
  }, [pending, state]);
  return (
    <form ref={ref} action={formAction} className="flex flex-wrap items-end gap-3">
      <Field>
        <label className={labelClass}>Facility</label>
        <select name="facilityId" required className={inputClass}>
          {facilities.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
      </Field>
      <Field>
        <label className={labelClass}>Building name</label>
        <input name="name" required className={inputClass} placeholder="e.g. Building B" />
      </Field>
      <SubmitButton pending={pending} label="Add building" />
      <ErrorText state={state} />
    </form>
  );
}

export function CreateEnterpriseAccountForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(createEnterpriseAccount, undefined);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (!pending && !state?.error) ref.current?.reset();
  }, [pending, state]);
  return (
    <form ref={ref} action={formAction} className="flex flex-wrap items-end gap-3">
      <Field>
        <label className={labelClass}>Account name</label>
        <input name="name" required className={inputClass} placeholder="e.g. Acme Logistics" />
      </Field>
      <SubmitButton pending={pending} label="Add account" />
      <ErrorText state={state} />
    </form>
  );
}

export function CreateSiteEnrollmentForm({
  accounts,
  facilities,
}: {
  accounts: { id: string; name: string }[];
  facilities: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(createSiteEnrollment, undefined);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (!pending && !state?.error) ref.current?.reset();
  }, [pending, state]);
  return (
    <form ref={ref} action={formAction} className="flex flex-wrap items-end gap-3">
      <Field>
        <label className={labelClass}>Enterprise account</label>
        <select name="enterpriseAccountId" required className={inputClass}>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </Field>
      <Field>
        <label className={labelClass}>Facility</label>
        <select name="facilityId" required className={inputClass}>
          {facilities.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
      </Field>
      <SubmitButton pending={pending} label="Enroll account at site" />
      <ErrorText state={state} />
    </form>
  );
}

const ROLES = [
  { value: "CUSTOMER_GLOBAL", label: "Customer — Global Admin" },
  { value: "CUSTOMER_SITE", label: "Customer — Site Contact" },
  { value: "PROVIDER_ADMIN", label: "Provider — Admin" },
  { value: "PROVIDER_CS", label: "Provider — Customer Success" },
  { value: "PROVIDER_CS_MANAGER", label: "Provider — CS Manager" },
  { value: "PROVIDER_OPS", label: "Provider — Ops / NOC" },
  { value: "PROVIDER_SECURITY", label: "Provider — Security" },
  { value: "PROVIDER_TECHNICIAN", label: "Provider — Technician" },
];

export function CreateUserForm({
  accounts,
  enrollments,
}: {
  accounts: { id: string; name: string }[];
  enrollments: { id: string; label: string }[];
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(createUser, undefined);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (!pending && !state?.error) ref.current?.reset();
  }, [pending, state]);
  return (
    <form ref={ref} action={formAction} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Field>
        <label className={labelClass}>Name</label>
        <input name="name" required className={inputClass} />
      </Field>
      <Field>
        <label className={labelClass}>Email</label>
        <input name="email" type="email" required className={inputClass} />
      </Field>
      <Field>
        <label className={labelClass}>Temporary password</label>
        <input name="password" type="password" required minLength={8} className={inputClass} />
      </Field>
      <Field>
        <label className={labelClass}>Role</label>
        <select name="role" required className={inputClass}>
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </Field>
      <Field>
        <label className={labelClass}>Enterprise account (customer roles only)</label>
        <select name="enterpriseAccountId" className={inputClass}>
          <option value="">—</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </Field>
      <Field>
        <label className={labelClass}>Site enrollment (Site Contact only)</label>
        <select name="siteEnrollmentId" className={inputClass}>
          <option value="">—</option>
          {enrollments.map((e) => (
            <option key={e.id} value={e.id}>
              {e.label}
            </option>
          ))}
        </select>
      </Field>
      <div className="sm:col-span-2">
        <SubmitButton pending={pending} label="Create user" />
      </div>
      <ErrorText state={state} />
    </form>
  );
}
