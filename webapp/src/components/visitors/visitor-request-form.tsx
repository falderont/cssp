"use client";

import { useMemo, useState } from "react";
import type { ComponentType } from "react";
import Link from "next/link";
import { Download, Plus, Trash2, Upload } from "lucide-react";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { createVisitorRequest, createVisitorRequestBatch } from "@/actions/visitors";

type Building = { id: string; name: string; code: string };
type Enrollment = { id: string; facilityId: string; facility: { name: string; buildings: Building[] } };
type HostUser = { id: string; name: string };
type Mode = "manual" | "batch";

type Row = { fullName: string; idType: string; idNumber: string; company: string; email: string; phone: string };

const EMPTY_ROW: Row = { fullName: "", idType: "", idNumber: "", company: "", email: "", phone: "" };

// Manual entry and batch upload are two ways of filling out the same
// group-visit request: one VisitorRequest row (isGroup + a shared
// approval), with each Visitor still getting their own QR verification
// token — see createVisitorRequest / createVisitorRequestBatch.
export function VisitorRequestForm({
  enrollments,
  hostUsers,
  initialMode = "manual",
}: {
  enrollments: Enrollment[];
  hostUsers: HostUser[];
  initialMode?: Mode;
}) {
  const [mode, setMode] = useState<Mode>(initialMode);
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
    <form action={mode === "batch" ? createVisitorRequestBatch : createVisitorRequest} className="space-y-6">
      <div>
        <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
          <ModeTab active={mode === "manual"} onClick={() => setMode("manual")} icon={Plus} label="Add manually" />
          <ModeTab active={mode === "batch"} onClick={() => setMode("batch")} icon={Upload} label="Upload a list" />
        </div>
        <p className="mt-2 text-sm text-slate-500">
          {mode === "manual"
            ? "Add one or more visitors below. With more than one, they're registered and approved together as a group visit."
            : "Upload a spreadsheet to register a group of visitors in one go — a contractor crew, an audit team, and so on. They're registered and approved together as a group visit; each visitor still gets their own QR pass for verification."}
        </p>
      </div>

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
          <Input id="windowEnd" name="windowEnd" type="time" required defaultValue={mode === "batch" ? "12:00" : "10:00"} />
        </Field>
      </div>
      <Field label="Purpose of visit" htmlFor="purpose" required={mode === "manual"}>
        <Textarea
          id="purpose"
          name="purpose"
          required={mode === "manual"}
          placeholder={
            mode === "manual"
              ? "e.g. Cross-connect installation, hardware upgrade, rack audit…"
              : 'e.g. Contractor crew — quarterly cabling audit (defaults to "Group visit" if left blank)'
          }
        />
      </Field>

      {mode === "manual" ? (
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
          <input type="hidden" name="visitorsJson" value={JSON.stringify(rows)} />
        </div>
      ) : (
        <div className="space-y-2">
          <Field
            label="Visitor list (Excel or CSV)"
            htmlFor="visitorFile"
            required
            hint="Header row required: fullName, company, idType, idNumber, email, phone. Each name is screened against the blacklist automatically."
          >
            <input
              id="visitorFile"
              name="visitorFile"
              type="file"
              accept=".xlsx,.xlsm,.csv,text/csv"
              required
              className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand/10 file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand hover:file:bg-brand/20"
            />
          </Field>
          <Link href="/api/visitors/template" className="inline-flex items-center gap-1 text-sm text-brand hover:underline">
            <Download className="h-3.5 w-3.5" /> Download Excel template
          </Link>
        </div>
      )}

      <Button type="submit">{mode === "batch" ? "Upload and create visit request" : "Submit visitor request"}</Button>
    </form>
  );
}

function ModeTab({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition ${
        active ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
      }`}
    >
      <Icon className="h-3.5 w-3.5" /> {label}
    </button>
  );
}
