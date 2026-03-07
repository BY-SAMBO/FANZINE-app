import { readFileSync, writeFileSync } from "fs";
import { execSync } from "child_process";

// --- Load data ---
const raw = JSON.parse(
  readFileSync("/Users/a./Desktop/PRESENTA/FANZINE-app/scripts/_feb-sales-data.json", "utf-8")
);

const TOTAL_REVENUE = raw.metadata.totalRevenue as number;
const TOTAL_SALES = raw.metadata.totalSales as number;

interface Item {
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
  createdAt: string;
  createdAtCOT: string;
  date: string;
  hour: number;
  dayOfWeek: number;
  dayName: string;
  weekNumber: number;
  total: number;
  items: Item[];
  payments: any[];
}

const sales: Sale[] = raw.sales;

// --- Filter crispetas items ---
const CRISPETA_CATEGORY = "7";

// Classify products
type Size = "Personal" | "Mediana" | "Familiar" | "N/A";
type Flavor = "Sal" | "Caramelo" | "Mixtas" | "N/A";

function classifySize(name: string): Size {
  const n = name.toLowerCase();
  if (n.includes("personal")) return "Personal";
  if (n.includes("mediana")) return "Mediana";
  if (n.includes("familiar")) return "Familiar";
  return "N/A"; // Minipancakes
}

function classifyFlavor(name: string): Flavor {
  const n = name.toLowerCase();
  if (n.includes("caramelo")) return "Caramelo";
  if (n.includes("mixta")) return "Mixtas";
  if (n.includes("sal")) return "Sal";
  return "N/A"; // Minipancakes
}

// Collect all crispetas items across all sales
interface CrispetaItem extends Item {
  saleId: string;
  saleDate: string;
  saleHour: number;
  saleDayOfWeek: number;
  saleDayName: string;
  saleWeekNumber: number;
  saleTotal: number;
  size: Size;
  flavor: Flavor;
}

const crispetaItems: CrispetaItem[] = [];
const salesWithCrispetas: Sale[] = [];
const salesWithCrispetasSet = new Set<string>();

for (const sale of sales) {
  let hasCrispeta = false;
  for (const item of sale.items) {
    if (item.categoryId === CRISPETA_CATEGORY && !item.canceled) {
      const ci: CrispetaItem = {
        ...item,
        saleId: sale.id,
        saleDate: sale.date,
        saleHour: sale.hour,
        saleDayOfWeek: sale.dayOfWeek,
        saleDayName: sale.dayName,
        saleWeekNumber: sale.weekNumber,
        saleTotal: sale.total,
        size: classifySize(item.productName),
        flavor: classifyFlavor(item.productName),
      };
      crispetaItems.push(ci);
      hasCrispeta = true;
    }
  }
  if (hasCrispeta && !salesWithCrispetasSet.has(sale.id)) {
    salesWithCrispetasSet.add(sale.id);
    salesWithCrispetas.push(sale);
  }
}

// --- 1. KPIs ---
const totalRevenueCrispetas = crispetaItems.reduce((s, i) => s + i.total, 0);
const totalUnits = crispetaItems.reduce((s, i) => s + i.quantity, 0);
const pctOfTotal = (totalRevenueCrispetas / TOTAL_REVENUE) * 100;
const transactionsWithCrispetas = salesWithCrispetas.length;
const ticketPromedioCrispetas =
  transactionsWithCrispetas > 0
    ? salesWithCrispetas.reduce((s, sale) => s + sale.total, 0) / transactionsWithCrispetas
    : 0;
const revenuePerUnit = totalUnits > 0 ? totalRevenueCrispetas / totalUnits : 0;

// --- 2. Ranking by product ---
const byProduct = new Map<string, { name: string; units: number; revenue: number; price: number }>();
for (const ci of crispetaItems) {
  const key = ci.productId;
  const existing = byProduct.get(key) || { name: ci.productName, units: 0, revenue: 0, price: ci.catalogPrice };
  existing.units += ci.quantity;
  existing.revenue += ci.total;
  byProduct.set(key, existing);
}
const productRanking = [...byProduct.values()].sort((a, b) => b.revenue - a.revenue);
const productRankingByUnits = [...byProduct.values()].sort((a, b) => b.units - a.units);

// --- 3. By size ---
const sizes: Size[] = ["Personal", "Mediana", "Familiar"];
const bySize = new Map<string, { units: number; revenue: number }>();
for (const s of [...sizes, "N/A"]) bySize.set(s, { units: 0, revenue: 0 });
for (const ci of crispetaItems) {
  const existing = bySize.get(ci.size)!;
  existing.units += ci.quantity;
  existing.revenue += ci.total;
}

// --- 4. By flavor ---
const flavors: Flavor[] = ["Sal", "Caramelo", "Mixtas"];
const byFlavor = new Map<string, { units: number; revenue: number }>();
for (const f of [...flavors, "N/A"]) byFlavor.set(f, { units: 0, revenue: 0 });
for (const ci of crispetaItems) {
  const existing = byFlavor.get(ci.flavor)!;
  existing.units += ci.quantity;
  existing.revenue += ci.total;
}

// --- 5. Matrix size x flavor ---
const matrix = new Map<string, { units: number; revenue: number }>();
for (const s of sizes) {
  for (const f of flavors) {
    matrix.set(`${s}|${f}`, { units: 0, revenue: 0 });
  }
}
for (const ci of crispetaItems) {
  if (ci.size !== "N/A" && ci.flavor !== "N/A") {
    const key = `${ci.size}|${ci.flavor}`;
    const existing = matrix.get(key)!;
    existing.units += ci.quantity;
    existing.revenue += ci.total;
  }
}

// --- 6. By hour ---
const byHour = new Map<number, { units: number; revenue: number; transactions: number }>();
for (let h = 0; h < 24; h++) byHour.set(h, { units: 0, revenue: 0, transactions: 0 });
const hourTxSet = new Map<number, Set<string>>();
for (const ci of crispetaItems) {
  const h = ci.saleHour;
  const existing = byHour.get(h)!;
  existing.units += ci.quantity;
  existing.revenue += ci.total;
  if (!hourTxSet.has(h)) hourTxSet.set(h, new Set());
  hourTxSet.get(h)!.add(ci.saleId);
}
for (const [h, set] of hourTxSet) {
  byHour.get(h)!.transactions = set.size;
}

// --- 7. By day of week ---
const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const byDayOfWeek = new Map<number, { units: number; revenue: number; transactions: number }>();
for (let d = 0; d < 7; d++) byDayOfWeek.set(d, { units: 0, revenue: 0, transactions: 0 });
const dayTxSet = new Map<number, Set<string>>();
for (const ci of crispetaItems) {
  const d = ci.saleDayOfWeek;
  const existing = byDayOfWeek.get(d)!;
  existing.units += ci.quantity;
  existing.revenue += ci.total;
  if (!dayTxSet.has(d)) dayTxSet.set(d, new Set());
  dayTxSet.get(d)!.add(ci.saleId);
}
for (const [d, set] of dayTxSet) {
  byDayOfWeek.get(d)!.transactions = set.size;
}

// --- 8. Daily trend ---
const byDate = new Map<string, { units: number; revenue: number; transactions: number }>();
const dateTxSet = new Map<string, Set<string>>();
for (const ci of crispetaItems) {
  const d = ci.saleDate;
  if (!byDate.has(d)) byDate.set(d, { units: 0, revenue: 0, transactions: 0 });
  const existing = byDate.get(d)!;
  existing.units += ci.quantity;
  existing.revenue += ci.total;
  if (!dateTxSet.has(d)) dateTxSet.set(d, new Set());
  dateTxSet.get(d)!.add(ci.saleId);
}
for (const [d, set] of dateTxSet) {
  byDate.get(d)!.transactions = set.size;
}
const dailyTrend = [...byDate.entries()].sort((a, b) => a[0].localeCompare(b[0]));

// --- 9. Weekly trend ---
const byWeek = new Map<number, { units: number; revenue: number; transactions: number }>();
const weekTxSet = new Map<number, Set<string>>();
for (const ci of crispetaItems) {
  const w = ci.saleWeekNumber;
  if (!byWeek.has(w)) byWeek.set(w, { units: 0, revenue: 0, transactions: 0 });
  const existing = byWeek.get(w)!;
  existing.units += ci.quantity;
  existing.revenue += ci.total;
  if (!weekTxSet.has(w)) weekTxSet.set(w, new Set());
  weekTxSet.get(w)!.add(ci.saleId);
}
for (const [w, set] of weekTxSet) {
  byWeek.get(w)!.transactions = set.size;
}
const weeklyTrend = [...byWeek.entries()].sort((a, b) => a[0] - b[0]);

// --- 10. Cross-sell analysis ---
const crossSell = new Map<string, { category: string; count: number; revenue: number }>();
for (const sale of salesWithCrispetas) {
  const otherCategories = new Map<string, { name: string; revenue: number }>();
  for (const item of sale.items) {
    if (item.categoryId !== CRISPETA_CATEGORY && !item.canceled && item.total > 0) {
      const key = item.categoryId;
      if (!otherCategories.has(key)) {
        otherCategories.set(key, { name: item.categoryName, revenue: 0 });
      }
      otherCategories.get(key)!.revenue += item.total;
    }
  }
  for (const [catId, data] of otherCategories) {
    if (!crossSell.has(catId)) crossSell.set(catId, { category: data.name, count: 0, revenue: 0 });
    crossSell.get(catId)!.count++;
    crossSell.get(catId)!.revenue += data.revenue;
  }
}
const crossSellRanking = [...crossSell.values()].sort((a, b) => b.count - a.count);

// --- 11. Upsell analysis ---
const upsellData = { onlyPersonal: 0, onlyMediana: 0, onlyFamiliar: 0, mixed: 0, onlyMinipancakes: 0 };
for (const sale of salesWithCrispetas) {
  const crispItems = sale.items.filter(
    (i) => i.categoryId === CRISPETA_CATEGORY && !i.canceled
  );
  const sizesInSale = new Set(crispItems.map((i) => classifySize(i.productName)));
  if (sizesInSale.size === 1) {
    const onlySize = [...sizesInSale][0];
    if (onlySize === "Personal") upsellData.onlyPersonal++;
    else if (onlySize === "Mediana") upsellData.onlyMediana++;
    else if (onlySize === "Familiar") upsellData.onlyFamiliar++;
    else upsellData.onlyMinipancakes++;
  } else {
    upsellData.mixed++;
  }
}

// --- 12. Revenue per unit per product ---
// Already in productRanking (revenue/units)

// --- 13. Crispetas as % of ticket ---
const crispetaTicketPcts: number[] = [];
for (const sale of salesWithCrispetas) {
  const crispRevenue = sale.items
    .filter((i) => i.categoryId === CRISPETA_CATEGORY && !i.canceled)
    .reduce((s, i) => s + i.total, 0);
  if (sale.total > 0) {
    crispetaTicketPcts.push((crispRevenue / sale.total) * 100);
  }
}
const avgCrispetaPctOfTicket =
  crispetaTicketPcts.length > 0
    ? crispetaTicketPcts.reduce((s, v) => s + v, 0) / crispetaTicketPcts.length
    : 0;
const medianCrispetaPctOfTicket = (() => {
  const sorted = [...crispetaTicketPcts].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
})();

// Count crispetas-only tickets (100%)
const crispetaOnlyTickets = crispetaTicketPcts.filter((p) => p >= 99.9).length;

// --- Additional computed insights for narrative ---
// Weekend vs weekday
const weekendRevenue = [0, 6].reduce((s, d) => s + (byDayOfWeek.get(d)?.revenue || 0), 0);
const weekdayRevenue = [1, 2, 3, 4, 5].reduce((s, d) => s + (byDayOfWeek.get(d)?.revenue || 0), 0);
const weekendUnits = [0, 6].reduce((s, d) => s + (byDayOfWeek.get(d)?.units || 0), 0);
const weekdayUnits = [1, 2, 3, 4, 5].reduce((s, d) => s + (byDayOfWeek.get(d)?.units || 0), 0);
// Days open on weekends vs weekdays in feb 2026
const weekendDays = dailyTrend.filter(([d]) => { const dt = new Date(d + "T12:00:00"); return dt.getDay() === 0 || dt.getDay() === 6; }).length;
const weekdayDaysCt = dailyTrend.filter(([d]) => { const dt = new Date(d + "T12:00:00"); return dt.getDay() !== 0 && dt.getDay() !== 6; }).length;
const weekendAvgDaily = weekendDays > 0 ? weekendRevenue / weekendDays : 0;
const weekdayAvgDaily = weekdayDaysCt > 0 ? weekdayRevenue / weekdayDaysCt : 0;

// Peak hours (top 3)
const peakHours = [...byHour.entries()].sort((a, b) => b[1].revenue - a[1].revenue).slice(0, 3);
const peakHoursRevenue = peakHours.reduce((s, [, v]) => s + v.revenue, 0);

// Caramelo premium analysis
const salPersonalPrice = 2000;
const carameloPersonalPrice = 4000;
const carameloPremiumPct = ((carameloPersonalPrice - salPersonalPrice) / salPersonalPrice) * 100;

// Size migration potential
const personalRevenue = bySize.get("Personal")?.revenue || 0;
const personalUnits = bySize.get("Personal")?.units || 0;
const medianaRevenue = bySize.get("Mediana")?.revenue || 0;
const medianaUnits = bySize.get("Mediana")?.units || 0;
const familiarRevenue = bySize.get("Familiar")?.revenue || 0;
const familiarUnits = bySize.get("Familiar")?.units || 0;

// If 20% of Personal buyers upgraded to Mediana (avg mediana price)
const avgMedianaPrice = medianaUnits > 0 ? medianaRevenue / medianaUnits : 0;
const avgPersonalPrice = personalUnits > 0 ? personalRevenue / personalUnits : 0;
const upsellPotential20Pct = Math.round(personalUnits * 0.2 * (avgMedianaPrice - avgPersonalPrice));

// Flavor preference strength (Herfindahl index)
const flavorShares = flavors.map((f) => {
  const d = byFlavor.get(f)!;
  const totalFU = flavors.reduce((s, fl) => s + (byFlavor.get(fl)?.units || 0), 0);
  return totalFU > 0 ? d.units / totalFU : 0;
});
const herfindahlFlavor = flavorShares.reduce((s, sh) => s + sh * sh, 0);

// Days with zero crispetas sales
const allFebDates: string[] = [];
for (let d = 1; d <= 28; d++) {
  allFebDates.push(`2026-02-${String(d).padStart(2, "0")}`);
}
const daysWithZero = allFebDates.filter((d) => !byDate.has(d));

// Avg units per transaction
const avgUnitsPerTx = transactionsWithCrispetas > 0 ? totalUnits / transactionsWithCrispetas : 0;

// --- Helper functions ---
function fmt(n: number): string {
  return "$" + Math.round(n).toLocaleString("es-CO");
}
function fmtN(n: number): string {
  return Math.round(n).toLocaleString("es-CO");
}
function pct(n: number): string {
  return n.toFixed(1) + "%";
}
function bar(value: number, max: number, color: string = "#f59e0b"): string {
  const w = max > 0 ? Math.round((value / max) * 100) : 0;
  return `<div style="background:${color};height:18px;width:${w}%;border-radius:3px;min-width:2px;"></div>`;
}

// --- Generate HTML ---
const maxProductRevenue = Math.max(...productRanking.map((p) => p.revenue));
const maxProductUnits = Math.max(...productRankingByUnits.map((p) => p.units));
const maxHourRevenue = Math.max(...[...byHour.values()].map((v) => v.revenue));
const maxHourUnits = Math.max(...[...byHour.values()].map((v) => v.units));
const maxDayRevenue = Math.max(...[...byDayOfWeek.values()].map((v) => v.revenue));
const maxDailyRevenue = Math.max(...dailyTrend.map(([, v]) => v.revenue));
const maxWeeklyRevenue = Math.max(...weeklyTrend.map(([, v]) => v.revenue));
const maxCrossSellCount = Math.max(...crossSellRanking.map((c) => c.count));

// Size and flavor totals for % calculations
const totalSizeUnits = sizes.reduce((s, sz) => s + (bySize.get(sz)?.units || 0), 0);
const totalSizeRevenue = sizes.reduce((s, sz) => s + (bySize.get(sz)?.revenue || 0), 0);
const totalFlavorUnits = flavors.reduce((s, f) => s + (byFlavor.get(f)?.units || 0), 0);
const totalFlavorRevenue = flavors.reduce((s, f) => s + (byFlavor.get(f)?.revenue || 0), 0);

// Crispetas products only (excluding Minipancakes for size/flavor)
const crispetaOnlyProducts = productRanking.filter(
  (p) => p.name.toLowerCase() !== "minipancakes"
);

const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Analisis Crispetas - Febrero 2026</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { background:#0f0f0f; color:#e0e0e0; font-family:'Segoe UI',system-ui,-apple-system,sans-serif; padding:24px; line-height:1.5; }
  h1 { font-size:28px; font-weight:700; margin-bottom:6px; color:#f59e0b; }
  h2 { font-size:20px; font-weight:600; margin:32px 0 16px; color:#fbbf24; border-bottom:1px solid #333; padding-bottom:8px; }
  h3 { font-size:16px; font-weight:600; margin:20px 0 10px; color:#d4d4d4; }
  .subtitle { color:#888; font-size:14px; margin-bottom:24px; }
  .kpi-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:16px; margin-bottom:32px; }
  .kpi { background:#1a1a1a; border-radius:12px; padding:20px; border:1px solid #2a2a2a; }
  .kpi .label { font-size:12px; color:#888; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px; }
  .kpi .value { font-size:28px; font-weight:700; color:#f59e0b; }
  .kpi .sub { font-size:12px; color:#666; margin-top:4px; }
  .card { background:#1a1a1a; border-radius:12px; padding:20px; border:1px solid #2a2a2a; margin-bottom:20px; }
  table { width:100%; border-collapse:collapse; font-size:13px; }
  th { text-align:left; padding:10px 12px; background:#222; color:#aaa; font-weight:600; text-transform:uppercase; font-size:11px; letter-spacing:0.5px; border-bottom:2px solid #333; }
  td { padding:8px 12px; border-bottom:1px solid #222; }
  tr:hover td { background:#1f1f1f; }
  .right { text-align:right; }
  .bar-cell { width:30%; }
  .highlight { color:#f59e0b; font-weight:600; }
  .matrix-table th, .matrix-table td { text-align:center; padding:10px; }
  .matrix-table td { font-size:13px; }
  .matrix-val { font-weight:600; color:#f59e0b; }
  .matrix-sub { font-size:11px; color:#888; }
  .grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:20px; }
  @media(max-width:768px) { .grid-2 { grid-template-columns:1fr; } }
  .tag { display:inline-block; padding:2px 8px; border-radius:4px; font-size:11px; font-weight:600; }
  .tag-sal { background:#2563eb22; color:#60a5fa; }
  .tag-caramelo { background:#f59e0b22; color:#fbbf24; }
  .tag-mixtas { background:#10b98122; color:#34d399; }
  .tag-personal { background:#8b5cf622; color:#a78bfa; }
  .tag-mediana { background:#f59e0b22; color:#fbbf24; }
  .tag-familiar { background:#ef444422; color:#f87171; }
  .insight { background:#f59e0b11; border-left:3px solid #f59e0b; padding:12px 16px; border-radius:0 8px 8px 0; margin:12px 0; font-size:13px; color:#ccc; }
  .pct-bar-container { display:flex; height:24px; border-radius:6px; overflow:hidden; margin:8px 0; }
  .pct-bar-segment { display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:600; color:#000; }
  .narrative { background:#1a1a1a; border-radius:12px; padding:24px 28px; border:1px solid #2a2a2a; margin-bottom:24px; font-size:14px; line-height:1.75; color:#ccc; }
  .narrative p { margin-bottom:14px; }
  .narrative strong { color:#e0e0e0; }
  .narrative .num { color:#f59e0b; font-weight:600; }
  .section-insight { background:#1e293b; border-left:3px solid #60a5fa; padding:14px 18px; border-radius:0 8px 8px 0; margin:14px 0; font-size:13px; line-height:1.7; color:#bbb; }
  .section-insight strong { color:#93c5fd; }
  .opp-card { background:#052e16; border:1px solid #166534; border-radius:10px; padding:18px; margin-bottom:12px; }
  .opp-card h4 { color:#4ade80; font-size:14px; margin-bottom:6px; }
  .opp-card p { font-size:13px; color:#a7f3d0; line-height:1.6; margin:0; }
  .opp-card .impact { font-size:12px; color:#86efac; margin-top:6px; font-weight:600; }
  .alert-card { background:#1c0a0a; border:1px solid #7f1d1d; border-radius:10px; padding:18px; margin-bottom:12px; }
  .alert-card h4 { color:#fca5a5; font-size:14px; margin-bottom:6px; }
  .alert-card p { font-size:13px; color:#fecaca; line-height:1.6; margin:0; }
  .conclusion { background:#1a1a2e; border:1px solid #312e81; border-radius:12px; padding:24px 28px; margin-top:32px; }
  .conclusion h3 { color:#a78bfa; font-size:18px; margin-bottom:12px; }
  .conclusion p { font-size:14px; line-height:1.75; color:#c4b5fd; margin-bottom:12px; }
  .conclusion ul { padding-left:20px; margin-bottom:12px; }
  .conclusion li { font-size:13px; line-height:1.7; color:#c4b5fd; margin-bottom:6px; }
</style>
</head>
<body>

<h1>CRISPETAS - Analisis de Ventas</h1>
<p class="subtitle">Febrero 2026 | Cine & Tex-Mex Fanzine | ${transactionsWithCrispetas} transacciones con crispetas de ${TOTAL_SALES} totales</p>

<!-- KPIs -->
<div class="kpi-grid">
  <div class="kpi">
    <div class="label">Revenue Crispetas</div>
    <div class="value">${fmt(totalRevenueCrispetas)}</div>
    <div class="sub">${pct(pctOfTotal)} del total ${fmt(TOTAL_REVENUE)}</div>
  </div>
  <div class="kpi">
    <div class="label">Unidades Vendidas</div>
    <div class="value">${fmtN(totalUnits)}</div>
    <div class="sub">${fmtN(transactionsWithCrispetas)} transacciones</div>
  </div>
  <div class="kpi">
    <div class="label">Revenue por Unidad</div>
    <div class="value">${fmt(revenuePerUnit)}</div>
    <div class="sub">Precio promedio ponderado</div>
  </div>
  <div class="kpi">
    <div class="label">Ticket Promedio</div>
    <div class="value">${fmt(ticketPromedioCrispetas)}</div>
    <div class="sub">Tickets que incluyen crispetas</div>
  </div>
  <div class="kpi">
    <div class="label">% Crispetas en Ticket</div>
    <div class="value">${pct(avgCrispetaPctOfTicket)}</div>
    <div class="sub">Mediana: ${pct(medianCrispetaPctOfTicket)} | Solo crispetas: ${crispetaOnlyTickets}</div>
  </div>
  <div class="kpi">
    <div class="label">Penetracion</div>
    <div class="value">${pct((transactionsWithCrispetas / TOTAL_SALES) * 100)}</div>
    <div class="sub">${transactionsWithCrispetas} de ${TOTAL_SALES} ventas</div>
  </div>
</div>

<!-- Executive Summary -->
<h2>Resumen Ejecutivo</h2>
<div class="narrative">
<p>
Las crispetas son <strong>el pilar financiero de Fanzine</strong>, generando <span class="num">${fmt(totalRevenueCrispetas)}</span> en febrero 2026, lo que representa el <span class="num">${pct(pctOfTotal)}</span> del revenue total del negocio. De las ${TOTAL_SALES} ventas del mes, <span class="num">${transactionsWithCrispetas}</span> incluyeron al menos una crispeta — una penetracion del <span class="num">${pct((transactionsWithCrispetas / TOTAL_SALES) * 100)}</span>, es decir, practicamente <strong>1 de cada 2 clientes compra crispetas</strong>.
</p>
<p>
El negocio de crispetas se estructura en 3 sabores (Sal, Caramelo, Mixtas) y 3 tamanos (Personal, Mediana, Familiar), mas Minipancakes como producto atipico. En terminos de <strong>volumen</strong>, el tamano Personal domina por su bajo precio de entrada (desde ${fmt(salPersonalPrice)}), pero el <strong>revenue se concentra en los tamanos Mediana y Familiar</strong>, que aunque venden menos unidades, aportan significativamente mas por su precio premium. Esto revela un patron clasico de "piramide invertida" donde el ingreso real viene de los tamanos mas grandes.
</p>
<p>
El sabor Sal es el mas popular en unidades, coherente con el contexto de cine donde las crispetas de sal son el snack clasico. Sin embargo, el sabor Caramelo compite fuertemente en revenue gracias a su <strong>premium de precio del ${pct(carameloPremiumPct)}</strong> sobre Sal en el mismo tamano. Las Mixtas ocupan un espacio intermedio que merece atencion por su potencial de captura de indecisos.
</p>
<p>
En cuanto a la temporalidad, las crispetas muestran un patron claramente ligado a las funciones de cine: los fines de semana generan un revenue promedio diario de <span class="num">${fmt(weekendAvgDaily)}</span> vs <span class="num">${fmt(weekdayAvgDaily)}</span> entre semana. Las 3 horas pico concentran el <span class="num">${pct(totalRevenueCrispetas > 0 ? (peakHoursRevenue / totalRevenueCrispetas) * 100 : 0)}</span> del revenue, indicando una alta concentracion operativa que requiere preparacion especifica.
</p>
<p>
El analisis de cross-sell muestra que las crispetas funcionan como <strong>ancla de ticket</strong>: las transacciones que incluyen crispetas tambien incluyen frecuentemente bebidas, helados y comida salada, sugiriendo que son parte de un "combo de cine" informal. Sin embargo, las crispetas representan solo el <span class="num">${pct(avgCrispetaPctOfTicket)}</span> promedio del ticket total (mediana: ${pct(medianCrispetaPctOfTicket)}), lo que indica amplio espacio para que otros productos eleven el ticket.
</p>
</div>

<!-- Ranking by Revenue -->
<h2>Ranking de Productos por Revenue</h2>
<div class="card">
<table>
<thead><tr><th>#</th><th>Producto</th><th class="right">Precio</th><th class="right">Unidades</th><th class="right">Revenue</th><th class="right">%</th><th class="bar-cell">Proporcion</th></tr></thead>
<tbody>
${productRanking
  .map(
    (p, i) => `<tr>
  <td>${i + 1}</td>
  <td><strong>${p.name}</strong></td>
  <td class="right">${fmt(p.price)}</td>
  <td class="right">${fmtN(p.units)}</td>
  <td class="right highlight">${fmt(p.revenue)}</td>
  <td class="right">${pct((p.revenue / totalRevenueCrispetas) * 100)}</td>
  <td class="bar-cell">${bar(p.revenue, maxProductRevenue)}</td>
</tr>`
  )
  .join("")}
</tbody>
</table>
</div>

<!-- Ranking by Units -->
<h2>Ranking de Productos por Unidades</h2>
<div class="card">
<table>
<thead><tr><th>#</th><th>Producto</th><th class="right">Unidades</th><th class="right">Revenue</th><th class="right">Rev/Unidad</th><th class="bar-cell">Proporcion</th></tr></thead>
<tbody>
${productRankingByUnits
  .map(
    (p, i) => `<tr>
  <td>${i + 1}</td>
  <td><strong>${p.name}</strong></td>
  <td class="right highlight">${fmtN(p.units)}</td>
  <td class="right">${fmt(p.revenue)}</td>
  <td class="right">${fmt(p.units > 0 ? p.revenue / p.units : 0)}</td>
  <td class="bar-cell">${bar(p.units, maxProductUnits, "#60a5fa")}</td>
</tr>`
  )
  .join("")}
</tbody>
</table>
</div>

<div class="section-insight">
<strong>Lectura de los rankings:</strong> El ranking por revenue y por unidades cuenta historias diferentes. Los productos que lideran en unidades (probablemente los tamanos Personal por su precio accesible de ${fmt(salPersonalPrice)}-${fmt(carameloPersonalPrice)}) no necesariamente lideran en revenue. Esto es clave: cada crispeta Personal vendida a ${fmt(salPersonalPrice)} necesita ${Math.ceil((bySize.get("Mediana")?.revenue || 0) / (bySize.get("Mediana")?.units || 1) / salPersonalPrice)} ventas de Personal SAL para igualar el revenue de una sola Mediana. El revenue por unidad (Rev/Unidad) en la tabla de unidades muestra la eficiencia real de cada producto — los tamanos Familiar son los mas eficientes en generar ingreso por transaccion.
</div>

<!-- Size Analysis -->
<h2>Analisis por Tamano</h2>
<div class="card">
<p style="color:#888;font-size:12px;margin-bottom:12px;">Excluye Minipancakes (no tienen tamano comparable)</p>
<div class="pct-bar-container">
${sizes
  .map((s) => {
    const d = bySize.get(s)!;
    const w = totalSizeRevenue > 0 ? (d.revenue / totalSizeRevenue) * 100 : 0;
    const colors: Record<string, string> = { Personal: "#a78bfa", Mediana: "#fbbf24", Familiar: "#f87171" };
    return `<div class="pct-bar-segment" style="width:${w}%;background:${colors[s]}">${s} ${pct(w)}</div>`;
  })
  .join("")}
</div>
<table style="margin-top:12px;">
<thead><tr><th>Tamano</th><th class="right">Unidades</th><th class="right">% Uds</th><th class="right">Revenue</th><th class="right">% Rev</th><th class="right">Rev/Unidad</th></tr></thead>
<tbody>
${sizes
  .map((s) => {
    const d = bySize.get(s)!;
    return `<tr>
  <td><span class="tag tag-${s.toLowerCase()}">${s}</span></td>
  <td class="right">${fmtN(d.units)}</td>
  <td class="right">${pct(totalSizeUnits > 0 ? (d.units / totalSizeUnits) * 100 : 0)}</td>
  <td class="right highlight">${fmt(d.revenue)}</td>
  <td class="right">${pct(totalSizeRevenue > 0 ? (d.revenue / totalSizeRevenue) * 100 : 0)}</td>
  <td class="right">${fmt(d.units > 0 ? d.revenue / d.units : 0)}</td>
</tr>`;
  })
  .join("")}
${(() => {
  const mp = bySize.get("N/A")!;
  return mp.units > 0
    ? `<tr style="opacity:0.6"><td>Minipancakes</td><td class="right">${fmtN(mp.units)}</td><td class="right">-</td><td class="right">${fmt(mp.revenue)}</td><td class="right">-</td><td class="right">${fmt(mp.units > 0 ? mp.revenue / mp.units : 0)}</td></tr>`
    : "";
})()}
</tbody>
</table>
${(() => {
  const sizesSorted = sizes.map((s) => ({ name: s, ...(bySize.get(s)!) })).sort((a, b) => b.units - a.units);
  const revSorted = [...sizesSorted].sort((a, b) => b.revenue - a.revenue);
  return `<div class="insight">
    <strong>Tamano dominante en unidades:</strong> ${sizesSorted[0].name} (${fmtN(sizesSorted[0].units)} uds, ${pct((sizesSorted[0].units / totalSizeUnits) * 100)})<br>
    <strong>Tamano dominante en revenue:</strong> ${revSorted[0].name} (${fmt(revSorted[0].revenue)}, ${pct((revSorted[0].revenue / totalSizeRevenue) * 100)})
  </div>`;
})()}
</div>

<div class="section-insight">
<strong>Interpretacion del tamano:</strong> La dominancia en unidades del tamano Personal es esperable — es el punto de entrada mas barato y atractivo para clientes que "solo quieren algo pequeno". Pero esta dinamica tiene un costo oculto: cada Personal ocupa tiempo de preparacion y espacio en la barra, generando solo ${fmt(avgPersonalPrice)} promedio. El tamano Mediana y Familiar, aunque mueven menos volumen, generan un revenue por unidad ${medianaUnits > 0 && personalUnits > 0 ? pct(((medianaRevenue / medianaUnits) / (personalRevenue / personalUnits) - 1) * 100) : "N/A"} y ${familiarUnits > 0 && personalUnits > 0 ? pct(((familiarRevenue / familiarUnits) / (personalRevenue / personalUnits) - 1) * 100) : "N/A"} mayor respectivamente. <strong>La oportunidad de upsell del Personal a Mediana es la palanca mas directa para crecer en revenue sin aumentar transacciones.</strong>
</div>

<!-- Flavor Analysis -->
<h2>Analisis por Sabor</h2>
<div class="card">
<p style="color:#888;font-size:12px;margin-bottom:12px;">Excluye Minipancakes</p>
<div class="pct-bar-container">
${flavors
  .map((f) => {
    const d = byFlavor.get(f)!;
    const w = totalFlavorRevenue > 0 ? (d.revenue / totalFlavorRevenue) * 100 : 0;
    const colors: Record<string, string> = { Sal: "#60a5fa", Caramelo: "#fbbf24", Mixtas: "#34d399" };
    return `<div class="pct-bar-segment" style="width:${w}%;background:${colors[f]}">${f} ${pct(w)}</div>`;
  })
  .join("")}
</div>
<table style="margin-top:12px;">
<thead><tr><th>Sabor</th><th class="right">Unidades</th><th class="right">% Uds</th><th class="right">Revenue</th><th class="right">% Rev</th><th class="right">Rev/Unidad</th></tr></thead>
<tbody>
${flavors
  .map((f) => {
    const d = byFlavor.get(f)!;
    return `<tr>
  <td><span class="tag tag-${f.toLowerCase()}">${f}</span></td>
  <td class="right">${fmtN(d.units)}</td>
  <td class="right">${pct(totalFlavorUnits > 0 ? (d.units / totalFlavorUnits) * 100 : 0)}</td>
  <td class="right highlight">${fmt(d.revenue)}</td>
  <td class="right">${pct(totalFlavorRevenue > 0 ? (d.revenue / totalFlavorRevenue) * 100 : 0)}</td>
  <td class="right">${fmt(d.units > 0 ? d.revenue / d.units : 0)}</td>
</tr>`;
  })
  .join("")}
</tbody>
</table>
${(() => {
  const flavorsSorted = flavors.map((f) => ({ name: f, ...(byFlavor.get(f)!) })).sort((a, b) => b.units - a.units);
  const revSorted = [...flavorsSorted].sort((a, b) => b.revenue - a.revenue);
  return `<div class="insight">
    <strong>Sabor dominante en unidades:</strong> ${flavorsSorted[0].name} (${fmtN(flavorsSorted[0].units)} uds, ${pct((flavorsSorted[0].units / totalFlavorUnits) * 100)})<br>
    <strong>Sabor dominante en revenue:</strong> ${revSorted[0].name} (${fmt(revSorted[0].revenue)}, ${pct((revSorted[0].revenue / totalFlavorRevenue) * 100)})
  </div>`;
})()}
</div>

<div class="section-insight">
<strong>Interpretacion de sabores:</strong> ${(() => {
  const flavorsSorted = flavors.map((f) => ({ name: f, ...(byFlavor.get(f)!) })).sort((a, b) => b.units - a.units);
  const revSorted = [...flavorsSorted].sort((a, b) => b.revenue - a.revenue);
  const salShare = totalFlavorUnits > 0 ? ((byFlavor.get("Sal")?.units || 0) / totalFlavorUnits * 100) : 0;
  const carameloShare = totalFlavorUnits > 0 ? ((byFlavor.get("Caramelo")?.units || 0) / totalFlavorUnits * 100) : 0;
  const mixtasShare = totalFlavorUnits > 0 ? ((byFlavor.get("Mixtas")?.units || 0) / totalFlavorUnits * 100) : 0;
  if (herfindahlFlavor > 0.45) {
    return `El mercado de sabores esta <strong>altamente concentrado</strong> (HHI: ${(herfindahlFlavor * 10000).toFixed(0)}) — un sabor domina claramente. Esto puede indicar que los clientes llegan con una preferencia fuerte, o que la comunicacion/menu empuja hacia un sabor especifico.`;
  } else if (herfindahlFlavor > 0.36) {
    return `El mercado de sabores muestra <strong>concentracion moderada</strong> (HHI: ${(herfindahlFlavor * 10000).toFixed(0)}). Sal tiene ${pct(salShare)}, Caramelo ${pct(carameloShare)} y Mixtas ${pct(mixtasShare)}. Hay espacio para equilibrar mejor la distribucion.`;
  } else {
    return `Los sabores estan <strong>relativamente bien distribuidos</strong> (HHI: ${(herfindahlFlavor * 10000).toFixed(0)}). Sal tiene ${pct(salShare)}, Caramelo ${pct(carameloShare)} y Mixtas ${pct(mixtasShare)}. Esto sugiere que la oferta de 3 sabores cubre bien las preferencias de los clientes.`;
  }
})()} El sabor Caramelo es particularmente interesante porque cobra un premium significativo vs Sal (${fmt(carameloPersonalPrice)} vs ${fmt(salPersonalPrice)} en Personal), capturando a clientes dispuestos a pagar mas por una experiencia dulce — esto hace del Caramelo un sabor <strong>high-value</strong> mas alla de su volumen.
</div>

<!-- Matrix Size x Flavor -->
<h2>Matriz Tamano x Sabor</h2>
<div class="card">
<table class="matrix-table">
<thead>
<tr>
  <th></th>
  ${flavors.map((f) => `<th><span class="tag tag-${f.toLowerCase()}">${f}</span></th>`).join("")}
  <th>Total</th>
</tr>
</thead>
<tbody>
${sizes
  .map((s) => {
    const rowTotal = flavors.reduce((sum, f) => sum + (matrix.get(`${s}|${f}`)?.revenue || 0), 0);
    const rowUnits = flavors.reduce((sum, f) => sum + (matrix.get(`${s}|${f}`)?.units || 0), 0);
    return `<tr>
  <td><span class="tag tag-${s.toLowerCase()}">${s}</span></td>
  ${flavors
    .map((f) => {
      const d = matrix.get(`${s}|${f}`)!;
      return `<td><div class="matrix-val">${fmt(d.revenue)}</div><div class="matrix-sub">${fmtN(d.units)} uds</div></td>`;
    })
    .join("")}
  <td><div class="matrix-val">${fmt(rowTotal)}</div><div class="matrix-sub">${fmtN(rowUnits)} uds</div></td>
</tr>`;
  })
  .join("")}
<tr style="border-top:2px solid #444;">
  <td><strong>Total</strong></td>
  ${flavors
    .map((f) => {
      const colTotal = sizes.reduce((sum, s) => sum + (matrix.get(`${s}|${f}`)?.revenue || 0), 0);
      const colUnits = sizes.reduce((sum, s) => sum + (matrix.get(`${s}|${f}`)?.units || 0), 0);
      return `<td><div class="matrix-val">${fmt(colTotal)}</div><div class="matrix-sub">${fmtN(colUnits)} uds</div></td>`;
    })
    .join("")}
  <td><div class="matrix-val">${fmt(totalSizeRevenue)}</div><div class="matrix-sub">${fmtN(totalSizeUnits)} uds</div></td>
</tr>
</tbody>
</table>
${(() => {
  // Find best combination
  let bestKey = "";
  let bestRev = 0;
  let bestUnitsKey = "";
  let bestUnitsVal = 0;
  for (const [key, val] of matrix) {
    if (val.revenue > bestRev) { bestRev = val.revenue; bestKey = key; }
    if (val.units > bestUnitsVal) { bestUnitsVal = val.units; bestUnitsKey = key; }
  }
  const [bs, bf] = bestKey.split("|");
  const [bus, buf] = bestUnitsKey.split("|");
  return `<div class="insight">
    <strong>Combinacion top en revenue:</strong> ${bs} ${bf} (${fmt(bestRev)})<br>
    <strong>Combinacion top en unidades:</strong> ${bus} ${buf} (${fmtN(bestUnitsVal)} uds)
  </div>`;
})()}
</div>

<div class="section-insight">
<strong>Lectura de la matriz:</strong> La tabla cruzada tamano x sabor revela las 9 combinaciones posibles y permite identificar los "heroes" y los "oportunidades". Las celdas con mayor revenue son las que deberian recibir prioridad en inventario y visibilidad en el menu. Las celdas con bajo volumen pero precio alto (como Familiar Caramelo a ${fmt(20000)}) representan oportunidades de upsell: cada unidad adicional vendida tiene alto impacto en revenue. Considere destacar estas combinaciones premium en el menu o en la pantalla del POS.
</div>

<!-- Hour Distribution -->
<h2>Distribucion por Hora</h2>
<div class="card">
<table>
<thead><tr><th>Hora</th><th class="right">Uds</th><th class="right">Revenue</th><th class="right">Txns</th><th class="bar-cell">Revenue</th></tr></thead>
<tbody>
${[...byHour.entries()]
  .filter(([, v]) => v.units > 0)
  .sort((a, b) => a[0] - b[0])
  .map(
    ([h, v]) => `<tr>
  <td>${String(h).padStart(2, "0")}:00 - ${String(h + 1).padStart(2, "0")}:00</td>
  <td class="right">${fmtN(v.units)}</td>
  <td class="right highlight">${fmt(v.revenue)}</td>
  <td class="right">${v.transactions}</td>
  <td class="bar-cell">${bar(v.revenue, maxHourRevenue, "#f59e0b")}</td>
</tr>`
  )
  .join("")}
</tbody>
</table>
${(() => {
  const peakHour = [...byHour.entries()].sort((a, b) => b[1].revenue - a[1].revenue)[0];
  return `<div class="insight"><strong>Hora pico:</strong> ${String(peakHour[0]).padStart(2, "0")}:00 con ${fmt(peakHour[1].revenue)} y ${fmtN(peakHour[1].units)} unidades</div>`;
})()}
</div>

<div class="section-insight">
<strong>Patron horario:</strong> La concentracion del ${pct(totalRevenueCrispetas > 0 ? (peakHoursRevenue / totalRevenueCrispetas) * 100 : 0)} del revenue en solo 3 horas (${peakHours.map(([h]) => String(h).padStart(2, "0") + ":00").join(", ")}) indica que la operacion de crispetas necesita estar <strong>al maximo de capacidad</strong> en estas franjas. Si hay filas o demoras durante las horas pico, se pierde revenue directo. Recomendacion: asegurar que la maquina de crispetas y el personal esten listos <strong>30 minutos antes</strong> de la hora pico, con lotes pre-preparados de los sabores mas populares.
</div>

<!-- Day of Week -->
<h2>Distribucion por Dia de Semana</h2>
<div class="card">
<table>
<thead><tr><th>Dia</th><th class="right">Uds</th><th class="right">Revenue</th><th class="right">Txns</th><th class="bar-cell">Revenue</th></tr></thead>
<tbody>
${[...byDayOfWeek.entries()]
  .sort((a, b) => a[0] - b[0])
  .map(
    ([d, v]) => `<tr>
  <td>${dayNames[d]}</td>
  <td class="right">${fmtN(v.units)}</td>
  <td class="right highlight">${fmt(v.revenue)}</td>
  <td class="right">${v.transactions}</td>
  <td class="bar-cell">${bar(v.revenue, maxDayRevenue, "#60a5fa")}</td>
</tr>`
  )
  .join("")}
</tbody>
</table>
${(() => {
  const peakDay = [...byDayOfWeek.entries()].sort((a, b) => b[1].revenue - a[1].revenue)[0];
  return `<div class="insight"><strong>Dia top:</strong> ${dayNames[peakDay[0]]} con ${fmt(peakDay[1].revenue)} y ${fmtN(peakDay[1].units)} unidades en ${peakDay[1].transactions} transacciones</div>`;
})()}
</div>

<div class="section-insight">
<strong>Patron semanal:</strong> Los fines de semana (sabado y domingo) generan un revenue promedio diario de <strong>${fmt(weekendAvgDaily)}</strong> vs <strong>${fmt(weekdayAvgDaily)}</strong> entre semana — una diferencia de ${weekdayAvgDaily > 0 ? pct(((weekendAvgDaily / weekdayAvgDaily) - 1) * 100) : "N/A"} mas los fines de semana. Esto esta directamente correlacionado con la afluencia de cine: los fines de semana mas gente va al cine y las crispetas son el snack natural. Los dias de menor venta entre semana podrian aprovecharse para promociones "2x1 en crispetas" o descuentos que estimulen la compra impulsiva.
</div>

<!-- Daily Trend -->
<h2>Tendencia Diaria - Febrero 2026</h2>
<div class="card">
<table>
<thead><tr><th>Fecha</th><th class="right">Uds</th><th class="right">Revenue</th><th class="right">Txns</th><th class="bar-cell">Revenue</th></tr></thead>
<tbody>
${dailyTrend
  .map(
    ([date, v]) => {
      const d = new Date(date + "T12:00:00");
      const dayN = dayNames[d.getDay()];
      return `<tr>
  <td>${date} <span style="color:#666">(${dayN})</span></td>
  <td class="right">${fmtN(v.units)}</td>
  <td class="right highlight">${fmt(v.revenue)}</td>
  <td class="right">${v.transactions}</td>
  <td class="bar-cell">${bar(v.revenue, maxDailyRevenue, "#34d399")}</td>
</tr>`;
    }
  )
  .join("")}
</tbody>
</table>
${(() => {
  const best = dailyTrend.sort((a, b) => b[1].revenue - a[1].revenue)[0];
  const worst = dailyTrend.filter(([, v]) => v.revenue > 0).sort((a, b) => a[1].revenue - b[1].revenue)[0];
  return `<div class="insight">
    <strong>Mejor dia:</strong> ${best[0]} con ${fmt(best[1].revenue)} (${fmtN(best[1].units)} uds)<br>
    <strong>Dia mas bajo (con ventas):</strong> ${worst ? worst[0] + " con " + fmt(worst[1].revenue) : "N/A"}
  </div>`;
})()}
</div>

<!-- Weekly Trend -->
<h2>Tendencia Semanal</h2>
<div class="card">
<table>
<thead><tr><th>Semana</th><th class="right">Uds</th><th class="right">Revenue</th><th class="right">Txns</th><th class="bar-cell">Revenue</th></tr></thead>
<tbody>
${weeklyTrend
  .map(
    ([w, v]) => `<tr>
  <td>Semana ${w}</td>
  <td class="right">${fmtN(v.units)}</td>
  <td class="right highlight">${fmt(v.revenue)}</td>
  <td class="right">${v.transactions}</td>
  <td class="bar-cell">${bar(v.revenue, maxWeeklyRevenue, "#a78bfa")}</td>
</tr>`
  )
  .join("")}
</tbody>
</table>
</div>

<div class="section-insight">
<strong>Tendencias temporales:</strong> ${daysWithZero.length > 0 ? `Hubo <strong>${daysWithZero.length} dia(s)</strong> en febrero sin ventas de crispetas (${daysWithZero.join(", ")}), lo que probablemente corresponde a dias de cierre del establecimiento.` : "Todos los dias de febrero tuvieron ventas de crispetas, lo que confirma la consistencia del producto."} La tendencia semanal permite evaluar si hay crecimiento, estabilidad o declinacion a lo largo del mes. Busque si las ultimas semanas muestran una tendencia al alza (posible estacionalidad positiva) o a la baja (posible fatiga del producto o competencia).
</div>

<!-- Cross-sell -->
<h2>Cross-sell: Categorias Companeras</h2>
<div class="card">
<p style="color:#888;font-size:12px;margin-bottom:12px;">En ${transactionsWithCrispetas} transacciones con crispetas, ¿que otras categorias aparecen?</p>
<table>
<thead><tr><th>#</th><th>Categoria</th><th class="right">Apariciones</th><th class="right">% Txns</th><th class="right">Revenue Asociado</th><th class="bar-cell">Frecuencia</th></tr></thead>
<tbody>
${crossSellRanking
  .map(
    (c, i) => `<tr>
  <td>${i + 1}</td>
  <td><strong>${c.category}</strong></td>
  <td class="right">${c.count}</td>
  <td class="right">${pct((c.count / transactionsWithCrispetas) * 100)}</td>
  <td class="right highlight">${fmt(c.revenue)}</td>
  <td class="bar-cell">${bar(c.count, maxCrossSellCount, "#f472b6")}</td>
</tr>`
  )
  .join("")}
</tbody>
</table>
${(() => {
  if (crossSellRanking.length > 0) {
    return `<div class="insight"><strong>Categoria mas frecuente con crispetas:</strong> ${crossSellRanking[0].category} (presente en ${pct((crossSellRanking[0].count / transactionsWithCrispetas) * 100)} de las transacciones con crispetas)</div>`;
  }
  return "";
})()}
</div>

<div class="section-insight">
<strong>Lectura del cross-sell:</strong> Las categorias companeras revelan el <strong>contexto de consumo</strong> de las crispetas. ${crossSellRanking.length > 0 ? `${crossSellRanking[0].category} aparece en el ${pct((crossSellRanking[0].count / transactionsWithCrispetas) * 100)} de las transacciones con crispetas, lo que sugiere un patron de compra conjunto fuerte.` : ""} Las categorias con alta co-ocurrencia son candidatas naturales para <strong>combos</strong>: un "Combo Cine" (crispeta + bebida) o un "Combo Familiar" (crispeta familiar + bebidas) podria formalizar este patron y aumentar el ticket promedio. Actualmente, ${crispetaOnlyTickets} transacciones (${pct((crispetaOnlyTickets / transactionsWithCrispetas) * 100)}) son <strong>solo crispetas</strong> — clientes que no compraron nada mas y representan una oportunidad de cross-sell perdida.
</div>

<!-- Upsell Analysis -->
<h2>Upsell: Distribucion de Tamanos por Transaccion</h2>
<div class="card">
<p style="color:#888;font-size:12px;margin-bottom:12px;">De las ${transactionsWithCrispetas} transacciones con crispetas, ¿que tamano compraron?</p>
<table>
<thead><tr><th>Tipo</th><th class="right">Transacciones</th><th class="right">%</th><th class="bar-cell">Proporcion</th></tr></thead>
<tbody>
${[
  { label: "Solo Personal", value: upsellData.onlyPersonal, color: "#a78bfa" },
  { label: "Solo Mediana", value: upsellData.onlyMediana, color: "#fbbf24" },
  { label: "Solo Familiar", value: upsellData.onlyFamiliar, color: "#f87171" },
  { label: "Tamanos mixtos", value: upsellData.mixed, color: "#34d399" },
  { label: "Solo Minipancakes", value: upsellData.onlyMinipancakes, color: "#888" },
]
  .map(
    (d) => `<tr>
  <td><strong>${d.label}</strong></td>
  <td class="right">${d.value}</td>
  <td class="right">${pct(transactionsWithCrispetas > 0 ? (d.value / transactionsWithCrispetas) * 100 : 0)}</td>
  <td class="bar-cell">${bar(d.value, transactionsWithCrispetas, d.color)}</td>
</tr>`
  )
  .join("")}
</tbody>
</table>
<div class="insight">
  <strong>Oportunidad de upsell:</strong> ${fmtN(upsellData.onlyPersonal)} transacciones compraron solo Personal.
  Si el ${pct(transactionsWithCrispetas > 0 ? (upsellData.onlyPersonal / transactionsWithCrispetas) * 100 : 0)} de compradores de Personal subieran a Mediana, el revenue adicional seria significativo.
</div>
</div>

<!-- Revenue per unit -->
<h2>Revenue por Unidad por Producto</h2>
<div class="card">
<table>
<thead><tr><th>Producto</th><th class="right">Precio Lista</th><th class="right">Rev/Unidad Real</th><th class="right">Uds</th><th class="right">Revenue Total</th></tr></thead>
<tbody>
${productRanking
  .map(
    (p) => `<tr>
  <td><strong>${p.name}</strong></td>
  <td class="right">${fmt(p.price)}</td>
  <td class="right highlight">${fmt(p.units > 0 ? p.revenue / p.units : 0)}</td>
  <td class="right">${fmtN(p.units)}</td>
  <td class="right">${fmt(p.revenue)}</td>
</tr>`
  )
  .join("")}
</tbody>
</table>
</div>

<!-- Opportunities -->
<h2>Oportunidades de Crecimiento</h2>

<div class="opp-card">
<h4>1. Programa de Upsell Sistematico: Personal a Mediana</h4>
<p>
${fmtN(upsellData.onlyPersonal)} transacciones (${pct(transactionsWithCrispetas > 0 ? (upsellData.onlyPersonal / transactionsWithCrispetas) * 100 : 0)}) compraron solo tamano Personal. El diferencial de precio entre Personal y Mediana es significativo (ej: Sal ${fmt(salPersonalPrice)} vs ${fmt(8000)}). Implementar un protocolo de upsell en caja: "¿Por solo ${fmt(8000 - salPersonalPrice)} mas llevas la Mediana que es 4 veces mas grande?" podria migrar facilmente el 15-20% de estas ventas.
</p>
<div class="impact">Impacto estimado (20% migracion): +${fmt(upsellPotential20Pct)} revenue mensual adicional</div>
</div>

<div class="opp-card">
<h4>2. Combo Crispetas + Bebida</h4>
<p>
${crossSellRanking.find((c) => c.category === "Bebidas") ? `Las Bebidas ya aparecen en el ${pct((crossSellRanking.find((c) => c.category === "Bebidas")!.count / transactionsWithCrispetas) * 100)} de transacciones con crispetas.` : "Existe oportunidad de crear combos con bebidas."} Formalizar este patron con un combo "Cine Pack" (Crispeta Mediana + Bebida) a un precio atractivo podria: (a) aumentar el tamano promedio de crispeta vendida, (b) aumentar las ventas de bebidas, y (c) simplificar la decision del cliente. El precio del combo debe ser ligeramente menor que la compra por separado, pero priorizar la Mediana sobre la Personal.
</p>
<div class="impact">Impacto: mayor ticket promedio + mejor experiencia de compra</div>
</div>

<div class="opp-card">
<h4>3. Capturar los ${crispetaOnlyTickets} Tickets "Solo Crispetas"</h4>
<p>
${pct((crispetaOnlyTickets / transactionsWithCrispetas) * 100)} de las transacciones con crispetas NO incluyen ningun otro producto. Estos clientes ya estan en la fila — se les puede ofrecer una bebida, un helado, o un postre como complemento. Una estrategia de "sugerencia automatica" en el POS (pantalla del cliente mostrando "Agrega una bebida por solo ${fmt(4000)}") podria convertir el 10-15% de estos tickets.
</p>
<div class="impact">Impacto: +${fmtN(Math.round(crispetaOnlyTickets * 0.12))} tickets con cross-sell adicional mensual</div>
</div>

<div class="opp-card">
<h4>4. Promover Sabor Caramelo como Opcion Premium</h4>
<p>
El Caramelo cobra un premium del ${pct(carameloPremiumPct)} sobre Sal en el mismo tamano, y los clientes lo pagan. Mejorar la visibilidad del Caramelo en el menu (listarlo primero o con destaque visual) y en la pantalla POS podria migrar clientes indecisos hacia esta opcion de mayor margen. Tambien considerar un "Caramelo Especial" con toppings (chispas de chocolate, etc.) a un precio aun mas premium.
</p>
<div class="impact">Impacto: mayor revenue por unidad sin aumentar volumen</div>
</div>

<div class="opp-card">
<h4>5. Optimizar Operacion en Horas Pico</h4>
<p>
El ${pct(totalRevenueCrispetas > 0 ? (peakHoursRevenue / totalRevenueCrispetas) * 100 : 0)} del revenue se concentra en 3 horas. Pre-preparar lotes de crispetas (especialmente de los sabores/tamanos mas vendidos) 30 minutos antes del pico asegura que no se pierdan ventas por tiempos de espera. Tambien considerar una segunda estacion de servicio o un flujo express durante horas pico.
</p>
<div class="impact">Impacto: reduccion de tiempo de espera + captura de ventas perdidas</div>
</div>

<!-- Alerts -->
<h2>Alertas y Puntos de Atencion</h2>

<div class="alert-card">
<h4>Alta Dependencia de Crispetas</h4>
<p>
Con el ${pct(pctOfTotal)} del revenue total, Fanzine depende fuertemente de las crispetas. Cualquier problema operativo (maquina averiada, falta de maiz, problema de proveedor) tendria un impacto desproporcionado en el revenue. Se recomienda: (a) tener repuestos criticos de la maquina de crispetas, (b) mantener inventario de seguridad de maiz y caramelo, y (c) diversificar la oferta de snacks para reducir la concentracion.
</p>
</div>

<div class="alert-card">
<h4>Tamano Personal como "Trampa de Volumen"</h4>
<p>
El tamano Personal genera alto volumen pero bajo revenue por unidad (${fmt(avgPersonalPrice)} promedio). Si no se maneja activamente el upsell, existe riesgo de que cada vez mas clientes se queden en el Personal, especialmente si hay presion economica. Monitorear mensualmente la proporcion Personal vs Mediana/Familiar es clave — si la participacion de Personal crece, el revenue total podria caer incluso con el mismo numero de unidades.
</p>
</div>

<div class="alert-card">
<h4>Concentracion Temporal Extrema</h4>
<p>
La alta concentracion en fines de semana y horas pico especificas significa que la capacidad de produccion se satura en momentos puntuales. Si la demanda crece (ej: una pelicula taquillera), existe riesgo de no poder atender a todos los clientes, generando filas y abandono. Evaluar si la infraestructura actual puede manejar un aumento del 30% en la demanda pico.
</p>
</div>

${daysWithZero.length > 3 ? `<div class="alert-card">
<h4>Dias Sin Ventas de Crispetas</h4>
<p>
${daysWithZero.length} dias en febrero no tuvieron ventas de crispetas. Si el establecimiento estuvo abierto esos dias, esto representa revenue perdido. Verificar si estos dias corresponden a cierres programados o si hubo problemas operativos.
</p>
</div>` : ""}

<div class="alert-card">
<h4>Promedio de ${(avgUnitsPerTx).toFixed(1)} Unidades por Transaccion</h4>
<p>
Las transacciones con crispetas promedian ${(avgUnitsPerTx).toFixed(1)} unidades. ${avgUnitsPerTx < 1.3 ? "Esto significa que la gran mayoria de clientes compra solo 1 crispeta. Considerar promociones 'segunda crispeta con descuento' o paquetes para grupos familiares para aumentar unidades por ticket." : avgUnitsPerTx > 1.5 ? "Esto es positivo — muchos clientes compran multiples crispetas, probablemente para compartir. Reforzar este patron con paquetes familiares." : "Un nivel moderado que podria mejorarse con promociones de multiples unidades."}
</p>
</div>

<!-- Conclusions -->
<div class="conclusion">
<h3>Conclusiones</h3>
<p>
Las crispetas son el <strong>motor principal de revenue</strong> de Fanzine, representando casi un tercio de las ventas totales. El negocio tiene una base solida con alta penetracion (${pct((transactionsWithCrispetas / TOTAL_SALES) * 100)}) y un portafolio diversificado en tamanos y sabores.
</p>
<p>Las 5 acciones prioritarias para marzo 2026 son:</p>
<ul>
<li><strong>Implementar protocolo de upsell en caja</strong> — migrar al menos 15% de compras Personal a Mediana (impacto estimado: +${fmt(upsellPotential20Pct)}/mes)</li>
<li><strong>Crear combo "Cine Pack"</strong> — Crispeta Mediana + Bebida a precio combo, capturando el patron natural de cross-sell</li>
<li><strong>Agregar sugerencia automatica en POS</strong> para clientes con tickets de solo crispetas, ofreciendo bebida o helado</li>
<li><strong>Destacar Caramelo y Familiar</strong> en menu y POS como opciones premium — son los de mayor margen</li>
<li><strong>Preparar operacion pre-pico</strong> — tener lotes listos 30 min antes de horas pico para evitar cuellos de botella</li>
</ul>
<p>
El seguimiento mensual debe enfocarse en: (a) evolucion del mix de tamanos (alerta si Personal crece), (b) revenue por unidad promedio, (c) penetracion de crispetas sobre total de ventas, y (d) efectividad de las acciones de upsell medida como migracion de tamano.
</p>
</div>

<!-- Footer -->
<div style="margin-top:40px;padding:20px;text-align:center;color:#555;font-size:12px;border-top:1px solid #222;">
  Generado automaticamente | Datos: Fudo POS via Supabase | Febrero 2026 | FANZINE App Analytics
</div>

</body>
</html>`;

const outPath = "/Users/a./Desktop/PRESENTA/FANZINE-app/docs/febrero/analisis-crispetas-feb2026.html";
writeFileSync(outPath, html, "utf-8");
console.log(`HTML generado: ${outPath}`);
console.log(`\n--- RESUMEN CRISPETAS ---`);
console.log(`Revenue: ${fmt(totalRevenueCrispetas)} (${pct(pctOfTotal)} del total)`);
console.log(`Unidades: ${totalUnits}`);
console.log(`Transacciones: ${transactionsWithCrispetas}`);
console.log(`Revenue por unidad: ${fmt(revenuePerUnit)}`);
console.log(`Ticket promedio: ${fmt(ticketPromedioCrispetas)}`);

execSync(`open "${outPath}"`);
console.log("Abriendo en el navegador...");
