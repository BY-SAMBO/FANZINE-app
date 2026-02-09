"use client";

import { cn } from "@/lib/utils";
import type { PosProduct } from "@/types/pos";

interface ProductButtonProps {
  product: PosProduct;
  onSelect: (product: PosProduct) => void;
}

export function ProductButton({ product, onSelect }: ProductButtonProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(product)}
      className={cn(
        "flex flex-col items-start justify-between gap-1 rounded-lg border-2 border-white/10 bg-white/5 p-3 text-left transition-all",
        "hover:border-white/30 hover:bg-white/10 active:scale-95",
        "min-h-[90px]"
      )}
    >
      <span className="text-sm font-bold text-white leading-tight line-clamp-2">
        {product.nombre}
      </span>
      <div className="flex w-full items-center justify-between">
        <span className="text-white/70 text-sm font-medium">
          ${(product.precio_venta ?? 0).toLocaleString()}
        </span>
        {product.has_modifiers && (
          <span className="text-[10px] font-bold uppercase tracking-wider bg-[#FDE047] text-black px-1.5 py-0.5 rounded">
            Mod
          </span>
        )}
      </div>
    </button>
  );
}
