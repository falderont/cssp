"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

// A lightweight "balloon" popover: a small floating panel anchored to its
// trigger, used in place of navigating to a whole new page for quick
// glance-and-act interactions (notifications, the account menu, inline
// quick-views). Closes on outside click or Escape.
export function Popover({
  trigger,
  children,
  align = "right",
  panelClassName,
}: {
  trigger: (state: { open: boolean; toggle: () => void }) => React.ReactNode;
  children: React.ReactNode | ((close: () => void) => React.ReactNode);
  align?: "left" | "right";
  panelClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const close = () => setOpen(false);
  const toggle = () => setOpen((o) => !o);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) close();
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      {trigger({ open, toggle })}
      {open && (
        <>
          <span
            className={cn(
              "absolute top-full z-50 mt-1 h-3 w-3 rotate-45 border-l border-t border-slate-200 bg-white",
              align === "right" ? "right-3" : "left-3"
            )}
            aria-hidden
          />
          <div
            className={cn(
              "animate-balloon-in absolute top-full z-50 mt-2.5 max-h-[75vh] overflow-auto rounded-xl border border-slate-200 bg-white shadow-balloon",
              align === "right" ? "right-0" : "left-0",
              panelClassName
            )}
            style={{ "--balloon-origin": align === "right" ? "top right" : "top left" } as React.CSSProperties}
            role="dialog"
          >
            {typeof children === "function" ? children(close) : children}
          </div>
        </>
      )}
    </div>
  );
}
