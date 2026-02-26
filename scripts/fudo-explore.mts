import { config } from "dotenv";
config({ path: ".env.local" });

const authUrl = process.env.FUDO_AUTH_URL || "https://auth.fu.do/api";
const apiUrl = process.env.FUDO_API_URL || "https://api.fu.do/v1alpha1";
const apiKey = process.env.FUDO_API_KEY || "";
const apiSecret = process.env.FUDO_API_SECRET || "";

const authRes = await fetch(authUrl, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ apiKey, apiSecret }),
});
const authData = (await authRes.json()) as { token: string };
const token = authData.token;
console.log("Auth OK");

async function api(path: string, opts?: RequestInit) {
  const res = await fetch(apiUrl + path, {
    ...opts,
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
      ...opts?.headers,
    },
  });
  return res.json() as Promise<any>;
}

// Categories
const cats = await api("/product-categories?page[size]=50");
console.log("\n=== CATEGORIES ===");
for (const c of cats.data) {
  console.log(c.id, "|", c.attributes.name);
}

// Products
const prods = await api("/products?page[size]=200");

const toppingCat = cats.data.find((c: any) =>
  c.attributes.name.toLowerCase().includes("topping")
);
const adicCat = cats.data.find((c: any) =>
  c.attributes.name.toLowerCase().includes("adicional")
);

console.log("\n=== TOPPING CAT ===", toppingCat?.id, "|", toppingCat?.attributes?.name);
console.log("=== ADICIONAL CAT ===", adicCat?.id, "|", adicCat?.attributes?.name);

console.log("\n=== PRODUCTS IN TOPPINGS ===");
for (const p of prods.data) {
  const catId = p.relationships?.productCategory?.data?.id;
  if (catId === toppingCat?.id) {
    console.log(p.id, "|", p.attributes.name, "| $" + p.attributes.price);
  }
}

console.log("\n=== PRODUCTS IN ADICIONALES ===");
for (const p of prods.data) {
  const catId = p.relationships?.productCategory?.data?.id;
  if (catId === adicCat?.id) {
    console.log(p.id, "|", p.attributes.name, "| $" + p.attributes.price);
  }
}

// Modifier groups
console.log("\n=== MODIFIER GROUPS ===");
try {
  const mgroups = await api("/modifier-groups?page[size]=50");
  const mgData = Array.isArray(mgroups.data) ? mgroups.data : [mgroups.data].filter(Boolean);
  for (const g of mgData) {
    console.log(g.id, "|", g.attributes.name, "| max:", g.attributes.maxQuantity, "| min:", g.attributes.minQuantity);
  }
} catch (e: any) { console.log("Error:", e.message); }

// Product-modifiers
console.log("\n=== PRODUCT-MODIFIERS ===");
try {
  const pmods = await api("/product-modifiers?page[size]=100");
  const pmData = Array.isArray(pmods.data) ? pmods.data : [pmods.data].filter(Boolean);
  for (const pm of pmData) {
    const prodRel = pm.relationships?.product?.data;
    const groupRel = pm.relationships?.modifierGroup?.data;
    console.log(pm.id, "| product:", prodRel?.id, "| group:", groupRel?.id);
  }
} catch (e: any) { console.log("Error:", e.message); }

// Modifiers
console.log("\n=== MODIFIERS ===");
try {
  let page = 1;
  let hasMore = true;
  while (hasMore) {
    const mods = await api("/modifiers?page[size]=50&page[number]=" + page);
    const modData = Array.isArray(mods.data) ? mods.data : [mods.data].filter(Boolean);
    for (const m of modData) {
      const groupRel = m.relationships?.modifierGroup?.data;
      const prodRel = m.relationships?.product?.data;
      console.log(m.id, "|", m.attributes.name, "| price:", m.attributes.price, "| group:", groupRel?.id, "| product:", prodRel?.id);
    }
    hasMore = modData.length === 50;
    page++;
  }
} catch (e: any) { console.log("Error:", e.message); }
