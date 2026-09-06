"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/dal";
import { withTenant } from "@/lib/tenant";
import { canManageVisitors, assert } from "@/lib/rbac";
import { accessControlAdapter } from "@/lib/adapters/access-control";

async function loadVisitorId(formData: FormData): Promise<string> {
  const id = formData.get("visitorId");
  if (typeof id !== "string" || !id) throw new Error("Missing visitor id.");
  return id;
}

export async function approveVisitor(formData: FormData): Promise<void> {
  const session = await requireSession();
  assert(canManageVisitors(session.role));
  const visitorId = await loadVisitorId(formData);

  await withTenant(session.organizationId, async (tx) => {
    const visitor = await tx.visitor.findUniqueOrThrow({
      where: { id: visitorId },
      include: { siteEnrollment: { include: { facility: true } } },
    });
    const { credentialRef } = await accessControlAdapter.issueVisitorCredential({
      visitorName: visitor.visitorName,
      facilityName: visitor.siteEnrollment.facility.name,
      visitStart: visitor.visitStart,
      visitEnd: visitor.visitEnd,
    });
    await tx.visitor.update({
      where: { id: visitorId },
      data: { status: "APPROVED", accessCredentialRef: credentialRef },
    });
  });

  revalidatePath("/console/visitors");
}

export async function denyVisitor(formData: FormData): Promise<void> {
  const session = await requireSession();
  assert(canManageVisitors(session.role));
  const visitorId = await loadVisitorId(formData);

  await withTenant(session.organizationId, (tx) =>
    tx.visitor.update({ where: { id: visitorId }, data: { status: "DENIED" } }),
  );

  revalidatePath("/console/visitors");
}

export async function checkInVisitor(formData: FormData): Promise<void> {
  const session = await requireSession();
  assert(canManageVisitors(session.role));
  const visitorId = await loadVisitorId(formData);

  await withTenant(session.organizationId, (tx) =>
    tx.visitor.update({ where: { id: visitorId }, data: { status: "CHECKED_IN" } }),
  );

  revalidatePath("/console/visitors");
}

export async function checkOutVisitor(formData: FormData): Promise<void> {
  const session = await requireSession();
  assert(canManageVisitors(session.role));
  const visitorId = await loadVisitorId(formData);

  await withTenant(session.organizationId, async (tx) => {
    const visitor = await tx.visitor.findUniqueOrThrow({ where: { id: visitorId } });
    if (visitor.accessCredentialRef) {
      await accessControlAdapter.revokeCredential(visitor.accessCredentialRef);
    }
    await tx.visitor.update({ where: { id: visitorId }, data: { status: "CHECKED_OUT" } });
  });

  revalidatePath("/console/visitors");
}
