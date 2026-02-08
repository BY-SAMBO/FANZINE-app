"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Save } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { DeliveryModule, DeliveryModuleItem } from "@/types/delivery";
import { toast } from "sonner";

interface ModuleEditorProps {
  module: DeliveryModule;
  onSaved?: () => void;
}

export function ModuleEditor({ module, onSaved }: ModuleEditorProps) {
  const [items, setItems] = useState<DeliveryModuleItem[]>(module.catalogo);
  const [isSaving, setIsSaving] = useState(false);

  function addItem() {
    setItems([...items, { nombre: "", precio: 0, activo: true }]);
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index));
  }

  function updateItem(index: number, field: keyof DeliveryModuleItem, value: unknown) {
    setItems(
      items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    );
  }

  async function handleSave() {
    setIsSaving(true);
    const supabase = createClient();

    const { error } = await supabase
      .from("delivery_modules")
      .update({ catalogo: items })
      .eq("id", module.id);

    setIsSaving(false);

    if (error) {
      toast.error("Error guardando modulo");
      return;
    }

    toast.success("Modulo guardado");
    onSaved?.();
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">{module.titulo}</CardTitle>
          <div className="flex gap-2">
            <Badge variant="outline">{module.tipo}</Badge>
            <Badge variant="secondary">{module.id}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item, idx) => (
          <div key={idx} className="flex flex-wrap items-center gap-2">
            <Checkbox
              checked={item.activo}
              onCheckedChange={(checked) =>
                updateItem(idx, "activo", checked)
              }
            />
            <Input
              value={item.nombre}
              onChange={(e) => updateItem(idx, "nombre", e.target.value)}
              placeholder="Nombre"
              className="min-w-0 flex-1"
            />
            <Input
              type="number"
              value={item.precio}
              onChange={(e) =>
                updateItem(idx, "precio", Number(e.target.value))
              }
              className="w-24 sm:w-28"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeItem(idx)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}

        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={addItem}>
            <Plus className="mr-2 h-4 w-4" />
            Agregar item
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
