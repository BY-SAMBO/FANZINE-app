"use client";

import { resolveDeliveryConfig } from "@/lib/services/delivery-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils/pricing";
import type { Product } from "@/types/product";
import type { DeliveryModule, DeliveryCategoryTemplate } from "@/types/delivery";

interface DeliveryPreviewProps {
  product: Product;
  modules: DeliveryModule[];
  categoryTemplate: DeliveryCategoryTemplate | null;
}

export function DeliveryPreview({
  product,
  modules,
  categoryTemplate,
}: DeliveryPreviewProps) {
  const resolved = resolveDeliveryConfig(
    product,
    modules,
    categoryTemplate,
    product.delivery_config as never
  );

  if (resolved.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No hay modulos de delivery configurados para esta categoria
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Preview de la configuracion de delivery para este producto. Los
        modulos se resuelven combinando: modulos base → template de
        categoria → overrides del producto.
      </p>

      {resolved.map((module) => (
        <Card key={module.id}>
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-base">{module.titulo}</CardTitle>
              <div className="flex gap-2">
                <Badge variant="outline">{module.tipo}</Badge>
                {module.max_items && (
                  <Badge variant="secondary">
                    max: {module.max_items}
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {module.items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded px-2 py-1.5 text-sm hover:bg-muted"
                >
                  <span>{item.nombre}</span>
                  {item.precio > 0 && (
                    <span className="text-muted-foreground">
                      +{formatPrice(item.precio)}
                    </span>
                  )}
                </div>
              ))}
              {module.items.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Sin items configurados
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
