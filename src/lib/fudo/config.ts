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
  },

  // Retry config
  maxRetries: 2,
  retryDelayMs: 1000,
} as const;
