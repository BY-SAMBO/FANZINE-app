"use client";

import Link from "next/link";
import { useState } from "react";

const NACHOS = [
  {
    name: "NACHOS BIRRIA",
    subtitle: "Res Birria — Favorito de la Casa",
    tagline:
      "Chips crujientes con res birria jugosa, queso cheddar fundido y dip de consomé. El más pedido.",
    emoji: "🥩🧀🔥",
    color: "#8B0000",
    price: "$22.000",
    protein: "Res Birria",
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
    favorite: true,
  },
  {
    name: "NACHOS POLLO CHIPOTLE",
    subtitle: "Pollo Chipotle — Ahumado Picante",
    tagline:
      "Pollo desmenuzado en salsa chipotle sobre chips con cheddar fundido. Incluye dip de SourCream.",
    emoji: "🍗🧀🌶️",
    color: "#C2452D",
    price: "$20.000",
    protein: "Pollo Chipotle",
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
    favorite: false,
  },
  {
    name: "NACHOS PIBIL",
    subtitle: "Cochinita Pibil — Achiote + Encurtida",
    tagline:
      "Cochinita pibil marinada en achiote con cheddar fundido y cebolla encurtida. Incluye dip de SourCream.",
    emoji: "🐷🧀🌴",
    color: "#E07C24",
    price: "$20.000",
    protein: "Cochinita Pibil",
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
    favorite: false,
  },
  {
    name: "NACHOS CHEDDAR",
    subtitle: "Solo Queso — Para Compartir",
    tagline:
      "Chips con dip de queso cheddar fundido. Sin proteína. Ideal para compartir en el partido o la película.",
    emoji: "🧀💥🌿",
    color: "#b8860b",
    price: "$12.000",
    protein: null,
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
    favorite: false,
  },
];

const PILL_COLORS: Record<string, { bg: string; color: string }> = {
  base: { bg: "#8b5a2b", color: "#fff" },
  proteina: { bg: "#c44536", color: "#fff" },
  salsa: { bg: "#e63946", color: "#fff" },
  queso: { bg: "#e9c46a", color: "#000" },
  crunch: { bg: "#ff9f1c", color: "#000" },
  fresco: { bg: "#2a9d8f", color: "#fff" },
};

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string; strikethrough?: boolean }> = {
  activo: { bg: "#2a9d8f", color: "#fff", label: "activo" },
  pendiente: { bg: "#fff", color: "#000", label: "pendiente" },
  retirado: { bg: "#eee", color: "#999", label: "retirado", strikethrough: true },
};

function InventoryCard({
  color,
  title,
  items,
}: {
  color: string;
  title: string;
  items: { name: string; status: "activo" | "pendiente" | "retirado" }[];
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
                color: item.status === "retirado" ? "#999" : "#333",
                padding: "0.4rem 0",
                borderBottom: "1px solid #eee",
              }}
            >
              <span
                style={{
                  fontWeight: 600,
                  textDecoration: s.strikethrough ? "line-through" : "none",
                }}
              >
                {item.name}
              </span>
              <span
                style={{
                  fontSize: "0.6rem",
                  padding: "2px 8px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  border: `2px ${item.status === "pendiente" ? "dashed" : "solid"} #000`,
                  background: s.bg,
                  color: s.color,
                  textDecoration: s.strikethrough ? "line-through" : "none",
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

function NachosToppingsSection() {
  const [open, setOpen] = useState(false);
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
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
        <span style={{ marginLeft: "auto", fontSize: "1.2rem", transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>▼</span>
      </button>
      {open && (
        <div
          className="grid gap-5 mt-4"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}
        >
          <InventoryCard color="#e63946" title="🫙 Salsas" items={[
            { name: "Salsa de Leña (mayo ahumada)", status: "activo" },
            { name: "Salsa de Tomate", status: "activo" },
            { name: "Salsa de Mostaza", status: "activo" },
            { name: "Salsa de Piña", status: "activo" },
            { name: "Salsa de Maíz Dulce", status: "activo" },
            { name: "Guacamole", status: "activo" },
            { name: "SourCream", status: "activo" },
            { name: "Mostaza Inglesa", status: "pendiente" },
          ]} />
          <InventoryCard color="#e9c46a" title="🧀 Quesos" items={[
            { name: "Queso Cheddar", status: "activo" },
          ]} />
          <InventoryCard color="#2a9d8f" title="🌿 Frescos" items={[
            { name: "Cebolla Encurtida", status: "activo" },
            { name: "Jalapeños", status: "activo" },
            { name: "Pepinillos Picados", status: "activo" },
            { name: "Piña Dulce", status: "activo" },
            { name: "Pico de Gallo", status: "activo" },
            { name: "Maíz Tierno", status: "activo" },
          ]} />
          <InventoryCard color="#ff9f1c" title="💥 Crocantes" items={[
            { name: "Cebolla Crispy", status: "activo" },
            { name: "Papas Fosforito", status: "activo" },
            { name: "Takis Fuego", status: "activo" },
          ]} />
        </div>
      )}
    </div>
  );
}

export default function NachosPage() {
  return (
    <div
      className="-m-4 lg:-m-8 min-h-screen"
      style={{ backgroundColor: "#fff", color: "#000", fontFamily: "'Space Grotesk', sans-serif" }}
    >
      {/* Breadcrumb */}
      <div className="px-4 py-3">
        <nav className="flex items-center gap-1 text-xs text-neutral-500">
          <Link href="/lab" className="hover:text-neutral-800 transition-colors">
            Lab
          </Link>
          <span>/</span>
          <span className="text-neutral-800 font-semibold">Nachos</span>
        </nav>
      </div>

      {/* Header */}
      <header
        className="text-center py-12 px-4"
        style={{ borderBottom: "3px solid #000" }}
      >
        <div className="text-5xl mb-3">🧀💥🔥</div>
        <h1
          className="text-4xl md:text-5xl font-bold tracking-widest uppercase"
          style={{ color: "#D4A017" }}
        >
          NACHOS
        </h1>
        <p className="text-neutral-500 text-sm tracking-widest uppercase mt-2 font-bold">
          Chips + Queso Cheddar + Proteina — 4 variantes
        </p>
        <p className="text-neutral-400 text-xs mt-2 max-w-lg mx-auto font-semibold">
          Misma base, cambia la proteina y el precio. Gratinados con cheddar fundido y toppings.
        </p>
      </header>

      {/* Inventario de Toppings */}
      <NachosToppingsSection />

      {/* Iniciativas */}
      <div className="max-w-5xl mx-auto px-4 pb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Link href="/lab/nachos/reconstruccion" className="no-underline block">
            <div
              className="overflow-hidden transition-transform duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5"
              style={{
                backgroundColor: "#fff",
                border: "3px solid #000",
                boxShadow: "4px 4px 0 #000",
              }}
            >
              <div className="h-1.5 w-full" style={{ backgroundColor: "#D4A017" }} />
              <div className="p-6">
                <div className="flex items-start justify-between mb-2">
                  <span
                    className="text-[0.65rem] px-2.5 py-0.5 font-bold uppercase tracking-wider"
                    style={{ backgroundColor: "#2a9d8f", color: "#fff", border: "2px solid #000" }}
                  >
                    activa
                  </span>
                  <span
                    className="text-[0.65rem] px-2.5 py-0.5 font-bold uppercase tracking-wider"
                    style={{ backgroundColor: "#e9c46a", color: "#000", border: "2px solid #000" }}
                  >
                    4 variantes
                  </span>
                </div>
                <h2 className="font-bold text-xl tracking-wide uppercase text-neutral-900 mt-3">
                  Reconstruccion de Carta
                </h2>
                <p className="text-xs text-neutral-500 mt-1 font-semibold">
                  Rediseno completo de la carta de nachos a traves de ciclos de degustacion e iteracion
                </p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
