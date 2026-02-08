"use client";

import { useSyncComparison } from "@/lib/hooks/use-sync";
import { ComparisonTable } from "@/components/sync/comparison-table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function SyncComparePage() {
  const { data: comparison, isLoading, isError } = useSyncComparison();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/sync">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Comparacion detallada</h1>
      </div>

      {isLoading ? (
        <div className="h-64 animate-pulse rounded bg-muted" />
      ) : isError ? (
        <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          Error cargando comparacion. Verifica la conexion con Fudo e intenta de nuevo.
        </div>
      ) : comparison ? (
        <ComparisonTable comparison={comparison} />
      ) : (
        <p className="py-8 text-center text-muted-foreground">
          No hay datos de comparacion disponibles.
        </p>
      )}
    </div>
  );
}
