import { Loader2 } from "lucide-react";

// Suspense fallback for routes outside /portal and /ops (login, /verify,
// /maintenance) — those sections have their own loading.tsx.
export default function RootLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <Loader2 className="h-6 w-6 animate-spin text-brand" />
    </div>
  );
}
