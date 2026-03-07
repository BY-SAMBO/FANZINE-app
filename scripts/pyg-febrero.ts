/**
 * P&G (Pérdidas y Ganancias) — Febrero 2026
 * Genera un HTML con el reporte completo y lo abre en el navegador
 *
 * Usage: npx tsx scripts/pyg-febrero.ts
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { writeFileSync } from "fs";
import { execSync } from "child_process";

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

const $ = (n: number) =>
  `$${n.toLocaleString("es-CO", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const pct = (n: number, total: number) =>
  total === 0 ? "0.0%" : `${((n / total) * 100).toFixed(1)}%`;

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ── Main ─────────────────────────────────────────────────────────────────

async function main() {
  console.log("Conectando con Fudo API...");
  const token = await getToken();
  console.log("✓ Autenticado\n");

  // ─── VENTAS ──────────────────────────────────────────────────────────
  console.log("1. Ventas CLOSED de febrero...");
  const allSales: any[] = [];
  const allIncluded: any[] = [];
  let page = 1;
  while (true) {
    const url =
      `/sales?filter[createdAt]=and(gte.${FEB_START},lte.${FEB_END})` +
      `&filter[saleState]=in.(CLOSED)` +
      `&include=items,payments,payments.paymentMethod` +
      `&page[size]=250&page[number]=${page}&sort=-createdAt`;
    const res = await fudoGet(token, url);
    allSales.push(...res.data);
    if (res.included) allIncluded.push(...res.included);
    if (res.data.length < 250) break;
    page++;
    await delay(1000);
  }
  console.log(`   ✓ ${allSales.length} ventas\n`);

  await delay(1000);
  let canceledCount = 0;
  page = 1;
  while (true) {
    const r = await fudoGet(token, `/sales?filter[createdAt]=and(gte.${FEB_START},lte.${FEB_END})&filter[saleState]=in.(CANCELED)&page[size]=500&page[number]=${page}`);
    canceledCount += r.data.length;
    if (r.data.length < 500) break;
    page++;
    await delay(1000);
  }

  await delay(1000);
  const pmRes = await fudoGet(token, `/payment-methods?page[size]=100`);
  const paymentMethods = new Map<string, string>();
  for (const pm of pmRes.data) paymentMethods.set(pm.id, pm.attributes.name);

  await delay(1000);
  const catRes = await fudoGet(token, `/product-categories?page[size]=100`);
  const prodCategories = new Map<string, string>();
  for (const cat of catRes.data) prodCategories.set(cat.id, cat.attributes.name);

  await delay(1000);
  const allProducts = new Map<string, any>();
  page = 1;
  while (true) {
    const res = await fudoGet(token, `/products?page[size]=500&page[number]=${page}`);
    for (const p of res.data) allProducts.set(p.id, p);
    if (res.data.length < 500) break;
    page++;
  }

  // ─── GASTOS ──────────────────────────────────────────────────────────
  console.log("2. Gastos de febrero...");
  await delay(1000);
  const expCatRes = await fudoGet(token, `/expense-categories?page[size]=100&fields[expenseCategory]=name`);
  const expenseCategories = new Map<string, string>();
  for (const cat of expCatRes.data) expenseCategories.set(cat.id, cat.attributes.name);

  await delay(1000);
  const allExpenses: any[] = [];
  page = 1;
  while (true) {
    const res = await fudoGet(
      token,
      `/expenses?filter[date]=and(gte.2026-02-01,lte.2026-02-28)&fields[expense]=amount,date,description,expenseCategory,provider&include=expenseCategory,provider&page[size]=500&page[number]=${page}&sort=date`
    );
    allExpenses.push(...res.data);
    if (res.data.length < 500) break;
    page++;
    await delay(1000);
  }

  // Map providers from included
  const providerNames = new Map<string, string>();
  for (const exp of allExpenses) {
    // included doesn't return attrs with fields filter, so we use a separate fetch
  }
  // Fetch providers separately since fields filter breaks include
  await delay(1000);
  const provRes = await fudoGet(token, `/expenses?filter[date]=and(gte.2026-02-01,lte.2026-02-28)&include=provider&page[size]=500`);
  for (const inc of (provRes.included || [])) {
    if (inc.type === "Provider") providerNames.set(inc.id, inc.attributes?.name || "");
  }

  console.log(`   ✓ ${allExpenses.length} gastos\n`);

  // ─── Indexes ─────────────────────────────────────────────────────────
  const itemsBySale = new Map<string, any[]>();
  const paymentsBySale = new Map<string, any[]>();
  for (const r of allIncluded) {
    if (r.type === "Item") {
      const sid = r.relationships?.sale?.data?.id;
      if (sid) { if (!itemsBySale.has(sid)) itemsBySale.set(sid, []); itemsBySale.get(sid)!.push(r); }
    } else if (r.type === "Payment") {
      const sid = r.relationships?.sale?.data?.id;
      if (sid) { if (!paymentsBySale.has(sid)) paymentsBySale.set(sid, []); paymentsBySale.get(sid)!.push(r); }
    } else if (r.type === "Product") {
      if (!allProducts.has(r.id)) allProducts.set(r.id, r);
    }
  }

  // ─── Cálculos ventas ─────────────────────────────────────────────────
  let ventasBrutas = 0;
  let totalItems = 0;
  let totalCanceled = 0;
  const byProdCat = new Map<string, { ventas: number; qty: number }>();
  const byPayMethod = new Map<string, number>();
  const byDay = new Map<string, { ventas: number; txns: number }>();
  const byProduct = new Map<string, { name: string; qty: number; ventas: number }>();
  const byHour = new Map<number, { ventas: number; txns: number }>();

  for (const sale of allSales) {
    const total = sale.attributes.total ?? 0;
    ventasBrutas += total;
    const cot = new Date(new Date(sale.attributes.createdAt).getTime() - 5 * 3600000);
    const day = cot.toISOString().substring(0, 10);
    const hour = cot.getHours();

    const dd = byDay.get(day) || { ventas: 0, txns: 0 };
    dd.ventas += total; dd.txns += 1; byDay.set(day, dd);

    const hd = byHour.get(hour) || { ventas: 0, txns: 0 };
    hd.ventas += total; hd.txns += 1; byHour.set(hour, hd);

    for (const item of (itemsBySale.get(sale.id) || [])) {
      if (item.attributes.canceled) { totalCanceled++; continue; }
      const qty = item.attributes.quantity ?? 1;
      const itemTotal = (item.attributes.price ?? 0) * qty;
      totalItems++;
      const pid = item.relationships?.product?.data?.id;
      const prod = pid ? allProducts.get(pid) : undefined;
      const catId = prod?.relationships?.productCategory?.data?.id || "x";
      const catName = prodCategories.get(catId) || "Sin categoría";
      const cd = byProdCat.get(catName) || { ventas: 0, qty: 0 };
      cd.ventas += itemTotal; cd.qty += qty; byProdCat.set(catName, cd);
      const pn = prod?.attributes?.name || `#${pid}`;
      const pk = pid || `u-${item.id}`;
      const pd = byProduct.get(pk) || { name: pn, qty: 0, ventas: 0 };
      pd.qty += qty; pd.ventas += itemTotal; byProduct.set(pk, pd);
    }
    for (const pay of (paymentsBySale.get(sale.id) || [])) {
      if (pay.attributes.canceled) continue;
      const pmId = pay.relationships?.paymentMethod?.data?.id || "x";
      const pmName = paymentMethods.get(pmId) || `#${pmId}`;
      byPayMethod.set(pmName, (byPayMethod.get(pmName) || 0) + (pay.attributes.amount ?? 0));
    }
  }

  // ─── Cálculos gastos ─────────────────────────────────────────────────
  let totalGastos = 0;
  const byExpCat = new Map<string, { total: number; count: number }>();
  for (const exp of allExpenses) {
    const amount = exp.attributes.amount ?? 0;
    totalGastos += amount;

    // Si el proveedor es Yely → clasificar como Nómina Operativa
    const provId = exp.relationships?.provider?.data?.id;
    const provName = provId ? (providerNames.get(provId) || "") : "";
    const isYely = provName.toLowerCase().includes("yely");

    let catName: string;
    if (isYely) {
      catName = "Nómina Operativa";
    } else {
      const catId = exp.relationships?.expenseCategory?.data?.id;
      catName = catId ? (expenseCategories.get(catId) || `Cat #${catId}`) : "Sin categoría";
    }

    const cd = byExpCat.get(catName) || { total: 0, count: 0 };
    cd.total += amount; cd.count += 1; byExpCat.set(catName, cd);
  }

  const utilidad = ventasBrutas - totalGastos;

  // ─── Gastos por día ──────────────────────────────────────────────────
  const gastosByDay = new Map<string, number>();
  for (const exp of allExpenses) {
    const d = exp.attributes.date;
    gastosByDay.set(d, (gastosByDay.get(d) || 0) + (exp.attributes.amount ?? 0));
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  GENERAR HTML
  // ═══════════════════════════════════════════════════════════════════════

  const dayEntries = [...byDay.entries()].sort();
  const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  // P&G table
  const expCatSorted = [...byExpCat.entries()].sort((a, b) => b[1].total - a[1].total);
  const prodCatSorted = [...byProdCat.entries()].sort((a, b) => b[1].ventas - a[1].ventas);
  const pmSorted = [...byPayMethod.entries()].sort((a, b) => b[1] - a[1]);
  const totalPagos = pmSorted.reduce((s, [, v]) => s + v, 0);
  const prodSorted = [...byProduct.values()].sort((a, b) => b.ventas - a.ventas).slice(0, 20);
  const hoursSorted = [...byHour.entries()].sort((a, b) => a[0] - b[0]);
  const maxH = Math.max(...hoursSorted.map(([, d]) => d.ventas));

  // Weekly
  const weeks = new Map<string, { ventas: number; txns: number }>();
  for (const [day, data] of dayEntries) {
    const d = new Date(day + "T12:00:00-05:00");
    const ws = new Date(d); ws.setDate(d.getDate() - d.getDay() + 1);
    const wl = `Sem ${ws.toISOString().substring(5, 10)}`;
    const w = weeks.get(wl) || { ventas: 0, txns: 0 };
    w.ventas += data.ventas; w.txns += data.txns; weeks.set(wl, w);
  }

  // Day of week avg
  const byDow = new Map<number, { ventas: number; days: number; txns: number }>();
  for (const [day, data] of dayEntries) {
    const d = new Date(day + "T12:00:00-05:00");
    const dow = d.getDay();
    const dd = byDow.get(dow) || { ventas: 0, days: 0, txns: 0 };
    dd.ventas += data.ventas; dd.days += 1; dd.txns += data.txns; byDow.set(dow, dd);
  }

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>P&G Febrero 2026 — Cine & Tex-Mex</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; background: #0f0f0f; color: #e0e0e0; padding: 24px; max-width: 1100px; margin: 0 auto; }
  h1 { font-size: 28px; font-weight: 700; color: #fff; margin-bottom: 4px; }
  .subtitle { color: #888; font-size: 14px; margin-bottom: 32px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
  .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 24px; margin-bottom: 24px; }
  .card { background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 12px; padding: 20px; }
  .card h2 { font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #888; margin-bottom: 16px; font-weight: 600; }
  .big-number { font-size: 36px; font-weight: 700; color: #fff; }
  .big-number.green { color: #4ade80; }
  .big-number.red { color: #f87171; }
  .big-number.yellow { color: #facc15; }
  .big-label { font-size: 13px; color: #888; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { text-align: left; color: #888; font-weight: 600; padding: 8px 12px; border-bottom: 1px solid #333; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
  th.r, td.r { text-align: right; }
  td { padding: 7px 12px; border-bottom: 1px solid #1f1f1f; }
  tr:hover td { background: #222; }
  tr.total td { border-top: 2px solid #444; font-weight: 700; color: #fff; }
  .bar { display: inline-block; height: 14px; background: #3b82f6; border-radius: 2px; vertical-align: middle; min-width: 2px; }
  .bar.green { background: #4ade80; }
  .bar.yellow { background: #facc15; }
  .bar.orange { background: #fb923c; }
  .tag { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
  .tag.green { background: #166534; color: #4ade80; }
  .tag.red { background: #7f1d1d; color: #f87171; }
  .tag.yellow { background: #713f12; color: #facc15; }
  .pyg-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #222; }
  .pyg-row.indent { padding-left: 20px; font-size: 13px; color: #aaa; }
  .pyg-row.total { border-top: 2px solid #444; font-weight: 700; font-size: 18px; color: #fff; margin-top: 4px; padding-top: 12px; }
  .pyg-row .label { }
  .pyg-row .value { font-variant-numeric: tabular-nums; }
  .full { grid-column: 1 / -1; }
  .meta { text-align: center; color: #555; font-size: 12px; margin-top: 32px; padding-top: 16px; border-top: 1px solid #222; }
  @media (max-width: 768px) { .grid, .grid-3 { grid-template-columns: 1fr; } }
</style>
</head>
<body>

<h1>Estado de P&G — Febrero 2026</h1>
<p class="subtitle">Cine & Tex-Mex (Bogota)</p>

<!-- KPIs -->
<div class="grid-3">
  <div class="card">
    <h2>Ventas Brutas</h2>
    <div class="big-number">${$(ventasBrutas)}</div>
    <div class="big-label">${allSales.length} ventas cerradas</div>
  </div>
  <div class="card">
    <h2>Total Gastos</h2>
    <div class="big-number red">${$(totalGastos)}</div>
    <div class="big-label">${allExpenses.length} registros</div>
  </div>
  <div class="card">
    <h2>Utilidad Operativa</h2>
    <div class="big-number ${utilidad >= 0 ? "green" : "red"}">${$(utilidad)}</div>
    <div class="big-label">${pct(utilidad, ventasBrutas)} sobre ventas</div>
  </div>
</div>

<div class="grid-3">
  <div class="card">
    <h2>Ticket Promedio</h2>
    <div class="big-number">${$(allSales.length > 0 ? ventasBrutas / allSales.length : 0)}</div>
  </div>
  <div class="card">
    <h2>Items Vendidos</h2>
    <div class="big-number">${totalItems.toLocaleString("es-CO")}</div>
    <div class="big-label">${totalCanceled} cancelados</div>
  </div>
  <div class="card">
    <h2>Ventas Canceladas</h2>
    <div class="big-number yellow">${canceledCount}</div>
  </div>
</div>

<!-- P&G Detalle -->
<div class="grid">
  <div class="card full">
    <h2>Perdidas y Ganancias</h2>
    <div class="pyg-row" style="font-size:16px;font-weight:600;color:#fff">
      <span class="label">INGRESOS</span>
      <span class="value">${$(ventasBrutas)}</span>
    </div>
    <div class="pyg-row" style="height:12px;border:none"></div>
    <div class="pyg-row" style="font-size:16px;font-weight:600;color:#f87171">
      <span class="label">EGRESOS</span>
      <span class="value">${$(totalGastos)}</span>
    </div>
${expCatSorted
  .map(
    ([cat, data]) =>
      `    <div class="pyg-row indent">
      <span class="label">${cat} <span style="color:#555">(${data.count})</span></span>
      <span class="value">${$(data.total)}</span>
    </div>`
  )
  .join("\n")}
    <div class="pyg-row total">
      <span class="label">UTILIDAD OPERATIVA</span>
      <span class="value" style="color:${utilidad >= 0 ? "#4ade80" : "#f87171"}">${$(utilidad)} <span style="font-size:14px;color:#888">(${pct(utilidad, ventasBrutas)})</span></span>
    </div>
  </div>
</div>

<!-- Ventas por categoría + Métodos de pago -->
<div class="grid">
  <div class="card">
    <h2>Ventas por Categoria</h2>
    <table>
      <tr><th>Categoria</th><th class="r">Ventas</th><th class="r">%</th><th class="r">Qty</th></tr>
${prodCatSorted
  .map(
    ([cat, data]) =>
      `      <tr><td>${cat}</td><td class="r">${$(data.ventas)}</td><td class="r">${pct(data.ventas, ventasBrutas)}</td><td class="r">${data.qty}</td></tr>`
  )
  .join("\n")}
    </table>
  </div>
  <div class="card">
    <h2>Recaudo por Metodo de Pago</h2>
    <table>
      <tr><th>Metodo</th><th class="r">Monto</th><th class="r">%</th><th></th></tr>
${pmSorted
  .map(([pm, amount]) => {
    const p = totalPagos > 0 ? (amount / totalPagos) * 100 : 0;
    return `      <tr><td>${pm}</td><td class="r">${$(amount)}</td><td class="r">${pct(amount, totalPagos)}</td><td><span class="bar" style="width:${p * 1.5}px"></span></td></tr>`;
  })
  .join("\n")}
      <tr class="total"><td>TOTAL</td><td class="r">${$(totalPagos)}</td><td></td><td></td></tr>
    </table>
  </div>
</div>

<!-- Ventas por día -->
<div class="card" style="margin-bottom:24px">
  <h2>Ventas por Dia</h2>
  <table>
    <tr><th>Fecha</th><th>Dia</th><th class="r">Ventas</th><th class="r">Gastos</th><th class="r">Txns</th><th></th></tr>
${dayEntries
  .map(([day, data]) => {
    const d = new Date(day + "T12:00:00-05:00");
    const dn = dayNames[d.getDay()];
    const maxV = Math.max(...dayEntries.map(([, d]) => d.ventas));
    const w = maxV > 0 ? (data.ventas / maxV) * 200 : 0;
    const gasto = gastosByDay.get(day) || 0;
    const isSat = d.getDay() === 6;
    const isSun = d.getDay() === 0;
    const barColor = isSat || isSun ? "green" : "";
    return `    <tr><td>${day}</td><td>${dn}</td><td class="r">${$(data.ventas)}</td><td class="r" style="color:#f87171">${gasto > 0 ? $(gasto) : "-"}</td><td class="r">${data.txns}</td><td><span class="bar ${barColor}" style="width:${w}px"></span></td></tr>`;
  })
  .join("\n")}
  </table>
</div>

<!-- Hora + Top Productos -->
<div class="grid">
  <div class="card">
    <h2>Distribucion por Hora</h2>
    <table>
      <tr><th>Hora</th><th class="r">Ventas</th><th class="r">Txns</th><th></th></tr>
${hoursSorted
  .map(([h, data]) => {
    const w = maxH > 0 ? (data.ventas / maxH) * 120 : 0;
    return `      <tr><td>${String(h).padStart(2, "0")}:00</td><td class="r">${$(data.ventas)}</td><td class="r">${data.txns}</td><td><span class="bar orange" style="width:${w}px"></span></td></tr>`;
  })
  .join("\n")}
    </table>
  </div>
  <div class="card">
    <h2>Top 20 Productos</h2>
    <table>
      <tr><th>Producto</th><th class="r">Ventas</th><th class="r">%</th><th class="r">Qty</th></tr>
${prodSorted
  .map(
    (p) =>
      `      <tr><td>${p.name}</td><td class="r">${$(p.ventas)}</td><td class="r">${pct(p.ventas, ventasBrutas)}</td><td class="r">${p.qty}</td></tr>`
  )
  .join("\n")}
    </table>
  </div>
</div>

<!-- Semanal + Promedios -->
<div class="grid">
  <div class="card">
    <h2>Resumen Semanal</h2>
    <table>
      <tr><th>Semana</th><th class="r">Ventas</th><th class="r">Txns</th><th class="r">Prom/txn</th></tr>
${[...weeks.entries()]
  .map(
    ([w, d]) =>
      `      <tr><td>${w}</td><td class="r">${$(d.ventas)}</td><td class="r">${d.txns}</td><td class="r">${$(d.txns > 0 ? d.ventas / d.txns : 0)}</td></tr>`
  )
  .join("\n")}
    </table>
  </div>
  <div class="card">
    <h2>Promedio por Dia de Semana</h2>
    <table>
      <tr><th>Dia</th><th class="r">Prom/dia</th><th class="r">Txns/dia</th><th class="r">Dias</th></tr>
${[0, 1, 2, 3, 4, 5, 6]
  .filter((dow) => byDow.has(dow))
  .map((dow) => {
    const d = byDow.get(dow)!;
    return `      <tr><td>${dayNames[dow]}</td><td class="r">${$(d.ventas / d.days)}</td><td class="r">${(d.txns / d.days).toFixed(0)}</td><td class="r">${d.days}</td></tr>`;
  })
  .join("\n")}
    </table>
  </div>
</div>

<div class="meta">
  Generado: ${new Date().toISOString()} &mdash; Fuente: Fudo API (ventas CLOSED + expenses reales)
</div>

</body>
</html>`;

  const outPath = `${process.cwd()}/pyg-febrero-2026.html`;
  writeFileSync(outPath, html, "utf-8");
  console.log(`\n✓ HTML generado: ${outPath}`);

  execSync(`open "${outPath}"`);
  console.log("✓ Abierto en navegador");
}

main().catch(console.error);
