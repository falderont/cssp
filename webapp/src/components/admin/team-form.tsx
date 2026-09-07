"use client";

import { useState } from "react";
import { Field, Input, Select } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { createTeam } from "@/actions/admin";
import { TEAM_FUNCTIONS, TEAM_FUNCTION_LABELS } from "@/lib/constants";
import { ActionForm } from "@/components/errors/action-form";

type ScopeType = "Global" | "Region" | "Country" | "Facility";

type Region = { id: string; name: string };
type Country = { id: string; name: string };
type Facility = { id: string; name: string };

export function TeamForm({
  regions,
  countries,
  facilities,
  action = createTeam,
  initial,
  submitLabel = "Add team",
}: {
  regions: Region[];
  countries: Country[];
  facilities: Facility[];
  action?: (formData: FormData) => void;
  initial?: { name: string; function: string; scopeType: ScopeType; scopeId?: string };
  submitLabel?: string;
}) {
  const [scopeType, setScopeType] = useState<ScopeType>(initial?.scopeType ?? "Facility");

  return (
    <ActionForm action={action} className="space-y-3">
      <Field label="Team name" htmlFor="name" required>
        <Input id="name" name="name" required placeholder="e.g. Indonesia NOC" defaultValue={initial?.name} />
      </Field>
      <Field label="Function" htmlFor="function" required>
        <Select id="function" name="function" required defaultValue={initial?.function ?? TEAM_FUNCTIONS[0]}>
          {TEAM_FUNCTIONS.map((f) => (
            <option key={f} value={f}>
              {TEAM_FUNCTION_LABELS[f]}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Coverage" htmlFor="scopeType" required hint="Global spans the whole company; Region spans every country within it">
        <Select id="scopeType" name="scopeType" required value={scopeType} onChange={(e) => setScopeType(e.target.value as ScopeType)}>
          <option value="Global">Global (company-wide)</option>
          <option value="Region">Region</option>
          <option value="Country">Country</option>
          <option value="Facility">Facility (site)</option>
        </Select>
      </Field>
      {scopeType !== "Global" && (
        <Field label={scopeType} htmlFor="scopeId" required>
          <Select id="scopeId" name="scopeId" required defaultValue={initial?.scopeId ?? ""}>
            <option value="" disabled>
              Choose…
            </option>
            {scopeType === "Region" && regions.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
            {scopeType === "Country" && countries.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
            {scopeType === "Facility" && facilities.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </Select>
        </Field>
      )}
      <Button type="submit" className="w-full">
        {submitLabel}
      </Button>
    </ActionForm>
  );
}
