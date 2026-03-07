"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { usePosCatalog, FAVORITES_ID } from "@/lib/hooks/use-pos-v2-catalog";
import { useOrderHistory } from "@/lib/hooks/use-pos-v2";
import { usePosV2Store } from "@/lib/pos-v2/store";
import { usePrinterStore } from "@/lib/stores/printer-store";

import { CategorySidebar } from "@/components/pos-v2/catalog/category-sidebar";
import { ProductGrid } from "@/components/pos-v2/catalog/product-grid";
import { SearchBar } from "@/components/pos-v2/catalog/search-bar";
import { CrispetasBoard, BebidasBoard, HeladosBoard, TexMexBoard } from "@/components/pos-v2/catalog/special-boards";
import { OrderPanel } from "@/components/pos-v2/order/order-panel";
import { ModifierPanel } from "@/components/pos-v2/modifiers/modifier-panel";
import { PaymentDialog } from "@/components/pos-v2/payment/payment-dialog";
import { HistoryPanel } from "@/components/pos-v2/history/history-panel";
import { PrinterBanner } from "@/components/pos-v2/shared/printer-status";

export default function CajaV2Page() {
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [highlightSaleId, setHighlightSaleId] = useState<string | null>(null);
  const highlightTimer = useRef<ReturnType<typeof setTimeout>>(null);

  const catalog = usePosCatalog();
  const { refetch: refetchHistory } = useOrderHistory();
  const toppingSelection = usePosV2Store((s) => s.toppingSelection);
  const autoReconnect = usePrinterStore((s) => s.autoReconnect);

  // Auto-reconnect printer on mount
  useEffect(() => {
    autoReconnect();
  }, [autoReconnect]);

  const handleSaleSuccess = useCallback((fudoSaleId: string) => {
    refetchHistory();
    setHighlightSaleId(fudoSaleId);
    catalog.setSelectedCategory(FAVORITES_ID);
    catalog.setSearchQuery("");
    if (highlightTimer.current) clearTimeout(highlightTimer.current);
    highlightTimer.current = setTimeout(() => setHighlightSaleId(null), 3000);
  }, [refetchHistory, catalog]);

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

        {/* Printer banner */}
        <div className="mx-3 lg:mx-4 mb-1">
          <PrinterBanner />
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

      {/* RIGHT: Order panel */}
      <div className="w-72 lg:w-80 shrink-0">
        <OrderPanel
          onPay={() => setPaymentOpen(true)}
          onHistoryOpen={() => setHistoryOpen(true)}
          highlightSaleId={highlightSaleId}
        />
      </div>

      {/* Payment dialog */}
      <PaymentDialog
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        onSaleSuccess={handleSaleSuccess}
      />

      {/* History panel */}
      <HistoryPanel
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
      />
    </div>
  );
}
