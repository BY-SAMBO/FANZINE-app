"use client";

import { useSyncComparison, usePriceReport } from "@/lib/hooks/use-sync";
import { SyncStatusCard } from "@/components/sync/sync-status-card";
import { ComparisonTable } from "@/components/sync/comparison-table";
import { PriceDiffTable } from "@/components/sync/price-diff-table";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw } from "lucide-react";

export default function SyncPage() {
  const {
    data: comparison,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useSyncComparison();
  const { data: priceData, isLoading: pricesLoading } = usePriceReport();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Sync Fudo</h1>
        <Button
          variant="outline"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
          />
          Comparar
        </Button>
      </div>

      {isError ? (
        <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          Error cargando comparacion con Fudo. Verifica la conexion e intenta de nuevo.
        </div>
      ) : (
        <>
          <SyncStatusCard comparison={comparison} isLoading={isLoading} />

          <Tabs defaultValue="comparison">
            <TabsList>
              <TabsTrigger value="comparison">Comparacion</TabsTrigger>
              <TabsTrigger value="prices">Precios</TabsTrigger>
            </TabsList>
            <TabsContent value="comparison" className="mt-4">
              {isLoading ? (
                <div className="h-64 animate-pulse rounded bg-muted" />
              ) : comparison ? (
                <ComparisonTable comparison={comparison} />
              ) : (
                <p className="py-8 text-center text-muted-foreground">
                  No hay datos de comparacion. Haz clic en Comparar para iniciar.
                </p>
              )}
            </TabsContent>
            <TabsContent value="prices" className="mt-4">
              {pricesLoading ? (
                <div className="h-64 animate-pulse rounded bg-muted" />
              ) : priceData?.report ? (
                <PriceDiffTable report={priceData.report} />
              ) : (
                <p className="py-8 text-center text-muted-foreground">
                  No hay datos de precios disponibles.
                </p>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
