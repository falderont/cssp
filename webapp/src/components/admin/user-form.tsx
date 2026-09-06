"use client";

import { useState } from "react";
import { Field, Input, Select } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { createUser } from "@/actions/admin";
import { CUSTOMER_ROLES, INTERNAL_ROLES, ROLE_LABELS, type Role } from "@/lib/constants";

type Account = { id: string; name: string };
type Facility = { id: string; name: string };

export function UserForm({ accounts, facilities }: { accounts: Account[]; facilities: Facility[] }) {
  const [role, setRole] = useState<Role>(INTERNAL_ROLES[0]);
  const isCustomer = (CUSTOMER_ROLES as string[]).includes(role);

  return (
    <form action={createUser} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Full name" htmlFor="name" required>
          <Input id="name" name="name" required />
        </Field>
        <Field label="Work email" htmlFor="email" required>
          <Input id="email" name="email" type="email" required />
        </Field>
        <Field label="Temporary password" htmlFor="password" required hint="At least 8 characters">
          <Input id="password" name="password" type="text" required minLength={8} defaultValue="password123" />
        </Field>
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
            <Select id="enterpriseAccountId" name="enterpriseAccountId" required>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label="Restrict to one facility (optional)"
            htmlFor="restrictedFacilityId"
            hint="Leave blank for a Global Admin who sees every enrolled site"
          >
            <Select id="restrictedFacilityId" name="restrictedFacilityId" defaultValue="">
              <option value="">All enrolled sites</option>
              {facilities.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      )}

      <Button type="submit">Create user</Button>
    </form>
  );
}
