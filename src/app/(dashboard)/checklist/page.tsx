"use client";

import { useMemo, useState } from "react";
import { useProducts } from "@/lib/hooks/use-products";
import {
  getProductChecklist,
  getChecklistStats,
} from "@/lib/services/checklist-service";
import { ChecklistGrid } from "@/components/checklist/checklist-grid";
import { ProgressBar } from "@/components/checklist/progress-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Product } from "@/types/product";

type FilterStatus = "all" | "completo" | "incompleto" | "pendiente";

export default function ChecklistPage() {
  const { data: products, isLoading, isError } = useProducts();
  const [filter, setFilter] = useState<FilterStatus>("all");

  const checklists = useMemo(() => {
    if (!products) return [];
    return products.map((p) => getProductChecklist(p as Product));
  }, [products]);

  const stats = useMemo(() => {
    if (!products) return null;
    return getChecklistStats(products as Product[]);
  }, [products]);

  const filtered = useMemo(() => {
    if (filter === "all") return checklists;
    return checklists.filter((c) => c.status === filter);
  }, [checklists, filter]);

  if (isError) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Checklist Rappi</h1>
        <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          Error cargando checklist. Recarga la pagina para intentar de nuevo.
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Checklist Rappi</h1>
        <div className="h-64 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Checklist Rappi</h1>

      {/* Stats */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Progreso general</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ProgressBar value={stats.progress} />
            <div className="flex flex-wrap gap-4 text-sm">
              <span>
                Completos:{" "}
                <Badge variant="default">{stats.completo}</Badge>
              </span>
              <span>
                Incompletos:{" "}
                <Badge variant="secondary">{stats.incompleto}</Badge>
              </span>
              <span>
                Pendientes:{" "}
                <Badge variant="outline">{stats.pendiente}</Badge>
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        {(
          [
            { key: "all" as const, label: "Todos" },
            { key: "pendiente" as const, label: "Pendientes" },
            { key: "incompleto" as const, label: "Incompletos" },
            { key: "completo" as const, label: "Completos" },
          ] as const
        ).map((f) => (
          <Button
            key={f.key}
            variant={filter === f.key ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {/* Grid */}
      <ChecklistGrid checklists={filtered} />
    </div>
  );
}
