import { notFound, redirect } from "next/navigation";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { requireFacilityPageAccess } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { updateFacilityAcs } from "@/actions/admin";
import { updateTelemetrySource } from "@/actions/telemetry";
import { getFacilityTabAccess } from "@/lib/facility-tabs";
import { ActionForm } from "@/components/errors/action-form";

// Each site connects to its own local systems — a shared/global integration
// toggle doesn't fit either of these: two tenants' badge readers or BMS
// gateways are never the same physical system. ACS lived on the Overview
// tab and BMS lived on its own /ops/telemetry/[facilityId] page before;
// combined here since both are, in the end, "what does this site's own
// hardware talk to."
export default async function FacilityIntegrationsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireFacilityPageAccess();
  const { canViewIntegrations } = getFacilityTabAccess(user.role);
  if (!canViewIntegrations) redirect(`/ops/admin/facilities/${id}`);

  const facility = await prisma.facility.findUnique({ where: { id }, include: { telemetrySource: true } });
  if (!facility) notFound();

  const updateAcsBound = updateFacilityAcs.bind(null, facility.id);
  const returnPath = `/ops/admin/facilities/${facility.id}/integrations`;
  const updateTelemetryBound = updateTelemetrySource.bind(null, facility.id, returnPath);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Access control (ACS)</CardTitle>
        </CardHeader>
        <CardBody>
          <ActionForm action={updateAcsBound} className="space-y-3">
            <Field label="ACS endpoint" htmlFor="acsEndpointUrl" hint="Leave blank to use the built-in mock adapter for demos">
              <Input
                id="acsEndpointUrl"
                name="acsEndpointUrl"
                defaultValue={facility.acsEndpointUrl ?? ""}
                placeholder="https://acs.example.com/api/badges"
              />
            </Field>
            <Button type="submit" className="w-full" variant="secondary">
              Save
            </Button>
          </ActionForm>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Building Management System (BMS)</CardTitle>
        </CardHeader>
        <CardBody>
          <ActionForm action={updateTelemetryBound} className="space-y-3">
            <div className="mb-2">
              <StatusBadge status={facility.telemetrySource?.status ?? "NotConfigured"} />
            </div>
            <Field label="BMS / DCIM vendor" htmlFor="vendor" hint="e.g. Schneider EcoStruxure, Generic BACnet Gateway">
              <Input id="vendor" name="vendor" defaultValue={facility.telemetrySource?.vendor ?? ""} />
            </Field>
            <Field label="Status" htmlFor="status">
              <Select id="status" name="status" defaultValue={facility.telemetrySource?.status ?? "NotConfigured"}>
                <option value="NotConfigured">Not configured</option>
                <option value="Connected">Connected</option>
                <option value="Error">Error</option>
              </Select>
            </Field>
            <Button type="submit" className="w-full" variant="secondary">
              Save
            </Button>
          </ActionForm>
        </CardBody>
      </Card>
    </div>
  );
}
