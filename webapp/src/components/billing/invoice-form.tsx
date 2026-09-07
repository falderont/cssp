"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { createInvoice } from "@/actions/billing";
import { INVOICE_LINE_CATEGORIES } from "@/lib/constants";
import { humanize } from "@/lib/utils";

type Row = { description: string; category: string; quantity: string; unitPrice: string };
const EMPTY_ROW: Row = { description: "", category: "Space", quantity: "1", unitPrice: "0" };

export function InvoiceForm({ accounts }: { accounts: { id: string; name: string }[] }) {
  const [currency, setCurrency] = useState("USD");
  const [taxRatePct, setTaxRatePct] = useState("0");
  const [rows, setRows] = useState<Row[]>([{ ...EMPTY_ROW }]);

  function updateRow(idx: number, patch: Partial<Row>) {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  }

  const subtotal = useMemo(
    () => rows.reduce((sum, r) => sum + (Number(r.quantity) || 0) * (Number(r.unitPrice) || 0), 0),
    [rows]
  );
  const tax = subtotal * ((Number(taxRatePct) || 0) / 100);
  const total = subtotal + tax;

  return (
    <form action={createInvoice} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Tenant" htmlFor="enterpriseAccountId" required>
          <Select id="enterpriseAccountId" name="enterpriseAccountId" required>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Currency" htmlFor="currency" required>
          <Select id="currency" name="currency" value={currency} onChange={(e) => setCurrency(e.target.value)} required>
            <option value="USD">USD</option>
            <option value="IDR">IDR</option>
            <option value="SGD">SGD</option>
          </Select>
        </Field>
        <Field label="Tax rate (%)" htmlFor="taxRatePct">
          <Input
            id="taxRatePct"
            name="taxRatePct"
            type="number"
            min={0}
            max={100}
            value={taxRatePct}
            onChange={(e) => setTaxRatePct(e.target.value)}
          />
        </Field>
        <Field label="Billing period start" htmlFor="periodStart" required>
          <Input id="periodStart" name="periodStart" type="date" required />
        </Field>
        <Field label="Billing period end" htmlFor="periodEnd" required>
          <Input id="periodEnd" name="periodEnd" type="date" required />
        </Field>
        <Field label="Issue date" htmlFor="issueDate" required>
          <Input id="issueDate" name="issueDate" type="date" required />
        </Field>
        <Field label="Due date" htmlFor="dueDate" required>
          <Input id="dueDate" name="dueDate" type="date" required />
        </Field>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-medium text-slate-700">Line items</p>
          <Button type="button" variant="secondary" size="sm" onClick={() => setRows((r) => [...r, { ...EMPTY_ROW }])}>
            <Plus className="h-3.5 w-3.5" /> Add line
          </Button>
        </div>
        <div className="space-y-2">
          {rows.map((row, idx) => (
            <div key={idx} className="grid grid-cols-1 gap-2 rounded-lg border border-slate-200 p-3 sm:grid-cols-12 sm:items-center">
              <Input
                placeholder="Description"
                required
                value={row.description}
                onChange={(e) => updateRow(idx, { description: e.target.value })}
                className="sm:col-span-4"
              />
              <Select value={row.category} onChange={(e) => updateRow(idx, { category: e.target.value })} className="sm:col-span-2">
                {INVOICE_LINE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {humanize(c)}
                  </option>
                ))}
              </Select>
              <Input
                type="number"
                min={0.01}
                step="0.01"
                placeholder="Qty"
                required
                value={row.quantity}
                onChange={(e) => updateRow(idx, { quantity: e.target.value })}
                className="sm:col-span-2"
              />
              <Input
                type="number"
                min={0}
                step="0.01"
                placeholder="Unit price"
                required
                value={row.unitPrice}
                onChange={(e) => updateRow(idx, { unitPrice: e.target.value })}
                className="sm:col-span-2"
              />
              <p className="text-sm text-slate-500 sm:col-span-1">
                {((Number(row.quantity) || 0) * (Number(row.unitPrice) || 0)).toFixed(2)}
              </p>
              {rows.length > 1 && (
                <button
                  type="button"
                  onClick={() => setRows((r) => r.filter((_, i) => i !== idx))}
                  className="justify-self-end rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 sm:col-span-1"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
        <div className="mt-3 ml-auto max-w-xs space-y-1 text-sm">
          <div className="flex justify-between text-slate-500">
            <span>Subtotal</span>
            <span>
              {currency} {subtotal.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-slate-500">
            <span>Tax</span>
            <span>
              {currency} {tax.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between font-semibold text-slate-900">
            <span>Total</span>
            <span>
              {currency} {total.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      <Field label="Notes (optional)" htmlFor="notes">
        <Textarea id="notes" name="notes" placeholder="Payment instructions, PO reference, etc." />
      </Field>

      <input
        type="hidden"
        name="lineItemsJson"
        value={JSON.stringify(rows.map((r) => ({ ...r, quantity: Number(r.quantity) || 1, unitPrice: Number(r.unitPrice) || 0 })))}
      />
      <Button type="submit">Create invoice</Button>
    </form>
  );
}
