import Link from "next/link";

export default function LabPage() {
  return (
    <div
      className="-m-4 lg:-m-8 min-h-screen"
      style={{ backgroundColor: "#fff", color: "#000" }}
    >
      <header
        className="text-center py-16 px-4"
        style={{ borderBottom: "3px solid #000" }}
      >
        <div className="text-4xl mb-4">🔬🧪</div>
        <h1
          className="text-5xl md:text-6xl font-bold tracking-widest"
          style={{ color: "#e63946" }}
        >
          LAB GASTRONOMICO
        </h1>
        <p className="text-neutral-500 text-sm tracking-widest uppercase mt-2 font-bold">
          Experimentacion e iteracion con datos
        </p>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Link href="/lab/perros-calientes" className="no-underline block">
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
                  <span className="text-4xl">🌭</span>
                  <span
                    className="text-[0.65rem] px-2.5 py-0.5 font-bold uppercase tracking-wider"
                    style={{
                      backgroundColor: "#e9c46a",
                      color: "#000",
                      border: "2px solid #000",
                    }}
                  >
                    1 iniciativa
                  </span>
                </div>
                <h2 className="font-bold text-xl tracking-wide uppercase text-neutral-900">
                  Perros Calientes
                </h2>
                <p className="text-xs text-neutral-500 mt-1 font-semibold">
                  Reconstruccion de la carta insignia
                </p>
              </div>
            </div>
          </Link>

          <Link href="/lab/nachos" className="no-underline block">
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
                style={{ backgroundColor: "#D4A017" }}
              />
              <div className="p-6">
                <div className="flex items-start justify-between mb-2">
                  <span className="text-4xl">🧀</span>
                  <span
                    className="text-[0.65rem] px-2.5 py-0.5 font-bold uppercase tracking-wider"
                    style={{
                      backgroundColor: "#e9c46a",
                      color: "#000",
                      border: "2px solid #000",
                    }}
                  >
                    4 variantes
                  </span>
                </div>
                <h2 className="font-bold text-xl tracking-wide uppercase text-neutral-900">
                  Nachos
                </h2>
                <p className="text-xs text-neutral-500 mt-1 font-semibold">
                  Chips + cheddar fundido + proteina
                </p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
