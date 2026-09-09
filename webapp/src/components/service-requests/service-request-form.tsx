"use client";

import { useMemo, useState } from "react";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { createServiceRequest } from "@/actions/service-requests";
import {
  REMOTE_HANDS_TASK_LABELS,
  REMOTE_HANDS_TASK_TYPES,
  SERVICE_REQUEST_CATEGORIES,
  SERVICE_REQUEST_CATEGORY_LABELS,
  SERVICE_REQUEST_PRIORITIES,
} from "@/lib/constants";
import { ActionForm } from "@/components/errors/action-form";

type Building = { id: string; name: string; code: string };
type MeetingContact = { id: string; name: string; title: string | null; role: string; group: "Escalation" | "CSTeam" };
type Enrollment = { id: string; facility: { name: string; buildings: Building[] }; meetingContacts: MeetingContact[] };

export function ServiceRequestForm({ enrollments }: { enrollments: Enrollment[] }) {
  const [siteEnrollmentId, setSiteEnrollmentId] = useState(enrollments[0]?.id ?? "");
  const [category, setCategory] = useState<string>("RemoteHands");
  const isRemoteHands = category === "RemoteHands";
  const isMeeting = category === "GeneralMeeting";
  const isScheduled = category === "SiteWalkEscort" || category === "GeneralMeeting";

  const buildings = useMemo(
    () => enrollments.find((e) => e.id === siteEnrollmentId)?.facility.buildings ?? [],
    [enrollments, siteEnrollmentId]
  );
  const meetingContacts = useMemo(
    () => enrollments.find((e) => e.id === siteEnrollmentId)?.meetingContacts ?? [],
    [enrollments, siteEnrollmentId]
  );
  const escalationContacts = meetingContacts.filter((c) => c.group === "Escalation");
  const csContacts = meetingContacts.filter((c) => c.group === "CSTeam");

  return (
    <ActionForm action={createServiceRequest} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Site" htmlFor="siteEnrollmentId" required>
          <Select
            id="siteEnrollmentId"
            name="siteEnrollmentId"
            required
            value={siteEnrollmentId}
            onChange={(e) => setSiteEnrollmentId(e.target.value)}
          >
            {enrollments.map((e) => (
              <option key={e.id} value={e.id}>
                {e.facility.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Room / area (optional)" htmlFor="buildingId" hint="Where should we go?">
          <Select id="buildingId" name="buildingId" defaultValue="">
            <option value="">Not specified</option>
            {buildings.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Type of request" htmlFor="category" required>
          <Select id="category" name="category" required value={category} onChange={(e) => setCategory(e.target.value)}>
            {SERVICE_REQUEST_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {SERVICE_REQUEST_CATEGORY_LABELS[c]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Priority" htmlFor="priority" required>
          <Select id="priority" name="priority" required defaultValue="Normal">
            {SERVICE_REQUEST_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      {isRemoteHands && (
        <div className="rounded-lg border border-slate-200 p-3">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Remote / Smart Hands details</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Task type" htmlFor="taskType" required>
              <Select id="taskType" name="taskType" required defaultValue="PowerCycle">
                {REMOTE_HANDS_TASK_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {REMOTE_HANDS_TASK_LABELS[t]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Asset / rack reference" htmlFor="assetRef" required>
              <Input id="assetRef" name="assetRef" required placeholder="e.g. Rack C14 — Switch SW-C14-02" />
            </Field>
            <Field label="Preferred window start (optional)" htmlFor="scheduledStart">
              <Input id="scheduledStart" name="scheduledStart" type="datetime-local" />
            </Field>
            <Field label="Preferred window end (optional)" htmlFor="scheduledEnd">
              <Input id="scheduledEnd" name="scheduledEnd" type="datetime-local" />
            </Field>
          </div>
        </div>
      )}

      {isScheduled && (
        <div className="rounded-lg border border-slate-200 p-3">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Schedule</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Date & time" htmlFor="scheduledStart" required hint="Shown on the calendar and exportable to Outlook">
              <Input id="scheduledStart" name="scheduledStart" type="datetime-local" required />
            </Field>
            <Field label="End time (optional)" htmlFor="scheduledEnd">
              <Input id="scheduledEnd" name="scheduledEnd" type="datetime-local" />
            </Field>
          </div>
        </div>
      )}

      {isMeeting && (
        <Field
          label="Who would you like to meet with? (optional)"
          htmlFor="requestedWithId"
          hint="Limited to this site's escalation matrix and your assigned CS Team"
        >
          <Select id="requestedWithId" name="requestedWithId" key={siteEnrollmentId} defaultValue="">
            <option value="">No preference — anyone available</option>
            {escalationContacts.length > 0 && (
              <optgroup label="Site escalation matrix">
                {escalationContacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.title ? ` — ${c.title}` : ""}
                  </option>
                ))}
              </optgroup>
            )}
            {csContacts.length > 0 && (
              <optgroup label="Customer Success team">
                {csContacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.title ? ` — ${c.title}` : ""}
                  </option>
                ))}
              </optgroup>
            )}
          </Select>
        </Field>
      )}

      <Field label="Subject" htmlFor="subject" required>
        <Input id="subject" name="subject" required placeholder="Short summary" />
      </Field>
      <Field label="Description" htmlFor="description" required>
        <Textarea
          id="description"
          name="description"
          required
          placeholder={isRemoteHands ? "What should the technician do?" : "Details…"}
        />
      </Field>
      <Button type="submit" className="w-full sm:w-auto">
        Submit request
      </Button>
    </ActionForm>
  );
}
