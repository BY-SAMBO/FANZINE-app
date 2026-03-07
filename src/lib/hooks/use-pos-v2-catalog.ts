"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { usePosProducts, useProductModifiers, useSyncModifiers } from "./use-pos-v2";
import { useCategories } from "./use-products";
import { usePosV2Store } from "@/lib/pos-v2/store";
import type { PosProduct } from "@/types/pos-v2";

export const FAVORITES_ID = "__favorites__";

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

  // Tex-Mex unified: tex-mex + tacos + nachos + chicanitas
  const texmexCategoryId = useMemo(() => {
    return categories?.find((c) => c.nombre.toLowerCase() === "tex-mex")?.id ?? null;
  }, [categories]);

  const texmexSubCategoryIds = useMemo(() => {
    if (!categories) return new Set<string>();
    const slugs = ["tacos", "nachos", "chicanitas"];
    return new Set(
      categories.filter((c) => slugs.includes(c.slug)).map((c) => c.id)
    );
  }, [categories]);

  // All tex-mex related category IDs (main + subs)
  const allTexmexIds = useMemo(() => {
    const ids = new Set(texmexSubCategoryIds);
    if (texmexCategoryId) ids.add(texmexCategoryId);
    return ids;
  }, [texmexCategoryId, texmexSubCategoryIds]);

  // Product counts by category — merge tex-mex sub-categories
  const productCounts = useMemo(() => {
    if (!products) return {};
    const counts: Record<string, number> = {};
    for (const p of products) {
      const catId = p.categoria_id || "uncategorized";
      // Merge tacos/nachos/chicanitas counts into tex-mex
      if (texmexCategoryId && texmexSubCategoryIds.has(catId)) {
        counts[texmexCategoryId] = (counts[texmexCategoryId] || 0) + 1;
      } else {
        counts[catId] = (counts[catId] || 0) + 1;
      }
    }
    return counts;
  }, [products, texmexCategoryId, texmexSubCategoryIds]);

  // Categories for sidebar — hide tex-mex sub-categories
  const sidebarCategories = useMemo(() => {
    if (!categories) return [];
    return categories.filter((c) => !texmexSubCategoryIds.has(c.id));
  }, [categories, texmexSubCategoryIds]);

  const favoritesCount = useMemo(() => {
    return products?.filter((p) => p.favorito).length ?? 0;
  }, [products]);

  // Filter products by category + search
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    let result = products;
    if (selectedCategory === FAVORITES_ID) {
      result = result.filter((p) => p.favorito);
    } else if (selectedCategory && selectedCategory === texmexCategoryId) {
      // Tex-Mex unified: include tacos, nachos, chicanitas
      result = result.filter((p) => allTexmexIds.has(p.categoria_id));
    } else if (selectedCategory) {
      result = result.filter((p) => p.categoria_id === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((p) => p.nombre.toLowerCase().includes(q));
    }
    return result;
  }, [products, selectedCategory, searchQuery, texmexCategoryId, allTexmexIds]);

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

  const isTexMexView =
    selectedCategory === texmexCategoryId &&
    texmexCategoryId !== null &&
    selectedCategory !== FAVORITES_ID;

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
