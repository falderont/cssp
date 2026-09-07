import { redirect } from "next/navigation";

export default async function ServiceDeliveryIndexPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/ops/admin/facilities/${id}/service-delivery/incidents`);
}
