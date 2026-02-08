import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  updateFudoProduct,
  createFudoProduct,
  getAllFudoProducts,
} from "@/lib/fudo/client";
import { denormalizeToPush } from "@/lib/fudo/normalizer";
import { handleApiError } from "@/lib/utils/errors";
import type { Product } from "@/types/product";

export async function POST(request: Request) {
  try {
    const { productId } = await request.json();
    if (!productId) {
      return Response.json(
        { error: "productId is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get user for audit log
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Get local product
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("*, categoria:categories(*)")
      .eq("id", productId)
      .single();

    if (productError) throw productError;

    const localProduct = product as Product & {
      categoria: { fudo_category_id: string | null };
    };

    // Build Fudo payload
    const payload = denormalizeToPush(
      localProduct,
      localProduct.categoria?.fudo_category_id
    );

    let fudoResult;
    let action: "create" | "update";

    if (localProduct.fudo_id) {
      // Update existing
      payload.data.id = localProduct.fudo_id;
      fudoResult = await updateFudoProduct(localProduct.fudo_id, payload);
      action = "update";
    } else {
      // Try to find by code first
      const allFudo = await getAllFudoProducts();
      const existing = allFudo.find(
        (fp) => fp.attributes.code === localProduct.id
      );

      if (existing) {
        payload.data.id = existing.id;
        fudoResult = await updateFudoProduct(existing.id, payload);
        action = "update";
      } else {
        fudoResult = await createFudoProduct(payload);
        action = "create";
      }
    }

    // Update local product with Fudo data
    await supabase
      .from("products")
      .update({
        fudo_id: fudoResult.id,
        fudo_synced_at: new Date().toISOString(),
        fudo_sync_status: "synced",
      })
      .eq("id", productId);

    // Log the sync action
    await supabase.from("fudo_sync_log").insert({
      product_id: productId,
      action,
      direction: "push",
      details: {
        fudo_id: fudoResult.id,
        payload: payload.data.attributes,
      },
      status: "success",
      performed_by: user?.id,
    });

    return NextResponse.json({
      success: true,
      action,
      fudo_id: fudoResult.id,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
