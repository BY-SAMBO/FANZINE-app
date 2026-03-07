"use client";

import type { PosProduct } from "@/types/pos-v2";
import { cn } from "@/lib/utils";

// ============================================================
// Crispetas Board
// ============================================================

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

function classifyCrispeta(name: string): { flavor: Flavor; size: Size } | null {
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

interface BoardProps {
  products: PosProduct[];
  onSelect: (product: PosProduct) => void;
}

export function CrispetasBoard({ products, onSelect }: BoardProps) {
  const grid = new Map<string, PosProduct>();
  const others: PosProduct[] = [];

  for (const p of products) {
    const cls = classifyCrispeta(p.nombre);
    if (cls) {
      grid.set(`${cls.flavor}-${cls.size}`, p);
    } else {
      others.push(p);
    }
  }

  return (
    <div className="space-y-4">
      {FLAVORS.map((flavor) => (
        <div key={flavor.key}>
          <p className={cn("text-xs font-extrabold uppercase tracking-wider mb-2", flavor.accent)}>
            {flavor.label}
          </p>
          <div className="grid grid-cols-3 gap-2">
            {SIZES.map((size) => {
              const product = grid.get(`${flavor.key}-${size.key}`);
              if (!product) return <div key={size.key} />;
              return (
                <button
                  key={size.key}
                  onClick={() => onSelect(product)}
                  className={cn(
                    "flex flex-col items-center justify-center py-3 rounded-xl border-2 transition-all active:scale-95",
                    flavor.bg, flavor.border, flavor.hoverBorder
                  )}
                >
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    {size.label}
                  </span>
                  <span className="text-lg font-extrabold text-gray-900 tabular-nums">
                    ${(product.precio_venta ?? 0).toLocaleString()}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {others.length > 0 && (
        <div>
          <p className="text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-2">Otros</p>
          <div className="grid grid-cols-3 gap-2">
            {others.map((p) => (
              <button
                key={p.id}
                onClick={() => onSelect(p)}
                className="flex flex-col items-center justify-center py-3 rounded-xl border-2 border-gray-200 bg-white hover:border-gray-400 transition-all active:scale-95"
              >
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  {p.nombre}
                </span>
                <span className="text-lg font-extrabold text-gray-900 tabular-nums">
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

// ============================================================
// Bebidas Board
// ============================================================

type DrinkGroup = "cooldrink" | "cocacola" | "otras";

const DRINK_GROUPS: { key: DrinkGroup; label: string; accent: string }[] = [
  { key: "cooldrink", label: "CoolDrink", accent: "text-teal-700" },
  { key: "cocacola", label: "Coca-Cola", accent: "text-red-700" },
  { key: "otras", label: "Otras Bebidas", accent: "text-gray-500" },
];

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

function classifyDrink(name: string): DrinkGroup {
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

function getDrinkStyle(product: PosProduct, group: DrinkGroup) {
  if (group === "cooldrink") {
    const fruit = getCooldrinkFruit(product.nombre);
    return fruit ? FRUIT_COLORS[fruit] : DEFAULT_COOLDRINK;
  }
  if (group === "cocacola") return COCACOLA_STYLE;
  return OTRAS_STYLE;
}

function getDrinkDisplayName(name: string, group: DrinkGroup): string {
  if (group === "cooldrink") {
    const cleaned = name.replace(/cool\s?drink\s*/i, "").trim();
    return cleaned || "Original";
  }
  return name;
}

export function BebidasBoard({ products, onSelect }: BoardProps) {
  const grouped: Record<DrinkGroup, PosProduct[]> = { cooldrink: [], cocacola: [], otras: [] };

  for (const p of products) {
    grouped[classifyDrink(p.nombre)].push(p);
  }

  return (
    <div className="space-y-4">
      {DRINK_GROUPS.map((group) => {
        const items = grouped[group.key];
        if (items.length === 0) return null;

        return (
          <div key={group.key}>
            <p className={cn("text-xs font-extrabold uppercase tracking-wider mb-2", group.accent)}>
              {group.label}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {items.map((p) => {
                const style = getDrinkStyle(p, group.key);
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
                      {getDrinkDisplayName(p.nombre, group.key)}
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

// ============================================================
// Helados Board
// ============================================================

type HeladoGroup = "conos" | "galletas" | "especiales" | "adicionales";

const HELADO_GROUPS: { key: HeladoGroup; label: string; accent: string; bg: string; border: string; hover: string }[] = [
  { key: "conos", label: "Conos", accent: "text-sky-700", bg: "bg-sky-50", border: "border-sky-200", hover: "hover:border-sky-400" },
  { key: "galletas", label: "Galletas", accent: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200", hover: "hover:border-amber-400" },
  { key: "especiales", label: "Especiales", accent: "text-purple-700", bg: "bg-purple-50", border: "border-purple-200", hover: "hover:border-purple-400" },
  { key: "adicionales", label: "Adicionales", accent: "text-gray-500", bg: "bg-gray-50", border: "border-gray-200", hover: "hover:border-gray-400" },
];

function classifyHelado(name: string): HeladoGroup {
  const lower = name.toLowerCase();
  if (lower.includes("cono")) return "conos";
  if (lower.includes("galleta")) return "galletas";
  if (lower.includes("sandwich") || lower.includes("sundae")) return "especiales";
  return "adicionales";
}

function getHeladoDisplayName(name: string): string {
  return name
    .replace(/^cono\s*/i, "")
    .replace(/^galleta\s*/i, "")
    .replace(/^sandwich\s+de\s+/i, "Sandwich ")
    .replace(/^cubierta\s+galleta\s*/i, "")
    .trim() || name;
}

export function HeladosBoard({ products, onSelect }: BoardProps) {
  const grouped: Record<HeladoGroup, PosProduct[]> = { conos: [], galletas: [], especiales: [], adicionales: [] };

  for (const p of products) {
    grouped[classifyHelado(p.nombre)].push(p);
  }

  return (
    <div className="space-y-4">
      {HELADO_GROUPS.map((group) => {
        const items = grouped[group.key];
        if (items.length === 0) return null;

        return (
          <div key={group.key}>
            <p className={cn("text-xs font-extrabold uppercase tracking-wider mb-2", group.accent)}>
              {group.label}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {items.map((p) => (
                <button
                  key={p.id}
                  onClick={() => onSelect(p)}
                  className={cn(
                    "flex flex-col items-center justify-center py-3 rounded-xl border-2 transition-all active:scale-95",
                    group.bg, group.border, group.hover
                  )}
                >
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider text-center px-1">
                    {getHeladoDisplayName(p.nombre)}
                  </span>
                  <span className="text-lg font-extrabold text-gray-900 tabular-nums">
                    ${(p.precio_venta ?? 0).toLocaleString()}
                  </span>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// Tex-Mex Board (unified: Tacos + Nachos + Chicanitas + Tex-Mex)
// ============================================================

type TexMexGroup = "tacos" | "nachos" | "chicanitas" | "alitas" | "salsas" | "otros";

const TEXMEX_GROUPS: { key: TexMexGroup; label: string; accent: string; bg: string; border: string; hover: string }[] = [
  { key: "tacos", label: "Tacos", accent: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200", hover: "hover:border-orange-400" },
  { key: "nachos", label: "Nachos", accent: "text-yellow-700", bg: "bg-yellow-50", border: "border-yellow-200", hover: "hover:border-yellow-400" },
  { key: "chicanitas", label: "Chicanitas & Snacks", accent: "text-lime-700", bg: "bg-lime-50", border: "border-lime-200", hover: "hover:border-lime-400" },
  { key: "alitas", label: "Alitas & Más", accent: "text-red-700", bg: "bg-red-50", border: "border-red-200", hover: "hover:border-red-400" },
  { key: "salsas", label: "Salsas", accent: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", hover: "hover:border-emerald-400" },
  { key: "otros", label: "Otros", accent: "text-gray-500", bg: "bg-white", border: "border-gray-200", hover: "hover:border-gray-400" },
];

function classifyTexMex(name: string): TexMexGroup {
  const lower = name.toLowerCase();
  if (lower.includes("taco")) return "tacos";
  if (lower.includes("nacho") || lower.includes("salchinacho")) return "nachos";
  if (lower.includes("chicanita")) return "chicanitas";
  if (lower.includes("alita") || lower.includes("bbq") || lower.includes("popcorn") || lower.includes("macarron")) return "alitas";
  if (lower.includes("salsa")) return "salsas";
  return "otros";
}

function getTexMexDisplayName(name: string): string {
  return name
    .replace(/^tacos?\s+de\s+/i, "")
    .replace(/^tacos?\s+/i, "")
    .replace(/^nachos?\s+/i, "")
    .replace(/^chicanita\s+de\s+/i, "")
    .replace(/^chicanita\s+/i, "")
    .replace(/^salsa\s+/i, "")
    .replace(/\s*\(1\s*ud\)\s*/i, "")
    .trim() || name;
}

export function TexMexBoard({ products, onSelect }: BoardProps) {
  const grouped: Record<TexMexGroup, PosProduct[]> = { tacos: [], nachos: [], chicanitas: [], alitas: [], salsas: [], otros: [] };

  for (const p of products) {
    grouped[classifyTexMex(p.nombre)].push(p);
  }

  return (
    <div className="space-y-4">
      {TEXMEX_GROUPS.map((group) => {
        const items = grouped[group.key];
        if (items.length === 0) return null;

        return (
          <div key={group.key}>
            <p className={cn("text-xs font-extrabold uppercase tracking-wider mb-2", group.accent)}>
              {group.label}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {items.map((p) => (
                <button
                  key={p.id}
                  onClick={() => onSelect(p)}
                  className={cn(
                    "flex flex-col items-center justify-center py-3 rounded-xl border-2 transition-all active:scale-95",
                    group.bg, group.border, group.hover
                  )}
                >
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider text-center px-1">
                    {getTexMexDisplayName(p.nombre)}
                  </span>
                  <span className="text-lg font-extrabold text-gray-900 tabular-nums">
                    ${(p.precio_venta ?? 0).toLocaleString()}
                  </span>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
