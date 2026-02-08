import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPendingProducts } from "@/lib/services/sync-service";
import { handleApiError } from "@/lib/utils/errors";
import type { Product } from "@/types/product";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .in("fudo_sync_status", ["pending", "local_only"]);

    if (error) throw error;

    const pending = getPendingProducts(data as Product[]);
    return NextResponse.json({ products: pending, count: pending.length });
  } catch (error) {
    return handleApiError(error);
  }
}
