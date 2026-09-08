"use client";

import { createContext, useContext, useTransition } from "react";
import { useRouter } from "next/navigation";
import { isRedirectError, getURLFromRedirectError, getRedirectTypeFromError, RedirectType } from "next/dist/client/components/redirect";
import { isNotFoundError } from "next/dist/client/components/not-found";
import { useErrorDialog } from "@/components/errors/error-dialog-provider";
import { useSuccessToast } from "@/components/errors/success-toast-provider";

// Whether the nearest ActionForm ancestor is currently submitting — false
// with no ActionForm above at all, so any submit Button can safely read
// this (see components/ui/button.tsx) without requiring a provider.
const FormPendingContext = createContext(false);
export function useFormPending() {
  return useContext(FormPendingContext);
}

// Drop-in replacement for <form action={someServerAction}> — same props,
// same children (a passed-in onSubmit, e.g. client-side validation that can
// preventDefault() to block submission, still runs first — same as a plain
// <form>). The difference: instead of letting a thrown error crash through
// to the framework's error boundary (a blank/dev-overlay page), it catches
// it here and hands it to the app-wide pop-up dialog, so the rest of the
// page — and whatever the user was doing on it — stays intact. It also
// tracks a pending state (exposed via FormPendingContext, so every submit
// Button inside picks up a spinner automatically — see button.tsx) and, on
// success, reports a toast so a save/create/toggle never looks like it did
// nothing (see success-toast-provider.tsx) — pass `silent` to opt out for
// an action whose own UI already makes success obvious (e.g. a status pill
// flips right there).
//
// redirect() inside a server action normally works by throwing a special
// error that Next's own RedirectBoundary catches *during render*. Calling
// the action as a plain function from an event handler (as this does, so it
// can try/catch) bypasses that boundary entirely — the throw would otherwise
// vanish as a silent unhandled rejection — so a redirect is detected here
// and turned into an explicit router navigation instead.
export function ActionForm({
  action,
  onSubmit,
  onSuccess,
  successMessage = "Saved.",
  silent = false,
  children,
  ...props
}: React.FormHTMLAttributes<HTMLFormElement> & {
  action: (formData: FormData) => unknown;
  // Fires only once the action resolves without throwing — e.g. closing an
  // inline "add" panel. Distinct from onSubmit (which runs first and can
  // preventDefault() to block submission entirely, for client-side
  // validation): a form that closes itself via onSubmit today would close on
  // every attempt, success or not, silently discarding the user's input the
  // moment a rejected value bounces off a friendly error.
  onSuccess?: () => void;
  successMessage?: string;
  silent?: boolean;
}) {
  const router = useRouter();
  const { showError } = useErrorDialog();
  const { showToast } = useSuccessToast();
  const [isPending, startTransition] = useTransition();

  return (
    <FormPendingContext.Provider value={isPending}>
      <form
        {...props}
        onSubmit={(e) => {
          onSubmit?.(e);
          if (e.defaultPrevented) return;
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          startTransition(async () => {
            try {
              await action(formData);
              onSuccess?.();
              if (!silent) showToast(successMessage);
            } catch (error) {
              if (isRedirectError(error)) {
                const url = getURLFromRedirectError(error);
                if (getRedirectTypeFromError(error) === RedirectType.push) router.push(url);
                else router.replace(url);
                if (!silent) showToast(successMessage);
                return;
              }
              // No action in this codebase calls notFound(), but pass it
              // through to whatever boundary can still reach it rather than
              // swallowing it.
              if (isNotFoundError(error)) throw error;
              showError(error);
            }
          });
        }}
      >
        {children}
      </form>
    </FormPendingContext.Provider>
  );
}
