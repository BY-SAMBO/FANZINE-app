import type { Product } from "@/types/product";
import type {
  DeliveryModule,
  DeliveryCategoryTemplate,
  DeliveryProductConfig,
  ResolvedDeliveryModule,
  DeliveryModuleItem,
} from "@/types/delivery";
import { detectIngredients } from "@/lib/config/ingredientes";

/**
 * Hybrid delivery builder - resolves the final delivery config for a product
 * Priority: Product overrides > Category template > Module defaults
 *
 * 7-step process:
 * 1. Load base modules from delivery_modules table
 * 2. Load category template for the product's category
 * 3. Get product-level overrides from product.delivery_config
 * 4. Filter modules based on template config (habilitado)
 * 5. Apply template-level overrides (max_items, items_override)
 * 6. Apply product-level overrides
 * 7. Auto-detect ingredients for "quitar" module
 */
export function resolveDeliveryConfig(
  product: Product,
  modules: DeliveryModule[],
  categoryTemplate: DeliveryCategoryTemplate | null,
  productConfig?: DeliveryProductConfig | null
): ResolvedDeliveryModule[] {
  if (!categoryTemplate) return [];

  const moduleMap = new Map(modules.map((m) => [m.id, m]));
  const resolved: ResolvedDeliveryModule[] = [];

  // Step 1-3: Get ordered module IDs from template
  const moduleOrder = productConfig?.modulos || categoryTemplate.modulos_orden;

  for (const moduleId of moduleOrder) {
    const baseModule = moduleMap.get(moduleId);
    if (!baseModule) continue;

    // Step 4: Check if module is enabled in template config
    const templateConfig = categoryTemplate.config[moduleId];
    if (templateConfig && !templateConfig.habilitado) continue;

    // Step 5: Apply template overrides
    let maxItems = baseModule.max_items;
    let items: DeliveryModuleItem[] = [...baseModule.catalogo];

    if (templateConfig) {
      if (templateConfig.max_items !== undefined) {
        maxItems = templateConfig.max_items;
      }
      if (templateConfig.items_override) {
        items = templateConfig.items_override;
      }
    }

    // Step 6: Apply product-level overrides
    const productOverride = productConfig?.overrides?.[moduleId];
    if (productOverride) {
      if (productOverride.habilitado === false) continue;
      if (productOverride.max_items !== undefined) {
        maxItems = productOverride.max_items;
      }
      if (productOverride.items_override) {
        items = productOverride.items_override;
      }
    }

    // Step 7: Auto-detect ingredients for "quitar" module
    if (moduleId === "quitar" && product.descripcion_corta) {
      const detected = detectIngredients(product.descripcion_corta);
      if (detected.length > 0) {
        // Merge auto-detected with existing items
        const existingNames = new Set(items.map((i) => i.nombre.toLowerCase()));
        for (const ingredient of detected) {
          const quitarName = `Sin ${ingredient.toLowerCase()}`;
          if (!existingNames.has(quitarName.toLowerCase())) {
            items.push({ nombre: quitarName, precio: 0, activo: true });
          }
        }
      }
    }

    resolved.push({
      id: moduleId,
      titulo: baseModule.titulo,
      tipo: baseModule.tipo,
      max_items: maxItems,
      items: items.filter((i) => i.activo),
    });
  }

  return resolved;
}
