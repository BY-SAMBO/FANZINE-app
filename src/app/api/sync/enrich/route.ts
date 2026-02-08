import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { handleApiError } from "@/lib/utils/errors";
import { readdir, readFile } from "fs/promises";
import { join } from "path";

const V2_ITEMS_DIR =
  "/Users/a./Cloud-Workspace/GALGO/FANZINE/MENU-Interno/productos/items";

interface V2Product {
  id: string;
  nombre: string;
  precio: {
    venta: number;
    delivery: number | null;
    costo: { total: number | null };
  };
  estado: {
    visible_menu: boolean;
    disponible_delivery: boolean;
    favorito: boolean;
  };
  contenido: {
    descripcion_corta: string | null;
    descripcion_delivery: string | null;
    descripcion_larga: string | null;
    prompt_ia: string | null;
  };
  delivery_config?: Record<string, unknown>;
  modulos?: {
    rappi_ready?: {
      requisitos?: {
        precio_delivery?: { completado: boolean };
        descripcion_delivery?: { completado: boolean };
        foto_principal?: { completado: boolean };
      };
    };
  };
}

export async function POST() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const files = await readdir(V2_ITEMS_DIR);
    const jsonFiles = files.filter(
      (f) => f.endsWith(".json") && !f.startsWith("_") && !f.startsWith("TOP") && f !== "undefined.json"
    );

    const results = {
      enriched: 0,
      skipped: 0,
      not_found: [] as string[],
      errors: [] as { id: string; reason: string }[],
    };

    for (const file of jsonFiles) {
      const id = file.replace(".json", "");

      try {
        const raw = await readFile(join(V2_ITEMS_DIR, file), "utf-8");
        const v2: V2Product = JSON.parse(raw);

        // Check if product exists in Supabase
        const { data: existing } = await supabase
          .from("products")
          .select("id")
          .eq("id", id)
          .single();

        if (!existing) {
          results.not_found.push(id);
          results.skipped++;
          continue;
        }

        const rappiReqs = v2.modulos?.rappi_ready?.requisitos;

        const updateData: Record<string, unknown> = {
          // Pricing
          ...(v2.precio.delivery && { precio_delivery: v2.precio.delivery }),
          ...(v2.precio.costo?.total && { precio_costo_receta: v2.precio.costo.total }),

          // Descriptions
          ...(v2.contenido.descripcion_corta && {
            descripcion_corta: v2.contenido.descripcion_corta,
          }),
          ...(v2.contenido.descripcion_delivery && {
            descripcion_delivery: v2.contenido.descripcion_delivery,
          }),
          ...(v2.contenido.descripcion_larga && {
            descripcion_larga: v2.contenido.descripcion_larga,
          }),
          ...(v2.contenido.prompt_ia && { prompt_ia: v2.contenido.prompt_ia }),

          // Status flags
          visible_menu: v2.estado.visible_menu,
          disponible_delivery: v2.estado.disponible_delivery,
          favorito: v2.estado.favorito,

          // Delivery config
          ...(v2.delivery_config && { delivery_config: v2.delivery_config }),

          // Checklist
          ...(rappiReqs && {
            checklist_precio_delivery: rappiReqs.precio_delivery?.completado ?? false,
            checklist_descripcion_delivery: rappiReqs.descripcion_delivery?.completado ?? false,
            checklist_foto_principal: rappiReqs.foto_principal?.completado ?? false,
          }),
        };

        const { error } = await supabase
          .from("products")
          .update(updateData)
          .eq("id", id);

        if (error) {
          results.errors.push({ id, reason: error.message });
        } else {
          results.enriched++;
        }
      } catch (err) {
        results.errors.push({
          id,
          reason: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    return handleApiError(error);
  }
}
