// Delivery markup factor
export const DELIVERY_MARKUP = 1.35;

// Product ID prefixes by category
export const CATEGORY_PREFIXES: Record<string, string> = {
  tacos: "TA",
  nachos: "NA",
  perros: "PE",
  chicanitas: "CH",
  crispetas: "CR",
  helados: "HE",
  milkshakes: "MS",
  bebidas: "BE",
  "tex-mex": "TX",
  postres: "PO",
  toppings: "TO",
};

// Categories with display info
export const CATEGORIES = [
  { slug: "tacos", nombre: "Tacos", orden: 1 },
  { slug: "nachos", nombre: "Nachos", orden: 2 },
  { slug: "perros", nombre: "Perros", orden: 3 },
  { slug: "chicanitas", nombre: "Chicanitas", orden: 4 },
  { slug: "crispetas", nombre: "Crispetas", orden: 5 },
  { slug: "helados", nombre: "Helados", orden: 6 },
  { slug: "milkshakes", nombre: "Milkshakes", orden: 7 },
  { slug: "bebidas", nombre: "Bebidas", orden: 8 },
  { slug: "tex-mex", nombre: "Tex-Mex", orden: 9 },
  { slug: "postres", nombre: "Postres", orden: 10 },
  { slug: "toppings", nombre: "Toppings", orden: 11 },
] as const;

// Checklist items definition
export const CHECKLIST_ITEMS = [
  {
    key: "checklist_precio_delivery" as const,
    label: "Precio delivery",
    description: "Tiene precio de delivery asignado",
  },
  {
    key: "checklist_descripcion_delivery" as const,
    label: "Descripcion delivery",
    description: "Tiene descripcion para plataformas de delivery",
  },
  {
    key: "checklist_foto_principal" as const,
    label: "Foto principal",
    description: "Tiene foto principal subida",
  },
] as const;

// Protected fields that cannot be modified via PATCH
export const PROTECTED_FIELDS = ["id", "created_at"] as const;

// Image config
export const IMAGE_CONFIG = {
  maxSize: 1024, // px
  format: "png" as const,
  maxFileSize: 5 * 1024 * 1024, // 5MB
};

// Pagination
export const PAGE_SIZE = 20;
export const FUDO_PAGE_SIZE = 500;
