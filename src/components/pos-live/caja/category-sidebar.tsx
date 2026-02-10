"use client";

import { cn } from "@/lib/utils";
import { RefreshCw, Star, Zap } from "lucide-react";

export const FAVORITES_ID = "__favorites__";

interface CategorySidebarProps {
  categories: { id: string; nombre: string }[];
  selected: string | null;
  onSelect: (id: string | null) => void;
  productCounts?: Record<string, number>;
  totalCount?: number;
  favoritesCount?: number;
  onSync: () => void;
  isSyncing: boolean;
  sessionCode?: string;
  connected?: boolean;
}

export function CategorySidebar({
  categories,
  selected,
  onSelect,
  productCounts = {},
  totalCount = 0,
  favoritesCount = 0,
  onSync,
  isSyncing,
  sessionCode,
  connected,
}: CategorySidebarProps) {
  return (
    <aside className="w-36 lg:w-48 shrink-0 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="px-3 py-3 lg:px-4 lg:py-4 border-b border-gray-200">
        <p className="text-[10px] font-bold text-red-600 uppercase tracking-[0.2em]">POS</p>
        <p className="text-base lg:text-lg font-extrabold tracking-tight text-gray-900">FANZINE</p>
      </div>

      {/* Session Code */}
      {sessionCode && (
        <div className="px-4 py-3 border-b border-gray-200 text-center">
          <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-1">Codigo sesion</p>
          <p className="mono text-2xl font-extrabold tracking-[0.2em] text-gray-900">{sessionCode}</p>
          <div className={`mt-1 flex items-center justify-center gap-1.5 text-[10px] ${connected ? 'text-emerald-500' : 'text-gray-300'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-500' : 'bg-gray-300'}`} />
            {connected ? 'Conectado' : 'Esperando...'}
          </div>
        </div>
      )}

      {/* Categories */}
      <nav className="flex-1 overflow-y-auto scrollbar-hide py-2">
        {/* Favoritos - always first */}
        <button
          onClick={() => onSelect(FAVORITES_ID)}
          className={cn(
            "w-full text-left px-3 py-2.5 lg:px-4 lg:py-3 flex items-center justify-between gap-2 transition-all rounded-r-lg mr-2",
            selected === FAVORITES_ID
              ? "bg-[#DC2626] text-white"
              : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
          )}
        >
          <span className="text-xs lg:text-sm font-extrabold truncate flex items-center gap-1.5">
            <Star className={cn("w-3.5 h-3.5 shrink-0", selected === FAVORITES_ID ? "text-white fill-white" : "text-amber-400 fill-amber-400")} />
            Favoritos
          </span>
          <span
            className={cn(
              "text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded-full",
              selected === FAVORITES_ID
                ? "bg-white/25 text-white"
                : "bg-gray-100 text-gray-400"
            )}
          >
            {favoritesCount}
          </span>
        </button>

        {/* Categories by relevance */}
        {categories.map((cat) => {
          const count = productCounts[cat.id] || 0;
          const isActive = selected === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onSelect(cat.id)}
              className={cn(
                "w-full text-left px-3 py-2.5 lg:px-4 lg:py-3 flex items-center justify-between gap-2 transition-all rounded-r-lg mr-2",
                isActive
                  ? "bg-[#DC2626] text-white"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <span className="text-xs lg:text-sm font-extrabold truncate">{cat.nombre}</span>
              <span
                className={cn(
                  "text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded-full",
                  isActive
                    ? "bg-white/25 text-white"
                    : "bg-gray-100 text-gray-400"
                )}
              >
                {count}
              </span>
            </button>
          );
        })}

        {/* Todos - last */}
        <button
          onClick={() => onSelect(null)}
          className={cn(
            "w-full text-left px-3 py-2.5 lg:px-4 lg:py-3 flex items-center justify-between gap-2 transition-all rounded-r-lg mr-2",
            selected === null
              ? "bg-[#DC2626] text-white"
              : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
          )}
        >
          <span className="text-xs lg:text-sm font-extrabold truncate">Todos</span>
          <span
            className={cn(
              "text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded-full",
              selected === null
                ? "bg-white/25 text-white"
                : "bg-gray-100 text-gray-400"
            )}
          >
            {totalCount}
          </span>
        </button>
      </nav>

      {/* Sync button */}
      <div className="p-3 border-t border-gray-200">
        <button
          onClick={onSync}
          disabled={isSyncing}
          className="w-full py-2.5 border-2 border-red-600 text-red-600 text-xs font-extrabold uppercase tracking-wider hover:bg-red-600 hover:text-white disabled:opacity-30 transition-all rounded-lg flex items-center justify-center gap-2"
        >
          {isSyncing ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Zap className="w-3.5 h-3.5" />
          )}
          {isSyncing ? "Sync..." : "Iniciar POS"}
        </button>
      </div>
    </aside>
  );
}
