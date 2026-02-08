"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "./progress-bar";
import { toggleChecklistItem } from "@/lib/services/checklist-service";
import type { ProductChecklist } from "@/lib/services/checklist-service";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface ChecklistCardProps {
  checklist: ProductChecklist;
}

const statusColors: Record<string, string> = {
  completo: "bg-green-100 text-green-700",
  incompleto: "bg-yellow-100 text-yellow-700",
  pendiente: "bg-gray-100 text-gray-600",
};

export function ChecklistCard({ checklist }: ChecklistCardProps) {
  const queryClient = useQueryClient();

  async function handleToggle(key: string, value: boolean) {
    try {
      await toggleChecklistItem(
        checklist.product_id,
        key as "checklist_precio_delivery" | "checklist_descripcion_delivery" | "checklist_foto_principal",
        value
      );
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Checklist actualizado");
    } catch {
      toast.error("Error actualizando checklist");
    }
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium">{checklist.nombre}</h3>
            <span className="text-xs text-muted-foreground">
              {checklist.product_id}
            </span>
          </div>
          <span
            className={`rounded px-2 py-0.5 text-xs font-medium ${
              statusColors[checklist.status]
            }`}
          >
            {checklist.status}
          </span>
        </div>

        <ProgressBar value={checklist.progress} className="mb-3" />

        <div className="space-y-2">
          {checklist.items.map((item) => (
            <div key={item.key} className="flex items-center gap-2">
              <Checkbox
                id={`${checklist.product_id}-${item.key}`}
                checked={item.completed}
                onCheckedChange={(checked) =>
                  handleToggle(item.key, checked as boolean)
                }
              />
              <label
                htmlFor={`${checklist.product_id}-${item.key}`}
                className="text-sm"
              >
                {item.label}
              </label>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
