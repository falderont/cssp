"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { createVisitorRequest } from "@/actions/visitors";
import { ActionForm } from "@/components/errors/action-form";

type Building = { id: string; name: string; code: string };
type Enrollment = { id: string; facilityId: string; facility: { name: string; buildings: Building[] } };
type HostUser = { id: string; name: string };

type Row = { fullName: string; idType: string; idNumber: string; company: string; email: string; phone: string };

const EMPTY_ROW: Row = { fullName: "", idType: "", idNumber: "", company: "", email: "", phone: "" };

export function VisitorRequestForm({ enrollments, hostUsers }: { enrollments: Enrollment[]; hostUsers: HostUser[] }) {
  const [siteEnrollmentId, setSiteEnrollmentId] = useState(enrollments[0]?.id ?? "");
  const [rows, setRows] = useState<Row[]>([{ ...EMPTY_ROW }]);

  const buildings = useMemo(
    () => enrollments.find((e) => e.id === siteEnrollmentId)?.facility.buildings ?? [],
    [enrollments, siteEnrollmentId]
  );

  function updateRow(idx: number, patch: Partial<Row>) {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  }

  return (
    <ActionForm action={createVisitorRequest} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Site" htmlFor="siteEnrollmentId" required>
          <Select
            id="siteEnrollmentId"
            name="siteEnrollmentId"
            value={siteEnrollmentId}
            onChange={(e) => setSiteEnrollmentId(e.target.value)}
            required
          >
            {enrollments.map((e) => (
              <option key={e.id} value={e.id}>
                {e.facility.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Building (optional)" htmlFor="buildingId">
          <Select id="buildingId" name="buildingId" defaultValue="">
            <option value="">Not specified</option>
            {buildings.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Host (optional)" htmlFor="hostUserId" hint="Who at your company is expecting them?">
          <Select id="hostUserId" name="hostUserId" defaultValue="">
            <option value="">Not specified</option>
            {hostUsers.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Visit date" htmlFor="visitDate" required>
          <Input id="visitDate" name="visitDate" type="date" required />
        </Field>
        <Field label="Window start" htmlFor="windowStart" required>
          <Input id="windowStart" name="windowStart" type="time" required defaultValue="09:00" />
        </Field>
        <Field label="Window end" htmlFor="windowEnd" required>
          <Input id="windowEnd" name="windowEnd" type="time" required defaultValue="10:00" />
        </Field>
      </div>
      <Field label="Purpose of visit" htmlFor="purpose" required>
        <Textarea id="purpose" name="purpose" required placeholder="e.g. Cross-connect installation, hardware upgrade, rack audit…" />
      </Field>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-medium text-slate-700">
            Visitors <span className="text-slate-400">({rows.length})</span>
          </p>
          <Button type="button" variant="secondary" size="sm" onClick={() => setRows((r) => [...r, { ...EMPTY_ROW }])}>
            <Plus className="h-3.5 w-3.5" /> Add another visitor
          </Button>
        </div>
        <div className="space-y-3">
          {rows.map((row, idx) => (
            <div key={idx} className="grid grid-cols-1 gap-2 rounded-lg border border-slate-200 p-3 sm:grid-cols-6">
              <Input
                placeholder="Full name *"
                required
                value={row.fullName}
                onChange={(e) => updateRow(idx, { fullName: e.target.value })}
                className="sm:col-span-2"
              />
              <Input placeholder="Company" value={row.company} onChange={(e) => updateRow(idx, { company: e.target.value })} />
              <Input placeholder="ID type" value={row.idType} onChange={(e) => updateRow(idx, { idType: e.target.value })} />
              <Input placeholder="ID number" value={row.idNumber} onChange={(e) => updateRow(idx, { idNumber: e.target.value })} />
              <div className="flex gap-2">
                <Input placeholder="Phone" value={row.phone} onChange={(e) => updateRow(idx, { phone: e.target.value })} />
                {rows.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setRows((r) => r.filter((_, i) => i !== idx))}
                    className="shrink-0 rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    title="Remove"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              <Input
                placeholder="Email"
                type="email"
                value={row.email}
                onChange={(e) => updateRow(idx, { email: e.target.value })}
                className="sm:col-span-2"
              />
            </div>
          ))}
        </div>
      </div>

      <input type="hidden" name="visitorsJson" value={JSON.stringify(rows)} />
      <Button type="submit">Submit visitor request</Button>
    </ActionForm>
  );
}
