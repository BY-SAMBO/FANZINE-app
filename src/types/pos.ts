// POS types for the dual-screen cashier system

export type SaleType = "TAKEAWAY" | "DINE_IN";

export type PaymentMethod = "cash" | "card" | "nequi" | "daviplata" | "llaves";

export type OrderStatus = "building" | "paying" | "submitted" | "error";

export interface OrderModifier {
  fudo_modifier_id: string;
  modifier_group_fudo_id: string;
  topping_product_fudo_id: string;
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

// Supabase Realtime broadcast events between caja and cliente screens
export type PosEventType =
  | "show_toppings"
  | "topping_toggled"
  | "toppings_confirmed"
  | "clear"
  | "order_updated";

export interface PosEventShowToppings {
  type: "show_toppings";
  product_id: string;
  product_name: string;
  modifiers: ModifierGroup[];
  selected: Record<string, number>; // modifier_fudo_id -> quantity
}

export interface PosEventToppingToggled {
  type: "topping_toggled";
  modifier_fudo_id: string;
  modifier_group_fudo_id: string;
  active: boolean;
}

export interface PosEventToppingsConfirmed {
  type: "toppings_confirmed";
  selected: Record<string, number>;
}

export interface PosEventClear {
  type: "clear";
}

export interface PosEventOrderUpdated {
  type: "order_updated";
  items: OrderItem[];
  total: number;
}

export type PosEvent =
  | PosEventShowToppings
  | PosEventToppingToggled
  | PosEventToppingsConfirmed
  | PosEventClear
  | PosEventOrderUpdated;

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
  max_quantity: number; // group-level max selections (e.g. 4 toppings total)
  min_quantity: number; // group-level min selections (e.g. 1 required)
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
}
