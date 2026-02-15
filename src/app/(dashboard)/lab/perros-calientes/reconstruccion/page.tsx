import Link from "next/link";

export default function ReconstruccionPage() {
  return (
    <div
      className="-m-4 lg:-m-8 min-h-screen"
      style={{ backgroundColor: "#fff", color: "#000" }}
    >
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-8 flex items-center gap-1 text-xs text-neutral-500">
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
          <span className="text-neutral-800 font-semibold">Reconstruccion</span>
        </nav>

        <h1
          className="text-3xl md:text-4xl font-bold tracking-widest uppercase mb-2"
          style={{ color: "#e63946" }}
        >
          Reconstruccion de Carta
        </h1>
        <p className="text-neutral-500 text-sm font-semibold mb-8">
          Ciclos de desarrollo y validacion
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Ciclo 1 */}
          <Link
            href="/lab/perros-calientes/reconstruccion/ciclo-1"
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
                style={{ backgroundColor: "#8b5a2b" }}
              />
              <div className="p-6">
                <div className="flex items-start justify-between mb-2">
                  <span
                    className="text-[0.65rem] px-2.5 py-0.5 font-bold uppercase tracking-wider"
                    style={{
                      backgroundColor: "#000",
                      color: "#fff",
                      border: "2px solid #000",
                    }}
                  >
                    cerrado
                  </span>
                </div>
                <h2 className="font-bold text-xl tracking-wide uppercase text-neutral-900 mt-3">
                  Ciclo 1 — Degustacion
                </h2>
                <p className="text-xs text-neutral-400 font-semibold mb-3">
                  Oct 2025
                </p>
                <p className="text-xs text-neutral-500 font-semibold">
                  16 ordenes &middot; 14 recetas
                </p>
              </div>
            </div>
          </Link>

          {/* Ciclo 2 */}
          <Link
            href="/lab/perros-calientes/reconstruccion/ciclo-2"
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
                      backgroundColor: "#000",
                      color: "#fff",
                      border: "2px solid #000",
                    }}
                  >
                    cerrado
                  </span>
                </div>
                <h2 className="font-bold text-xl tracking-wide uppercase text-neutral-900 mt-3">
                  Ciclo 2 — Iteracion
                </h2>
                <p className="text-xs text-neutral-400 font-semibold mb-3">
                  Dic 2025
                </p>
                <p className="text-xs text-neutral-500 font-semibold">
                  5 candidatos
                </p>
              </div>
            </div>
          </Link>

          {/* Ciclo 3 */}
          <Link
            href="/lab/perros-calientes/reconstruccion/ciclo-3"
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
                    activo
                  </span>
                </div>
                <h2 className="font-bold text-xl tracking-wide uppercase text-neutral-900 mt-3">
                  Ciclo 3 — Acotacion
                </h2>
                <p className="text-xs text-neutral-400 font-semibold mb-3">
                  Feb 2026
                </p>
                <p className="text-xs text-neutral-500 font-semibold">
                  Fichas tecnicas &middot; Construccion
                </p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
