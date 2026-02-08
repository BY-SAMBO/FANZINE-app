"use client";

import { ChecklistCard } from "./checklist-card";
import type { ProductChecklist } from "@/lib/services/checklist-service";

interface ChecklistGridProps {
  checklists: ProductChecklist[];
}

export function ChecklistGrid({ checklists }: ChecklistGridProps) {
  if (checklists.length === 0) {
    return (
      <p className="py-8 text-center text-muted-foreground">
        No hay productos
      </p>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {checklists.map((checklist) => (
        <ChecklistCard key={checklist.product_id} checklist={checklist} />
      ))}
    </div>
  );
}
