"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { usePosProducts, useProductModifiers, useSyncModifiers } from "@/lib/hooks/use-pos";
import { usePosStore } from "@/lib/stores/pos-store";
import { RefreshCw, MonitorUp } from "lucide-react";
import { usePosChannel } from "@/lib/hooks/use-pos-channel";
import { useCategories } from "@/lib/hooks/use-products";
import { CategoryBar } from "@/components/pos/caja/category-bar";
import { ProductGrid } from "@/components/pos/caja/product-grid";
import { OrderPanel } from "@/components/pos/caja/order-panel";
import { ToppingPanel } from "@/components/pos/caja/topping-panel";
import { PaymentDialog } from "@/components/pos/caja/payment-dialog";
import type { PosProduct, PosEvent } from "@/types/pos";

export default function CajaPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [pendingModifierProduct, setPendingModifierProduct] = useState<string | null>(null);

  const { data: products, isLoading: productsLoading, refetch: refetchProducts } = usePosProducts();
  const syncModifiers = useSyncModifiers();
  const { data: categories } = useCategories();
  const { data: modifierGroups } = useProductModifiers(pendingModifierProduct);
  const { order, addItem, startToppingSelection, toppingSelection, toggleTopping } = usePosStore();

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

  // Filter products by category
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    if (!selectedCategory) return products;
    return products.filter((p) => p.categoria_id === selectedCategory);
  }, [products, selectedCategory]);

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

  if (productsLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-[#1a1117] text-white/50">
        Cargando productos...
      </div>
    );
  }

  return (
    <div className="flex h-full bg-[#1a1117]">
      {/* Left: Products */}
      <div className="flex flex-1 flex-col gap-3 p-4 overflow-hidden">
        {/* Header: category bar + sync */}
        <div className="flex items-center gap-2">
          <div className="flex-1 overflow-hidden">
            <CategoryBar
              categories={categories || []}
              selected={selectedCategory}
              onSelect={setSelectedCategory}
            />
          </div>
          <button
            onClick={async () => {
              window.open("/pos/cliente", "_blank");
              await syncModifiers.mutateAsync();
              refetchProducts();
            }}
            disabled={syncModifiers.isPending}
            className="shrink-0 flex items-center gap-1.5 px-3 py-2 border-2 border-[#DC2626] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#DC2626] disabled:opacity-30 transition-all"
            title="Abrir pantalla cliente y sincronizar modifiers"
          >
            {syncModifiers.isPending ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <MonitorUp className="w-3.5 h-3.5" />
            )}
            {syncModifiers.isPending ? "Sync..." : "Iniciar POS"}
          </button>
        </div>

        {/* Product grid */}
        <div className="flex-1 overflow-y-auto">
          <ProductGrid
            products={filteredProducts}
            onSelect={handleProductSelect}
          />
        </div>

        {/* Topping panel (slides up when active) */}
        {toppingSelection && <ToppingPanel onSend={send} />}
      </div>

      {/* Right: Order panel */}
      <div className="w-80 shrink-0">
        <OrderPanel onPay={() => setPaymentOpen(true)} />
      </div>

      {/* Payment dialog */}
      <PaymentDialog
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        onSend={send}
      />
    </div>
  );
}
