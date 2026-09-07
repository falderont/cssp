import { Loader2 } from "lucide-react";

// Shown automatically by Next.js while an /ops/* page's Server Component is
// fetching data (e.g. clicking into a list row) — the /ops layout and its
// sidebar are already mounted and keep rendering above this fallback.
export default function OpsLoading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-brand" />
    </div>
  );
}
