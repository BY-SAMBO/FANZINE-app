"use client";

import { ProductCard } from "./product-card";
import type { Product } from "@/types/product";

interface ProductGridProps {
  products: (Product & { categoria?: { nombre: string; slug: string } })[];
}

export function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-black/40 font-bold uppercase tracking-wide">
        No se encontraron productos
      </div>
    );
  }

  return (
    <div className="grid gap-5 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
