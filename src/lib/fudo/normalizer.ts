import type { Product } from "@/types/product";
import type { FudoProduct, FudoProductPayload } from "./types";

/**
 * Normalize Fudo API product → FANZINE product format
 * Used when pulling data FROM Fudo
 */
export function normalizeFudoProduct(
  fudoProduct: FudoProduct
): Partial<Product> {
  const attrs = fudoProduct.attributes;
  const categoryRelation =
    fudoProduct.relationships?.productCategory?.data;

  return {
    fudo_id: fudoProduct.id,
    nombre: attrs.name,
    // Fudo's code field maps to our ID
    id: attrs.code || undefined,
    precio_venta: attrs.price,
    descripcion_corta: attrs.description || null,
    activo: attrs.active,
    foto_principal: attrs.image || null,
    // Category mapping requires lookup by fudo_category_id
    ...(categoryRelation && {
      // Will need to be resolved via category lookup
      _fudo_category_id: categoryRelation.id,
    }),
  } as Partial<Product> & { _fudo_category_id?: string };
}

/**
 * Denormalize FANZINE product → Fudo API payload format
 * Used when pushing data TO Fudo
 */
export function denormalizeToPush(
  product: Product,
  fudoCategoryId?: string | null
): FudoProductPayload {
  const payload: FudoProductPayload = {
    data: {
      type: "Product",
      attributes: {
        name: product.nombre,
        code: product.id, // Our ID becomes Fudo's code
        description: product.descripcion_corta || undefined,
        price: product.precio_venta,
      },
    },
  };

  // Add category relationship if fudo_category_id is available
  const catId = fudoCategoryId;
  if (catId) {
    payload.data.relationships = {
      productCategory: {
        data: { type: "ProductCategory", id: catId },
      },
    };
  }

  return payload;
}

/**
 * Compare a local product with a Fudo product and return differences
 */
export function compareProducts(
  local: Product,
  fudo: FudoProduct
): { field: string; local_value: unknown; fudo_value: unknown }[] {
  const diffs: { field: string; local_value: unknown; fudo_value: unknown }[] = [];
  const attrs = fudo.attributes;

  if (local.nombre !== attrs.name) {
    diffs.push({
      field: "nombre",
      local_value: local.nombre,
      fudo_value: attrs.name,
    });
  }

  if (local.precio_venta !== attrs.price) {
    diffs.push({
      field: "precio_venta",
      local_value: local.precio_venta,
      fudo_value: attrs.price,
    });
  }

  if ((local.descripcion_corta || "") !== (attrs.description || "")) {
    diffs.push({
      field: "descripcion_corta",
      local_value: local.descripcion_corta,
      fudo_value: attrs.description,
    });
  }

  if (local.activo !== attrs.active) {
    diffs.push({
      field: "activo",
      local_value: local.activo,
      fudo_value: attrs.active,
    });
  }

  return diffs;
}
