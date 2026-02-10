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
      className="product-card flex flex-col items-start p-3 lg:p-4 rounded-xl border border-gray-200 bg-white hover:border-red-600/40 hover:shadow-md min-h-[88px] lg:min-h-[110px] text-left relative overflow-hidden"
    >
      <span className="text-sm lg:text-base font-extrabold text-gray-900 leading-tight line-clamp-2">
        {product.nombre}
      </span>
      <span className="mt-auto text-red-600 font-extrabold text-lg lg:text-xl">
        ${(product.precio_venta ?? 0).toLocaleString()}
      </span>
      {product.has_modifiers && (
        <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-amber-400" />
      )}
    </button>
  );
}
