"use client";

import { useEffect } from "react";
import { usePosCatalog, FAVORITES_ID } from "@/lib/hooks/use-pos-v2-catalog";
import { usePosV2Store } from "@/lib/pos-v2/store";

import { CategorySidebar } from "@/components/pos-v2/catalog/category-sidebar";
import { ProductGrid } from "@/components/pos-v2/catalog/product-grid";
import { SearchBar } from "@/components/pos-v2/catalog/search-bar";
import { CrispetasBoard, BebidasBoard, HeladosBoard, TexMexBoard } from "@/components/pos-v2/catalog/special-boards";
import { ModifierPanel } from "@/components/pos-v2/modifiers/modifier-panel";
import { RemoteOrderPanel } from "@/components/pos-v2/delivery/remote-order-panel";

export default function BaresV2Page() {
  const catalog = usePosCatalog();
  const toppingSelection = usePosV2Store((s) => s.toppingSelection);
  const setMode = usePosV2Store((s) => s.setMode);

  // Set delivery mode on mount
  useEffect(() => {
    setMode("delivery");
    return () => setMode("caja");
  }, [setMode]);

  if (catalog.productsLoading) {
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
        categories={catalog.categories || []}
        selected={catalog.selectedCategory}
        onSelect={catalog.setSelectedCategory}
        productCounts={catalog.productCounts}
        totalCount={catalog.products?.length || 0}
        favoritesCount={catalog.favoritesCount}
        onSync={catalog.handleSync}
        isSyncing={catalog.isSyncing}
      />

      {/* CENTER: Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Search bar */}
        <div className="px-3 pt-3 pb-1 lg:px-4 lg:pt-4 lg:pb-2">
          <SearchBar
            value={catalog.searchQuery}
            onChange={catalog.setSearchQuery}
          />
        </div>

        {/* Product grid OR topping panel */}
        {toppingSelection ? (
          <div className="flex-1 overflow-hidden">
            <ModifierPanel />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-3 pt-1 lg:p-4 lg:pt-2 scrollbar-hide">
            {catalog.isCrispetasView ? (
              <CrispetasBoard
                products={catalog.filteredProducts}
                onSelect={catalog.handleProductSelect}
              />
            ) : catalog.isBebidasView ? (
              <BebidasBoard
                products={catalog.filteredProducts}
                onSelect={catalog.handleProductSelect}
              />
            ) : catalog.isHeladosView ? (
              <HeladosBoard
                products={catalog.filteredProducts}
                onSelect={catalog.handleProductSelect}
              />
            ) : catalog.isTexMexView ? (
              <TexMexBoard
                products={catalog.filteredProducts}
                onSelect={catalog.handleProductSelect}
              />
            ) : (
              <ProductGrid
                products={catalog.filteredProducts}
                onSelect={catalog.handleProductSelect}
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
