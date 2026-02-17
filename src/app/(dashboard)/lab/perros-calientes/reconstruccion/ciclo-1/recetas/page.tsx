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

interface HotDog {
  slug: string;
  name: string;
  subtitle: string;
  tagline: string;
  emoji: string;
  color: string;
  price: string;
  priceStyle?: React.CSSProperties;
  baseBadge: string;
  baseBadgeClass?: "tocino" | "dashed";
  ingredients: Ingredient[];
  meters: Meter[];
}

interface Serie {
  title: string;
  emoji: string;
  color: string;
  borderStyle?: string;
  dogs: HotDog[];
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

/* ────────────────────── HOT DOG DATA ────────────────────── */

const SERIES: Serie[] = [
  {
    title: "SERIE FANZINE \u2014 Perros Insignia",
    emoji: "\u2B50",
    color: "#e63946",
    dogs: [
      {
        slug: "fanzine-clasico",
        name: "PERRO FANZINE CL\u00C1SICO",
        subtitle: "La Casa \u2014 El Insignia",
        tagline: "Triple crema, doble crunch, cero picante. Si no sabes qu\u00E9 pedir, pide este.",
        emoji: "\uD83D\uDD25\uD83C\uDF2D\uD83C\uDFAC",
        color: "#e63946",
        price: "$16.000",
        baseBadge: "Envuelta en Tocino",
        baseBadgeClass: "tocino",
        ingredients: [
          { label: "Tocino", type: "base" },
          { label: "Cheddar", type: "queso" },
          { label: "Salsa de Le\u00F1a", type: "salsa" },
          { label: "SourCream", type: "salsa" },
          { label: "Tomate", type: "salsa" },
          { label: "Cebolla Crispy", type: "crunch" },
          { label: "Papas Fosforito", type: "crunch" },
        ],
        meters: [
          { label: "Umami", value: 5 },
          { label: "Crunch", value: 5 },
        ],
      },
      {
        slug: "fanzine-dorado",
        name: "PERRO FANZINE DORADO",
        subtitle: "Gold Edition \u2014 Dulzura Profunda",
        tagline: "Cebolla caramelizada, ma\u00EDz dulce y mayo ahumada. El m\u00E1s adictivo de la carta.",
        emoji: "\u2728\uD83C\uDF2D\uD83E\uDDC8",
        color: "#d4a017",
        price: "$16.000",
        baseBadge: "Envuelta en Tocino",
        baseBadgeClass: "tocino",
        ingredients: [
          { label: "Tocino", type: "base" },
          { label: "Cheddar", type: "queso" },
          { label: "Salsa de Le\u00F1a", type: "salsa" },
          { label: "Ma\u00EDz Dulce", type: "salsa" },
          { label: "SourCream", type: "salsa" },
          { label: "Cebolla Caramelizada", type: "fresco" },
          { label: "Cebolla Crispy", type: "crunch" },
        ],
        meters: [
          { label: "Umami", value: 5 },
          { label: "Cremoso", value: 5 },
        ],
      },
      {
        slug: "fanzine-fresco",
        name: "PERRO FANZINE FRESCO",
        subtitle: "The Fresh One \u2014 Balance \u00C1cido",
        tagline: "Pepinillos, SourCream y tomate sobre cheddar drizzled. El m\u00E1s balanceado.",
        emoji: "\uD83C\uDF3F\uD83C\uDF2D\uD83C\uDF4B",
        color: "#2a9d8f",
        price: "$16.000",
        baseBadge: "Envuelta en Tocino",
        baseBadgeClass: "tocino",
        ingredients: [
          { label: "Tocino", type: "base" },
          { label: "Cheddar", type: "queso" },
          { label: "Salsa de Le\u00F1a", type: "salsa" },
          { label: "SourCream", type: "salsa" },
          { label: "Tomate", type: "salsa" },
          { label: "Pepinillos", type: "fresco" },
          { label: "Papas Fosforito", type: "crunch" },
        ],
        meters: [
          { label: "Frescura", value: 4 },
          { label: "Umami", value: 5 },
        ],
      },
    ],
  },
  {
    title: "SERIE CHEETO \u2014 Takis Fuego como Protagonista",
    emoji: "\uD83D\uDCA5",
    color: "#f72585",
    dogs: [
      {
        slug: "cheeto-cremoso",
        name: "PERRO CHEETO CREMOSO",
        subtitle: "Crunch vs Crema \u2014 Contraste Perfecto",
        tagline: "Triple capa cremosa (cheddar + SourCream + le\u00F1a) contra Cheetos picantes. Todo existe para que el Cheeto brille.",
        emoji: "\uD83D\uDCA5\uD83E\uDDF4\uD83E\uDDC0",
        color: "#f72585",
        price: "$16.000",
        baseBadge: "Envuelta en Tocino",
        baseBadgeClass: "tocino",
        ingredients: [
          { label: "Tocino", type: "base" },
          { label: "Cheddar", type: "queso" },
          { label: "SourCream", type: "salsa" },
          { label: "Salsa de Le\u00F1a", type: "salsa" },
          { label: "Takis Fuego", type: "crunch" },
        ],
        meters: [
          { label: "Crunch", value: 5 },
          { label: "Cremoso", value: 5 },
        ],
      },
      {
        slug: "cheeto-tropical",
        name: "PERRO CHEETO TROPICAL",
        subtitle: "Picante vs Dulce \u2014 Loop Infinito",
        tagline: "Salsa de pi\u00F1a + Cheetos picantes. Dulce y ardor en un ciclo adictivo que no para. El m\u00E1s inesperado.",
        emoji: "\uD83D\uDCA5\uD83C\uDF4D\uD83D\uDD25",
        color: "#ff6b35",
        price: "$16.000",
        baseBadge: "Envuelta en Tocino",
        baseBadgeClass: "tocino",
        ingredients: [
          { label: "Tocino", type: "base" },
          { label: "Cheddar", type: "queso" },
          { label: "Salsa de Pi\u00F1a", type: "salsa" },
          { label: "SourCream", type: "salsa" },
          { label: "Takis Fuego", type: "crunch" },
        ],
        meters: [
          { label: "Crunch", value: 5 },
          { label: "Picante", value: 4 },
        ],
      },
    ],
  },
  {
    title: "SERIE BIRRIA \u2014 Res Birria",
    emoji: "\uD83E\uDD69",
    color: "#8B0000",
    dogs: [
      {
        slug: "birria-fundido",
        name: "PERRO BIRRIA FUNDIDO",
        subtitle: "Queso + Carne \u2014 Fusi\u00F3n Total",
        tagline: "La quesabirria hecha hot dog. Birria jugosa, cheddar fundido, mayo ahumada y encurtida.",
        emoji: "\uD83E\uDDC0\uD83E\uDD69\uD83D\uDD25",
        color: "#8B0000",
        price: "$18.000",
        baseBadge: "Envuelta en Tocino",
        baseBadgeClass: "tocino",
        ingredients: [
          { label: "Tocino", type: "base" },
          { label: "Res Birria", type: "proteina" },
          { label: "Cheddar", type: "queso" },
          { label: "Salsa de Le\u00F1a", type: "salsa" },
          { label: "SourCream", type: "salsa" },
          { label: "Tomate", type: "salsa" },
          { label: "Cebolla Encurtida", type: "fresco" },
          { label: "Cebolla Crispy", type: "crunch" },
        ],
        meters: [
          { label: "Umami", value: 5 },
          { label: "Cremoso", value: 5 },
        ],
      },
      {
        slug: "birria-crunch",
        name: "PERRO BIRRIA CRUNCH",
        subtitle: "Doble Crunch \u2014 Textura M\u00E1xima",
        tagline: "Birria jugosa con mostaza, cebolla crispy y papas fosforito. Doble crunch sin cheetos.",
        emoji: "\uD83E\uDD69\uD83D\uDCA5\uD83E\uDD54",
        color: "#A52A2A",
        price: "$18.000",
        baseBadge: "Envuelta en Tocino",
        baseBadgeClass: "tocino",
        ingredients: [
          { label: "Tocino", type: "base" },
          { label: "Res Birria", type: "proteina" },
          { label: "Cheddar", type: "queso" },
          { label: "Mostaza", type: "salsa" },
          { label: "Salsa de Le\u00F1a", type: "salsa" },
          { label: "Tomate", type: "salsa" },
          { label: "Cebolla Crispy", type: "crunch" },
          { label: "Papas Fosforito", type: "crunch" },
        ],
        meters: [
          { label: "Crunch", value: 5 },
          { label: "Umami", value: 5 },
        ],
      },
      {
        slug: "birria-fuego",
        name: "PERRO BIRRIA FUEGO",
        subtitle: "Jalape\u00F1o Amplifica \u2014 Para Valientes",
        tagline: "Birria + jalape\u00F1os + SourCream. El fuego del jalape\u00F1o amplifica la birria.",
        emoji: "\uD83E\uDD69\uD83D\uDD25\uD83C\uDF36\uFE0F",
        color: "#FF4500",
        price: "$18.000",
        baseBadge: "Envuelta en Tocino",
        baseBadgeClass: "tocino",
        ingredients: [
          { label: "Tocino", type: "base" },
          { label: "Res Birria", type: "proteina" },
          { label: "Cheddar", type: "queso" },
          { label: "Salsa de Le\u00F1a", type: "salsa" },
          { label: "SourCream", type: "salsa" },
          { label: "Tomate", type: "salsa" },
          { label: "Jalape\u00F1os", type: "fresco" },
          { label: "Cebolla Crispy", type: "crunch" },
        ],
        meters: [
          { label: "Picante", value: 5 },
          { label: "Umami", value: 5 },
        ],
      },
    ],
  },
  {
    title: "SERIE PIBIL \u2014 Cochinita Pibil",
    emoji: "\uD83D\uDC37",
    color: "#E07C24",
    dogs: [
      {
        slug: "pibil-tropical",
        name: "PERRO PIBIL TROPICAL",
        subtitle: "Yucat\u00E1n + Caribe \u2014 Lo Tropical",
        tagline: "Cochinita con salsa de pi\u00F1a, SourCream y encurtida. Un viaje al tr\u00F3pico.",
        emoji: "\uD83C\uDF4D\uD83D\uDC37\uD83C\uDF34",
        color: "#E07C24",
        price: "$18.000",
        baseBadge: "Envuelta en Tocino",
        baseBadgeClass: "tocino",
        ingredients: [
          { label: "Tocino", type: "base" },
          { label: "Cochinita Pibil", type: "proteina" },
          { label: "Salsa de Pi\u00F1a", type: "salsa" },
          { label: "SourCream", type: "salsa" },
          { label: "Salsa de Le\u00F1a", type: "salsa" },
          { label: "Cebolla Encurtida", type: "fresco" },
          { label: "Cebolla Crispy", type: "crunch" },
        ],
        meters: [
          { label: "Frescura", value: 4 },
          { label: "Umami", value: 4 },
        ],
      },
      {
        slug: "pibil-ahumado",
        name: "PERRO PIBIL AHUMADO",
        subtitle: "Triple Humo \u2014 Profundidad M\u00E1xima",
        tagline: "Tocino + le\u00F1a + achiote. Triple humo con cheddar fundido y encurtida.",
        emoji: "\uD83D\uDC37\uD83D\uDCA8\uD83D\uDD25",
        color: "#9B4F2E",
        price: "$18.000",
        baseBadge: "Envuelta en Tocino",
        baseBadgeClass: "tocino",
        ingredients: [
          { label: "Tocino", type: "base" },
          { label: "Cochinita Pibil", type: "proteina" },
          { label: "Cheddar", type: "queso" },
          { label: "Salsa de Le\u00F1a", type: "salsa" },
          { label: "SourCream", type: "salsa" },
          { label: "Tomate", type: "salsa" },
          { label: "Cebolla Encurtida", type: "fresco" },
          { label: "Papas Fosforito", type: "crunch" },
        ],
        meters: [
          { label: "Umami", value: 5 },
          { label: "Cremoso", value: 5 },
        ],
      },
      {
        slug: "pibil-dulce",
        name: "PERRO PIBIL DULCE",
        subtitle: "Ma\u00EDz Dulce \u2014 Dulzura Natural",
        tagline: "Salsa de ma\u00EDz dulce amplifica el achiote. SourCream y encurtida cierran el ciclo.",
        emoji: "\uD83D\uDC37\uD83C\uDF3D\u2728",
        color: "#D4951A",
        price: "$18.000",
        baseBadge: "Envuelta en Tocino",
        baseBadgeClass: "tocino",
        ingredients: [
          { label: "Tocino", type: "base" },
          { label: "Cochinita Pibil", type: "proteina" },
          { label: "Ma\u00EDz Dulce", type: "salsa" },
          { label: "SourCream", type: "salsa" },
          { label: "Salsa de Le\u00F1a", type: "salsa" },
          { label: "Cebolla Encurtida", type: "fresco" },
          { label: "Cebolla Crispy", type: "crunch" },
        ],
        meters: [
          { label: "Cremoso", value: 5 },
          { label: "Umami", value: 4 },
        ],
      },
    ],
  },
  {
    title: "SERIE CHIPOTLE \u2014 Pollo Chipotle",
    emoji: "\uD83C\uDF57",
    color: "#C2452D",
    dogs: [
      {
        slug: "chipotle-cream",
        name: "PERRO CHIPOTLE CREAM",
        subtitle: "Cremoso vs Picante \u2014 Contrastes",
        tagline: "Triple crema: SourCream + guacamole + mayo ahumada calman el fuego chipotle.",
        emoji: "\uD83C\uDF57\uD83E\uDDF4\uD83D\uDD25",
        color: "#C2452D",
        price: "$18.000",
        baseBadge: "Envuelta en Tocino",
        baseBadgeClass: "tocino",
        ingredients: [
          { label: "Tocino", type: "base" },
          { label: "Pollo Chipotle", type: "proteina" },
          { label: "SourCream", type: "salsa" },
          { label: "Guacamole", type: "salsa" },
          { label: "Salsa de Le\u00F1a", type: "salsa" },
          { label: "Cebolla Crispy", type: "crunch" },
        ],
        meters: [
          { label: "Cremoso", value: 5 },
          { label: "Umami", value: 4 },
        ],
      },
      {
        slug: "chipotle-gold",
        name: "PERRO CHIPOTLE GOLD",
        subtitle: "Triple Humo \u2014 El Sofisticado",
        tagline: "Tocino + chipotle + mayo ahumada = triple humo. Mostaza y tomate cortan la riqueza.",
        emoji: "\uD83C\uDF57\uD83E\uDD47\uD83D\uDCA8",
        color: "#B8860B",
        price: "$18.000",
        baseBadge: "Envuelta en Tocino",
        baseBadgeClass: "tocino",
        ingredients: [
          { label: "Tocino", type: "base" },
          { label: "Pollo Chipotle", type: "proteina" },
          { label: "Cheddar", type: "queso" },
          { label: "Salsa de Le\u00F1a", type: "salsa" },
          { label: "Mostaza", type: "salsa" },
          { label: "Tomate", type: "salsa" },
          { label: "Cebolla Crispy", type: "crunch" },
        ],
        meters: [
          { label: "Umami", value: 5 },
          { label: "Cremoso", value: 4 },
        ],
      },
      {
        slug: "chipotle-guac",
        name: "PERRO CHIPOTLE GUAC",
        subtitle: "M\u00E9xico Puro \u2014 Doble Fuego",
        tagline: "Chipotle + guacamole + jalape\u00F1os. Doble fuego, cremosidad verde.",
        emoji: "\uD83C\uDF57\uD83E\uDD51\uD83C\uDF36\uFE0F",
        color: "#556B2F",
        price: "$18.000",
        baseBadge: "Envuelta en Tocino",
        baseBadgeClass: "tocino",
        ingredients: [
          { label: "Tocino", type: "base" },
          { label: "Pollo Chipotle", type: "proteina" },
          { label: "Guacamole", type: "salsa" },
          { label: "SourCream", type: "salsa" },
          { label: "Tomate", type: "salsa" },
          { label: "Jalape\u00F1os", type: "fresco" },
          { label: "Papas Fosforito", type: "crunch" },
        ],
        meters: [
          { label: "Picante", value: 4 },
          { label: "Cremoso", value: 4 },
        ],
      },
    ],
  },
  {
    title: "PRUEBAS DE VALIDACI\u00D3N \u2014 Mostaza Inglesa (Pendiente)",
    emoji: "\uD83D\uDD2C",
    color: "#e9c46a",
    borderStyle: "dashed",
    dogs: [
      {
        slug: "prueba-mostaza-estrella",
        name: "PRUEBA #1",
        subtitle: "Mostaza como Estrella",
        tagline: "Sentir la mostaza inglesa como protagonista. Tocino + tomate + cheddar + mostaza inglesa generosa.",
        emoji: "\uD83D\uDD2C\uD83C\uDF2D\u2B50",
        color: "#e9c46a",
        price: "EXPERIMENTAL",
        priceStyle: { color: "#b8860b", fontSize: "1rem" },
        baseBadge: "Validar sabor",
        baseBadgeClass: "dashed",
        ingredients: [
          { label: "Tocino", type: "base" },
          { label: "Tomate", type: "salsa" },
          { label: "Cheddar", type: "queso" },
          { label: "Mostaza Inglesa", type: "queso" },
          { label: "Cebolla Crispy", type: "crunch" },
        ],
        meters: [{ label: "Picante", value: 4 }],
      },
      {
        slug: "prueba-mostaza-grasa",
        name: "PRUEBA #2",
        subtitle: "Mostaza Cortando Grasa",
        tagline: "\u00BFPuede ser el fresco agresivo? Tocino + birria + cheddar + mostaza. M\u00E1xima grasa, a ver si la corta.",
        emoji: "\uD83D\uDD2C\uD83E\uDD69\uD83E\uDDC8",
        color: "#d4a843",
        price: "EXPERIMENTAL",
        priceStyle: { color: "#b8860b", fontSize: "1rem" },
        baseBadge: "Validar fresco",
        baseBadgeClass: "dashed",
        ingredients: [
          { label: "Tocino", type: "base" },
          { label: "Res Birria", type: "proteina" },
          { label: "Cheddar", type: "queso" },
          { label: "Mostaza Inglesa", type: "queso" },
          { label: "Cebolla Crispy", type: "crunch" },
        ],
        meters: [{ label: "Umami", value: 5 }],
      },
      {
        slug: "prueba-mostaza-doble-picante",
        name: "PRUEBA #3",
        subtitle: "Doble Picante (Nariz + Lengua)",
        tagline: "Mostaza inglesa (nariz) + jalape\u00F1os (lengua). \u00BFSe suman o se estorban?",
        emoji: "\uD83D\uDD2C\uD83C\uDF36\uFE0F\uD83D\uDD25",
        color: "#b8860b",
        price: "EXPERIMENTAL",
        priceStyle: { color: "#b8860b", fontSize: "1rem" },
        baseBadge: "Validar combo",
        baseBadgeClass: "dashed",
        ingredients: [
          { label: "Tocino", type: "base" },
          { label: "Cheddar", type: "queso" },
          { label: "Mostaza Inglesa", type: "queso" },
          { label: "Jalape\u00F1os", type: "fresco" },
          { label: "Papas Fosforito", type: "crunch" },
        ],
        meters: [{ label: "Picante", value: 5 }],
      },
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
            title="🌭 Bases"
            items={[
              { name: "Salchicha Americana", status: "activo" },
              { name: "Salchicha en Tocino", status: "activo" },
              { name: "Pan Brioche", status: "activo" },
            ]}
          />
          <InventoryCard
            color="#c44536"
            title="🥩 Prote\u00EDnas"
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
              { name: "Salsa de Le\u00F1a (mayo ahumada)", status: "activo" },
              { name: "Salsa de Tomate", status: "activo" },
              { name: "Salsa de Mostaza", status: "activo" },
              { name: "Salsa de Pi\u00F1a", status: "activo" },
              { name: "Salsa de Ma\u00EDz Dulce", status: "activo" },
              { name: "Guacamole", status: "activo" },
              { name: "SourCream", status: "activo" },
              { name: "Mostaza Inglesa", status: "pendiente" },
            ]}
          />
          <InventoryCard
            color="#e9c46a"
            title="🧀 Quesos"
            items={[{ name: "Queso Cheddar", status: "activo" }]}
          />
          <InventoryCard
            color="#2a9d8f"
            title="🌿 Frescos"
            items={[
              { name: "Cebolla Encurtida", status: "activo" },
              { name: "Jalape\u00F1os", status: "activo" },
              { name: "Pepinillos Picados", status: "activo" },
              { name: "Pi\u00F1a Dulce", status: "activo" },
              { name: "Pico de Gallo", status: "activo" },
              { name: "Ma\u00EDz Tierno", status: "activo" },
            ]}
          />
          <InventoryCard
            color="#ff9f1c"
            title="💥 Crocantes"
            items={[
              { name: "Cebolla Crispy", status: "activo" },
              { name: "Papas Fosforito", status: "activo" },
              { name: "Takis Fuego", status: "activo" },
            ]}
          />
        </div>
      )}
    </div>
  );
}

function HotDogCard({ dog }: { dog: HotDog }) {
  return (
    <Link
      href={`/lab/perros-calientes/reconstruccion/ciclo-1/recetas/${dog.slug}`}
      style={
        {
          "--accent": dog.color,
          backgroundColor: "#fff",
          border: "3px solid #000",
          boxShadow: "4px 4px 0 #000",
          overflow: "hidden",
          cursor: "pointer",
          textDecoration: "none",
          color: "inherit",
          display: "block",
          position: "relative",
          transition: "transform 0.15s ease, box-shadow 0.15s ease",
        } as React.CSSProperties
      }
      className="hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#000]"
    >
      <div style={{ height: 6, width: "100%", background: dog.color }} />
      <span
        style={{
          position: "absolute",
          top: "1rem",
          right: "1rem",
          fontSize: "1.2rem",
          color: "#000",
          fontWeight: 700,
        }}
      >
        →
      </span>
      <div style={{ padding: "1.5rem" }}>
        <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>{dog.emoji}</div>
        <h2
          style={{
            fontSize: "1.6rem",
            fontWeight: 700,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            color: dog.name.startsWith("PRUEBA") ? "#b8860b" : dog.color,
            marginBottom: "0.25rem",
          }}
        >
          {dog.name}
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
          {dog.subtitle}
        </p>
        <p
          style={{
            fontSize: "0.9rem",
            color: "#333",
            lineHeight: 1.5,
            marginBottom: "1.25rem",
          }}
        >
          {dog.tagline}
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
          {dog.ingredients.map((ing) => {
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
          {dog.meters.map((m) => (
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
              <Dots value={m.value} accent={dog.color} />
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
              color: dog.color,
              ...(dog.priceStyle ?? {}),
            }}
          >
            {dog.price}
          </span>
          <span
            style={{
              fontSize: "0.65rem",
              padding: "0.2rem 0.6rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              border:
                dog.baseBadgeClass === "dashed"
                  ? "2px dashed #000"
                  : "2px solid #000",
              background:
                dog.baseBadgeClass === "tocino" ? "#c44536" : "#fff",
              color:
                dog.baseBadgeClass === "tocino" ? "#fff" : "#000",
            }}
          >
            {dog.baseBadge}
          </span>
        </div>
      </div>
    </Link>
  );
}

/* ────────────────────── PAGE ────────────────────── */

export default function Ciclo1RecetasPage() {
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
            href="/lab/perros-calientes"
            className="hover:text-neutral-800 transition-colors"
          >
            Perros Calientes
          </Link>
          <span>/</span>
          <Link
            href="/lab/perros-calientes/reconstruccion"
            className="hover:text-neutral-800 transition-colors"
          >
            Reconstruccion
          </Link>
          <span>/</span>
          <Link
            href="/lab/perros-calientes/reconstruccion/ciclo-1"
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
          🌭🎬🔥
        </div>
        <h1
          style={{
            fontSize: "clamp(3rem, 8vw, 6rem)",
            color: "#e63946",
            lineHeight: 1,
            fontWeight: 700,
            letterSpacing: "0.02em",
            textTransform: "uppercase",
          }}
        >
          FANZINE HOT DOGS
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
          Carta Insignia &mdash; Cine &amp; Tex-Mex
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
          15 perros calientes de autor. 3 insignia + 2 serie cheeto + 9 variantes
          con prote&iacute;na. Palatabilidad m&aacute;xima.
        </p>
      </section>

      {/* Toppings Inventory */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "2rem 1.5rem" }}>
        <ToppingsSection />
      </section>

      {/* Series sections */}
      {SERIES.map((serie) => (
        <section
          key={serie.title}
          style={{ maxWidth: 1200, margin: "0 auto", padding: "2rem 1.5rem" }}
        >
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
              border: serie.borderStyle
                ? "3px dashed #000"
                : "3px solid #000",
              borderLeft: `6px solid ${serie.color}`,
              borderLeftStyle: "solid",
              boxShadow: "4px 4px 0 #000",
              background: "#fff",
              color: serie.borderStyle ? "#000" : serie.color,
            }}
          >
            <span style={{ fontSize: "1.3rem" }}>{serie.emoji}</span>
            {serie.title}
          </div>

          <div
            className="grid gap-6 mb-10"
            style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}
          >
            {serie.dogs.map((dog) => (
              <HotDogCard key={dog.slug} dog={dog} />
            ))}
          </div>
        </section>
      ))}

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
                proteina: "Prote\u00EDna",
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
          15 perros insignia &middot; 3 pruebas &middot; 0 toppings libres &middot;
          100% calidad garantizada
        </p>
        <Link
          href="/lab/perros-calientes/reconstruccion/ciclo-1"
          style={{
            display: "inline-block",
            marginTop: "1rem",
            color: "#e63946",
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
