"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCategories, useUpdateProduct } from "@/lib/hooks/use-products";
import { formatPrice } from "@/lib/utils/pricing";
import { DELIVERY_MARKUP } from "@/lib/config/constants";
import type { Product } from "@/types/product";
import { toast } from "sonner";
import { Save } from "lucide-react";

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
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informacion basica</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>ID</Label>
              <Input value={product.id} disabled />
            </div>
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input
                value={form.nombre}
                onChange={(e) => updateField("nombre", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Categoria</Label>
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
        </CardContent>
      </Card>

      {/* Pricing */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Precios</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Precio venta</Label>
              <Input
                type="number"
                value={form.precio_venta}
                onChange={(e) =>
                  updateField("precio_venta", Number(e.target.value))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label>
                Precio delivery{" "}
                <span className="text-xs text-muted-foreground">
                  (auto: {formatPrice(autoDeliveryPrice)})
                </span>
              </Label>
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
        </CardContent>
      </Card>

      {/* Descriptions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Descripciones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Descripcion corta</Label>
            <Textarea
              value={form.descripcion_corta}
              onChange={(e) =>
                updateField("descripcion_corta", e.target.value)
              }
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label>Descripcion delivery</Label>
            <Textarea
              value={form.descripcion_delivery}
              onChange={(e) =>
                updateField("descripcion_delivery", e.target.value)
              }
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label>Descripcion larga</Label>
            <Textarea
              value={form.descripcion_larga}
              onChange={(e) =>
                updateField("descripcion_larga", e.target.value)
              }
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Status toggles */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Estado</CardTitle>
        </CardHeader>
        <CardContent>
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
              <div key={toggle.key} className="flex items-center gap-2">
                <Checkbox
                  id={toggle.key}
                  checked={form[toggle.key]}
                  onCheckedChange={(checked) =>
                    updateField(toggle.key, checked as boolean)
                  }
                />
                <Label htmlFor={toggle.key} className="text-sm">
                  {toggle.label}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Separator />

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={updateProduct.isPending}>
          <Save className="mr-2 h-4 w-4" />
          {updateProduct.isPending ? "Guardando..." : "Guardar"}
        </Button>
      </div>
    </form>
  );
}
