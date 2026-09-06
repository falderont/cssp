import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen">
      <div className="hidden flex-1 flex-col justify-between bg-ink-900 p-12 text-white lg:flex">
        <div className="font-display text-xl font-semibold tracking-tight">CSSP</div>
        <div className="max-w-md">
          <h1 className="font-display text-3xl font-semibold leading-tight">
            One portal for every site you colocate with us.
          </h1>
          <p className="mt-4 text-slate-300">
            Visitors, incidents, maintenance, tickets, remote hands, documents, and billing —
            consolidated across every facility, without replacing the systems that already run them.
          </p>
        </div>
        <p className="text-sm text-slate-400">
          A consolidated customer interface over your DCIM, CMMS and BMS.
        </p>
      </div>
      <div className="flex flex-1 items-center justify-center bg-slate-50 p-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <div className="font-display text-xl font-semibold tracking-tight text-ink-900">CSSP</div>
          </div>
          <h2 className="font-display text-2xl font-semibold text-ink-900">Sign in</h2>
          <p className="mt-1 text-sm text-slate-500">Use the credentials your provider gave you.</p>
          <div className="mt-6">
            <LoginForm />
          </div>
          <div className="mt-8 rounded-lg border border-slate-200 bg-white p-4 text-xs text-slate-500">
            <p className="mb-2 font-semibold text-slate-700">Demo accounts (seeded data)</p>
            <p>Customer Global Admin — meridian.admin@example.com / demo-pass-1</p>
            <p>Provider Ops — ops@meridian-dc.example.com / demo-pass-1</p>
            <p className="mt-1 text-slate-400">See webapp/README.md for the full role list.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
