"use client";

import { use } from "react";
import { useProduct } from "@/lib/hooks/use-product";
import { ProductForm } from "@/components/products/product-form";
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
        <div className="h-8 w-48 animate-pulse bg-black/5 border-2 border-black/10" />
        <div className="h-96 animate-pulse bg-black/5 border-2 border-black/10" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <p className="text-black/40 font-bold uppercase">
          Producto no encontrado
        </p>
        <Link href="/productos">
          <button className="border-2 border-black shadow-[3px_3px_0_#000] hover:shadow-[2px_2px_0_#000] hover:translate-x-[1px] hover:translate-y-[1px] bg-white px-5 py-3 font-bold text-sm transition-all">
            Volver a productos
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-4">
        <Link href="/productos">
          <button className="w-10 h-10 border-2 border-black shadow-[3px_3px_0_#000] hover:shadow-[2px_2px_0_#000] hover:translate-x-[1px] hover:translate-y-[1px] bg-white flex items-center justify-center transition-all">
            <ArrowLeft className="h-5 w-5" />
          </button>
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-3xl font-bold tracking-tight">
            {product.nombre}
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span className="bg-black/10 border-2 border-black px-3 py-1 text-xs font-bold font-mono uppercase">
              {product.id}
            </span>
            {product.categoria && (
              <span className="bg-[#FDE047] border-2 border-black px-3 py-1 text-xs font-bold uppercase">
                {product.categoria.nombre}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/productos/${id}/media`}>
            <button className="border-[3px] border-black shadow-[4px_4px_0_#000] hover:shadow-[2px_2px_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] bg-white px-5 py-3 font-bold text-sm flex items-center gap-2 transition-all">
              <Camera className="h-4 w-4" />
              Media
            </button>
          </Link>
          <Link href={`/productos/${id}/delivery`}>
            <button className="border-[3px] border-black shadow-[4px_4px_0_#000] hover:shadow-[2px_2px_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] bg-white px-5 py-3 font-bold text-sm flex items-center gap-2 transition-all">
              <Truck className="h-4 w-4" />
              Delivery
            </button>
          </Link>
        </div>
      </div>

      <ProductForm product={product} />
    </div>
  );
}
