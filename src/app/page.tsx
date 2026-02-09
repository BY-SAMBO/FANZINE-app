import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-white font-[family-name:var(--font-brutal)]">
      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center px-4 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center border-3 border-black bg-[#DC2626] shadow-[4px_4px_0_#000]">
          <span className="text-3xl font-extrabold text-white">F</span>
        </div>

        <h1 className="text-5xl font-extrabold uppercase tracking-tight text-black sm:text-6xl">
          FANZINE
        </h1>

        <p className="mt-3 text-lg font-bold uppercase tracking-wide text-black/60">
          Cine &amp; Tex-Mex
        </p>

        <div className="mt-6 h-1 w-24 bg-[#FDE047] border border-black" />

        <p className="mt-6 max-w-md text-sm leading-relaxed text-black/50">
          El mejor tex-mex de Bogota con la mejor experiencia de cine.
        </p>
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-black/10 px-4 py-4 text-center">
        <Link
          href="/login"
          className="text-xs text-black/30 hover:text-black/50 transition-colors"
        >
          Login
        </Link>
      </footer>
    </div>
  );
}
