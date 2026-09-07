"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Download } from "lucide-react";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { createVisitorRequestBatch } from "@/actions/visitors";
import { ActionForm } from "@/components/errors/action-form";

type Building = { id: string; name: string };
type Enrollment = { id: string; facility: { name: string; buildings: Building[] } };

export function VisitorBatchForm({ enrollments }: { enrollments: Enrollment[] }) {
  const [siteEnrollmentId, setSiteEnrollmentId] = useState(enrollments[0]?.id ?? "");
  const buildings = useMemo(
    () => enrollments.find((e) => e.id === siteEnrollmentId)?.facility.buildings ?? [],
    [enrollments, siteEnrollmentId]
  );

  return (
    <ActionForm action={createVisitorRequestBatch} className="space-y-6">
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
        <Field label="Visit date" htmlFor="visitDate" required>
          <Input id="visitDate" name="visitDate" type="date" required />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Window start" htmlFor="windowStart" required>
            <Input id="windowStart" name="windowStart" type="time" required defaultValue="09:00" />
          </Field>
          <Field label="Window end" htmlFor="windowEnd" required>
            <Input id="windowEnd" name="windowEnd" type="time" required defaultValue="12:00" />
          </Field>
        </div>
      </div>
      <Field label="Purpose of visit" htmlFor="purpose">
        <Textarea id="purpose" name="purpose" placeholder="e.g. Contractor crew — quarterly cabling audit" />
      </Field>
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
      <div>
        <Button type="submit">Upload and create visit request</Button>
      </div>
    </ActionForm>
  );
}
