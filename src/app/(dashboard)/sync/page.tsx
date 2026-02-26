"use client";

import { useState } from "react";
import {
  useCartaReadiness,
  useSyncComparison,
  usePriceReport,
} from "@/lib/hooks/use-sync";
import { SyncStatusCard } from "@/components/sync/sync-status-card";
import { CartaStatusCards } from "@/components/sync/carta-status-cards";
import { CartaReadinessTable } from "@/components/sync/carta-readiness-table";
import { ComparisonTable } from "@/components/sync/comparison-table";
import { PriceDiffTable } from "@/components/sync/price-diff-table";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw } from "lucide-react";

export default function SyncPage() {
  const [cartaFilter, setCartaFilter] = useState("todos");

  const {
    data: carta,
    isLoading: cartaLoading,
    isError: cartaError,
    refetch: refetchCarta,
    isFetching: cartaFetching,
  } = useCartaReadiness();

  const {
    data: comparison,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useSyncComparison();

  const { data: priceData, isLoading: pricesLoading } = usePriceReport();

  const [activeTab, setActiveTab] = useState("carta");

  function handleRefresh() {
    if (activeTab === "carta") {
      refetchCarta();
    } else {
      refetch();
    }
  }

  const isRefreshing =
    activeTab === "carta" ? cartaFetching : isFetching;
  const hasError = activeTab === "carta" ? cartaError : isError;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Sync Fudo</h1>
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
          />
          {activeTab === "carta" ? "Actualizar" : "Comparar"}
        </Button>
      </div>

      {hasError && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          Error cargando datos de Fudo. Verifica la conexion e intenta de nuevo.
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="carta">Carta</TabsTrigger>
          <TabsTrigger value="comparison">Comparacion</TabsTrigger>
          <TabsTrigger value="prices">Precios</TabsTrigger>
        </TabsList>

        <TabsContent value="carta" className="mt-4 space-y-6">
          <CartaStatusCards
            summary={carta?.summary}
            isLoading={cartaLoading}
            activeFilter={cartaFilter}
            onFilterChange={setCartaFilter}
          />
          {cartaLoading ? (
            <div className="h-64 animate-pulse rounded bg-muted" />
          ) : carta ? (
            <CartaReadinessTable
              items={carta.items}
              fudoOnly={carta.fudo_only}
              filter={cartaFilter}
            />
          ) : null}
        </TabsContent>

        <TabsContent value="comparison" className="mt-4 space-y-6">
          <SyncStatusCard comparison={comparison} isLoading={isLoading} />
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
    </div>
  );
}
