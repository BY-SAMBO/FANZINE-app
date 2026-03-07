import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { execSync } from "child_process";

// --- Load data ---
const raw = JSON.parse(
  readFileSync("/Users/a./Desktop/PRESENTA/FANZINE-app/scripts/_feb-sales-data.json", "utf-8")
);

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
  payments: { amount: number; methodId: string; methodName: string; canceled: boolean }[];
}

const sales: Sale[] = raw.sales;
const TOTAL_REVENUE = raw.metadata.totalRevenue as number;
const TOTAL_SALES = raw.metadata.totalSales as number;

// --- Helpers ---
const fmt = (n: number) => "$" + n.toLocaleString("es-CO");
const pct = (n: number, d: number) => d === 0 ? "0.0%" : (n / d * 100).toFixed(1) + "%";
const dayNames = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"];

// --- Filter helado items (categoryId "12", non-canceled) ---
const isHelado = (item: Item) => item.categoryId === "12" && !item.canceled;

const allItems = sales.flatMap(s => s.items.filter(i => !i.canceled));
const heladoItems = allItems.filter(isHelado);
const salesWithHelado = sales.filter(s => s.items.some(isHelado));

// Transactions WITHOUT helado for comparison
const salesWithoutHelado = sales.filter(s => !s.items.some(isHelado));

// --- 1. KPIs ---
const heladoRevenue = heladoItems.reduce((sum, i) => sum + i.total, 0);
const heladoUnits = heladoItems.reduce((sum, i) => sum + i.quantity, 0);
const heladoPctRevenue = heladoRevenue / TOTAL_REVENUE * 100;
const avgTicketHelado = salesWithHelado.length > 0 ? heladoRevenue / salesWithHelado.length : 0;
const uniqueProducts = new Set(heladoItems.map(i => i.productId)).size;
const avgPricePerUnit = heladoUnits > 0 ? heladoRevenue / heladoUnits : 0;

// Avg total ticket for sales WITH helado vs WITHOUT
const avgTotalTicketWithHelado = salesWithHelado.length > 0
  ? salesWithHelado.reduce((s, sale) => s + sale.total, 0) / salesWithHelado.length
  : 0;
const avgTotalTicketWithout = salesWithoutHelado.length > 0
  ? salesWithoutHelado.reduce((s, sale) => s + sale.total, 0) / salesWithoutHelado.length
  : 0;

// --- 2. Ranking por producto ---
const byProduct: Record<string, { name: string; revenue: number; units: number; price: number }> = {};
for (const item of heladoItems) {
  if (!byProduct[item.productId]) {
    byProduct[item.productId] = { name: item.productName, revenue: 0, units: 0, price: item.catalogPrice };
  }
  byProduct[item.productId].revenue += item.total;
  byProduct[item.productId].units += item.quantity;
}
const productRanking = Object.values(byProduct).sort((a, b) => b.revenue - a.revenue);
const productByUnits = [...productRanking].sort((a, b) => b.units - a.units);

// --- 3. Mix: Conos vs Galletas vs Sundae vs Sandwich ---
type MixGroup = { label: string; revenue: number; units: number };
const mixGroups: MixGroup[] = [
  { label: "Conos", revenue: 0, units: 0 },
  { label: "Galletas", revenue: 0, units: 0 },
  { label: "Sundae", revenue: 0, units: 0 },
  { label: "Sandwich", revenue: 0, units: 0 },
];

for (const item of heladoItems) {
  const name = item.productName.toLowerCase();
  if (name.includes("cono")) { mixGroups[0].revenue += item.total; mixGroups[0].units += item.quantity; }
  else if (name.includes("galleta")) { mixGroups[1].revenue += item.total; mixGroups[1].units += item.quantity; }
  else if (name.includes("sundae")) { mixGroups[2].revenue += item.total; mixGroups[2].units += item.quantity; }
  else if (name.includes("sandwich")) { mixGroups[3].revenue += item.total; mixGroups[3].units += item.quantity; }
}
const mixSorted = [...mixGroups].sort((a, b) => b.revenue - a.revenue);

// --- 4. Distribucion por hora ---
const byHour: Record<number, { revenue: number; units: number; txns: number }> = {};
const generalByHour: Record<number, { revenue: number; txns: number }> = {};

for (const sale of sales) {
  const h = sale.hour;
  if (!generalByHour[h]) generalByHour[h] = { revenue: 0, txns: 0 };
  generalByHour[h].revenue += sale.total;
  generalByHour[h].txns += 1;
}

for (const sale of salesWithHelado) {
  const h = sale.hour;
  if (!byHour[h]) byHour[h] = { revenue: 0, units: 0, txns: 0 };
  const heladosInSale = sale.items.filter(isHelado);
  byHour[h].revenue += heladosInSale.reduce((s, i) => s + i.total, 0);
  byHour[h].units += heladosInSale.reduce((s, i) => s + i.quantity, 0);
  byHour[h].txns += 1;
}

const hourData = Array.from({ length: 24 }, (_, h) => ({
  hour: h,
  heladoRevenue: byHour[h]?.revenue ?? 0,
  heladoUnits: byHour[h]?.units ?? 0,
  heladoTxns: byHour[h]?.txns ?? 0,
  generalRevenue: generalByHour[h]?.revenue ?? 0,
  generalTxns: generalByHour[h]?.txns ?? 0,
})).filter(d => d.heladoTxns > 0 || d.generalTxns > 0);

// --- 5. Distribucion por dia de semana ---
const byDow: Record<number, { revenue: number; units: number; txns: number }> = {};
for (const sale of salesWithHelado) {
  const d = sale.dayOfWeek;
  if (!byDow[d]) byDow[d] = { revenue: 0, units: 0, txns: 0 };
  const heladosInSale = sale.items.filter(isHelado);
  byDow[d].revenue += heladosInSale.reduce((s, i) => s + i.total, 0);
  byDow[d].units += heladosInSale.reduce((s, i) => s + i.quantity, 0);
  byDow[d].txns += 1;
}

const dowData = [0, 1, 2, 3, 4, 5, 6].map(d => ({
  dayNum: d,
  day: dayNames[d],
  revenue: byDow[d]?.revenue ?? 0,
  units: byDow[d]?.units ?? 0,
  txns: byDow[d]?.txns ?? 0,
}));

// Weekend vs weekday
const weekendRevenue = dowData.filter(d => d.dayNum === 0 || d.dayNum === 5 || d.dayNum === 6).reduce((s, d) => s + d.revenue, 0);
const weekdayRevenue = dowData.filter(d => d.dayNum >= 1 && d.dayNum <= 4).reduce((s, d) => s + d.revenue, 0);
const weekendDays = dowData.filter(d => d.dayNum === 0 || d.dayNum === 5 || d.dayNum === 6).length; // 3
const weekdayDays = 4;
const avgWeekendPerDay = weekendRevenue / weekendDays;
const avgWeekdayPerDay = weekdayRevenue / weekdayDays;

// --- 6. Tendencia diaria ---
const byDate: Record<string, { revenue: number; units: number; txns: number }> = {};
for (const sale of salesWithHelado) {
  const d = sale.date;
  if (!byDate[d]) byDate[d] = { revenue: 0, units: 0, txns: 0 };
  const heladosInSale = sale.items.filter(isHelado);
  byDate[d].revenue += heladosInSale.reduce((s, i) => s + i.total, 0);
  byDate[d].units += heladosInSale.reduce((s, i) => s + i.quantity, 0);
  byDate[d].txns += 1;
}
const dailyData = Object.entries(byDate)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([date, data]) => ({ date, ...data }));

// Best & worst days
const bestDay = dailyData.reduce((best, d) => d.revenue > best.revenue ? d : best, dailyData[0]);
const worstDay = dailyData.reduce((worst, d) => d.revenue < worst.revenue ? d : worst, dailyData[0]);

// Days with zero helado sales
const allFebDates: string[] = [];
for (let i = 1; i <= 28; i++) {
  allFebDates.push(`2026-02-${String(i).padStart(2, "0")}`);
}
const daysWithZero = allFebDates.filter(d => !byDate[d]);

// First half vs second half trend
const firstHalf = dailyData.filter(d => d.date <= "2026-02-14");
const secondHalf = dailyData.filter(d => d.date > "2026-02-14");
const firstHalfRevenue = firstHalf.reduce((s, d) => s + d.revenue, 0);
const secondHalfRevenue = secondHalf.reduce((s, d) => s + d.revenue, 0);

// --- 7. Tendencia semanal ---
const byWeek: Record<number, { revenue: number; units: number; txns: number }> = {};
for (const sale of salesWithHelado) {
  const w = sale.weekNumber;
  if (!byWeek[w]) byWeek[w] = { revenue: 0, units: 0, txns: 0 };
  const heladosInSale = sale.items.filter(isHelado);
  byWeek[w].revenue += heladosInSale.reduce((s, i) => s + i.total, 0);
  byWeek[w].units += heladosInSale.reduce((s, i) => s + i.quantity, 0);
  byWeek[w].txns += 1;
}
const weeklyData = Object.entries(byWeek)
  .sort(([a], [b]) => Number(a) - Number(b))
  .map(([week, data]) => ({ week: Number(week), label: `Semana ${week}`, ...data }));

const bestWeek = weeklyData.reduce((best, w) => w.revenue > best.revenue ? w : best, weeklyData[0]);
const worstWeek = weeklyData.reduce((worst, w) => w.revenue < worst.revenue ? w : worst, weeklyData[0]);

// --- 8. Cross-sell: categorias companion ---
const companionCats: Record<string, { name: string; revenue: number; count: number }> = {};
for (const sale of salesWithHelado) {
  const nonHelado = sale.items.filter(i => !isHelado(i) && !i.canceled && i.categoryId !== "15" && i.categoryId !== "16" && i.categoryId !== "17");
  for (const item of nonHelado) {
    if (!companionCats[item.categoryId]) {
      companionCats[item.categoryId] = { name: item.categoryName, revenue: 0, count: 0 };
    }
    companionCats[item.categoryId].revenue += item.total;
    companionCats[item.categoryId].count += item.quantity;
  }
}
const crossSell = Object.values(companionCats).sort((a, b) => b.count - a.count).slice(0, 10);

// % of helado sales that are helado-ONLY (no other categories)
const heladoOnlySales = salesWithHelado.filter(s => {
  const nonHeladoNonAddon = s.items.filter(i => !i.canceled && i.categoryId !== "12" && i.categoryId !== "15" && i.categoryId !== "16" && i.categoryId !== "17");
  return nonHeladoNonAddon.length === 0;
});
const heladoOnlyPct = (heladoOnlySales.length / salesWithHelado.length * 100).toFixed(1);

// --- 9. % helado en ticket total ---
let sumHeladoRatio = 0;
for (const sale of salesWithHelado) {
  if (sale.total > 0) {
    const heladoInSale = sale.items.filter(isHelado).reduce((s, i) => s + i.total, 0);
    sumHeladoRatio += heladoInSale / sale.total;
  }
}
const avgHeladoPctOfTicket = salesWithHelado.length > 0
  ? (sumHeladoRatio / salesWithHelado.length * 100).toFixed(1)
  : "0.0";

// --- 10. Horas pico helados vs generales ---
const topHeladoHours = [...hourData].sort((a, b) => b.heladoRevenue - a.heladoRevenue).slice(0, 5);
const topGeneralHours = [...hourData].sort((a, b) => b.generalRevenue - a.generalRevenue).slice(0, 5);

// Peak hour overlap check
const heladoPeakSet = new Set(topHeladoHours.map(h => h.hour));
const generalPeakSet = new Set(topGeneralHours.map(h => h.hour));
const overlapHours = [...heladoPeakSet].filter(h => generalPeakSet.has(h));

// --- Helper for bars ---
const bar = (value: number, max: number, color: string = "#f59e0b") => {
  const w = max > 0 ? Math.round(value / max * 100) : 0;
  return `<div style="background:${color};height:18px;border-radius:4px;width:${w}%;min-width:2px;"></div>`;
};

// --- Compute insight texts ---
const topProduct = productRanking[0];
const topByUnitsProduct = productByUnits[0];
const topMix = mixSorted[0];
const topHourHelado = topHeladoHours[0];
const topDow = [...dowData].sort((a, b) => b.revenue - a.revenue)[0];
const worstDow = [...dowData].sort((a, b) => a.revenue - b.revenue).find(d => d.revenue > 0) || dowData[0];

// Revenue per unit by product
const highMarginProducts = productRanking.filter(p => p.revenue / p.units >= 9000);
const lowPriceProducts = productRanking.filter(p => p.revenue / p.units <= 3500);

// --- Generate HTML ---
const maxProductRevenue = productRanking[0]?.revenue ?? 1;
const maxProductUnits = productByUnits[0]?.units ?? 1;
const maxHourRevenue = Math.max(...hourData.map(d => d.heladoRevenue), 1);
const maxDowRevenue = Math.max(...dowData.map(d => d.revenue), 1);
const maxDailyRevenue = Math.max(...dailyData.map(d => d.revenue), 1);
const maxWeeklyRevenue = Math.max(...weeklyData.map(d => d.revenue), 1);
const maxMixRevenue = Math.max(...mixGroups.map(g => g.revenue), 1);
const maxCrossSellCount = crossSell[0]?.count ?? 1;

const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Helados - Analisis Febrero 2026</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #0f0f0f; color: #e0e0e0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; max-width: 1100px; margin: 0 auto; }
  h1 { font-size: 28px; margin-bottom: 6px; color: #fff; }
  h2 { font-size: 20px; margin: 40px 0 16px; color: #f59e0b; border-bottom: 1px solid #333; padding-bottom: 8px; }
  h3 { font-size: 16px; color: #ccc; margin-bottom: 10px; }
  .subtitle { color: #888; font-size: 14px; margin-bottom: 24px; }
  .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 14px; margin-bottom: 24px; }
  .kpi { background: #1a1a1a; border-radius: 12px; padding: 18px; border: 1px solid #2a2a2a; }
  .kpi .value { font-size: 26px; font-weight: 700; color: #f59e0b; }
  .kpi .label { font-size: 11px; color: #888; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
  .card { background: #1a1a1a; border-radius: 12px; padding: 20px; border: 1px solid #2a2a2a; margin-bottom: 16px; }
  .insight { background: #1a1a1a; border-left: 3px solid #f59e0b; border-radius: 0 12px 12px 0; padding: 16px 20px; margin: 12px 0 20px; line-height: 1.7; font-size: 14px; color: #ccc; }
  .insight strong { color: #f59e0b; }
  .insight em { color: #e0e0e0; font-style: normal; font-weight: 500; }
  .exec-summary { background: linear-gradient(135deg, #1a1a1a 0%, #1f1a10 100%); border: 1px solid #f59e0b33; border-radius: 12px; padding: 24px; margin-bottom: 24px; line-height: 1.8; font-size: 15px; color: #d4d4d4; }
  .exec-summary p { margin-bottom: 12px; }
  .exec-summary strong { color: #f59e0b; }
  .opp-card { background: #0f1f0f; border: 1px solid #10b98133; border-radius: 12px; padding: 20px; margin-bottom: 12px; }
  .opp-card h4 { color: #10b981; margin-bottom: 8px; font-size: 15px; }
  .opp-card p { line-height: 1.7; font-size: 14px; color: #ccc; }
  .alert-card { background: #1f0f0f; border: 1px solid #ef444433; border-radius: 12px; padding: 20px; margin-bottom: 12px; }
  .alert-card h4 { color: #ef4444; margin-bottom: 8px; font-size: 15px; }
  .alert-card p { line-height: 1.7; font-size: 14px; color: #ccc; }
  .conclusion { background: linear-gradient(135deg, #1a1a1a 0%, #101a2a 100%); border: 1px solid #3b82f633; border-radius: 12px; padding: 24px; margin: 20px 0; line-height: 1.8; font-size: 15px; color: #d4d4d4; }
  .conclusion p { margin-bottom: 12px; }
  .conclusion strong { color: #3b82f6; }
  table { width: 100%; border-collapse: collapse; font-size: 14px; }
  th { text-align: left; padding: 10px 12px; color: #888; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #333; }
  td { padding: 10px 12px; border-bottom: 1px solid #1f1f1f; }
  tr:hover td { background: #222; }
  .bar-cell { width: 28%; }
  .right { text-align: right; }
  .highlight { color: #f59e0b; font-weight: 600; }
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  @media (max-width: 768px) { .grid-2 { grid-template-columns: 1fr; } }
  .tag { display: inline-block; padding: 2px 8px; border-radius: 6px; font-size: 12px; font-weight: 600; }
  .tag-gold { background: #f59e0b22; color: #f59e0b; }
  .tag-green { background: #10b98122; color: #10b981; }
  .tag-blue { background: #3b82f622; color: #3b82f6; }
  .tag-pink { background: #ec489922; color: #ec4899; }
  .small { font-size: 12px; color: #666; }
  .divider { border: none; border-top: 1px solid #222; margin: 32px 0; }
</style>
</head>
<body>

<h1>HELADOS - Analisis de Ventas</h1>
<p class="subtitle">Cine & Tex-Mex | Febrero 2026 | ${salesWithHelado.length} transacciones con helado de ${TOTAL_SALES} totales</p>

<!-- RESUMEN EJECUTIVO -->
<h2>Resumen Ejecutivo</h2>
<div class="exec-summary">
  <p>La categoria de <strong>Helados</strong> genero <strong>${fmt(heladoRevenue)}</strong> en febrero 2026, representando el <strong>${heladoPctRevenue.toFixed(1)}%</strong> del revenue total del negocio (${fmt(TOTAL_REVENUE)}). Se vendieron <strong>${heladoUnits} unidades</strong> en <strong>${salesWithHelado.length} transacciones</strong>, lo que convierte a Helados en una de las categorias con mayor frecuencia de compra: 1 de cada ${Math.round(TOTAL_SALES / salesWithHelado.length)} transacciones incluye al menos un helado.</p>

  <p>El producto estrella por volumen es <strong>${topByUnitsProduct.name}</strong> con ${topByUnitsProduct.units} unidades, mientras que <strong>${topProduct.name}</strong> lidera en revenue con ${fmt(topProduct.revenue)}. El mix esta dominado por los <strong>${topMix.label}</strong>, que representan el ${pct(topMix.revenue, heladoRevenue)} del revenue de helados y el ${pct(topMix.units, heladoUnits)} de las unidades.</p>

  <p>Un dato critico: el <strong>${avgHeladoPctOfTicket}%</strong> del ticket promedio en transacciones con helado corresponde a helados, y el <strong>${heladoOnlyPct}%</strong> de estas transacciones son compras exclusivas de helado (sin otros productos principales). Esto indica que los helados funcionan predominantemente como <strong>compra independiente</strong>, no como complemento de una comida. El ticket promedio de helado es de apenas <strong>${fmt(Math.round(avgTicketHelado))}</strong>, sugiriendo una oportunidad significativa de cross-sell.</p>

  <p>El horario pico de helados se concentra en las <strong>${String(topHeladoHours[0].hour).padStart(2, "0")}:00 - ${String(topHeladoHours[0].hour + 1).padStart(2, "0")}:00</strong> hrs. ${avgWeekendPerDay > avgWeekdayPerDay ? `Los fines de semana generan en promedio ${fmt(Math.round(avgWeekendPerDay))} por dia vs ${fmt(Math.round(avgWeekdayPerDay))} entre semana, un <strong>${((avgWeekendPerDay / avgWeekdayPerDay - 1) * 100).toFixed(0)}% mas</strong>.` : `No hay diferencia significativa entre semana y fin de semana.`}</p>

  <p>${secondHalfRevenue > firstHalfRevenue ? `La tendencia fue <strong>positiva</strong> durante el mes: la segunda mitad de febrero genero ${fmt(secondHalfRevenue)} vs ${fmt(firstHalfRevenue)} de la primera mitad, un crecimiento del ${((secondHalfRevenue / firstHalfRevenue - 1) * 100).toFixed(0)}%.` : `La tendencia fue <strong>decreciente</strong>: la primera mitad de febrero genero ${fmt(firstHalfRevenue)} vs ${fmt(secondHalfRevenue)} de la segunda mitad.`}</p>
</div>

<!-- KPIs -->
<h2>KPIs Principales</h2>
<div class="kpi-grid">
  <div class="kpi">
    <div class="value">${fmt(heladoRevenue)}</div>
    <div class="label">Revenue Helados</div>
  </div>
  <div class="kpi">
    <div class="value">${heladoPctRevenue.toFixed(1)}%</div>
    <div class="label">% del Total (${fmt(TOTAL_REVENUE)})</div>
  </div>
  <div class="kpi">
    <div class="value">${heladoUnits.toLocaleString("es-CO")}</div>
    <div class="label">Unidades Vendidas</div>
  </div>
  <div class="kpi">
    <div class="value">${fmt(Math.round(avgTicketHelado))}</div>
    <div class="label">Ticket Promedio Helado</div>
  </div>
  <div class="kpi">
    <div class="value">${fmt(Math.round(avgPricePerUnit))}</div>
    <div class="label">Precio Prom / Unidad</div>
  </div>
  <div class="kpi">
    <div class="value">${salesWithHelado.length}</div>
    <div class="label">Transacciones</div>
  </div>
  <div class="kpi">
    <div class="value">${uniqueProducts}</div>
    <div class="label">Productos Activos</div>
  </div>
  <div class="kpi">
    <div class="value">${heladoOnlyPct}%</div>
    <div class="label">Compras Solo Helado</div>
  </div>
</div>

<!-- Ranking por Revenue -->
<h2>Ranking de Productos por Revenue</h2>
<div class="card">
<table>
  <tr><th>#</th><th>Producto</th><th class="right">Revenue</th><th class="right">Uds</th><th class="right">%Rev</th><th class="bar-cell"></th></tr>
  ${productRanking.map((p, i) => `<tr>
    <td class="highlight">${i + 1}</td>
    <td>${p.name}</td>
    <td class="right">${fmt(p.revenue)}</td>
    <td class="right">${p.units}</td>
    <td class="right">${pct(p.revenue, heladoRevenue)}</td>
    <td class="bar-cell">${bar(p.revenue, maxProductRevenue)}</td>
  </tr>`).join("")}
</table>
</div>
<div class="insight">
  <strong>Insight:</strong> ${topProduct.name} lidera en revenue con ${fmt(topProduct.revenue)} (${pct(topProduct.revenue, heladoRevenue)}), pero ${topProduct.name === topByUnitsProduct.name ? "tambien lidera en unidades" : `en volumen el lider es ${topByUnitsProduct.name} con ${topByUnitsProduct.units} unidades`}. ${highMarginProducts.length > 0 ? `Los productos de mayor valor unitario (${highMarginProducts.map(p => p.name).join(", ")}) representan una oportunidad para aumentar el ticket promedio a traves de promocion activa.` : ""} ${lowPriceProducts.length > 0 ? `Los conos a $3,000 son el producto de entrada y generan alto volumen pero bajo revenue por unidad.` : ""}
</div>

<!-- Ranking por Unidades -->
<h2>Ranking de Productos por Unidades</h2>
<div class="card">
<table>
  <tr><th>#</th><th>Producto</th><th class="right">Unidades</th><th class="right">Revenue</th><th class="right">%Uds</th><th class="bar-cell"></th></tr>
  ${productByUnits.map((p, i) => `<tr>
    <td class="highlight">${i + 1}</td>
    <td>${p.name}</td>
    <td class="right">${p.units}</td>
    <td class="right">${fmt(p.revenue)}</td>
    <td class="right">${pct(p.units, heladoUnits)}</td>
    <td class="bar-cell">${bar(p.units, maxProductUnits, "#3b82f6")}</td>
  </tr>`).join("")}
</table>
</div>
<div class="insight">
  <strong>Insight:</strong> Los 3 conos (Vainilla, Chocolate, Mixto) suman ${productByUnits.filter(p => p.name.toLowerCase().includes("cono")).reduce((s, p) => s + p.units, 0)} unidades (${pct(productByUnits.filter(p => p.name.toLowerCase().includes("cono")).reduce((s, p) => s + p.units, 0), heladoUnits)} del total). Esto confirma que el helado de cono es el formato preferido del cliente. Sin embargo, a $3,000 por unidad, tienen el revenue por unidad mas bajo de toda la categoria.
</div>

<!-- Mix -->
<h2>Analisis de Mix: Conos vs Galletas vs Sundae vs Sandwich</h2>
<div class="card">
<table>
  <tr><th>Grupo</th><th class="right">Revenue</th><th class="right">% Rev</th><th class="right">Uds</th><th class="right">% Uds</th><th class="bar-cell"></th></tr>
  ${mixSorted.map(g => `<tr>
    <td><span class="tag ${g.label === 'Conos' ? 'tag-gold' : g.label === 'Galletas' ? 'tag-green' : g.label === 'Sundae' ? 'tag-blue' : 'tag-pink'}">${g.label}</span></td>
    <td class="right">${fmt(g.revenue)}</td>
    <td class="right">${pct(g.revenue, heladoRevenue)}</td>
    <td class="right">${g.units}</td>
    <td class="right">${pct(g.units, heladoUnits)}</td>
    <td class="bar-cell">${bar(g.revenue, maxMixRevenue, "#10b981")}</td>
  </tr>`).join("")}
</table>
</div>
<div class="insight">
  <strong>Insight:</strong> Existe un desbalance importante entre volumen y revenue. Los <em>Conos</em> dominan en unidades (${pct(mixGroups[0].units, heladoUnits)}) pero generan un revenue por unidad de solo ${fmt(mixGroups[0].units > 0 ? Math.round(mixGroups[0].revenue / mixGroups[0].units) : 0)}. En contraste, el <em>Sandwich de helado</em> a $15,000 genera ${fmt(mixGroups[3].revenue)} con solo ${mixGroups[3].units} unidades (${pct(mixGroups[3].units, heladoUnits)} del volumen pero ${pct(mixGroups[3].revenue, heladoRevenue)} del revenue). ${mixGroups[2].units > 0 ? `El Sundae a $9,000 es el punto medio: buen volumen (${mixGroups[2].units} uds) con revenue significativo (${fmt(mixGroups[2].revenue)}).` : ""} Migrar aunque sea un 10% de las ventas de conos hacia Sundae o Sandwich tendria un impacto notable en el revenue.
</div>

<!-- Distribucion por Hora -->
<h2>Distribucion por Hora del Dia</h2>
<div class="card">
<table>
  <tr><th>Hora</th><th class="right">Revenue</th><th class="right">Uds</th><th class="right">Txns</th><th class="bar-cell"></th></tr>
  ${hourData.filter(d => d.heladoRevenue > 0).sort((a, b) => a.hour - b.hour).map(d => `<tr>
    <td>${String(d.hour).padStart(2, "0")}:00 - ${String(d.hour + 1).padStart(2, "0")}:00</td>
    <td class="right">${fmt(d.heladoRevenue)}</td>
    <td class="right">${d.heladoUnits}</td>
    <td class="right">${d.heladoTxns}</td>
    <td class="bar-cell">${bar(d.heladoRevenue, maxHourRevenue, "#f59e0b")}</td>
  </tr>`).join("")}
</table>
</div>
<div class="insight">
  <strong>Insight:</strong> La hora pico de helados es <em>${String(topHeladoHours[0].hour).padStart(2, "0")}:00</em> con ${fmt(topHeladoHours[0].heladoRevenue)} en revenue y ${topHeladoHours[0].heladoUnits} unidades. ${topHeladoHours.length > 1 ? `Le sigue las ${String(topHeladoHours[1].hour).padStart(2, "0")}:00 con ${fmt(topHeladoHours[1].heladoRevenue)}.` : ""} La ventana de mayor venta de helados es entre las ${String(topHeladoHours[topHeladoHours.length - 1].hour).padStart(2, "0")}:00 y las ${String(topHeladoHours[0].hour + 1).padStart(2, "0")}:00. Las horas tempranas y nocturnas tienen minimo movimiento, lo cual es esperado para una categoria de impulso como helados.
</div>

<!-- Distribucion por Dia de Semana -->
<h2>Distribucion por Dia de Semana</h2>
<div class="card">
<table>
  <tr><th>Dia</th><th class="right">Revenue</th><th class="right">Uds</th><th class="right">Txns</th><th class="bar-cell"></th></tr>
  ${dowData.map(d => `<tr>
    <td>${d.day}</td>
    <td class="right">${fmt(d.revenue)}</td>
    <td class="right">${d.units}</td>
    <td class="right">${d.txns}</td>
    <td class="bar-cell">${bar(d.revenue, maxDowRevenue, "#8b5cf6")}</td>
  </tr>`).join("")}
</table>
</div>
<div class="insight">
  <strong>Insight:</strong> <em>${topDow.day}</em> es el dia mas fuerte para helados con ${fmt(topDow.revenue)} y ${topDow.units} unidades. ${worstDow.day !== topDow.day ? `El dia mas debil es <em>${worstDow.day}</em> con solo ${fmt(worstDow.revenue)}.` : ""} En promedio, un dia de fin de semana (Vie-Sab-Dom) genera <em>${fmt(Math.round(avgWeekendPerDay))}</em> vs <em>${fmt(Math.round(avgWeekdayPerDay))}</em> de un dia entre semana. ${avgWeekendPerDay > avgWeekdayPerDay * 1.2 ? "Esto confirma que el helado tiene un componente de 'plan de fin de semana' significativo." : "La diferencia no es dramatica, lo que sugiere que el helado se vende de forma bastante constante todos los dias."}
</div>

<!-- Tendencia Diaria -->
<h2>Tendencia Diaria - Febrero 2026</h2>
<div class="card" style="max-height:500px;overflow-y:auto">
<table>
  <tr><th>Fecha</th><th class="right">Revenue</th><th class="right">Uds</th><th class="right">Txns</th><th class="bar-cell"></th></tr>
  ${dailyData.map(d => {
    const dateObj = new Date(d.date + "T12:00:00");
    const dow = dayNames[dateObj.getDay()];
    const shortDate = d.date.slice(5);
    return `<tr>
    <td>${shortDate} <span class="small">${dow}</span></td>
    <td class="right">${fmt(d.revenue)}</td>
    <td class="right">${d.units}</td>
    <td class="right">${d.txns}</td>
    <td class="bar-cell">${bar(d.revenue, maxDailyRevenue, "#ec4899")}</td>
  </tr>`;
  }).join("")}
</table>
</div>
<div class="insight">
  <strong>Insight:</strong> El mejor dia del mes fue <em>${bestDay.date.slice(5)}</em> con ${fmt(bestDay.revenue)} (${bestDay.units} uds). El dia con menor venta registrada fue <em>${worstDay.date.slice(5)}</em> con ${fmt(worstDay.revenue)}. ${daysWithZero.length > 0 ? `Hubo <strong>${daysWithZero.length} dia(s) sin ninguna venta de helado</strong>: ${daysWithZero.map(d => d.slice(5)).join(", ")}. Esto merece investigacion: podria ser dias de cierre o de bajo trafico general.` : "No hubo dias sin ventas de helado, buena consistencia."} ${secondHalfRevenue > firstHalfRevenue ? `La segunda quincena fue mas fuerte (${fmt(secondHalfRevenue)} vs ${fmt(firstHalfRevenue)}), indicando tendencia positiva.` : `La primera quincena fue mas fuerte (${fmt(firstHalfRevenue)} vs ${fmt(secondHalfRevenue)}), indicando una ligera caida.`}
</div>

<!-- Tendencia Semanal -->
<h2>Tendencia Semanal</h2>
<div class="card">
<table>
  <tr><th>Semana</th><th class="right">Revenue</th><th class="right">Uds</th><th class="right">Txns</th><th class="bar-cell"></th></tr>
  ${weeklyData.map(d => `<tr>
    <td>${d.label}</td>
    <td class="right">${fmt(d.revenue)}</td>
    <td class="right">${d.units}</td>
    <td class="right">${d.txns}</td>
    <td class="bar-cell">${bar(d.revenue, maxWeeklyRevenue, "#06b6d4")}</td>
  </tr>`).join("")}
</table>
</div>
<div class="insight">
  <strong>Insight:</strong> La mejor semana fue la <em>${bestWeek.label}</em> con ${fmt(bestWeek.revenue)}. La mas baja fue la <em>${worstWeek.label}</em> con ${fmt(worstWeek.revenue)}. ${weeklyData.length >= 3 ? `La variacion semanal va de ${fmt(worstWeek.revenue)} a ${fmt(bestWeek.revenue)}, una diferencia de ${((bestWeek.revenue / worstWeek.revenue - 1) * 100).toFixed(0)}%.` : ""} Esta variabilidad sugiere que factores externos (clima, peliculas en cartelera, eventos) impactan las ventas de helados semana a semana.
</div>

<!-- Cross-sell -->
<h2>Cross-Sell: Categorias Companion</h2>
<p class="subtitle" style="margin-top:-8px">En las ${salesWithHelado.length} transacciones con helado, estas son las otras categorias que se compraron junto:</p>
<div class="card">
<table>
  <tr><th>#</th><th>Categoria</th><th class="right">Uds</th><th class="right">Revenue</th><th class="bar-cell"></th></tr>
  ${crossSell.map((c, i) => `<tr>
    <td class="highlight">${i + 1}</td>
    <td>${c.name}</td>
    <td class="right">${c.count}</td>
    <td class="right">${fmt(c.revenue)}</td>
    <td class="bar-cell">${bar(c.count, maxCrossSellCount, "#14b8a6")}</td>
  </tr>`).join("")}
</table>
</div>
<div class="insight">
  <strong>Insight:</strong> ${crossSell.length > 0 ? `La categoria companion #1 es <em>${crossSell[0].name}</em> con ${crossSell[0].count} unidades en transacciones con helado.` : "No hay datos significativos de cross-sell."} Sin embargo, el dato mas relevante es que el <strong>${heladoOnlyPct}% de las transacciones con helado NO incluyen ningun otro producto principal</strong>. Esto significa que la gran mayoria de clientes de helado solo compran helado. La oportunidad de cross-sell es enorme: si se lograra que apenas un 15-20% de esos compradores de "solo helado" agregaran una bebida o unas crispetas, el ticket promedio podria subir significativamente.
</div>

<!-- % Helado del ticket -->
<h2>Helado como % del Ticket Total</h2>
<div class="card">
  <p style="font-size:16px;">En promedio, los helados representan el <span class="highlight" style="font-size:28px;">${avgHeladoPctOfTicket}%</span> del ticket total en transacciones que incluyen helado.</p>
  <p class="small" style="margin-top:8px;">Basado en ${salesWithHelado.length} transacciones. Ticket promedio total con helado: ${fmt(Math.round(avgTotalTicketWithHelado))} vs sin helado: ${fmt(Math.round(avgTotalTicketWithout))}.</p>
</div>
<div class="insight">
  <strong>Insight:</strong> Un ${avgHeladoPctOfTicket}% es excepcionalmente alto, confirmando que la mayoria de las compras de helado son compras <em>standalone</em>. El ticket promedio de una transaccion con helado es ${fmt(Math.round(avgTotalTicketWithHelado))}, ${avgTotalTicketWithHelado < avgTotalTicketWithout ? `significativamente menor que el ticket sin helado de ${fmt(Math.round(avgTotalTicketWithout))}. Esto deprime el ticket promedio general.` : `comparable al ticket sin helado de ${fmt(Math.round(avgTotalTicketWithout))}.`} Para mejorar esta metrica, considerar combos como "Helado + Bebida" o "Postre despues de comida" con descuento.
</div>

<!-- Horas pico comparadas -->
<h2>Horas Pico: Helados vs General</h2>
<div class="grid-2">
  <div class="card">
    <h3 style="color:#f59e0b;margin-bottom:12px;font-size:14px;">TOP 5 HORAS - HELADOS</h3>
    <table>
      <tr><th>Hora</th><th class="right">Revenue</th><th class="right">Txns</th></tr>
      ${topHeladoHours.map(d => `<tr>
        <td>${String(d.hour).padStart(2, "0")}:00</td>
        <td class="right">${fmt(d.heladoRevenue)}</td>
        <td class="right">${d.heladoTxns}</td>
      </tr>`).join("")}
    </table>
  </div>
  <div class="card">
    <h3 style="color:#3b82f6;margin-bottom:12px;font-size:14px;">TOP 5 HORAS - GENERAL</h3>
    <table>
      <tr><th>Hora</th><th class="right">Revenue</th><th class="right">Txns</th></tr>
      ${topGeneralHours.map(d => `<tr>
        <td>${String(d.hour).padStart(2, "0")}:00</td>
        <td class="right">${fmt(d.generalRevenue)}</td>
        <td class="right">${d.generalTxns}</td>
      </tr>`).join("")}
    </table>
  </div>
</div>
<div class="insight">
  <strong>Insight:</strong> ${overlapHours.length > 0 ? `Las horas ${overlapHours.map(h => String(h).padStart(2, "0") + ":00").join(", ")} coinciden como pico tanto para helados como para el negocio general. Esto indica que el flujo general de clientes impulsa las ventas de helado.` : "Las horas pico de helados no coinciden con las horas pico generales."} ${overlapHours.length < 5 ? `Hay horas pico generales donde los helados no aparecen con fuerza, lo que representa una oportunidad de captura: promover helados activamente durante las horas de mayor trafico podria incrementar la penetracion.` : ""}
</div>

<hr class="divider">

<!-- OPORTUNIDADES -->
<h2 style="color:#10b981;">Oportunidades</h2>

<div class="opp-card">
  <h4>1. Combos de helado + bebida/crispeta</h4>
  <p>Con ${heladoOnlyPct}% de transacciones siendo solo helado, hay un potencial enorme para crear combos. Un "Combo Helado": Cono + CoolDrink por $6,000 (vs $7,000 separados) podria incrementar el ticket promedio de ${fmt(Math.round(avgTicketHelado))} a $8,000-10,000 y posicionar helado como acompanante habitual.</p>
</div>

<div class="opp-card">
  <h4>2. Promover Sundae y Sandwich de Helado</h4>
  <p>El Sandwich de helado genera ${fmt(Math.round(mixGroups[3].revenue / (mixGroups[3].units || 1)))} por unidad vs $3,000 de un cono. El Sundae a $9,000 es 3x el precio de un cono. Con solo ${mixGroups[3].units + mixGroups[2].units} unidades combinadas de Sundae+Sandwich vs ${mixGroups[0].units} conos, hay espacio para migrar ventas hacia arriba. Sugerencia: exhibir fotos atractivas de Sundae y Sandwich en la pantalla de cliente, o que el cajero haga upsell activo.</p>
</div>

<div class="opp-card">
  <h4>3. Cubiertas/toppings de helado como upsell</h4>
  <p>Los adicionales de helado (AD. HELADOS) como "Cubierta Galleta Oreo" a $1,000 y "Cubierta Galleta Red Velvet" a $1,000 son un upsell facil de $1,000 adicional por transaccion. Si se aplicara al 30% de las ${salesWithHelado.length} transacciones, serian +${fmt(Math.round(salesWithHelado.length * 0.3 * 1000))} mensuales adicionales con margen muy alto.</p>
</div>

<div class="opp-card">
  <h4>4. Helado como postre post-comida</h4>
  <p>Actualmente las transacciones con helado raramente incluyen comida principal. Crear una promo "Postre" (agregar un cono por $2,000 en cualquier combo de comida) podria capturar a los clientes de Tex-Mex que actualmente no compran helado. ${salesWithoutHelado.length} transacciones al mes son potenciales compradores.</p>
</div>

${avgWeekdayPerDay < avgWeekendPerDay * 0.7 ? `<div class="opp-card">
  <h4>5. Promociones entre semana</h4>
  <p>Con ventas de fin de semana ${((avgWeekendPerDay / avgWeekdayPerDay - 1) * 100).toFixed(0)}% mayores que entre semana, una promo "2x1 Conos" en dias de baja demanda (como ${worstDow.day}) podria equilibrar la demanda y traer trafico adicional.</p>
</div>` : ""}

<hr class="divider">

<!-- ALERTAS -->
<h2 style="color:#ef4444;">Alertas y Problemas Detectados</h2>

<div class="alert-card">
  <h4>Ticket promedio muy bajo</h4>
  <p>El ticket promedio de helado de ${fmt(Math.round(avgTicketHelado))} es considerablemente bajo. Esto se debe a que los conos de $3,000 dominan el mix (${pct(mixGroups[0].units, heladoUnits)} de unidades). El precio promedio por unidad de helado vendida es ${fmt(Math.round(avgPricePerUnit))}. Si no se diversifica el mix, el revenue por transaccion seguira siendo bajo.</p>
</div>

<div class="alert-card">
  <h4>Compras aisladas de helado (${heladoOnlyPct}% solo helado)</h4>
  <p>La gran mayoria de clientes que compran helado no compran nada mas. Esto puede indicar que: (a) son clientes de paso que solo quieren algo rapido, (b) no se les ofrece nada mas, o (c) no perciben el helado como parte de la experiencia del cine. Cualquiera de estas causas puede trabajarse con combos, sugerencia activa del cajero, y ubicacion estrategica del helado.</p>
</div>

${daysWithZero.length > 0 ? `<div class="alert-card">
  <h4>Dias sin ventas de helado</h4>
  <p>Se detectaron ${daysWithZero.length} dia(s) sin ninguna venta de helado: ${daysWithZero.map(d => d.slice(5)).join(", ")}. Verificar si el negocio estuvo cerrado o si hubo algun problema operativo (maquina de helados fuera de servicio, falta de stock).</p>
</div>` : ""}

<div class="alert-card">
  <h4>Producto "Galleta almendras" con posible bajo rendimiento</h4>
  <p>${byProduct["61"] ? `Galleta almendras registro solo ${byProduct["61"].units} unidades y ${fmt(byProduct["61"].revenue)} en revenue.` : "Galleta almendras no registro ventas en febrero."} Evaluar si vale la pena mantenerla en menu o reemplazarla por un sabor mas popular. El espacio en menu tiene costo de oportunidad.</p>
</div>

<hr class="divider">

<!-- CONCLUSIONES -->
<h2 style="color:#3b82f6;">Conclusiones</h2>
<div class="conclusion">
  <p><strong>Helados es una categoria de alto volumen y baja monetizacion.</strong> Con ${heladoUnits} unidades y presencia en ${salesWithHelado.length} transacciones (${pct(salesWithHelado.length, TOTAL_SALES)} del total), tiene excelente penetracion. Pero el revenue de ${fmt(heladoRevenue)} (${heladoPctRevenue.toFixed(1)}% del total) no refleja ese volumen, debido al dominio de conos de bajo precio.</p>

  <p><strong>La oportunidad principal no esta en vender mas helados, sino en vender MEJOR.</strong> Las tres palancas clave son: (1) migrar mix hacia Sundae/Sandwich (+revenue por unidad), (2) activar cross-sell con combos (+items por transaccion), y (3) promover cubiertas/toppings de helado (+upsell incremental).</p>

  <p><strong>Si se lograra un incremento del 30% en ticket promedio de helado</strong> (de ${fmt(Math.round(avgTicketHelado))} a ~${fmt(Math.round(avgTicketHelado * 1.3))}), el revenue mensual subiria de ${fmt(heladoRevenue)} a ~${fmt(Math.round(heladoRevenue * 1.3))}, un incremento de +${fmt(Math.round(heladoRevenue * 0.3))} mensuales. Este objetivo es alcanzable con las medidas propuestas.</p>
</div>

<p style="text-align:center;color:#555;margin-top:40px;font-size:12px;">Generado automaticamente | Datos: Fudo POS | Febrero 2026 | Cine & Tex-Mex</p>

</body>
</html>`;

mkdirSync("/Users/a./Desktop/PRESENTA/FANZINE-app/docs/febrero", { recursive: true });
const outPath = "/Users/a./Desktop/PRESENTA/FANZINE-app/docs/febrero/analisis-helados-feb2026.html";
writeFileSync(outPath, html, "utf-8");
console.log(`Dashboard written to ${outPath}`);
console.log(`\nKPIs:`);
console.log(`  Revenue Helados: ${fmt(heladoRevenue)}`);
console.log(`  % del Total: ${heladoPctRevenue.toFixed(1)}%`);
console.log(`  Unidades: ${heladoUnits}`);
console.log(`  Transacciones con helado: ${salesWithHelado.length}`);
console.log(`  Ticket promedio: ${fmt(Math.round(avgTicketHelado))}`);
console.log(`  Compras solo helado: ${heladoOnlyPct}%`);
console.log(`  Helado como % del ticket: ${avgHeladoPctOfTicket}%`);

execSync(`open "${outPath}"`);
