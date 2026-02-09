"use client";

import { cn } from "@/lib/utils";
import { RefreshCw, Zap } from "lucide-react";

interface CategorySidebarProps {
  categories: { id: string; nombre: string }[];
  selected: string | null;
  onSelect: (id: string | null) => void;
  productCounts?: Record<string, number>;
  totalCount?: number;
  onSync: () => void;
  isSyncing: boolean;
}

export function CategorySidebar({
  categories,
  selected,
  onSelect,
  productCounts = {},
  totalCount = 0,
  onSync,
  isSyncing,
}: CategorySidebarProps) {
  return (
    <aside className="w-48 shrink-0 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-gray-200">
        <p className="text-[10px] font-bold text-red-600 uppercase tracking-[0.2em]">POS</p>
        <p className="text-lg font-extrabold tracking-tight text-gray-900">FANZINE</p>
      </div>

      {/* Categories */}
      <nav className="flex-1 overflow-y-auto scrollbar-hide py-2">
        <button
          onClick={() => onSelect(null)}
          className={cn(
            "w-full text-left px-4 py-3 flex items-center justify-between gap-2 transition-all rounded-r-lg mr-2",
            selected === null
              ? "bg-[#DC2626] text-white"
              : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
          )}
        >
          <span className="text-sm font-extrabold truncate">Todos</span>
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

        {categories.map((cat) => {
          const count = productCounts[cat.id] || 0;
          const isActive = selected === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onSelect(cat.id)}
              className={cn(
                "w-full text-left px-4 py-3 flex items-center justify-between gap-2 transition-all rounded-r-lg mr-2",
                isActive
                  ? "bg-[#DC2626] text-white"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <span className="text-sm font-extrabold truncate">{cat.nombre}</span>
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
