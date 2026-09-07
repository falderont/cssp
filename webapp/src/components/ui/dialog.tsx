"use client";

import { cloneElement, isValidElement, useEffect, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

// A centered pop-up dialog for a form/content block that needs more room
// than the balloon Popover — same visual language as the app-wide
// ErrorDialogProvider / ConfirmDeleteButton pop-ups (animate-backdrop-fade +
// animate-dialog-in, Escape-to-close) so it reads as part of the same system.
export function Dialog({
  trigger,
  title,
  description,
  children,
  className,
}: {
  trigger: React.ReactElement;
  title: string;
  description?: string;
  children: (close: () => void) => React.ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const triggerEl = isValidElement<{ onClick?: () => void }>(trigger)
    ? cloneElement(trigger, { onClick: () => setOpen(true) })
    : trigger;

  return (
    <>
      {triggerEl}
      {open && (
        <div className="fixed inset-0 z-[100] overflow-y-auto p-4 py-8">
          <div className="animate-backdrop-fade fixed inset-0 bg-slate-900/40" onClick={close} aria-hidden />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="dialog-title"
            className={cn(
              "animate-dialog-in relative mx-auto w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-xl",
              className
            )}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h3 id="dialog-title" className="font-display text-base font-semibold text-slate-900">
                  {title}
                </h3>
                {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
              </div>
              <button
                type="button"
                onClick={close}
                className="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {children(close)}
          </div>
        </div>
      )}
    </>
  );
}
