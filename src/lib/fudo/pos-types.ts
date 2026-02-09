// Fudo POS API types (JSON:API format for sales, items, payments)

import type { FudoJsonApiResponse, FudoResource } from "./types";

// --- Sales ---

export interface FudoSale extends FudoResource {
  type: "sales";
  attributes: {
    state: string;
    total: number;
    createdAt: string;
    closedAt: string | null;
  };
}

export type FudoSaleType = "TAKEAWAY" | "EAT-IN";

export interface FudoSalePayload {
  data: {
    type: "Sale";
    attributes: {
      saleType: FudoSaleType;
      people?: number;
    };
    relationships?: {
      cashRegister?: { data: { type: "CashRegister"; id: string } };
    };
  };
}

export interface FudoCashRegister extends FudoResource {
  type: "cashRegisters";
  attributes: {
    name: string;
  };
}

// --- Items ---

export interface FudoItem extends FudoResource {
  type: "items";
  attributes: {
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  };
}

export interface FudoItemPayload {
  data: {
    type: "Item";
    attributes: {
      quantity: number;
    };
    relationships: {
      sale: { data: { type: "Sale"; id: string } };
      product: { data: { type: "Product"; id: string } };
    };
  };
}

// --- Subitems (modifiers on items) ---

export interface FudoSubitem extends FudoResource {
  type: "subitems";
  attributes: {
    quantity: number;
    unitPrice: number;
  };
}

export interface FudoSubitemPayload {
  data: {
    type: "Subitem";
    attributes: {
      quantity: number;
    };
    relationships: {
      item: { data: { type: "Item"; id: string } };
      product: { data: { type: "Product"; id: string } };
      productModifiersGroup: { data: { type: "ProductModifiersGroup"; id: string } };
    };
  };
}

// --- Payments ---

export interface FudoPayment extends FudoResource {
  type: "payments";
  attributes: {
    amount: number;
  };
}

export interface FudoPaymentPayload {
  data: {
    type: "Payment";
    attributes: {
      amount: number;
    };
    relationships: {
      sale: { data: { type: "Sale"; id: string } };
      paymentMethod: { data: { type: "PaymentMethod"; id: string } };
    };
  };
}

// --- Payment Methods ---

export interface FudoPaymentMethod extends FudoResource {
  type: "paymentMethods";
  attributes: {
    name: string;
    active: boolean;
    code: string;
    position: number | null;
  };
}

// --- Modifiers ---

export interface FudoModifier extends FudoResource {
  type: "modifiers";
  attributes: {
    name: string;
    price: number;
    maxQuantity: number;
  };
  relationships: {
    modifierGroup: {
      data: { type: "modifierGroups"; id: string } | null;
    };
  };
}

export interface FudoModifierGroup extends FudoResource {
  type: "modifierGroups";
  attributes: {
    name: string;
  };
}

// --- Product Modifiers (relationship) ---

export interface FudoProductModifier extends FudoResource {
  type: "productModifiers";
  attributes: Record<string, unknown>;
  relationships: {
    product: {
      data: { type: "products"; id: string };
    };
    modifier: {
      data: { type: "modifiers"; id: string };
    };
  };
}

// Re-export for convenience
export type { FudoJsonApiResponse };
