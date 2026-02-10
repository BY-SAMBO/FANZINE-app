"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { usePosProducts, useProductModifiers, useSyncModifiers } from "@/lib/hooks/use-pos";
import { usePosStore } from "@/lib/stores/pos-live-store";
import { Search } from "lucide-react";
import { usePosLiveChannel } from "@/lib/hooks/use-pos-live-channel";
import { useCategories } from "@/lib/hooks/use-products";
import { CategorySidebar } from "@/components/pos-live/caja/category-sidebar";
import { ProductGrid } from "@/components/pos-live/caja/product-grid";
import { OrderPanel } from "@/components/pos-live/caja/order-panel";
import { ToppingPanel } from "@/components/pos-live/caja/topping-panel";
import { PaymentDialog } from "@/components/pos-live/caja/payment-dialog";
import { HistoryPanel } from "@/components/pos-live/caja/history-panel";
import type { PosProduct, PosEvent } from "@/types/pos";

function generateSessionCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export default function CajaLivePage() {
  const [sessionId] = useState(() => generateSessionCode());
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [pendingModifierProduct, setPendingModifierProduct] = useState<string | null>(null);

  const { data: products, isLoading: productsLoading, refetch: refetchProducts } = usePosProducts();
  const syncModifiers = useSyncModifiers();
  const { data: categories } = useCategories();
  const { data: modifierGroups } = useProductModifiers(pendingModifierProduct);
  const { order, addItem, startToppingSelection, toppingSelection, toggleTopping } = usePosStore();

  // Realtime channel (cross-device)
  const { send, connected } = usePosLiveChannel(
    sessionId,
    useCallback((event: PosEvent) => {
      if (event.type === "topping_toggled") {
        toggleTopping(event.modifier_fudo_id, event.active);
      }
    }, [toggleTopping])
  );

  // When modifier data loads, start topping selection and broadcast
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

  // Filter products by category + search
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    let result = products;
    if (selectedCategory) {
      result = result.filter((p) => p.categoria_id === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((p) => p.nombre.toLowerCase().includes(q));
    }
    return result;
  }, [products, selectedCategory, searchQuery]);

  const handleProductSelect = useCallback(
    (product: PosProduct) => {
      if (product.has_modifiers) {
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

  const handleSync = useCallback(async () => {
    window.open(`/pos-live/cliente?sid=${sessionId}`, "_blank");
    await syncModifiers.mutateAsync();
    refetchProducts();
  }, [syncModifiers, refetchProducts, sessionId]);

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
        onSync={handleSync}
        isSyncing={syncModifiers.isPending}
        sessionCode={sessionId}
        connected={connected}
      />

      {/* CENTER: Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Search bar */}
        <div className="px-4 pt-4 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar producto..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-lg pl-10 pr-4 py-2.5 text-sm font-semibold text-gray-900 placeholder:text-gray-400 placeholder:font-medium focus:outline-none focus:border-red-600/50 focus:ring-1 focus:ring-red-600/20"
            />
          </div>
        </div>

        {/* Product grid */}
        <div className="flex-1 overflow-y-auto p-4 pt-2 scrollbar-hide">
          <ProductGrid
            products={filteredProducts}
            onSelect={handleProductSelect}
          />
        </div>

        {/* Topping panel (slides up when active) */}
        {toppingSelection && <ToppingPanel onSend={send} />}
      </main>

      {/* RIGHT: Order panel */}
      <div className="w-80 shrink-0">
        <OrderPanel
          onPay={() => setPaymentOpen(true)}
          onHistoryOpen={() => setHistoryOpen(true)}
        />
      </div>

      {/* Payment dialog */}
      <PaymentDialog
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        onSend={send}
      />

      {/* History panel */}
      <HistoryPanel
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
      />
    </div>
  );
}
