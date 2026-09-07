import { notFound } from "next/navigation";
import { InvoicePrintSheet } from "@/components/billing/invoice-print-sheet";
import { requireTenantBillingViewer } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getProviderBranding } from "@/lib/branding";

export default async function PortalInvoicePrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireTenantBillingViewer();
  const [invoice, branding] = await Promise.all([
    prisma.invoice.findFirst({
      where: { id, enterpriseAccountId: user.enterpriseAccountId },
      include: { lineItems: true, enterpriseAccount: true },
    }),
    getProviderBranding(),
  ]);
  if (!invoice) notFound();

  return <InvoicePrintSheet invoice={invoice} branding={branding} />;
}
