import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import {
  getFudoProductWithModifiers,
  getAllProductModifiers,
} from "@/lib/fudo/pos-client";
import { handleApiError } from "@/lib/utils/errors";

export async function POST() {
  try {
    // Auth check
    const authClient = await createClient();
    const {
      data: { user },
    } = await authClient.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { data: profile } = await authClient
      .from("user_profiles")
      .select("rol")
      .eq("id", user.id)
      .single();

    if (!profile || !["administrador", "cajero"].includes(profile.rol)) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const supabase = await createServiceClient();

    // 1. Get all products with fudo_id from our DB
    const { data: localProducts, error: prodError } = await supabase
      .from("products")
      .select("id, fudo_id, nombre")
      .not("fudo_id", "is", null);

    if (prodError) throw prodError;

    // Build fudo_id -> local product map
    const productMap = new Map<string, { id: string; nombre: string }>();
    for (const p of localProducts || []) {
      productMap.set(p.fudo_id!, { id: p.id, nombre: p.nombre });
    }

    // 2. Get all ProductModifier records from Fudo (12 records)
    const allPMs = await getAllProductModifiers();

    // Build PM id -> { productFudoId, groupFudoId, price, maxQty }
    const pmMap = new Map<string, {
      productFudoId: string;
      groupFudoId: string;
      price: number;
      maxQuantity: number;
    }>();
    for (const pm of allPMs) {
      pmMap.set(pm.id, {
        productFudoId: pm.relationships.product.data.id,
        groupFudoId: pm.relationships.productModifiersGroup.data.id,
        price: pm.attributes.price,
        maxQuantity: pm.attributes.maxQuantity,
      });
    }

    // 3. For each product that has modifiers, fetch groups via include
    const results = {
      products_with_modifiers: 0,
      modifiers_cached: 0,
      errors: [] as { product_id: string; reason: string }[],
    };

    for (const product of localProducts || []) {
      try {
        const { groups, hasModifiers } = await getFudoProductWithModifiers(product.fudo_id!);
        if (!hasModifiers) continue;

        results.products_with_modifiers++;

        for (const group of groups) {
          // Each group has productModifiers refs
          for (const pmRef of group.relationships.productModifiers.data) {
            const pmData = pmMap.get(pmRef.id);
            if (!pmData) continue;

            // Resolve topping name from our local products
            const toppingProduct = productMap.get(pmData.productFudoId);
            const toppingName = toppingProduct?.nombre || `Modifier ${pmRef.id}`;

            const { error: upsertError } = await supabase
              .from("pos_modifier_cache")
              .upsert(
                {
                  product_fudo_id: product.fudo_id!,
                  product_local_id: product.id,
                  modifier_group_fudo_id: group.id,
                  modifier_group_name: group.attributes.name,
                  modifier_fudo_id: pmRef.id, // ProductModifier ID
                  topping_product_fudo_id: pmData.productFudoId, // Actual topping product ID (for subitems)
                  modifier_name: toppingName,
                  modifier_price: pmData.price,
                  max_quantity: pmData.maxQuantity,
                  group_max_quantity: group.attributes.maxQuantity,
                  group_min_quantity: group.attributes.minQuantity,
                  synced_at: new Date().toISOString(),
                },
                {
                  onConflict: "product_fudo_id,modifier_group_fudo_id,modifier_fudo_id",
                }
              );

            if (upsertError) {
              results.errors.push({
                product_id: product.id,
                reason: upsertError.message,
              });
              continue;
            }

            results.modifiers_cached++;
          }
        }
      } catch (err) {
        results.errors.push({
          product_id: product.id,
          reason: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
