"use client";

import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useCategories } from "@/lib/hooks/use-products";
import { cn } from "@/lib/utils";

interface CategoryFilterProps {
  selected: string | undefined;
  onChange: (categoryId: string | undefined) => void;
}

export function CategoryFilter({ selected, onChange }: CategoryFilterProps) {
  const { data: categories } = useCategories();

  return (
    <ScrollArea className="w-full">
      <div className="flex gap-2 pb-2">
        <button
          className={cn(
            "shrink-0 border-2 border-black px-4 py-2 text-xs font-bold uppercase tracking-wide shadow-[3px_3px_0_#000] hover:shadow-[2px_2px_0_#000] hover:translate-x-[1px] hover:translate-y-[1px] transition-all",
            !selected
              ? "bg-black text-white"
              : "bg-white text-black hover:bg-[#FDE047]"
          )}
          onClick={() => onChange(undefined)}
        >
          Todos
        </button>
        {categories?.map((cat) => (
          <button
            key={cat.id}
            className={cn(
              "shrink-0 border-2 border-black px-4 py-2 text-xs font-bold uppercase tracking-wide shadow-[3px_3px_0_#000] hover:shadow-[2px_2px_0_#000] hover:translate-x-[1px] hover:translate-y-[1px] transition-all",
              selected === cat.id
                ? "bg-black text-white"
                : "bg-white text-black hover:bg-[#FDE047]"
            )}
            onClick={() =>
              onChange(selected === cat.id ? undefined : cat.id)
            }
          >
            {cat.nombre}
          </button>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
