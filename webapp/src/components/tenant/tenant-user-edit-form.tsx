"use client";

import { useState } from "react";
import { Field, Input, Select } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { updateTenantUserRole, resetTenantUserPassword } from "@/actions/tenant";
import { ROLE_LABELS, TENANT_ROLES, type Role } from "@/lib/constants";
import { ActionForm } from "@/components/errors/action-form";

type Facility = { id: string; name: string };

export function TenantUserEditForm({
  userId,
  currentRole,
  currentFacilityId,
  facilities,
}: {
  userId: string;
  currentRole: Role;
  currentFacilityId: string | null;
  facilities: Facility[];
}) {
  const [role, setRole] = useState<Role>(currentRole);
  const updateBound = updateTenantUserRole.bind(null, userId);
  const resetBound = resetTenantUserPassword.bind(null, userId);

  return (
    <div className="space-y-6">
      <ActionForm action={updateBound} className="space-y-3">
        <Field label="Role" htmlFor="role" required>
          <Select id="role" name="role" required value={role} onChange={(e) => setRole(e.target.value as Role)}>
            {TENANT_ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Restrict to one site (optional)" htmlFor="restrictedFacilityId">
          <Select id="restrictedFacilityId" name="restrictedFacilityId" defaultValue={currentFacilityId ?? ""}>
            <option value="">All enrolled sites</option>
            {facilities.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </Select>
        </Field>
        <Button type="submit" className="w-full">
          Save changes
        </Button>
      </ActionForm>

      <ActionForm action={resetBound} className="space-y-3 border-t border-slate-100 pt-4">
        <Field label="Reset password" htmlFor="password" required hint="At least 8 characters">
          <Input id="password" name="password" defaultValue="password123" required minLength={8} />
        </Field>
        <Button type="submit" variant="secondary" className="w-full">
          Reset password
        </Button>
      </ActionForm>
    </div>
  );
}
