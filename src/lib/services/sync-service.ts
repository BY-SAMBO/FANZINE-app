import type { Product } from "@/types/product";
import type {
  SyncComparisonResult,
  SyncProductDiff,
  PriceReport,
} from "@/types/sync";
import type { FudoProduct } from "@/lib/fudo/types";
import { compareProducts } from "@/lib/fudo/normalizer";

/**
 * Compare all local products with Fudo products
 * Returns classification: synced, local_only, fudo_only, diffs
 */
export function compareAll(
  localProducts: Product[],
  fudoProducts: FudoProduct[]
): SyncComparisonResult {
  // Build lookup maps
  const fudoByCode = new Map<string, FudoProduct>();
  const fudoById = new Map<string, FudoProduct>();

  for (const fp of fudoProducts) {
    if (fp.attributes.code) {
      fudoByCode.set(fp.attributes.code, fp);
    }
    fudoById.set(fp.id, fp);
  }

  const matchedFudoIds = new Set<string>();
  const synced: SyncComparisonResult["synced"] = [];
  const diffs: SyncProductDiff[] = [];
  const localOnly: SyncComparisonResult["local_only"] = [];

  for (const local of localProducts) {
    // Try to match by fudo_id first, then by code (our product ID)
    const fudoMatch =
      (local.fudo_id ? fudoById.get(local.fudo_id) : undefined) ||
      fudoByCode.get(local.id);

    if (!fudoMatch) {
      localOnly.push({
        id: local.id,
        nombre: local.nombre,
        precio_venta: local.precio_venta,
        activo: local.activo,
      });
      continue;
    }

    matchedFudoIds.add(fudoMatch.id);

    const fieldDiffs = compareProducts(local, fudoMatch);

    if (fieldDiffs.length === 0) {
      synced.push({
        local_id: local.id,
        fudo_id: fudoMatch.id,
        nombre: local.nombre,
      });
    } else {
      diffs.push({
        local_id: local.id,
        fudo_id: fudoMatch.id,
        nombre: local.nombre,
        fields: fieldDiffs,
      });
    }
  }

  // Fudo products not matched to any local product
  const fudoOnly: SyncComparisonResult["fudo_only"] = [];
  for (const fp of fudoProducts) {
    if (!matchedFudoIds.has(fp.id)) {
      fudoOnly.push({
        fudo_id: fp.id,
        code: fp.attributes.code,
        name: fp.attributes.name,
        price: fp.attributes.price,
        active: fp.attributes.active,
      });
    }
  }

  return {
    synced,
    local_only: localOnly,
    fudo_only: fudoOnly,
    diffs,
    summary: {
      total_local: localProducts.length,
      total_fudo: fudoProducts.length,
      synced: synced.length,
      local_only: localOnly.length,
      fudo_only: fudoOnly.length,
      with_diffs: diffs.length,
    },
  };
}

/**
 * Generate price difference report
 */
export function generatePriceReport(
  localProducts: Product[],
  fudoProducts: FudoProduct[]
): PriceReport[] {
  const fudoByCode = new Map<string, FudoProduct>();
  const fudoById = new Map<string, FudoProduct>();

  for (const fp of fudoProducts) {
    if (fp.attributes.code) fudoByCode.set(fp.attributes.code, fp);
    fudoById.set(fp.id, fp);
  }

  const report: PriceReport[] = [];

  for (const local of localProducts) {
    const fudoMatch =
      (local.fudo_id ? fudoById.get(local.fudo_id) : undefined) ||
      fudoByCode.get(local.id);

    if (!fudoMatch) continue;

    const precioFudo = fudoMatch.attributes.price;
    if (local.precio_venta !== precioFudo) {
      const diferencia = precioFudo - local.precio_venta;
      const porcentaje =
        local.precio_venta > 0
          ? Math.round((diferencia / local.precio_venta) * 10000) / 100
          : 0;

      report.push({
        product_id: local.id,
        nombre: local.nombre,
        precio_local: local.precio_venta,
        precio_fudo: precioFudo,
        diferencia,
        porcentaje,
      });
    }
  }

  return report.sort(
    (a, b) => Math.abs(b.diferencia) - Math.abs(a.diferencia)
  );
}

/**
 * Get products pending sync (local_only or pending status)
 */
export function getPendingProducts(localProducts: Product[]): Product[] {
  return localProducts.filter(
    (p) =>
      p.fudo_sync_status === "pending" ||
      p.fudo_sync_status === "local_only"
  );
}
