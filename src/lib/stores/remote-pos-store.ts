import { create } from "zustand";
import type {
  Order,
  OrderItem,
  OrderModifier,
  ModifierGroup,
} from "@/types/pos";

interface ToppingSelection {
  product_id: string;
  product_name: string;
  fudo_product_id: string;
  groups: ModifierGroup[];
  selected: Record<string, number>;
}

interface RemoteLocation {
  id: string;
  name: string;
  address: string;
  delivery_fee: number;
}

interface RemotePosState {
  // Order (same structure as pos-store)
  order: Order;
  toppingSelection: ToppingSelection | null;

  // Delivery-specific fields
  location: RemoteLocation | null;
  customer_name: string;
  customer_phone: string;
  comment: string;

  // Computed
  grandTotal: () => number;

  // Order actions (mirrored from pos-store)
  addItem: (item: Omit<OrderItem, "id" | "modifiers">) => string;
  removeItem: (itemId: string) => void;
  updateItemQuantity: (itemId: string, quantity: number) => void;
  setItemModifiers: (itemId: string, modifiers: OrderModifier[]) => void;
  clearOrder: () => void;

  // Delivery actions
  setLocation: (loc: RemoteLocation | null) => void;
  setCustomerName: (name: string) => void;
  setCustomerPhone: (phone: string) => void;
  setComment: (comment: string) => void;

  // Topping selection actions (mirrored from pos-store)
  startToppingSelection: (
    productId: string,
    productName: string,
    fudoProductId: string,
    groups: ModifierGroup[]
  ) => void;
  toggleTopping: (modifierFudoId: string, active: boolean) => void;
  setToppingSelection: (selected: Record<string, number>) => void;
  confirmToppings: () => void;
  cancelToppings: () => void;
}

function generateId(): string {
  return crypto.randomUUID();
}

function calcTotal(items: OrderItem[]): number {
  return items.reduce((sum, item) => {
    const modTotal = item.modifiers.reduce(
      (ms, m) => ms + m.price * m.quantity,
      0
    );
    return sum + (item.price + modTotal) * item.quantity;
  }, 0);
}

const emptyOrder: Order = {
  items: [],
  sale_type: "TAKEAWAY", // Fudo maps delivery at Integrations level
  status: "building",
  total: 0,
  payment_method: null,
};

export const useRemotePosStore = create<RemotePosState>((set, get) => ({
  order: { ...emptyOrder },
  toppingSelection: null,
  location: null,
  customer_name: "",
  customer_phone: "",
  comment: "",

  grandTotal: () => {
    const state = get();
    return state.order.total + (state.location?.delivery_fee || 0);
  },

  // --- Order actions ---

  addItem: (item) => {
    const id = generateId();
    set((s) => {
      const newItems = [...s.order.items, { ...item, id, modifiers: [] }];
      return {
        order: { ...s.order, items: newItems, total: calcTotal(newItems) },
      };
    });
    return id;
  },

  removeItem: (itemId) => {
    set((s) => {
      const newItems = s.order.items.filter((i) => i.id !== itemId);
      return {
        order: { ...s.order, items: newItems, total: calcTotal(newItems) },
      };
    });
  },

  updateItemQuantity: (itemId, quantity) => {
    set((s) => {
      const newItems = s.order.items.map((i) =>
        i.id === itemId ? { ...i, quantity } : i
      );
      return {
        order: { ...s.order, items: newItems, total: calcTotal(newItems) },
      };
    });
  },

  setItemModifiers: (itemId, modifiers) => {
    set((s) => {
      const newItems = s.order.items.map((i) =>
        i.id === itemId ? { ...i, modifiers } : i
      );
      return {
        order: { ...s.order, items: newItems, total: calcTotal(newItems) },
      };
    });
  },

  clearOrder: () => {
    set({
      order: { ...emptyOrder },
      toppingSelection: null,
      customer_name: "",
      customer_phone: "",
      comment: "",
    });
  },

  // --- Delivery actions ---

  setLocation: (loc) => {
    set({ location: loc });
  },

  setCustomerName: (name) => {
    set({ customer_name: name });
  },

  setCustomerPhone: (phone) => {
    set({ customer_phone: phone });
  },

  setComment: (comment) => {
    set({ comment });
  },

  // --- Topping selection actions ---

  startToppingSelection: (productId, productName, fudoProductId, groups) => {
    set({
      toppingSelection: {
        product_id: productId,
        product_name: productName,
        fudo_product_id: fudoProductId,
        groups,
        selected: {},
      },
    });
  },

  toggleTopping: (modifierFudoId, active) => {
    set((s) => {
      if (!s.toppingSelection) return s;
      const selected = { ...s.toppingSelection.selected };

      if (active) {
        const group = s.toppingSelection.groups.find((g) =>
          g.options.some((o) => o.fudo_modifier_id === modifierFudoId)
        );
        if (group) {
          const currentCount = group.options.filter(
            (o) => selected[o.fudo_modifier_id]
          ).length;
          if (currentCount >= group.max_quantity) return s;
        }
        selected[modifierFudoId] = 1;
      } else {
        delete selected[modifierFudoId];
      }

      return {
        toppingSelection: { ...s.toppingSelection, selected },
      };
    });
  },

  setToppingSelection: (selected) => {
    set((s) => {
      if (!s.toppingSelection) return s;
      return {
        toppingSelection: { ...s.toppingSelection, selected },
      };
    });
  },

  confirmToppings: () => {
    const { toppingSelection, order } = get();
    if (!toppingSelection) return;

    const modifiers: OrderModifier[] = [];
    for (const group of toppingSelection.groups) {
      for (const opt of group.options) {
        const qty = toppingSelection.selected[opt.fudo_modifier_id];
        if (qty && qty > 0) {
          modifiers.push({
            fudo_modifier_id: opt.fudo_modifier_id,
            modifier_group_fudo_id: opt.modifier_group_fudo_id,
            topping_product_fudo_id: opt.topping_product_fudo_id,
            name: opt.name,
            price: opt.price,
            quantity: qty,
          });
        }
      }
    }

    const lastItem = [...order.items]
      .reverse()
      .find((i) => i.product_id === toppingSelection.product_id && i.modifiers.length === 0);

    if (lastItem) {
      get().setItemModifiers(lastItem.id, modifiers);
    }

    set({ toppingSelection: null });
  },

  cancelToppings: () => {
    const { toppingSelection, order } = get();
    if (!toppingSelection) return;

    const lastItem = [...order.items]
      .reverse()
      .find((i) => i.product_id === toppingSelection.product_id && i.modifiers.length === 0);

    if (lastItem) {
      get().removeItem(lastItem.id);
    }

    set({ toppingSelection: null });
  },
}));
