"use client";

import { SessionProvider } from "next-auth/react";
import { ErrorDialogProvider, type ErrorCatalog } from "@/components/errors/error-dialog-provider";
import { SuccessToastProvider } from "@/components/errors/success-toast-provider";

export function Providers({ errorCatalog, children }: { errorCatalog: ErrorCatalog; children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ErrorDialogProvider catalog={errorCatalog}>
        <SuccessToastProvider>{children}</SuccessToastProvider>
      </ErrorDialogProvider>
    </SessionProvider>
  );
}
