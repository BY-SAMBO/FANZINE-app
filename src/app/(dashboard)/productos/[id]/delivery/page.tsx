"use client";

import { use } from "react";
import { useProduct } from "@/lib/hooks/use-product";
import { useDeliveryModules, useDeliveryCategoryTemplate } from "@/lib/hooks/use-delivery";
import { DeliveryPreview } from "@/components/delivery/delivery-preview";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function ProductoDeliveryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: product, isLoading: productLoading, isError } = useProduct(id);
  const { data: modules, isLoading: modulesLoading } = useDeliveryModules();
  const { data: template } = useDeliveryCategoryTemplate(
    product?.categoria_id
  );

  if (productLoading) {
    return <div className="h-96 animate-pulse rounded bg-muted" />;
  }

  if (isError || !product) {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <p className="text-muted-foreground">Producto no encontrado</p>
        <Link href="/productos">
          <Button variant="outline">Volver a productos</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/productos/${id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="min-w-0 truncate text-2xl font-bold">
          Delivery — {product.nombre}
        </h1>
      </div>

      {modulesLoading ? (
        <div className="h-48 animate-pulse rounded bg-muted" />
      ) : modules ? (
        <DeliveryPreview
          product={product}
          modules={modules}
          categoryTemplate={template || null}
        />
      ) : (
        <p className="py-8 text-center text-muted-foreground">
          No se pudieron cargar los modulos de delivery.
        </p>
      )}
    </div>
  );
}
