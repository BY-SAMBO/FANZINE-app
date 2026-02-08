"use client";

import { use } from "react";
import { useProduct } from "@/lib/hooks/use-product";
import { ProductForm } from "@/components/products/product-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Camera, Truck } from "lucide-react";

export default function ProductoEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: product, isLoading, error } = useProduct(id);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-96 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  if (error || !product) {
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
      {/* Header */}
      <div className="flex flex-wrap items-center gap-4">
        <Link href="/productos">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-bold">{product.nombre}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <Badge variant="outline">{product.id}</Badge>
            {product.categoria && (
              <Badge variant="secondary">{product.categoria.nombre}</Badge>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/productos/${id}/media`}>
            <Button variant="outline" size="sm">
              <Camera className="mr-2 h-4 w-4" />
              Media
            </Button>
          </Link>
          <Link href={`/productos/${id}/delivery`}>
            <Button variant="outline" size="sm">
              <Truck className="mr-2 h-4 w-4" />
              Delivery
            </Button>
          </Link>
        </div>
      </div>

      <ProductForm product={product} />
    </div>
  );
}
