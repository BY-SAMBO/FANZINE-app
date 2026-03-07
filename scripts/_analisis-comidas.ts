import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { execSync } from 'child_process';
import path from 'path';

// ── Load data ──────────────────────────────────────────────────────
const raw = JSON.parse(readFileSync(path.join(__dirname, '_feb-sales-data.json'), 'utf-8'));
const { metadata, products, sales } = raw;

const TOTAL_REVENUE = metadata.totalRevenue;
const TOTAL_SALES = metadata.totalSales;

// Categories to analyze (exclude Crispetas "7" and Helados "12")
const FOOD_CATEGORY_IDS = new Set(['5', '6', '8', '9', '10', '11', '13', '14']);
const CATEGORY_NAMES: Record<string, string> = {
  '5': 'Perros',
  '6': 'Chicanitas',
  '8': 'Milkshakes',
  '9': 'Nachos',
  '10': 'Tacos',
  '11': 'Bebidas',
  '13': 'TEX MEX',
  '14': 'POSTRES',
};

// ── Interfaces ─────────────────────────────────────────────────────
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
interface Sale {
  id: string;
  createdAtCOT: string;
  date: string;
  hour: number;
  dayOfWeek: number;
  dayName: string;
  weekNumber: number;
  total: number;
  items: SaleItem[];
}

// ── Helpers ────────────────────────────────────────────────────────
const fmt = (n: number) => '$' + n.toLocaleString('es-CO');
const pct = (n: number, d: number) => d === 0 ? '0.0%' : (n / d * 100).toFixed(1) + '%';
const fmtPct = (n: number) => n.toFixed(1) + '%';
const pctNum = (n: number, d: number) => d === 0 ? 0 : (n / d * 100);

// ── 1. Collect all food items ──────────────────────────────────────
type FoodItem = SaleItem & { saleId: string; date: string; hour: number; dayOfWeek: number; dayName: string; weekNumber: number };
const allFoodItems: FoodItem[] = [];

for (const sale of sales as Sale[]) {
  for (const item of sale.items) {
    if (item.canceled) continue;
    if (FOOD_CATEGORY_IDS.has(item.categoryId)) {
      allFoodItems.push({
        ...item,
        saleId: sale.id,
        date: sale.date,
        hour: sale.hour,
        dayOfWeek: sale.dayOfWeek,
        dayName: sale.dayName,
        weekNumber: sale.weekNumber,
      });
    }
  }
}

// ── 2. KPIs ────────────────────────────────────────────────────────
const totalFoodRevenue = allFoodItems.reduce((s, i) => s + i.total, 0);
const totalFoodUnits = allFoodItems.reduce((s, i) => s + i.quantity, 0);
const uniqueProducts = new Set(allFoodItems.map(i => i.productId)).size;
const categoriesCount = new Set(allFoodItems.map(i => i.categoryId)).size;

const foodTransactionIds = new Set(allFoodItems.map(i => i.saleId));
const foodTransactions = foodTransactionIds.size;
const avgTicketFood = foodTransactions > 0 ? Math.round(totalFoodRevenue / foodTransactions) : 0;

// ── 3. Category Rankings ───────────────────────────────────────────
interface CatStats {
  catId: string;
  catName: string;
  revenue: number;
  units: number;
  transactions: Set<string>;
  products: Map<string, { name: string; revenue: number; units: number }>;
  byHour: number[];
  byDay: number[];
  byDate: Map<string, number>;
}

const catMap = new Map<string, CatStats>();
for (const id of FOOD_CATEGORY_IDS) {
  catMap.set(id, {
    catId: id,
    catName: CATEGORY_NAMES[id],
    revenue: 0,
    units: 0,
    transactions: new Set(),
    products: new Map(),
    byHour: new Array(24).fill(0),
    byDay: new Array(7).fill(0),
    byDate: new Map(),
  });
}

for (const item of allFoodItems) {
  const cat = catMap.get(item.categoryId)!;
  cat.revenue += item.total;
  cat.units += item.quantity;
  cat.transactions.add(item.saleId);
  cat.byHour[item.hour] += item.quantity;
  cat.byDay[item.dayOfWeek] += item.quantity;
  cat.byDate.set(item.date, (cat.byDate.get(item.date) || 0) + item.total);

  const existing = cat.products.get(item.productId);
  if (existing) {
    existing.revenue += item.total;
    existing.units += item.quantity;
  } else {
    cat.products.set(item.productId, { name: item.productName, revenue: item.total, units: item.quantity });
  }
}

const catsByRevenue = [...catMap.values()].sort((a, b) => b.revenue - a.revenue);
const catsByUnits = [...catMap.values()].sort((a, b) => b.units - a.units);
const maxCatRevenue = catsByRevenue[0]?.revenue || 1;
const maxCatUnits = catsByUnits[0]?.units || 1;

// ── 4. Top Products ───────────────────────────────────────────────
interface ProdStats { productId: string; name: string; categoryName: string; revenue: number; units: number }
const prodMap = new Map<string, ProdStats>();
for (const item of allFoodItems) {
  const existing = prodMap.get(item.productId);
  if (existing) {
    existing.revenue += item.total;
    existing.units += item.quantity;
  } else {
    prodMap.set(item.productId, {
      productId: item.productId,
      name: item.productName,
      categoryName: item.categoryName,
      revenue: item.total,
      units: item.quantity,
    });
  }
}
const topByRevenue = [...prodMap.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 20);
const topByUnits = [...prodMap.values()].sort((a, b) => b.units - a.units).slice(0, 20);
const maxProdRevenue = topByRevenue[0]?.revenue || 1;
const maxProdUnits = topByUnits[0]?.units || 1;

// ── 5. Revenue per unit by category ────────────────────────────────
const revenuePerUnit = catsByRevenue.map(c => ({
  catName: c.catName,
  rpu: c.units > 0 ? Math.round(c.revenue / c.units) : 0,
})).sort((a, b) => b.rpu - a.rpu);

// ── 6. Hourly Distribution ────────────────────────────────────────
const totalByHour = new Array(24).fill(0);
for (const cat of catMap.values()) {
  for (let h = 0; h < 24; h++) totalByHour[h] += cat.byHour[h];
}
const maxHourUnits = Math.max(...totalByHour);
const peakHourGlobal = totalByHour.indexOf(maxHourUnits);

// Compute afternoon vs evening
const afternoonUnits = totalByHour.slice(11, 16).reduce((a, b) => a + b, 0); // 11-15 = 11am-3pm COT
const eveningUnits = totalByHour.slice(16, 22).reduce((a, b) => a + b, 0); // 16-21 = 4pm-9pm COT

// ── 7. Day of Week Distribution ───────────────────────────────────
const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
const totalByDay = new Array(7).fill(0);
for (const cat of catMap.values()) {
  for (let d = 0; d < 7; d++) totalByDay[d] += cat.byDay[d];
}
const maxDayUnits = Math.max(...totalByDay);
const peakDayIdx = totalByDay.indexOf(maxDayUnits);
const weekendUnits = totalByDay[0] + totalByDay[5] + totalByDay[6]; // dom + vie + sab
const weekdayUnits = totalByDay[1] + totalByDay[2] + totalByDay[3] + totalByDay[4];

// ── 8. Daily Trend ─────────────────────────────────────────────────
const dailyRevenue = new Map<string, number>();
for (const item of allFoodItems) {
  dailyRevenue.set(item.date, (dailyRevenue.get(item.date) || 0) + item.total);
}
const dailyEntries = [...dailyRevenue.entries()].sort((a, b) => a[0].localeCompare(b[0]));
const maxDailyRev = Math.max(...dailyEntries.map(e => e[1]));
const minDailyRev = Math.min(...dailyEntries.map(e => e[1]));
const bestDay = dailyEntries.find(e => e[1] === maxDailyRev)!;
const worstDay = dailyEntries.find(e => e[1] === minDailyRev)!;
const avgDailyRev = Math.round(dailyEntries.reduce((s, e) => s + e[1], 0) / dailyEntries.length);

// ── 9. Weekly Trend ────────────────────────────────────────────────
const weeklyRevenue = new Map<number, number>();
for (const item of allFoodItems) {
  weeklyRevenue.set(item.weekNumber, (weeklyRevenue.get(item.weekNumber) || 0) + item.total);
}
const weeklyEntries = [...weeklyRevenue.entries()].sort((a, b) => a[0] - b[0]);
const maxWeeklyRev = Math.max(...weeklyEntries.map(e => e[1]));

// Week-over-week trend
const weeklyGrowth: string[] = [];
for (let i = 1; i < weeklyEntries.length; i++) {
  const prev = weeklyEntries[i - 1][1];
  const curr = weeklyEntries[i][1];
  const change = ((curr - prev) / prev * 100).toFixed(1);
  weeklyGrowth.push(`Sem ${weeklyEntries[i][0]}: ${Number(change) >= 0 ? '+' : ''}${change}%`);
}

// ── 10. Cross-sell / Co-occurrence matrix ──────────────────────────
const catIds = [...FOOD_CATEGORY_IDS];
const coOccurrence: Record<string, Record<string, number>> = {};
for (const a of catIds) {
  coOccurrence[a] = {};
  for (const b of catIds) coOccurrence[a][b] = 0;
}

const saleCats = new Map<string, Set<string>>();
for (const sale of sales as Sale[]) {
  const cats = new Set<string>();
  for (const item of sale.items) {
    if (!item.canceled && FOOD_CATEGORY_IDS.has(item.categoryId)) {
      cats.add(item.categoryId);
    }
  }
  if (cats.size > 0) saleCats.set(sale.id, cats);
}

for (const [, cats] of saleCats) {
  const arr = [...cats];
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr.length; j++) {
      coOccurrence[arr[i]][arr[j]]++;
    }
  }
}

// Find strongest cross-sell pairs
const crossSellPairs: { a: string; b: string; pctAB: number; pctBA: number }[] = [];
for (let i = 0; i < catIds.length; i++) {
  for (let j = i + 1; j < catIds.length; j++) {
    const a = catIds[i], b = catIds[j];
    const totalA = coOccurrence[a][a], totalB = coOccurrence[b][b];
    const shared = coOccurrence[a][b];
    if (totalA > 0 && totalB > 0) {
      crossSellPairs.push({
        a: CATEGORY_NAMES[a],
        b: CATEGORY_NAMES[b],
        pctAB: shared / totalA * 100,
        pctBA: shared / totalB * 100,
      });
    }
  }
}
crossSellPairs.sort((a, b) => Math.max(b.pctAB, b.pctBA) - Math.max(a.pctAB, a.pctBA));

// ── 11. Battle: Perros vs Tacos vs Nachos ──────────────────────────
const battleCats = ['5', '10', '9'];
const battleData = battleCats.map(id => {
  const cat = catMap.get(id)!;
  const peakHour = cat.byHour.indexOf(Math.max(...cat.byHour));
  return {
    name: cat.catName,
    catId: id,
    revenue: cat.revenue,
    units: cat.units,
    transactions: cat.transactions.size,
    avgTicket: cat.transactions.size > 0 ? Math.round(cat.revenue / cat.transactions.size) : 0,
    rpu: cat.units > 0 ? Math.round(cat.revenue / cat.units) : 0,
    peakHour,
  };
});
const battleWinnerRevenue = battleData.reduce((best, b) => b.revenue > best.revenue ? b : best, battleData[0]);
const battleWinnerUnits = battleData.reduce((best, b) => b.units > best.units ? b : best, battleData[0]);

// ── 12. Bebidas penetration ────────────────────────────────────────
const bebidasCat = catMap.get('11')!;
const bebidasPenetration = TOTAL_SALES > 0 ? (bebidasCat.transactions.size / TOTAL_SALES * 100) : 0;

// Bebidas with food vs solo
let bebidasWithFoodTx = 0;
let bebidasSoloTx = 0;
for (const saleId of bebidasCat.transactions) {
  const sale = (sales as Sale[]).find(s => s.id === saleId);
  if (!sale) continue;
  const hasOther = sale.items.some(i => !i.canceled && FOOD_CATEGORY_IDS.has(i.categoryId) && i.categoryId !== '11');
  if (hasOther) bebidasWithFoodTx++;
  else bebidasSoloTx++;
}

// ── 13. Salsas analysis ───────────────────────────────────────────
const salsaProductIds = new Set<string>();
for (const [pid, prod] of Object.entries(products)) {
  const p = prod as any;
  if (p.categoryId === '13' && p.price === 2000) salsaProductIds.add(pid);
}

const salsaItems = allFoodItems.filter(i => salsaProductIds.has(i.productId));
const salsaRevenue = salsaItems.reduce((s, i) => s + i.total, 0);
const salsaUnits = salsaItems.reduce((s, i) => s + i.quantity, 0);
const salsaTransactions = new Set(salsaItems.map(i => i.saleId));

const salsaCompanions = new Map<string, number>();
for (const saleId of salsaTransactions) {
  const sale = (sales as Sale[]).find(s => s.id === saleId);
  if (!sale) continue;
  for (const item of sale.items) {
    if (item.canceled) continue;
    if (salsaProductIds.has(item.productId)) continue;
    if (FOOD_CATEGORY_IDS.has(item.categoryId)) {
      salsaCompanions.set(item.productName, (salsaCompanions.get(item.productName) || 0) + item.quantity);
    }
  }
}
const topSalsaCompanions = [...salsaCompanions.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);

// Salsas per tx breakdown
const salsaByName = new Map<string, number>();
for (const i of salsaItems) {
  salsaByName.set(i.productName, (salsaByName.get(i.productName) || 0) + i.quantity);
}

// ── 14. Postres: solo vs add-on ────────────────────────────────────
const postresCat = catMap.get('14')!;
let postresOnlyTx = 0;
let postresAddonTx = 0;
for (const saleId of postresCat.transactions) {
  const sale = (sales as Sale[]).find(s => s.id === saleId);
  if (!sale) continue;
  const hasOtherFood = sale.items.some(i => !i.canceled && FOOD_CATEGORY_IDS.has(i.categoryId) && i.categoryId !== '14');
  if (hasOtherFood) postresAddonTx++;
  else postresOnlyTx++;
}
const postresTotalTx = postresOnlyTx + postresAddonTx;

// ── 15. Chicanitas analysis ────────────────────────────────────────
const chicanitasCat = catMap.get('6')!;
const chicanitasAvgPerTx = chicanitasCat.transactions.size > 0
  ? (chicanitasCat.units / chicanitasCat.transactions.size).toFixed(1)
  : '0';

const chicanitasPerTx = new Map<string, number>();
for (const item of allFoodItems) {
  if (item.categoryId !== '6') continue;
  chicanitasPerTx.set(item.saleId, (chicanitasPerTx.get(item.saleId) || 0) + item.quantity);
}
const chicanitasDistribution = new Map<number, number>();
for (const [, count] of chicanitasPerTx) {
  chicanitasDistribution.set(count, (chicanitasDistribution.get(count) || 0) + 1);
}
const chicanitasDistEntries = [...chicanitasDistribution.entries()].sort((a, b) => a[0] - b[0]);

// ── 16. TEX MEX non-salsas analysis ───────────────────────────────
const texMexCat = catMap.get('13')!;
const texMexNonSalsa = [...texMexCat.products.entries()]
  .filter(([pid]) => !salsaProductIds.has(pid))
  .map(([, p]) => p)
  .sort((a, b) => b.revenue - a.revenue);
const texMexNonSalsaRevenue = texMexNonSalsa.reduce((s, p) => s + p.revenue, 0);

// ── 17. Milkshakes ─────────────────────────────────────────────────
const milkshakesCat = catMap.get('8')!;

// ── 18. Top 5 categories for heatmap ───────────────────────────────
const top5Cats = catsByRevenue.slice(0, 5);

// ── 19. Additional insights computation ────────────────────────────
// Concentration: top 3 products as % of total food revenue
const top3ProdRevenue = topByRevenue.slice(0, 3).reduce((s, p) => s + p.revenue, 0);
const top3Concentration = pctNum(top3ProdRevenue, totalFoodRevenue);

// Average categories per transaction
let totalCatsPerTx = 0;
for (const [, cats] of saleCats) totalCatsPerTx += cats.size;
const avgCatsPerTx = (totalCatsPerTx / saleCats.size).toFixed(1);

// Perros sub-category: toppings vs solo
const perrosCat = catMap.get('5')!;
const perrosConToppings = [...perrosCat.products.values()].filter(p => p.name.toLowerCase().includes('topping'));
const perrosSolo = [...perrosCat.products.values()].filter(p => p.name.toLowerCase().includes('solo'));
const perrosSalchi = [...perrosCat.products.values()].filter(p => p.name.toLowerCase().includes('salchi'));
const perrosCorndog = [...perrosCat.products.values()].filter(p => p.name.toLowerCase().includes('corndog'));

// Nachos pricing tiers
const nachosCat = catMap.get('9')!;
const nachosPremium = [...nachosCat.products.values()].filter(p => {
  const prod = Object.values(products).find((pr: any) => pr.name === p.name) as any;
  return prod && prod.price >= 18000;
});
const nachosEconomy = [...nachosCat.products.values()].filter(p => {
  const prod = Object.values(products).find((pr: any) => pr.name === p.name) as any;
  return prod && prod.price < 18000;
});

// ── BUILD HTML ─────────────────────────────────────────────────────

const bar = (value: number, max: number, color: string = '#4ade80') =>
  `<div style="background:${color};height:18px;width:${Math.max((value / max) * 100, 0.5)}%;border-radius:3px;"></div>`;

let html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Analisis Comidas - Febrero 2026 - FANZINE</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0f0f0f; color: #e0e0e0; font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; padding: 24px; line-height: 1.6; }
  h1 { font-size: 28px; font-weight: 700; margin-bottom: 8px; color: #ffffff; }
  h2 { font-size: 20px; font-weight: 600; margin: 40px 0 16px; color: #ffffff; border-bottom: 1px solid #333; padding-bottom: 8px; }
  h3 { font-size: 16px; font-weight: 600; margin: 24px 0 12px; color: #d0d0d0; }
  .subtitle { color: #888; font-size: 14px; margin-bottom: 24px; }
  .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 32px; }
  .kpi { background: #1a1a1a; border-radius: 12px; padding: 20px; border: 1px solid #2a2a2a; }
  .kpi .label { font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; }
  .kpi .value { font-size: 28px; font-weight: 700; color: #ffffff; margin-top: 4px; }
  .kpi .sub { font-size: 12px; color: #4ade80; margin-top: 2px; }
  .kpi .sub.orange { color: #fb923c; }
  .kpi .sub.blue { color: #60a5fa; }
  .kpi .sub.purple { color: #c084fc; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  th { text-align: left; padding: 10px 12px; border-bottom: 2px solid #333; color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
  td { padding: 8px 12px; border-bottom: 1px solid #1f1f1f; font-size: 14px; }
  tr:hover td { background: #1a1a1a; }
  .right { text-align: right; }
  .mono { font-family: 'SF Mono', 'Fira Code', monospace; }
  .card { background: #1a1a1a; border-radius: 12px; padding: 20px; border: 1px solid #2a2a2a; margin-bottom: 24px; }
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
  .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
  .badge-green { background: #166534; color: #4ade80; }
  .badge-orange { background: #7c2d12; color: #fb923c; }
  .badge-blue { background: #1e3a5f; color: #60a5fa; }
  .badge-purple { background: #3b0764; color: #c084fc; }
  .badge-red { background: #7f1d1d; color: #fca5a5; }
  .bar-container { height: 18px; background: #222; border-radius: 3px; overflow: hidden; }
  .heatmap-cell { text-align: center; padding: 4px; font-size: 11px; border-radius: 3px; }
  .section { margin-bottom: 40px; }
  .insight { background: #111; border-left: 3px solid #4ade80; padding: 14px 18px; margin: 16px 0; border-radius: 0 8px 8px 0; font-size: 14px; line-height: 1.7; color: #ccc; }
  .insight.warning { border-left-color: #fb923c; }
  .insight.info { border-left-color: #60a5fa; }
  .insight.purple { border-left-color: #c084fc; }
  .insight strong { color: #fff; }
  .executive-summary { background: linear-gradient(135deg, #1a1a2e, #16213e); border: 1px solid #2a2a4a; border-radius: 16px; padding: 28px; margin-bottom: 32px; }
  .executive-summary p { margin-bottom: 12px; font-size: 15px; line-height: 1.8; color: #d0d0d0; }
  .executive-summary p:last-child { margin-bottom: 0; }
  .opp-card { background: #0d1f0d; border: 1px solid #166534; border-radius: 12px; padding: 18px; margin-bottom: 12px; }
  .opp-card h4 { color: #4ade80; font-size: 14px; margin-bottom: 6px; }
  .opp-card p { font-size: 13px; color: #bbb; margin: 0; }
  .alert-card { background: #1f0d0d; border: 1px solid #7f1d1d; border-radius: 12px; padding: 18px; margin-bottom: 12px; }
  .alert-card h4 { color: #fca5a5; font-size: 14px; margin-bottom: 6px; }
  .alert-card p { font-size: 13px; color: #bbb; margin: 0; }
  @media (max-width: 768px) {
    .grid-2, .grid-3 { grid-template-columns: 1fr; }
    .kpi-grid { grid-template-columns: repeat(2, 1fr); }
    body { padding: 12px; }
  }
</style>
</head>
<body>

<h1>FANZINE -- Analisis de Comidas</h1>
<p class="subtitle">Febrero 2026 &bull; 8 categorias de comida (excl. Helados y Crispetas) &bull; ${TOTAL_SALES} transacciones totales &bull; Revenue total negocio: ${fmt(TOTAL_REVENUE)}</p>

<!-- ============================================== -->
<!-- RESUMEN EJECUTIVO -->
<!-- ============================================== -->
<div class="executive-summary">
  <h2 style="margin-top:0;border:none;padding:0;margin-bottom:16px;">Resumen Ejecutivo</h2>
  <p>
    Las 8 categorias de comida analizadas (Perros, Chicanitas, Nachos, Tacos, Bebidas, Milkshakes, TEX MEX y Postres)
    generaron <strong>${fmt(totalFoodRevenue)}</strong> en febrero 2026, representando el <strong>${pct(totalFoodRevenue, TOTAL_REVENUE)}</strong>
    del revenue total del negocio. Esto confirma que la oferta gastronomica es el pilar principal de FANZINE,
    con ${foodTransactions} transacciones conteniendo al menos un item de comida (${pct(foodTransactions, TOTAL_SALES)} del total).
  </p>
  <p>
    <strong>${catsByRevenue[0].catName}</strong> lidera en revenue con ${fmt(catsByRevenue[0].revenue)} (${pct(catsByRevenue[0].revenue, totalFoodRevenue)} de comidas),
    mientras que <strong>${catsByUnits[0].catName}</strong> lidera en volumen con ${catsByUnits[0].units} unidades vendidas.
    El ticket promedio de transacciones con comida es <strong>${fmt(avgTicketFood)}</strong>,
    y en promedio cada transaccion incluye items de <strong>${avgCatsPerTx} categorias</strong> distintas,
    lo que sugiere ${Number(avgCatsPerTx) > 1.5 ? 'un buen nivel de cross-selling entre categorias' : 'oportunidad de mejorar el cross-selling'}.
  </p>
  <p>
    Los <strong>3 productos estrella</strong> (${topByRevenue.slice(0, 3).map(p => p.name).join(', ')}) concentran
    el <strong>${fmtPct(top3Concentration)}%</strong> del revenue de comidas,
    lo que indica ${top3Concentration > 40 ? 'una dependencia alta de pocos productos -- hay riesgo si alguno pierde traccion' : 'una diversificacion saludable del revenue'}.
    El patr&oacute;n horario muestra que la operacion se concentra entre las horas ${peakHourGlobal - 1}:00 y ${peakHourGlobal + 2}:00 (hora COT ajustada),
    con <strong>${DAY_NAMES[peakDayIdx]}</strong> como el dia mas fuerte de la semana.
  </p>
  <p>
    Las bebidas penetran solo el <strong>${fmtPct(bebidasPenetration)}%</strong> de todas las transacciones,
    ${bebidasPenetration < 30 ? 'lo cual es bajo para un restaurante -- hay una oportunidad clara de upselling' : 'un nivel aceptable pero con margen de mejora'}.
    Los postres funcionan mayoritariamente como <strong>${postresAddonTx > postresOnlyTx ? 'add-on' : 'compra independiente'}</strong>
    (${pct(postresAddonTx, postresTotalTx)} se compran acompanados de otras comidas),
    y las salsas TEX MEX solo aparecen en el ${fmtPct(salsaTransactions.size / TOTAL_SALES * 100)}% de transacciones,
    sugiriendo que el equipo de caja no las esta ofreciendo activamente.
  </p>
</div>

<!-- ============================================== -->
<!-- KPIs -->
<!-- ============================================== -->
<div class="kpi-grid">
  <div class="kpi">
    <div class="label">Revenue Comidas</div>
    <div class="value">${fmt(totalFoodRevenue)}</div>
    <div class="sub">${pct(totalFoodRevenue, TOTAL_REVENUE)} del total</div>
  </div>
  <div class="kpi">
    <div class="label">Unidades Vendidas</div>
    <div class="value">${totalFoodUnits.toLocaleString('es-CO')}</div>
    <div class="sub blue">${uniqueProducts} productos unicos</div>
  </div>
  <div class="kpi">
    <div class="label">Transacciones c/ comida</div>
    <div class="value">${foodTransactions}</div>
    <div class="sub purple">${pct(foodTransactions, TOTAL_SALES)} de todas</div>
  </div>
  <div class="kpi">
    <div class="label">Ticket Promedio Comida</div>
    <div class="value">${fmt(avgTicketFood)}</div>
    <div class="sub orange">por tx con comida</div>
  </div>
  <div class="kpi">
    <div class="label">Categorias por Tx</div>
    <div class="value">${avgCatsPerTx}</div>
    <div class="sub">promedio de categorias</div>
  </div>
  <div class="kpi">
    <div class="label">Revenue Total Negocio</div>
    <div class="value">${fmt(TOTAL_REVENUE)}</div>
    <div class="sub blue">referencia</div>
  </div>
</div>

<!-- ============================================== -->
<!-- RANKING CATEGORIAS POR REVENUE -->
<!-- ============================================== -->
<div class="section">
<h2>Ranking de Categorias por Revenue</h2>
<table>
  <tr><th>#</th><th>Categoria</th><th class="right">Revenue</th><th class="right">% Comidas</th><th class="right">% Negocio</th><th style="width:30%">Visual</th></tr>
  ${catsByRevenue.map((c, i) => `<tr>
    <td>${i + 1}</td>
    <td><strong>${c.catName}</strong></td>
    <td class="right mono">${fmt(c.revenue)}</td>
    <td class="right mono">${pct(c.revenue, totalFoodRevenue)}</td>
    <td class="right mono">${pct(c.revenue, TOTAL_REVENUE)}</td>
    <td><div class="bar-container">${bar(c.revenue, maxCatRevenue, ['#4ade80','#60a5fa','#fb923c','#c084fc','#f472b6','#facc15','#34d399','#a78bfa'][i])}</div></td>
  </tr>`).join('')}
</table>
<div class="insight">
  <strong>Interpretacion:</strong> ${catsByRevenue[0].catName} es el motor de revenue con ${pct(catsByRevenue[0].revenue, totalFoodRevenue)},
  pero ${catsByRevenue[1].catName} le sigue de cerca.
  ${catsByRevenue.length > 2 ? `Las 3 categorias principales (${catsByRevenue.slice(0, 3).map(c => c.catName).join(', ')}) concentran el ${pct(catsByRevenue.slice(0, 3).reduce((s, c) => s + c.revenue, 0), totalFoodRevenue)} del revenue de comidas.` : ''}
  ${catsByRevenue[catsByRevenue.length - 1].catName} es la categoria mas debil con apenas ${pct(catsByRevenue[catsByRevenue.length - 1].revenue, totalFoodRevenue)},
  lo que podria indicar falta de visibilidad en el menu o poca demanda natural.
</div>
</div>

<!-- ============================================== -->
<!-- RANKING CATEGORIAS POR UNIDADES -->
<!-- ============================================== -->
<div class="section">
<h2>Ranking de Categorias por Unidades Vendidas</h2>
<table>
  <tr><th>#</th><th>Categoria</th><th class="right">Unidades</th><th class="right">% Total</th><th style="width:35%">Visual</th></tr>
  ${catsByUnits.map((c, i) => `<tr>
    <td>${i + 1}</td>
    <td><strong>${c.catName}</strong></td>
    <td class="right mono">${c.units.toLocaleString('es-CO')}</td>
    <td class="right mono">${pct(c.units, totalFoodUnits)}</td>
    <td><div class="bar-container">${bar(c.units, maxCatUnits, ['#4ade80','#60a5fa','#fb923c','#c084fc','#f472b6','#facc15','#34d399','#a78bfa'][i])}</div></td>
  </tr>`).join('')}
</table>
<div class="insight info">
  <strong>Patron interesante:</strong> ${catsByUnits[0].catName === catsByRevenue[0].catName
    ? `${catsByUnits[0].catName} lidera tanto en volumen como en revenue, confirmandola como la categoria ancla del negocio.`
    : `${catsByUnits[0].catName} lidera en volumen pero ${catsByRevenue[0].catName} lidera en revenue. Esto se debe a la diferencia de precio unitario -- ${catsByUnits[0].catName} mueve mas unidades a menor precio.`}
  Las Bebidas, con precio unitario bajo ($3,500-$6,000), naturalmente ocupan un lugar alto en volumen pero su contribucion al revenue depende de la penetracion.
</div>
</div>

<!-- ============================================== -->
<!-- REVENUE POR UNIDAD -->
<!-- ============================================== -->
<div class="section">
<h2>Revenue por Unidad por Categoria</h2>
<table>
  <tr><th>Categoria</th><th class="right">Revenue / Unidad</th><th style="width:35%">Visual</th></tr>
  ${revenuePerUnit.map(c => `<tr>
    <td><strong>${c.catName}</strong></td>
    <td class="right mono">${fmt(c.rpu)}</td>
    <td><div class="bar-container">${bar(c.rpu, revenuePerUnit[0].rpu, '#fb923c')}</div></td>
  </tr>`).join('')}
</table>
<div class="insight warning">
  <strong>Valor por unidad:</strong> ${revenuePerUnit[0].catName} tiene el mayor valor por unidad (${fmt(revenuePerUnit[0].rpu)}),
  lo que la convierte en la categoria mas rentable por item vendido.
  ${revenuePerUnit[revenuePerUnit.length - 1].catName} tiene el menor valor (${fmt(revenuePerUnit[revenuePerUnit.length - 1].rpu)}),
  pero puede funcionar como categoria de entrada o add-on que aumenta el ticket total.
  Para maximizar revenue, el enfoque del upselling deberia dirigirse hacia ${revenuePerUnit[0].catName} y ${revenuePerUnit[1].catName}.
</div>
</div>

<!-- ============================================== -->
<!-- TOP 20 PRODUCTOS POR REVENUE -->
<!-- ============================================== -->
<div class="section">
<h2>Top 20 Productos por Revenue</h2>
<table>
  <tr><th>#</th><th>Producto</th><th>Categoria</th><th class="right">Revenue</th><th class="right">Uds</th><th style="width:25%">Visual</th></tr>
  ${topByRevenue.map((p, i) => `<tr>
    <td>${i + 1}</td>
    <td>${p.name}</td>
    <td><span class="badge badge-blue">${p.categoryName}</span></td>
    <td class="right mono">${fmt(p.revenue)}</td>
    <td class="right mono">${p.units}</td>
    <td><div class="bar-container">${bar(p.revenue, maxProdRevenue, '#4ade80')}</div></td>
  </tr>`).join('')}
</table>
<div class="insight">
  <strong>Productos estrella:</strong> <strong>${topByRevenue[0].name}</strong> es el producto #1 con ${fmt(topByRevenue[0].revenue)},
  representando el ${pct(topByRevenue[0].revenue, totalFoodRevenue)} de todo el revenue de comidas.
  Los top 5 productos son: ${topByRevenue.slice(0, 5).map((p, i) => `${i + 1}) ${p.name} (${fmt(p.revenue)})`).join(', ')}.
  Notar la concentracion de categorias en el top 10 --
  ${(() => {
    const catCount: Record<string, number> = {};
    topByRevenue.slice(0, 10).forEach(p => catCount[p.categoryName] = (catCount[p.categoryName] || 0) + 1);
    return Object.entries(catCount).sort((a, b) => b[1] - a[1]).map(([cat, count]) => `${cat} (${count} prods)`).join(', ');
  })()} -- esto indica donde esta la verdadera fuerza del menu.
</div>
</div>

<!-- ============================================== -->
<!-- TOP 20 PRODUCTOS POR UNIDADES -->
<!-- ============================================== -->
<div class="section">
<h2>Top 20 Productos por Unidades</h2>
<table>
  <tr><th>#</th><th>Producto</th><th>Categoria</th><th class="right">Uds</th><th class="right">Revenue</th><th style="width:25%">Visual</th></tr>
  ${topByUnits.map((p, i) => `<tr>
    <td>${i + 1}</td>
    <td>${p.name}</td>
    <td><span class="badge badge-green">${p.categoryName}</span></td>
    <td class="right mono">${p.units}</td>
    <td class="right mono">${fmt(p.revenue)}</td>
    <td><div class="bar-container">${bar(p.units, maxProdUnits, '#60a5fa')}</div></td>
  </tr>`).join('')}
</table>
<div class="insight info">
  <strong>Volumen vs Valor:</strong> ${topByUnits[0].name} lidera en unidades (${topByUnits[0].units} uds).
  ${topByUnits[0].name !== topByRevenue[0].name
    ? `Interesante: el producto con mas volumen (${topByUnits[0].name}) NO es el de mayor revenue (${topByRevenue[0].name}), lo que sugiere una diferencia importante de precios entre los mas populares.`
    : `Este producto tambien lidera en revenue, confirmandolo como el ancla absoluta del menu.`}
  Los productos de bajo precio pero alto volumen (como bebidas y chicanitas) son clave para la experiencia pero no para el revenue directo.
</div>
</div>

<!-- ============================================== -->
<!-- DISTRIBUCION POR HORA -->
<!-- ============================================== -->
<div class="section">
<h2>Distribucion por Hora (Todas las Comidas)</h2>
<div class="card">
<table>
  <tr><th>Hora</th><th class="right">Uds</th><th style="width:55%">Visual</th></tr>
  ${totalByHour.map((v, h) => v > 0 ? `<tr>
    <td class="mono">${String(h).padStart(2, '0')}:00</td>
    <td class="right mono">${v}</td>
    <td><div class="bar-container">${bar(v, maxHourUnits, '#c084fc')}</div></td>
  </tr>` : '').join('')}
</table>
</div>
<div class="insight purple">
  <strong>Patron horario:</strong> La hora pico es las <strong>${String(peakHourGlobal).padStart(2, '0')}:00</strong> (UTC, que corresponde a las ${peakHourGlobal - 5 >= 0 ? peakHourGlobal - 5 : peakHourGlobal + 19}:00 hora Colombia).
  La distribucion entre tarde (11-15h UTC = apertura-tarde COT: ${afternoonUnits} uds) y noche (16-21h UTC = tarde-noche COT: ${eveningUnits} uds)
  muestra que ${eveningUnits > afternoonUnits ? 'la noche domina claramente -- FANZINE es esencialmente un destino nocturno para comida' : 'la tarde y la noche estan equilibradas, lo que indica buena operacion en ambos turnos'}.
  Esto es coherente con un cine-restaurante donde la funcion de noche impulsa las ventas de comida.
</div>
</div>

<!-- ============================================== -->
<!-- HEATMAP HORA x CATEGORIA -->
<!-- ============================================== -->
<div class="section">
<h2>Distribucion por Hora por Categoria (Top 5)</h2>
<div class="card" style="overflow-x:auto;">
<table>
  <tr><th>Hora</th>${top5Cats.map(c => `<th class="right">${c.catName}</th>`).join('')}</tr>
  ${Array.from({ length: 24 }, (_, h) => {
    const anyVal = top5Cats.some(c => c.byHour[h] > 0);
    if (!anyVal) return '';
    return `<tr>
      <td class="mono">${String(h).padStart(2, '0')}:00</td>
      ${top5Cats.map(c => {
        const v = c.byHour[h];
        const maxH = Math.max(...c.byHour);
        const intensity = maxH > 0 ? v / maxH : 0;
        const bg = intensity > 0.8 ? '#166534' : intensity > 0.5 ? '#14532d' : intensity > 0.2 ? '#1a2e1a' : intensity > 0 ? '#151f15' : 'transparent';
        return `<td class="right heatmap-cell" style="background:${bg}">${v > 0 ? v : '-'}</td>`;
      }).join('')}
    </tr>`;
  }).join('')}
</table>
</div>
<div class="insight info">
  <strong>Diferencias entre categorias:</strong> No todas las categorias se comportan igual durante el dia.
  Las comidas fuertes (Nachos, Tacos, Perros) tienden a concentrarse en horarios de comida/cena,
  mientras que Bebidas y Chicanitas se distribuyen mas uniformemente como items de acompanamiento.
  ${milkshakesCat.units > 20 ? 'Los Milkshakes muestran un pico definido que sugiere un momento de consumo especifico -- probablemente asociado al cine.' : ''}
</div>
</div>

<!-- ============================================== -->
<!-- DIA DE SEMANA -->
<!-- ============================================== -->
<div class="section">
<h2>Distribucion por Dia de Semana</h2>
<div class="card">
<table>
  <tr><th>Dia</th><th class="right">Uds</th><th style="width:55%">Visual</th></tr>
  ${DAY_NAMES.map((name, d) => `<tr>
    <td>${name}</td>
    <td class="right mono">${totalByDay[d]}</td>
    <td><div class="bar-container">${bar(totalByDay[d], maxDayUnits, '#facc15')}</div></td>
  </tr>`).join('')}
</table>
</div>
<div class="insight">
  <strong>${DAY_NAMES[peakDayIdx]}</strong> es el dia mas fuerte con ${totalByDay[peakDayIdx]} unidades.
  Fin de semana (Vie+Sab+Dom) acumula <strong>${weekendUnits} unidades</strong> (${pct(weekendUnits, weekendUnits + weekdayUnits)}),
  versus Lun-Jue con ${weekdayUnits} unidades (${pct(weekdayUnits, weekendUnits + weekdayUnits)}).
  ${weekendUnits > weekdayUnits * 1.5
    ? 'La dependencia del fin de semana es alta. Considerar promociones entre semana (martes de tacos, miercoles de nachos) para equilibrar la demanda y mejorar la utilizacion del local en dias lentos.'
    : 'La distribucion entre semana y fin de semana es relativamente equilibrada, lo cual es positivo para la operacion.'}
</div>
</div>

<!-- ============================================== -->
<!-- HEATMAP DIA x CATEGORIA -->
<!-- ============================================== -->
<div class="section">
<h2>Unidades por Dia de Semana por Categoria</h2>
<div class="card" style="overflow-x:auto;">
<table>
  <tr><th>Dia</th>${catsByRevenue.map(c => `<th class="right">${c.catName}</th>`).join('')}</tr>
  ${DAY_NAMES.map((name, d) => `<tr>
    <td>${name}</td>
    ${catsByRevenue.map(c => {
      const v = c.byDay[d];
      const maxD = Math.max(...c.byDay);
      const intensity = maxD > 0 ? v / maxD : 0;
      const bg = intensity > 0.8 ? '#1e3a5f' : intensity > 0.5 ? '#172554' : intensity > 0.2 ? '#161e35' : intensity > 0 ? '#13151f' : 'transparent';
      return `<td class="right heatmap-cell" style="background:${bg}">${v > 0 ? v : '-'}</td>`;
    }).join('')}
  </tr>`).join('')}
</table>
</div>
</div>

<!-- ============================================== -->
<!-- TENDENCIA DIARIA -->
<!-- ============================================== -->
<div class="section">
<h2>Tendencia Diaria - Revenue Comidas</h2>
<div class="card">
<table>
  <tr><th>Fecha</th><th class="right">Revenue</th><th style="width:50%">Visual</th></tr>
  ${dailyEntries.map(([date, rev]) => `<tr>
    <td class="mono">${date}</td>
    <td class="right mono">${fmt(rev)}</td>
    <td><div class="bar-container">${bar(rev, maxDailyRev, '#34d399')}</div></td>
  </tr>`).join('')}
</table>
</div>
<div class="insight">
  <strong>Mejor dia:</strong> ${bestDay[0]} con ${fmt(bestDay[1])}.
  <strong>Peor dia:</strong> ${worstDay[0]} con ${fmt(worstDay[1])}.
  El promedio diario es <strong>${fmt(avgDailyRev)}</strong>.
  La variacion entre el mejor y peor dia es de ${((bestDay[1] / worstDay[1] - 1) * 100).toFixed(0)}%,
  ${bestDay[1] / worstDay[1] > 5 ? 'una variacion extrema que indica dias muy irregulares -- posiblemente por eventos o clima' : 'lo cual es normal para un restaurante con ciclos semanales'}.
</div>
</div>

<!-- ============================================== -->
<!-- TENDENCIA SEMANAL -->
<!-- ============================================== -->
<div class="section">
<h2>Tendencia Semanal - Revenue Comidas</h2>
<div class="card">
<table>
  <tr><th>Semana</th><th class="right">Revenue</th><th style="width:50%">Visual</th></tr>
  ${weeklyEntries.map(([week, rev]) => `<tr>
    <td>Semana ${week}</td>
    <td class="right mono">${fmt(rev)}</td>
    <td><div class="bar-container">${bar(rev, maxWeeklyRev, '#a78bfa')}</div></td>
  </tr>`).join('')}
</table>
</div>
<div class="insight info">
  <strong>Evolucion semanal:</strong> ${weeklyGrowth.join(' &rarr; ')}.
  ${weeklyEntries.length >= 3 ? (() => {
    const first = weeklyEntries[0][1];
    const last = weeklyEntries[weeklyEntries.length - 1][1];
    const trend = ((last - first) / first * 100).toFixed(1);
    return Number(trend) > 0
      ? `La tendencia general es <strong>positiva (+${trend}%)</strong> desde la primera a la ultima semana, lo que indica crecimiento en la demanda de comida.`
      : `La tendencia muestra una <strong>caida del ${Math.abs(Number(trend)).toFixed(1)}%</strong> de la primera a la ultima semana. Vale investigar si esto es estacional o si hay algun problema operativo.`;
  })() : ''}
</div>
</div>

<!-- ============================================== -->
<!-- CROSS-SELL MATRIX -->
<!-- ============================================== -->
<div class="section">
<h2>Cross-Sell: Matriz de Co-ocurrencia</h2>
<p class="subtitle">% de transacciones de la categoria fila que tambien contienen la categoria columna</p>
<div class="card" style="overflow-x:auto;">
<table>
  <tr><th></th>${catIds.map(id => `<th class="right" style="font-size:11px;">${CATEGORY_NAMES[id]}</th>`).join('')}</tr>
  ${catIds.map(rowId => {
    const rowTotal = coOccurrence[rowId][rowId];
    return `<tr>
      <td><strong>${CATEGORY_NAMES[rowId]}</strong></td>
      ${catIds.map(colId => {
        const val = coOccurrence[rowId][colId];
        const pctVal = rowTotal > 0 ? (val / rowTotal * 100) : 0;
        const bg = rowId === colId ? '#2a2a2a' : pctVal > 30 ? '#166534' : pctVal > 15 ? '#14532d' : pctVal > 5 ? '#1a2e1a' : 'transparent';
        return `<td class="right heatmap-cell" style="background:${bg};font-size:12px;">${rowId === colId ? '-' : fmtPct(pctVal)}</td>`;
      }).join('')}
    </tr>`;
  }).join('')}
</table>
</div>
<div class="insight">
  <strong>Mejores parejas de cross-sell:</strong><br>
  ${crossSellPairs.slice(0, 5).map(p =>
    `&bull; <strong>${p.a} + ${p.b}:</strong> ${fmtPct(p.pctAB)}% de transacciones de ${p.a} incluyen ${p.b}, y ${fmtPct(p.pctBA)}% viceversa`
  ).join('<br>')}
  <br><br>
  <strong>Implicacion:</strong> Las categorias con alta co-ocurrencia son candidatas naturales para combos.
  ${crossSellPairs.length > 0 && Math.max(crossSellPairs[0].pctAB, crossSellPairs[0].pctBA) > 30
    ? `La pareja ${crossSellPairs[0].a}+${crossSellPairs[0].b} ya se compra junta frecuentemente -- un combo formal podria capturar mas valor.`
    : 'Ningun par tiene co-ocurrencia por encima del 30%, lo que sugiere oportunidad de crear combos que incentiven la compra conjunta.'}
</div>
</div>

<!-- ============================================== -->
<!-- BATTLE: PERROS vs TACOS vs NACHOS -->
<!-- ============================================== -->
<div class="section">
<h2>BATTLE: Perros vs Tacos vs Nachos</h2>
<div class="grid-3">
  ${battleData.map((b, i) => {
    const colors = ['#4ade80', '#60a5fa', '#fb923c'];
    const isWinnerRev = b.name === battleWinnerRevenue.name;
    const isWinnerUnits = b.name === battleWinnerUnits.name;
    return `<div class="card" style="border-color:${colors[i]}44;">
      <h3 style="color:${colors[i]};margin:0 0 12px;">${b.name} ${isWinnerRev ? '<span class="badge badge-green">Revenue #1</span>' : ''} ${isWinnerUnits && !isWinnerRev ? '<span class="badge badge-blue">Volumen #1</span>' : ''}</h3>
      <div style="margin-bottom:8px;"><span style="color:#888;font-size:12px;">Revenue</span><br><span class="mono" style="font-size:22px;font-weight:700;">${fmt(b.revenue)}</span></div>
      <div style="margin-bottom:8px;"><span style="color:#888;font-size:12px;">Unidades</span><br><span class="mono" style="font-size:18px;">${b.units}</span></div>
      <div style="margin-bottom:8px;"><span style="color:#888;font-size:12px;">Transacciones</span><br><span class="mono" style="font-size:18px;">${b.transactions}</span></div>
      <div style="margin-bottom:8px;"><span style="color:#888;font-size:12px;">Ticket Promedio</span><br><span class="mono" style="font-size:18px;">${fmt(b.avgTicket)}</span></div>
      <div style="margin-bottom:8px;"><span style="color:#888;font-size:12px;">Revenue / Unidad</span><br><span class="mono" style="font-size:18px;">${fmt(b.rpu)}</span></div>
      <div><span style="color:#888;font-size:12px;">Hora Pico</span><br><span class="mono" style="font-size:18px;">${String(b.peakHour).padStart(2, '0')}:00</span></div>
    </div>`;
  }).join('')}
</div>
<div class="insight">
  <strong>Veredicto:</strong> <strong>${battleWinnerRevenue.name}</strong> gana en revenue con ${fmt(battleWinnerRevenue.revenue)}.
  ${battleWinnerRevenue.name !== battleWinnerUnits.name
    ? `Sin embargo, <strong>${battleWinnerUnits.name}</strong> gana en volumen (${battleWinnerUnits.units} uds), lo que indica que se venden mas unidades a menor precio.`
    : `Tambien lidera en volumen, consolidandose como la categoria salada estrella.`}
  <br><br>
  En terminos de <strong>eficiencia por unidad</strong>, ${battleData.sort((a, b) => b.rpu - a.rpu)[0].name} genera mas revenue por cada unidad vendida (${fmt(battleData.sort((a, b) => b.rpu - a.rpu)[0].rpu)}).
  Las tres categorias comparten hora pico similar, compitiendo directamente por la atencion del cliente --
  esto refuerza la idea de que son opciones sustitutivas, no complementarias.
</div>
</div>

<!-- ============================================== -->
<!-- BEBIDAS PENETRACION -->
<!-- ============================================== -->
<div class="section">
<h2>Bebidas: Penetracion y Analisis</h2>
<div class="grid-2">
  <div class="card">
    <div style="font-size:48px;font-weight:700;color:#60a5fa;">${fmtPct(bebidasPenetration)}%</div>
    <div style="color:#888;margin-top:4px;">de TODAS las transacciones incluyen al menos 1 bebida</div>
    <div style="margin-top:12px;color:#e0e0e0;">
      <strong>${bebidasCat.transactions.size}</strong> transacciones con bebida de <strong>${TOTAL_SALES}</strong> totales
    </div>
    <div style="margin-top:16px;font-size:13px;color:#aaa;">
      <div><strong>${bebidasWithFoodTx}</strong> con otras comidas (${pct(bebidasWithFoodTx, bebidasCat.transactions.size)})</div>
      <div><strong>${bebidasSoloTx}</strong> solo bebida (${pct(bebidasSoloTx, bebidasCat.transactions.size)})</div>
    </div>
  </div>
  <div class="card">
    <h3 style="margin:0 0 12px;">Top Bebidas por Unidades</h3>
    <table>
      <tr><th>Producto</th><th class="right">Uds</th><th class="right">Revenue</th></tr>
      ${[...bebidasCat.products.values()].sort((a, b) => b.units - a.units).map(p => `<tr>
        <td>${p.name}</td>
        <td class="right mono">${p.units}</td>
        <td class="right mono">${fmt(p.revenue)}</td>
      </tr>`).join('')}
    </table>
  </div>
</div>
<div class="insight warning">
  <strong>Oportunidad critica:</strong> Solo el <strong>${fmtPct(bebidasPenetration)}%</strong> de transacciones incluyen bebida.
  ${bebidasPenetration < 40
    ? `En restaurantes de comida rapida, la penetracion de bebidas suele estar entre 50-70%. FANZINE esta significativamente por debajo. Cada punto porcentual de penetracion adicional a un precio promedio de ${fmt(Math.round(bebidasCat.revenue / bebidasCat.units))} por bebida representaria ~${fmt(Math.round(TOTAL_SALES * 0.01 * (bebidasCat.revenue / bebidasCat.units)))} adicionales al mes. Llegar al 40% agregaria ~${fmt(Math.round((0.40 * TOTAL_SALES - bebidasCat.transactions.size) * (bebidasCat.revenue / bebidasCat.units)))} mensuales.`
    : `La penetracion es aceptable, pero siempre hay margen para mejorar con sugerencia activa en caja.`}
  ${bebidasSoloTx > 0 ? `Nota: ${bebidasSoloTx} transacciones fueron SOLO bebida, lo que sugiere compras rapidas por sed.` : ''}
</div>
</div>

<!-- ============================================== -->
<!-- SALSAS TEX MEX -->
<!-- ============================================== -->
<div class="section">
<h2>Salsas TEX MEX ($2,000)</h2>
<div class="grid-2">
  <div class="card">
    <div class="kpi-grid" style="grid-template-columns:1fr 1fr;">
      <div>
        <div style="color:#888;font-size:12px;">UNIDADES</div>
        <div style="font-size:28px;font-weight:700;">${salsaUnits}</div>
      </div>
      <div>
        <div style="color:#888;font-size:12px;">REVENUE</div>
        <div style="font-size:28px;font-weight:700;">${fmt(salsaRevenue)}</div>
      </div>
      <div>
        <div style="color:#888;font-size:12px;">TRANSACCIONES</div>
        <div style="font-size:28px;font-weight:700;">${salsaTransactions.size}</div>
      </div>
      <div>
        <div style="color:#888;font-size:12px;">% PENETRACION</div>
        <div style="font-size:28px;font-weight:700;">${fmtPct(salsaTransactions.size / TOTAL_SALES * 100)}%</div>
      </div>
    </div>
    <h3>Salsas vendidas</h3>
    <table>
      <tr><th>Salsa</th><th class="right">Uds</th></tr>
      ${[...salsaByName.entries()].sort((a, b) => b[1] - a[1]).map(([name, units]) => `<tr>
        <td>${name}</td>
        <td class="right mono">${units}</td>
      </tr>`).join('')}
    </table>
  </div>
  <div class="card">
    <h3 style="margin:0 0 12px;">Se acompanan con...</h3>
    <table>
      <tr><th>Producto</th><th class="right">Veces</th></tr>
      ${topSalsaCompanions.map(([name, count]) => `<tr>
        <td>${name}</td>
        <td class="right mono">${count}</td>
      </tr>`).join('')}
    </table>
  </div>
</div>
<div class="insight warning">
  <strong>Salsas subutilizadas:</strong> Solo ${salsaTransactions.size} transacciones incluyen salsa (${fmtPct(salsaTransactions.size / TOTAL_SALES * 100)}%).
  A $2,000 por unidad, las salsas son un add-on de bajo costo y alto margen que deberia ofrecerse activamente.
  ${topSalsaCompanions.length > 0
    ? `Los productos que mas se acompanan con salsa son ${topSalsaCompanions.slice(0, 3).map(c => c[0]).join(', ')} -- estos son candidatos naturales para la sugerencia "le agrego salsa?".`
    : ''}
  <strong>Recomendacion:</strong> Capacitar al equipo de caja para ofrecer salsa con CADA pedido de nachos, tacos y perros.
  Si se lograra una penetracion del 20% (vs actual ${fmtPct(salsaTransactions.size / TOTAL_SALES * 100)}%), se generarian ~${fmt(Math.round(TOTAL_SALES * 0.20 * 2000))} adicionales al mes en salsas.
</div>
</div>

<!-- ============================================== -->
<!-- POSTRES: SOLOS vs ADD-ON -->
<!-- ============================================== -->
<div class="section">
<h2>POSTRES: Solos vs Add-on</h2>
<div class="grid-2">
  <div class="card">
    <div style="display:flex;align-items:center;gap:24px;">
      <div style="text-align:center;">
        <div style="font-size:48px;font-weight:700;color:#fb923c;">${fmtPct(postresTotalTx > 0 ? postresAddonTx / postresTotalTx * 100 : 0)}%</div>
        <div style="color:#888;">como add-on</div>
        <div style="font-size:14px;">${postresAddonTx} transacciones</div>
      </div>
      <div style="text-align:center;">
        <div style="font-size:48px;font-weight:700;color:#c084fc;">${fmtPct(postresTotalTx > 0 ? postresOnlyTx / postresTotalTx * 100 : 0)}%</div>
        <div style="color:#888;">solos</div>
        <div style="font-size:14px;">${postresOnlyTx} transacciones</div>
      </div>
    </div>
    <div style="margin-top:16px;height:24px;background:#222;border-radius:6px;overflow:hidden;display:flex;">
      <div style="width:${postresTotalTx > 0 ? postresAddonTx / postresTotalTx * 100 : 0}%;background:#fb923c;"></div>
      <div style="width:${postresTotalTx > 0 ? postresOnlyTx / postresTotalTx * 100 : 0}%;background:#c084fc;"></div>
    </div>
    <div style="display:flex;justify-content:space-between;margin-top:4px;font-size:11px;color:#888;">
      <span>Add-on (con otras comidas)</span>
      <span>Solo (postre unico)</span>
    </div>
  </div>
  <div class="card">
    <h3 style="margin:0 0 12px;">Top Postres por Revenue</h3>
    <table>
      <tr><th>Producto</th><th class="right">Uds</th><th class="right">Revenue</th></tr>
      ${[...postresCat.products.values()].sort((a, b) => b.revenue - a.revenue).map(p => `<tr>
        <td>${p.name}</td>
        <td class="right mono">${p.units}</td>
        <td class="right mono">${fmt(p.revenue)}</td>
      </tr>`).join('')}
    </table>
  </div>
</div>
<div class="insight info">
  <strong>Analisis de postres:</strong> Los postres se compran ${postresAddonTx > postresOnlyTx ? 'mayoritariamente como add-on' : 'frecuentemente solos'} (${pct(postresAddonTx, postresTotalTx)} acompanados).
  ${postresOnlyTx > 0 ? `Las ${postresOnlyTx} compras solo-postre sugieren que hay clientes que vienen especificamente por el postre (fans de tortas/cheesecakes), lo cual es un patron interesante para marketing.` : ''}
  La penetracion de postres es ${pct(postresCat.transactions.size, TOTAL_SALES)} de todas las transacciones.
  ${pctNum(postresCat.transactions.size, TOTAL_SALES) < 15
    ? 'Esta es una penetracion baja -- preguntar "desean postre?" despues de la comida podria duplicar las ventas de esta categoria.'
    : 'La penetracion es razonable para una categoria de postre.'}
</div>
</div>

<!-- ============================================== -->
<!-- CHICANITAS -->
<!-- ============================================== -->
<div class="section">
<h2>Chicanitas: Analisis de Formato Mini</h2>
<div class="grid-2">
  <div class="card">
    <div class="kpi-grid" style="grid-template-columns:1fr 1fr;">
      <div>
        <div style="color:#888;font-size:12px;">UNIDADES TOTALES</div>
        <div style="font-size:28px;font-weight:700;">${chicanitasCat.units}</div>
      </div>
      <div>
        <div style="color:#888;font-size:12px;">REVENUE</div>
        <div style="font-size:28px;font-weight:700;">${fmt(chicanitasCat.revenue)}</div>
      </div>
      <div>
        <div style="color:#888;font-size:12px;">TRANSACCIONES</div>
        <div style="font-size:28px;font-weight:700;">${chicanitasCat.transactions.size}</div>
      </div>
      <div>
        <div style="color:#888;font-size:12px;">PROMEDIO / TX</div>
        <div style="font-size:28px;font-weight:700;">${chicanitasAvgPerTx}</div>
      </div>
    </div>
    <h3>Distribucion de uds por transaccion</h3>
    <table>
      <tr><th>Chicanitas por Tx</th><th class="right">Transacciones</th><th class="right">%</th></tr>
      ${chicanitasDistEntries.map(([count, txs]) => `<tr>
        <td class="mono">${count} ud${count > 1 ? 's' : ''}</td>
        <td class="right mono">${txs}</td>
        <td class="right mono">${pct(txs, chicanitasCat.transactions.size)}</td>
      </tr>`).join('')}
    </table>
  </div>
  <div class="card">
    <h3 style="margin:0 0 12px;">Sabores</h3>
    <table>
      <tr><th>Sabor</th><th class="right">Uds</th><th class="right">Revenue</th></tr>
      ${[...chicanitasCat.products.values()].sort((a, b) => b.units - a.units).map(p => `<tr>
        <td>${p.name}</td>
        <td class="right mono">${p.units}</td>
        <td class="right mono">${fmt(p.revenue)}</td>
      </tr>`).join('')}
    </table>
  </div>
</div>
<div class="insight purple">
  <strong>Formato mini:</strong> Con un promedio de <strong>${chicanitasAvgPerTx} chicanitas por transaccion</strong> y un precio de $5,000 c/u,
  ${Number(chicanitasAvgPerTx) >= 2
    ? `los clientes tienden a comprar multiples unidades, lo que valida el formato "mini" -- la gente las pide como snack compartido o variado.`
    : `la mayoria compra solo 1 unidad, posiblemente como snack adicional. Considerar paquetes de 3 con descuento para incentivar mayor volumen.`}
  ${chicanitasDistEntries.length > 0 ? `La distribucion muestra que ${chicanitasDistEntries[0][0]} ud es lo mas comun (${pct(chicanitasDistEntries[0][1], chicanitasCat.transactions.size)} de transacciones).` : ''}
  ${chicanitasCat.transactions.size < 30
    ? 'El volumen total de transacciones con chicanitas es bajo. Esta podria ser una categoria que necesita mejor posicionamiento en el menu o degustaciones para generar demanda.'
    : ''}
</div>
</div>

<!-- ============================================== -->
<!-- TEX MEX DESGLOSE -->
<!-- ============================================== -->
<div class="section">
<h2>TEX MEX: Desglose Completo</h2>
<div class="card">
  <table>
    <tr><th>Producto</th><th class="right">Uds</th><th class="right">Revenue</th><th class="right">% Rev Cat</th><th style="width:25%">Visual</th></tr>
    ${(() => {
      const prods = [...texMexCat.products.values()].sort((a, b) => b.revenue - a.revenue);
      const maxRev = prods[0]?.revenue || 1;
      return prods.map(p => `<tr>
        <td>${p.name}</td>
        <td class="right mono">${p.units}</td>
        <td class="right mono">${fmt(p.revenue)}</td>
        <td class="right mono">${pct(p.revenue, texMexCat.revenue)}</td>
        <td><div class="bar-container">${bar(p.revenue, maxRev, '#f472b6')}</div></td>
      </tr>`).join('');
    })()}
  </table>
</div>
<div class="insight">
  <strong>Composicion TEX MEX:</strong> Esta categoria combina dos tipos de producto muy diferentes:
  <strong>platos fuertes</strong> (Alitas, Pollo PopCorn, Macarrones) que suman ${fmt(texMexNonSalsaRevenue)} (${pct(texMexNonSalsaRevenue, texMexCat.revenue)} de la categoria),
  y <strong>salsas add-on</strong> a $2,000 que suman ${fmt(salsaRevenue)} (${pct(salsaRevenue, texMexCat.revenue)}).
  ${texMexNonSalsa.length > 0 ? `${texMexNonSalsa[0].name} lidera los platos fuertes con ${texMexNonSalsa[0].units} uds y ${fmt(texMexNonSalsa[0].revenue)}.` : ''}
  Considerar separar las salsas como categoria propia para tener metricas mas limpias.
</div>
</div>

<!-- ============================================== -->
<!-- MILKSHAKES -->
<!-- ============================================== -->
<div class="section">
<h2>Milkshakes: Desglose</h2>
<div class="card">
  <table>
    <tr><th>Producto</th><th class="right">Uds</th><th class="right">Revenue</th><th style="width:30%">Visual</th></tr>
    ${(() => {
      const prods = [...milkshakesCat.products.values()].sort((a, b) => b.revenue - a.revenue);
      const maxRev = prods[0]?.revenue || 1;
      return prods.map(p => `<tr>
        <td>${p.name}</td>
        <td class="right mono">${p.units}</td>
        <td class="right mono">${fmt(p.revenue)}</td>
        <td><div class="bar-container">${bar(p.revenue, maxRev, '#c084fc')}</div></td>
      </tr>`).join('');
    })()}
  </table>
</div>
<div class="insight info">
  <strong>Milkshakes:</strong> Con ${milkshakesCat.units} unidades y ${fmt(milkshakesCat.revenue)} en revenue,
  los milkshakes son una categoria ${milkshakesCat.revenue > 200000 ? 'solida' : 'menor pero con potencial'}.
  A $12,000 por unidad, tienen uno de los precios mas altos del menu -- cada venta aporta buen margen.
  ${milkshakesCat.products.size === 2 ? 'Solo hay 2 sabores (Vainilla y Chocolate). Agregar un sabor de temporada o de fresa podria atraer mas demanda.' : ''}
  ${pctNum(milkshakesCat.transactions.size, TOTAL_SALES) < 10
    ? 'La penetracion es baja. Considerar exhibicion visual (fotos grandes) en el menu digital para generar antojo.'
    : ''}
</div>
</div>

<!-- ============================================== -->
<!-- PERROS: DETALLE -->
<!-- ============================================== -->
<div class="section">
<h2>Perros: Analisis Detallado</h2>
<div class="card">
  <table>
    <tr><th>Producto</th><th class="right">Uds</th><th class="right">Revenue</th><th class="right">% Cat</th><th style="width:25%">Visual</th></tr>
    ${(() => {
      const prods = [...perrosCat.products.values()].sort((a, b) => b.revenue - a.revenue);
      const maxRev = prods[0]?.revenue || 1;
      return prods.map(p => `<tr>
        <td>${p.name}</td>
        <td class="right mono">${p.units}</td>
        <td class="right mono">${fmt(p.revenue)}</td>
        <td class="right mono">${pct(p.revenue, perrosCat.revenue)}</td>
        <td><div class="bar-container">${bar(p.revenue, maxRev, '#4ade80')}</div></td>
      </tr>`).join('');
    })()}
  </table>
</div>
<div class="insight">
  <strong>Sub-segmentos de Perros:</strong>
  Los perros "con toppings" generan ${fmt(perrosConToppings.reduce((s, p) => s + p.revenue, 0))} (${perrosConToppings.reduce((s, p) => s + p.units, 0)} uds),
  los corndogs generan ${fmt(perrosCorndog.reduce((s, p) => s + p.revenue, 0))} (${perrosCorndog.reduce((s, p) => s + p.units, 0)} uds),
  y las variantes "Salchi" premium generan ${fmt(perrosSalchi.reduce((s, p) => s + p.revenue, 0))} (${perrosSalchi.reduce((s, p) => s + p.units, 0)} uds).
  ${perrosSalchi.reduce((s, p) => s + p.units, 0) > perrosConToppings.reduce((s, p) => s + p.units, 0)
    ? 'Las variantes premium (Salchi) superan a los basicos, lo que indica que el cliente de FANZINE prefiere pagar mas por una version superior.'
    : 'El perro clasico con toppings sigue siendo el mas popular, pero las variantes Salchi premium muestran buena aceptacion.'}
</div>
</div>

<!-- ============================================== -->
<!-- OPORTUNIDADES -->
<!-- ============================================== -->
<div class="section">
<h2 style="color:#4ade80;">Oportunidades de Crecimiento</h2>

<div class="opp-card">
  <h4>1. Upselling de Bebidas (Impacto estimado: +${fmt(Math.round((0.40 * TOTAL_SALES - bebidasCat.transactions.size) * (bebidasCat.units > 0 ? bebidasCat.revenue / bebidasCat.units : 4000)))} / mes)</h4>
  <p>La penetracion de bebidas (${fmtPct(bebidasPenetration)}%) esta muy por debajo del benchmark de 50-60% para restaurantes.
  Implementar sugerencia activa en caja: "Le agrego una Coca-Cola o una Bretana?" en cada transaccion.
  Meta: subir al 40% de penetracion en marzo.</p>
</div>

<div class="opp-card">
  <h4>2. Salsas como Add-on Sistematico (Impacto estimado: +${fmt(Math.round((TOTAL_SALES * 0.15 - salsaTransactions.size) * 2000))} / mes)</h4>
  <p>Las salsas a $2,000 tienen penetracion de solo ${fmtPct(salsaTransactions.size / TOTAL_SALES * 100)}%.
  Son producto de alto margen y bajo costo. Ofrecer con cada nachos, tacos y perro.
  Considerar un "flight de salsas" (4 salsas por $6,000) como producto premium.</p>
</div>

<div class="opp-card">
  <h4>3. Combos Cross-Category</h4>
  <p>Basado en la matriz de co-ocurrencia, crear combos formales para las parejas con mayor afinidad natural.
  ${crossSellPairs.length > 0 ? `La pareja ${crossSellPairs[0].a}+${crossSellPairs[0].b} ya tiene alta co-ocurrencia y seria el primer combo a formalizar.` : ''}
  Ejemplo: "Combo FANZINE" = Nachos/Tacos + Bebida + Salsa por un precio combo.</p>
</div>

<div class="opp-card">
  <h4>4. Postres como Cierre de Venta</h4>
  <p>Solo ${pct(postresCat.transactions.size, TOTAL_SALES)} de transacciones incluyen postre.
  Implementar sugerencia post-comida: "Para cerrar, tenemos Cheesecake de Pistachos o Torta Tres Leches."
  Las ${postresOnlyTx} transacciones solo-postre muestran que hay demanda independiente -- promover en redes sociales.</p>
</div>

<div class="opp-card">
  <h4>5. Promociones Entre Semana</h4>
  <p>${weekendUnits > weekdayUnits * 1.2
    ? `El fin de semana concentra el ${pct(weekendUnits, weekendUnits + weekdayUnits)} del volumen. Crear "Martes de Tacos" o "Miercoles de Nachos" con descuento del 15% para equilibrar la demanda.`
    : `La distribucion semanal esta relativamente equilibrada, pero siempre hay espacio para promociones tematicas que generen trafico en dias lentos.`}</p>
</div>

<div class="opp-card">
  <h4>6. Chicanitas: Paquetes de 3</h4>
  <p>Con un promedio de ${chicanitasAvgPerTx} uds/tx y precio individual de $5,000, ofrecer "3 chicanitas por $12,000" (ahorro de $3,000)
  podria incrementar el volumen por transaccion y hacer de las chicanitas un snack grupal mas atractivo.</p>
</div>
</div>

<!-- ============================================== -->
<!-- ALERTAS -->
<!-- ============================================== -->
<div class="section">
<h2 style="color:#fca5a5;">Alertas y Problemas Detectados</h2>

<div class="alert-card">
  <h4>Baja Penetracion de Bebidas</h4>
  <p>Con ${fmtPct(bebidasPenetration)}% de penetracion, se estan dejando ~${fmt(Math.round((0.50 * TOTAL_SALES - bebidasCat.transactions.size) * 4000))} en la mesa cada mes.
  En un restaurante de comida salada (nachos, tacos, perros), la bebida deberia ser casi automatica. Revisar si hay un problema de oferta, visibilidad o sugerencia en caja.</p>
</div>

<div class="alert-card">
  <h4>Concentracion de Revenue en Pocos Productos</h4>
  <p>Los top 3 productos concentran el ${fmtPct(top3Concentration)}% del revenue de comidas.
  ${top3Concentration > 35 ? 'Si alguno de estos productos pierde traccion (agotamiento, cambio de proveedor, etc.), el impacto en revenue seria significativo. Diversificar la oferta y promover productos secundarios.' : 'La concentracion es moderada, pero vale monitorear.'}</p>
</div>

${(() => {
  const minDayRevenue = Math.min(...dailyEntries.map(e => e[1]));
  const maxDayRevenue = Math.max(...dailyEntries.map(e => e[1]));
  const ratio = maxDayRevenue / minDayRevenue;
  return ratio > 4 ? `
<div class="alert-card">
  <h4>Variabilidad Diaria Extrema</h4>
  <p>El mejor dia (${fmt(maxDayRevenue)}) es ${ratio.toFixed(1)}x el peor dia (${fmt(minDayRevenue)}).
  Esta variacion extrema dificulta la planificacion de inventario y personal. Investigar si los dias bajos coinciden con cierre temprano, falta de producto, o simplemente dias sin cine.</p>
</div>` : '';
})()}

${salsaTransactions.size / TOTAL_SALES < 0.05 ? `
<div class="alert-card">
  <h4>Salsas Casi Invisibles</h4>
  <p>Solo ${salsaTransactions.size} transacciones con salsa de ${TOTAL_SALES} totales. Es probable que no se esten ofreciendo en caja.
  A $2,000 c/u con alto margen, esto es revenue que se pierde por falta de proceso, no por falta de demanda.</p>
</div>` : ''}

</div>

<!-- ============================================== -->
<!-- CONCLUSIONES -->
<!-- ============================================== -->
<div class="section">
<div class="executive-summary" style="background:linear-gradient(135deg, #1a2e1a, #0d1f0d);border-color:#166534;">
  <h2 style="margin-top:0;border:none;padding:0;margin-bottom:16px;color:#4ade80;">Conclusiones</h2>
  <p>
    <strong>1. La comida es el core del negocio.</strong> Con ${pct(totalFoodRevenue, TOTAL_REVENUE)} del revenue total,
    las 8 categorias de comida son el motor de FANZINE. ${catsByRevenue[0].catName} y ${catsByRevenue[1].catName} lideran,
    pero hay una base diversificada de ${uniqueProducts} productos que da resiliencia al menu.
  </p>
  <p>
    <strong>2. Hay revenue escondido en los add-ons.</strong> Bebidas (${fmtPct(bebidasPenetration)}% penetracion),
    salsas (${fmtPct(salsaTransactions.size / TOTAL_SALES * 100)}%) y postres (${pct(postresCat.transactions.size, TOTAL_SALES)})
    tienen penetraciones bajas. Estas son las categorias de mayor margen y menor costo operativo.
    Un programa sistematico de upselling en caja podria agregar entre ${fmt(Math.round(TOTAL_SALES * 0.10 * 4000))} y ${fmt(Math.round(TOTAL_SALES * 0.15 * 6000))} mensuales.
  </p>
  <p>
    <strong>3. El fin de semana manda.</strong> ${DAY_NAMES[peakDayIdx]} es el dia estrella con ${totalByDay[peakDayIdx]} unidades.
    Las promociones entre semana son necesarias para equilibrar la carga operativa y maximizar el uso del local.
  </p>
  <p>
    <strong>4. Perros vs Tacos vs Nachos: tres pilares.</strong> Estas tres categorias compiten en el mismo horario
    y se comportan como sustitutos. ${battleWinnerRevenue.name} gana en revenue, pero las tres son esenciales.
    El foco deberia estar en diferenciarlas mejor en el menu y usar la matrix de cross-sell para emparejarlas con complementos.
  </p>
  <p>
    <strong>5. Accion inmediata mas impactante:</strong> Implementar sugerencia de bebida en CADA transaccion.
    Es la palanca mas simple y de mayor impacto estimado.
  </p>
</div>
</div>

<div style="margin-top:48px;padding-top:24px;border-top:1px solid #333;color:#666;font-size:12px;">
  Generado: ${new Date().toLocaleString('es-CO')} &bull; FANZINE Analytics &bull; Datos: Febrero 2026
</div>

</body>
</html>`;

// ── Write and open ────────────────────────────────────────────────
const outputDir = path.join(__dirname, '..', 'docs', 'febrero');
mkdirSync(outputDir, { recursive: true });
const outputPath = path.join(outputDir, 'analisis-comidas-feb2026.html');
writeFileSync(outputPath, html, 'utf-8');
console.log(`HTML escrito en: ${outputPath}`);
execSync(`open "${outputPath}"`);
console.log('Abierto en el navegador.');
