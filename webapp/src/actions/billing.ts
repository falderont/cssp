"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCustomerUser, requireInternalUser } from "@/lib/session";
import { notifyEnterpriseAccountAdmins } from "@/lib/notify";
import { INVOICE_LINE_CATEGORIES, INVOICE_STATUSES } from "@/lib/constants";

const lineItemSchema = z.object({
  description: z.string().min(1),
  category: z.enum(INVOICE_LINE_CATEGORIES),
  quantity: z.coerce.number().positive(),
  unitPrice: z.coerce.number().nonnegative(),
});

const createSchema = z.object({
  enterpriseAccountId: z.string().min(1),
  currency: z.string().min(1),
  periodStart: z.string().min(1),
  periodEnd: z.string().min(1),
  issueDate: z.string().min(1),
  dueDate: z.string().min(1),
  taxRatePct: z.coerce.number().min(0).max(100).default(0),
  notes: z.string().optional(),
  lineItems: z.array(lineItemSchema).min(1),
});

function generateInvoiceNumber() {
  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  return `INV-${stamp}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

export async function createInvoice(formData: FormData) {
  await requireInternalUser();
  const parsed = createSchema.parse({
    enterpriseAccountId: formData.get("enterpriseAccountId"),
    currency: formData.get("currency"),
    periodStart: formData.get("periodStart"),
    periodEnd: formData.get("periodEnd"),
    issueDate: formData.get("issueDate"),
    dueDate: formData.get("dueDate"),
    taxRatePct: formData.get("taxRatePct") || 0,
    notes: formData.get("notes") || undefined,
    lineItems: JSON.parse(String(formData.get("lineItemsJson") ?? "[]")),
  });

  const subtotal = parsed.lineItems.reduce((sum, li) => sum + li.quantity * li.unitPrice, 0);
  const tax = Math.round(subtotal * (parsed.taxRatePct / 100) * 100) / 100;
  const total = Math.round((subtotal + tax) * 100) / 100;

  const invoice = await prisma.invoice.create({
    data: {
      enterpriseAccountId: parsed.enterpriseAccountId,
      invoiceNumber: generateInvoiceNumber(),
      periodStart: new Date(parsed.periodStart),
      periodEnd: new Date(parsed.periodEnd),
      issueDate: new Date(parsed.issueDate),
      dueDate: new Date(parsed.dueDate),
      currency: parsed.currency,
      subtotal: Math.round(subtotal * 100) / 100,
      tax,
      total,
      notes: parsed.notes || null,
      lineItems: {
        create: parsed.lineItems.map((li) => ({
          description: li.description,
          category: li.category,
          quantity: li.quantity,
          unitPrice: li.unitPrice,
          amount: Math.round(li.quantity * li.unitPrice * 100) / 100,
        })),
      },
    },
  });

  revalidatePath("/ops/billing");
  redirect(`/ops/billing/${invoice.id}`);
}

export async function updateInvoiceStatus(invoiceId: string, returnPath: string, formData: FormData) {
  await requireInternalUser();
  const status = z.enum(INVOICE_STATUSES).parse(formData.get("status"));
  const invoice = await prisma.invoice.update({ where: { id: invoiceId }, data: { status } });

  if (status === "Sent") {
    await notifyEnterpriseAccountAdmins(invoice.enterpriseAccountId, {
      title: `Invoice ${invoice.invoiceNumber} issued`,
      body: `A new invoice for ${invoice.total} ${invoice.currency} is ready for review.`,
      category: "billing",
      linkUrl: `/portal/billing/${invoiceId}`,
    });
  }

  revalidatePath(returnPath);
}

export async function payInvoice(invoiceId: string, returnPath: string) {
  const user = await requireCustomerUser();
  const invoice = await prisma.invoice.findFirst({ where: { id: invoiceId, enterpriseAccountId: user.enterpriseAccountId } });
  if (!invoice) throw new Error("Invoice not found.");
  if (invoice.status !== "Sent" && invoice.status !== "Overdue") throw new Error("This invoice isn't awaiting payment.");

  await prisma.invoice.update({ where: { id: invoiceId }, data: { status: "Paid" } });
  revalidatePath(returnPath);
}
