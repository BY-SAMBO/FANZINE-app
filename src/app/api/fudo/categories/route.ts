import { NextResponse } from "next/server";
import { getAllFudoCategories } from "@/lib/fudo/client";
import { handleApiError } from "@/lib/utils/errors";

export async function GET() {
  try {
    const categories = await getAllFudoCategories();
    return NextResponse.json({ data: categories, count: categories.length });
  } catch (error) {
    return handleApiError(error);
  }
}
