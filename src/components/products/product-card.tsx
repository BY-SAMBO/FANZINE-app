"use client";

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils/pricing";
import type { Product } from "@/types/product";
import { Package } from "lucide-react";

interface ProductCardProps {
  product: Product & { categoria?: { nombre: string; slug: string } };
}

const syncStatusColors: Record<string, string> = {
  synced: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  conflict: "bg-red-100 text-red-700",
  local_only: "bg-gray-100 text-gray-700",
  fudo_only: "bg-blue-100 text-blue-700",
};

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Link href={`/productos/${product.id}`}>
      <Card className="group cursor-pointer transition-shadow hover:shadow-md">
        <CardContent className="p-4">
          {/* Image */}
          <div className="relative mb-3 aspect-square overflow-hidden rounded-lg bg-muted">
            {product.foto_principal ? (
              <Image
                src={product.foto_principal}
                alt={product.nombre}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover transition-transform group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Package className="h-10 w-10 text-muted-foreground/40" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="space-y-1">
            <div className="flex items-start justify-between gap-1">
              <h3 className="line-clamp-1 text-sm font-medium">
                {product.nombre}
              </h3>
              <span className="shrink-0 text-xs text-muted-foreground">
                {product.id}
              </span>
            </div>

            <p className="text-sm font-semibold">
              {formatPrice(product.precio_venta)}
            </p>

            {/* Tags */}
            <div className="flex flex-wrap gap-1 pt-1">
              {product.categoria && (
                <Badge variant="outline" className="text-xs">
                  {product.categoria.nombre}
                </Badge>
              )}
              {!product.activo && (
                <Badge variant="destructive" className="text-xs">
                  Inactivo
                </Badge>
              )}
              <span
                className={`inline-flex rounded px-1.5 py-0.5 text-xs font-medium ${
                  syncStatusColors[product.fudo_sync_status] || ""
                }`}
              >
                {product.fudo_sync_status}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
