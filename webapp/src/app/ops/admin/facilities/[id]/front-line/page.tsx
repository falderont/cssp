import { redirect } from "next/navigation";

export default async function FrontLineIndexPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/ops/admin/facilities/${id}/front-line/visitors`);
}
