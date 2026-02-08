"use client";

import { useDeliveryModules } from "@/lib/hooks/use-delivery";
import { useCategories } from "@/lib/hooks/use-products";
import { ModuleEditor } from "@/components/delivery/module-editor";
import { IngredientDetector } from "@/components/delivery/ingredient-detector";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";

export default function DeliveryPage() {
  const { data: modules, isLoading, isError } = useDeliveryModules();
  const { data: categories } = useCategories();
  const queryClient = useQueryClient();

  function handleModuleSaved() {
    queryClient.invalidateQueries({ queryKey: ["delivery-modules"] });
  }

  if (isError) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Delivery</h1>
        <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          Error cargando modulos de delivery. Recarga la pagina para intentar de nuevo.
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Delivery</h1>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-48 animate-pulse rounded bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Configuracion Delivery</h1>

      {/* Category templates overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Templates por categoria</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
            {categories && categories.length === 0 ? (
              <p className="col-span-full py-4 text-center text-muted-foreground">
                No hay categorias configuradas.
              </p>
            ) : (
              categories?.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/delivery/categorias/${cat.slug}`}
                  className="flex items-center justify-between rounded-md border p-3 transition-colors hover:bg-muted"
                >
                  <span className="text-sm font-medium">{cat.nombre}</span>
                  <Badge variant="outline">Ver config</Badge>
                </Link>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Ingredient detector */}
      <IngredientDetector />

      {/* Module editors */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Modulos</h2>
        {modules && modules.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">
            No hay modulos de delivery configurados.
          </p>
        ) : (
          modules?.map((module) => (
            <ModuleEditor
              key={module.id}
              module={module}
              onSaved={handleModuleSaved}
            />
          ))
        )}
      </div>
    </div>
  );
}
