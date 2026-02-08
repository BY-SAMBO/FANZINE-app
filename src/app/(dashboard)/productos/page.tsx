"use client";

import { useState, useMemo, useDeferredValue } from "react";
import { useProducts } from "@/lib/hooks/use-products";
import { ProductGrid } from "@/components/products/product-grid";
import { ProductSearch } from "@/components/products/product-search";
import { CategoryFilter } from "@/components/products/category-filter";

export default function ProductosPage() {
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [categoryId, setCategoryId] = useState<string | undefined>();

  const filters = useMemo(
    () => ({
      ...(categoryId ? { categoria_id: categoryId } : {}),
      ...(deferredSearch ? { search: deferredSearch } : {}),
    }),
    [categoryId, deferredSearch]
  );

  const { data: products, isLoading, isFetching, isError } = useProducts(
    Object.keys(filters).length > 0 ? filters : undefined
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold uppercase tracking-tight">
            PRODUCTOS
          </h1>
          {products && (
            <span className="bg-[#FDE047] border-2 border-black px-2 py-0.5 text-xs font-bold">
              {products.length}
            </span>
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
        <div className="flex h-40 items-center justify-center text-[#DC2626] font-bold uppercase">
          Error cargando productos. Recarga la pagina para intentar de nuevo.
        </div>
      ) : isLoading ? (
        <div className="grid gap-5 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[3/4] animate-pulse bg-black/5 border-2 border-black/10"
            />
          ))}
        </div>
      ) : (
        <div className={isFetching ? "opacity-60 transition-opacity" : ""}>
          <ProductGrid products={products ?? []} />
        </div>
      )}
    </div>
  );
}
