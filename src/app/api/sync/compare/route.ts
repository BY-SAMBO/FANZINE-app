import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAllFudoProducts } from "@/lib/fudo/client";
import { compareAll } from "@/lib/services/sync-service";
import { handleApiError } from "@/lib/utils/errors";
import type { Product } from "@/types/product";

export async function GET() {
  try {
    const supabase = await createClient();

    // Fetch both sources in parallel
    const [localResult, fudoProducts] = await Promise.all([
      supabase.from("products").select("*"),
      getAllFudoProducts(),
    ]);

    if (localResult.error) throw localResult.error;

    const comparison = compareAll(
      localResult.data as Product[],
      fudoProducts
    );

    return NextResponse.json(comparison);
  } catch (error) {
    return handleApiError(error);
  }
}
