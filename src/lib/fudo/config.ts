// Fudo API configuration

export const FUDO_CONFIG = {
  apiUrl: process.env.FUDO_API_URL || "https://api.fu.do/v1alpha1",
  authUrl: process.env.FUDO_AUTH_URL || "https://auth.fu.do/api",
  apiKey: process.env.FUDO_API_KEY || "",
  apiSecret: process.env.FUDO_API_SECRET || "",

  // Token expires in 24h, refresh 5min before
  tokenMarginMs: 5 * 60 * 1000,

  // Pagination
  pageSize: 500,

  // Endpoints
  endpoints: {
    products: "/products",
    productCategories: "/product-categories",
    sales: "/sales",
    items: "/items",
    subitems: "/subitems",
    payments: "/payments",
    productModifiers: "/product-modifiers",
    modifiers: "/modifiers",
    modifierGroups: "/modifier-groups",
    paymentMethods: "/payment-methods",
    cashRegisters: "/cash-registers",
  },

  // Timeout config
  timeoutMs: 15_000,
  authTimeoutMs: 10_000,

  // Retry config
  maxRetries: 2,
  retryDelayMs: 1000,
} as const;
