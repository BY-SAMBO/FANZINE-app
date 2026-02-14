"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { usePosProducts, useProductModifiers, useSyncModifiers } from "@/lib/hooks/use-remote-pos";
import { useRemotePosStore } from "@/lib/stores/remote-pos-store";
import { Search } from "lucide-react";
import { useCategories } from "@/lib/hooks/use-products";
import { CategorySidebar, FAVORITES_ID } from "@/components/pos/caja/category-sidebar";
import { ProductGrid } from "@/components/pos/caja/product-grid";
import { ToppingPanelBares } from "@/components/pos/bares/topping-panel-bares";
import { RemoteOrderPanel } from "@/components/pos/bares/remote-order-panel";
import { CrispetasBoard } from "@/components/pos/caja/crispetas-board";
import { BebidasBoard } from "@/components/pos/caja/bebidas-board";
import type { PosProduct } from "@/types/pos";

export default function BaresPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(FAVORITES_ID);
  const [searchQuery, setSearchQuery] = useState("");
  const [pendingModifierProduct, setPendingModifierProduct] = useState<string | null>(null);

  const { data: products, isLoading: productsLoading, refetch: refetchProducts } = usePosProducts();
  const syncModifiers = useSyncModifiers();
  const { data: categories } = useCategories();
  const { data: modifierGroups } = useProductModifiers(pendingModifierProduct);
  const order = useRemotePosStore((s) => s.order);
  const addItem = useRemotePosStore((s) => s.addItem);
  const startToppingSelection = useRemotePosStore((s) => s.startToppingSelection);
  const toppingSelection = useRemotePosStore((s) => s.toppingSelection);

  // When modifier data loads, start topping selection
  useEffect(() => {
    if (modifierGroups && modifierGroups.length > 0 && pendingModifierProduct) {
      const product = products?.find((p) => p.fudo_id === pendingModifierProduct);
      if (product) {
        startToppingSelection(
          product.id,
          product.nombre,
          product.fudo_id,
          modifierGroups
        );
      }
      setPendingModifierProduct(null);
    }
  }, [modifierGroups, pendingModifierProduct, products, startToppingSelection]);

  // Product counts by category
  const productCounts = useMemo(() => {
    if (!products) return {};
    return products.reduce((acc, p) => {
      const catId = p.categoria_id || "uncategorized";
      acc[catId] = (acc[catId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [products]);

  const favoritesCount = useMemo(() => {
    return products?.filter((p) => p.favorito).length ?? 0;
  }, [products]);

  // Filter products
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    let result = products;
    if (selectedCategory === FAVORITES_ID) {
      result = result.filter((p) => p.favorito);
    } else if (selectedCategory) {
      result = result.filter((p) => p.categoria_id === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((p) => p.nombre.toLowerCase().includes(q));
    }
    return result;
  }, [products, selectedCategory, searchQuery]);

  // Special category views
  const crispetasCategoryId = useMemo(() => {
    return categories?.find((c) => c.nombre.toLowerCase() === "crispetas")?.id ?? null;
  }, [categories]);

  const bebidasCategoryId = useMemo(() => {
    return categories?.find((c) => c.nombre.toLowerCase() === "bebidas")?.id ?? null;
  }, [categories]);

  const isCrispetasView = selectedCategory === crispetasCategoryId && crispetasCategoryId !== null && selectedCategory !== FAVORITES_ID;
  const isBebidasView = selectedCategory === bebidasCategoryId && bebidasCategoryId !== null && selectedCategory !== FAVORITES_ID;

  const handleProductSelect = useCallback(
    (product: PosProduct) => {
      addItem({
        product_id: product.id,
        fudo_product_id: product.fudo_id,
        name: product.nombre,
        price: product.precio_venta,
        quantity: 1,
      });
      if (product.has_modifiers) {
        setPendingModifierProduct(product.fudo_id);
      }
    },
    [addItem]
  );

  const handleSync = useCallback(async () => {
    await syncModifiers.mutateAsync();
    refetchProducts();
  }, [syncModifiers, refetchProducts]);

  if (productsLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-[#f7f5f2] text-gray-400">
        Cargando productos...
      </div>
    );
  }

  return (
    <div className="flex h-full bg-[#f7f5f2] text-gray-900">
      {/* LEFT: Category Sidebar */}
      <CategorySidebar
        categories={categories || []}
        selected={selectedCategory}
        onSelect={setSelectedCategory}
        productCounts={productCounts}
        totalCount={products?.length || 0}
        favoritesCount={favoritesCount}
        onSync={handleSync}
        isSyncing={syncModifiers.isPending}
      />

      {/* CENTER: Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Search bar */}
        <div className="px-3 pt-3 pb-1 lg:px-4 lg:pt-4 lg:pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar producto..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-lg pl-10 pr-4 py-2 lg:py-2.5 text-sm font-semibold text-gray-900 placeholder:text-gray-400 placeholder:font-medium focus:outline-none focus:border-emerald-600/50 focus:ring-1 focus:ring-emerald-600/20"
            />
          </div>
        </div>

        {/* Product grid OR topping panel */}
        {toppingSelection ? (
          <div className="flex-1 overflow-hidden">
            <ToppingPanelBares />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-3 pt-1 lg:p-4 lg:pt-2 scrollbar-hide">
            {isCrispetasView ? (
              <CrispetasBoard
                products={filteredProducts}
                onSelect={handleProductSelect}
              />
            ) : isBebidasView ? (
              <BebidasBoard
                products={filteredProducts}
                onSelect={handleProductSelect}
              />
            ) : (
              <ProductGrid
                products={filteredProducts}
                onSelect={handleProductSelect}
              />
            )}
          </div>
        )}
      </main>

      {/* RIGHT: Remote Order panel */}
      <div className="w-72 lg:w-80 shrink-0">
        <RemoteOrderPanel />
      </div>
    </div>
  );
}
