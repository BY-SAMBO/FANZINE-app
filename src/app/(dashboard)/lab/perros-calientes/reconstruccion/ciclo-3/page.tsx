"use client";

import Link from "next/link";

// ── Types ───────────────────────────────────────────────────────────────────

type PillType = "base" | "salsa" | "queso" | "crunch" | "fresco" | "proteina";

interface Ingredient {
  name: string;
  type: PillType;
}

interface TechSpec {
  label: string;
  value: string;
}

interface Recipe {
  name: string;
  emoji: string;
  color: string;
  ingredients: Ingredient[];
  techSpecs: TechSpec[];
  notes: string;
  landingUrl?: string;
}

// ── Clasico Data ────────────────────────────────────────────────────────────

interface ClasicoCombo {
  name: string;
  emoji: string;
  color: string;
  tagline: string;
  base: Ingredient[];
  picks: string[];
}

const SHARED_PICKS = ["Pepinillos", "Jalapeños", "Maíz Tierno", "Cebolla Encurtida", "Queso Cheddar"];

const CLASICO_COMBOS: ClasicoCombo[] = [
  {
    name: "Zinema",
    emoji: "🎬🌭",
    color: "#1a1a2e",
    tagline: "Ahumado · Salado · Crocante",
    base: [
      { name: "Pan Brioche", type: "base" },
      { name: "Papas (base)", type: "crunch" },
      { name: "Salchicha", type: "base" },
      { name: "Salsa Leña", type: "salsa" },
      { name: "Papas (arriba)", type: "crunch" },
    ],
    picks: SHARED_PICKS,
  },
  {
    name: "Hawaiano",
    emoji: "🍍🌭",
    color: "#ff6b35",
    tagline: "Dulce · Fresco · Crocante",
    base: [
      { name: "Pan Brioche", type: "base" },
      { name: "Papas (base)", type: "crunch" },
      { name: "Salchicha", type: "base" },
      { name: "Salsa de Piña", type: "salsa" },
      { name: "Cebolla Crispy", type: "crunch" },
    ],
    picks: SHARED_PICKS,
  },
];

// ── Especiales Data ─────────────────────────────────────────────────────────

const CANDIDATES: Recipe[] = [
  {
    name: "Fanzine Gold",
    emoji: "✨🌭🥇",
    color: "#B8860B",
    landingUrl: "/lab/perros-calientes/reconstruccion/ciclo-3/recetas/c3-fanzine-gold",
    ingredients: [
      { name: "Pan Brioche", type: "base" },
      { name: "Crocante Base", type: "crunch" },
      { name: "Queso Crema ~50g", type: "queso" },
      { name: "Salchicha", type: "base" },
      { name: "Salsa Gold + Leña", type: "salsa" },
      { name: "Cebolla Crispy", type: "crunch" },
      { name: "Tocineta Picada", type: "base" },
      { name: "Fresco: Pepinillos / Jalapeños / Piña", type: "fresco" },
    ],
    techSpecs: [
      { label: "Queso", value: "Crema ~50g, cuchillo, mitad para arriba (visible)" },
      { label: "Tocineta", value: "Picada encima (no envuelta)" },
      { label: "Glaseado", value: "Gold + leña sobre salchicha ya montada en el pan" },
      { label: "Drizzle", value: "Solo Gold, pase final que se extiende hasta el pan" },
      { label: "Fresco", value: "A elegir: pepinillos, jalapeños o piña" },
      { label: "Estructura", value: "Crocante base debajo de salchicha (estándar C3)" },
    ],
    notes: "Inspirado en el Seattle hot dog. Salchicha se monta sin glasear, se glasea con Gold + leña en el pan. Drizzle final solo Gold hasta el pan.",
  },
  {
    name: "Tropical Fuego",
    emoji: "🍍🌭🔥",
    color: "#ff6b35",
    landingUrl: "/lab/perros-calientes/reconstruccion/ciclo-3/recetas/c3-tropical-fuego",
    ingredients: [
      { name: "Pan Brioche", type: "base" },
      { name: "Punch: Takis★ / Jalapeños / Cebolla Encurtida", type: "crunch" },
      { name: "Salchicha", type: "base" },
      { name: "SourCream", type: "salsa" },
      { name: "Salsa de Piña + Leña", type: "salsa" },
      { name: "Piña Dulce en Trozos", type: "fresco" },
    ],
    techSpecs: [
      { label: "Punch", value: "Elige 1: Takis (rec), Jalapeños o Cebolla Encurtida" },
      { label: "Piña salsa", value: "Dos líneas a los laterales de la salchicha" },
      { label: "Leña", value: "Una línea central sobre la salchicha" },
      { label: "Piña trozos", value: "Piña dulce en trozos encima" },
      { label: "SourCream", value: "Sobre la salchicha, balancea dulce y picante" },
      { label: "Salchicha", value: "Sin tocino — deja que piña y el punch dominen" },
    ],
    notes: "Sin cheddar ni tocino. Punch picante a elección: Takis (original), Jalapeños (fresco) o Cebolla Encurtida (ácido). Piña salsa flanquea, leña al centro, piña en trozos remata.",
  },
  {
    name: "Birria Fusión",
    emoji: "🧀🥩🔥",
    color: "#8B0000",
    landingUrl: "/lab/perros-calientes/reconstruccion/ciclo-3/recetas/c3-birria",
    ingredients: [
      { name: "Pan Brioche", type: "base" },
      { name: "Papas Cabello de Ángel", type: "crunch" },
      { name: "Salchicha", type: "base" },
      { name: "Leña + SourCream", type: "salsa" },
      { name: "Fresco: Cebolla / Piña / Jalapeños", type: "fresco" },
      { name: "Res Birria", type: "proteina" },
      { name: "Cebolla Crispy 15g (sobre carne)", type: "crunch" },
      { name: "Cheddar (drizzle)", type: "queso" },
    ],
    techSpecs: [
      { label: "Birria", value: "Res birria encima del fresco elegido" },
      { label: "Cheddar", value: "Drizzle final que se extiende hasta el pan" },
      { label: "Salsas", value: "Leña + SourCream sobre la salchicha" },
      { label: "Fresco", value: "A elegir: cebolla encurtida, piña o jalapeños — corta la riqueza" },
      { label: "Salchicha", value: "Sin tocino — la res birria domina el sabor" },
      { label: "Estructura", value: "Papas cabello de ángel como crocante base (estándar C3)" },
    ],
    notes: "Una birria evolucionada: cheddar drizzle hasta el pan, res birria corona, leña + SourCream dan profundidad. Fresco a elegir corta la riqueza.",
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

function ClasicoComboCard({ combo }: { combo: ClasicoCombo }) {
  return (
    <div
      className="overflow-hidden h-full transition-transform duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5"
      style={{
        backgroundColor: "#fff",
        border: "3px solid #000",
        boxShadow: "4px 4px 0 #000",
      }}
    >
      <div className="h-1.5 w-full" style={{ backgroundColor: combo.color }} />

      <div className="p-5">
        <div className="flex items-center justify-between mb-1">
          <span className="text-2xl">{combo.emoji}</span>
          <div className="flex gap-1.5">
            <span
              className="text-[0.65rem] font-bold px-2 py-1"
              style={{ backgroundColor: "#000", color: "#fff" }}
            >
              2 top · $12.000
            </span>
            <span
              className="text-[0.65rem] font-bold px-2 py-1"
              style={{ backgroundColor: "#e63946", color: "#fff" }}
            >
              3 top · $14.000
            </span>
          </div>
        </div>
        <h3
          className="font-bold text-xl tracking-wide mb-0.5 uppercase"
          style={{ color: combo.color }}
        >
          {combo.name}
        </h3>
        <p className="text-[0.6rem] text-neutral-500 uppercase tracking-wider font-bold mb-4">
          {combo.tagline}
        </p>

        {/* Base */}
        <div className="mb-3">
          <p className="text-[0.6rem] uppercase tracking-wider text-neutral-500 font-bold mb-2">
            Base fija
          </p>
          <div className="flex flex-wrap gap-1.5">
            {combo.base.map((ing) => (
              <Pill key={ing.name} ingredient={ing} />
            ))}
          </div>
        </div>

        {/* Picks */}
        <div className="mb-4">
          <div className="flex items-baseline gap-2 mb-2">
            <p className="text-[0.6rem] uppercase tracking-wider text-neutral-500 font-bold">
              Elige toppings
            </p>
            <span
              className="text-[0.55rem] font-bold px-1.5 py-0.5"
              style={{ backgroundColor: "#000", color: "#fff" }}
            >
              2
            </span>
            <span
              className="text-[0.55rem] font-bold px-1.5 py-0.5"
              style={{ backgroundColor: "#e63946", color: "#fff" }}
            >
              3
            </span>
          </div>
          <p className="text-xs text-neutral-500">
            {combo.picks.join(" · ")}
          </p>
        </div>

        {/* Example */}
        <div className="pt-3" style={{ borderTop: "2px solid #000" }}>
          <p className="text-[0.6rem] text-neutral-400 italic">
            &ldquo;Un {combo.name} con {combo.picks[0].toLowerCase()} y {combo.picks[4].toLowerCase()}&rdquo;
          </p>
        </div>
      </div>
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
        </div>
        <h3
          className="font-bold text-xl tracking-wide mb-1 uppercase"
          style={{ color: recipe.color }}
        >
          {recipe.name}
        </h3>

        {/* Ingredients pills */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {recipe.ingredients.map((ing) => (
            <Pill key={ing.name} ingredient={ing} />
          ))}
        </div>

        {/* Tech specs */}
        {recipe.techSpecs.length > 0 && (
          <div className="mb-4 space-y-1.5">
            <p className="text-[0.6rem] uppercase tracking-wider text-neutral-500 font-bold mb-2">
              Ficha Tecnica
            </p>
            {recipe.techSpecs.map((spec) => (
              <div key={spec.label} className="flex items-baseline gap-2">
                <span className="text-[0.6rem] uppercase tracking-wider text-neutral-900 font-bold w-20 flex-shrink-0">
                  {spec.label}
                </span>
                <span className="text-xs text-neutral-700">{spec.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Notes */}
        {recipe.notes && (
          <div className="pt-3" style={{ borderTop: "2px solid #000" }}>
            <p className="text-[0.6rem] uppercase tracking-wider text-neutral-500 font-bold mb-1.5">
              Notas
            </p>
            <p className="text-xs text-neutral-600">{recipe.notes}</p>
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

export default function Ciclo3HubPage() {
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
          <span className="text-neutral-800 font-bold">Ciclo 3</span>
        </nav>
      </div>

      {/* Header */}
      <header
        className="text-center py-12 px-4"
        style={{ borderBottom: "3px solid #000" }}
      >
        <h1 className="text-4xl md:text-5xl font-bold tracking-widest" style={{ color: "#e63946" }}>
          CICLO 3 — ACOTACION
        </h1>
        <p className="text-neutral-500 text-sm tracking-widest uppercase mt-2 font-bold">
          Feb 2026 &middot; 2 clasicos + {CANDIDATES.length} especial{CANDIDATES.length !== 1 ? "es" : ""} &middot; Activo
        </p>
        <p className="text-neutral-400 text-xs tracking-wider uppercase mt-1 max-w-lg mx-auto">
          Transicion de barra de toppings a perros con estructura
        </p>
      </header>

      <div className="max-w-6xl mx-auto px-4 pb-16 space-y-12 pt-8">
        {/* Perros Clasicos */}
        <section>
          <SectionHeader
            emoji="🌭"
            title="PERROS CLASICOS — $12.000 / $14.000"
            subtitle="2 combos con estructura · 2 toppings $12K · 3 toppings $14K"
          />
          <Link
            href="/lab/perros-calientes/reconstruccion/ciclo-3/recetas/c3-clasico"
            className="no-underline text-inherit block"
            style={{ color: "inherit", textDecoration: "none" }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
              {CLASICO_COMBOS.map((combo) => (
                <ClasicoComboCard key={combo.name} combo={combo} />
              ))}
            </div>
          </Link>
          <p className="text-[0.6rem] text-neutral-400 uppercase tracking-wider font-bold mt-4">
            Salsas libres en estacion &middot; Click para ver landing completa
          </p>
        </section>

        {/* Especiales */}
        <section>
          <SectionHeader
            emoji="🔬"
            title="PERROS ESPECIALES"
            subtitle={CANDIDATES.length > 0 ? `${CANDIDATES.length} receta${CANDIDATES.length !== 1 ? "s" : ""} — precio superior` : "Sin recetas aun"}
          />

          {CANDIDATES.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {CANDIDATES.map((r) => (
                <RecipeCard key={r.name} recipe={r} />
              ))}
            </div>
          ) : (
            <div
              className="p-8 text-center"
              style={{ border: "3px dashed #000" }}
            >
              <div className="text-4xl mb-3">🧪</div>
              <p className="text-sm text-neutral-500 font-semibold">
                Los candidatos se iran agregando conforme se definan.
              </p>
              <p className="text-xs text-neutral-400 mt-2">
                Cada receta incluira ficha tecnica con ingredientes exactos, cantidades y tecnica.
              </p>
            </div>
          )}

          {/* Pill legend */}
          {CANDIDATES.length > 0 && (
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
          )}
        </section>

        {/* Prototipos de Carta */}
        <section>
          <SectionHeader
            emoji="📄"
            title="PROTOTIPOS DE CARTA"
            subtitle="Versiones imprimibles del menu de hot dogs"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { name: "Carta Final", file: "carta", desc: "Menu limpio con toppings y contrastes", color: "#000" },
              { name: "V1 — Poster de Cine", file: "carta-v1", desc: "Oscuro, dramatico, estilo cinematografico", color: "#1a1a2e" },
              { name: "V2 — Minimalista", file: "carta-v2", desc: "Blanco, editorial, tipografia limpia", color: "#666" },
              { name: "V3 — Street Food", file: "carta-v3", desc: "Vibrante, grid, festival callejero", color: "#e63946" },
              { name: "V4 — Solo Zinema", file: "carta-v4", desc: "Zinema $12K 3top / $14K +tocineta, sin Hawaiano", color: "#1a1a2e" },
              { name: "V5 — Dale tu Punch", file: "carta-v5", desc: "Arcade 80s, toppings gamificados, seleccion de poderes", color: "#ff00ff" },
              { name: "V6 — Swiss Brutalist", file: "carta-v6", desc: "Tipografia suiza bold, rojo unico acento, grid geometrico", color: "#e63946" },
              { name: "V7 — Neo-Retro Editorial", file: "carta-v7", desc: "Revista editorial, serif + sans, Memphis sutil", color: "#c1121f" },
              { name: "V8 — VHS Analog", file: "carta-v8", desc: "Estetica VHS limpia, condensada, REC dot, tracking lines", color: "#d00000" },
              { name: "V9 — Constructivista", file: "carta-v9", desc: "Rodchenko meets Brody, diagonales rojas, bold geometrico", color: "#9d0208" },
              { name: "V10 — Synthwave Minimal", file: "carta-v10", desc: "Outrun adulto, gradientes red-coral-pink, grid sutil", color: "#ff6b6b" },
              { name: "V11 — Cinema Ticket", file: "carta-v11", desc: "Tickets perforados, film strip, Now Showing marquee", color: "#b5121b" },
              { name: "V12 — Swiss + Synthwave", file: "carta-v12", desc: "Fusion: tipografia V6 + paleta gradiente V10", color: "#DC2626" },
              { name: "V13 — Cartoon Pop", file: "carta-v13", desc: "V12 cartoon: bordes gruesos, sombras duras, speech bubbles, tilts", color: "#FACC15" },
              { name: "V14 — Comic Book Panel", file: "carta-v14", desc: "Paneles comic, gutters negros, hatching, tintes pastel por panel", color: "#DC2626" },
              { name: "V15 — Sticker Bomb", file: "carta-v15", desc: "Stickers flotantes sobre beige, rotaciones, underlines rojos", color: "#0A0A0A" },
              { name: "V16 — Bubble Gum Pop", file: "carta-v16", desc: "Ultra-redondeado, sombras suaves, bordes grises, bubbly", color: "#F87171" },
            ].map((v) => (
              <Link
                key={v.file}
                href={`/lab/perros-calientes/reconstruccion/ciclo-3/recetas/${v.file}`}
                className="no-underline text-inherit block"
                style={{ color: "inherit", textDecoration: "none" }}
              >
                <div
                  className="overflow-hidden transition-transform duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5"
                  style={{
                    border: "3px solid #000",
                    boxShadow: "4px 4px 0 #000",
                    borderTop: `4px solid ${v.color}`,
                    background: "#fff",
                  }}
                >
                  <div className="p-4">
                    <h4 className="font-bold text-sm uppercase tracking-wider mb-1">{v.name}</h4>
                    <p className="text-[0.7rem] text-neutral-500">{v.desc}</p>
                  </div>
                </div>
              </Link>
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
