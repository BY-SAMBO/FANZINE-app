"use client";

import Link from "next/link";
import { useState } from "react";

/* ────────────────────── TYPES ────────────────────── */

type PillType = "base" | "proteina" | "salsa" | "queso" | "crunch" | "fresco";

interface Ingredient {
  label: string;
  type: PillType;
}

interface Meter {
  label: string;
  value: number;
}

interface Nacho {
  slug: string;
  name: string;
  subtitle: string;
  tagline: string;
  emoji: string;
  color: string;
  price: string;
  favorite?: boolean;
  ingredients: Ingredient[];
  meters: Meter[];
}

/* ────────────────────── PILL COLORS ────────────────────── */

const PILL_COLORS: Record<string, { bg: string; color: string }> = {
  base: { bg: "#8b5a2b", color: "#fff" },
  proteina: { bg: "#c44536", color: "#fff" },
  salsa: { bg: "#e63946", color: "#fff" },
  queso: { bg: "#e9c46a", color: "#000" },
  crunch: { bg: "#ff9f1c", color: "#000" },
  fresco: { bg: "#2a9d8f", color: "#fff" },
};

/* ────────────────────── NACHOS DATA ────────────────────── */

const NACHOS: Nacho[] = [
  {
    slug: "nachos-birria",
    name: "NACHOS BIRRIA",
    subtitle: "Res Birria — Favorito de la Casa",
    tagline:
      "Chips crujientes con res birria jugosa, queso cheddar fundido y dip de consomé. El más pedido.",
    emoji: "🥩🧀🔥",
    color: "#8B0000",
    price: "$22.000",
    favorite: true,
    ingredients: [
      { label: "Chips Nachos", type: "base" },
      { label: "Res Birria", type: "proteina" },
      { label: "Cheddar Fundido", type: "queso" },
      { label: "SourCream", type: "salsa" },
      { label: "Jalapeños", type: "fresco" },
      { label: "Cebolla Crispy", type: "crunch" },
    ],
    meters: [
      { label: "Umami", value: 5 },
      { label: "Crunch", value: 5 },
    ],
  },
  {
    slug: "nachos-pollo-chipotle",
    name: "NACHOS POLLO CHIPOTLE",
    subtitle: "Pollo Chipotle — Ahumado Picante",
    tagline:
      "Pollo desmenuzado en salsa chipotle sobre chips con cheddar fundido. Incluye dip de SourCream.",
    emoji: "🍗🧀🌶️",
    color: "#C2452D",
    price: "$20.000",
    ingredients: [
      { label: "Chips Nachos", type: "base" },
      { label: "Pollo Chipotle", type: "proteina" },
      { label: "Cheddar Fundido", type: "queso" },
      { label: "SourCream", type: "salsa" },
      { label: "Jalapeños", type: "fresco" },
      { label: "Cebolla Crispy", type: "crunch" },
    ],
    meters: [
      { label: "Picante", value: 3 },
      { label: "Umami", value: 4 },
    ],
  },
  {
    slug: "nachos-pibil",
    name: "NACHOS PIBIL",
    subtitle: "Cochinita Pibil — Achiote + Encurtida",
    tagline:
      "Cochinita pibil marinada en achiote con cheddar fundido y cebolla encurtida. Incluye dip de SourCream.",
    emoji: "🐷🧀🌴",
    color: "#E07C24",
    price: "$20.000",
    ingredients: [
      { label: "Chips Nachos", type: "base" },
      { label: "Cochinita Pibil", type: "proteina" },
      { label: "Cheddar Fundido", type: "queso" },
      { label: "SourCream", type: "salsa" },
      { label: "Cebolla Encurtida", type: "fresco" },
      { label: "Cebolla Crispy", type: "crunch" },
    ],
    meters: [
      { label: "Umami", value: 4 },
      { label: "Frescura", value: 3 },
    ],
  },
  {
    slug: "nachos-cheddar",
    name: "NACHOS CHEDDAR",
    subtitle: "Solo Queso — Para Compartir",
    tagline:
      "Chips con dip de queso cheddar fundido. Sin proteína. Ideal para compartir en el partido o la película.",
    emoji: "🧀💥🌿",
    color: "#b8860b",
    price: "$12.000",
    ingredients: [
      { label: "Chips Nachos", type: "base" },
      { label: "Cheddar Fundido", type: "queso" },
      { label: "SourCream", type: "salsa" },
      { label: "Jalapeños", type: "fresco" },
      { label: "Cebolla Crispy", type: "crunch" },
    ],
    meters: [
      { label: "Crunch", value: 5 },
      { label: "Cremoso", value: 4 },
    ],
  },
];

/* ────────────────────── COMPONENTS ────────────────────── */

function Dots({ value, accent }: { value: number; accent: string }) {
  return (
    <div style={{ display: "flex", gap: 3 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          style={{
            width: 10,
            height: 10,
            border: "2px solid #000",
            background: i <= value ? accent : "#fff",
          }}
        />
      ))}
    </div>
  );
}

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string; border?: string }> = {
  activo: { bg: "#2a9d8f", color: "#fff", label: "activo" },
  pendiente: { bg: "#fff", color: "#000", label: "pendiente", border: "dashed" },
};

function InventoryCard({
  color,
  title,
  items,
}: {
  color: string;
  title: string;
  items: { name: string; status: "activo" | "pendiente" }[];
}) {
  return (
    <div
      style={{
        background: "#fff",
        border: "3px solid #000",
        boxShadow: "4px 4px 0 #000",
        padding: "1.25rem",
        borderLeft: `6px solid ${color}`,
      }}
    >
      <h3
        style={{
          fontSize: "1rem",
          fontWeight: 700,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          marginBottom: "1rem",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
        }}
      >
        {title}
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {items.map((item) => {
          const s = STATUS_STYLES[item.status];
          return (
            <div
              key={item.name}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: "0.85rem",
                color: "#333",
                padding: "0.4rem 0",
                borderBottom: "1px solid #eee",
              }}
            >
              <span style={{ fontWeight: 600 }}>{item.name}</span>
              <span
                style={{
                  fontSize: "0.6rem",
                  padding: "2px 8px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  border: `2px ${s.border ?? "solid"} #000`,
                  background: s.bg,
                  color: s.color,
                }}
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ToppingsSection() {
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-10">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          padding: "0.75rem 1.25rem",
          width: "100%",
          border: "3px solid #000",
          boxShadow: "4px 4px 0 #000",
          background: "#fff",
          fontSize: "1.1rem",
          fontWeight: 700,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <span style={{ fontSize: "1.3rem" }}>📋</span>
        INVENTARIO DE TOPPINGS
        <span
          style={{
            marginLeft: "auto",
            fontSize: "1.2rem",
            transition: "transform 0.2s",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        >
          ▼
        </span>
      </button>
      {open && (
        <div
          className="grid gap-5 mt-4"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}
        >
          <InventoryCard
            color="#8b5a2b"
            title="🔺 Base"
            items={[
              { name: "Chips Nachos (Totopos)", status: "activo" },
            ]}
          />
          <InventoryCard
            color="#c44536"
            title="🥩 Proteínas"
            items={[
              { name: "Res Birria", status: "activo" },
              { name: "Cochinita Pibil", status: "activo" },
              { name: "Pollo Chipotle", status: "activo" },
            ]}
          />
          <InventoryCard
            color="#e63946"
            title="🫙 Salsas"
            items={[
              { name: "SourCream", status: "activo" },
              { name: "Guacamole", status: "pendiente" },
              { name: "Salsa de Leña", status: "pendiente" },
            ]}
          />
          <InventoryCard
            color="#e9c46a"
            title="🧀 Quesos"
            items={[
              { name: "Cheddar Fundido", status: "activo" },
            ]}
          />
          <InventoryCard
            color="#2a9d8f"
            title="🌿 Frescos"
            items={[
              { name: "Jalapeños", status: "activo" },
              { name: "Cebolla Encurtida", status: "activo" },
              { name: "Pico de Gallo", status: "pendiente" },
              { name: "Maíz Tierno", status: "pendiente" },
            ]}
          />
          <InventoryCard
            color="#ff9f1c"
            title="💥 Crocantes"
            items={[
              { name: "Cebolla Crispy", status: "activo" },
            ]}
          />
        </div>
      )}
    </div>
  );
}

function NachoCard({ nacho }: { nacho: Nacho }) {
  return (
    <div
      style={{
        backgroundColor: "#fff",
        border: "3px solid #000",
        boxShadow: "4px 4px 0 #000",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div style={{ height: 6, width: "100%", background: nacho.color }} />
      {nacho.favorite && (
        <span
          style={{
            position: "absolute",
            top: "1rem",
            right: "1rem",
            fontSize: "0.6rem",
            padding: "2px 8px",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            border: "2px solid #000",
            background: "#D4A017",
            color: "#000",
          }}
        >
          favorito
        </span>
      )}
      <div style={{ padding: "1.5rem" }}>
        <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>{nacho.emoji}</div>
        <h2
          style={{
            fontSize: "1.6rem",
            fontWeight: 700,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            color: nacho.color,
            marginBottom: "0.25rem",
          }}
        >
          {nacho.name}
        </h2>
        <p
          style={{
            fontSize: "0.8rem",
            color: "#666",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            fontWeight: 700,
            marginBottom: "1rem",
          }}
        >
          {nacho.subtitle}
        </p>
        <p
          style={{
            fontSize: "0.9rem",
            color: "#333",
            lineHeight: 1.5,
            marginBottom: "1.25rem",
          }}
        >
          {nacho.tagline}
        </p>

        {/* Ingredient pills */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.4rem",
            marginBottom: "1.25rem",
          }}
        >
          {nacho.ingredients.map((ing) => {
            const c = PILL_COLORS[ing.type] || PILL_COLORS.base;
            return (
              <span
                key={ing.label}
                style={{
                  fontSize: "0.65rem",
                  padding: "0.15rem 0.6rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  border: "2px solid #000",
                  background: c.bg,
                  color: c.color,
                }}
              >
                {ing.label}
              </span>
            );
          })}
        </div>

        {/* Meters */}
        <div
          style={{
            display: "flex",
            gap: "0.75rem",
            flexWrap: "wrap",
            marginBottom: "1rem",
          }}
        >
          {nacho.meters.map((m) => (
            <div
              key={m.label}
              style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}
            >
              <span
                style={{
                  fontSize: "0.65rem",
                  color: "#000",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  width: 55,
                  fontWeight: 700,
                }}
              >
                {m.label}
              </span>
              <Dots value={m.value} accent={nacho.color} />
            </div>
          ))}
        </div>

        {/* Card footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: "1rem",
            borderTop: "2px solid #000",
          }}
        >
          <span
            style={{
              fontSize: "1.4rem",
              fontWeight: 700,
              letterSpacing: "0.05em",
              color: nacho.color,
            }}
          >
            {nacho.price}
          </span>
          <span
            style={{
              fontSize: "0.65rem",
              padding: "0.2rem 0.6rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              border: "2px solid #000",
              background: "#8b5a2b",
              color: "#fff",
            }}
          >
            Chips + Cheddar
          </span>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────── PAGE ────────────────────── */

export default function NachosCiclo1RecetasPage() {
  return (
    <div
      className="-m-4 lg:-m-8 min-h-screen"
      style={{ backgroundColor: "#fff", color: "#000" }}
    >
      {/* Breadcrumb */}
      <div className="px-4 py-3">
        <nav className="flex items-center gap-1 text-xs text-neutral-500">
          <Link href="/lab" className="hover:text-neutral-800 transition-colors">
            Lab
          </Link>
          <span>/</span>
          <Link
            href="/lab/nachos"
            className="hover:text-neutral-800 transition-colors"
          >
            Nachos
          </Link>
          <span>/</span>
          <Link
            href="/lab/nachos/reconstruccion"
            className="hover:text-neutral-800 transition-colors"
          >
            Reconstruccion
          </Link>
          <span>/</span>
          <Link
            href="/lab/nachos/reconstruccion/ciclo-1"
            className="hover:text-neutral-800 transition-colors"
          >
            Ciclo 1
          </Link>
          <span>/</span>
          <span className="text-neutral-800 font-semibold">Recetas</span>
        </nav>
      </div>

      {/* Hero */}
      <section
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "2rem",
          background: "#fff",
        }}
      >
        <div style={{ fontSize: "5rem", marginBottom: "1rem", lineHeight: 1.2 }}>
          🧀💥🔥
        </div>
        <h1
          style={{
            fontSize: "clamp(3rem, 8vw, 6rem)",
            color: "#D4A017",
            lineHeight: 1,
            fontWeight: 700,
            letterSpacing: "0.02em",
            textTransform: "uppercase",
          }}
        >
          FANZINE NACHOS
        </h1>
        <p
          style={{
            fontSize: "clamp(1rem, 3vw, 1.3rem)",
            color: "#666",
            marginTop: "0.5rem",
            letterSpacing: "0.15em",
            fontWeight: 700,
            textTransform: "uppercase",
          }}
        >
          Carta Nachos &mdash; Cine &amp; Tex-Mex
        </p>
        <p
          style={{
            fontSize: "1rem",
            color: "#333",
            marginTop: "1rem",
            maxWidth: 600,
            fontWeight: 600,
          }}
        >
          4 variantes de nachos gratinados. Chips + cheddar fundido + proteína.
          De $12K a $22K.
        </p>
      </section>

      {/* Toppings Inventory */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "2rem 1.5rem" }}>
        <ToppingsSection />
      </section>

      {/* Nachos grid */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "2rem 1.5rem" }}>
        <div
          style={{
            fontSize: "1.1rem",
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            padding: "0.75rem 1.25rem",
            marginBottom: "1.5rem",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            border: "3px solid #000",
            borderLeft: "6px solid #D4A017",
            boxShadow: "4px 4px 0 #000",
            background: "#fff",
            color: "#D4A017",
          }}
        >
          <span style={{ fontSize: "1.3rem" }}>🧀</span>
          VARIANTES DE NACHOS — Ciclo 1
        </div>

        <div
          className="grid gap-6 mb-10"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}
        >
          {NACHOS.map((nacho) => (
            <NachoCard key={nacho.slug} nacho={nacho} />
          ))}
        </div>
      </section>

      {/* Legend */}
      <section style={{ maxWidth: 800, margin: "0 auto", padding: "0 1.5rem 3rem" }}>
        <div
          style={{
            border: "3px solid #000",
            boxShadow: "4px 4px 0 #000",
            padding: "1.5rem",
            background: "#fff",
            display: "flex",
            flexWrap: "wrap",
            gap: "0.5rem",
            justifyContent: "center",
          }}
        >
          {(["base", "proteina", "salsa", "queso", "crunch", "fresco"] as const).map(
            (type) => {
              const c = PILL_COLORS[type];
              const labels: Record<string, string> = {
                base: "Base",
                proteina: "Proteína",
                salsa: "Salsa",
                queso: "Queso",
                crunch: "Crunch",
                fresco: "Fresco",
              };
              return (
                <span
                  key={type}
                  style={{
                    fontSize: "0.65rem",
                    padding: "0.15rem 0.6rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    border: "2px solid #000",
                    background: c.bg,
                    color: c.color,
                  }}
                >
                  {labels[type]}
                </span>
              );
            }
          )}
          <span
            style={{
              color: "#666",
              fontSize: "0.8rem",
              fontWeight: 700,
              width: "100%",
              textAlign: "center",
              marginTop: "0.5rem",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            Leyenda de ingredientes
          </span>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          textAlign: "center",
          padding: "3rem 1.5rem",
          borderTop: "3px solid #000",
        }}
      >
        <div
          style={{
            fontSize: "1.6rem",
            fontWeight: 700,
            color: "#000",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            marginBottom: "0.25rem",
          }}
        >
          FANZINE
        </div>
        <p style={{ color: "#666", fontSize: "0.85rem" }}>
          Cine &amp; Tex-Mex &mdash; Bogot&aacute;, Colombia
        </p>
        <p style={{ marginTop: "0.5rem", color: "#999", fontSize: "0.8rem" }}>
          4 variantes de nachos &middot; 3 prote&iacute;nas &middot; 1 base cheddar &middot;
          Gratinados al horno
        </p>
        <Link
          href="/lab/nachos/reconstruccion/ciclo-1"
          style={{
            display: "inline-block",
            marginTop: "1rem",
            color: "#D4A017",
            textDecoration: "none",
            fontWeight: 700,
            fontSize: "0.9rem",
          }}
          className="hover:!text-black"
        >
          LAB Gastron&oacute;mico &rarr;
        </Link>
      </footer>
    </div>
  );
}
