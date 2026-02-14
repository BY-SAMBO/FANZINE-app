"use client";

import Link from "next/link";

// ── Types ───────────────────────────────────────────────────────────────────

type PillType = "base" | "salsa" | "queso" | "crunch" | "fresco" | "proteina";
type Status = "por-probar" | "validado" | "pendiente";

interface Ingredient {
  name: string;
  type: PillType;
}

interface Recipe {
  name: string;
  emoji: string;
  color: string;
  ingredients: Ingredient[];
  status: Status;
  statusNote: string;
  tasks: string[];
  meters: { label: string; value: number }[];
  landingUrl?: string;
}

// ── Data ────────────────────────────────────────────────────────────────────

const CANDIDATES: Recipe[] = [
  {
    name: "Fanzine Gold",
    emoji: "✨🌭🥇",
    color: "#B8860B",
    landingUrl: "recetas/c2-fanzine-gold",
    ingredients: [
      { name: "Tocineta", type: "base" },
      { name: "Queso Crema", type: "queso" },
      { name: "BBQ Carolina Gold", type: "salsa" },
      { name: "Cebolla Crispy", type: "crunch" },
    ],
    status: "por-probar",
    statusNote: "Sin salsa lena (Carolina Gold ya tiene humo dulce)",
    tasks: ["Nombre nuevo, identidad premium"],
    meters: [
      { label: "Umami", value: 4 },
      { label: "Crunch", value: 3 },
      { label: "Cremosidad", value: 4 },
      { label: "Picante", value: 1 },
      { label: "Frescura", value: 1 },
    ],
  },
  {
    name: "Tropical",
    emoji: "🍍🌭🔥",
    color: "#ff6b35",
    landingUrl: "recetas/c2-tropical",
    ingredients: [
      { name: "Tocineta", type: "base" },
      { name: "Cheddar", type: "queso" },
      { name: "Salsa de Pina", type: "salsa" },
      { name: "SourCream", type: "salsa" },
      { name: "Crunch Picante (TBD)", type: "crunch" },
    ],
    status: "validado",
    statusNote: "Pina validada, crunch por definir",
    tasks: ["Prueba ciega Cheeto vs Takis"],
    meters: [
      { label: "Umami", value: 3 },
      { label: "Crunch", value: 5 },
      { label: "Cremosidad", value: 3 },
      { label: "Picante", value: 4 },
      { label: "Frescura", value: 3 },
    ],
  },
  {
    name: "Birria Fundido",
    emoji: "🧀🥩🔥",
    color: "#8B0000",
    landingUrl: "recetas/c2-birria-fundido",
    ingredients: [
      { name: "Base v1", type: "base" },
      { name: "Res Birria", type: "proteina" },
      { name: "Cheddar", type: "queso" },
      { name: "Cebolla Encurtida", type: "fresco" },
    ],
    status: "pendiente",
    statusNote: "Concepto validado, tecnica pendiente",
    tasks: ['Resolver como lograr que se sienta "fundido"'],
    meters: [
      { label: "Umami", value: 5 },
      { label: "Crunch", value: 2 },
      { label: "Cremosidad", value: 5 },
      { label: "Picante", value: 2 },
      { label: "Frescura", value: 2 },
    ],
  },
  {
    name: "Chipotle Guac",
    emoji: "🥑🌶️🍗",
    color: "#556B2F",
    landingUrl: "recetas/c2-chipotle-guac",
    ingredients: [
      { name: "Guacamole", type: "salsa" },
      { name: "SourCream", type: "salsa" },
      { name: "Tomate", type: "fresco" },
      { name: "Jalapenos", type: "fresco" },
      { name: "Papas Fosforito", type: "crunch" },
      { name: "Tocineta", type: "base" },
      { name: "Proteina TBD", type: "proteina" },
    ],
    status: "pendiente",
    statusNote: "No probado con proteina real",
    tasks: [
      "Llamar a Juan Fernandez, Thomas, Yardo — que les atrajo del concepto",
    ],
    meters: [
      { label: "Umami", value: 3 },
      { label: "Crunch", value: 4 },
      { label: "Cremosidad", value: 4 },
      { label: "Picante", value: 4 },
      { label: "Frescura", value: 3 },
    ],
  },
  {
    name: "Pibil",
    emoji: "🐷🍊🔥",
    color: "#E07C24",
    landingUrl: "recetas/c2-pibil",
    ingredients: [
      { name: "Cochinita Pibil", type: "proteina" },
      { name: "Cebolla Encurtida", type: "fresco" },
      { name: "Base por definir", type: "base" },
    ],
    status: "pendiente",
    statusNote: "Necesita renombre",
    tasks: [
      "Encontrar nombre que comunique sin explicar que es cochinita pibil",
    ],
    meters: [
      { label: "Umami", value: 4 },
      { label: "Crunch", value: 2 },
      { label: "Cremosidad", value: 3 },
      { label: "Picante", value: 2 },
      { label: "Frescura", value: 3 },
    ],
  },
];

const TASKS = [
  "Prueba ciega Cheeto vs Takis",
  "Llamar a quienes pidieron Chipotle Guac (Juan Fernandez, Thomas, Yardo)",
  'Resolver tecnica "fundido" en Birria',
  "Nombre para el Pibil",
  "Probar Chipotle Guac con proteina real",
];

const INSIGHTS = [
  {
    text: "Salsa lena (mayo ahumada) = sabor signature, el diferenciador",
    emoji: "🔥",
  },
  { text: "Cebolla crispy = textura favorita", emoji: "💥" },
  {
    text: "Salsa de pina = gancho claro, el mas memorable",
    emoji: "🍍",
  },
  { text: "Coccion de salchicha = validada", emoji: "✅" },
  { text: "Birria como concepto = atractivo", emoji: "🥩" },
  {
    text: "Cheeto vs Takis = opiniones divididas (se probo con Takis limon fuego)",
    emoji: "🤔",
  },
  {
    text: "Queso crema = nueva posibilidad para las recetas",
    emoji: "🧀",
  },
];

// ── Style constants ─────────────────────────────────────────────────────────

const PILL_BG: Record<PillType, { bg: string; text: string }> = {
  base: { bg: "#8b5a2b", text: "#fff" },
  salsa: { bg: "#e63946", text: "#fff" },
  queso: { bg: "#e9c46a", text: "#000" },
  crunch: { bg: "#ff9f1c", text: "#000" },
  fresco: { bg: "#2a9d8f", text: "#fff" },
  proteina: { bg: "#c44536", text: "#fff" },
};

const STATUS_CFG: Record<Status, { bg: string; border: string; text: string; label: string }> = {
  "por-probar": { bg: "#e9c46a", border: "#000", text: "#000", label: "Por probar" },
  validado: { bg: "#2a9d8f", border: "#000", text: "#fff", label: "Validado" },
  pendiente: { bg: "#fff", border: "#000", text: "#000", label: "Pendiente" },
};

// ── Components ──────────────────────────────────────────────────────────────

function Pill({ ingredient }: { ingredient: Ingredient }) {
  const s = PILL_BG[ingredient.type];
  return (
    <span
      className="inline-block text-[0.65rem] px-2 py-0.5 font-bold uppercase tracking-wide"
      style={{ backgroundColor: s.bg, color: s.text, border: "2px solid #000" }}
    >
      {ingredient.name}
    </span>
  );
}

function StatusBadge({ status }: { status: Status }) {
  const s = STATUS_CFG[status];
  return (
    <span
      className="inline-block text-[0.65rem] px-2.5 py-0.5 font-bold uppercase tracking-wider"
      style={{
        backgroundColor: s.bg,
        color: s.text,
        border: `2px ${status === "pendiente" ? "dashed" : "solid"} ${s.border}`,
      }}
    >
      {s.label}
    </span>
  );
}

function MeterDots({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className="w-2.5 h-2.5"
          style={{
            backgroundColor: i < value ? color : "#fff",
            border: "2px solid #000",
          }}
        />
      ))}
    </div>
  );
}

function RecipeCard({ recipe }: { recipe: Recipe }) {
  const card = (
    <div
      className="overflow-hidden h-full transition-transform duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5"
      style={{
        backgroundColor: "#fff",
        border: "3px solid #000",
        boxShadow: "4px 4px 0 #000",
      }}
    >
      {/* Accent bar */}
      <div className="h-1.5 w-full" style={{ backgroundColor: recipe.color }} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-1">
          <span className="text-2xl">{recipe.emoji}</span>
          <StatusBadge status={recipe.status} />
        </div>
        <h3
          className="font-bold text-xl tracking-wide mb-1 uppercase"
          style={{ color: recipe.color }}
        >
          {recipe.name}
        </h3>
        <p className="text-xs text-neutral-500 mb-4 font-semibold">{recipe.statusNote}</p>

        {/* Ingredients pills */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {recipe.ingredients.map((ing) => (
            <Pill key={ing.name} ingredient={ing} />
          ))}
        </div>

        {/* Meters */}
        <div className="space-y-1.5 mb-4">
          {recipe.meters.map((m) => (
            <div key={m.label} className="flex items-center gap-2">
              <span className="text-[0.6rem] uppercase tracking-wider text-neutral-900 font-bold w-16">
                {m.label}
              </span>
              <MeterDots value={m.value} color={recipe.color} />
            </div>
          ))}
        </div>

        {/* Tasks */}
        {recipe.tasks.length > 0 && (
          <div className="pt-3" style={{ borderTop: "2px solid #000" }}>
            <p className="text-[0.6rem] uppercase tracking-wider text-neutral-500 font-bold mb-1.5">
              Tareas
            </p>
            {recipe.tasks.map((t) => (
              <div key={t} className="flex items-start gap-2 text-xs text-neutral-700">
                <span className="text-neutral-400 mt-px">-</span>
                <span>{t}</span>
              </div>
            ))}
          </div>
        )}

        {/* Landing link indicator */}
        {recipe.landingUrl && (
          <div className="pt-3 mt-3" style={{ borderTop: "2px solid #000" }}>
            <span className="text-[0.7rem] font-bold uppercase tracking-wider" style={{ color: recipe.color }}>
              Ver landing {"\u2192"}
            </span>
          </div>
        )}
      </div>
    </div>
  );

  if (recipe.landingUrl) {
    return (
      <Link
        href={recipe.landingUrl}
        className="no-underline text-inherit block"
        style={{ color: "inherit", textDecoration: "none" }}
      >
        {card}
      </Link>
    );
  }

  return card;
}

function SectionHeader({
  emoji,
  title,
  subtitle,
}: {
  emoji: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <span className="text-lg">{emoji}</span>
      <div>
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-800">
          {title}
        </h2>
        {subtitle && (
          <p className="text-[0.6rem] text-neutral-500 uppercase tracking-wider font-bold">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function Ciclo2HubPage() {
  return (
    <div className="-m-4 lg:-m-8 min-h-screen" style={{ backgroundColor: "#fff", color: "#000" }}>
      {/* Breadcrumb */}
      <div className="px-4 pt-4">
        <nav className="text-xs text-neutral-500">
          <Link href="/lab" className="hover:text-neutral-800">Lab</Link>
          {" / "}
          <Link href="/lab/perros-calientes" className="hover:text-neutral-800">Perros Calientes</Link>
          {" / "}
          <Link href="/lab/perros-calientes/reconstruccion" className="hover:text-neutral-800">Reconstruccion</Link>
          {" / "}
          <span className="text-neutral-800 font-bold">Ciclo 2</span>
        </nav>
      </div>

      {/* Header */}
      <header
        className="text-center py-12 px-4"
        style={{ borderBottom: "3px solid #000" }}
      >
        <h1 className="text-4xl md:text-5xl font-bold tracking-widest" style={{ color: "#e63946" }}>
          CICLO 2 — ITERACION
        </h1>
        <p className="text-neutral-500 text-sm tracking-widest uppercase mt-2 font-bold">
          Dic 2025 &middot; 5 candidatos &middot; Activo
        </p>
      </header>

      <div className="max-w-6xl mx-auto px-4 pb-16 space-y-12 pt-8">
        {/* Candidatos */}
        <section>
          <SectionHeader emoji="🎯" title="CANDIDATOS FINALES" subtitle="5 recetas" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {CANDIDATES.map((r) => (
              <RecipeCard key={r.name} recipe={r} />
            ))}
          </div>

          {/* Pill legend */}
          <div
            className="mt-6 flex flex-wrap gap-2 justify-center p-4"
            style={{ border: "3px solid #000", boxShadow: "4px 4px 0 #000" }}
          >
            {(Object.entries(PILL_BG) as [PillType, { bg: string; text: string }][]).map(([type, s]) => (
              <span
                key={type}
                className="text-[0.6rem] px-2 py-0.5 font-bold uppercase tracking-wide"
                style={{ backgroundColor: s.bg, color: s.text, border: "2px solid #000" }}
              >
                {type}
              </span>
            ))}
          </div>
        </section>

        {/* Tareas pendientes */}
        <section>
          <SectionHeader emoji="📋" title="TAREAS PENDIENTES" />

          <div className="p-5 space-y-3" style={{ border: "3px solid #000", boxShadow: "4px 4px 0 #000" }}>
            {TASKS.map((task) => (
              <label key={task} className="flex items-start gap-3 cursor-pointer group">
                <span
                  className="mt-0.5 w-5 h-5 flex-shrink-0 flex items-center justify-center"
                  style={{ border: "2px solid #000" }}
                >
                  <span className="w-2.5 h-2.5 bg-transparent" />
                </span>
                <span className="text-sm text-neutral-700">{task}</span>
              </label>
            ))}
          </div>
        </section>

        {/* Insights validados */}
        <section>
          <SectionHeader emoji="💡" title="INSIGHTS VALIDADOS" subtitle="Degustacion Ciclo 1" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {INSIGHTS.map((insight) => (
              <div
                key={insight.text}
                className="flex items-start gap-3 p-4"
                style={{ border: "3px solid #000", boxShadow: "4px 4px 0 #000" }}
              >
                <span className="text-xl flex-shrink-0">{insight.emoji}</span>
                <p className="text-sm text-neutral-700">{insight.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <div className="text-center pt-4" style={{ borderTop: "3px solid #000" }}>
          <Link
            href="/lab/perros-calientes/reconstruccion"
            className="inline-block text-sm font-bold"
            style={{ color: "#e63946" }}
          >
            {"\u2190"} Volver a Reconstruccion
          </Link>
        </div>
      </div>
    </div>
  );
}
