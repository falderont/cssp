import { notFound } from "next/navigation";
import { InvoicePrintSheet } from "@/components/billing/invoice-print-sheet";
import { requireCustomerUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getProviderBranding } from "@/lib/branding";

export default async function PortalInvoicePrintPage({ params }: { params: { id: string } }) {
  const user = await requireCustomerUser();
  const [invoice, branding] = await Promise.all([
    prisma.invoice.findFirst({
      where: { id: params.id, enterpriseAccountId: user.enterpriseAccountId },
      include: { lineItems: true, enterpriseAccount: true },
    }),
    getProviderBranding(),
  ]);
  if (!invoice) notFound();

  return <InvoicePrintSheet invoice={invoice} branding={branding} />;
}
