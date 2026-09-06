"use client";

import { useActionState } from "react";
import { completeTask, type CompleteTaskState } from "./actions";

export function CompleteTaskForm({ taskId }: { taskId: string }) {
  const [state, formAction, pending] = useActionState<CompleteTaskState, FormData>(completeTask, undefined);

  return (
    <form action={formAction} className="mt-3 space-y-2 rounded-lg bg-slate-50 p-3">
      <input type="hidden" name="taskId" value={taskId} />
      <textarea
        name="completionNotes"
        required
        rows={2}
        placeholder="Completion notes (what was done, outcome)…"
        className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs outline-none focus:border-brand-500"
      />
      <input
        type="file"
        name="completionPhoto"
        accept="image/*"
        className="block w-full text-xs text-slate-500 file:mr-2 file:rounded file:border-0 file:bg-slate-200 file:px-2 file:py-1 file:text-xs"
      />
      {state?.error && <p className="text-xs text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-900 disabled:opacity-60"
      >
        {pending ? "Completing…" : "Complete task"}
      </button>
    </form>
  );
}
