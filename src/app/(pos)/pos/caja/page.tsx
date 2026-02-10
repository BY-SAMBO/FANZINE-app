"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { usePosProducts, useProductModifiers, useSyncModifiers, useOrderHistory } from "@/lib/hooks/use-pos";
import { usePosStore } from "@/lib/stores/pos-store";
import { Search } from "lucide-react";
import { usePosChannel } from "@/lib/hooks/use-pos-channel";
import { useCategories } from "@/lib/hooks/use-products";
import { CategorySidebar, FAVORITES_ID } from "@/components/pos/caja/category-sidebar";
import { ProductGrid } from "@/components/pos/caja/product-grid";
import { OrderPanel } from "@/components/pos/caja/order-panel";
import { ToppingPanel } from "@/components/pos/caja/topping-panel";
import { PaymentDialog } from "@/components/pos/caja/payment-dialog";
import { HistoryPanel } from "@/components/pos/caja/history-panel";
import { CrispetasBoard } from "@/components/pos/caja/crispetas-board";
import { BebidasBoard } from "@/components/pos/caja/bebidas-board";
import type { PosProduct, PosEvent } from "@/types/pos";

export default function CajaPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(FAVORITES_ID);
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [pendingModifierProduct, setPendingModifierProduct] = useState<string | null>(null);
  const [highlightSaleId, setHighlightSaleId] = useState<string | null>(null);
  const highlightTimer = useRef<ReturnType<typeof setTimeout>>(null);

  const { data: products, isLoading: productsLoading, refetch: refetchProducts } = usePosProducts();
  const { refetch: refetchHistory } = useOrderHistory();
  const syncModifiers = useSyncModifiers();
  const { data: categories } = useCategories();
  const { data: modifierGroups } = useProductModifiers(pendingModifierProduct);
  const order = usePosStore((s) => s.order);
  const addItem = usePosStore((s) => s.addItem);
  const startToppingSelection = usePosStore((s) => s.startToppingSelection);
  const toppingSelection = usePosStore((s) => s.toppingSelection);
  const toggleTopping = usePosStore((s) => s.toggleTopping);

  // Broadcast channel
  const { send } = usePosChannel(
    useCallback((event: PosEvent) => {
      // Receive topping toggles from client screen
      if (event.type === "topping_toggled") {
        toggleTopping(event.modifier_fudo_id, event.active);
      }
    }, [toggleTopping])
  );

  // When modifier data loads, start topping selection and broadcast
  useEffect(() => {
    if (modifierGroups && modifierGroups.length > 0 && pendingModifierProduct) {
      // Find the product info
      const product = products?.find((p) => p.fudo_id === pendingModifierProduct);
      if (product) {
        startToppingSelection(
          product.id,
          product.nombre,
          product.fudo_id,
          modifierGroups
        );

        // Broadcast to client screen
        send({
          type: "show_toppings",
          product_id: product.id,
          product_name: product.nombre,
          modifiers: modifierGroups,
          selected: {},
        });
      }
      setPendingModifierProduct(null);
    }
  }, [modifierGroups, pendingModifierProduct, products, startToppingSelection, send]);

  // Broadcast order updates when items change
  useEffect(() => {
    send({
      type: "order_updated",
      items: order.items,
      total: order.total,
    });
  }, [order.items, order.total, send]);

  // Product counts by category
  const productCounts = useMemo(() => {
    if (!products) return {};
    return products.reduce((acc, p) => {
      const catId = p.categoria_id || "uncategorized";
      acc[catId] = (acc[catId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [products]);

  // Count favorites
  const favoritesCount = useMemo(() => {
    return products?.filter((p) => p.favorito).length ?? 0;
  }, [products]);

  // Filter products by category + search
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

  // Detect special category views
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
      if (product.has_modifiers) {
        // Add item first, then fetch modifiers
        addItem({
          product_id: product.id,
          fudo_product_id: product.fudo_id,
          name: product.nombre,
          price: product.precio_venta,
          quantity: 1,
        });
        setPendingModifierProduct(product.fudo_id);
      } else {
        addItem({
          product_id: product.id,
          fudo_product_id: product.fudo_id,
          name: product.nombre,
          price: product.precio_venta,
          quantity: 1,
        });
      }
    },
    [addItem]
  );

  const handleSaleSuccess = useCallback((fudoSaleId: string) => {
    // Refetch history so the new sale appears
    refetchHistory();
    // Highlight the new sale
    setHighlightSaleId(fudoSaleId);
    // Reset to favorites view
    setSelectedCategory(FAVORITES_ID);
    setSearchQuery("");
    // Clear highlight after 3 seconds
    if (highlightTimer.current) clearTimeout(highlightTimer.current);
    highlightTimer.current = setTimeout(() => setHighlightSaleId(null), 3000);
  }, [refetchHistory]);

  const handleSync = useCallback(async () => {
    window.open("/pos/cliente", "_blank");
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
              className="w-full bg-white border border-gray-200 rounded-lg pl-10 pr-4 py-2 lg:py-2.5 text-sm font-semibold text-gray-900 placeholder:text-gray-400 placeholder:font-medium focus:outline-none focus:border-red-600/50 focus:ring-1 focus:ring-red-600/20"
            />
          </div>
        </div>

        {/* Product grid OR topping panel (full takeover) */}
        {toppingSelection ? (
          <div className="flex-1 overflow-hidden">
            <ToppingPanel onSend={send} />
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
        onSend={send}
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
