import type { Product, ProductFormData, ProductFilters } from "@/types/product";
import { createClient } from "@/lib/supabase/client";
import { deepMerge } from "@/lib/utils/deep-merge";
import { PROTECTED_FIELDS } from "@/lib/config/constants";

function getClient() {
  return createClient();
}

export async function getProducts(filters?: ProductFilters) {
  const supabase = getClient();
  let query = supabase
    .from("products")
    .select("*, categoria:categories(*)")
    .order("categoria_id")
    .order("nombre");

  if (filters?.categoria_id) {
    query = query.eq("categoria_id", filters.categoria_id);
  }
  if (filters?.activo !== undefined) {
    query = query.eq("activo", filters.activo);
  }
  if (filters?.disponible_delivery !== undefined) {
    query = query.eq("disponible_delivery", filters.disponible_delivery);
  }
  if (filters?.fudo_sync_status) {
    query = query.eq("fudo_sync_status", filters.fudo_sync_status);
  }
  if (filters?.checklist_status) {
    query = query.eq("checklist_status", filters.checklist_status);
  }
  if (filters?.search) {
    query = query.or(
      `nombre.ilike.%${filters.search}%,id.ilike.%${filters.search}%`
    );
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as (Product & { categoria: { nombre: string; slug: string } })[];
}

export async function getProduct(id: string) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from("products")
    .select("*, categoria:categories(*)")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as Product & { categoria: { nombre: string; slug: string } };
}

export async function createProduct(product: ProductFormData & { id: string }) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from("products")
    .insert(product)
    .select()
    .single();

  if (error) throw error;
  return data as Product;
}

export async function updateProduct(
  id: string,
  updates: Partial<ProductFormData>
) {
  const supabase = getClient();

  // Filter out protected fields
  const safeUpdates = { ...updates };
  for (const field of PROTECTED_FIELDS) {
    delete (safeUpdates as Record<string, unknown>)[field];
  }

  // Get current product for deep merge
  const { data: current, error: fetchError } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError) throw fetchError;

  // Deep merge delivery_config if present
  const merged = current.delivery_config && safeUpdates.delivery_config
    ? {
        ...safeUpdates,
        delivery_config: deepMerge(
          current.delivery_config as Record<string, unknown>,
          safeUpdates.delivery_config as Record<string, unknown>
        ),
      }
    : safeUpdates;

  const { data, error } = await supabase
    .from("products")
    .update(merged)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as Product;
}

export async function deleteProduct(id: string) {
  const supabase = getClient();
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;
}

export async function getCategories() {
  const supabase = getClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("activa", true)
    .order("orden");

  if (error) throw error;
  return data;
}

export async function getProductStats() {
  const supabase = getClient();
  const { data, error } = await supabase
    .from("products")
    .select("id, activo, fudo_sync_status, checklist_status, disponible_delivery");

  if (error) throw error;

  const products = data || [];
  return {
    total: products.length,
    activos: products.filter((p) => p.activo).length,
    delivery: products.filter((p) => p.disponible_delivery).length,
    synced: products.filter((p) => p.fudo_sync_status === "synced").length,
    pending_sync: products.filter((p) => p.fudo_sync_status === "pending").length,
    checklist_completo: products.filter((p) => p.checklist_status === "completo").length,
    checklist_incompleto: products.filter((p) => p.checklist_status === "incompleto").length,
    checklist_pendiente: products.filter((p) => p.checklist_status === "pendiente").length,
  };
}
