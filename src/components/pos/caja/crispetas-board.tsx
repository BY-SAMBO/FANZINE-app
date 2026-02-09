"use client";

import type { PosProduct } from "@/types/pos";
import { cn } from "@/lib/utils";

interface CrispetasBoardProps {
  products: PosProduct[];
  onSelect: (product: PosProduct) => void;
}

type Flavor = "sal" | "caramelo" | "mixtas";
type Size = "personal" | "mediana" | "familiar";

const FLAVORS: { key: Flavor; label: string; accent: string; bg: string; border: string; hoverBorder: string }[] = [
  { key: "sal", label: "Saladas", accent: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200", hoverBorder: "hover:border-amber-400" },
  { key: "mixtas", label: "Mixtas", accent: "text-purple-700", bg: "bg-purple-50", border: "border-purple-200", hoverBorder: "hover:border-purple-400" },
  { key: "caramelo", label: "Dulces", accent: "text-pink-700", bg: "bg-pink-50", border: "border-pink-200", hoverBorder: "hover:border-pink-400" },
];

const SIZES: { key: Size; label: string }[] = [
  { key: "personal", label: "Personal" },
  { key: "mediana", label: "Mediana" },
  { key: "familiar", label: "Familiar" },
];

function classify(name: string): { flavor: Flavor; size: Size } | null {
  const lower = name.toLowerCase();
  const flavor: Flavor | null =
    lower.includes("sal") && !lower.includes("caramelo") ? "sal" :
    lower.includes("caramelo") ? "caramelo" :
    lower.includes("mixta") ? "mixtas" : null;
  const size: Size | null =
    lower.includes("personal") ? "personal" :
    lower.includes("mediana") ? "mediana" :
    lower.includes("familiar") ? "familiar" : null;
  if (!flavor || !size) return null;
  return { flavor, size };
}

export function CrispetasBoard({ products, onSelect }: CrispetasBoardProps) {
  const grid = new Map<string, PosProduct>();
  const others: PosProduct[] = [];

  for (const p of products) {
    const cls = classify(p.nombre);
    if (cls) {
      grid.set(`${cls.flavor}-${cls.size}`, p);
    } else {
      others.push(p);
    }
  }

  return (
    <div className="space-y-5">
      {FLAVORS.map((flavor) => (
        <div key={flavor.key} className="space-y-2">
          {/* Flavor label */}
          <p className={cn("text-sm font-extrabold uppercase tracking-wider", flavor.accent)}>
            {flavor.label}
          </p>

          {/* Size buttons row */}
          <div className="flex gap-3">
            {SIZES.map((size) => {
              const product = grid.get(`${flavor.key}-${size.key}`);
              if (!product) return null;
              return (
                <button
                  key={size.key}
                  onClick={() => onSelect(product)}
                  className={cn(
                    "flex-1 flex items-center justify-between px-5 py-4 rounded-xl border-2 transition-all active:scale-95",
                    flavor.bg, flavor.border, flavor.hoverBorder
                  )}
                >
                  <span className="text-sm font-extrabold text-gray-900">{size.label}</span>
                  <span className="text-xl font-extrabold text-gray-900 tabular-nums">
                    ${(product.precio_venta ?? 0).toLocaleString()}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Others (Minipancakes, etc.) */}
      {others.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-extrabold text-gray-400 uppercase tracking-wider">Otros</p>
          <div className="flex gap-3">
            {others.map((p) => (
              <button
                key={p.id}
                onClick={() => onSelect(p)}
                className="flex-1 flex items-center justify-between px-5 py-4 rounded-xl border-2 border-gray-200 bg-white hover:border-gray-400 transition-all active:scale-95"
              >
                <span className="text-sm font-extrabold text-gray-900">{p.nombre}</span>
                <span className="text-xl font-extrabold text-gray-900 tabular-nums">
                  ${(p.precio_venta ?? 0).toLocaleString()}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
