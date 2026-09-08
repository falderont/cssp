"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { isRedirectError, getURLFromRedirectError, getRedirectTypeFromError, RedirectType } from "next/dist/client/components/redirect";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useErrorDialog } from "@/components/errors/error-dialog-provider";
import { cn } from "@/lib/utils";

// The server action is the real guard here — it refuses (with a message
// naming what's still attached) when the record has dependents. This
// confirm only stops an accidental click before that request goes out, as
// a pop-up dialog rather than the browser's own unstyled confirm() — kept
// consistent with the app-wide error pop-up (error-dialog-provider.tsx)
// this also reports through to, instead of letting a rejection (e.g. that
// dependents guard) crash straight through to the error boundary.
export function ConfirmDeleteButton({
  action,
  confirmMessage,
  label = "Delete",
  size = "sm",
  iconOnly = false,
  className,
}: {
  action: () => unknown;
  confirmMessage: string;
  label?: string;
  size?: "sm" | "md";
  iconOnly?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { showError } = useErrorDialog();

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !isPending) setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, isPending]);

  function handleConfirm() {
    startTransition(async () => {
      try {
        await action();
        setOpen(false);
      } catch (error) {
        setOpen(false);
        if (isRedirectError(error)) {
          const url = getURLFromRedirectError(error);
          if (getRedirectTypeFromError(error) === RedirectType.push) router.push(url);
          else router.replace(url);
          return;
        }
        showError(error);
      }
    });
  }

  return (
    <>
      {iconOnly ? (
        <button
          type="button"
          title={label}
          onClick={() => setOpen(true)}
          className={cn(
            "inline-flex shrink-0 items-center gap-1 rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600",
            className
          )}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      ) : (
        <Button type="button" variant="danger" size={size} className={className} onClick={() => setOpen(true)}>
          <Trash2 className="h-3.5 w-3.5" /> {label}
        </Button>
      )}

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="animate-backdrop-fade absolute inset-0 bg-slate-900/40"
            onClick={() => !isPending && setOpen(false)}
            aria-hidden
          />
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-delete-title"
            aria-describedby="confirm-delete-message"
            className="animate-dialog-in relative w-full max-w-sm rounded-xl border border-slate-200 bg-white p-5 shadow-xl"
          >
            <h2 id="confirm-delete-title" className="font-display text-base font-semibold text-slate-900">
              {label}?
            </h2>
            <p id="confirm-delete-message" className="mt-1 text-sm text-slate-600">
              {confirmMessage}
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button size="sm" variant="secondary" onClick={() => setOpen(false)} disabled={isPending}>
                Cancel
              </Button>
              <Button size="sm" variant="danger" onClick={handleConfirm} disabled={isPending} autoFocus>
                {isPending ? "Deleting…" : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
