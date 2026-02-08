"use client";

import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/lib/utils/pricing";
import type { Product } from "@/types/product";
import { Package } from "lucide-react";

interface ProductCardProps {
  product: Product & { categoria?: { nombre: string; slug: string } };
}

const syncStatusColors: Record<string, string> = {
  synced: "bg-green-400",
  pending: "bg-[#FDE047]",
  conflict: "bg-[#DC2626] text-white",
  local_only: "bg-gray-300",
  fudo_only: "bg-blue-300",
};

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Link
      href={`/productos/${product.id}`}
      className="block border-[3px] border-black shadow-[4px_4px_0_#000] hover:shadow-[2px_2px_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] bg-white transition-all cursor-pointer overflow-hidden"
    >
      {/* Image */}
      {product.foto_principal ? (
        <div className="relative h-32 border-b-[3px] border-black bg-gray-50 overflow-hidden">
          <Image
            src={product.foto_principal}
            alt={product.nombre}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover"
          />
        </div>
      ) : (
        <div className="flex h-32 items-center justify-center border-b-[3px] border-black bg-black/5">
          <Package className="h-10 w-10 text-black/20" />
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="font-bold text-sm leading-tight line-clamp-1">
              {product.nombre}
            </h3>
            <span className="text-[10px] text-black/40 font-mono font-bold">
              {product.id}
            </span>
          </div>
          <span
            className={`shrink-0 border-2 border-black px-2 py-0.5 text-[10px] font-bold uppercase ${
              syncStatusColors[product.fudo_sync_status] || "bg-gray-200"
            }`}
          >
            {product.fudo_sync_status}
          </span>
        </div>

        {product.categoria && (
          <span className="inline-block bg-[#FDE047] border-2 border-black px-2 py-0.5 text-[10px] font-bold uppercase mb-3">
            {product.categoria.nombre}
          </span>
        )}

        {!product.activo && (
          <span className="inline-block bg-[#DC2626] text-white border-2 border-black px-2 py-0.5 text-[10px] font-bold uppercase mb-3 ml-1">
            Inactivo
          </span>
        )}

        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-black/50 font-medium">Fudo</span>
            <span className="font-bold font-mono">
              {formatPrice(product.precio_venta)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-black/50 font-medium">Sugerido</span>
            {product.precio_sugerido != null ? (
              <span className="font-bold font-mono text-[#DC2626]">
                {formatPrice(product.precio_sugerido)}
              </span>
            ) : (
              <span className="font-bold font-mono text-orange-500 text-[10px] bg-orange-100 border border-black px-1">
                Sin definir
              </span>
            )}
          </div>
          <div className="flex justify-between items-center">
            <span className="text-black/50 font-medium">Delivery</span>
            <span className="font-bold font-mono text-blue-600">
              {product.precio_delivery != null ? formatPrice(product.precio_delivery) : "—"}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
