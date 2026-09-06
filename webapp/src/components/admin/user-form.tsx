"use client";

import { useState } from "react";
import { Field, Input, Select } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { createUser, updateUser } from "@/actions/admin";
import {
  CS_SCOPES,
  CS_SCOPE_LABELS,
  CUSTOMER_ROLES,
  INTERNAL_ROLES,
  ROLES,
  ROLE_LABELS,
  isSiteScopableRole,
  type Role,
} from "@/lib/constants";

type Account = { id: string; name: string };
type Facility = { id: string; name: string };
type Region = { id: string; name: string };

export function UserForm({
  accounts,
  facilities,
  regions,
  existingUser,
}: {
  accounts: Account[];
  facilities: Facility[];
  regions: Region[];
  existingUser?: {
    id: string;
    name: string;
    email: string;
    role: Role;
    enterpriseAccountId: string | null;
    restrictedFacilityId: string | null;
    restrictedRegionId: string | null;
    csScope: string | null;
  };
}) {
  const [role, setRole] = useState<Role>(existingUser?.role ?? INTERNAL_ROLES[0]);
  const [csScope, setCsScope] = useState<string>(existingUser?.csScope ?? "Site");
  const isCustomer = (CUSTOMER_ROLES as string[]).includes(role);
  const isCsTeam = role === ROLES.CS_TEAM;
  const showFacility = isCustomer || isSiteScopableRole(role) || (isCsTeam && csScope === "Site");
  const showRegion = isCsTeam && csScope === "Region";

  const action = existingUser ? updateUser.bind(null, existingUser.id) : createUser;

  return (
    <form action={action} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Full name" htmlFor="name" required>
          <Input id="name" name="name" required defaultValue={existingUser?.name} />
        </Field>
        <Field label="Work email" htmlFor="email" required>
          <Input id="email" name="email" type="email" required defaultValue={existingUser?.email} />
        </Field>
        {!existingUser && (
          <Field label="Temporary password" htmlFor="password" required hint="At least 8 characters">
            <Input id="password" name="password" type="text" required minLength={8} defaultValue="password123" />
          </Field>
        )}
        <Field label="Role" htmlFor="role" required>
          <Select id="role" name="role" required value={role} onChange={(e) => setRole(e.target.value as Role)}>
            <optgroup label="Provider (internal)">
              {INTERNAL_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </optgroup>
            <optgroup label="Tenant">
              {CUSTOMER_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </optgroup>
          </Select>
        </Field>
      </div>

      {isCustomer && (
        <div className="grid grid-cols-1 gap-4 rounded-lg border border-slate-200 p-3 sm:grid-cols-2">
          <Field label="Enterprise account" htmlFor="enterpriseAccountId" required>
            <Select id="enterpriseAccountId" name="enterpriseAccountId" required defaultValue={existingUser?.enterpriseAccountId ?? ""}>
              <option value="" disabled>
                Choose…
              </option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      )}

      {isCsTeam && (
        <div className="grid grid-cols-1 gap-4 rounded-lg border border-slate-200 p-3 sm:grid-cols-2">
          <Field label="CS scope" htmlFor="csScope" required hint="Determines which accounts/sites this rep covers">
            <Select id="csScope" name="csScope" required value={csScope} onChange={(e) => setCsScope(e.target.value)}>
              {CS_SCOPES.map((s) => (
                <option key={s} value={s}>
                  {CS_SCOPE_LABELS[s]}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      )}

      {showRegion && (
        <div className="grid grid-cols-1 gap-4 rounded-lg border border-slate-200 p-3 sm:grid-cols-2">
          <Field label="Region" htmlFor="restrictedRegionId" required>
            <Select id="restrictedRegionId" name="restrictedRegionId" required defaultValue={existingUser?.restrictedRegionId ?? ""}>
              <option value="" disabled>
                Choose…
              </option>
              {regions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      )}

      {showFacility && (
        <div className="grid grid-cols-1 gap-4 rounded-lg border border-slate-200 p-3 sm:grid-cols-2">
          <Field
            label={isCustomer ? "Restrict to one facility (optional)" : "Facility"}
            htmlFor="restrictedFacilityId"
            required={!isCustomer}
            hint={isCustomer ? "Leave blank for a Global Admin who sees every enrolled site" : undefined}
          >
            <Select id="restrictedFacilityId" name="restrictedFacilityId" defaultValue={existingUser?.restrictedFacilityId ?? ""} required={!isCustomer}>
              <option value="">{isCustomer ? "All enrolled sites" : "Choose…"}</option>
              {facilities.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      )}

      <Button type="submit">{existingUser ? "Save changes" : "Create user"}</Button>
    </form>
  );
}
