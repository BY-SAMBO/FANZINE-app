import type { OrderItem } from "@/types/pos-v2";

/**
 * Calculate total for a list of order items, including modifier prices.
 */
export function calcTotal(items: OrderItem[]): number {
  return items.reduce((sum, item) => {
    const modTotal = item.modifiers.reduce(
      (ms, m) => ms + m.price * m.quantity,
      0
    );
    return sum + (item.price + modTotal) * item.quantity;
  }, 0);
}
