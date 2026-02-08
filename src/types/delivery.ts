export type DeliveryModuleType = "multiple" | "single";

export interface DeliveryModuleItem {
  nombre: string;
  precio: number;
  activo: boolean;
}

export interface DeliveryModule {
  id: string;
  titulo: string;
  tipo: DeliveryModuleType;
  max_items: number | null;
  catalogo: DeliveryModuleItem[];
  created_at: string;
  updated_at: string;
}

export interface DeliveryCategoryTemplate {
  id: string;
  categoria_id: string;
  modulos_orden: string[]; // module IDs in order
  config: Record<string, DeliveryModuleOverride>;
  created_at: string;
  updated_at: string;
}

export interface DeliveryModuleOverride {
  habilitado: boolean;
  max_items?: number;
  items_override?: DeliveryModuleItem[];
}

export interface DeliveryProductConfig {
  modulos: string[];
  overrides: Record<string, DeliveryModuleOverride>;
}

export interface ResolvedDeliveryModule {
  id: string;
  titulo: string;
  tipo: DeliveryModuleType;
  max_items: number | null;
  items: DeliveryModuleItem[];
}
