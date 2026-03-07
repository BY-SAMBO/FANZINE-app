import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { generateProductImage } from "@/lib/services/ai-image-service";
import { handleApiError } from "@/lib/utils/errors";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    // 1. Auth check
    const authClient = await createServerClient();
    const {
      data: { user },
    } = await authClient.auth.getUser();

    // 2. Parse body
    const {
      productId,
      promptOverride,
      promptExtra,
      model,
      imageSize,
      includeRefs,
      addToGallery,
    } = await req.json();

    if (!productId) {
      return NextResponse.json(
        { error: "productId requerido" },
        { status: 400 }
      );
    }

    // 3. Service role client for DB + Storage
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 4. Load product
    const { data: product, error: fetchErr } = await supabase
      .from("products")
      .select("id, nombre, prompt_ia, foto_principal, galeria")
      .eq("id", productId)
      .single();

    if (fetchErr || !product) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    // 5. Determine prompt
    const prompt = promptOverride || product.prompt_ia;
    if (!prompt) {
      return NextResponse.json(
        { error: "Producto sin prompt de IA configurado" },
        { status: 400 }
      );
    }

    // 6. Collect reference URLs if requested
    const referenceImageUrls: string[] = [];
    if (includeRefs) {
      if (product.foto_principal) referenceImageUrls.push(product.foto_principal);
      const extraRefs = (product.galeria || [])
        .filter((u: string) => u !== product.foto_principal)
        .slice(0, 2);
      referenceImageUrls.push(...extraRefs);
    }

    // 7. Generate image
    const result = await generateProductImage({
      prompt,
      promptExtra,
      referenceImageUrls: referenceImageUrls.length > 0 ? referenceImageUrls : undefined,
      model: model || "pro",
      imageSize: imageSize || "1K",
    });

    // 8. Upload to Supabase Storage
    const timestamp = Date.now();
    const storagePath = `${productId}/ai_${timestamp}.png`;
    const { error: uploadErr } = await supabase.storage
      .from("product-images")
      .upload(storagePath, result.imageBuffer, {
        contentType: "image/png",
        cacheControl: "3600",
      });

    if (uploadErr) throw uploadErr;

    const {
      data: { publicUrl },
    } = supabase.storage.from("product-images").getPublicUrl(storagePath);

    // 9. Add to gallery if requested
    if (addToGallery) {
      const gallery = [...(product.galeria || []), publicUrl];
      await supabase
        .from("products")
        .update({ galeria: gallery })
        .eq("id", productId);
    }

    // 10. Return result
    return NextResponse.json({
      success: true,
      imageUrl: publicUrl,
      productId: product.id,
      durationMs: result.durationMs,
      promptUsed: result.promptUsed,
      model: result.model,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
