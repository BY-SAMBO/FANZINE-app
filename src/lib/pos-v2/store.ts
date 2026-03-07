import { create } from "zustand";
import type {
  Order,
  OrderItem,
  OrderModifier,
  OrderStatus,
  SaleType,
  PaymentMethod,
  ModifierGroup,
  ToppingSelection,
  RemoteLocation,
} from "@/types/pos-v2";
import { calcTotal } from "./calc";

interface PosV2State {
  // Order
  order: Order;

  // Topping selection — uses targetItemId for correct assignment
  toppingSelection: ToppingSelection | null;

  // Mode: caja vs delivery
  mode: "caja" | "delivery";

  // Delivery fields (only when mode=delivery)
  delivery: {
    location: RemoteLocation | null;
    customer_name: string;
    customer_phone: string;
    comment: string;
  };

  // Grand total (includes delivery fee if applicable)
  grandTotal: () => number;

  // Order actions
  addItem: (item: Omit<OrderItem, "id" | "modifiers">) => string;
  removeItem: (itemId: string) => void;
  updateItemQuantity: (itemId: string, quantity: number) => void;
  setItemModifiers: (itemId: string, modifiers: OrderModifier[]) => void;
  clearOrder: () => void;
  setSaleType: (type: SaleType) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  setStatus: (status: OrderStatus) => void;

  // Mode
  setMode: (mode: "caja" | "delivery") => void;

  // Delivery actions
  setLocation: (loc: RemoteLocation | null) => void;
  setCustomerName: (name: string) => void;
  setCustomerPhone: (phone: string) => void;
  setComment: (comment: string) => void;

  // Topping selection actions
  startToppingSelection: (
    targetItemId: string,
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

const emptyOrder: Order = {
  items: [],
  sale_type: "TAKEAWAY",
  status: "building",
  total: 0,
  payment_method: null,
};

const emptyDelivery = {
  location: null,
  customer_name: "",
  customer_phone: "",
  comment: "",
};

export const usePosV2Store = create<PosV2State>((set, get) => ({
  order: { ...emptyOrder },
  toppingSelection: null,
  mode: "caja",
  delivery: { ...emptyDelivery },

  grandTotal: () => {
    const state = get();
    return state.order.total + (state.delivery.location?.delivery_fee ?? 0);
  },

  // --- Order actions ---

  addItem: (item) => {
    const id = crypto.randomUUID();
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
      delivery: { ...emptyDelivery },
    });
  },

  setSaleType: (type) => {
    set((s) => ({ order: { ...s.order, sale_type: type } }));
  },

  setPaymentMethod: (method) => {
    set((s) => ({ order: { ...s.order, payment_method: method } }));
  },

  setStatus: (status) => {
    set((s) => ({ order: { ...s.order, status } }));
  },

  // --- Mode ---

  setMode: (mode) => {
    set({ mode });
  },

  // --- Delivery actions ---

  setLocation: (loc) => {
    set((s) => ({ delivery: { ...s.delivery, location: loc } }));
  },

  setCustomerName: (name) => {
    set((s) => ({ delivery: { ...s.delivery, customer_name: name } }));
  },

  setCustomerPhone: (phone) => {
    set((s) => ({ delivery: { ...s.delivery, customer_phone: phone } }));
  },

  setComment: (comment) => {
    set((s) => ({ delivery: { ...s.delivery, comment } }));
  },

  // --- Topping selection actions ---

  startToppingSelection: (targetItemId, productId, productName, fudoProductId, groups) => {
    set({
      toppingSelection: {
        targetItemId,
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
        // Enforce group max_quantity
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
    const { toppingSelection } = get();
    if (!toppingSelection) return;

    // Build modifiers from selection
    const modifiers: OrderModifier[] = [];
    for (const group of toppingSelection.groups) {
      for (const opt of group.options) {
        const qty = toppingSelection.selected[opt.fudo_modifier_id];
        if (qty && qty > 0) {
          modifiers.push({
            fudo_modifier_id: opt.fudo_modifier_id,
            modifier_group_fudo_id: opt.modifier_group_fudo_id,
            topping_product_fudo_id: opt.topping_product_fudo_id,
            group_name: group.name,
            name: opt.name,
            price: opt.price,
            quantity: qty,
          });
        }
      }
    }

    // Use targetItemId directly — no more "find last item" bug
    get().setItemModifiers(toppingSelection.targetItemId, modifiers);
    set({ toppingSelection: null });
  },

  cancelToppings: () => {
    const { toppingSelection } = get();
    if (!toppingSelection) return;

    // Remove the specific item that was pending toppings
    get().removeItem(toppingSelection.targetItemId);
    set({ toppingSelection: null });
  },
}));
