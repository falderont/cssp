import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { defaultLandingPath } from "@/lib/auth";
import { getProviderBranding } from "@/lib/branding";
import { LoginForm } from "@/components/login-form";
import {
  Building2,
  ShieldCheck,
  Wrench,
  FileBarChart,
  Users,
  Gauge,
} from "lucide-react";

export default async function LoginPage() {
  const session = await getSession();
  if (session?.user) redirect(defaultLandingPath(session.user.role));
  const branding = await getProviderBranding();

  const features = [
    { icon: Users, text: "Visitor management with campus access control sync" },
    { icon: ShieldCheck, text: "Incident & maintenance tracking with live notifications" },
    { icon: Wrench, text: "Remote / smart hands requests, tracked to completion" },
    { icon: Gauge, text: "Optional BMS telemetry — a window into your DCIM/BMS, not a replacement" },
    { icon: FileBarChart, text: "Reporting, billing and a CS performance dashboard in one place" },
  ];

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <div className="brand-gradient hidden flex-col justify-between p-10 text-white lg:flex">
        <div className="flex items-center gap-2 font-display text-lg font-semibold">
          <Building2 className="h-6 w-6" />
          {branding.companyName}
        </div>
        <div className="max-w-md">
          <h1 className="font-display text-3xl font-semibold leading-tight">
            One portal for every site, every tenant, every request.
          </h1>
          <p className="mt-3 text-sm text-white/80">
            A consolidated customer interface over your existing DCIM, CMMS and BMS —
            not a replacement for them.
          </p>
          <ul className="mt-8 space-y-3">
            {features.map((f) => (
              <li key={f.text} className="flex items-start gap-3 text-sm text-white/90">
                <f.icon className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{f.text}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-white/60">
          Multi-region · multi-site · multi-tenant demo environment — seeded with sample data.
        </p>
      </div>
      <div className="flex items-center justify-center bg-slate-50 p-6 lg:p-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-2 font-display text-lg font-semibold text-slate-900">
              <Building2 className="h-6 w-6 text-brand" />
              {branding.companyName}
            </div>
          </div>
          <h2 className="font-display text-xl font-semibold text-slate-900">Sign in to your account</h2>
          <p className="mt-1 text-sm text-slate-500">Provider staff and tenant users share this login.</p>
          <div className="mt-6">
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
}
