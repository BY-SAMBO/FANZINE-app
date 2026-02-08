import { FUDO_CONFIG } from "./config";
import type {
  FudoAuthResponse,
  FudoJsonApiResponse,
  FudoProduct,
  FudoCategory,
  FudoProductPayload,
  FudoResource,
} from "./types";
import { FudoApiError } from "@/lib/utils/errors";

// Module-level token cache (persists in warm Vercel functions)
let cachedToken: string | null = null;
let tokenExpiresAt: number = 0;

/**
 * Authenticate with Fudo API and get bearer token
 */
async function authenticate(): Promise<string> {
  const now = Date.now();

  // Return cached token if still valid
  if (cachedToken && now < tokenExpiresAt) {
    return cachedToken;
  }

  const response = await fetch(FUDO_CONFIG.authUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      apiKey: FUDO_CONFIG.apiKey,
      apiSecret: FUDO_CONFIG.apiSecret,
    }),
  });

  if (!response.ok) {
    throw new FudoApiError(
      `Fudo auth failed: ${response.status}`,
      response.status
    );
  }

  const data: FudoAuthResponse = await response.json();
  cachedToken = data.token;
  // exp is a Unix timestamp string, refresh 5min before expiry
  tokenExpiresAt = parseInt(data.exp, 10) * 1000 - FUDO_CONFIG.tokenMarginMs;

  return cachedToken;
}

/**
 * Make an authenticated request to Fudo API
 */
async function fudoFetch<T>(
  path: string,
  options: RequestInit = {},
  retryCount = 0
): Promise<T> {
  const token = await authenticate();

  const response = await fetch(`${FUDO_CONFIG.apiUrl}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  // Retry on 401 (token expired)
  if (response.status === 401 && retryCount < FUDO_CONFIG.maxRetries) {
    cachedToken = null;
    tokenExpiresAt = 0;
    return fudoFetch<T>(path, options, retryCount + 1);
  }

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new FudoApiError(
      `Fudo API error: ${response.status} ${response.statusText}`,
      response.status,
      errorBody
    );
  }

  return response.json();
}

/**
 * Get all products from Fudo (handles pagination)
 */
export async function getAllFudoProducts(): Promise<FudoProduct[]> {
  const allProducts: FudoProduct[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await fudoFetch<FudoJsonApiResponse<FudoProduct[]>>(
      `${FUDO_CONFIG.endpoints.products}?page[size]=${FUDO_CONFIG.pageSize}&page[number]=${page}`
    );

    allProducts.push(...response.data);

    // Fudo doesn't return total count, so check if we got a full page
    hasMore = response.data.length === FUDO_CONFIG.pageSize;
    page++;
  }

  return allProducts;
}

/**
 * Get a single product from Fudo by ID
 */
export async function getFudoProduct(
  fudoId: string
): Promise<FudoProduct> {
  const response = await fudoFetch<FudoJsonApiResponse<FudoProduct>>(
    `${FUDO_CONFIG.endpoints.products}/${fudoId}`
  );
  return response.data;
}

/**
 * Update a product in Fudo (PATCH)
 */
export async function updateFudoProduct(
  fudoId: string,
  payload: FudoProductPayload
): Promise<FudoProduct> {
  const response = await fudoFetch<FudoJsonApiResponse<FudoProduct>>(
    `${FUDO_CONFIG.endpoints.products}/${fudoId}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  );
  return response.data;
}

/**
 * Create a product in Fudo (POST)
 */
export async function createFudoProduct(
  payload: FudoProductPayload
): Promise<FudoProduct> {
  const response = await fudoFetch<FudoJsonApiResponse<FudoProduct>>(
    FUDO_CONFIG.endpoints.products,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
  return response.data;
}

/**
 * Get all categories from Fudo
 */
export async function getAllFudoCategories(): Promise<FudoCategory[]> {
  const allCategories: FudoCategory[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await fudoFetch<FudoJsonApiResponse<FudoCategory[]>>(
      `${FUDO_CONFIG.endpoints.productCategories}?page[size]=${FUDO_CONFIG.pageSize}&page[number]=${page}`
    );

    allCategories.push(...response.data);
    hasMore = response.data.length === FUDO_CONFIG.pageSize;
    page++;
  }

  return allCategories;
}

/**
 * Get a specific Fudo resource by type and ID
 */
export async function getFudoResource<T extends FudoResource>(
  type: string,
  id: string
): Promise<T> {
  const response = await fudoFetch<FudoJsonApiResponse<T>>(`/${type}/${id}`);
  return response.data;
}
