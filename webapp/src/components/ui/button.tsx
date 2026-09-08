"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFormPending } from "@/components/errors/action-form";

const base =
  "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-1";
const sizes = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2",
  lg: "px-5 py-2.5 text-base",
};
const variants = {
  primary: "bg-brand text-white shadow-sm hover:bg-brand-dark hover:shadow",
  secondary: "bg-white text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 hover:ring-slate-400",
  danger: "bg-red-600 text-white shadow-sm hover:bg-red-700",
  ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
};

type Variant = keyof typeof variants;
type Size = keyof typeof sizes;

export function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  // Picks up the nearest ActionForm's pending state automatically — every
  // submit button gets a spinner while its action is in flight with no
  // per-call-site change (see action-form.tsx's FormPendingContext).
  // Children stay mounted (just made invisible) so the button doesn't
  // resize, and the spinner inherits each variant's own text color since
  // it renders as a sibling, not inside the color-inheriting content.
  const formPending = useFormPending();
  const isSubmitting = formPending && props.type === "submit";
  return (
    <button
      className={cn(base, sizes[size], variants[variant], isSubmitting && "relative", className)}
      {...props}
      disabled={props.disabled || isSubmitting}
    >
      <span className={cn("inline-flex items-center gap-2", isSubmitting && "invisible")}>{children}</span>
      {isSubmitting && (
        <span className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="h-4 w-4 animate-spin" />
        </span>
      )}
    </button>
  );
}

export function LinkButton({
  href,
  children,
  variant = "primary",
  size = "md",
  className,
}: {
  href: string;
  children: React.ReactNode;
  variant?: Variant;
  size?: Size;
  className?: string;
}) {
  return (
    <Link href={href} className={cn(base, sizes[size], variants[variant], className)}>
      {children}
    </Link>
  );
}
