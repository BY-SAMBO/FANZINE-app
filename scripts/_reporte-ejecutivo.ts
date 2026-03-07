import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { execSync } from "child_process";

// ─── Load Data ───────────────────────────────────────────────────────────────
const raw = JSON.parse(
  readFileSync(__dirname + "/_feb-sales-data.json", "utf-8")
);
const { metadata, categories, products, paymentMethods, sales } = raw;

// ─── Types ───────────────────────────────────────────────────────────────────
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
interface Payment {
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
  payments: Payment[];
}

// Filter out canceled items everywhere
const allSales: Sale[] = sales;
const activeSales = allSales.filter((s: Sale) => s.total > 0);

// ─── Helper functions ────────────────────────────────────────────────────────
function fmt(n: number): string {
  return "$" + n.toLocaleString("es-CO");
}
function pct(n: number, total: number): string {
  if (total === 0) return "0.0%";
  return ((n / total) * 100).toFixed(1) + "%";
}
function pctNum(n: number, total: number): number {
  if (total === 0) return 0;
  return (n / total) * 100;
}

// ─── 1. GENERAL KPIs ────────────────────────────────────────────────────────
const totalRevenue = activeSales.reduce((s: number, v: Sale) => s + v.total, 0);
const totalSales = activeSales.length;
const avgTicket = Math.round(totalRevenue / totalSales);
const totalItems = activeSales.reduce(
  (s: number, v: Sale) =>
    s + v.items.filter((i: SaleItem) => !i.canceled).reduce((a: number, i: SaleItem) => a + i.quantity, 0),
  0
);
const avgItemsPerSale = (totalItems / totalSales).toFixed(1);

// ─── 2. CATEGORY ANALYSIS ───────────────────────────────────────────────────
// Define main categories (exclude toppings/adicionales)
const mainCatIds = ["5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "18"];
const addonCatIds = ["15", "16", "17"];

interface CatStats {
  id: string;
  name: string;
  revenue: number;
  units: number;
  transactions: number;
}

const catMap: Record<string, CatStats> = {};
for (const s of activeSales) {
  for (const item of s.items) {
    if (item.canceled) continue;
    const cid = item.categoryId;
    if (!catMap[cid]) {
      catMap[cid] = {
        id: cid,
        name: item.categoryName,
        revenue: 0,
        units: 0,
        transactions: 0,
      };
    }
    catMap[cid].revenue += item.total;
    catMap[cid].units += item.quantity;
    catMap[cid].transactions++;
  }
}

const mainCats = Object.values(catMap)
  .filter((c) => mainCatIds.includes(c.id))
  .sort((a, b) => b.revenue - a.revenue);
const mainRevenue = mainCats.reduce((s, c) => s + c.revenue, 0);

// ─── 3. CRISPETAS DEEP DIVE ─────────────────────────────────────────────────
const crispetaItems = activeSales.flatMap((s: Sale) =>
  s.items.filter((i: SaleItem) => !i.canceled && i.categoryId === "7")
);

// Classify by size and flavor
interface CrispetaGroup {
  size: string;
  flavor: string;
  name: string;
  revenue: number;
  units: number;
  price: number;
}
const crispetaGroups: CrispetaGroup[] = [];
const crispetaProductMap: Record<string, CrispetaGroup> = {};

for (const item of crispetaItems) {
  const name = item.productName;
  if (!crispetaProductMap[item.productId]) {
    let size = "Otro";
    let flavor = "Otro";
    if (name.includes("Personal")) size = "Personal";
    else if (name.includes("Mediana")) size = "Mediana";
    else if (name.includes("Familiar")) size = "Familiar";

    if (name.includes("SAL")) flavor = "Sal";
    else if (name.includes("CARAMELO")) flavor = "Caramelo";
    else if (name.includes("MIXTAS")) flavor = "Mixtas";

    if (name === "Minipancakes") {
      size = "Otro";
      flavor = "Minipancakes";
    }

    crispetaProductMap[item.productId] = {
      size,
      flavor,
      name: item.productName,
      revenue: 0,
      units: 0,
      price: item.catalogPrice,
    };
  }
  crispetaProductMap[item.productId].revenue += item.total;
  crispetaProductMap[item.productId].units += item.quantity;
}

const crispetaProducts = Object.values(crispetaProductMap).sort(
  (a, b) => b.revenue - a.revenue
);
const crispetaTotalRevenue = crispetaProducts.reduce((s, c) => s + c.revenue, 0);
const crispetaTotalUnits = crispetaProducts.reduce((s, c) => s + c.units, 0);

// Size breakdown
const sizeMap: Record<string, { units: number; revenue: number }> = {};
for (const p of crispetaProducts) {
  if (!sizeMap[p.size]) sizeMap[p.size] = { units: 0, revenue: 0 };
  sizeMap[p.size].units += p.units;
  sizeMap[p.size].revenue += p.revenue;
}

// Flavor breakdown
const flavorMap: Record<string, { units: number; revenue: number }> = {};
for (const p of crispetaProducts) {
  if (!flavorMap[p.flavor]) flavorMap[p.flavor] = { units: 0, revenue: 0 };
  flavorMap[p.flavor].units += p.units;
  flavorMap[p.flavor].revenue += p.revenue;
}

// ─── 4. HELADOS DEEP DIVE ───────────────────────────────────────────────────
const heladoItems = activeSales.flatMap((s: Sale) =>
  s.items.filter((i: SaleItem) => !i.canceled && i.categoryId === "12")
);
const heladoProductMap: Record<
  string,
  { name: string; revenue: number; units: number; price: number }
> = {};
for (const item of heladoItems) {
  if (!heladoProductMap[item.productId]) {
    heladoProductMap[item.productId] = {
      name: item.productName,
      revenue: 0,
      units: 0,
      price: item.catalogPrice,
    };
  }
  heladoProductMap[item.productId].revenue += item.total;
  heladoProductMap[item.productId].units += item.quantity;
}
const heladoProducts = Object.values(heladoProductMap).sort(
  (a, b) => b.revenue - a.revenue
);
const heladoTotalRevenue = heladoProducts.reduce((s, p) => s + p.revenue, 0);
const heladoTotalUnits = heladoProducts.reduce((s, p) => s + p.units, 0);

// Cono vs Premium
const conoProducts = heladoProducts.filter(
  (p) => p.name.toLowerCase().includes("cono")
);
const premiumHelados = heladoProducts.filter(
  (p) =>
    p.name.toLowerCase().includes("sundae") ||
    p.name.toLowerCase().includes("sandwich")
);
const galletaProducts = heladoProducts.filter(
  (p) => p.name.toLowerCase().includes("galleta")
);
const conoUnits = conoProducts.reduce((s, p) => s + p.units, 0);
const conoRevenue = conoProducts.reduce((s, p) => s + p.revenue, 0);
const premiumUnits = premiumHelados.reduce((s, p) => s + p.units, 0);
const premiumRevenue = premiumHelados.reduce((s, p) => s + p.revenue, 0);

// ─── 5. COMIDAS ANALYSIS ────────────────────────────────────────────────────
// Perros
const perroItems = activeSales.flatMap((s: Sale) =>
  s.items.filter((i: SaleItem) => !i.canceled && i.categoryId === "5")
);
const perroProductMap: Record<
  string,
  { name: string; revenue: number; units: number; price: number }
> = {};
for (const item of perroItems) {
  if (!perroProductMap[item.productId]) {
    perroProductMap[item.productId] = {
      name: item.productName,
      revenue: 0,
      units: 0,
      price: item.catalogPrice,
    };
  }
  perroProductMap[item.productId].revenue += item.total;
  perroProductMap[item.productId].units += item.quantity;
}
const perroProducts = Object.values(perroProductMap).sort(
  (a, b) => b.revenue - a.revenue
);
const perroTotalRevenue = perroProducts.reduce((s, p) => s + p.revenue, 0);
const perroTotalUnits = perroProducts.reduce((s, p) => s + p.units, 0);

// Nachos
const nachoItems = activeSales.flatMap((s: Sale) =>
  s.items.filter((i: SaleItem) => !i.canceled && i.categoryId === "9")
);
const nachoProductMap: Record<
  string,
  { name: string; revenue: number; units: number; price: number }
> = {};
for (const item of nachoItems) {
  if (!nachoProductMap[item.productId]) {
    nachoProductMap[item.productId] = {
      name: item.productName,
      revenue: 0,
      units: 0,
      price: item.catalogPrice,
    };
  }
  nachoProductMap[item.productId].revenue += item.total;
  nachoProductMap[item.productId].units += item.quantity;
}
const nachoProducts = Object.values(nachoProductMap).sort(
  (a, b) => b.revenue - a.revenue
);
const nachoTotalRevenue = nachoProducts.reduce((s, p) => s + p.revenue, 0);
const nachoTotalUnits = nachoProducts.reduce((s, p) => s + p.units, 0);

// Tacos
const tacoItems = activeSales.flatMap((s: Sale) =>
  s.items.filter((i: SaleItem) => !i.canceled && i.categoryId === "10")
);
const tacoProductMap: Record<
  string,
  { name: string; revenue: number; units: number; price: number }
> = {};
for (const item of tacoItems) {
  if (!tacoProductMap[item.productId]) {
    tacoProductMap[item.productId] = {
      name: item.productName,
      revenue: 0,
      units: 0,
      price: item.catalogPrice,
    };
  }
  tacoProductMap[item.productId].revenue += item.total;
  tacoProductMap[item.productId].units += item.quantity;
}
const tacoProducts = Object.values(tacoProductMap).sort(
  (a, b) => b.revenue - a.revenue
);
const tacoTotalRevenue = tacoProducts.reduce((s, p) => s + p.revenue, 0);
const tacoTotalUnits = tacoProducts.reduce((s, p) => s + p.units, 0);

// Bebidas
const bebidaItems = activeSales.flatMap((s: Sale) =>
  s.items.filter((i: SaleItem) => !i.canceled && i.categoryId === "11")
);
const bebidaProductMap: Record<
  string,
  { name: string; revenue: number; units: number; price: number }
> = {};
for (const item of bebidaItems) {
  if (!bebidaProductMap[item.productId]) {
    bebidaProductMap[item.productId] = {
      name: item.productName,
      revenue: 0,
      units: 0,
      price: item.catalogPrice,
    };
  }
  bebidaProductMap[item.productId].revenue += item.total;
  bebidaProductMap[item.productId].units += item.quantity;
}
const bebidaProducts = Object.values(bebidaProductMap).sort(
  (a, b) => b.revenue - a.revenue
);
const bebidaTotalRevenue = bebidaProducts.reduce((s, p) => s + p.revenue, 0);
const bebidaTotalUnits = bebidaProducts.reduce((s, p) => s + p.units, 0);

// Chicanitas
const chicaItems = activeSales.flatMap((s: Sale) =>
  s.items.filter((i: SaleItem) => !i.canceled && i.categoryId === "6")
);
const chicaTotalRevenue = chicaItems.reduce((s: number, i: SaleItem) => s + i.total, 0);
const chicaTotalUnits = chicaItems.reduce((s: number, i: SaleItem) => s + i.quantity, 0);

// Milkshakes
const milkItems = activeSales.flatMap((s: Sale) =>
  s.items.filter((i: SaleItem) => !i.canceled && i.categoryId === "8")
);
const milkTotalRevenue = milkItems.reduce((s: number, i: SaleItem) => s + i.total, 0);
const milkTotalUnits = milkItems.reduce((s: number, i: SaleItem) => s + i.quantity, 0);

// Tex Mex (cat 13) - includes salsas
const texmexItems = activeSales.flatMap((s: Sale) =>
  s.items.filter((i: SaleItem) => !i.canceled && i.categoryId === "13")
);
const salsaItems = texmexItems.filter((i: SaleItem) =>
  i.productName.toLowerCase().includes("salsa")
);
const texmexFoodItems = texmexItems.filter(
  (i: SaleItem) => !i.productName.toLowerCase().includes("salsa")
);
const texmexFoodRevenue = texmexFoodItems.reduce((s: number, i: SaleItem) => s + i.total, 0);
const salsaRevenue = salsaItems.reduce((s: number, i: SaleItem) => s + i.total, 0);
const salsaUnits = salsaItems.reduce((s: number, i: SaleItem) => s + i.quantity, 0);

// Postres
const postreItems = activeSales.flatMap((s: Sale) =>
  s.items.filter(
    (i: SaleItem) => !i.canceled && i.categoryId === "14" && i.price > 0
  )
);
const postreProductMap: Record<
  string,
  { name: string; revenue: number; units: number; price: number }
> = {};
for (const item of postreItems) {
  if (!postreProductMap[item.productId]) {
    postreProductMap[item.productId] = {
      name: item.productName,
      revenue: 0,
      units: 0,
      price: item.catalogPrice,
    };
  }
  postreProductMap[item.productId].revenue += item.total;
  postreProductMap[item.productId].units += item.quantity;
}
const postreProducts = Object.values(postreProductMap).sort(
  (a, b) => b.revenue - a.revenue
);
const postreTotalRevenue = postreProducts.reduce((s, p) => s + p.revenue, 0);
const postreTotalUnits = postreProducts.reduce((s, p) => s + p.units, 0);

// Papas Fritas
const papasItems = activeSales.flatMap((s: Sale) =>
  s.items.filter((i: SaleItem) => !i.canceled && i.categoryId === "18")
);
const papasTotalRevenue = papasItems.reduce((s: number, i: SaleItem) => s + i.total, 0);
const papasTotalUnits = papasItems.reduce((s: number, i: SaleItem) => s + i.quantity, 0);

// ─── 6. TEMPORAL ANALYSIS ───────────────────────────────────────────────────
// By day of week
const dayNames = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];
const dayStats: Record<
  number,
  { revenue: number; sales: number; items: number }
> = {};
for (let d = 0; d < 7; d++)
  dayStats[d] = { revenue: 0, sales: 0, items: 0 };
for (const s of activeSales) {
  dayStats[s.dayOfWeek].revenue += s.total;
  dayStats[s.dayOfWeek].sales++;
  dayStats[s.dayOfWeek].items += s.items
    .filter((i: SaleItem) => !i.canceled)
    .reduce((a: number, i: SaleItem) => a + i.quantity, 0);
}

// Count how many of each day appeared in Feb 2026
const dayCounts: Record<number, number> = {};
for (let d = 0; d < 7; d++) dayCounts[d] = 0;
// Feb 2026: Feb 1 = Sunday (dayOfWeek 0)
// Feb 1 Sun, Feb 2 Mon, ..., Feb 7 Sat, Feb 8 Sun...
// Actually let's compute from the data
const uniqueDates: Record<string, number> = {};
for (const s of activeSales) {
  uniqueDates[s.date] = s.dayOfWeek;
}
for (const [, dow] of Object.entries(uniqueDates)) {
  dayCounts[dow]++;
}

// By hour
const hourStats: Record<
  number,
  { revenue: number; sales: number }
> = {};
for (let h = 0; h < 24; h++) hourStats[h] = { revenue: 0, sales: 0 };
for (const s of activeSales) {
  hourStats[s.hour].revenue += s.total;
  hourStats[s.hour].sales++;
}

// By date (daily trend)
const dateStats: Record<
  string,
  { revenue: number; sales: number }
> = {};
for (const s of activeSales) {
  if (!dateStats[s.date]) dateStats[s.date] = { revenue: 0, sales: 0 };
  dateStats[s.date].revenue += s.total;
  dateStats[s.date].sales++;
}
const sortedDates = Object.entries(dateStats).sort((a, b) =>
  a[0].localeCompare(b[0])
);

// Week over week
const weekStats: Record<
  number,
  { revenue: number; sales: number }
> = {};
for (const s of activeSales) {
  if (!weekStats[s.weekNumber])
    weekStats[s.weekNumber] = { revenue: 0, sales: 0 };
  weekStats[s.weekNumber].revenue += s.total;
  weekStats[s.weekNumber].sales++;
}

// ─── 7. PAYMENT METHODS ─────────────────────────────────────────────────────
const paymentStats: Record<
  string,
  { name: string; amount: number; count: number }
> = {};
for (const s of activeSales) {
  for (const p of s.payments) {
    if (p.canceled) continue;
    if (!paymentStats[p.methodId]) {
      paymentStats[p.methodId] = { name: p.methodName, amount: 0, count: 0 };
    }
    paymentStats[p.methodId].amount += p.amount;
    paymentStats[p.methodId].count++;
  }
}
const paymentList = Object.values(paymentStats).sort(
  (a, b) => b.amount - a.amount
);

// ─── 8. CROSS-SELL ANALYSIS ─────────────────────────────────────────────────
// What categories appear together in the same sale?
interface CatPair {
  cat1: string;
  cat2: string;
  count: number;
}
const pairMap: Record<string, number> = {};
for (const s of activeSales) {
  const cats = [
    ...new Set(
      s.items
        .filter((i: SaleItem) => !i.canceled && mainCatIds.includes(i.categoryId))
        .map((i: SaleItem) => i.categoryId)
    ),
  ].sort();
  for (let i = 0; i < cats.length; i++) {
    for (let j = i + 1; j < cats.length; j++) {
      const key = `${cats[i]}|${cats[j]}`;
      pairMap[key] = (pairMap[key] || 0) + 1;
    }
  }
}
const catPairs: CatPair[] = Object.entries(pairMap)
  .map(([key, count]) => {
    const [c1, c2] = key.split("|");
    return {
      cat1: categories[c1] || c1,
      cat2: categories[c2] || c2,
      count,
    };
  })
  .sort((a, b) => b.count - a.count);

// Beverage attachment rate
const salesWithFood = activeSales.filter((s: Sale) =>
  s.items.some(
    (i: SaleItem) =>
      !i.canceled &&
      ["5", "6", "9", "10", "13"].includes(i.categoryId)
  )
);
const salesWithFoodAndBev = salesWithFood.filter((s: Sale) =>
  s.items.some(
    (i: SaleItem) => !i.canceled && i.categoryId === "11"
  )
);
const bevAttachmentRate = salesWithFood.length > 0
  ? ((salesWithFoodAndBev.length / salesWithFood.length) * 100).toFixed(1)
  : "0";

// Crispetas + Helados combo
const salesWithCrispetas = activeSales.filter((s: Sale) =>
  s.items.some((i: SaleItem) => !i.canceled && i.categoryId === "7")
);
const salesCrispetasAndHelado = salesWithCrispetas.filter((s: Sale) =>
  s.items.some((i: SaleItem) => !i.canceled && i.categoryId === "12")
);
const crispetaHeladoRate = salesWithCrispetas.length > 0
  ? ((salesCrispetasAndHelado.length / salesWithCrispetas.length) * 100).toFixed(1)
  : "0";

// Salsa attachment with nachos/tacos/perros
const salesWithMainFood = activeSales.filter((s: Sale) =>
  s.items.some(
    (i: SaleItem) =>
      !i.canceled && ["5", "9", "10"].includes(i.categoryId)
  )
);
const salesWithSalsa = salesWithMainFood.filter((s: Sale) =>
  s.items.some(
    (i: SaleItem) =>
      !i.canceled &&
      i.categoryId === "13" &&
      i.productName.toLowerCase().includes("salsa")
  )
);
const salsaAttachmentRate = salesWithMainFood.length > 0
  ? ((salesWithSalsa.length / salesWithMainFood.length) * 100).toFixed(1)
  : "0";

// ─── 9. SINGLE-ITEM vs MULTI-ITEM SALES ─────────────────────────────────────
const singleItemSales = activeSales.filter(
  (s: Sale) =>
    s.items.filter((i: SaleItem) => !i.canceled && mainCatIds.includes(i.categoryId))
      .length === 1
);
const multiItemSales = activeSales.filter(
  (s: Sale) =>
    s.items.filter((i: SaleItem) => !i.canceled && mainCatIds.includes(i.categoryId))
      .length > 1
);
const singleItemAvg = singleItemSales.length > 0
  ? Math.round(
      singleItemSales.reduce((s: number, v: Sale) => s + v.total, 0) /
        singleItemSales.length
    )
  : 0;
const multiItemAvg = multiItemSales.length > 0
  ? Math.round(
      multiItemSales.reduce((s: number, v: Sale) => s + v.total, 0) /
        multiItemSales.length
    )
  : 0;

// ─── 10. LOW PERFORMERS ─────────────────────────────────────────────────────
const allProductStats: Record<
  string,
  { name: string; category: string; revenue: number; units: number }
> = {};
for (const s of activeSales) {
  for (const item of s.items) {
    if (item.canceled || !mainCatIds.includes(item.categoryId)) continue;
    if (!allProductStats[item.productId]) {
      allProductStats[item.productId] = {
        name: item.productName,
        category: item.categoryName,
        revenue: 0,
        units: 0,
      };
    }
    allProductStats[item.productId].revenue += item.total;
    allProductStats[item.productId].units += item.quantity;
  }
}
const lowPerformers = Object.values(allProductStats)
  .filter((p) => p.units <= 5 && p.revenue > 0)
  .sort((a, b) => a.units - b.units);

// ─── 11. TOP SELLERS ─────────────────────────────────────────────────────────
const topByRevenue = Object.values(allProductStats)
  .sort((a, b) => b.revenue - a.revenue)
  .slice(0, 15);
const topByUnits = Object.values(allProductStats)
  .sort((a, b) => b.units - a.units)
  .slice(0, 15);

// ─── 12. BEST/WORST DAYS ────────────────────────────────────────────────────
const bestDay = sortedDates.reduce((best, d) =>
  d[1].revenue > best[1].revenue ? d : best
);
const worstDay = sortedDates
  .filter((d) => d[1].sales > 0)
  .reduce((worst, d) =>
    d[1].revenue < worst[1].revenue ? d : worst
  );

// ─── BUILD HTML ─────────────────────────────────────────────────────────────
const maxCatRevenue = mainCats[0]?.revenue || 1;
const maxHourSales = Math.max(
  ...Object.values(hourStats).map((h) => h.sales)
);
const maxDaySales = Math.max(
  ...Object.values(dayStats).map((d) => d.sales)
);
const maxDateRevenue = Math.max(...sortedDates.map((d) => d[1].revenue));

// Daily trend chart (sparkline-style bars)
const dailyBarsHtml = sortedDates
  .map(([date, stats]) => {
    const barH = Math.max(2, (stats.revenue / maxDateRevenue) * 100);
    const dayNum = date.split("-")[2];
    const dow = uniqueDates[date];
    const isWeekend = dow === 0 || dow === 5 || dow === 6;
    const barColor = isWeekend ? "#4ade80" : "#3b82f6";
    return `<div style="display:flex;flex-direction:column;align-items:center;flex:1;min-width:18px">
      <div style="width:100%;max-width:22px;height:${barH}px;background:${barColor};border-radius:2px 2px 0 0;margin-bottom:2px" title="${date}: ${fmt(stats.revenue)} (${stats.sales} ventas)"></div>
      <span style="font-size:9px;color:#888">${dayNum}</span>
    </div>`;
  })
  .join("");

// Hour heatmap
const activeHours = Object.entries(hourStats)
  .filter(([, s]) => s.sales > 0)
  .sort((a, b) => Number(a[0]) - Number(b[0]));

const hourBarsHtml = activeHours
  .map(([h, stats]) => {
    const barH = Math.max(4, (stats.sales / maxHourSales) * 100);
    const hourLabel = `${Number(h)}:00`;
    return `<div style="display:flex;flex-direction:column;align-items:center;flex:1;min-width:30px">
      <div style="font-size:10px;color:#aaa;margin-bottom:4px">${stats.sales}</div>
      <div style="width:100%;max-width:28px;height:${barH}px;background:linear-gradient(to top,#6366f1,#818cf8);border-radius:2px 2px 0 0"></div>
      <span style="font-size:10px;color:#888;margin-top:4px">${hourLabel}</span>
    </div>`;
  })
  .join("");

// Category breakdown bars
const catBarsHtml = mainCats
  .map((c) => {
    const barW = Math.max(2, (c.revenue / maxCatRevenue) * 100);
    return `<div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
      <div style="width:120px;text-align:right;font-size:13px;color:#ccc;flex-shrink:0">${c.name}</div>
      <div style="flex:1;background:#222;border-radius:4px;overflow:hidden;height:24px">
        <div style="width:${barW}%;height:100%;background:linear-gradient(90deg,#6366f1,#818cf8);border-radius:4px;display:flex;align-items:center;padding-left:8px">
          <span style="font-size:11px;color:#fff;white-space:nowrap">${fmt(c.revenue)} (${pct(c.revenue, mainRevenue)})</span>
        </div>
      </div>
      <div style="width:60px;text-align:right;font-size:12px;color:#888">${c.units} uds</div>
    </div>`;
  })
  .join("");

// Payment methods bars
const maxPayment = paymentList[0]?.amount || 1;
const paymentBarsHtml = paymentList
  .map((p) => {
    const barW = Math.max(2, (p.amount / maxPayment) * 100);
    return `<div style="display:flex;align-items:center;gap:12px;margin-bottom:6px">
      <div style="width:110px;text-align:right;font-size:13px;color:#ccc;flex-shrink:0">${p.name}</div>
      <div style="flex:1;background:#222;border-radius:4px;overflow:hidden;height:20px">
        <div style="width:${barW}%;height:100%;background:linear-gradient(90deg,#f59e0b,#fbbf24);border-radius:4px;display:flex;align-items:center;padding-left:8px">
          <span style="font-size:11px;color:#000;white-space:nowrap">${fmt(p.amount)}</span>
        </div>
      </div>
      <div style="width:50px;text-align:right;font-size:12px;color:#888">${p.count}x</div>
    </div>`;
  })
  .join("");

// Day of week bars
const dayBarsHtml = [5, 6, 0, 4, 3, 1, 2]
  .map((d) => {
    const stats = dayStats[d];
    const count = dayCounts[d] || 1;
    const avgRev = Math.round(stats.revenue / count);
    const avgSales = Math.round(stats.sales / count);
    const barW = Math.max(2, (stats.sales / maxDaySales) * 100);
    const isWeekend = d === 0 || d === 5 || d === 6;
    const barColor = isWeekend
      ? "linear-gradient(90deg,#22c55e,#4ade80)"
      : "linear-gradient(90deg,#3b82f6,#60a5fa)";
    return `<div style="display:flex;align-items:center;gap:12px;margin-bottom:6px">
      <div style="width:90px;text-align:right;font-size:13px;color:${isWeekend ? "#4ade80" : "#ccc"};flex-shrink:0;font-weight:${isWeekend ? "600" : "400"}">${dayNames[d]}</div>
      <div style="flex:1;background:#222;border-radius:4px;overflow:hidden;height:22px">
        <div style="width:${barW}%;height:100%;background:${barColor};border-radius:4px;display:flex;align-items:center;padding-left:8px">
          <span style="font-size:11px;color:#fff;white-space:nowrap">${stats.sales} ventas / ${fmt(stats.revenue)}</span>
        </div>
      </div>
      <div style="width:100px;text-align:right;font-size:11px;color:#888">${fmt(avgRev)}/dia</div>
    </div>`;
  })
  .join("");

// Top products table
function productTableHtml(
  prods: { name: string; revenue: number; units: number; price?: number }[],
  total: number
): string {
  return prods
    .map(
      (p, i) =>
        `<tr style="border-bottom:1px solid #222">
      <td style="padding:6px 8px;color:#888">${i + 1}</td>
      <td style="padding:6px 8px;color:#eee">${p.name}</td>
      <td style="padding:6px 8px;text-align:right;color:#ccc">${p.price ? fmt(p.price) : "-"}</td>
      <td style="padding:6px 8px;text-align:right;color:#ccc">${p.units}</td>
      <td style="padding:6px 8px;text-align:right;color:#4ade80">${fmt(p.revenue)}</td>
      <td style="padding:6px 8px;text-align:right;color:#888">${pct(p.revenue, total)}</td>
    </tr>`
    )
    .join("");
}

// Cross-sell pairs table
const topPairs = catPairs.slice(0, 10);
const crossSellHtml = topPairs
  .map(
    (p, i) =>
      `<tr style="border-bottom:1px solid #222">
    <td style="padding:6px 8px;color:#888">${i + 1}</td>
    <td style="padding:6px 8px;color:#eee">${p.cat1}</td>
    <td style="padding:6px 8px;color:#eee">${p.cat2}</td>
    <td style="padding:6px 8px;text-align:right;color:#4ade80">${p.count} ventas</td>
  </tr>`
  )
  .join("");

// Low performers table
const lowPerfHtml = lowPerformers
  .slice(0, 12)
  .map(
    (p) =>
      `<tr style="border-bottom:1px solid #222">
    <td style="padding:6px 8px;color:#eee">${p.name}</td>
    <td style="padding:6px 8px;color:#888">${p.category}</td>
    <td style="padding:6px 8px;text-align:right;color:#f87171">${p.units} uds</td>
    <td style="padding:6px 8px;text-align:right;color:#ccc">${fmt(p.revenue)}</td>
  </tr>`
  )
  .join("");

// Week trend
const weekEntries = Object.entries(weekStats).sort(
  (a, b) => Number(a[0]) - Number(b[0])
);

// Compute some derived insights
const weekendRevenue =
  dayStats[0].revenue + dayStats[5].revenue + dayStats[6].revenue;
const weekdayRevenue = totalRevenue - weekendRevenue;
const weekendSales =
  dayStats[0].sales + dayStats[5].sales + dayStats[6].sales;
const weekdaySales = totalSales - weekendSales;
const weekendPctRevenue = pctNum(weekendRevenue, totalRevenue).toFixed(1);
const peakHour = activeHours.reduce((best, h) =>
  h[1].sales > best[1].sales ? h : best
);
const peakHourLabel = `${Number(peakHour[0])}:00 - ${Number(peakHour[0]) + 1}:00`;

// Food categories combined revenue
const foodCatRevenue =
  perroTotalRevenue +
  nachoTotalRevenue +
  tacoTotalRevenue +
  chicaTotalRevenue +
  texmexFoodRevenue +
  papasTotalRevenue;

const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Reporte Ejecutivo - Febrero 2026 | FANZINE Cine & Tex-Mex</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { background:#0f0f0f; color:#e0e0e0; font-family:'Segoe UI',system-ui,-apple-system,sans-serif; line-height:1.7; }
  .container { max-width:1100px; margin:0 auto; padding:24px 20px 60px; }
  .header { text-align:center; padding:48px 20px 36px; border-bottom:1px solid #222; margin-bottom:36px; }
  .header h1 { font-size:2.4rem; font-weight:700; color:#fff; margin-bottom:8px; letter-spacing:-0.5px; }
  .header .subtitle { font-size:1.1rem; color:#888; margin-bottom:4px; }
  .header .date { font-size:0.95rem; color:#6366f1; font-weight:500; }

  h2 { font-size:1.5rem; color:#fff; margin:40px 0 16px; padding-bottom:8px; border-bottom:2px solid #6366f1; }
  h3 { font-size:1.15rem; color:#c4b5fd; margin:28px 0 12px; }

  .kpi-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:16px; margin:20px 0 32px; }
  .kpi { background:#1a1a1a; border:1px solid #2a2a2a; border-radius:12px; padding:20px; text-align:center; }
  .kpi .value { font-size:1.8rem; font-weight:700; color:#fff; }
  .kpi .label { font-size:0.85rem; color:#888; margin-top:4px; }
  .kpi.highlight { border-color:#6366f1; background:linear-gradient(135deg,#1a1a2e,#1a1a1a); }

  .card { background:#1a1a1a; border:1px solid #2a2a2a; border-radius:12px; padding:24px; margin:16px 0; }
  .insight { background:#1a2a1a; border:1px solid #234a23; border-radius:12px; padding:20px; margin:16px 0; }
  .insight h4 { color:#4ade80; margin-bottom:8px; font-size:1rem; }
  .alert { background:#2a1a1a; border:1px solid #4a2323; border-radius:12px; padding:20px; margin:16px 0; }
  .alert h4 { color:#f87171; margin-bottom:8px; font-size:1rem; }
  .opportunity { background:#1a1a2a; border:1px solid #23234a; border-radius:12px; padding:20px; margin:16px 0; }
  .opportunity h4 { color:#818cf8; margin-bottom:8px; font-size:1rem; }

  p { margin:10px 0; color:#ccc; font-size:0.95rem; }
  .text-block { margin:12px 0; line-height:1.8; }
  .text-block p { color:#bbb; }
  strong { color:#fff; }

  table { width:100%; border-collapse:collapse; margin:12px 0; }
  th { padding:8px; text-align:left; font-size:0.8rem; color:#888; text-transform:uppercase; letter-spacing:0.5px; border-bottom:1px solid #333; }
  th:nth-child(n+3) { text-align:right; }

  .section-number { display:inline-block; width:28px; height:28px; background:#6366f1; color:#fff; border-radius:50%; text-align:center; line-height:28px; font-size:0.85rem; font-weight:700; margin-right:8px; }

  .rec-card { background:#1a1a2a; border:1px solid #23234a; border-radius:12px; padding:20px; margin:12px 0; }
  .rec-card .rec-title { color:#818cf8; font-weight:600; font-size:1.05rem; margin-bottom:6px; }
  .rec-card .rec-why { color:#999; font-size:0.9rem; margin-bottom:4px; }
  .rec-card .rec-impact { color:#4ade80; font-size:0.9rem; font-weight:500; }

  .mini-stat { display:inline-block; background:#222; border-radius:6px; padding:4px 10px; margin:2px 4px; font-size:0.85rem; color:#aaa; }
  .mini-stat strong { color:#fff; }

  .chart-container { display:flex; align-items:flex-end; gap:2px; height:120px; padding:10px 0; }

  .footer { text-align:center; padding:32px 0; border-top:1px solid #222; margin-top:48px; color:#555; font-size:0.85rem; }

  @media (max-width:768px) {
    .container { padding:12px; }
    .header h1 { font-size:1.6rem; }
    .kpi-grid { grid-template-columns:1fr 1fr; }
    .kpi .value { font-size:1.4rem; }
    h2 { font-size:1.2rem; }
  }
</style>
</head>
<body>
<div class="container">

<div class="header">
  <h1>REPORTE EJECUTIVO</h1>
  <div class="subtitle">FANZINE Cine & Tex-Mex | Bogota</div>
  <div class="date">Febrero 2026 | Generado: ${new Date().toLocaleDateString("es-CO")}</div>
</div>

<!-- ═══════ 1. RESUMEN EJECUTIVO ═══════ -->
<h2><span class="section-number">1</span> Resumen Ejecutivo</h2>

<div class="text-block">
<p>Febrero de 2026 confirma un mes solido para FANZINE Cine & Tex-Mex, con <strong>${fmt(totalRevenue)}</strong> en ingresos brutos distribuidos en <strong>${totalSales} transacciones</strong>. El ticket promedio se ubica en <strong>${fmt(avgTicket)}</strong> con un promedio de <strong>${avgItemsPerSale} items por venta</strong>, lo que refleja un comportamiento de compra relativamente modesto que presenta oportunidades significativas de crecimiento via cross-sell y upsell.</p>

<p>La categoria indiscutible del mes es <strong>Crispetas</strong>, que aporta <strong>${fmt(crispetaTotalRevenue)} (${pct(crispetaTotalRevenue, mainRevenue)})</strong> del revenue total de categorias principales. Esto es coherente con el modelo de negocio cine-restaurante: el popcorn es el producto ancla que acompana la experiencia cinematografica. Sin embargo, la dominancia de las crispetas tambien revela una dependencia que debe gestionarse estrategicamente, diversificando hacia categorias de mayor margen como comidas preparadas y postres premium.</p>

<p><strong>Helados</strong>, la segunda categoria por unidades con <strong>${heladoTotalUnits} unidades</strong>, muestra un patron interesante: los conos basicos de $3.000 representan <strong>${pct(conoUnits, heladoTotalUnits)}</strong> de las unidades vendidas pero solo <strong>${pct(conoRevenue, heladoTotalRevenue)}</strong> del revenue. Los productos premium (Sundae a $9.000 y Sandwich de Helado a $15.000) presentan una oportunidad clara de upgrade que no esta siendo capitalizada lo suficiente.</p>

<p>En el segmento de <strong>comidas</strong>, se observa una competencia interesante entre Nachos (${fmt(nachoTotalRevenue)}), Perros (${fmt(perroTotalRevenue)}) y Tacos (${fmt(tacoTotalRevenue)}). Los nachos lideran gracias a su precio premium de $18.000 y la variedad de sabores. Los Perros tienen la ventaja del volumen con mas variantes en carta. Las <strong>Bebidas</strong> generan ${fmt(bebidaTotalRevenue)} con ${bebidaTotalUnits} unidades, pero la tasa de attachment con comidas es apenas del <strong>${bevAttachmentRate}%</strong>, un indicador critico de oportunidad perdida.</p>

<p>Temporalmente, el negocio muestra una marcada estacionalidad semanal: los fines de semana (viernes a domingo) concentran el <strong>${weekendPctRevenue}%</strong> del revenue total, consistente con la programacion cinematografica. La hora pico se situa entre las <strong>${peakHourLabel}</strong> COT, coincidiendo con las funciones de la tarde-noche. Los dias entre semana muestran un rendimiento significativamente menor, lo que sugiere oportunidades de promociones dirigidas para llenar esos horarios.</p>

<p>El analisis de cross-sell revela que apenas el <strong>${crispetaHeladoRate}%</strong> de las ventas con crispetas tambien incluyen helados, y solo el <strong>${salsaAttachmentRate}%</strong> de las ventas de comida incluyen salsas adicionales. Estos numeros indican un potencial enorme para combos y sugerencias en el punto de venta. Las ventas multi-item promedian <strong>${fmt(multiItemAvg)}</strong> versus <strong>${fmt(singleItemAvg)}</strong> para ventas de un solo item, una diferencia de <strong>${fmt(multiItemAvg - singleItemAvg)} (${pct(multiItemAvg - singleItemAvg, singleItemAvg)} mas)</strong> que justifica cualquier inversion en estrategias de venta cruzada.</p>

<p>En metodos de pago, <strong>${paymentList[0]?.name}</strong> lidera con ${fmt(paymentList[0]?.amount || 0)}, seguido de ${paymentList[1]?.name} (${fmt(paymentList[1]?.amount || 0)}). La diversificacion de medios de pago es saludable, con al menos ${paymentList.filter(p => p.count >= 10).length} metodos activos de forma recurrente, lo que reduce friccion en el punto de venta.</p>

<p>Las principales areas de atencion incluyen <strong>${lowPerformers.length} productos con 5 o menos unidades vendidas</strong> en todo el mes, lo cual sugiere la necesidad de revisar la carta para eliminar items que no roten o reposicionarlos con promociones. La categoria de <strong>Postres</strong> (${fmt(postreTotalRevenue)}, ${postreTotalUnits} uds) y <strong>Milkshakes</strong> (${fmt(milkTotalRevenue)}, ${milkTotalUnits} uds) tienen potencial sin explotar que podria activarse con exhibicion visual y sugerencia activa del personal.</p>
</div>

<!-- ═══════ 2. PANORAMA GENERAL ═══════ -->
<h2><span class="section-number">2</span> Panorama General del Mes</h2>

<div class="kpi-grid">
  <div class="kpi highlight">
    <div class="value">${fmt(totalRevenue)}</div>
    <div class="label">Revenue Total</div>
  </div>
  <div class="kpi">
    <div class="value">${totalSales}</div>
    <div class="label">Transacciones</div>
  </div>
  <div class="kpi">
    <div class="value">${fmt(avgTicket)}</div>
    <div class="label">Ticket Promedio</div>
  </div>
  <div class="kpi">
    <div class="value">${avgItemsPerSale}</div>
    <div class="label">Items / Venta</div>
  </div>
</div>

<h3>Distribucion de Revenue por Categoria</h3>
<div class="card">
  ${catBarsHtml}
</div>

<h3>Ranking de Categorias</h3>
<div class="card" style="overflow-x:auto">
  <table>
    <thead><tr><th>#</th><th>Categoria</th><th style="text-align:right">Revenue</th><th style="text-align:right">% Total</th><th style="text-align:right">Unidades</th><th style="text-align:right">Ticket Prom</th></tr></thead>
    <tbody>
      ${mainCats
        .map(
          (c, i) =>
            `<tr style="border-bottom:1px solid #222">
          <td style="padding:6px 8px;color:#888">${i + 1}</td>
          <td style="padding:6px 8px;color:#eee;font-weight:500">${c.name}</td>
          <td style="padding:6px 8px;text-align:right;color:#4ade80">${fmt(c.revenue)}</td>
          <td style="padding:6px 8px;text-align:right;color:#ccc">${pct(c.revenue, mainRevenue)}</td>
          <td style="padding:6px 8px;text-align:right;color:#ccc">${c.units}</td>
          <td style="padding:6px 8px;text-align:right;color:#888">${fmt(c.units > 0 ? Math.round(c.revenue / c.units) : 0)}</td>
        </tr>`
        )
        .join("")}
    </tbody>
  </table>
</div>

<h3>Metodos de Pago</h3>
<div class="card">
  ${paymentBarsHtml}
</div>

<h3>Top 15 Productos por Revenue</h3>
<div class="card" style="overflow-x:auto">
  <table>
    <thead><tr><th>#</th><th>Producto</th><th style="text-align:right">Precio</th><th style="text-align:right">Uds</th><th style="text-align:right">Revenue</th><th style="text-align:right">% Total</th></tr></thead>
    <tbody>
      ${topByRevenue
        .map(
          (p, i) =>
            `<tr style="border-bottom:1px solid #222">
          <td style="padding:6px 8px;color:#888">${i + 1}</td>
          <td style="padding:6px 8px;color:#eee">${p.name}</td>
          <td style="padding:6px 8px;text-align:right;color:#ccc">-</td>
          <td style="padding:6px 8px;text-align:right;color:#ccc">${p.units}</td>
          <td style="padding:6px 8px;text-align:right;color:#4ade80">${fmt(p.revenue)}</td>
          <td style="padding:6px 8px;text-align:right;color:#888">${pct(p.revenue, mainRevenue)}</td>
        </tr>`
        )
        .join("")}
    </tbody>
  </table>
</div>

<!-- ═══════ 3. CRISPETAS ═══════ -->
<h2><span class="section-number">3</span> Analisis de Crispetas</h2>

<div class="text-block">
<p>Las crispetas son el corazon del negocio, generando <strong>${fmt(crispetaTotalRevenue)}</strong> con <strong>${crispetaTotalUnits} unidades</strong> vendidas. Esta categoria por si sola representa el <strong>${pct(crispetaTotalRevenue, mainRevenue)}</strong> del revenue de categorias principales, lo que confirma su rol como producto ancla del modelo cine-restaurante.</p>
<p>El analisis por tamano revela un patron interesante: el tamano <strong>Personal</strong> lidera en unidades con ${sizeMap["Personal"]?.units || 0} unidades (${pct(sizeMap["Personal"]?.units || 0, crispetaTotalUnits)}), pero aporta solo ${fmt(sizeMap["Personal"]?.revenue || 0)} en revenue (${pct(sizeMap["Personal"]?.revenue || 0, crispetaTotalRevenue)}). Mientras tanto, las <strong>Medianas</strong> generan ${fmt(sizeMap["Mediana"]?.revenue || 0)} y las <strong>Familiares</strong> ${fmt(sizeMap["Familiar"]?.revenue || 0)}. Esto demuestra que aunque el tamano personal es el punto de entrada preferido (probablemente por el precio bajo de $2.000-$4.000), los tamanos mayores son donde se concentra la rentabilidad.</p>
</div>

<div class="kpi-grid">
  <div class="kpi highlight">
    <div class="value">${fmt(crispetaTotalRevenue)}</div>
    <div class="label">Revenue Crispetas</div>
  </div>
  <div class="kpi">
    <div class="value">${crispetaTotalUnits}</div>
    <div class="label">Unidades Vendidas</div>
  </div>
  <div class="kpi">
    <div class="value">${fmt(Math.round(crispetaTotalRevenue / crispetaTotalUnits))}</div>
    <div class="label">Precio Promedio/Ud</div>
  </div>
</div>

<h3>Detalle por Producto</h3>
<div class="card" style="overflow-x:auto">
  <table>
    <thead><tr><th>#</th><th>Producto</th><th style="text-align:right">Precio</th><th style="text-align:right">Uds</th><th style="text-align:right">Revenue</th><th style="text-align:right">%</th></tr></thead>
    <tbody>${productTableHtml(crispetaProducts, crispetaTotalRevenue)}</tbody>
  </table>
</div>

<h3>Mix por Tamano</h3>
<div class="card">
  ${Object.entries(sizeMap)
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .map(([size, stats]) => {
      const barW = Math.max(2, (stats.revenue / (sizeMap["Mediana"]?.revenue || sizeMap["Personal"]?.revenue || 1)) * 100);
      return `<div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
        <div style="width:80px;text-align:right;font-size:13px;color:#ccc">${size}</div>
        <div style="flex:1;background:#222;border-radius:4px;overflow:hidden;height:22px">
          <div style="width:${Math.min(barW, 100)}%;height:100%;background:linear-gradient(90deg,#f59e0b,#fbbf24);border-radius:4px;display:flex;align-items:center;padding-left:8px">
            <span style="font-size:11px;color:#000;white-space:nowrap">${stats.units} uds / ${fmt(stats.revenue)}</span>
          </div>
        </div>
      </div>`;
    })
    .join("")}
</div>

<h3>Mix por Sabor</h3>
<div class="card">
  ${Object.entries(flavorMap)
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .map(([flavor, stats]) => {
      const maxFlavorRev = Math.max(...Object.values(flavorMap).map(f => f.revenue));
      const barW = Math.max(2, (stats.revenue / maxFlavorRev) * 100);
      const colors: Record<string, string> = {
        "Sal": "#60a5fa",
        "Caramelo": "#f59e0b",
        "Mixtas": "#a78bfa",
        "Minipancakes": "#fb923c",
        "Otro": "#888",
      };
      const color = colors[flavor] || "#888";
      return `<div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
        <div style="width:100px;text-align:right;font-size:13px;color:${color};font-weight:500">${flavor}</div>
        <div style="flex:1;background:#222;border-radius:4px;overflow:hidden;height:22px">
          <div style="width:${barW}%;height:100%;background:${color};opacity:0.7;border-radius:4px;display:flex;align-items:center;padding-left:8px">
            <span style="font-size:11px;color:#fff;white-space:nowrap">${stats.units} uds / ${fmt(stats.revenue)}</span>
          </div>
        </div>
      </div>`;
    })
    .join("")}
</div>

<div class="insight">
  <h4>Insight: Oportunidad de Upsell en Tamano</h4>
  <p>El tamano Personal es claramente el entry-level, con un precio de entrada bajo ($2.000-$4.000). Sin embargo, el salto a Mediana ($8.000-$14.000) y Familiar ($14.000-$20.000) multiplica el revenue por item entre 3x y 5x. Una estrategia de "por solo $X mas, lleva la mediana" en el punto de venta podria mover incluso un 10-15% de las compras personales hacia medianas, generando un incremento estimado de ${fmt(Math.round((sizeMap["Personal"]?.units || 0) * 0.12 * 6000))} adicionales al mes.</p>
</div>

<!-- ═══════ 4. HELADOS ═══════ -->
<h2><span class="section-number">4</span> Analisis de Helados</h2>

<div class="text-block">
<p>La categoria de Helados genero <strong>${fmt(heladoTotalRevenue)}</strong> con <strong>${heladoTotalUnits} unidades</strong> en febrero. El producto mas vendido por unidades son los conos ($3.000 c/u), que representan la oferta impulse buy del negocio. Sin embargo, el mix de revenue revela una oportunidad: los conos aportan ${fmt(conoRevenue)} (${pct(conoRevenue, heladoTotalRevenue)}) mientras que los productos premium como Sundae ($9.000) y Sandwich de Helado ($15.000) combinados generan ${fmt(premiumRevenue)} (${pct(premiumRevenue, heladoTotalRevenue)}) con apenas ${premiumUnits} unidades.</p>
<p>Las galletas (chocolate, RedVelvet, almendras) a $4.000 representan una linea interesante que complementa los helados, y las cubiertas adicionales ($1.000) generan revenue incremental con costo marginal minimo.</p>
</div>

<div class="kpi-grid">
  <div class="kpi highlight">
    <div class="value">${fmt(heladoTotalRevenue)}</div>
    <div class="label">Revenue Helados</div>
  </div>
  <div class="kpi">
    <div class="value">${heladoTotalUnits}</div>
    <div class="label">Unidades</div>
  </div>
  <div class="kpi">
    <div class="value">${fmt(Math.round(heladoTotalRevenue / (heladoTotalUnits || 1)))}</div>
    <div class="label">Precio Prom/Ud</div>
  </div>
</div>

<h3>Detalle por Producto</h3>
<div class="card" style="overflow-x:auto">
  <table>
    <thead><tr><th>#</th><th>Producto</th><th style="text-align:right">Precio</th><th style="text-align:right">Uds</th><th style="text-align:right">Revenue</th><th style="text-align:right">%</th></tr></thead>
    <tbody>${productTableHtml(heladoProducts, heladoTotalRevenue)}</tbody>
  </table>
</div>

<div class="insight">
  <h4>Insight: Cross-sell Crispetas + Helado</h4>
  <p>Solo el <strong>${crispetaHeladoRate}%</strong> de las ventas que incluyen crispetas tambien incluyen helados. Dado que ambos productos son impulse buys tipicos de cine, un combo "Crispeta + Cono" a precio especial podria incrementar significativamente la penetracion de helados. Si se lograra llevar ese attachment rate al 15%, se agregarian aproximadamente ${Math.round((salesWithCrispetas.length * 0.15 - salesCrispetasAndHelado.length) * 3000)} COP adicionales en helados.</p>
</div>

<div class="opportunity">
  <h4>Oportunidad: Premiumizacion</h4>
  <p>El Sundae y el Sandwich de Helado tienen margenes superiores por unidad pero baja penetracion. Una exhibicion visual (fotos grandes en el POS del cliente) y una sugerencia activa del cajero ("¿lo quieres con Sundae por solo $6.000 mas que un cono?") podria duplicar las ventas de estos productos premium sin canibalizacion significativa de los conos.</p>
</div>

<!-- ═══════ 5. COMIDAS ═══════ -->
<h2><span class="section-number">5</span> Analisis de Comidas</h2>

<div class="text-block">
<p>El segmento de comidas (Perros, Nachos, Tacos, Chicanitas, Tex Mex, Papas) genero un total de <strong>${fmt(foodCatRevenue)}</strong>, lo que representa el <strong>${pct(foodCatRevenue, mainRevenue)}</strong> del revenue principal. Aunque las crispetas dominan, las comidas son cruciales para el ticket promedio y la experiencia del restaurante mas alla del snack de cine.</p>
</div>

<h3>Battle: Nachos vs Perros vs Tacos</h3>
<div class="card">
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px">
    <div style="background:#222;border-radius:8px;padding:16px;text-align:center">
      <div style="font-size:1.3rem;font-weight:700;color:#f59e0b">Nachos</div>
      <div style="font-size:1.5rem;font-weight:700;color:#fff;margin:8px 0">${fmt(nachoTotalRevenue)}</div>
      <div style="color:#888">${nachoTotalUnits} uds | ${nachoProducts.length} variantes</div>
      <div style="color:#aaa;font-size:0.85rem;margin-top:4px">Precio prom: ${fmt(Math.round(nachoTotalRevenue / (nachoTotalUnits || 1)))}</div>
    </div>
    <div style="background:#222;border-radius:8px;padding:16px;text-align:center">
      <div style="font-size:1.3rem;font-weight:700;color:#ef4444">Perros</div>
      <div style="font-size:1.5rem;font-weight:700;color:#fff;margin:8px 0">${fmt(perroTotalRevenue)}</div>
      <div style="color:#888">${perroTotalUnits} uds | ${perroProducts.length} variantes</div>
      <div style="color:#aaa;font-size:0.85rem;margin-top:4px">Precio prom: ${fmt(Math.round(perroTotalRevenue / (perroTotalUnits || 1)))}</div>
    </div>
    <div style="background:#222;border-radius:8px;padding:16px;text-align:center">
      <div style="font-size:1.3rem;font-weight:700;color:#22c55e">Tacos</div>
      <div style="font-size:1.5rem;font-weight:700;color:#fff;margin:8px 0">${fmt(tacoTotalRevenue)}</div>
      <div style="color:#888">${tacoTotalUnits} uds | ${tacoProducts.length} variantes</div>
      <div style="color:#aaa;font-size:0.85rem;margin-top:4px">Precio prom: ${fmt(Math.round(tacoTotalRevenue / (tacoTotalUnits || 1)))}</div>
    </div>
  </div>
</div>

<h3>Top Productos - Perros</h3>
<div class="card" style="overflow-x:auto">
  <table>
    <thead><tr><th>#</th><th>Producto</th><th style="text-align:right">Precio</th><th style="text-align:right">Uds</th><th style="text-align:right">Revenue</th><th style="text-align:right">%</th></tr></thead>
    <tbody>${productTableHtml(perroProducts.slice(0, 8), perroTotalRevenue)}</tbody>
  </table>
</div>

<h3>Top Productos - Nachos</h3>
<div class="card" style="overflow-x:auto">
  <table>
    <thead><tr><th>#</th><th>Producto</th><th style="text-align:right">Precio</th><th style="text-align:right">Uds</th><th style="text-align:right">Revenue</th><th style="text-align:right">%</th></tr></thead>
    <tbody>${productTableHtml(nachoProducts, nachoTotalRevenue)}</tbody>
  </table>
</div>

<h3>Top Productos - Tacos</h3>
<div class="card" style="overflow-x:auto">
  <table>
    <thead><tr><th>#</th><th>Producto</th><th style="text-align:right">Precio</th><th style="text-align:right">Uds</th><th style="text-align:right">Revenue</th><th style="text-align:right">%</th></tr></thead>
    <tbody>${productTableHtml(tacoProducts, tacoTotalRevenue)}</tbody>
  </table>
</div>

<h3>Bebidas</h3>
<div class="text-block">
<p>Las bebidas generaron <strong>${fmt(bebidaTotalRevenue)}</strong> con <strong>${bebidaTotalUnits} unidades</strong>. La tasa de acompanamiento con comidas es del <strong>${bevAttachmentRate}%</strong>, lo que indica que muchos clientes compran comida sin bebida, una oportunidad clara de combo.</p>
</div>
<div class="card" style="overflow-x:auto">
  <table>
    <thead><tr><th>#</th><th>Producto</th><th style="text-align:right">Precio</th><th style="text-align:right">Uds</th><th style="text-align:right">Revenue</th><th style="text-align:right">%</th></tr></thead>
    <tbody>${productTableHtml(bebidaProducts.slice(0, 10), bebidaTotalRevenue)}</tbody>
  </table>
</div>

<h3>Postres</h3>
<div class="text-block">
<p>La categoria de Postres genero <strong>${fmt(postreTotalRevenue)}</strong> con <strong>${postreTotalUnits} unidades</strong>. Las tortas ($10.000-$12.000) son el pilar de la categoria. Las incorporaciones recientes de Cheesecake de Pistachos y Kinder Bueno ($12.000) representan el segmento premium.</p>
</div>
<div class="card" style="overflow-x:auto">
  <table>
    <thead><tr><th>#</th><th>Producto</th><th style="text-align:right">Precio</th><th style="text-align:right">Uds</th><th style="text-align:right">Revenue</th><th style="text-align:right">%</th></tr></thead>
    <tbody>${productTableHtml(postreProducts, postreTotalRevenue)}</tbody>
  </table>
</div>

<h3>Salsas (Attachment)</h3>
<div class="card">
  <p>Se vendieron <strong>${salsaUnits} unidades</strong> de salsas adicionales ($2.000 c/u), generando <strong>${fmt(salsaRevenue)}</strong>. La tasa de attachment en ventas con comida principal (perros, nachos, tacos) es del <strong>${salsaAttachmentRate}%</strong>.</p>
</div>

<h3>Otros: Chicanitas, Milkshakes, Papas, Tex Mex</h3>
<div class="card">
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px">
    <div style="background:#222;border-radius:8px;padding:14px;text-align:center">
      <div style="font-weight:600;color:#ccc">Chicanitas</div>
      <div style="font-size:1.2rem;font-weight:700;color:#fff;margin:4px 0">${fmt(chicaTotalRevenue)}</div>
      <div style="color:#888;font-size:0.85rem">${chicaTotalUnits} uds</div>
    </div>
    <div style="background:#222;border-radius:8px;padding:14px;text-align:center">
      <div style="font-weight:600;color:#ccc">Milkshakes</div>
      <div style="font-size:1.2rem;font-weight:700;color:#fff;margin:4px 0">${fmt(milkTotalRevenue)}</div>
      <div style="color:#888;font-size:0.85rem">${milkTotalUnits} uds</div>
    </div>
    <div style="background:#222;border-radius:8px;padding:14px;text-align:center">
      <div style="font-weight:600;color:#ccc">Papas Fritas</div>
      <div style="font-size:1.2rem;font-weight:700;color:#fff;margin:4px 0">${fmt(papasTotalRevenue)}</div>
      <div style="color:#888;font-size:0.85rem">${papasTotalUnits} uds</div>
    </div>
    <div style="background:#222;border-radius:8px;padding:14px;text-align:center">
      <div style="font-weight:600;color:#ccc">Tex Mex</div>
      <div style="font-size:1.2rem;font-weight:700;color:#fff;margin:4px 0">${fmt(texmexFoodRevenue)}</div>
      <div style="color:#888;font-size:0.85rem">(Alitas, Pollo, Mac)</div>
    </div>
  </div>
</div>

<div class="alert">
  <h4>Alerta: Baja Penetracion de Bebidas</h4>
  <p>Solo el <strong>${bevAttachmentRate}%</strong> de las ventas con comida incluyen bebida. En un restaurante tipico, esta tasa deberia estar por encima del 40-50%. Cada venta de comida sin bebida representa $3.500-$6.000 de revenue perdido. Si se implementaran combos obligatorios o sugerencia activa, y se lograra un 30% de attachment, esto representaria aproximadamente ${fmt(Math.round(salesWithFood.length * 0.3 * 4000 - bebidaTotalRevenue))} adicionales.</p>
</div>

<!-- ═══════ 6. ANALISIS TEMPORAL ═══════ -->
<h2><span class="section-number">6</span> Analisis Temporal</h2>

<h3>Ventas por Dia de la Semana</h3>
<div class="text-block">
<p>El patron semanal confirma la naturaleza cine-centrica del negocio. Los <strong>fines de semana (viernes, sabado, domingo)</strong> concentran el <strong>${weekendPctRevenue}%</strong> del revenue total con <strong>${weekendSales} ventas</strong>, versus ${weekdaySales} ventas entre semana. El dia mas fuerte es <strong>${dayNames[Object.entries(dayStats).sort((a, b) => b[1].revenue - a[1].revenue)[0][0] as unknown as number]}</strong> con ${fmt(Object.values(dayStats).sort((a, b) => b.revenue - a.revenue)[0].revenue)}, mientras que el dia mas debil es <strong>${dayNames[Object.entries(dayStats).filter(([,s]) => s.sales > 0).sort((a, b) => a[1].revenue - b[1].revenue)[0][0] as unknown as number]}</strong>.</p>
</div>

<div class="card">
  ${dayBarsHtml}
</div>

<h3>Distribucion por Hora del Dia (COT)</h3>
<div class="text-block">
<p>La hora pico es <strong>${peakHourLabel}</strong> con <strong>${peakHour[1].sales} ventas</strong>. Se observa actividad desde las horas de la manana/mediodia con un crescendo hacia la tarde-noche, coincidiendo con las funciones cinematograficas vespertinas y nocturnas.</p>
</div>

<div class="card">
  <div style="display:flex;align-items:flex-end;gap:4px;height:140px;padding:10px 0">
    ${hourBarsHtml}
  </div>
</div>

<h3>Tendencia Diaria - Febrero 2026</h3>
<div class="text-block">
<p>El mejor dia del mes fue <strong>${bestDay[0]}</strong> con <strong>${fmt(bestDay[1].revenue)}</strong> (${bestDay[1].sales} ventas), mientras que el dia mas bajo fue <strong>${worstDay[0]}</strong> con <strong>${fmt(worstDay[1].revenue)}</strong>. La variabilidad diaria es significativa, lo que refuerza la importancia de planificar inventario y staffing segun el dia de la semana.</p>
</div>

<div class="card">
  <div style="display:flex;align-items:flex-end;gap:2px;height:120px;padding:10px 0">
    ${dailyBarsHtml}
  </div>
  <div style="display:flex;justify-content:space-between;margin-top:8px">
    <span style="font-size:11px;color:#888">Feb 1</span>
    <span style="font-size:11px;color:#888">
      <span style="display:inline-block;width:10px;height:10px;background:#4ade80;border-radius:2px;margin-right:4px"></span>Fin de semana
      <span style="display:inline-block;width:10px;height:10px;background:#3b82f6;border-radius:2px;margin:0 4px 0 12px"></span>Entre semana
    </span>
    <span style="font-size:11px;color:#888">Feb 28</span>
  </div>
</div>

<h3>Revenue por Semana</h3>
<div class="card">
  ${weekEntries
    .map(([w, stats]) => {
      const maxWeekRev = Math.max(...weekEntries.map(([, s]) => s.revenue));
      const barW = Math.max(2, (stats.revenue / maxWeekRev) * 100);
      return `<div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
        <div style="width:80px;text-align:right;font-size:13px;color:#ccc">Sem ${w}</div>
        <div style="flex:1;background:#222;border-radius:4px;overflow:hidden;height:22px">
          <div style="width:${barW}%;height:100%;background:linear-gradient(90deg,#8b5cf6,#a78bfa);border-radius:4px;display:flex;align-items:center;padding-left:8px">
            <span style="font-size:11px;color:#fff;white-space:nowrap">${fmt(stats.revenue)} (${stats.sales} ventas)</span>
          </div>
        </div>
      </div>`;
    })
    .join("")}
</div>

<div class="insight">
  <h4>Recomendacion de Staffing</h4>
  <p><strong>Viernes a Domingo:</strong> Staff completo, doble preparacion de crispetas e inventario de helados. Estos 3 dias generan casi ${weekendPctRevenue}% del revenue.<br>
  <strong>Lunes a Jueves:</strong> Staffing reducido. Considerar promociones especiales ("Martes de Tacos", "Miercoles de 2x1 en Helados") para estimular demanda entre semana.<br>
  <strong>Horario pico (${peakHourLabel}):</strong> Asegurar que el POS tenga al menos 2 cajeros y la cocina este preparada con pre-produccion desde 1 hora antes.</p>
</div>

<!-- ═══════ 7. CROSS-SELL ═══════ -->
<h2><span class="section-number">7</span> Cross-Sell y Oportunidades</h2>

<div class="text-block">
<p>El analisis de ventas conjuntas revela patrones naturales de consumo que pueden ser potenciados con estrategias de combo y sugerencia activa. Las ventas multi-item promedian <strong>${fmt(multiItemAvg)}</strong> versus <strong>${fmt(singleItemAvg)}</strong> para single-item, una diferencia de <strong>${fmt(multiItemAvg - singleItemAvg)} (+${pct(multiItemAvg - singleItemAvg, singleItemAvg)})</strong>.</p>
</div>

<div class="kpi-grid">
  <div class="kpi">
    <div class="value">${singleItemSales.length}</div>
    <div class="label">Ventas Single-Item (${pct(singleItemSales.length, totalSales)})</div>
  </div>
  <div class="kpi">
    <div class="value">${multiItemSales.length}</div>
    <div class="label">Ventas Multi-Item (${pct(multiItemSales.length, totalSales)})</div>
  </div>
  <div class="kpi highlight">
    <div class="value">+${fmt(multiItemAvg - singleItemAvg)}</div>
    <div class="label">Diferencia Ticket Promedio</div>
  </div>
</div>

<h3>Categorias que se Compran Juntas</h3>
<div class="card" style="overflow-x:auto">
  <table>
    <thead><tr><th>#</th><th>Categoria 1</th><th>Categoria 2</th><th style="text-align:right">Frecuencia</th></tr></thead>
    <tbody>${crossSellHtml}</tbody>
  </table>
</div>

<h3>Tasas de Attachment</h3>
<div class="card">
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:16px">
    <div style="background:#222;border-radius:8px;padding:16px">
      <div style="font-weight:600;color:#ccc;margin-bottom:8px">Bebida con Comida</div>
      <div style="font-size:2rem;font-weight:700;color:${Number(bevAttachmentRate) < 30 ? '#f87171' : '#4ade80'}">${bevAttachmentRate}%</div>
      <div style="color:#888;font-size:0.85rem">Meta sugerida: 40%+</div>
    </div>
    <div style="background:#222;border-radius:8px;padding:16px">
      <div style="font-weight:600;color:#ccc;margin-bottom:8px">Helado con Crispetas</div>
      <div style="font-size:2rem;font-weight:700;color:${Number(crispetaHeladoRate) < 15 ? '#f87171' : '#4ade80'}">${crispetaHeladoRate}%</div>
      <div style="color:#888;font-size:0.85rem">Meta sugerida: 15%+</div>
    </div>
    <div style="background:#222;border-radius:8px;padding:16px">
      <div style="font-weight:600;color:#ccc;margin-bottom:8px">Salsa con Comida</div>
      <div style="font-size:2rem;font-weight:700;color:${Number(salsaAttachmentRate) < 20 ? '#f87171' : '#4ade80'}">${salsaAttachmentRate}%</div>
      <div style="color:#888;font-size:0.85rem">Meta sugerida: 25%+</div>
    </div>
  </div>
</div>

<div class="opportunity">
  <h4>Combos Naturales Detectados</h4>
  <p>Basado en los datos de co-compra, los combos mas naturales son:</p>
  <ul style="margin:10px 0 0 20px;color:#ccc">
    <li><strong>Combo Cine:</strong> Crispetas Mediana + Bebida + Cono de Helado (3 categorias top en co-compra)</li>
    <li><strong>Combo Tex-Mex:</strong> Nachos o Tacos + Bebida + Postre</li>
    <li><strong>Combo Perro:</strong> Perro con Toppings + Papas + Bebida</li>
    <li><strong>Upgrade Helado:</strong> Cono a Sundae por +$6.000</li>
    <li><strong>Crispetas + Salsa:</strong> Agregar salsa a crispetas para experiencia gourmet</li>
  </ul>
</div>

<!-- ═══════ 8. ALERTAS ═══════ -->
<h2><span class="section-number">8</span> Alertas y Problemas</h2>

<div class="alert">
  <h4>Productos con Baja Rotacion (5 o menos unidades en el mes)</h4>
  <p>Se detectaron <strong>${lowPerformers.length} productos</strong> con 5 o menos ventas en todo febrero. Estos productos ocupan espacio en el menu y la operacion sin generar revenue significativo. Se recomienda evaluar su permanencia o reposicionarlos con promociones.</p>
</div>

<div class="card" style="overflow-x:auto">
  <table>
    <thead><tr><th>Producto</th><th>Categoria</th><th style="text-align:right">Uds Vendidas</th><th style="text-align:right">Revenue</th></tr></thead>
    <tbody>${lowPerfHtml}</tbody>
  </table>
</div>

<div class="alert">
  <h4>Dependencia de Crispetas</h4>
  <p>La categoria de Crispetas representa el <strong>${pct(crispetaTotalRevenue, mainRevenue)}</strong> del revenue. Si bien es natural en un cine-restaurante, cualquier interrupcion en el suministro de materia prima o cambio en habitos de consumo tendria un impacto desproporcionado. Diversificar el revenue hacia comidas preparadas y postres es estrategicamente importante.</p>
</div>

<div class="alert">
  <h4>Horarios Muertos</h4>
  <p>Los datos muestran actividad concentrada en las horas de la tarde-noche. Las mananas y primeras horas de la tarde entre semana presentan muy pocas ventas, representando capacidad ociosa del personal y el local. Considerar horario reducido en dias debiles o actividades promocionales.</p>
</div>

<!-- ═══════ 9. RECOMENDACIONES ═══════ -->
<h2><span class="section-number">9</span> Recomendaciones Estrategicas</h2>

<div class="rec-card">
  <div class="rec-title">1. Implementar Combos de Cine en el POS</div>
  <p class="rec-why"><strong>Que:</strong> Crear 3-4 combos predefinidos (Crispeta + Bebida + Helado) con descuento del 10-15% sobre precio individual. Programarlos como botones rapidos en el POS.</p>
  <p class="rec-why"><strong>Por que:</strong> Las ventas multi-item generan ${fmt(multiItemAvg - singleItemAvg)} mas que las single-item. Los combos eliminan la friccion de decision y aumentan el ticket promedio.</p>
  <p class="rec-impact">Impacto estimado: +${fmt(Math.round(singleItemSales.length * 0.15 * (multiItemAvg - singleItemAvg)))} / mes</p>
</div>

<div class="rec-card">
  <div class="rec-title">2. Upsell Sistematico de Tamano en Crispetas</div>
  <p class="rec-why"><strong>Que:</strong> Entrenar al cajero para siempre ofrecer el tamano siguiente: "Por solo $X mas, la mediana". Implementar popup en la pantalla del cliente mostrando la diferencia visual de tamano.</p>
  <p class="rec-why"><strong>Por que:</strong> El tamano Personal tiene margenes bajos ($2.000-$4.000). Mover un 12% de ventas personales a medianas triplica el revenue por unidad.</p>
  <p class="rec-impact">Impacto estimado: +${fmt(Math.round((sizeMap["Personal"]?.units || 0) * 0.12 * 6000))} / mes</p>
</div>

<div class="rec-card">
  <div class="rec-title">3. Sugerencia Activa de Bebida con Comida</div>
  <p class="rec-why"><strong>Que:</strong> Al detectar un item de comida en el pedido, el POS debe mostrar automaticamente la pantalla de bebidas con un mensaje tipo "¿Algo para tomar?". Implementar como paso obligatorio antes del cobro.</p>
  <p class="rec-why"><strong>Por que:</strong> Solo el ${bevAttachmentRate}% de las ventas de comida incluyen bebida. Cada bebida agregada son $3.500-$6.000 adicionales con alto margen.</p>
  <p class="rec-impact">Impacto estimado: +${fmt(Math.round(salesWithFood.length * 0.15 * 4000))} / mes (si attachment sube a ${Number(bevAttachmentRate) + 15}%)</p>
</div>

<div class="rec-card">
  <div class="rec-title">4. Promociones Entre Semana</div>
  <p class="rec-why"><strong>Que:</strong> Crear promociones tematicas: "Martes de Tacos 2x1", "Miercoles de Helados al 50%", "Jueves de Nachos + Bebida". Comunicar en redes sociales y en el punto de venta.</p>
  <p class="rec-why"><strong>Por que:</strong> Los dias entre semana generan solo ${pct(weekdayRevenue, totalRevenue)} del revenue con ${weekdaySales} ventas. Hay capacidad ociosa que se puede monetizar con promociones.</p>
  <p class="rec-impact">Impacto estimado: +15-25% en revenue entre semana</p>
</div>

<div class="rec-card">
  <div class="rec-title">5. Premiumizacion del Menu de Helados</div>
  <p class="rec-why"><strong>Que:</strong> Exhibir fotos grandes del Sundae y Sandwich de Helado en la pantalla del cliente. Posicionar estos productos como "la experiencia completa" versus el cono basico.</p>
  <p class="rec-why"><strong>Por que:</strong> Los conos a $3.000 dominan en unidades pero el Sundae ($9.000) y Sandwich ($15.000) generan 3-5x mas revenue por unidad. La exhibicion visual es clave para impulse buys.</p>
  <p class="rec-impact">Impacto estimado: +${fmt(Math.round(premiumUnits * 0.5 * 12000))} / mes (duplicar ventas premium)</p>
</div>

<div class="rec-card">
  <div class="rec-title">6. Revisar y Depurar el Menu</div>
  <p class="rec-why"><strong>Que:</strong> Evaluar los ${lowPerformers.length} productos con 5 o menos unidades vendidas. Eliminar los que no sean estrategicos, o reposicionarlos con descuentos de lanzamiento.</p>
  <p class="rec-why"><strong>Por que:</strong> Un menu excesivo genera confusion en el cliente, complejidad operativa en cocina y desperdicio de insumos. Simplificar el menu mejora la velocidad de servicio y la calidad.</p>
  <p class="rec-impact">Impacto: Reduccion de desperdicio + mejora en tiempo de servicio</p>
</div>

<div class="rec-card">
  <div class="rec-title">7. Programa de Salsas como Addon Sistematico</div>
  <p class="rec-why"><strong>Que:</strong> Ofrecer las 4 salsas ($2.000 c/u) como paso en el flujo del POS despues de cada comida. Mostrar imagenes de las salsas con descripcion corta de sabor.</p>
  <p class="rec-why"><strong>Por que:</strong> Solo el ${salsaAttachmentRate}% de las ventas de comida incluyen salsas. A $2.000 con costo marginal muy bajo, cada salsa adicional es casi puro margen.</p>
  <p class="rec-impact">Impacto estimado: +${fmt(Math.round(salesWithMainFood.length * 0.15 * 2000))} / mes</p>
</div>

<div class="rec-card">
  <div class="rec-title">8. Potenciar Postres como Cierre de Experiencia</div>
  <p class="rec-why"><strong>Que:</strong> Mostrar el menu de postres en la pantalla del cliente durante los ultimos minutos de la pelicula (si es posible) o como sugerencia post-comida. Considerar un display fisico en el counter.</p>
  <p class="rec-why"><strong>Por que:</strong> Los postres tienen buen precio ($10.000-$12.000) pero baja penetracion (${postreTotalUnits} uds). Son productos de alto margen que se venden por impulso visual.</p>
  <p class="rec-impact">Impacto estimado: +30-50% en ventas de postres</p>
</div>

<div class="rec-card">
  <div class="rec-title">9. Optimizar Staffing Segun Datos</div>
  <p class="rec-why"><strong>Que:</strong> Ajustar turnos segun los patrones temporales: staff completo Vie-Dom de ${Number(peakHour[0]) - 2}:00 a ${Number(peakHour[0]) + 3}:00, staff reducido Lun-Jue.</p>
  <p class="rec-why"><strong>Por que:</strong> El ${weekendPctRevenue}% del revenue se genera en 3 dias. Alinear el costo laboral con la demanda mejora el margen operativo.</p>
  <p class="rec-impact">Impacto: Ahorro estimado 15-20% en costos de personal</p>
</div>

<div class="rec-card">
  <div class="rec-title">10. Tracking y Dashboard Mensual</div>
  <p class="rec-why"><strong>Que:</strong> Implementar un dashboard automatizado que genere estos reportes mensualmente, trackear KPIs clave: ticket promedio, items/venta, attachment rates, revenue por categoria.</p>
  <p class="rec-why"><strong>Por que:</strong> Sin medicion no hay mejora. Los datos de febrero son el baseline; los meses siguientes deben compararse contra este baseline para validar el impacto de las acciones.</p>
  <p class="rec-impact">Impacto: Visibilidad continua para toma de decisiones basada en datos</p>
</div>

<!-- ═══════ 10. CONCLUSIONES ═══════ -->
<h2><span class="section-number">10</span> Conclusiones</h2>

<div class="text-block">
<p>Febrero 2026 establece un baseline solido para FANZINE Cine & Tex-Mex. Con <strong>${fmt(totalRevenue)}</strong> en revenue y <strong>${totalSales} transacciones</strong>, el negocio demuestra traccion en su modelo de cine-restaurante. Las crispetas son el motor indiscutible del revenue, pero las categorias de comidas, helados y postres tienen un potencial significativo sin explotar.</p>

<p>Las tres palancas de crecimiento mas importantes son: (1) <strong>aumentar el ticket promedio</strong> mediante combos y upsell de tamano, (2) <strong>mejorar los attachment rates</strong> de bebidas, helados y salsas con la comida, y (3) <strong>activar los dias entre semana</strong> con promociones tematicas. Estas tres acciones combinadas podrian incrementar el revenue mensual entre un 15-25% sin requerir mas trafico de clientes.</p>

<p>El POS actual ya tiene la infraestructura para implementar muchas de estas recomendaciones (pantalla de cliente para exhibicion visual, flujo de toppings y modificadores). La siguiente fase debe enfocarse en configurar combos inteligentes, sugerencias automaticas en el flujo de venta, y un dashboard de seguimiento mensual para medir el impacto de cada iniciativa.</p>

<p>Este reporte debe usarse como referencia para establecer metas mensuales y evaluar el progreso. Se recomienda generar un reporte equivalente para marzo 2026 y comparar las metricas clave para validar la efectividad de las acciones implementadas.</p>
</div>

<div class="footer">
  FANZINE Cine & Tex-Mex | Reporte Ejecutivo Febrero 2026<br>
  Generado automaticamente desde datos de ventas Fudo POS | ${new Date().toISOString().split("T")[0]}
</div>

</div>
</body>
</html>`;

// ─── Write output ────────────────────────────────────────────────────────────
const outDir = __dirname + "/../docs/febrero";
mkdirSync(outDir, { recursive: true });
const outPath = outDir + "/reporte-ejecutivo-feb2026.html";
writeFileSync(outPath, html, "utf-8");
console.log(`\nReporte escrito: ${outPath}`);
console.log(`Revenue total: ${fmt(totalRevenue)}`);
console.log(`Ventas: ${totalSales}`);
console.log(`Ticket promedio: ${fmt(avgTicket)}`);
console.log(`Items/venta: ${avgItemsPerSale}`);
console.log(`Categorias principales: ${mainCats.length}`);
console.log(`Productos bajo rendimiento: ${lowPerformers.length}`);

execSync(`open "${outPath}"`);
console.log("Archivo abierto en browser.");
