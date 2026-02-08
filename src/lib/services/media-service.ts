import { createClient } from "@/lib/supabase/client";

const BUCKET = "product-images";

/**
 * Upload a product image to Supabase Storage
 */
export async function uploadProductImage(
  productId: string,
  file: File
): Promise<string> {
  const supabase = createClient();
  const timestamp = Date.now();
  const extension = file.name.split(".").pop() || "png";
  const path = `${productId}/${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}.${extension}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) throw error;

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(path);

  return publicUrl;
}

/**
 * Set a product's main photo
 */
export async function setMainPhoto(productId: string, url: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("products")
    .update({
      foto_principal: url,
      checklist_foto_principal: true,
    })
    .eq("id", productId);

  if (error) throw error;
}

/**
 * Add image to product gallery
 */
export async function addToGallery(productId: string, url: string) {
  const supabase = createClient();

  // Get current gallery
  const { data: product, error: fetchError } = await supabase
    .from("products")
    .select("galeria")
    .eq("id", productId)
    .single();

  if (fetchError) throw fetchError;

  const gallery = [...(product.galeria || []), url];

  const { error } = await supabase
    .from("products")
    .update({ galeria: gallery })
    .eq("id", productId);

  if (error) throw error;
}

/**
 * Remove image from gallery
 */
export async function removeFromGallery(productId: string, url: string) {
  const supabase = createClient();

  const { data: product, error: fetchError } = await supabase
    .from("products")
    .select("galeria")
    .eq("id", productId)
    .single();

  if (fetchError) throw fetchError;

  const gallery = (product.galeria || []).filter((u: string) => u !== url);

  const { error } = await supabase
    .from("products")
    .update({ galeria: gallery })
    .eq("id", productId);

  if (error) throw error;
}

/**
 * List images in a product's storage folder
 */
export async function listProductImages(productId: string) {
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .list(productId, { sortBy: { column: "created_at", order: "desc" } });

  if (error) throw error;

  return (data || []).map((file) => {
    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET).getPublicUrl(`${productId}/${file.name}`);
    return {
      name: file.name,
      url: publicUrl,
      created_at: file.created_at,
    };
  });
}
