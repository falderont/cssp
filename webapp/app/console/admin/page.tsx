import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/dal";
import { withTenant } from "@/lib/tenant";
import { canManageProviderSetup } from "@/lib/rbac";
import { ROLE_LABEL } from "@/lib/nav";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import {
  CreateRegionForm,
  CreateFacilityForm,
  CreateBuildingForm,
  CreateEnterpriseAccountForm,
  CreateSiteEnrollmentForm,
  CreateUserForm,
} from "./forms";

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <Card className="p-5">
      <h2 className="font-display text-base font-semibold text-ink-900">{title}</h2>
      <p className="mt-0.5 text-sm text-slate-500">{description}</p>
      <div className="mt-4">{children}</div>
    </Card>
  );
}

export default async function ProviderAdminPage() {
  const session = await requireSession();
  if (!canManageProviderSetup(session.role)) redirect("/console/dashboard");

  const data = await withTenant(session.organizationId, async (tx) => {
    const regions = await tx.region.findMany({ orderBy: { name: "asc" } });
    const facilities = await tx.facility.findMany({ include: { region: true, buildings: true }, orderBy: { name: "asc" } });
    const accounts = await tx.enterpriseAccount.findMany({ orderBy: { name: "asc" } });
    const enrollments = await tx.siteEnrollment.findMany({
      include: { enterpriseAccount: true, facility: true },
      orderBy: { enterpriseAccount: { name: "asc" } },
    });
    const users = await tx.user.findMany({
      include: { enterpriseAccount: true, siteEnrollment: { include: { facility: true } } },
      orderBy: { name: "asc" },
    });
    return { regions, facilities, accounts, enrollments, users };
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Provider Setup" description="Regions, facilities, buildings, enterprise accounts, site enrollments, and users." />

      <Section title="Regions" description="Geographic grouping of your facilities — a roll-up convenience, not an access boundary.">
        <ul className="mb-4 flex flex-wrap gap-2">
          {data.regions.map((r) => (
            <li key={r.id} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              {r.name}
            </li>
          ))}
        </ul>
        <CreateRegionForm />
      </Section>

      <Section title="Facilities" description="Your data center sites — the unit of site-scoping for visitors, tickets, incidents, and remote hands.">
        <div className="mb-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="py-2 pr-4 font-medium">Name</th>
                <th className="py-2 pr-4 font-medium">Region</th>
                <th className="py-2 pr-4 font-medium">Address</th>
                <th className="py-2 pr-4 font-medium">Buildings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.facilities.map((f) => (
                <tr key={f.id}>
                  <td className="py-2 pr-4 font-medium text-ink-900">{f.name}</td>
                  <td className="py-2 pr-4 text-slate-500">{f.region?.name ?? "—"}</td>
                  <td className="py-2 pr-4 text-slate-500">{f.address}</td>
                  <td className="py-2 pr-4 text-slate-500">{f.buildings.map((b) => b.name).join(", ") || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <CreateFacilityForm regions={data.regions.map((r) => ({ id: r.id, name: r.name }))} />
      </Section>

      <Section title="Buildings" description="For a site with more than one physical building.">
        <CreateBuildingForm facilities={data.facilities.map((f) => ({ id: f.id, name: f.name }))} />
      </Section>

      <Section title="Enterprise Accounts" description="Your customers — each can be enrolled at any number of your facilities.">
        <ul className="mb-4 flex flex-wrap gap-2">
          {data.accounts.map((a) => (
            <li key={a.id} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              {a.name}
            </li>
          ))}
        </ul>
        <CreateEnterpriseAccountForm />
      </Section>

      <Section title="Site Enrollments" description="Which enterprise accounts are enrolled at which facilities.">
        <div className="mb-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="py-2 pr-4 font-medium">Account</th>
                <th className="py-2 pr-4 font-medium">Facility</th>
                <th className="py-2 pr-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.enrollments.map((e) => (
                <tr key={e.id}>
                  <td className="py-2 pr-4 font-medium text-ink-900">{e.enterpriseAccount.name}</td>
                  <td className="py-2 pr-4 text-slate-500">{e.facility.name}</td>
                  <td className="py-2 pr-4 text-slate-500">{e.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <CreateSiteEnrollmentForm
          accounts={data.accounts.map((a) => ({ id: a.id, name: a.name }))}
          facilities={data.facilities.map((f) => ({ id: f.id, name: f.name }))}
        />
      </Section>

      <Section title="Users" description="Provider staff and customer contacts, with role-based access.">
        <div className="mb-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="py-2 pr-4 font-medium">Name</th>
                <th className="py-2 pr-4 font-medium">Email</th>
                <th className="py-2 pr-4 font-medium">Role</th>
                <th className="py-2 pr-4 font-medium">Account / Site</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.users.map((u) => (
                <tr key={u.id}>
                  <td className="py-2 pr-4 font-medium text-ink-900">{u.name}</td>
                  <td className="py-2 pr-4 text-slate-500">{u.email}</td>
                  <td className="py-2 pr-4 text-slate-500">{ROLE_LABEL(u.role)}</td>
                  <td className="py-2 pr-4 text-slate-500">
                    {u.enterpriseAccount?.name ?? "—"}
                    {u.siteEnrollment ? ` · ${u.siteEnrollment.facility.name}` : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <CreateUserForm
          accounts={data.accounts.map((a) => ({ id: a.id, name: a.name }))}
          enrollments={data.enrollments.map((e) => ({ id: e.id, label: `${e.enterpriseAccount.name} · ${e.facility.name}` }))}
        />
      </Section>
    </div>
  );
}
