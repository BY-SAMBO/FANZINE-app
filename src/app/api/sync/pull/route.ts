import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { getAllFudoProducts } from "@/lib/fudo/client";
import { handleApiError } from "@/lib/utils/errors";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function POST() {
  try {
    // Use server client for auth check
    const authClient = await createServerClient();
    const {
      data: { user },
    } = await authClient.auth.getUser();

    // Use service role client to bypass RLS for bulk admin operation
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch categories to build fudo_category_id -> UUID map
    const { data: categories, error: catError } = await supabase
      .from("categories")
      .select("id, slug, fudo_category_id");

    if (catError) throw catError;

    const categoryMap = new Map<string, string>();
    for (const cat of categories!) {
      if (cat.fudo_category_id) {
        categoryMap.set(String(cat.fudo_category_id), cat.id);
      }
    }

    // Fetch all products from Fudo
    const fudoProducts = await getAllFudoProducts();

    const results = {
      imported: 0,
      skipped: 0,
      errors: [] as { fudo_id: string; name: string; reason: string }[],
    };

    // Auto-generate counter for products without code
    let autoCodeCounter = 1;

    for (const fp of fudoProducts) {
      const attrs = fp.attributes;
      const code = attrs.code;

      // Skip toppings (code starts with TOP)
      if (code && code.startsWith("TOP")) {
        results.skipped++;
        continue;
      }

      // Resolve category
      const fudoCatId = fp.relationships?.productCategory?.data?.id;
      const categoriaId = fudoCatId
        ? categoryMap.get(String(fudoCatId))
        : undefined;

      if (!categoriaId) {
        results.errors.push({
          fudo_id: fp.id,
          name: attrs.name,
          reason: `No category mapping for fudo_category_id=${fudoCatId}`,
        });
        results.skipped++;
        continue;
      }

      // Skip non-sellAlone products (modifiers/toppings without TOP prefix)
      const sellAlone = (attrs as Record<string, unknown>).sellAlone;
      if (sellAlone === false) {
        results.skipped++;
        continue;
      }

      // Generate product ID from code, or auto-generate
      const productId =
        code || `AUTO${String(autoCodeCounter++).padStart(3, "0")}`;

      const productData = {
        id: productId,
        nombre: attrs.name,
        slug: slugify(attrs.name),
        categoria_id: categoriaId,
        precio_venta: attrs.price ?? 0,
        activo: attrs.active,
        descripcion_corta: attrs.description || null,
        foto_principal: (attrs as Record<string, unknown>).imageUrl as string | null ?? null,
        fudo_id: fp.id,
        fudo_synced_at: new Date().toISOString(),
        fudo_sync_status: "synced" as const,
      };

      // Upsert: insert or update on conflict
      const { error: upsertError } = await supabase
        .from("products")
        .upsert(productData, { onConflict: "id" });

      if (upsertError) {
        results.errors.push({
          fudo_id: fp.id,
          name: attrs.name,
          reason: upsertError.message,
        });
        continue;
      }

      results.imported++;

      // Log to sync audit
      await supabase.from("fudo_sync_log").insert({
        product_id: productId,
        action: "create",
        direction: "pull",
        details: {
          fudo_id: fp.id,
          fudo_name: attrs.name,
          fudo_price: attrs.price,
          fudo_category_id: fudoCatId,
          fudo_code: code,
        },
        status: "success",
        performed_by: user?.id,
      });
    }

    // Count final totals
    const { count } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true });

    return NextResponse.json({
      success: true,
      results,
      total_products_in_db: count,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
