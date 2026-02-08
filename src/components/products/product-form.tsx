"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCategories, useUpdateProduct } from "@/lib/hooks/use-products";
import { formatPrice } from "@/lib/utils/pricing";
import { DELIVERY_MARKUP } from "@/lib/config/constants";
import type { Product } from "@/types/product";
import { toast } from "sonner";
import { Save, DollarSign, Info, FileText, ToggleRight } from "lucide-react";

interface ProductFormProps {
  product: Product;
}

export function ProductForm({ product }: ProductFormProps) {
  const router = useRouter();
  const { data: categories } = useCategories();
  const updateProduct = useUpdateProduct();

  const [form, setForm] = useState({
    nombre: product.nombre,
    categoria_id: product.categoria_id,
    precio_venta: product.precio_venta,
    precio_sugerido: product.precio_sugerido,
    precio_delivery: product.precio_delivery,
    activo: product.activo,
    visible_menu: product.visible_menu,
    disponible_local: product.disponible_local,
    disponible_delivery: product.disponible_delivery,
    favorito: product.favorito,
    descripcion_corta: product.descripcion_corta || "",
    descripcion_delivery: product.descripcion_delivery || "",
    descripcion_larga: product.descripcion_larga || "",
  });

  function updateField<K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      await updateProduct.mutateAsync({
        id: product.id,
        updates: {
          ...form,
          precio_sugerido: form.precio_sugerido || null,
          precio_delivery: form.precio_delivery || null,
          descripcion_corta: form.descripcion_corta || null,
          descripcion_delivery: form.descripcion_delivery || null,
          descripcion_larga: form.descripcion_larga || null,
        },
      });

      toast.success("Producto actualizado");
      router.refresh();
    } catch {
      toast.error("Error al actualizar el producto");
    }
  }

  const autoDeliveryPrice = Math.round((form.precio_venta * DELIVERY_MARKUP) / 100) * 100;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="border-[3px] border-black shadow-[4px_4px_0_#000] bg-white p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 bg-[#FDE047] border-2 border-black flex items-center justify-center">
            <Info className="h-4 w-4" />
          </div>
          <h3 className="text-2xl font-bold uppercase tracking-tight">
            Info Basica
          </h3>
        </div>
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-xs font-bold uppercase text-black/40 tracking-wider block mb-2">
                ID
              </label>
              <input
                value={product.id}
                disabled
                className="w-full border-2 border-black bg-black/5 px-4 py-3 font-mono text-sm font-bold text-black/60"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-black/40 tracking-wider block mb-2">
                Nombre
              </label>
              <Input
                value={form.nombre}
                onChange={(e) => updateField("nombre", e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase text-black/40 tracking-wider block mb-2">
              Categoria
            </label>
            <Select
              value={form.categoria_id}
              onValueChange={(v) => updateField("categoria_id", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories?.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="border-[3px] border-black shadow-[4px_4px_0_#000] bg-white p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 bg-[#DC2626] border-2 border-black flex items-center justify-center">
            <DollarSign className="h-4 w-4 text-white" />
          </div>
          <h3 className="text-2xl font-bold uppercase tracking-tight">
            Precios
          </h3>
        </div>
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-xs font-bold uppercase text-black/40 tracking-wider block mb-2">
                Precio actual (Fudo){" "}
                <span className="text-[10px] text-black/30">API</span>
              </label>
              <Input
                type="number"
                value={form.precio_venta}
                onChange={(e) =>
                  updateField("precio_venta", Number(e.target.value))
                }
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-black/40 tracking-wider block mb-2">
                Precio sugerido{" "}
                <span className="text-[10px] text-black/30">nueva carta</span>
              </label>
              <Input
                type="number"
                value={form.precio_sugerido ?? ""}
                onChange={(e) =>
                  updateField(
                    "precio_sugerido",
                    e.target.value ? Number(e.target.value) : null
                  )
                }
                placeholder="Sin definir"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-black/40 tracking-wider block mb-2">
                Precio delivery{" "}
                <span className="text-[10px] text-black/30">
                  (auto: {formatPrice(autoDeliveryPrice)})
                </span>
              </label>
              <Input
                type="number"
                value={form.precio_delivery ?? ""}
                onChange={(e) =>
                  updateField(
                    "precio_delivery",
                    e.target.value ? Number(e.target.value) : null
                  )
                }
                placeholder={String(autoDeliveryPrice)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Descriptions */}
      <div className="border-[3px] border-black shadow-[4px_4px_0_#000] bg-white p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 bg-[#7DD3FC] border-2 border-black flex items-center justify-center">
            <FileText className="h-4 w-4" />
          </div>
          <h3 className="text-2xl font-bold uppercase tracking-tight">
            Descripciones
          </h3>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold uppercase text-black/40 tracking-wider block mb-2">
              Descripcion corta
            </label>
            <Textarea
              value={form.descripcion_corta}
              onChange={(e) =>
                updateField("descripcion_corta", e.target.value)
              }
              rows={2}
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-black/40 tracking-wider block mb-2">
              Descripcion delivery
            </label>
            <Textarea
              value={form.descripcion_delivery}
              onChange={(e) =>
                updateField("descripcion_delivery", e.target.value)
              }
              rows={2}
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-black/40 tracking-wider block mb-2">
              Descripcion larga
            </label>
            <Textarea
              value={form.descripcion_larga}
              onChange={(e) =>
                updateField("descripcion_larga", e.target.value)
              }
              rows={4}
            />
          </div>
        </div>
      </div>

      {/* Status toggles */}
      <div className="border-[3px] border-black shadow-[4px_4px_0_#000] bg-white p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 bg-[#22c55e] border-2 border-black flex items-center justify-center">
            <ToggleRight className="h-4 w-4 text-white" />
          </div>
          <h3 className="text-2xl font-bold uppercase tracking-tight">
            Estado
          </h3>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[
            { key: "activo" as const, label: "Activo" },
            { key: "visible_menu" as const, label: "Visible en menu" },
            { key: "disponible_local" as const, label: "Disponible local" },
            {
              key: "disponible_delivery" as const,
              label: "Disponible delivery",
            },
            { key: "favorito" as const, label: "Favorito" },
          ].map((toggle) => (
            <div
              key={toggle.key}
              className="border-2 border-black p-4 flex items-center justify-between"
            >
              <label
                htmlFor={toggle.key}
                className="text-sm font-bold uppercase tracking-wide"
              >
                {toggle.label}
              </label>
              <Checkbox
                id={toggle.key}
                checked={form[toggle.key]}
                onCheckedChange={(checked) =>
                  updateField(toggle.key, checked as boolean)
                }
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          className="border-2 border-black shadow-[3px_3px_0_#000] hover:shadow-[2px_2px_0_#000] hover:translate-x-[1px] hover:translate-y-[1px] bg-white px-6 py-3 font-bold text-sm transition-all"
          onClick={() => router.back()}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={updateProduct.isPending}
          className="border-[3px] border-black shadow-[4px_4px_0_#000] hover:shadow-[2px_2px_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] bg-[#DC2626] text-white px-8 py-3 font-bold text-sm flex items-center gap-2 transition-all disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {updateProduct.isPending ? "Guardando..." : "Guardar"}
        </button>
      </div>
    </form>
  );
}
