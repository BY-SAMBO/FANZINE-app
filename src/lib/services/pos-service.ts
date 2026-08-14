import { createClient } from "@/lib/supabase/client";
import { withOfflineCache, writeCache } from "@/lib/utils/offline-cache";
import type { PosProduct, ModifierGroup } from "@/types/pos";

function getClient() {
  return createClient();
}

/**
 * Get all active products with fudo_id for POS display.
 * Cached in localStorage so the POS keeps working without internet.
 */
export async function getPosProducts(): Promise<PosProduct[]> {
  return withOfflineCache("pos-products", fetchPosProducts);
}

async function fetchPosProducts(): Promise<PosProduct[]> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from("products")
    .select("id, nombre, precio_venta, fudo_id, categoria_id, favorito")
    .eq("activo", true)
    .not("fudo_id", "is", null)
    .order("categoria_id")
    .order("nombre");

  if (error) throw error;

  // Check which products have modifiers in cache
  const productFudoIds = (data || []).map((p) => p.fudo_id).filter(Boolean);

  const { data: modCache } = await supabase
    .from("pos_modifier_cache")
    .select("product_fudo_id")
    .in("product_fudo_id", productFudoIds);

  const productsWithMods = new Set(
    (modCache || []).map((m) => m.product_fudo_id)
  );

  return (data || []).map((p) => ({
    id: p.id,
    nombre: p.nombre,
    precio_venta: p.precio_venta,
    fudo_id: p.fudo_id!,
    categoria_id: p.categoria_id,
    has_modifiers: productsWithMods.has(p.fudo_id!),
    favorito: p.favorito ?? false,
  }));
}

// Row shape from pos_modifier_cache used to build ModifierGroup[]
interface ModifierCacheRow {
  product_fudo_id: string;
  modifier_group_fudo_id: string;
  modifier_group_name: string | null;
  group_max_quantity: number | null;
  group_min_quantity: number | null;
  modifier_fudo_id: string;
  modifier_name: string;
  modifier_price: number | string | null;
  topping_product_fudo_id: string | null;
  max_quantity: number | null;
}

function buildModifierGroups(rows: ModifierCacheRow[]): ModifierGroup[] {
  const groupMap = new Map<string, ModifierGroup>();
  for (const row of rows) {
    if (!groupMap.has(row.modifier_group_fudo_id)) {
      groupMap.set(row.modifier_group_fudo_id, {
        fudo_id: row.modifier_group_fudo_id,
        name: row.modifier_group_name || "Modificadores",
        max_quantity: row.group_max_quantity ?? 99,
        min_quantity: row.group_min_quantity ?? 0,
        options: [],
      });
    }
    const group = groupMap.get(row.modifier_group_fudo_id)!;
    group.options.push({
      fudo_modifier_id: row.modifier_fudo_id,
      modifier_group_fudo_id: row.modifier_group_fudo_id,
      topping_product_fudo_id: row.topping_product_fudo_id || "",
      name: row.modifier_name,
      price: Number(row.modifier_price) || 0,
      max_quantity: row.max_quantity || 1,
    });
  }
  return Array.from(groupMap.values());
}

/**
 * Get modifier groups for a product from cache.
 * Cached in localStorage so toppings keep working without internet.
 */
export async function getProductModifiers(
  productFudoId: string
): Promise<ModifierGroup[]> {
  return withOfflineCache(`pos-modifiers:${productFudoId}`, async () => {
    const supabase = getClient();
    const { data, error } = await supabase
      .from("pos_modifier_cache")
      .select("*")
      .eq("product_fudo_id", productFudoId)
      .order("modifier_group_name")
      .order("modifier_name");

    if (error) throw error;
    if (!data || data.length === 0) return [];
    return buildModifierGroups(data);
  });
}

/**
 * Warm the offline cache with the modifiers of EVERY product, so toppings
 * work offline even for products never opened in this session.
 * Fire-and-forget from the POS on load.
 */
export async function prefetchAllModifiers(): Promise<void> {
  try {
    const supabase = getClient();
    const { data, error } = await supabase
      .from("pos_modifier_cache")
      .select("*")
      .order("modifier_group_name")
      .order("modifier_name");

    if (error || !data) return;

    const byProduct = new Map<string, ModifierCacheRow[]>();
    for (const row of data as ModifierCacheRow[]) {
      const list = byProduct.get(row.product_fudo_id) ?? [];
      list.push(row);
      byProduct.set(row.product_fudo_id, list);
    }
    for (const [productFudoId, rows] of byProduct) {
      writeCache(`pos-modifiers:${productFudoId}`, buildModifierGroups(rows));
    }
  } catch {
    // Best-effort warmup — offline fallback just won't cover unopened products
  }
}

/**
 * Log a completed sale to Supabase
 */
export async function logSale(sale: {
  fudo_sale_id: string;
  sale_type: string;
  items: unknown[];
  total: number;
  payment_method: string;
  cashier_id: string;
  cashier_name: string;
  closed_at: string;
}) {
  const supabase = getClient();
  const { error } = await supabase.from("pos_sales_log").insert(sale);
  if (error) throw error;
}
