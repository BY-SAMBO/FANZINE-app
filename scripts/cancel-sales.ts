/**
 * One-off script: Cancel stuck "En curso" sales in Fudo
 * Strategy: cancel all items in each sale → sale auto-transitions to CANCELED
 * For sales with no items: just close them ($0).
 * Usage: npx tsx scripts/cancel-sales.ts
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const FUDO_API_URL = process.env.FUDO_API_URL || "https://api.fu.do/v1alpha1";
const FUDO_AUTH_URL = process.env.FUDO_AUTH_URL || "https://auth.fu.do/api";
const FUDO_API_KEY = process.env.FUDO_API_KEY!;
const FUDO_API_SECRET = process.env.FUDO_API_SECRET!;

const SALE_IDS = [
  "6153", "6152", "6151", "6150",
  "6144", "6143", "6142", "6141",
  "6128", "6120", "6116", "6115", "6113",
];

async function getToken(): Promise<string> {
  const res = await fetch(FUDO_AUTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey: FUDO_API_KEY, apiSecret: FUDO_API_SECRET }),
  });
  if (!res.ok) throw new Error(`Auth failed: ${res.status}`);
  const data = await res.json();
  return data.token;
}

async function fudoReq(token: string, path: string, opts: RequestInit = {}) {
  const res = await fetch(`${FUDO_API_URL}${path}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...opts.headers,
    },
  });
  const text = await res.text();
  return { ok: res.ok, status: res.status, body: text, json: () => JSON.parse(text) };
}

async function cancelSale(token: string, saleId: string) {
  // 1. Fetch sale with items
  const saleRes = await fudoReq(token, `/sales/${saleId}?include=items`);
  if (!saleRes.ok) {
    console.error(`❌ ${saleId} — fetch failed: ${saleRes.status} ${saleRes.body}`);
    return;
  }

  const saleData = saleRes.json();
  const state = saleData.data.attributes.saleState;

  if (state === "CANCELED" || state === "CLOSED") {
    console.log(`⏭️  ${saleId} — already ${state}`);
    return;
  }

  // Get items from included
  const items = (saleData.included || []).filter((r: any) => r.type === "Item");
  console.log(`🔍 ${saleId} — state: ${state}, items: ${items.length}`);

  if (items.length > 0) {
    // 2. Cancel each item
    for (const item of items) {
      if (item.attributes.canceled) {
        console.log(`   ⏭️  item ${item.id} already canceled`);
        continue;
      }
      const cancelRes = await fudoReq(token, `/items/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          data: {
            id: item.id,
            type: "Item",
            attributes: {
              canceled: true,
              cancellationComment: "Venta de prueba - cancelada",
            },
          },
        }),
      });
      if (cancelRes.ok) {
        console.log(`   ✅ item ${item.id} canceled`);
      } else {
        console.error(`   ❌ item ${item.id} — ${cancelRes.status}: ${cancelRes.body}`);
      }
    }

    // 3. Check if sale auto-canceled
    const checkRes = await fudoReq(token, `/sales/${saleId}`);
    if (checkRes.ok) {
      const newState = checkRes.json().data.attributes.saleState;
      console.log(`   → sale ${saleId} now: ${newState}`);
      if (newState === "CANCELED" || newState === "CLOSED") return;
    }
  }

  // 4. If no items or sale didn't auto-cancel, try closing it
  console.log(`   → Trying to close sale ${saleId}...`);
  const closeRes = await fudoReq(token, `/sales/${saleId}`, {
    method: "PATCH",
    body: JSON.stringify({
      data: {
        id: saleId,
        type: "Sale",
        attributes: { saleState: "CLOSED" },
      },
    }),
  });
  if (closeRes.ok) {
    console.log(`   ✅ sale ${saleId} closed`);
  } else {
    console.error(`   ❌ close failed: ${closeRes.status}: ${closeRes.body}`);
  }
}

async function main() {
  console.log(`Processing ${SALE_IDS.length} sales...\n`);
  const token = await getToken();

  for (const id of SALE_IDS) {
    await cancelSale(token, id);
    console.log();
  }

  console.log("Done!");
}

main().catch(console.error);
