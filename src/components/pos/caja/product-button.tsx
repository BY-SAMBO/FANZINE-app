"use client";

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
      className="product-card flex flex-col items-start p-4 rounded-xl border border-gray-200 bg-white hover:border-red-600/40 hover:shadow-md min-h-[110px] text-left relative"
    >
      {product.has_modifiers && (
        <span className="absolute top-2 right-2 text-[9px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
          +Mod
        </span>
      )}
      <span className="text-base font-extrabold text-gray-900 leading-tight line-clamp-2">
        {product.nombre}
      </span>
      <span className="mt-auto text-red-600 font-extrabold text-xl">
        ${(product.precio_venta ?? 0).toLocaleString()}
      </span>
    </button>
  );
}
