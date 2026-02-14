// Fudo Integrations API client — separate from Main API (client.ts)
// Uses per-location clientId/clientSecret, different auth header, plain JSON (not JSON:API)

import type {
  IntegrationsOrderPayload,
  IntegrationsOrderResponse,
  IntegrationsAuthResponse,
} from "./integrations-types";
import { FudoApiError } from "@/lib/utils/errors";

const INTEGRATIONS_BASE_URL = "https://integrations.fu.do/fudo";
const TOKEN_LIFETIME_MS = 24 * 60 * 60 * 1000; // 24h
const TOKEN_MARGIN_MS = 30 * 60 * 1000; // refresh 30min before expiry
const TIMEOUT_MS = 15_000;
const AUTH_TIMEOUT_MS = 10_000;
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

// Token cache per clientId (multiple locations can coexist)
interface TokenEntry {
  token: string;
  expiresAt: number;
}
const tokenCache = new Map<string, TokenEntry>();

/**
 * Authenticate with Fudo Integrations API
 */
async function authenticate(
  clientId: string,
  clientSecret: string
): Promise<string> {
  const cached = tokenCache.get(clientId);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.token;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AUTH_TIMEOUT_MS);

  try {
    const response = await fetch(`${INTEGRATIONS_BASE_URL}/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, clientSecret }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new FudoApiError(
        `Integrations auth failed: ${response.status}`,
        response.status,
        body
      );
    }

    const data: IntegrationsAuthResponse = await response.json();
    const entry: TokenEntry = {
      token: data.token,
      expiresAt: Date.now() + TOKEN_LIFETIME_MS - TOKEN_MARGIN_MS,
    };
    tokenCache.set(clientId, entry);
    return data.token;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new FudoApiError("Integrations auth timeout", 408);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Make an authenticated request to Fudo Integrations API
 */
async function integrationsFetch<T>(
  clientId: string,
  clientSecret: string,
  path: string,
  options: RequestInit = {},
  retryCount = 0
): Promise<T> {
  const token = await authenticate(clientId, clientSecret);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response: Response;

  try {
    response = await fetch(`${INTEGRATIONS_BASE_URL}${path}`, {
      ...options,
      headers: {
        "Fudo-External-App-Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      if (retryCount < MAX_RETRIES) {
        console.warn(`[Integrations] Timeout on ${path}, retrying (${retryCount + 1}/${MAX_RETRIES})`);
        return integrationsFetch<T>(clientId, clientSecret, path, options, retryCount + 1);
      }
      throw new FudoApiError(`Integrations API timeout on ${path}`, 408);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

  // Retry on 401 (token expired)
  if (response.status === 401 && retryCount < MAX_RETRIES) {
    tokenCache.delete(clientId);
    return integrationsFetch<T>(clientId, clientSecret, path, options, retryCount + 1);
  }

  // Retry on 5xx
  if (response.status >= 500 && retryCount < MAX_RETRIES) {
    const delay = RETRY_DELAY_MS * (retryCount + 1);
    console.warn(`[Integrations] ${response.status} on ${path}, retrying in ${delay}ms`);
    await new Promise((r) => setTimeout(r, delay));
    return integrationsFetch<T>(clientId, clientSecret, path, options, retryCount + 1);
  }

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new FudoApiError(
      `Integrations API error: ${response.status} ${response.statusText}`,
      response.status,
      errorBody
    );
  }

  return response.json();
}

/**
 * Create an order via the Fudo Integrations API
 */
export async function createIntegrationsOrder(
  clientId: string,
  clientSecret: string,
  payload: IntegrationsOrderPayload
): Promise<IntegrationsOrderResponse> {
  return integrationsFetch<IntegrationsOrderResponse>(
    clientId,
    clientSecret,
    "/orders",
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}
