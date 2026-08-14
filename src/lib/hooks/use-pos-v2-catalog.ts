"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { usePosProducts, useProductModifiers, useSyncModifiers } from "./use-pos-v2";
import { useCategories } from "./use-products";
import { usePosV2Store } from "@/lib/pos-v2/store";
import type { PosProduct } from "@/types/pos-v2";

export const FAVORITES_ID = "__favorites__";

// Synthetic category: unifies tacos + nachos + chicanitas + tex-mex in one
// sidebar entry that exists even if the DB has no "tex-mex" category row.
export const TEXMEX_ID = "__texmex__";
const TEXMEX_SLUGS = ["tex-mex", "tacos", "nachos", "chicanitas"];

export function usePosCatalog() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(FAVORITES_ID);
  const [searchQuery, setSearchQuery] = useState("");
  const [pendingModifierProduct, setPendingModifierProduct] = useState<string | null>(null);

  const { data: products, isLoading: productsLoading, refetch: refetchProducts } = usePosProducts();
  const { data: categories } = useCategories();
  const { data: modifierGroups } = useProductModifiers(pendingModifierProduct);
  const syncModifiers = useSyncModifiers();

  const addItem = usePosV2Store((s) => s.addItem);
  const startToppingSelection = usePosV2Store((s) => s.startToppingSelection);

  // When modifier data loads, start topping selection
  useEffect(() => {
    if (modifierGroups && modifierGroups.length > 0 && pendingModifierProduct) {
      const product = products?.find((p) => p.fudo_id === pendingModifierProduct);
      if (product) {
        // Find the item we just added (last item with this product and no modifiers)
        const order = usePosV2Store.getState().order;
        const targetItem = [...order.items]
          .reverse()
          .find((i) => i.fudo_product_id === product.fudo_id && i.modifiers.length === 0);

        if (targetItem) {
          startToppingSelection(
            targetItem.id,
            product.id,
            product.nombre,
            product.fudo_id,
            modifierGroups
          );
        }
      }
      setPendingModifierProduct(null);
    }
  }, [modifierGroups, pendingModifierProduct, products, startToppingSelection]);

  // Detect special categories
  const crispetasCategoryId = useMemo(() => {
    return categories?.find((c) => c.nombre.toLowerCase() === "crispetas")?.id ?? null;
  }, [categories]);

  const bebidasCategoryId = useMemo(() => {
    return categories?.find((c) => c.nombre.toLowerCase() === "bebidas")?.id ?? null;
  }, [categories]);

  const heladosCategoryId = useMemo(() => {
    return categories?.find((c) => c.nombre.toLowerCase() === "helados")?.id ?? null;
  }, [categories]);

  // Tex-Mex unified: DB categories that fold into the synthetic TEXMEX_ID
  // (matched by slug or nombre so a renamed/missing "tex-mex" row can't
  // make tacos/nachos disappear from the sidebar)
  const texmexDbIds = useMemo(() => {
    if (!categories) return new Set<string>();
    return new Set(
      categories
        .filter(
          (c) =>
            TEXMEX_SLUGS.includes(c.slug?.toLowerCase?.() ?? "") ||
            TEXMEX_SLUGS.includes(c.nombre?.toLowerCase?.() ?? "")
        )
        .map((c) => c.id)
    );
  }, [categories]);

  // Product counts by category — merge tex-mex categories into TEXMEX_ID
  const productCounts = useMemo(() => {
    if (!products) return {};
    const counts: Record<string, number> = {};
    for (const p of products) {
      const catId = p.categoria_id || "uncategorized";
      if (texmexDbIds.has(catId)) {
        counts[TEXMEX_ID] = (counts[TEXMEX_ID] || 0) + 1;
      } else {
        counts[catId] = (counts[catId] || 0) + 1;
      }
    }
    return counts;
  }, [products, texmexDbIds]);

  // Categories for sidebar — collapse all tex-mex categories into one
  // synthetic entry at the position of the first one
  const sidebarCategories = useMemo(() => {
    if (!categories) return [];
    const result: typeof categories = [];
    let inserted = false;
    for (const c of categories) {
      if (texmexDbIds.has(c.id)) {
        if (!inserted) {
          result.push({ ...c, id: TEXMEX_ID, nombre: "Tex-Mex" });
          inserted = true;
        }
      } else {
        result.push(c);
      }
    }
    return result;
  }, [categories, texmexDbIds]);

  const favoritesCount = useMemo(() => {
    return products?.filter((p) => p.favorito).length ?? 0;
  }, [products]);

  // Filter products by category + search
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    let result = products;
    if (selectedCategory === FAVORITES_ID) {
      result = result.filter((p) => p.favorito);
    } else if (selectedCategory === TEXMEX_ID) {
      // Tex-Mex unified: include tacos, nachos, chicanitas, tex-mex
      result = result.filter((p) => texmexDbIds.has(p.categoria_id));
    } else if (selectedCategory) {
      result = result.filter((p) => p.categoria_id === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((p) => p.nombre.toLowerCase().includes(q));
    }
    return result;
  }, [products, selectedCategory, searchQuery, texmexDbIds]);

  const isCrispetasView =
    selectedCategory === crispetasCategoryId &&
    crispetasCategoryId !== null &&
    selectedCategory !== FAVORITES_ID;

  const isBebidasView =
    selectedCategory === bebidasCategoryId &&
    bebidasCategoryId !== null &&
    selectedCategory !== FAVORITES_ID;

  const isHeladosView =
    selectedCategory === heladosCategoryId &&
    heladosCategoryId !== null &&
    selectedCategory !== FAVORITES_ID;

  const isTexMexView = selectedCategory === TEXMEX_ID;

  const handleProductSelect = useCallback(
    (product: PosProduct) => {
      const itemId = addItem({
        product_id: product.id,
        fudo_product_id: product.fudo_id,
        name: product.nombre,
        price: product.precio_venta,
        quantity: 1,
      });

      if (product.has_modifiers) {
        // Item already added with the returned ID — fetch modifiers
        setPendingModifierProduct(product.fudo_id);
      }

      return itemId;
    },
    [addItem]
  );

  const handleSync = useCallback(async () => {
    await syncModifiers.mutateAsync();
    refetchProducts();
  }, [syncModifiers, refetchProducts]);

  return {
    // Data
    products,
    categories: sidebarCategories,
    filteredProducts,
    productsLoading,
    productCounts,
    favoritesCount,

    // Category selection
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,

    // Special views
    isCrispetasView,
    isBebidasView,
    isHeladosView,
    isTexMexView,

    // Actions
    handleProductSelect,
    handleSync,
    isSyncing: syncModifiers.isPending,

    // Refetch
    refetchProducts,
  };
}
