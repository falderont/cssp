"use client";

import { ErrorPage } from "@/components/errors/error-page";

export default function RootError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorPage error={error} reset={reset} homeHref="/" />;
}
