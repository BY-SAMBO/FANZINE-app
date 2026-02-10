import { createClient } from "@/lib/supabase/client";
import type { PosProduct, ModifierGroup, ModifierOption } from "@/types/pos";

function getClient() {
  return createClient();
}

/**
 * Get all active products with fudo_id for POS display
 */
export async function getPosProducts(): Promise<PosProduct[]> {
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

/**
 * Get modifier groups for a product from cache
 */
export async function getProductModifiers(
  productFudoId: string
): Promise<ModifierGroup[]> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from("pos_modifier_cache")
    .select("*")
    .eq("product_fudo_id", productFudoId)
    .order("modifier_group_name")
    .order("modifier_name");

  if (error) throw error;
  if (!data || data.length === 0) return [];

  // Group by modifier_group_fudo_id
  const groupMap = new Map<string, ModifierGroup>();
  for (const row of data) {
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
