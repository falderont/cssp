
/**
 * Read-only surface over the provider's external billing system (typically
 * NetSuite + Stripe, per docs/prd-v5.md Section 2/3 research) — CSSP never
 * generates, taxes, or reconciles invoices. The mock here stands in for what
 * a periodic sync job (Stripe Connector for NetSuite, an iPaaS flow, etc.)
 * would write into our `Invoice`/`InvoiceLineItem` tables; the customer-facing
 * pages then just read those tables with normal tenant-scoped Prisma queries,
 * the same as any other CSSP-native data.
 */
export type MockInvoiceLineItemInput = {
  description: string;
  category: "RECURRING" | "REMOTE_HANDS" | "ONE_TIME" | "OTHER";
  quantity: number;
  unitAmount: number;
};

export type MockInvoiceInput = {
  periodStart: Date;
  periodEnd: Date;
  status: "DRAFT" | "ISSUED" | "PAID" | "OVERDUE";
  currency: string;
  issuedAt: Date | null;
  dueAt: Date | null;
  externalRef: string;
  lineItems: MockInvoiceLineItemInput[];
};

export interface BillingAdapter {
  generateMonthlyInvoice(monthsAgo: number, recurringAmountCents: number): MockInvoiceInput;
}

export class MockBillingAdapter implements BillingAdapter {
  generateMonthlyInvoice(monthsAgo: number, recurringAmountCents: number): MockInvoiceInput {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() - monthsAgo + 1, 0);
    const isCurrent = monthsAgo === 0;
    const issuedAt = isCurrent ? null : new Date(periodEnd.getTime() + 2 * 24 * 60 * 60 * 1000);
    const dueAt = issuedAt ? new Date(issuedAt.getTime() + 30 * 24 * 60 * 60 * 1000) : null;
    const status: MockInvoiceInput["status"] = isCurrent ? "DRAFT" : monthsAgo === 1 ? "ISSUED" : "PAID";

    return {
      periodStart,
      periodEnd,
      status,
      currency: "USD",
      issuedAt,
      dueAt,
      externalRef: `NS-INV-${periodStart.getFullYear()}${String(periodStart.getMonth() + 1).padStart(2, "0")}`,
      lineItems: [
        {
          description: "Colocation — recurring service fee",
          category: "RECURRING",
          quantity: 1,
          unitAmount: recurringAmountCents,
        },
      ],
    };
  }
}

export const billingAdapter: BillingAdapter = new MockBillingAdapter();
