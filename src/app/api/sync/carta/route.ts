import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAllFudoProducts } from "@/lib/fudo/client";
import { handleApiError } from "@/lib/utils/errors";
import type { Product } from "@/types/product";
import type { Category } from "@/types/category";
import type {
  CartaReadinessItem,
  CartaReadinessData,
  CartaFudoOnly,
  CartaStatus,
} from "@/types/sync";

export async function GET() {
  try {
    const supabase = await createClient();

    const [productsResult, categoriesResult, fudoProducts] = await Promise.all([
      supabase.from("products").select("*").eq("activo", true),
      supabase.from("categories").select("*").eq("activa", true),
      getAllFudoProducts(),
    ]);

    if (productsResult.error) throw productsResult.error;
    if (categoriesResult.error) throw categoriesResult.error;

    const products = productsResult.data as Product[];
    const categories = categoriesResult.data as Category[];
    const catMap = new Map(categories.map((c) => [c.id, c.nombre]));

    // Build fudo lookup
    const fudoById = new Map(fudoProducts.map((fp) => [fp.id, fp]));
    const fudoByCode = new Map(
      fudoProducts
        .filter((fp) => fp.attributes.code)
        .map((fp) => [fp.attributes.code!, fp])
    );
    const matchedFudoIds = new Set<string>();

    // Build readiness items from local products
    const items: CartaReadinessItem[] = products.map((p) => {
      const fudoMatch =
        (p.fudo_id ? fudoById.get(p.fudo_id) : undefined) ||
        fudoByCode.get(p.id);

      if (fudoMatch) matchedFudoIds.add(fudoMatch.id);

      const hasFudo = !!fudoMatch || !!p.fudo_id;
      const hasFoto = !!p.foto_principal;

      let status: CartaStatus;
      if (hasFudo && hasFoto) status = "listo";
      else if (hasFudo && !hasFoto) status = "sin_foto";
      else if (!hasFudo && hasFoto) status = "sin_fudo";
      else status = "sin_foto_fudo";

      return {
        id: p.id,
        nombre: p.nombre,
        precio_venta: p.precio_venta,
        categoria_id: p.categoria_id,
        categoria_nombre: catMap.get(p.categoria_id) ?? "Sin categoría",
        foto_principal: p.foto_principal,
        fudo_id: p.fudo_id,
        activo: p.activo,
        status,
      };
    });

    // Fudo-only products (not matched to any local)
    const fudoOnly: CartaFudoOnly[] = fudoProducts
      .filter((fp) => !matchedFudoIds.has(fp.id))
      .map((fp) => ({
        fudo_id: fp.id,
        code: fp.attributes.code,
        name: fp.attributes.name,
        price: fp.attributes.price,
        active: fp.attributes.active,
      }));

    const listos = items.filter((i) => i.status === "listo").length;
    const sinFoto = items.filter(
      (i) => i.status === "sin_foto"
    ).length;
    const sinFudo = items.filter(
      (i) => i.status === "sin_fudo" || i.status === "sin_foto_fudo"
    ).length;

    const data: CartaReadinessData = {
      items,
      fudo_only: fudoOnly,
      summary: {
        total: items.length,
        listos,
        sin_foto: sinFoto,
        sin_fudo: sinFudo,
        fudo_only: fudoOnly.length,
      },
    };

    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error);
  }
}
