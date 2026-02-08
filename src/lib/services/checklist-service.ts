import type { Product, ChecklistStatus } from "@/types/product";
import { CHECKLIST_ITEMS } from "@/lib/config/constants";
import { createClient } from "@/lib/supabase/client";

export interface ChecklistItem {
  key: string;
  label: string;
  description: string;
  completed: boolean;
}

export interface ProductChecklist {
  product_id: string;
  nombre: string;
  status: ChecklistStatus;
  items: ChecklistItem[];
  progress: number; // 0-100
}

/**
 * Get checklist info for a single product
 */
export function getProductChecklist(product: Product): ProductChecklist {
  const items: ChecklistItem[] = CHECKLIST_ITEMS.map((item) => ({
    key: item.key,
    label: item.label,
    description: item.description,
    completed: product[item.key] as boolean,
  }));

  const completedCount = items.filter((i) => i.completed).length;
  const progress = Math.round((completedCount / items.length) * 100);

  return {
    product_id: product.id,
    nombre: product.nombre,
    status: product.checklist_status,
    items,
    progress,
  };
}

/**
 * Get checklist stats for all products
 */
export function getChecklistStats(products: Product[]) {
  const total = products.length;
  const completo = products.filter(
    (p) => p.checklist_status === "completo"
  ).length;
  const incompleto = products.filter(
    (p) => p.checklist_status === "incompleto"
  ).length;
  const pendiente = products.filter(
    (p) => p.checklist_status === "pendiente"
  ).length;

  return {
    total,
    completo,
    incompleto,
    pendiente,
    progress: total > 0 ? Math.round((completo / total) * 100) : 0,
  };
}

/**
 * Toggle a checklist item for a product
 */
export async function toggleChecklistItem(
  productId: string,
  field: "checklist_precio_delivery" | "checklist_descripcion_delivery" | "checklist_foto_principal",
  value: boolean
) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("products")
    .update({ [field]: value })
    .eq("id", productId)
    .select()
    .single();

  if (error) throw error;
  return data as Product;
}
