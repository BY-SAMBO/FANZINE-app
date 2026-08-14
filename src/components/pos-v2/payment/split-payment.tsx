"use client";

import { Plus, X } from "lucide-react";
import type { PaymentMethod, SalePayment } from "@/types/pos-v2";
import { cn } from "@/lib/utils";

export const PAYMENT_METHODS: { value: PaymentMethod; label: string; short: string }[] = [
  { value: "cash", label: "Efectivo", short: "Efvo" },
  { value: "card", label: "Tarjeta", short: "Tarj" },
  { value: "nequi", label: "Nequi", short: "Nequi" },
  { value: "daviplata", label: "Daviplata", short: "Davi" },
  { value: "llaves", label: "Llaves", short: "Llav" },
];

export function paymentsSum(payments: SalePayment[]): number {
  return payments.reduce((s, p) => s + (p.amount || 0), 0);
}

export function paymentsAreValid(payments: SalePayment[], total: number): boolean {
  if (payments.length === 0) return false;
  if (payments.some((p) => !(p.amount > 0))) return false;
  return Math.round(paymentsSum(payments)) === Math.round(total);
}

interface SplitPaymentProps {
  total: number;
  payments: SalePayment[];
  onChange: (payments: SalePayment[]) => void;
  accent?: "red" | "green";
}

/**
 * Payment method selector with optional split mode.
 * Single mode (1 entry): tap a method, amount = total (same flow as before).
 * Split mode (2+ entries): each row has its own method + amount; the sum
 * must equal the total to enable the pay button (validated by the parent
 * via paymentsAreValid).
 */
export function SplitPayment({ total, payments, onChange, accent = "red" }: SplitPaymentProps) {
  const isSplit = payments.length > 1;
  const sum = paymentsSum(payments);
  const remaining = total - sum;

  const activeClass =
    accent === "green"
      ? "bg-green-600 text-white border-green-600"
      : "bg-red-600 text-white border-red-600";
  const linkClass =
    accent === "green"
      ? "text-green-700 hover:text-green-800"
      : "text-red-600 hover:text-red-700";

  const setRow = (idx: number, patch: Partial<SalePayment>) => {
    onChange(payments.map((p, i) => (i === idx ? { ...p, ...patch } : p)));
  };

  const addRow = () => {
    // Prefill the new row with whatever is missing to reach the total
    const firstUnused = PAYMENT_METHODS.find(
      (pm) => !payments.some((p) => p.method === pm.value)
    );
    onChange([
      ...payments,
      {
        method: firstUnused?.value ?? "cash",
        amount: Math.max(0, remaining),
      },
    ]);
  };

  const removeRow = (idx: number) => {
    const next = payments.filter((_, i) => i !== idx);
    if (next.length === 1) {
      // Back to single mode: the one method covers the full total
      onChange([{ method: next[0].method, amount: total }]);
    } else {
      onChange(next);
    }
  };

  if (!isSplit) {
    const method = payments[0]?.method ?? "cash";
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-gray-400 text-xs uppercase tracking-wider">Metodo de pago</p>
          <button
            type="button"
            onClick={() => {
              // Enter split mode: first method keeps everything, second starts at 0
              const firstUnused = PAYMENT_METHODS.find((pm) => pm.value !== method);
              onChange([
                { method, amount: total },
                { method: firstUnused?.value ?? "nequi", amount: 0 },
              ]);
            }}
            className={cn("text-xs font-semibold transition-colors", linkClass)}
          >
            Dividir pago
          </button>
        </div>
        <div className="flex gap-2">
          {PAYMENT_METHODS.map((pm) => (
            <button
              key={pm.value}
              type="button"
              onClick={() => onChange([{ method: pm.value, amount: total }])}
              className={cn(
                "flex-1 py-3 text-sm font-bold uppercase tracking-wider border-2 transition-all rounded-lg",
                method === pm.value
                  ? activeClass
                  : "text-gray-500 border-gray-200 hover:border-gray-400"
              )}
            >
              {pm.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-gray-400 text-xs uppercase tracking-wider">Pago dividido</p>
        <button
          type="button"
          onClick={() => onChange([{ method: payments[0].method, amount: total }])}
          className={cn("text-xs font-semibold transition-colors", linkClass)}
        >
          Un solo pago
        </button>
      </div>

      <div className="space-y-2">
        {payments.map((payment, idx) => (
          <div key={idx} className="flex items-center gap-1.5">
            <div className="flex gap-1 flex-1">
              {PAYMENT_METHODS.map((pm) => (
                <button
                  key={pm.value}
                  type="button"
                  onClick={() => setRow(idx, { method: pm.value })}
                  className={cn(
                    "flex-1 py-2 text-[10px] font-bold uppercase tracking-wider border-2 transition-all rounded-md",
                    payment.method === pm.value
                      ? activeClass
                      : "text-gray-500 border-gray-200 hover:border-gray-400"
                  )}
                >
                  {pm.short}
                </button>
              ))}
            </div>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={payment.amount === 0 ? "" : payment.amount}
              placeholder="0"
              onChange={(e) => setRow(idx, { amount: Number(e.target.value) || 0 })}
              className="w-24 py-2 px-2 text-sm font-bold text-right tabular-nums border-2 border-gray-200 rounded-md focus:border-gray-400 focus:outline-none"
            />
            {payments.length > 2 && (
              <button
                type="button"
                onClick={() => removeRow(idx)}
                className="p-1 text-gray-300 hover:text-red-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        {payments.length < PAYMENT_METHODS.length ? (
          <button
            type="button"
            onClick={addRow}
            className={cn(
              "flex items-center gap-1 text-xs font-semibold transition-colors",
              linkClass
            )}
          >
            <Plus className="w-3.5 h-3.5" />
            Otro metodo
          </button>
        ) : (
          <span />
        )}
        {remaining !== 0 ? (
          <span
            className={cn(
              "text-xs font-bold tabular-nums",
              remaining > 0 ? "text-orange-600" : "text-red-600"
            )}
          >
            {remaining > 0
              ? `Falta $${remaining.toLocaleString()}`
              : `Sobra $${Math.abs(remaining).toLocaleString()}`}
          </span>
        ) : (
          <span className="text-xs font-bold text-green-600">Completo ✓</span>
        )}
      </div>
    </div>
  );
}
