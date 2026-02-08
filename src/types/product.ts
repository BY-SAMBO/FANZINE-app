import type { Category } from "./category";

export type FudoSyncStatus =
  | "synced"
  | "pending"
  | "conflict"
  | "local_only"
  | "fudo_only";

export type ChecklistStatus = "completo" | "incompleto" | "pendiente";

export interface Product {
  id: string; // e.g. "TA001"
  nombre: string;
  slug: string;
  categoria_id: string;

  // Precios
  precio_venta: number;
  precio_delivery: number | null; // auto: venta * 1.35
  precio_costo_receta: number | null;
  precio_costo_real: number | null;

  // Estado
  activo: boolean;
  visible_menu: boolean;
  disponible_local: boolean;
  disponible_delivery: boolean;
  favorito: boolean;

  // Contenido
  descripcion_corta: string | null;
  descripcion_delivery: string | null;
  descripcion_larga: string | null;
  prompt_ia: string | null;

  // Media
  foto_principal: string | null;
  galeria: string[];

  // Fudo
  fudo_id: string | null;
  fudo_synced_at: string | null;
  fudo_sync_status: FudoSyncStatus;

  // Checklist
  checklist_status: ChecklistStatus;
  checklist_precio_delivery: boolean;
  checklist_descripcion_delivery: boolean;
  checklist_foto_principal: boolean;

  // Delivery
  delivery_config: Record<string, unknown> | null;

  // Timestamps
  created_at: string;
  updated_at: string;

  // Relations (optional, loaded via joins)
  categoria?: Category;
}

export interface ProductFormData {
  nombre: string;
  slug: string;
  categoria_id: string;
  precio_venta: number;
  precio_delivery?: number | null;
  precio_costo_receta?: number | null;
  precio_costo_real?: number | null;
  activo: boolean;
  visible_menu: boolean;
  disponible_local: boolean;
  disponible_delivery: boolean;
  favorito: boolean;
  descripcion_corta?: string | null;
  descripcion_delivery?: string | null;
  descripcion_larga?: string | null;
  prompt_ia?: string | null;
  foto_principal?: string | null;
  delivery_config?: Record<string, unknown> | null;
}

export interface ProductFilters {
  categoria_id?: string;
  activo?: boolean;
  disponible_delivery?: boolean;
  fudo_sync_status?: FudoSyncStatus;
  checklist_status?: ChecklistStatus;
  search?: string;
}
