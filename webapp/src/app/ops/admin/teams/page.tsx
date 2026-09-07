import { Pencil } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { Table, THead, TH, TBody, TR, TD, EmptyRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TeamForm } from "@/components/admin/team-form";
import { requireSysAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { deleteTeam, updateTeam } from "@/actions/admin";
import { TEAM_FUNCTION_LABELS, type TeamFunction } from "@/lib/constants";

export default async function TeamsPage() {
  await requireSysAdmin();
  const [teams, regions, countries, facilities] = await Promise.all([
    prisma.team.findMany({
      include: { region: true, country: { include: { region: true } }, facility: true, members: true },
      orderBy: { name: "asc" },
    }),
    prisma.region.findMany({ orderBy: { name: "asc" } }),
    prisma.country.findMany({ orderBy: { name: "asc" } }),
    prisma.facility.findMany({ orderBy: { name: "asc" } }),
  ]);

  function scopeLabel(t: (typeof teams)[number]) {
    if (t.facility) return `Site: ${t.facility.name}`;
    if (t.country) return `Country: ${t.country.name} (${t.country.region.name})`;
    if (t.region) return `Region: ${t.region.name}`;
    return "Global (company-wide)";
  }

  function scopeType(t: (typeof teams)[number]): "Global" | "Region" | "Country" | "Facility" {
    if (t.facilityId) return "Facility";
    if (t.countryId) return "Country";
    if (t.regionId) return "Region";
    return "Global";
  }

  function scopeId(t: (typeof teams)[number]): string | undefined {
    return t.facilityId ?? t.countryId ?? t.regionId ?? undefined;
  }

  return (
    <div>
      <PageHeader
        title="Teams"
        description="Master data — the organizational roster a Global Sys Admin defines up front, scoped to a region, a country, a site, or the whole company."
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Table>
            <THead>
              <tr>
                <TH>Name</TH>
                <TH>Function</TH>
                <TH>Coverage</TH>
                <TH>Members</TH>
                <TH>{null}</TH>
              </tr>
            </THead>
            <TBody>
              {teams.length === 0 && <EmptyRow colSpan={5} message="No teams yet." />}
              {teams.map((t) => {
                const deleteBound = deleteTeam.bind(null, t.id);
                const updateBound = updateTeam.bind(null, t.id);
                return (
                  <TR key={t.id}>
                    <TD className="font-medium text-slate-900">{t.name}</TD>
                    <TD>
                      <Badge tone="blue">{TEAM_FUNCTION_LABELS[t.function as TeamFunction] ?? t.function}</Badge>
                    </TD>
                    <TD>{scopeLabel(t)}</TD>
                    <TD>{t.members.length}</TD>
                    <TD>
                      <div className="flex items-center justify-end gap-1">
                        <details className="relative">
                          <summary
                            title="Edit team"
                            className="cursor-pointer list-none rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 [&::-webkit-details-marker]:hidden"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </summary>
                          <div className="absolute right-0 top-full z-10 mt-1 w-64 rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
                            <TeamForm
                              regions={regions}
                              countries={countries}
                              facilities={facilities}
                              action={updateBound}
                              submitLabel="Save"
                              initial={{ name: t.name, function: t.function, scopeType: scopeType(t), scopeId: scopeId(t) }}
                            />
                          </div>
                        </details>
                        <form action={deleteBound}>
                          <Button type="submit" size="sm" variant="ghost">
                            Delete
                          </Button>
                        </form>
                      </div>
                    </TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>
        </div>
        <Card>
          <CardBody>
            <p className="mb-3 text-sm font-medium text-slate-700">Add team</p>
            <TeamForm regions={regions} countries={countries} facilities={facilities} />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
