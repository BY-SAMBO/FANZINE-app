"use client";

import type { PosProduct } from "@/types/pos";
import { cn } from "@/lib/utils";

interface BebidasBoardProps {
  products: PosProduct[];
  onSelect: (product: PosProduct) => void;
}

type Group = "cooldrink" | "cocacola" | "otras";

interface GroupConfig {
  key: Group;
  label: string;
  accent: string;
}

const GROUPS: GroupConfig[] = [
  { key: "cooldrink", label: "CoolDrink", accent: "text-teal-700" },
  { key: "cocacola", label: "Coca-Cola", accent: "text-red-700" },
  { key: "otras", label: "Otras Bebidas", accent: "text-gray-500" },
];

// Color per fruit flavor
const FRUIT_COLORS: Record<string, { bg: string; border: string; hover: string }> = {
  granada:      { bg: "bg-rose-50",   border: "border-rose-200",   hover: "hover:border-rose-400" },
  kiwi:         { bg: "bg-lime-50",   border: "border-lime-200",   hover: "hover:border-lime-400" },
  mangostino:   { bg: "bg-purple-50", border: "border-purple-200", hover: "hover:border-purple-400" },
  "manzana verde": { bg: "bg-green-50",  border: "border-green-200",  hover: "hover:border-green-400" },
  maracuya:     { bg: "bg-amber-50",  border: "border-amber-200",  hover: "hover:border-amber-400" },
};

const DEFAULT_COOLDRINK = { bg: "bg-teal-50", border: "border-teal-200", hover: "hover:border-teal-400" };
const COCACOLA_STYLE = { bg: "bg-red-50", border: "border-red-200", hover: "hover:border-red-400" };
const OTRAS_STYLE = { bg: "bg-white", border: "border-gray-200", hover: "hover:border-gray-400" };

function classify(name: string): Group {
  const lower = name.toLowerCase();
  if (lower.includes("cooldrink") || lower.includes("cool drink")) return "cooldrink";
  if (lower.includes("coca")) return "cocacola";
  return "otras";
}

function getCooldrinkFruit(name: string): string | null {
  const lower = name.toLowerCase();
  for (const fruit of Object.keys(FRUIT_COLORS)) {
    if (lower.includes(fruit)) return fruit;
  }
  return null;
}

function getStyle(product: PosProduct, group: Group) {
  if (group === "cooldrink") {
    const fruit = getCooldrinkFruit(product.nombre);
    return fruit ? FRUIT_COLORS[fruit] : DEFAULT_COOLDRINK;
  }
  if (group === "cocacola") return COCACOLA_STYLE;
  return OTRAS_STYLE;
}

function getDisplayName(name: string, group: Group): string {
  if (group === "cooldrink") {
    // "CoolDrink Maracuya" -> "Maracuyá", "COOL DRINK" -> "Original"
    const cleaned = name.replace(/cool\s?drink\s*/i, "").trim();
    return cleaned || "Original";
  }
  return name;
}

export function BebidasBoard({ products, onSelect }: BebidasBoardProps) {
  const grouped: Record<Group, PosProduct[]> = { cooldrink: [], cocacola: [], otras: [] };

  for (const p of products) {
    grouped[classify(p.nombre)].push(p);
  }

  return (
    <div className="space-y-4">
      {GROUPS.map((group) => {
        const items = grouped[group.key];
        if (items.length === 0) return null;

        return (
          <div key={group.key}>
            <p className={cn("text-xs font-extrabold uppercase tracking-wider mb-2", group.accent)}>
              {group.label}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {items.map((p) => {
                const style = getStyle(p, group.key);
                return (
                  <button
                    key={p.id}
                    onClick={() => onSelect(p)}
                    className={cn(
                      "flex flex-col items-center justify-center py-3 rounded-xl border-2 transition-all active:scale-95",
                      style.bg, style.border, style.hover
                    )}
                  >
                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider text-center px-1">
                      {getDisplayName(p.nombre, group.key)}
                    </span>
                    <span className="text-lg font-extrabold text-gray-900 tabular-nums">
                      ${(p.precio_venta ?? 0).toLocaleString()}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
