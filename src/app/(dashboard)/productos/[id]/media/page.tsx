"use client";

import { use } from "react";
import { useProduct } from "@/lib/hooks/use-product";
import { PhotoUploader } from "@/components/media/photo-uploader";
import { PhotoGallery } from "@/components/media/photo-gallery";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function ProductoMediaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: product, isLoading, isError } = useProduct(id);

  if (isLoading) {
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
        <h1 className="min-w-0 truncate text-2xl font-bold">Media — {product.nombre}</h1>
      </div>

      <PhotoUploader productId={product.id} />

      <PhotoGallery
        productId={product.id}
        mainPhoto={product.foto_principal}
        gallery={product.galeria}
      />
    </div>
  );
}
