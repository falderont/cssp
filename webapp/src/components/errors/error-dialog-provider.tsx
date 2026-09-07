"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { classifyErrorMessage, resolveErrorDisplay, type ErrorCode } from "@/lib/errors";

export type ErrorCatalogEntry = { title: string; description: string; fallbackMessage: string };
export type ErrorCatalog = Partial<Record<ErrorCode, ErrorCatalogEntry>>;

type ErrorDisplay = { code: ErrorCode; title: string; message: string };

type ErrorDialogContextValue = {
  showError: (error: unknown) => void;
  // Classifies against the same live (admin-editable) catalog as the dialog,
  // without popping it up — for a route's error.tsx to render inline.
  resolveError: (error: unknown) => ErrorDisplay;
};

const ErrorDialogContext = createContext<ErrorDialogContextValue | null>(null);

// Thrown by every server action across the app (see components/errors/action-form.tsx),
// surfaces as this pop-up instead of the framework's crash/dev-overlay/blank
// error page. Call from anywhere already inside <ErrorDialogProvider> (it
// wraps the whole app in app/layout.tsx via <Providers>).
export function useErrorDialog(): ErrorDialogContextValue {
  const ctx = useContext(ErrorDialogContext);
  if (!ctx) throw new Error("useErrorDialog must be used within an ErrorDialogProvider");
  return ctx;
}

export function ErrorDialogProvider({ catalog, children }: { catalog: ErrorCatalog; children: React.ReactNode }) {
  const [display, setDisplay] = useState<ErrorDisplay | null>(null);

  const resolveError = useCallback(
    (error: unknown): ErrorDisplay => {
      const rawMessage = error instanceof Error ? error.message : typeof error === "string" ? error : "";
      const classified = classifyErrorMessage(rawMessage);
      return resolveErrorDisplay(classified, catalog);
    },
    [catalog]
  );

  const showError = useCallback((error: unknown) => setDisplay(resolveError(error)), [resolveError]);

  const close = () => setDisplay(null);

  useEffect(() => {
    if (!display) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [display]);

  return (
    <ErrorDialogContext.Provider value={{ showError, resolveError }}>
      {children}
      {display && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="animate-backdrop-fade absolute inset-0 bg-slate-900/40" onClick={close} aria-hidden />
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="error-dialog-title"
            aria-describedby="error-dialog-message"
            className="animate-dialog-in relative w-full max-w-sm rounded-xl border border-slate-200 bg-white p-5 shadow-xl"
          >
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
                <AlertTriangle className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1 pt-1">
                <h2 id="error-dialog-title" className="font-display text-base font-semibold text-slate-900">
                  {display.title}
                </h2>
                <p id="error-dialog-message" className="mt-1 text-sm text-slate-600">
                  {display.message}
                </p>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button size="sm" onClick={close} autoFocus>
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      )}
    </ErrorDialogContext.Provider>
  );
}
