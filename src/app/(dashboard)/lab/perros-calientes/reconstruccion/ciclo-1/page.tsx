"use client";

import Link from "next/link";

// ── Data ────────────────────────────────────────────────────────────────────

interface VoteEntry {
  name: string;
  votes: number;
}

const RANKING: VoteEntry[] = [
  { name: "Fanzine Clasico", votes: 8 },
  { name: "Fanzine Dorado", votes: 5 },
  { name: "Fanzine Fresco", votes: 4 },
  { name: "Cheeto Tropical", votes: 3 },
  { name: "Chipotle Guac", votes: 3 },
  { name: "Cheeto Cremoso", votes: 2 },
  { name: "Birria Fuego", votes: 2 },
  { name: "Birria Fundido", votes: 2 },
  { name: "Birria Crunch", votes: 1 },
  { name: "Pibil Ahumado", votes: 1 },
  { name: "Pibil Dulce", votes: 1 },
  { name: "Chipotle Cream", votes: 0 },
  { name: "Chipotle Gold", votes: 0 },
  { name: "Pibil Tropical", votes: 0 },
];

const FEEDBACK: { name: string; comments: string[] }[] = [
  {
    name: "Juan Fernandez",
    comments: [
      "Le gusto el Chipotle Guac, pregunto si se podia con mas guacamole",
      "Birria le parecio interesante pero no repitio",
    ],
  },
  {
    name: "Thomas",
    comments: [
      "Fascinado con el Tropical, lo pidio dos veces",
      "Chipotle Guac lo sorprendio",
    ],
  },
  {
    name: "Yardo",
    comments: [
      "Prefirio el Clasico, dijo que era el mas seguro",
      "Le intereso el concepto del Chipotle Guac",
    ],
  },
  {
    name: "Varios invitados",
    comments: [
      "Salsa de lena es lo que hace diferente a Fanzine",
      "Cebolla crispy deberia ir en todos",
      "La pina fue la mayor sorpresa positiva",
      "Queso crema podria funcionar con los Fanzine",
    ],
  },
];

const DECISIONS = [
  "Fanzine Clasico/Dorado/Fresco se parecen mucho - se reduce a 1 Fanzine nuevo (Gold)",
  "Dorado no salio con cebolla caramelizada - no manejar cebolla caramelizada",
  "Chipotle Guac se probo sin pollo - pendiente validar",
  "Las 3 series Pibil con 1 voto c/u pero pina validada independientemente",
];

// ── Page ─────────────────────────────────────────────────────────────────────

export default function Ciclo1HubPage() {
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
          <span className="text-neutral-800 font-bold">Ciclo 1</span>
        </nav>
      </div>

      {/* Header */}
      <header
        className="text-center py-12 px-4"
        style={{ borderBottom: "3px solid #000" }}
      >
        <h1 className="text-4xl md:text-5xl font-bold tracking-widest" style={{ color: "#e63946" }}>
          CICLO 1 — DEGUSTACION
        </h1>
        <p className="text-neutral-500 text-sm tracking-widest uppercase mt-2 font-bold">
          Oct 2025 &middot; 16 ordenes &middot; 14 recetas &middot; Cerrado
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
              href="/lab/perros-calientes/reconstruccion/ciclo-1/recetas"
              className="no-underline text-inherit block"
              style={{ color: "inherit", textDecoration: "none" }}
            >
              <div
                className="p-5 text-center transition-transform duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5"
                style={{ border: "3px solid #000", boxShadow: "4px 4px 0 #000", backgroundColor: "#fff" }}
              >
                <div className="text-3xl mb-2">📖</div>
                <p className="text-sm font-bold uppercase tracking-wider">Catalogo de Recetas</p>
              </div>
            </Link>

            <Link
              href="/lab/perros-calientes/reconstruccion/ciclo-1/degustacion"
              className="no-underline text-inherit block"
              style={{ color: "inherit", textDecoration: "none" }}
            >
              <div
                className="p-5 text-center transition-transform duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5"
                style={{ border: "3px solid #000", boxShadow: "4px 4px 0 #000", backgroundColor: "#fff" }}
              >
                <div className="text-3xl mb-2">🍽️</div>
                <p className="text-sm font-bold uppercase tracking-wider">Sesion de Degustacion</p>
              </div>
            </Link>

            <Link
              href="/lab/perros-calientes/reconstruccion/ciclo-1/degustacion/admin"
              className="no-underline text-inherit block"
              style={{ color: "inherit", textDecoration: "none" }}
            >
              <div
                className="p-5 text-center transition-transform duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5"
                style={{ border: "3px solid #000", boxShadow: "4px 4px 0 #000", backgroundColor: "#fff" }}
              >
                <div className="text-3xl mb-2">⚙️</div>
                <p className="text-sm font-bold uppercase tracking-wider">Admin Degustacion</p>
              </div>
            </Link>
          </div>
        </section>

        {/* Ranking de votos */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <span className="text-lg">🏆</span>
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-800">
              RANKING DE VOTOS
            </h2>
          </div>

          <div className="p-5" style={{ border: "3px solid #000", boxShadow: "4px 4px 0 #000" }}>
            <p className="text-[0.6rem] text-neutral-400 mb-4">
              * Nota: sesgo de posicion UI — los primeros en la lista recibieron mas visibilidad
            </p>

            <div className="space-y-2">
              {RANKING.map((entry, i) => {
                const maxVotes = 8;
                const pct = (entry.votes / maxVotes) * 100;
                return (
                  <div key={entry.name} className="flex items-center gap-3">
                    <span className="text-xs text-neutral-400 w-5 text-right font-bold">{i + 1}</span>
                    <span className="text-sm text-neutral-800 w-36 truncate font-semibold">{entry.name}</span>
                    <div
                      className="flex-1 h-4 overflow-hidden"
                      style={{ border: "2px solid #000" }}
                    >
                      <div
                        className="h-full"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: entry.votes > 0 ? "#e63946" : "transparent",
                        }}
                      />
                    </div>
                    <span className="text-xs text-neutral-500 w-12 font-bold">
                      {entry.votes} {entry.votes === 1 ? "voto" : "votos"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Feedback por invitado */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <span className="text-lg">💬</span>
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-800">
              FEEDBACK POR INVITADO
            </h2>
          </div>

          <div className="p-5" style={{ border: "3px solid #000", boxShadow: "4px 4px 0 #000" }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {FEEDBACK.map((person) => (
                <div key={person.name} className="space-y-2">
                  <p className="text-sm font-bold text-neutral-800">
                    {person.name}
                  </p>
                  {person.comments.map((c) => (
                    <p key={c} className="text-xs text-neutral-600 pl-3" style={{ borderLeft: "3px solid #000" }}>
                      {c}
                    </p>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Decisiones tomadas */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <span className="text-lg">📌</span>
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-800">
              DECISIONES TOMADAS
            </h2>
          </div>

          <div className="p-5" style={{ border: "3px solid #000", boxShadow: "4px 4px 0 #000" }}>
            <div className="space-y-2">
              {DECISIONS.map((d) => (
                <div key={d} className="flex items-start gap-2 text-sm text-neutral-700">
                  <span className="text-neutral-900 mt-px flex-shrink-0 font-bold">{"\u2192"}</span>
                  <span>{d}</span>
                </div>
              ))}
            </div>
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
