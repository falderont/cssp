"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("That email/password combination doesn't match an active account.");
      return;
    }
    router.push(searchParams.get("callbackUrl") || "/");
    router.refresh();
  }

  function fillDemo(demoEmail: string) {
    setEmail(demoEmail);
    setPassword("password123");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-inset ring-red-200">{error}</div>
      )}
      <Field label="Work email" htmlFor="email" required>
        <Input
          id="email"
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
        />
      </Field>
      <Field label="Password" htmlFor="password" required>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />
      </Field>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Signing in…" : "Sign in"}
      </Button>
      <DemoAccounts onPick={fillDemo} />
    </form>
  );
}

function DemoAccounts({ onPick }: { onPick: (email: string) => void }) {
  const accounts = [
    { label: "Provider — Super Admin", email: "admin@aurorapdc.com" },
    { label: "Provider — NOC / Ops", email: "noc@aurorapdc.com" },
    { label: "Provider — Security", email: "security@aurorapdc.com" },
    { label: "Provider — CS Manager", email: "csmanager@aurorapdc.com" },
    { label: "Provider — Field Technician", email: "tech@aurorapdc.com" },
    { label: "Provider — Finance", email: "finance@aurorapdc.com" },
    { label: "Tenant — Global Admin (Meridian Logistics)", email: "dita.ayu@meridianlogistics.com" },
    { label: "Tenant — Site Contact (Nusantara Cloud)", email: "rina.saputri@nusantaracloud.io" },
  ];
  return (
    <div className="mt-6 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        Demo accounts (password: password123)
      </p>
      <div className="flex flex-wrap gap-1.5">
        {accounts.map((a) => (
          <button
            type="button"
            key={a.email}
            onClick={() => onPick(a.email)}
            className="rounded-full bg-white px-2.5 py-1 text-xs text-slate-600 ring-1 ring-inset ring-slate-300 hover:bg-slate-100"
          >
            {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}
