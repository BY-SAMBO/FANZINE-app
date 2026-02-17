"use client";

import Link from "next/link";

export default function NachosCiclo1HubPage() {
  return (
    <div className="-m-4 lg:-m-8 min-h-screen" style={{ backgroundColor: "#fff", color: "#000" }}>
      {/* Breadcrumb */}
      <div className="px-4 pt-4">
        <nav className="text-xs text-neutral-500">
          <Link href="/lab" className="hover:text-neutral-800">Lab</Link>
          {" / "}
          <Link href="/lab/nachos" className="hover:text-neutral-800">Nachos</Link>
          {" / "}
          <Link href="/lab/nachos/reconstruccion" className="hover:text-neutral-800">Reconstruccion</Link>
          {" / "}
          <span className="text-neutral-800 font-bold">Ciclo 1</span>
        </nav>
      </div>

      {/* Header */}
      <header
        className="text-center py-12 px-4"
        style={{ borderBottom: "3px solid #000" }}
      >
        <h1 className="text-4xl md:text-5xl font-bold tracking-widest" style={{ color: "#D4A017" }}>
          CICLO 1 — EXPLORACIÓN
        </h1>
        <p className="text-neutral-500 text-sm tracking-widest uppercase mt-2 font-bold">
          Feb 2026 &middot; 4 variantes &middot; Carta base &middot; Activo
        </p>
      </header>

      <div className="max-w-6xl mx-auto px-4 pb-16 space-y-12 pt-8">
        {/* Herramientas */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <span className="text-lg">🛠️</span>
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-800">
              HERRAMIENTAS
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              href="/lab/nachos/reconstruccion/ciclo-1/recetas"
              className="no-underline text-inherit block"
              style={{ color: "inherit", textDecoration: "none" }}
            >
              <div
                className="p-5 text-center transition-transform duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5"
                style={{ border: "3px solid #000", boxShadow: "4px 4px 0 #000", backgroundColor: "#fff" }}
              >
                <div className="text-3xl mb-2">📖</div>
                <p className="text-sm font-bold uppercase tracking-wider">Catálogo de Recetas</p>
              </div>
            </Link>
          </div>
        </section>

        {/* Contexto */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <span className="text-lg">📋</span>
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-800">
              CONTEXTO DEL CICLO
            </h2>
          </div>

          <div className="p-5" style={{ border: "3px solid #000", boxShadow: "4px 4px 0 #000" }}>
            <div className="space-y-3 text-sm text-neutral-700">
              <div className="flex items-start gap-2">
                <span className="text-neutral-900 mt-px flex-shrink-0 font-bold">{"\u2192"}</span>
                <span>Primera exploración formal de la carta de nachos</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-neutral-900 mt-px flex-shrink-0 font-bold">{"\u2192"}</span>
                <span>4 variantes base: Birria (favorito), Pollo Chipotle, Pibil y Cheddar (sin proteína)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-neutral-900 mt-px flex-shrink-0 font-bold">{"\u2192"}</span>
                <span>Todas comparten: chips nachos + cheddar fundido + SourCream + crocante</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-neutral-900 mt-px flex-shrink-0 font-bold">{"\u2192"}</span>
                <span>La proteína define la identidad y el precio ($12K–$22K)</span>
              </div>
            </div>
          </div>
        </section>

        {/* Preguntas a resolver */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <span className="text-lg">❓</span>
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-800">
              PREGUNTAS A RESOLVER
            </h2>
          </div>

          <div className="p-5" style={{ border: "3px solid #000", boxShadow: "4px 4px 0 #000" }}>
            <div className="space-y-2">
              {[
                "¿El dip de consomé de birria es suficientemente diferenciador?",
                "¿Guacamole debería ser topping de nachos o solo de perros?",
                "¿Necesitamos una variante con Takis Fuego (como la serie Cheeto en perros)?",
                "¿El Cheddar básico a $12K funciona como entry-level o canibaliza las proteínas?",
                "¿Qué toppings frescos faltan? (¿Pico de gallo? ¿Maíz tierno?)",
              ].map((q) => (
                <div key={q} className="flex items-start gap-2 text-sm text-neutral-700">
                  <span className="text-neutral-400 mt-px flex-shrink-0 font-bold">?</span>
                  <span>{q}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="text-center pt-4" style={{ borderTop: "3px solid #000" }}>
          <Link
            href="/lab/nachos/reconstruccion"
            className="inline-block text-sm font-bold"
            style={{ color: "#D4A017" }}
          >
            {"\u2190"} Volver a Reconstruccion
          </Link>
        </div>
      </div>
    </div>
  );
}
