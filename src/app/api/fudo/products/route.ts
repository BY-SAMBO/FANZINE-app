import { NextResponse } from "next/server";
import { getAllFudoProducts } from "@/lib/fudo/client";
import { handleApiError } from "@/lib/utils/errors";

export async function GET() {
  try {
    const products = await getAllFudoProducts();
    return NextResponse.json({ data: products, count: products.length });
  } catch (error) {
    return handleApiError(error);
  }
}
