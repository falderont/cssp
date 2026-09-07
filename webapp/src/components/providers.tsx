"use client";

import { SessionProvider } from "next-auth/react";
import { ErrorDialogProvider, type ErrorCatalog } from "@/components/errors/error-dialog-provider";

export function Providers({ errorCatalog, children }: { errorCatalog: ErrorCatalog; children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ErrorDialogProvider catalog={errorCatalog}>{children}</ErrorDialogProvider>
    </SessionProvider>
  );
}
