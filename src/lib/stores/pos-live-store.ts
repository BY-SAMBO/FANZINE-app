import { create } from "zustand";
import type {
  Order,
  OrderItem,
  OrderModifier,
  OrderStatus,
  SaleType,
  PaymentMethod,
  ModifierGroup,
} from "@/types/pos";

interface ToppingSelection {
  product_id: string;
  product_name: string;
  fudo_product_id: string;
  groups: ModifierGroup[];
  selected: Record<string, number>; // modifier_fudo_id -> quantity
}

interface PosState {
  // Order
  order: Order;
  // Topping selection (active when picking modifiers)
  toppingSelection: ToppingSelection | null;

  // Order actions
  addItem: (item: Omit<OrderItem, "id" | "modifiers">) => string;
  removeItem: (itemId: string) => void;
  updateItemQuantity: (itemId: string, quantity: number) => void;
  setItemModifiers: (itemId: string, modifiers: OrderModifier[]) => void;
  clearOrder: () => void;
  setSaleType: (type: SaleType) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  setStatus: (status: OrderStatus) => void;

  // Topping selection actions
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
  sale_type: "TAKEAWAY",
  status: "building",
  total: 0,
  payment_method: null,
};

export const usePosStore = create<PosState>((set, get) => ({
  order: { ...emptyOrder },
  toppingSelection: null,

  addItem: (item) => {
    const id = generateId();
    set((s) => {
      const newItems = [
        ...s.order.items,
        { ...item, id, modifiers: [] },
      ];
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
    set({ order: { ...emptyOrder }, toppingSelection: null });
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
        // Find the group this modifier belongs to and enforce max_quantity
        const group = s.toppingSelection.groups.find((g) =>
          g.options.some((o) => o.fudo_modifier_id === modifierFudoId)
        );
        if (group) {
          const currentCount = group.options.filter(
            (o) => selected[o.fudo_modifier_id]
          ).length;
          if (currentCount >= group.max_quantity) return s; // at limit
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
            name: opt.name,
            price: opt.price,
            quantity: qty,
          });
        }
      }
    }

    // Find last item with this product (most recently added)
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

    // Remove the item that was pending toppings
    const lastItem = [...order.items]
      .reverse()
      .find((i) => i.product_id === toppingSelection.product_id && i.modifiers.length === 0);

    if (lastItem) {
      get().removeItem(lastItem.id);
    }

    set({ toppingSelection: null });
  },
}));
