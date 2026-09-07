"use client";

import { useState } from "react";
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

type Enrollment = { id: string; facility: { name: string } };

export function ServiceRequestForm({ enrollments }: { enrollments: Enrollment[] }) {
  const [category, setCategory] = useState<string>("RemoteHands");
  const isRemoteHands = category === "RemoteHands";
  const isScheduled = category === "SiteWalkEscort" || category === "GeneralMeeting";

  return (
    <ActionForm action={createServiceRequest} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Site" htmlFor="siteEnrollmentId" required>
          <Select id="siteEnrollmentId" name="siteEnrollmentId" required>
            {enrollments.map((e) => (
              <option key={e.id} value={e.id}>
                {e.facility.name}
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
        <div className="grid grid-cols-1 gap-4 rounded-lg border border-slate-200 p-3 sm:grid-cols-2">
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
      )}

      {isScheduled && (
        <div className="grid grid-cols-1 gap-4 rounded-lg border border-slate-200 p-3 sm:grid-cols-2">
          <Field label="Date & time" htmlFor="scheduledStart" required hint="Shown on the calendar and exportable to Outlook">
            <Input id="scheduledStart" name="scheduledStart" type="datetime-local" required />
          </Field>
          <Field label="End time (optional)" htmlFor="scheduledEnd">
            <Input id="scheduledEnd" name="scheduledEnd" type="datetime-local" />
          </Field>
        </div>
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
      <Button type="submit">Submit request</Button>
    </ActionForm>
  );
}
