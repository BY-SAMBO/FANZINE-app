"use client";

import { useState, useMemo } from "react";
import { useProducts } from "@/lib/hooks/use-products";
import { ProductGrid } from "@/components/products/product-grid";
import { ProductSearch } from "@/components/products/product-search";
import { CategoryFilter } from "@/components/products/category-filter";
import { Badge } from "@/components/ui/badge";

export default function ProductosPage() {
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string | undefined>();

  const { data: products, isLoading, isError } = useProducts({
    categoria_id: categoryId,
  });

  const filtered = useMemo(() => {
    if (!products) return [];
    if (!search) return products;
    const q = search.toLowerCase();
    return products.filter(
      (p) =>
        p.nombre.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q)
    );
  }, [products, search]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Productos</h1>
          {products && (
            <Badge variant="secondary">{products.length}</Badge>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        <ProductSearch value={search} onChange={setSearch} />
        <CategoryFilter selected={categoryId} onChange={setCategoryId} />
      </div>

      {/* Grid */}
      {isError ? (
        <div className="flex h-40 items-center justify-center text-destructive">
          Error cargando productos. Recarga la pagina para intentar de nuevo.
        </div>
      ) : isLoading ? (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[3/4] animate-pulse rounded-lg bg-muted"
            />
          ))}
        </div>
      ) : (
        <ProductGrid products={filtered} />
      )}
    </div>
  );
}
