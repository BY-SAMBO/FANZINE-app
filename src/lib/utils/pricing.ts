import { DELIVERY_MARKUP } from "@/lib/config/constants";

/**
 * Calculate delivery price from sale price using markup factor
 */
export function calculateDeliveryPrice(precioVenta: number): number {
  return Math.round(precioVenta * DELIVERY_MARKUP / 100) * 100;
}

/**
 * Format price in COP (Colombian Pesos)
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

/**
 * Calculate price difference percentage
 */
export function priceDiffPercentage(local: number, remote: number): number {
  if (local === 0 && remote === 0) return 0;
  if (local === 0) return 100;
  return Math.round(((remote - local) / local) * 100 * 100) / 100;
}
