"use client";

// The last-resort boundary — catches a crash in the root layout itself,
// which is why this can't reach for the usual UI kit, Tailwind classes, or
// the error catalog: layout.tsx (and the <Providers> tree it mounts) is
// exactly what may have just failed. Inline styles and no dependencies,
// intentionally. Everything else in the app that throws is caught closer to
// where it happened — see app/error.tsx, app/ops/error.tsx,
// app/portal/error.tsx, and components/errors/action-form.tsx.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "system-ui, -apple-system, sans-serif",
            padding: 24,
            textAlign: "center",
            color: "#0f172a",
          }}
        >
          <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>Something went wrong</h1>
          <p style={{ marginTop: 8, color: "#475569", maxWidth: 420, fontSize: 14 }}>
            The application hit an unexpected error and couldn&apos;t recover. Please refresh the page, and contact support if this keeps
            happening.
          </p>
          {error.digest && <p style={{ marginTop: 12, fontSize: 12, color: "#94a3b8" }}>Reference: {error.digest}</p>}
          <button
            onClick={reset}
            style={{
              marginTop: 20,
              padding: "8px 16px",
              borderRadius: 8,
              background: "#2563eb",
              color: "white",
              border: "none",
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
