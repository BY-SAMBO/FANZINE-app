// POS v2 types — clean, no realtime events

export type SaleType = "TAKEAWAY" | "DINE_IN";

export type SaleMode = "instant" | "comanda";

export type PaymentMethod = "cash" | "card" | "nequi" | "daviplata" | "llaves";

export type OrderStatus = "building" | "paying" | "submitted" | "error";

export interface OrderModifier {
  fudo_modifier_id: string;
  modifier_group_fudo_id: string;
  topping_product_fudo_id: string;
  group_name: string;
  name: string;
  price: number;
  quantity: number;
}

export interface OrderItem {
  id: string; // local uuid for keying
  product_id: string; // local product id (e.g. "TA001")
  fudo_product_id: string;
  name: string;
  price: number;
  quantity: number;
  modifiers: OrderModifier[];
}

export interface Order {
  items: OrderItem[];
  sale_type: SaleType;
  status: OrderStatus;
  total: number;
  payment_method: PaymentMethod | null;
}

// Modifier data from cache
export interface ModifierOption {
  fudo_modifier_id: string;
  modifier_group_fudo_id: string;
  topping_product_fudo_id: string;
  name: string;
  price: number;
  max_quantity: number;
}

export interface ModifierGroup {
  fudo_id: string;
  name: string;
  max_quantity: number;
  min_quantity: number;
  options: ModifierOption[];
}

// POS product (simplified for the grid)
export interface PosProduct {
  id: string;
  nombre: string;
  precio_venta: number;
  fudo_id: string;
  categoria_id: string;
  has_modifiers: boolean;
  favorito: boolean;
}

// Topping selection state with targetItemId to fix assignment bug
export interface ToppingSelection {
  targetItemId: string; // ID of the specific item being modified
  product_id: string;
  product_name: string;
  fudo_product_id: string;
  groups: ModifierGroup[];
  selected: Record<string, number>; // modifier_fudo_id -> quantity
}

// Delivery fields
export interface DeliveryInfo {
  location: RemoteLocation | null;
  customer_name: string;
  customer_phone: string;
  comment: string;
}

export interface RemoteLocation {
  id: string;
  name: string;
  address: string;
  delivery_fee: number;
}

// Sale log entry (from DB)
export interface SaleLogEntry {
  id: string;
  fudo_sale_id: string;
  sale_type: string;
  sale_mode: string;
  sale_status: string;
  payment_method: string;
  total: string | number;
  items: SaleLogItem[];
  cashier_id: string;
  cashier_name: string;
  created_at: string;
  closed_at: string | null;
}

export interface SaleLogItem {
  name: string;
  price: number;
  quantity: number;
  modifiers?: { name: string; price: number; quantity: number; group_name?: string }[];
}

// Remote order log entry (from DB)
export interface RemoteOrderLog {
  id: string;
  location_name: string;
  fudo_order_id: number | null;
  external_id: string;
  total: number;
  delivery_fee: number;
  customer_name: string | null;
  status: string;
  created_at: string;
}
