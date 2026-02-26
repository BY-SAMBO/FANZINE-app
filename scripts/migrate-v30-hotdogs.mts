/**
 * migrate-v30-hotdogs.mts
 *
 * Migration script for v30 carta. Three steps:
 *
 * STEP 1: Create/rename products in Fudo + Supabase
 *   npx tsx scripts/migrate-v30-hotdogs.mts --step=1
 *
 * STEP 2 (MANUAL): Create modifier groups in Fudo web panel
 *   Go to fu.do panel → each plato fuerte → add modifier groups:
 *     - "Premium"                 max:1, min:0
 *     - "Combo"                   max:1, min:0
 *     - "Combo Acompañamiento"    max:1, min:1
 *     - "Combo Bebida"            max:1, min:1
 *   Then run step 2 to discover the created group IDs.
 *
 * STEP 3: Link product-modifiers (options) to groups
 *   npx tsx scripts/migrate-v30-hotdogs.mts --step=3
 *
 * FINAL: POST /api/pos/modifiers/sync to update cache
 *
 * NOTE: Fudo API does NOT support creating ProductModifiersGroups.
 * Groups must be created in the Fudo web panel, then linked via API.
 *
 * Flags:
 *   --dry-run    Log actions without making changes
 *   --step=N     Run only step N (1, 2, or 3)
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

// --- Config ---
const authUrl = process.env.FUDO_AUTH_URL || "https://auth.fu.do/api";
const apiUrl = process.env.FUDO_API_URL || "https://api.fu.do/v1alpha1";
const apiKey = process.env.FUDO_API_KEY || "";
const apiSecret = process.env.FUDO_API_SECRET || "";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const DRY_RUN = process.argv.includes("--dry-run");
const STEP = process.argv.find((a) => a.startsWith("--step="))?.split("=")[1];

// --- Fudo Auth ---
let token = "";

async function authenticate() {
  const res = await fetch(authUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey, apiSecret }),
  });
  if (!res.ok) throw new Error(`Auth failed: ${res.status}`);
  const data = (await res.json()) as { token: string };
  token = data.token;
  console.log("[Auth] OK");
}

async function api<T = unknown>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(apiUrl + path, {
    ...opts,
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
      ...opts?.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Fudo ${opts?.method || "GET"} ${path} → ${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}

// --- Supabase ---
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// --- Constants ---

// Fudo category IDs
const PERROS_CAT_FUDO = "5";
const ADICIONALES_CAT_FUDO = "15";
const BEBIDAS_CAT_FUDO = "11";

// Supabase category UUIDs
const PERROS_CAT_UUID = "ff26c9db-94eb-4cc8-9044-a19722a8e26a";
const ADICIONALES_CAT_UUID = "6a0375a6-8d7a-4c11-9971-406cec0c3bca";
const BEBIDAS_CAT_UUID = "b463696d-f5ac-413c-89ec-613d12589f78";

// Platos fuertes that get Combo modifier (fudo product IDs)
const PLATOS_FUERTES_FUDO_IDS = [
  // Perros
  "10", "31", "12", "11", "50", "86", "87", "88", "89", "90",
  // Nachos
  "20", "21", "34", "74",
  // Tacos
  "23", "24", "66",
  // Chicanitas
  "13", "14", "67",
  // Tex-Mex (alitas, mac&cheese, pollo popcorn)
  "51", "52", "53",
];

// Existing crispeta personal product fudo IDs
const CRISPETA_SAL_FUDO = "16";
const CRISPETA_DULCE_FUDO = "30";
const CRISPETA_MIXTA_FUDO = "46";

// Existing papas fosforito
const PAPAS_FUDO = "39";

// --- Tracking ---
const created: Record<string, string> = {}; // key -> fudo id

// --- Fudo types ---
interface FudoProductModifiersGroup {
  type: "ProductModifiersGroup";
  id: string;
  attributes: {
    name: string;
    maxQuantity: number;
    minQuantity: number;
  };
  relationships: {
    productModifiers: {
      data: { type: "ProductModifier"; id: string }[];
    };
  };
}

// ====================================================================
// STEP 1: Rename existing + Create new products
// ====================================================================

async function step1_products() {
  console.log("\n=== STEP 1: Products ===\n");

  // 1a. Rename Perro con Toppings → Zinema
  console.log("[Rename] fudo:10 → Zinema");
  if (!DRY_RUN) {
    await api(`/products/10`, {
      method: "PATCH",
      body: JSON.stringify({
        data: { type: "Product", id: "10", attributes: { name: "Zinema" } },
      }),
    });
    await supabase
      .from("products")
      .update({ nombre: "Zinema", updated_at: new Date().toISOString() })
      .eq("fudo_id", "10");
    console.log("  ✓ Fudo + Supabase updated");
  }

  // 1b. Rename Perro SalchiBirria → Birria Fusión
  console.log("[Rename] fudo:31 → Birria Fusión");
  if (!DRY_RUN) {
    await api(`/products/31`, {
      method: "PATCH",
      body: JSON.stringify({
        data: { type: "Product", id: "31", attributes: { name: "Birria Fusión" } },
      }),
    });
    await supabase
      .from("products")
      .update({ nombre: "Birria Fusión", updated_at: new Date().toISOString() })
      .eq("fudo_id", "31");
    console.log("  ✓ Fudo + Supabase updated");
  }

  // 1c. Create BBQ Bacon
  console.log("[Create] BBQ Bacon (Perros)");
  if (!DRY_RUN) {
    const res = await api<{ data: { id: string } }>(`/products`, {
      method: "POST",
      body: JSON.stringify({
        data: {
          type: "Product",
          attributes: { name: "BBQ Bacon", code: "PE-BBQ-001", price: 0 },
          relationships: {
            productCategory: { data: { type: "ProductCategory", id: PERROS_CAT_FUDO } },
          },
        },
      }),
    });
    created["bbq_bacon"] = res.data.id;
    console.log(`  ✓ Created fudo:${res.data.id}`);

    await supabase.from("products").insert({
      id: "PE-BBQ",
      nombre: "BBQ Bacon",
      slug: "bbq-bacon",
      categoria_id: PERROS_CAT_UUID,
      precio_venta: 0,
      fudo_id: res.data.id,
      fudo_sync_status: "synced",
      fudo_synced_at: new Date().toISOString(),
      activo: true,
      visible_menu: true,
      disponible_local: true,
    });
    console.log("  ✓ Supabase inserted");
  }

  // 1d. Create Tropical Fuego
  console.log("[Create] Tropical Fuego (Perros)");
  if (!DRY_RUN) {
    const res = await api<{ data: { id: string } }>(`/products`, {
      method: "POST",
      body: JSON.stringify({
        data: {
          type: "Product",
          attributes: { name: "Tropical Fuego", code: "PE-TROP-001", price: 0 },
          relationships: {
            productCategory: { data: { type: "ProductCategory", id: PERROS_CAT_FUDO } },
          },
        },
      }),
    });
    created["tropical_fuego"] = res.data.id;
    console.log(`  ✓ Created fudo:${res.data.id}`);

    await supabase.from("products").insert({
      id: "PE-TROP",
      nombre: "Tropical Fuego",
      slug: "tropical-fuego",
      categoria_id: PERROS_CAT_UUID,
      precio_venta: 0,
      fudo_id: res.data.id,
      fudo_sync_status: "synced",
      fudo_synced_at: new Date().toISOString(),
      activo: true,
      visible_menu: true,
      disponible_local: true,
    });
    console.log("  ✓ Supabase inserted");
  }

  // 1e. Create Tocineta modifier product (Adicionales, $2000)
  console.log("[Create] Tocineta modifier product (Adicionales, $2000)");
  if (!DRY_RUN) {
    const res = await api<{ data: { id: string } }>(`/products`, {
      method: "POST",
      body: JSON.stringify({
        data: {
          type: "Product",
          attributes: { name: "Tocineta", code: "MOD-TOCINETA", price: 2000 },
          relationships: {
            productCategory: { data: { type: "ProductCategory", id: ADICIONALES_CAT_FUDO } },
          },
        },
      }),
    });
    created["tocineta"] = res.data.id;
    console.log(`  ✓ Created fudo:${res.data.id}`);

    await supabase.from("products").insert({
      id: "MOD-TOCINETA",
      nombre: "Tocineta",
      slug: "tocineta",
      categoria_id: ADICIONALES_CAT_UUID,
      precio_venta: 2000,
      fudo_id: res.data.id,
      fudo_sync_status: "synced",
      fudo_synced_at: new Date().toISOString(),
      activo: true,
      visible_menu: false,
      disponible_local: true,
    });
    console.log("  ✓ Supabase inserted");
  }

  // 1f. Create Combo virtual product (Adicionales, $7000)
  console.log("[Create] Combo virtual product (Adicionales, $7000)");
  if (!DRY_RUN) {
    const res = await api<{ data: { id: string } }>(`/products`, {
      method: "POST",
      body: JSON.stringify({
        data: {
          type: "Product",
          attributes: { name: "Combo", code: "MOD-COMBO", price: 7000 },
          relationships: {
            productCategory: { data: { type: "ProductCategory", id: ADICIONALES_CAT_FUDO } },
          },
        },
      }),
    });
    created["combo"] = res.data.id;
    console.log(`  ✓ Created fudo:${res.data.id}`);

    await supabase.from("products").insert({
      id: "MOD-COMBO",
      nombre: "Combo",
      slug: "combo",
      categoria_id: ADICIONALES_CAT_UUID,
      precio_venta: 7000,
      fudo_id: res.data.id,
      fudo_sync_status: "synced",
      fudo_synced_at: new Date().toISOString(),
      activo: true,
      visible_menu: false,
      disponible_local: true,
    });
    console.log("  ✓ Supabase inserted");
  }

  // 1g. Create combo beverages
  const comboBeverages = [
    { name: "Quatro", code: "BEB-QUATRO" },
    { name: "Coca-Cola 250", code: "BEB-COCA250" },
    { name: "Cola Román", code: "BEB-ROMAN" },
  ];

  for (const bev of comboBeverages) {
    console.log(`[Create] ${bev.name} (Bebidas, combo sub-selection)`);
    if (!DRY_RUN) {
      const res = await api<{ data: { id: string } }>(`/products`, {
        method: "POST",
        body: JSON.stringify({
          data: {
            type: "Product",
            attributes: { name: bev.name, code: bev.code, price: 0 },
            relationships: {
              productCategory: { data: { type: "ProductCategory", id: BEBIDAS_CAT_FUDO } },
            },
          },
        }),
      });
      created[bev.code] = res.data.id;
      console.log(`  ✓ Created fudo:${res.data.id}`);

      await supabase.from("products").insert({
        id: bev.code,
        nombre: bev.name,
        slug: bev.name.toLowerCase().replace(/\s+/g, "-"),
        categoria_id: BEBIDAS_CAT_UUID,
        precio_venta: 0,
        fudo_id: res.data.id,
        fudo_sync_status: "synced",
        fudo_synced_at: new Date().toISOString(),
        activo: true,
        visible_menu: false,
        disponible_local: true,
      });
      console.log("  ✓ Supabase inserted");
    }
  }

  console.log("\n[Step 1] Done. Created products:", created);
  console.log("\n╔═══════════════════════════════════════════════════════════════╗");
  console.log("║  NEXT: Go to Fudo web panel and create modifier groups      ║");
  console.log("║  on EACH plato fuerte product:                              ║");
  console.log("║                                                             ║");
  console.log("║  1. 'Premium'                (max:1, min:0)                 ║");
  console.log("║  2. 'Combo'                  (max:1, min:0)                 ║");
  console.log("║  3. 'Combo Acompañamiento'   (max:1, min:1)                ║");
  console.log("║  4. 'Combo Bebida'           (max:1, min:1)                 ║");
  console.log("║                                                             ║");
  console.log("║  Then run: npx tsx scripts/migrate-v30-hotdogs.mts --step=2 ║");
  console.log("╚═══════════════════════════════════════════════════════════════╝");
}

// ====================================================================
// STEP 2: Discover modifier groups created in Fudo web panel
// ====================================================================

async function step2_discover() {
  console.log("\n=== STEP 2: Discover Modifier Groups ===\n");

  // Scan a reference product (Zinema fudo:10) for the new groups
  const refProductId = "10";
  console.log(`[Scan] Fetching product fudo:${refProductId} with modifier groups...`);

  const res = await api<{
    data: { attributes: { name: string } };
    included?: FudoProductModifiersGroup[];
  }>(`/products/${refProductId}?include=productModifiersGroups`);

  const groups = (res.included || []).filter(
    (r): r is FudoProductModifiersGroup => r.type === "ProductModifiersGroup"
  );

  console.log(`\nFound ${groups.length} modifier group(s) on "${res.data.attributes.name}":\n`);

  const discoveredGroups: Record<string, string> = {};

  for (const g of groups) {
    const label =
      g.attributes.name === "Toppings"
        ? "(existing toppings — skip)"
        : g.attributes.name.startsWith("Combo") && !g.attributes.name.includes("Acompañ") && !g.attributes.name.includes("Bebida") && g.attributes.minQuantity === 0
          ? "→ COMBO TOGGLE"
          : g.attributes.name.includes("Acompañ")
            ? "→ COMBO ACOMPAÑAMIENTO"
            : g.attributes.name.includes("Bebida")
              ? "→ COMBO BEBIDA"
              : g.attributes.name === "Premium" || g.attributes.name.includes("Tocineta")
                ? "→ PREMIUM"
                : "(unknown)";

    console.log(`  Group ${g.id} | "${g.attributes.name}" | max:${g.attributes.maxQuantity} min:${g.attributes.minQuantity} | ${label}`);
    discoveredGroups[g.attributes.name] = g.id;
  }

  // Check if all required groups exist
  const required = ["Premium", "Combo", "Combo Acompañamiento", "Combo Bebida"];
  const missing = required.filter((name) => !discoveredGroups[name]);

  if (missing.length > 0) {
    console.log(`\n⚠ MISSING groups on product ${refProductId}: ${missing.join(", ")}`);
    console.log("  Create them in Fudo web panel first, then re-run --step=2");
    console.log("\n  The group names MUST match exactly:");
    for (const name of missing) {
      console.log(`    - "${name}"`);
    }
    return;
  }

  console.log("\n✓ All required groups found!");
  console.log("\nDiscovered group IDs:");
  for (const [name, id] of Object.entries(discoveredGroups)) {
    console.log(`  ${name} = ${id}`);
  }

  // Now scan ALL platos fuertes to see which ones have the groups
  console.log("\n[Scan] Checking all platos fuertes for modifier groups...\n");

  const allProducts = [...PLATOS_FUERTES_FUDO_IDS];
  // Also check new products from DB
  const { data: newProds } = await supabase
    .from("products")
    .select("fudo_id")
    .in("id", ["PE-BBQ", "PE-TROP"])
    .not("fudo_id", "is", null);

  for (const p of newProds || []) {
    if (p.fudo_id && !allProducts.includes(p.fudo_id)) {
      allProducts.push(p.fudo_id);
    }
  }

  const productStatus: { id: string; name: string; groups: string[] }[] = [];

  for (const prodId of allProducts) {
    try {
      const pRes = await api<{
        data: { attributes: { name: string }; relationships: { productModifiersGroups: { data: { id: string }[] } } };
      }>(`/products/${prodId}?include=productModifiersGroups`);

      const gIds = pRes.data.relationships.productModifiersGroups.data.map((d) => d.id);
      productStatus.push({
        id: prodId,
        name: pRes.data.attributes.name,
        groups: gIds,
      });

      const hasAll = required.every((name) => gIds.includes(discoveredGroups[name]));
      const marker = hasAll ? "✓" : "⚠";
      console.log(`  ${marker} fudo:${prodId} "${pRes.data.attributes.name}" → groups: [${gIds.join(",")}]`);
    } catch (err) {
      console.error(`  ✗ fudo:${prodId}: ${(err as Error).message}`);
    }
  }

  const incomplete = productStatus.filter(
    (p) => !required.every((name) => p.groups.includes(discoveredGroups[name]))
  );

  if (incomplete.length > 0) {
    console.log(`\n⚠ ${incomplete.length} products missing groups. Add them in Fudo web panel:`);
    for (const p of incomplete) {
      const missingForProduct = required.filter((name) => !p.groups.includes(discoveredGroups[name]));
      console.log(`  fudo:${p.id} "${p.name}" → missing: ${missingForProduct.join(", ")}`);
    }
    console.log("\nRe-run --step=2 after adding groups.");
  } else {
    console.log(`\n✓ All ${productStatus.length} products have all required groups!`);
    console.log("\nReady for step 3:");
    console.log("  npx tsx scripts/migrate-v30-hotdogs.mts --step=3");
    console.log(`\nGroup IDs to use (auto-detected):`);
    console.log(`  PREMIUM_GROUP_ID=${discoveredGroups["Premium"]}`);
    console.log(`  COMBO_GROUP_ID=${discoveredGroups["Combo"]}`);
    console.log(`  COMBO_ACOMP_GROUP_ID=${discoveredGroups["Combo Acompañamiento"]}`);
    console.log(`  COMBO_BEBIDA_GROUP_ID=${discoveredGroups["Combo Bebida"]}`);
  }
}

// ====================================================================
// STEP 3: Link product-modifiers (options) to discovered groups
// ====================================================================

async function step3_link() {
  console.log("\n=== STEP 3: Link Product-Modifiers ===\n");

  // First discover group IDs from reference product (Zinema)
  const res = await api<{
    data: { attributes: { name: string } };
    included?: FudoProductModifiersGroup[];
  }>(`/products/10?include=productModifiersGroups`);

  const groups = (res.included || []).filter(
    (r): r is FudoProductModifiersGroup => r.type === "ProductModifiersGroup"
  );

  const groupMap: Record<string, string> = {};
  for (const g of groups) {
    groupMap[g.attributes.name] = g.id;
  }

  const premiumGroupId = groupMap["Premium"];
  const comboGroupId = groupMap["Combo"];
  const comboAcompGroupId = groupMap["Combo Acompañamiento"];
  const comboBebidaGroupId = groupMap["Combo Bebida"];

  if (!premiumGroupId || !comboGroupId || !comboAcompGroupId || !comboBebidaGroupId) {
    console.error("Missing group IDs! Run --step=2 first.");
    console.log("Found:", groupMap);
    return;
  }

  console.log("Group IDs:", groupMap);

  // Resolve product fudo IDs for modifier options from Supabase
  const { data: modProducts } = await supabase
    .from("products")
    .select("id, nombre, fudo_id")
    .in("id", [
      "MOD-TOCINETA", "MOD-COMBO",
      "BEB-QUATRO", "BEB-COCA250", "BEB-ROMAN",
    ]);

  const modMap: Record<string, string> = {};
  for (const p of modProducts || []) {
    if (p.fudo_id) modMap[p.id] = p.fudo_id;
  }

  console.log("Modifier product fudo IDs:", modMap);

  const tocinetaFudoId = modMap["MOD-TOCINETA"];
  const comboFudoId = modMap["MOD-COMBO"];
  const quatroFudoId = modMap["BEB-QUATRO"];
  const coca250FudoId = modMap["BEB-COCA250"];
  const romanFudoId = modMap["BEB-ROMAN"];

  if (!tocinetaFudoId || !comboFudoId) {
    console.error("Missing modifier product IDs! Run --step=1 first.");
    return;
  }

  // Resolve new hot dog fudo IDs
  const { data: newHotdogs } = await supabase
    .from("products")
    .select("id, fudo_id")
    .in("id", ["PE-BBQ", "PE-TROP"])
    .not("fudo_id", "is", null);

  const allPlatosFuertes = [...PLATOS_FUERTES_FUDO_IDS];
  for (const p of newHotdogs || []) {
    if (p.fudo_id && !allPlatosFuertes.includes(p.fudo_id)) {
      allPlatosFuertes.push(p.fudo_id);
    }
  }

  // Helper: POST /product-modifiers
  async function createPM(
    toppingProductId: string,
    groupId: string,
    price: number,
    maxQuantity: number = 1
  ): Promise<string> {
    if (DRY_RUN) return "dry-run";

    const pmRes = await api<{ data: { id: string } }>(`/product-modifiers`, {
      method: "POST",
      body: JSON.stringify({
        data: {
          type: "ProductModifier",
          attributes: { price, maxQuantity },
          relationships: {
            product: { data: { type: "Product", id: toppingProductId } },
            productModifiersGroup: { data: { type: "ProductModifiersGroup", id: groupId } },
          },
        },
      }),
    });
    return pmRes.data.id;
  }

  // Now we need to understand: in Fudo, a ProductModifier links a TOPPING product
  // to a ProductModifiersGroup. The group is already associated to the parent product
  // (done in Fudo web panel). So we only need to create one PM per topping-option per group.
  // The same PM applies to ALL products that have that group.

  // 3a. Premium group: add Tocineta
  console.log("\n[Link] Premium → Tocineta");
  try {
    const pmId = await createPM(tocinetaFudoId, premiumGroupId, 2000, 1);
    console.log(`  ✓ PM ${pmId} (Tocineta → Premium group ${premiumGroupId})`);
  } catch (err) {
    console.error(`  ✗`, (err as Error).message);
  }

  // 3b. Combo group: add Combo virtual product
  console.log("[Link] Combo → Combo virtual product");
  try {
    const pmId = await createPM(comboFudoId, comboGroupId, 7000, 1);
    console.log(`  ✓ PM ${pmId} (Combo → Combo group ${comboGroupId})`);
  } catch (err) {
    console.error(`  ✗`, (err as Error).message);
  }

  // 3c. Combo Acompañamiento: add Papas + Crispetas
  const acompOptions = [
    { id: PAPAS_FUDO, name: "Papas Fosforito" },
    { id: CRISPETA_SAL_FUDO, name: "Crispeta Sal" },
    { id: CRISPETA_DULCE_FUDO, name: "Crispeta Dulce" },
    { id: CRISPETA_MIXTA_FUDO, name: "Crispeta Mixta" },
  ];

  console.log("[Link] Combo Acompañamiento → 4 options");
  for (const opt of acompOptions) {
    try {
      const pmId = await createPM(opt.id, comboAcompGroupId, 0, 1);
      console.log(`  ✓ PM ${pmId} (${opt.name} → Acomp group ${comboAcompGroupId})`);
    } catch (err) {
      console.error(`  ✗ ${opt.name}:`, (err as Error).message);
    }
  }

  // 3d. Combo Bebida: add beverages
  const bebidaOptions = [
    { id: quatroFudoId, name: "Quatro" },
    { id: coca250FudoId, name: "Coca-Cola 250" },
    { id: romanFudoId, name: "Cola Román" },
  ].filter((b) => b.id);

  console.log(`[Link] Combo Bebida → ${bebidaOptions.length} options`);
  for (const opt of bebidaOptions) {
    try {
      const pmId = await createPM(opt.id, comboBebidaGroupId, 0, 1);
      console.log(`  ✓ PM ${pmId} (${opt.name} → Bebida group ${comboBebidaGroupId})`);
    } catch (err) {
      console.error(`  ✗ ${opt.name}:`, (err as Error).message);
    }
  }

  console.log("\n[Step 3] Done.");
  console.log("\n╔═══════════════════════════════════════════════════════╗");
  console.log("║  FINAL STEP: Sync modifier cache                    ║");
  console.log("║                                                     ║");
  console.log("║  With dev server running (npm run dev -- -p 4000):  ║");
  console.log("║  Browser console (logged in as admin):              ║");
  console.log("║                                                     ║");
  console.log("║  fetch('/api/pos/modifiers/sync', {method:'POST'})  ║");
  console.log("║    .then(r=>r.json()).then(console.log)             ║");
  console.log("║                                                     ║");
  console.log("║  Then reload /pos/caja                              ║");
  console.log("╚═══════════════════════════════════════════════════════╝");
}

// ====================================================================
// MAIN
// ====================================================================

async function main() {
  console.log("=== Migrate v30 Hot Dogs ===");
  console.log(`Mode: ${DRY_RUN ? "DRY RUN" : "LIVE"}`);
  if (STEP) console.log(`Step filter: ${STEP}`);
  console.log("");

  await authenticate();

  if (!STEP || STEP === "1") {
    await step1_products();
  }

  if (STEP === "2") {
    await step2_discover();
  }

  if (STEP === "3") {
    await step3_link();
  }

  if (!STEP) {
    console.log("\n[Info] Run with --step=1, --step=2, or --step=3");
    console.log("  Step 1: Create/rename products");
    console.log("  Step 2: Verify modifier groups (created in Fudo web panel)");
    console.log("  Step 3: Link product-modifiers to groups");
  }

  console.log("\n=== Done ===");
}

main().catch((err) => {
  console.error("\n[FATAL]", err);
  process.exit(1);
});
