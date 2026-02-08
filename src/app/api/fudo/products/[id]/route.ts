import { NextResponse } from "next/server";
import { getFudoProduct } from "@/lib/fudo/client";
import { handleApiError } from "@/lib/utils/errors";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = await getFudoProduct(id);
    return NextResponse.json({ data: product });
  } catch (error) {
    return handleApiError(error);
  }
}
