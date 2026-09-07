"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button, LinkButton } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useErrorDialog } from "@/components/errors/error-dialog-provider";

// The controlled fallback for anything that reaches a route's error.tsx
// boundary — a real render/data-fetching bug, or a form action not (yet)
// wrapped in <ActionForm>. Resolves against the same live, admin-editable
// catalog as the pop-up dialog, so the two never disagree about what a
// given error code means.
export function ErrorPage({
  error,
  reset,
  homeHref = "/",
}: {
  error: Error & { digest?: string };
  reset: () => void;
  homeHref?: string;
}) {
  const { resolveError } = useErrorDialog();
  const display = resolveError(error);

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
        <AlertTriangle className="h-7 w-7" />
      </span>
      <h1 className="mt-4 font-display text-xl font-semibold text-slate-900">{display.title}</h1>
      <p className="mt-2 max-w-md text-sm text-slate-600">{display.message}</p>
      <Badge tone="slate" className="mt-3">
        {display.code}
        {error.digest ? ` · ${error.digest}` : ""}
      </Badge>
      <div className="mt-6 flex items-center gap-3">
        <Button onClick={reset} variant="secondary">
          <RotateCcw className="h-4 w-4" /> Try again
        </Button>
        <LinkButton href={homeHref}>Back home</LinkButton>
      </div>
    </div>
  );
}
