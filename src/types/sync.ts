export type SyncDirection = "push" | "pull";
export type SyncAction = "create" | "update" | "delete" | "price_sync";
export type SyncLogStatus = "success" | "error" | "skipped";

export interface SyncLogEntry {
  id: string;
  product_id: string;
  action: SyncAction;
  direction: SyncDirection;
  details: Record<string, unknown>;
  status: SyncLogStatus;
  error_message: string | null;
  performed_by: string;
  created_at: string;
}

export interface SyncComparisonResult {
  synced: SyncProductPair[];
  local_only: LocalProduct[];
  fudo_only: FudoProduct[];
  diffs: SyncProductDiff[];
  summary: {
    total_local: number;
    total_fudo: number;
    synced: number;
    local_only: number;
    fudo_only: number;
    with_diffs: number;
  };
}

export interface SyncProductPair {
  local_id: string;
  fudo_id: string;
  nombre: string;
}

export interface LocalProduct {
  id: string;
  nombre: string;
  precio_venta: number;
  activo: boolean;
}

export interface FudoProduct {
  fudo_id: string;
  code: string | null;
  name: string;
  price: number;
  active: boolean;
}

export interface SyncProductDiff {
  local_id: string;
  fudo_id: string;
  nombre: string;
  fields: SyncFieldDiff[];
}

export interface SyncFieldDiff {
  field: string;
  local_value: unknown;
  fudo_value: unknown;
}

export interface PriceReport {
  product_id: string;
  nombre: string;
  precio_local: number;
  precio_fudo: number;
  diferencia: number;
  porcentaje: number;
}
