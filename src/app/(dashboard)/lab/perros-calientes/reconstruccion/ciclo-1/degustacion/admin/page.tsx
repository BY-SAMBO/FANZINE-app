"use client";

import Link from "next/link";

export default function Ciclo1DegustacionAdminPage() {
  return (
    <div
      className="-m-4 lg:-m-8 min-h-screen"
      style={{ backgroundColor: "#fff", color: "#000" }}
    >
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
          <Link
            href="/lab/perros-calientes/reconstruccion/ciclo-1/degustacion"
            className="hover:text-neutral-800 transition-colors"
          >
            Degustacion
          </Link>
          <span>/</span>
          <span className="text-neutral-800 font-semibold">Admin</span>
        </nav>
      </div>
      <iframe
        src="/carta-pruebas/admin.html"
        width="100%"
        style={{ height: "calc(100vh - 120px)", border: "none" }}
      />
    </div>
  );
}
