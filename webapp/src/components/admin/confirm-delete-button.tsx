"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// The server action is the real guard here — it refuses (with a message
// naming what's still attached) when the record has dependents. This
// confirm only stops an accidental click before that request goes out.
export function ConfirmDeleteButton({
  action,
  confirmMessage,
  label = "Delete",
  size = "sm",
  iconOnly = false,
  className,
}: {
  action: () => void;
  confirmMessage: string;
  label?: string;
  size?: "sm" | "md";
  iconOnly?: boolean;
  className?: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(confirmMessage)) e.preventDefault();
      }}
    >
      {iconOnly ? (
        <button
          type="submit"
          title={label}
          className={cn(
            "inline-flex shrink-0 items-center gap-1 rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600",
            className
          )}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      ) : (
        <Button type="submit" variant="danger" size={size} className={className}>
          <Trash2 className="h-3.5 w-3.5" /> {label}
        </Button>
      )}
    </form>
  );
}
