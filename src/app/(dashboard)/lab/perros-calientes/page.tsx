"use client";

import Link from "next/link";
import { useState } from "react";

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
        <span style={{ marginLeft: "auto", fontSize: "1.2rem", transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>▼</span>
      </button>
      {open && (
        <div
          className="grid gap-5 mt-4"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}
        >
          <InventoryCard color="#c44536" title="🥩 Proteínas" items={[
            { name: "Res Birria", status: "activo" },
            { name: "Cochinita Pibil", status: "activo" },
            { name: "Pollo Chipotle", status: "activo" },
          ]} />
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

export default function PerrosCalientesPage() {
  return (
    <div
      className="-m-4 lg:-m-8 min-h-screen"
      style={{ backgroundColor: "#fff", color: "#000" }}
    >
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-8 flex items-center gap-1 text-xs text-neutral-500">
          <Link href="/lab" className="hover:text-neutral-800 transition-colors">
            Lab
          </Link>
          <span>/</span>
          <span className="text-neutral-800 font-semibold">Perros Calientes</span>
        </nav>

        <h1
          className="text-3xl md:text-4xl font-bold tracking-widest uppercase mb-2"
          style={{ color: "#e63946" }}
        >
          Perros Calientes
        </h1>
        <p className="text-neutral-500 text-sm font-semibold mb-8">
          Iniciativas activas de desarrollo de carta
        </p>

        {/* Inventario de Toppings */}
        <ToppingsSection />

        {/* Iniciativas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Link
            href="/lab/perros-calientes/reconstruccion"
            className="no-underline block"
          >
            <div
              className="overflow-hidden transition-transform duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5"
              style={{
                backgroundColor: "#fff",
                border: "3px solid #000",
                boxShadow: "4px 4px 0 #000",
              }}
            >
              <div
                className="h-1.5 w-full"
                style={{ backgroundColor: "#e63946" }}
              />
              <div className="p-6">
                <div className="flex items-start justify-between mb-2">
                  <span
                    className="text-[0.65rem] px-2.5 py-0.5 font-bold uppercase tracking-wider"
                    style={{
                      backgroundColor: "#2a9d8f",
                      color: "#fff",
                      border: "2px solid #000",
                    }}
                  >
                    activa
                  </span>
                  <span
                    className="text-[0.65rem] px-2.5 py-0.5 font-bold uppercase tracking-wider"
                    style={{
                      backgroundColor: "#e9c46a",
                      color: "#000",
                      border: "2px solid #000",
                    }}
                  >
                    3 ciclos
                  </span>
                </div>
                <h2 className="font-bold text-xl tracking-wide uppercase text-neutral-900 mt-3">
                  Reconstruccion de Carta
                </h2>
                <p className="text-xs text-neutral-500 mt-1 font-semibold">
                  Rediseno completo de la carta de perros calientes a traves de
                  ciclos de degustacion e iteracion
                </p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
