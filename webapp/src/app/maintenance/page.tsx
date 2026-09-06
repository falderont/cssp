import { Wrench } from "lucide-react";
import { prisma } from "@/lib/prisma";

export default async function MaintenancePage() {
  const settings = await prisma.providerSettings.findUnique({ where: { id: "singleton" } });

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600">
          <Wrench className="h-6 w-6" />
        </span>
        <h1 className="mt-4 font-display text-xl font-semibold text-slate-900">Scheduled maintenance</h1>
        <p className="mt-2 text-sm text-slate-500">
          {settings?.maintenanceMessage || "The portal is briefly offline for maintenance. Please check back shortly."}
        </p>
      </div>
    </div>
  );
}
