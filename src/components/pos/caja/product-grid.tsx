"use client";

import type { PosProduct } from "@/types/pos";
import { ProductButton } from "./product-button";

interface ProductGridProps {
  products: PosProduct[];
  onSelect: (product: PosProduct) => void;
}

export function ProductGrid({ products, onSelect }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
        No hay productos en esta categoria
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5">
      {products.map((product) => (
        <ProductButton
          key={product.id}
          product={product}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
