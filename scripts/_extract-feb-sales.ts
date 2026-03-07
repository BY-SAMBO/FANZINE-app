/**
 * Extract February 2026 sales data from Fudo API into a JSON file
 * for analysis agents to consume.
 * Usage: npx tsx scripts/_extract-feb-sales.ts
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { writeFileSync } from "fs";

const FUDO_API_URL = process.env.FUDO_API_URL || "https://api.fu.do/v1alpha1";
const FUDO_AUTH_URL = process.env.FUDO_AUTH_URL || "https://auth.fu.do/api";
const FUDO_API_KEY = process.env.FUDO_API_KEY!;
const FUDO_API_SECRET = process.env.FUDO_API_SECRET!;

const FEB_START = "2026-02-01T05:00:00Z";
const FEB_END = "2026-03-01T04:59:59Z";

async function getToken(): Promise<string> {
  for (let attempt = 0; attempt < 8; attempt++) {
    const res = await fetch(FUDO_AUTH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey: FUDO_API_KEY, apiSecret: FUDO_API_SECRET }),
    });
    if (res.status === 429) {
      const wait = 5000 * (attempt + 1);
      console.log(`Auth 429, esperando ${wait / 1000}s...`);
      await new Promise((r) => setTimeout(r, wait));
      continue;
    }
    if (!res.ok) throw new Error(`Auth failed: ${res.status}`);
    return (await res.json()).token;
  }
  throw new Error("Auth 429 after retries");
}

async function fudoGet(token: string, path: string, retries = 8): Promise<any> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(`${FUDO_API_URL}${path}`, {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    });
    if (res.status === 429) {
      const wait = Math.min(5000 * (attempt + 1), 30000);
      console.log(`  [429 attempt ${attempt + 1}, wait ${wait / 1000}s]`);
      await new Promise((r) => setTimeout(r, wait));
      continue;
    }
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Fudo ${path.substring(0, 80)} → ${res.status}: ${body.substring(0, 200)}`);
    }
    return res.json();
  }
  throw new Error(`429 after ${retries} retries`);
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  console.log("Conectando con Fudo API...");
  const token = await getToken();
  console.log("✓ Autenticado\n");

  // ─── Categories & Products ──────────────────────────────────────────
  const catRes = await fudoGet(token, `/product-categories?page[size]=100`);
  const categories: Record<string, string> = {};
  for (const cat of catRes.data) categories[cat.id] = cat.attributes.name;
  await delay(500);

  const allProducts: Record<string, { name: string; price: number; code: string; categoryId: string; categoryName: string }> = {};
  let page = 1;
  while (true) {
    const res = await fudoGet(token, `/products?page[size]=500&page[number]=${page}`);
    for (const p of res.data) {
      const catId = p.relationships?.productCategory?.data?.id || "";
      allProducts[p.id] = {
        name: p.attributes.name,
        price: p.attributes.price ?? 0,
        code: p.attributes.code || "",
        categoryId: catId,
        categoryName: categories[catId] || "Sin categoría",
      };
    }
    if (res.data.length < 500) break;
    page++;
  }
  console.log(`✓ ${Object.keys(allProducts).length} productos, ${Object.keys(categories).length} categorías\n`);

  // ─── Payment methods ──────────────────────────────────────────────
  await delay(500);
  const pmRes = await fudoGet(token, `/payment-methods?page[size]=100`);
  const paymentMethods: Record<string, string> = {};
  for (const pm of pmRes.data) paymentMethods[pm.id] = pm.attributes.name;

  // ─── Sales (CLOSED) ───────────────────────────────────────────────
  console.log("Fetching ventas CLOSED de febrero...");
  const rawSales: any[] = [];
  const rawIncluded: any[] = [];
  page = 1;
  while (true) {
    await delay(500);
    const url =
      `/sales?filter[createdAt]=and(gte.${FEB_START},lte.${FEB_END})` +
      `&filter[saleState]=in.(CLOSED)` +
      `&include=items,payments,payments.paymentMethod` +
      `&page[size]=250&page[number]=${page}&sort=-createdAt`;
    const res = await fudoGet(token, url);
    rawSales.push(...res.data);
    if (res.included) rawIncluded.push(...res.included);
    console.log(`   página ${page}: ${res.data.length} ventas`);
    if (res.data.length < 250) break;
    page++;
  }
  console.log(`✓ ${rawSales.length} ventas totales\n`);

  // ─── Index included ──────────────────────────────────────────────
  const itemsBySale = new Map<string, any[]>();
  const paymentsBySale = new Map<string, any[]>();

  for (const r of rawIncluded) {
    if (r.type === "Item") {
      const sid = r.relationships?.sale?.data?.id;
      if (sid) {
        if (!itemsBySale.has(sid)) itemsBySale.set(sid, []);
        itemsBySale.get(sid)!.push(r);
      }
    } else if (r.type === "Payment") {
      const sid = r.relationships?.sale?.data?.id;
      if (sid) {
        if (!paymentsBySale.has(sid)) paymentsBySale.set(sid, []);
        paymentsBySale.get(sid)!.push(r);
      }
    }
  }

  // ─── Build denormalized sales data ────────────────────────────────
  interface SaleItem {
    productId: string;
    productName: string;
    productCode: string;
    categoryId: string;
    categoryName: string;
    price: number;
    catalogPrice: number;
    quantity: number;
    total: number;
    canceled: boolean;
  }

  interface SalePayment {
    amount: number;
    methodId: string;
    methodName: string;
    canceled: boolean;
  }

  interface Sale {
    id: string;
    createdAt: string;
    createdAtCOT: string;
    date: string;
    hour: number;
    dayOfWeek: number;
    dayName: string;
    weekNumber: number;
    total: number;
    items: SaleItem[];
    payments: SalePayment[];
  }

  const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

  function getWeekNumber(d: Date): number {
    const start = new Date(2026, 0, 1);
    const diff = d.getTime() - start.getTime();
    return Math.ceil((diff / 86400000 + start.getDay() + 1) / 7);
  }

  const sales: Sale[] = [];

  for (const sale of rawSales) {
    const utcDate = new Date(sale.attributes.createdAt);
    const cotDate = new Date(utcDate.getTime() - 5 * 3600000);
    const dateStr = cotDate.toISOString().substring(0, 10);
    const hour = cotDate.getHours();
    const dayOfWeek = cotDate.getDay();

    const items: SaleItem[] = [];
    for (const item of itemsBySale.get(sale.id) || []) {
      const pid = item.relationships?.product?.data?.id || "";
      const prod = allProducts[pid];
      const qty = item.attributes.quantity ?? 1;
      const price = item.attributes.price ?? 0;
      items.push({
        productId: pid,
        productName: prod?.name || `Producto #${pid}`,
        productCode: prod?.code || "",
        categoryId: prod?.categoryId || "",
        categoryName: prod?.categoryName || "Sin categoría",
        price,
        catalogPrice: prod?.price || 0,
        quantity: qty,
        total: price * qty,
        canceled: item.attributes.canceled || false,
      });
    }

    const payments: SalePayment[] = [];
    for (const pay of paymentsBySale.get(sale.id) || []) {
      const pmId = pay.relationships?.paymentMethod?.data?.id || "";
      payments.push({
        amount: pay.attributes.amount ?? 0,
        methodId: pmId,
        methodName: paymentMethods[pmId] || `#${pmId}`,
        canceled: pay.attributes.canceled || false,
      });
    }

    sales.push({
      id: sale.id,
      createdAt: sale.attributes.createdAt,
      createdAtCOT: cotDate.toISOString(),
      date: dateStr,
      hour,
      dayOfWeek,
      dayName: dayNames[dayOfWeek],
      weekNumber: getWeekNumber(cotDate),
      total: sale.attributes.total ?? 0,
      items,
      payments,
    });
  }

  // ─── Write output ─────────────────────────────────────────────────
  const output = {
    metadata: {
      period: "Febrero 2026",
      startUTC: FEB_START,
      endUTC: FEB_END,
      totalSales: sales.length,
      totalRevenue: sales.reduce((s, sale) => s + sale.total, 0),
      extractedAt: new Date().toISOString(),
    },
    categories,
    products: allProducts,
    paymentMethods,
    sales,
  };

  const outPath = `${process.cwd()}/scripts/_feb-sales-data.json`;
  writeFileSync(outPath, JSON.stringify(output, null, 2), "utf-8");
  console.log(`✓ Datos exportados: ${outPath}`);
  console.log(`  ${sales.length} ventas, ${Object.keys(allProducts).length} productos`);
  console.log(`  Revenue: $${output.metadata.totalRevenue.toLocaleString()}`);
}

main().catch(console.error);
