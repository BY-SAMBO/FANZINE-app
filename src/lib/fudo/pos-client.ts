import { FUDO_CONFIG } from "./config";
import { fudoFetch } from "./client";
import type {
  FudoSale,
  FudoSalePayload,
  FudoSaleType,
  FudoItem,
  FudoItemPayload,
  FudoSubitem,
  FudoSubitemPayload,
  FudoPayment,
  FudoPaymentPayload,
  FudoPaymentMethod,
  FudoCashRegister,
  FudoJsonApiResponse,
} from "./pos-types";
import type { FudoResource } from "./types";

// --- Cash register cache ---

let cachedCashRegisterId: string | null = null;

async function getCashRegisterId(): Promise<string> {
  if (cachedCashRegisterId) return cachedCashRegisterId;

  const res = await fudoFetch<FudoJsonApiResponse<FudoCashRegister[]>>(
    `${FUDO_CONFIG.endpoints.cashRegisters}?page[size]=1&page[number]=1`
  );

  if (!res.data.length) {
    throw new Error("No cash registers found in Fudo");
  }

  cachedCashRegisterId = res.data[0].id;
  return cachedCashRegisterId;
}

// --- Sale type mapping ---

const FUDO_SALE_TYPE_MAP: Record<string, FudoSaleType> = {
  DINE_IN: "EAT-IN",
  "EAT-IN": "EAT-IN",
  TAKEAWAY: "TAKEAWAY",
};

// --- Sale orchestration ---

export async function createFudoSale(
  saleType: "TAKEAWAY" | "DINE_IN"
): Promise<FudoSale> {
  const fudoSaleType = FUDO_SALE_TYPE_MAP[saleType] || "TAKEAWAY";

  const payload: FudoSalePayload = {
    data: {
      type: "Sale",
      attributes: { saleType: fudoSaleType },
    },
  };

  // EAT-IN requires people + cashRegister relationship
  if (fudoSaleType === "EAT-IN") {
    payload.data.attributes.people = 1;
    const cashRegisterId = await getCashRegisterId();
    payload.data.relationships = {
      cashRegister: {
        data: { type: "CashRegister", id: cashRegisterId },
      },
    };
  }

  const res = await fudoFetch<FudoJsonApiResponse<FudoSale>>(
    FUDO_CONFIG.endpoints.sales,
    { method: "POST", body: JSON.stringify(payload) }
  );
  return res.data;
}

export async function addFudoItem(
  saleId: string,
  productId: string,
  quantity: number
): Promise<FudoItem> {
  const payload: FudoItemPayload = {
    data: {
      type: "Item",
      attributes: { quantity },
      relationships: {
        sale: { data: { type: "Sale", id: saleId } },
        product: { data: { type: "Product", id: productId } },
      },
    },
  };
  const res = await fudoFetch<FudoJsonApiResponse<FudoItem>>(
    FUDO_CONFIG.endpoints.items,
    { method: "POST", body: JSON.stringify(payload) }
  );
  return res.data;
}

export async function addFudoSubitem(
  itemId: string,
  toppingProductId: string,
  groupId: string,
  quantity: number
): Promise<FudoSubitem> {
  const payload: FudoSubitemPayload = {
    data: {
      type: "Subitem",
      attributes: { quantity },
      relationships: {
        item: { data: { type: "Item", id: itemId } },
        product: { data: { type: "Product", id: toppingProductId } },
        productModifiersGroup: { data: { type: "ProductModifiersGroup", id: groupId } },
      },
    },
  };
  const res = await fudoFetch<FudoJsonApiResponse<FudoSubitem>>(
    FUDO_CONFIG.endpoints.subitems,
    { method: "POST", body: JSON.stringify(payload) }
  );
  return res.data;
}

export async function addFudoPayment(
  saleId: string,
  paymentMethodId: string,
  amount: number
): Promise<FudoPayment> {
  const payload: FudoPaymentPayload = {
    data: {
      type: "Payment",
      attributes: { amount },
      relationships: {
        sale: { data: { type: "Sale", id: saleId } },
        paymentMethod: { data: { type: "PaymentMethod", id: paymentMethodId } },
      },
    },
  };
  const res = await fudoFetch<FudoJsonApiResponse<FudoPayment>>(
    FUDO_CONFIG.endpoints.payments,
    { method: "POST", body: JSON.stringify(payload) }
  );
  return res.data;
}

export async function closeFudoSale(saleId: string): Promise<FudoSale> {
  const res = await fudoFetch<FudoJsonApiResponse<FudoSale>>(
    `${FUDO_CONFIG.endpoints.sales}/${saleId}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        data: {
          type: "Sale",
          id: saleId,
          attributes: { saleState: "CLOSED" },
        },
      }),
    }
  );
  return res.data;
}

// --- Modifier discovery ---

/** ProductModifiersGroup included from product fetch */
interface FudoProductModifiersGroup {
  type: "ProductModifiersGroup";
  id: string;
  attributes: {
    name: string;
    title: string;
    maxQuantity: number;
    minQuantity: number;
    priceAggregation: string;
  };
  relationships: {
    productModifiers: {
      data: { type: "ProductModifier"; id: string }[];
    };
  };
}

/** ProductModifier from /product-modifiers endpoint */
interface FudoProductModifierItem extends FudoResource {
  type: "ProductModifier";
  attributes: {
    maxQuantity: number;
    price: number;
  };
  relationships: {
    product: { data: { type: "Product"; id: string } };
    productModifiersGroup: { data: { type: "ProductModifiersGroup"; id: string } };
  };
}

export interface ResolvedModifier {
  product_modifier_id: string; // PM id (used for subitems)
  product_fudo_id: string; // the topping product id
  group_fudo_id: string;
  group_name: string;
  modifier_name: string; // resolved from product name
  price: number;
  max_quantity: number;
}

/**
 * Get a product with its modifier groups included
 */
export async function getFudoProductWithModifiers(productId: string): Promise<{
  groups: FudoProductModifiersGroup[];
  hasModifiers: boolean;
}> {
  const res = await fudoFetch<FudoJsonApiResponse<FudoResource> & { included?: FudoProductModifiersGroup[] }>(
    `${FUDO_CONFIG.endpoints.products}/${productId}?include=productModifiersGroups`
  );

  const groups = (res.included || []).filter(
    (r): r is FudoProductModifiersGroup => r.type === "ProductModifiersGroup"
  );

  return {
    groups,
    hasModifiers: groups.length > 0,
  };
}

/**
 * Get all product-modifiers (the PM records that link topping products to groups)
 */
export async function getAllProductModifiers(): Promise<FudoProductModifierItem[]> {
  const all: FudoProductModifierItem[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const res = await fudoFetch<FudoJsonApiResponse<FudoProductModifierItem[]>>(
      `${FUDO_CONFIG.endpoints.productModifiers}?page[size]=${FUDO_CONFIG.pageSize}&page[number]=${page}`
    );
    all.push(...res.data);
    hasMore = res.data.length === FUDO_CONFIG.pageSize;
    page++;
  }

  return all;
}

// --- Payment methods ---

export async function getAllFudoPaymentMethods(): Promise<FudoPaymentMethod[]> {
  const all: FudoPaymentMethod[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const res = await fudoFetch<FudoJsonApiResponse<FudoPaymentMethod[]>>(
      `${FUDO_CONFIG.endpoints.paymentMethods}?page[size]=${FUDO_CONFIG.pageSize}&page[number]=${page}`
    );
    all.push(...res.data);
    hasMore = res.data.length === FUDO_CONFIG.pageSize;
    page++;
  }

  return all;
}
