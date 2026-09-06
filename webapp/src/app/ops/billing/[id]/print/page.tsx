import { notFound } from "next/navigation";
import { InvoicePrintSheet } from "@/components/billing/invoice-print-sheet";
import { requireInternalUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getProviderBranding } from "@/lib/branding";

export default async function OpsInvoicePrintPage({ params }: { params: { id: string } }) {
  await requireInternalUser();
  const [invoice, branding] = await Promise.all([
    prisma.invoice.findUnique({
      where: { id: params.id },
      include: { lineItems: true, enterpriseAccount: true },
    }),
    getProviderBranding(),
  ]);
  if (!invoice) notFound();

  return <InvoicePrintSheet invoice={invoice} branding={branding} />;
}
