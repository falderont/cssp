import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/card";
import { INCIDENT_CATEGORIES, INCIDENT_SEVERITIES } from "@/lib/constants";
import { cn } from "@/lib/utils";

type IncidentLite = { category: string; severity: string; status: string };

export function IncidentMatrix({ incidents }: { incidents: IncidentLite[] }) {
  const ongoing = incidents.filter((i) => i.status !== "Resolved");

  function countFor(severity: string, category: string) {
    return ongoing.filter((i) => i.severity === severity && i.category === category).length;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Incident matrix — ongoing by severity &amp; category</CardTitle>
      </CardHeader>
      <CardBody className="overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="p-2 text-left text-xs font-semibold uppercase text-slate-400" />
              {INCIDENT_CATEGORIES.map((c) => (
                <th key={c} className="p-2 text-center text-xs font-semibold uppercase text-slate-400">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {INCIDENT_SEVERITIES.map((s) => (
              <tr key={s}>
                <td className="p-2 text-xs font-semibold text-slate-500">{s}</td>
                {INCIDENT_CATEGORIES.map((c) => {
                  const count = countFor(s, c);
                  const isHighSeverity = s === "P1" || s === "P2";
                  return (
                    <td key={c} className="p-1 text-center">
                      <div
                        className={cn(
                          "mx-auto flex h-9 w-9 items-center justify-center rounded-lg text-sm font-semibold",
                          count > 0 ? (isHighSeverity ? "bg-red-500 text-white" : "bg-amber-400 text-white") : "bg-slate-50 text-slate-300"
                        )}
                      >
                        {count || ""}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </CardBody>
    </Card>
  );
}
