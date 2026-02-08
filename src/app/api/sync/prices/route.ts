import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAllFudoProducts } from "@/lib/fudo/client";
import { generatePriceReport } from "@/lib/services/sync-service";
import { handleApiError } from "@/lib/utils/errors";
import type { Product } from "@/types/product";

export async function GET() {
  try {
    const supabase = await createClient();

    const [localResult, fudoProducts] = await Promise.all([
      supabase.from("products").select("*"),
      getAllFudoProducts(),
    ]);

    if (localResult.error) throw localResult.error;

    const report = generatePriceReport(
      localResult.data as Product[],
      fudoProducts
    );

    return NextResponse.json({ report, count: report.length });
  } catch (error) {
    return handleApiError(error);
  }
}
