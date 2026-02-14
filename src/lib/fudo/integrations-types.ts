// Fudo Integrations API types (separate from Main API JSON:API types)

// --- Request types ---

export interface IntegrationsOrderPayload {
  order: {
    type: "delivery" | "pickup";
    typeOptions: {
      address: string;
      expectedTime?: string; // ISO 8601
    };
    customer: {
      name: string;
      phone?: string;
      email?: string;
    };
    items: IntegrationsOrderItem[];
    payment: {
      total: number;
      paymentMethod?: { id: number };
    };
    shippingCost?: number;
    comment?: string;
    externalId?: string;
  };
}

export interface IntegrationsOrderItem {
  quantity: number;
  price: number;
  product: { id: number };
  comment?: string;
  subitems?: IntegrationsSubitem[];
}

export interface IntegrationsSubitem {
  productId: number;
  productGroupId: number;
  quantity: number;
  price: number;
}

// --- Response types ---

export interface IntegrationsOrderResponse {
  order: { id: number };
}

export interface IntegrationsAuthResponse {
  token: string;
}

export interface IntegrationsErrorResponse {
  errors: string | Array<{ dataPointer: string; details: Record<string, string> }>;
}
