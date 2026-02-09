"use client";

import { cn } from "@/lib/utils";

interface CategoryBarProps {
  categories: { id: string; nombre: string }[];
  selected: string | null;
  onSelect: (id: string | null) => void;
}

export function CategoryBar({ categories, selected, onSelect }: CategoryBarProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      <button
        onClick={() => onSelect(null)}
        className={cn(
          "shrink-0 px-4 py-2 text-sm font-bold uppercase tracking-wider transition-all border-2",
          selected === null
            ? "bg-[#DC2626] text-white border-white"
            : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white"
        )}
      >
        Todos
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          className={cn(
            "shrink-0 px-4 py-2 text-sm font-bold uppercase tracking-wider transition-all border-2",
            selected === cat.id
              ? "bg-[#DC2626] text-white border-white"
              : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white"
          )}
        >
          {cat.nombre}
        </button>
      ))}
    </div>
  );
}
