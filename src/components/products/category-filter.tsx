"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useCategories } from "@/lib/hooks/use-products";

interface CategoryFilterProps {
  selected: string | undefined;
  onChange: (categoryId: string | undefined) => void;
}

export function CategoryFilter({ selected, onChange }: CategoryFilterProps) {
  const { data: categories } = useCategories();

  return (
    <ScrollArea className="w-full">
      <div className="flex gap-2 pb-2">
        <Button
          variant={!selected ? "default" : "outline"}
          size="sm"
          onClick={() => onChange(undefined)}
        >
          Todos
        </Button>
        {categories?.map((cat) => (
          <Button
            key={cat.id}
            variant={selected === cat.id ? "default" : "outline"}
            size="sm"
            onClick={() =>
              onChange(selected === cat.id ? undefined : cat.id)
            }
          >
            {cat.nombre}
          </Button>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
